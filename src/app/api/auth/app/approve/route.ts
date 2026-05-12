// Called by web UI when logged-in user clicks "Подтвердить"
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const webToken = req.cookies.get("token")?.value;
  if (!webToken) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const payload = verifyToken(webToken);
  if (!payload) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Токен не передан" }, { status: 400 });

  const result = await pool.query(
    `UPDATE app_tokens
     SET status = 'approved', user_id = $1
     WHERE token = $2
       AND status = 'pending'
       AND expires_at > NOW()
     RETURNING token`,
    [payload.userId, token]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Токен недействителен или истёк" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
