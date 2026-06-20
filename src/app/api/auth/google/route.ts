import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";
import pool from "@/lib/db";
import { signToken, signPendingToken } from "@/lib/auth";
import { generateOtpCode, createOtp, getClientIp, logAdminAction } from "@/lib/admin-auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google-вход не настроен" }, { status: 503 });
  }

  let credential: string;
  try {
    const body = await req.json();
    credential = body.credential ?? "";
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  }

  let email: string | undefined;
  let name: string | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    email = payload?.email?.toLowerCase();
    name = payload?.name;
    if (!payload?.email_verified || !email) throw new Error("Email not verified");
  } catch (err) {
    console.error("Google token verification failed:", err);
    return NextResponse.json({ error: "Не удалось проверить аккаунт Google" }, { status: 401 });
  }

  try {
    // Bootstrap admin role automatically for the designated admin email
    if (email === ADMIN_EMAIL) {
      let result = await pool.query("SELECT id, name, email, role FROM users WHERE email = $1", [email]);
      if (result.rows.length === 0) {
        result = await pool.query(
          "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, NULL, 'admin') RETURNING id, name, email, role",
          [name?.trim() || email.split("@")[0], email]
        );
      } else if (result.rows[0].role !== "admin") {
        await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [result.rows[0].id]);
        result.rows[0].role = "admin";
      }

      const user = result.rows[0];

      // Admin requires email OTP as second factor
      if (!resend) {
        return NextResponse.json({ error: "Email-подтверждение не настроено (RESEND_API_KEY)" }, { status: 503 });
      }

      const code = generateOtpCode();
      const otpId = await createOtp(user.id, code);

      try {
        await resend.emails.send({
          from: "interview.ai <onboarding@resend.dev>",
          to: email,
          subject: `Код входа в admin: ${code}`,
          text: `Твой код подтверждения: ${code}\n\nДействует 5 минут.`,
        });
      } catch (err) {
        console.error("Failed to send admin OTP:", err);
        return NextResponse.json({ error: "Не удалось отправить код на почту" }, { status: 502 });
      }

      await logAdminAction("admin_google_otp_sent", ip, { email });

      const pendingToken = signPendingToken(user.id, otpId);
      const response = NextResponse.json({ step: "otp", hint: `Код отправлен на ${email}` });
      response.cookies.set("auth_pending", pendingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 5 * 60,
      });
      return response;
    }

    // Regular user: find or create, issue session immediately
    let result = await pool.query("SELECT id, name, email, role FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      result = await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, NULL, 'user') RETURNING id, name, email, role",
        [name?.trim() || email.split("@")[0], email]
      );
    }

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Google auth error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
