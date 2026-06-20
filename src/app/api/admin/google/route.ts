import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";
import {
  getClientIp,
  isRateLimited,
  recordLoginAttempt,
  generateOtpCode,
  createOtp,
  signAdminPending,
  logAdminAction,
} from "@/lib/admin-auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (await isRateLimited(ip)) {
    await logAdminAction("google_rate_limited", ip);
    return NextResponse.json({ error: "Слишком много попыток. Подождите 15 минут." }, { status: 429 });
  }

  if (!GOOGLE_CLIENT_ID || !ADMIN_EMAIL || !resend) {
    return NextResponse.json({ error: "Админ-панель не настроена" }, { status: 503 });
  }

  let credential: string;
  try {
    const body = await req.json();
    credential = body.credential ?? "";
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  let email: string | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    email = payload?.email?.toLowerCase();
    if (!payload?.email_verified || !email) throw new Error("Email not verified");
  } catch (err) {
    console.error("Google token verification failed:", err);
    await recordLoginAttempt(ip, false);
    await logAdminAction("google_invalid_token", ip);
    return NextResponse.json({ error: "Не удалось проверить аккаунт Google" }, { status: 401 });
  }

  if (email !== ADMIN_EMAIL) {
    await recordLoginAttempt(ip, false);
    await logAdminAction("google_wrong_email", ip, { email });
    return NextResponse.json({ error: "Этот Google-аккаунт не имеет доступа" }, { status: 403 });
  }

  await recordLoginAttempt(ip, true);
  await logAdminAction("google_verified", ip, { email });

  const code = generateOtpCode();
  const otpId = await createOtp(code);

  try {
    await resend.emails.send({
      from: "Admin Panel <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `Код входа в админ-панель: ${code}`,
      text: `Твой код подтверждения: ${code}\n\nДействует 5 минут. Если это не ты — игнорируй письмо.`,
    });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return NextResponse.json({ error: "Не удалось отправить код на почту" }, { status: 502 });
  }

  await logAdminAction("otp_sent", ip, { email });

  const pendingToken = signAdminPending(otpId);
  const response = NextResponse.json({ ok: true, step: "otp" });
  response.cookies.set("admin_pending", pendingToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 5 * 60,
  });
  return response;
}
