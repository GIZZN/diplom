import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { REF_COOKIE, getVisitorId, logEvent, readAttribution } from "@/lib/attribution";
import { applyReferral } from "@/lib/referral";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Пароль минимум 8 символов" }, { status: 400 });
    }

    // Check existing user
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email уже зарегистрирован" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const attribution = readAttribution(req);

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, signup_source) VALUES ($1, $2, $3, $4) RETURNING id, name, email, created_at",
      [name.trim(), email.toLowerCase().trim(), passwordHash, attribution.source ?? null]
    );

    const user = result.rows[0];

    const refCode = req.cookies.get(REF_COOKIE)?.value;
    if (refCode) await applyReferral(user.id, refCode);

    await logEvent({
      event: "signup",
      attribution,
      visitor: getVisitorId(req),
      userId: user.id,
      referrer: req.headers.get("referer"),
    });

    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
