import jwt from "jsonwebtoken";
import crypto from "crypto";
import { NextRequest } from "next/server";
import pool from "./db";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";
const ADMIN_SESSION_EXPIRES = "1h";
const ADMIN_PENDING_EXPIRES = "5m";
const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ─── Full admin session (post-2FA) ─────────────────────────────────────────

export function signAdminSession(): string {
  if (!ADMIN_JWT_SECRET) throw new Error("ADMIN_JWT_SECRET not configured");
  return jwt.sign({ role: "admin" }, ADMIN_JWT_SECRET, { expiresIn: ADMIN_SESSION_EXPIRES });
}

export function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token || !ADMIN_JWT_SECRET) return false;
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET) as { role?: string };
    return payload.role === "admin";
  } catch {
    return false;
  }
}

// ─── Pending session (Google verified, awaiting OTP) ───────────────────────

export function signAdminPending(otpId: number): string {
  if (!ADMIN_JWT_SECRET) throw new Error("ADMIN_JWT_SECRET not configured");
  return jwt.sign({ role: "admin_pending", otpId }, ADMIN_JWT_SECRET, { expiresIn: ADMIN_PENDING_EXPIRES });
}

export function verifyAdminPending(token: string | undefined | null): { otpId: number } | null {
  if (!token || !ADMIN_JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET) as { role?: string; otpId?: number };
    if (payload.role !== "admin_pending" || typeof payload.otpId !== "number") return null;
    return { otpId: payload.otpId };
  } catch {
    return null;
  }
}

// ─── OTP codes ───────────────────────────────────────────────────────────────

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function createOtp(code: string): Promise<number> {
  const result = await pool.query(
    `INSERT INTO admin_otp_codes (code_hash, expires_at)
     VALUES ($1, NOW() + INTERVAL '${OTP_TTL_MINUTES} minutes')
     RETURNING id`,
    [hashCode(code)]
  );
  return result.rows[0].id;
}

export async function verifyOtp(otpId: number, code: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT code_hash, used, attempts, expires_at FROM admin_otp_codes WHERE id = $1`,
    [otpId]
  );
  if (result.rows.length === 0) return false;

  const row = result.rows[0];
  if (row.used || row.attempts >= MAX_OTP_ATTEMPTS || new Date(row.expires_at) < new Date()) {
    return false;
  }

  await pool.query("UPDATE admin_otp_codes SET attempts = attempts + 1 WHERE id = $1", [otpId]);

  const valid = row.code_hash === hashCode(code);
  if (valid) {
    await pool.query("UPDATE admin_otp_codes SET used = true WHERE id = $1", [otpId]);
  }
  return valid;
}

// ─── Rate limiting & audit log ───────────────────────────────────────────────

export async function isRateLimited(ip: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS attempts FROM admin_login_attempts
     WHERE ip = $1 AND success = false AND created_at > NOW() - INTERVAL '${WINDOW_MINUTES} minutes'`,
    [ip]
  );
  return result.rows[0].attempts >= MAX_ATTEMPTS;
}

export async function recordLoginAttempt(ip: string, success: boolean): Promise<void> {
  await pool.query("INSERT INTO admin_login_attempts (ip, success) VALUES ($1, $2)", [ip, success]);
}

export async function logAdminAction(action: string, ip: string, details?: Record<string, unknown>): Promise<void> {
  await pool.query(
    "INSERT INTO admin_audit_log (action, ip, details) VALUES ($1, $2, $3)",
    [action, ip, details ? JSON.stringify(details) : null]
  ).catch((err) => console.error("Failed to write admin audit log:", err));
}
