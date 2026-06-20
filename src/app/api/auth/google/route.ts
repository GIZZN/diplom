import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import pool from "@/lib/db";
import { signToken } from "@/lib/auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
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
    let result = await pool.query("SELECT id, name, email FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      result = await pool.query(
        "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, NULL) RETURNING id, name, email",
        [name?.trim() || email.split("@")[0], email]
      );
    }

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Google login error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
