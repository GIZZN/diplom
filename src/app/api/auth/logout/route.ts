import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { revokeUserRefreshTokens } from "@/lib/refresh";
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

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  const token = getJwt(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      try {
        // Kill JWT sessions (via iat check in /api/auth/me) AND every refresh family.
        await pool.query(
          "UPDATE users SET token_revoked_before = NOW() WHERE id = $1",
          [payload.userId]
        );
        await revokeUserRefreshTokens(payload.userId);
      } catch (err) {
        console.error("Logout revocation error:", err);
      }
    }
  }

  const response = NextResponse.json({ ok: true }, { headers: cors });
  response.cookies.set("token", "", { maxAge: 0, path: "/" });
  return response;
}
