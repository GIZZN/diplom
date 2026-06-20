import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyPendingToken, signToken } from "@/lib/auth";
import { verifyOtp, getClientIp, logAdminAction } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const pendingToken = req.cookies.get("auth_pending")?.value ?? "";
  const pending = verifyPendingToken(pendingToken);
  if (!pending) {
    return NextResponse.json({ error: "Сессия истекла, войдите снова через Google" }, { status: 401 });
  }

  let code: string;
  try {
    const body = await req.json();
    code = (body.code ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const valid = await verifyOtp(pending.otpId, code);
  if (!valid) {
    await logAdminAction("admin_otp_failed", ip, { userId: pending.userId });
    return NextResponse.json({ error: "Неверный или истёкший код" }, { status: 401 });
  }

  const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [pending.userId]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const user = result.rows[0];
  await logAdminAction("admin_otp_verified", ip, { userId: user.id, email: user.email });

  const token = signToken({ userId: user.id, email: user.email });
  const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  response.cookies.set("auth_pending", "", { maxAge: 0, path: "/" });
  return response;
}
