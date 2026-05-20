import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ user: null });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, a.avatar, u.created_at
     FROM users u
     LEFT JOIN user_avatars a ON a.user_id = u.id
     WHERE u.id = $1`,
    [payload.userId]
  );

  if (result.rows.length === 0) return NextResponse.json({ user: null });

  return NextResponse.json({ user: result.rows[0] });
}
