import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

function getJwt(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("token")?.value ?? null;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  const token = getJwt(req);
  if (!token) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });
  }

  const payload = verifyToken(token) as ({ userId: number; email: string; iat?: number } | null);
  if (!payload) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });
  }

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.plan, u.pro_expires_at, u.token_revoked_before,
            a.avatar, u.created_at
     FROM users u
     LEFT JOIN user_avatars a ON a.user_id = u.id
     WHERE u.id = $1`,
    [payload.userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });
  }

  const user = result.rows[0];

  if (user.token_revoked_before && payload.iat) {
    const revokedAtSec = new Date(user.token_revoked_before).getTime() / 1000;
    if (payload.iat < revokedAtSec) {
      return NextResponse.json({ error: "Сессия истекла" }, { status: 401, headers: cors });
    }
  }

  // Lazy downgrade: if monthly pro has expired, reset to free
  let plan: string = user.plan;
  let proExpiresAt: string | null = user.pro_expires_at ?? null;

  if (plan === "pro" && proExpiresAt && new Date(proExpiresAt) < new Date()) {
    plan = "free";
    proExpiresAt = null;
    pool.query("UPDATE users SET plan = 'free', pro_expires_at = NULL WHERE id = $1", [user.id]).catch(console.error);
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar ?? null,
        created_at: user.created_at,
        plan,
        pro_expires_at: proExpiresAt,
      },
    },
    { headers: cors }
  );
}
