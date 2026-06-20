import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import pool from "./db";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";
const ADMIN_SESSION_EXPIRES = "1h";
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

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
