import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getClientIp, isRateLimited, recordLoginAttempt, signAdminSession, logAdminAction } from "@/lib/admin-auth";

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (await isRateLimited(ip)) {
    await logAdminAction("login_rate_limited", ip);
    return NextResponse.json({ error: "Слишком много попыток. Подождите 15 минут." }, { status: 429 });
  }

  if (!ADMIN_PASSWORD_HASH) {
    return NextResponse.json({ error: "Админ-панель не настроена" }, { status: 503 });
  }

  let password: string;
  try {
    const body = await req.json();
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  await recordLoginAttempt(ip, valid);

  if (!valid) {
    await logAdminAction("login_failed", ip);
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  await logAdminAction("login_success", ip);

  const token = signAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60, // 1h, matches JWT expiry
  });
  return response;
}
