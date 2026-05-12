// Desktop app polls this until it gets a JWT
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ status: "pending" });

  const result = await pool.query(
    `SELECT status, user_id, expires_at FROM app_tokens WHERE token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ status: "invalid" }, { status: 404 });
  }

  const row = result.rows[0];

  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ status: "expired" }, { status: 410 });
  }

  if (row.status === "pending") {
    return NextResponse.json({ status: "pending" });
  }

  if (row.status === "approved") {
    // Fetch user info
    const userResult = await pool.query(
      "SELECT id, email, name FROM users WHERE id = $1",
      [row.user_id]
    );
    const user = userResult.rows[0];

    // Mark token as used so it can't be polled again
    await pool.query("UPDATE app_tokens SET status = 'used' WHERE token = $1", [token]);

    const jwt = signToken({ userId: user.id, email: user.email });
    return NextResponse.json({ status: "approved", jwt, user: { id: user.id, name: user.name, email: user.email } });
  }

  return NextResponse.json({ status: row.status });
}
