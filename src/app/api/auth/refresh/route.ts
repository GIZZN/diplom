import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { signToken } from "@/lib/auth";
import { rotateRefreshToken, ACCESS_TOKEN_TTL } from "@/lib/refresh";
import { getCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  let refreshToken: string | undefined;
  try {
    const body = await req.json();
    refreshToken = typeof body?.refresh_token === "string" ? body.refresh_token : undefined;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400, headers: cors });
  }

  if (!refreshToken) {
    return NextResponse.json({ error: "refresh_token обязателен" }, { status: 400, headers: cors });
  }

  let result;
  try {
    result = await rotateRefreshToken(refreshToken);
  } catch (err) {
    console.error("Refresh rotate error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500, headers: cors });
  }

  // Any failure (dead / expired / revoked / reuse) → 401, client re-pairs through web.
  if (!result.ok) {
    return NextResponse.json({ error: "Сессия недействительна", reason: result.reason }, { status: 401, headers: cors });
  }

  // Confirm the user still exists before minting a new access token.
  const userRes = await pool.query("SELECT id, email FROM users WHERE id = $1", [result.userId]);
  if (userRes.rows.length === 0) {
    return NextResponse.json({ error: "Сессия недействительна" }, { status: 401, headers: cors });
  }
  const user = userRes.rows[0];

  const jwt = signToken({ userId: user.id, email: user.email }, ACCESS_TOKEN_TTL);
  return NextResponse.json({ jwt, refresh_token: result.refreshToken }, { headers: cors });
}
