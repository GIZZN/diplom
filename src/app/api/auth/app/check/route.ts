import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { signToken } from "@/lib/auth";
import { issueRefreshToken, ACCESS_TOKEN_TTL } from "@/lib/refresh";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ status: "pending" }, { headers: CORS_HEADERS });
  }

  try {
    const result = await pool.query(
      "SELECT status, user_id, expires_at FROM app_tokens WHERE token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ status: "invalid" }, { status: 404, headers: CORS_HEADERS });
    }

    const row = result.rows[0];

    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ status: "expired" }, { status: 410, headers: CORS_HEADERS });
    }

    if (row.status === "pending") {
      return NextResponse.json({ status: "pending" }, { headers: CORS_HEADERS });
    }

    if (row.status === "approved") {
      const userResult = await pool.query(
        `SELECT u.id, u.email, u.name, a.avatar
         FROM users u
         LEFT JOIN user_avatars a ON a.user_id = u.id
         WHERE u.id = $1`,
        [row.user_id]
      );
      const user = userResult.rows[0];

      await pool.query(
        "UPDATE app_tokens SET status = 'used' WHERE token = $1",
        [token]
      );

      // Short-lived access JWT + opaque refresh token (sliding session).
      const jwt = signToken({ userId: user.id, email: user.email }, ACCESS_TOKEN_TTL);
      const refresh_token = await issueRefreshToken(user.id);
      return NextResponse.json(
        { status: "approved", jwt, refresh_token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } },
        { headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ status: row.status }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("App check error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500, headers: CORS_HEADERS });
  }
}
