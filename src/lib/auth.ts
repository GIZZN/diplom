import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const JWT_EXPIRES = "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
  } catch {
    return null;
  }
}

// Short-lived token for the "Google verified, awaiting email OTP" gap (admin-role accounts only).
export function signPendingToken(userId: number, otpId: number): string {
  return jwt.sign({ userId, otpId, pending: true }, JWT_SECRET, { expiresIn: "5m" });
}

export function verifyPendingToken(token: string): { userId: number; otpId: number } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: number; otpId?: number; pending?: boolean };
    if (!payload.pending || typeof payload.userId !== "number" || typeof payload.otpId !== "number") return null;
    return { userId: payload.userId, otpId: payload.otpId };
  } catch {
    return null;
  }
}
