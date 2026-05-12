import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ user: null });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });

  const result = await pool.query(
    "SELECT id, name, email, avatar, created_at FROM users WHERE id = $1",
    [payload.userId]
  );

  if (result.rows.length === 0) return NextResponse.json({ user: null });

  return NextResponse.json({ user: result.rows[0] });
}
