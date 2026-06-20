import { NextRequest, NextResponse } from "next/server";
import { getClientIp, verifyAdminPending, verifyOtp, signAdminSession, logAdminAction } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const pendingToken = req.cookies.get("admin_pending")?.value;
  const pending = verifyAdminPending(pendingToken);
  if (!pending) {
    return NextResponse.json({ error: "Сессия истекла, начните заново" }, { status: 401 });
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
    await logAdminAction("otp_failed", ip);
    return NextResponse.json({ error: "Неверный или истёкший код" }, { status: 401 });
  }

  await logAdminAction("otp_verified", ip);

  const sessionToken = signAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });
  response.cookies.set("admin_pending", "", { maxAge: 0, path: "/" });
  return response;
}
