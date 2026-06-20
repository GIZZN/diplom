import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// One-time endpoint to fix a payment that was processed but DB update failed.
// Delete this file after use.
const ADMIN_SECRET = process.env.ADMIN_FIX_SECRET;

export async function POST(req: NextRequest) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: "Not configured" }, { status: 404 });

  const { secret, user_id, plan } = await req.json();
  if (secret !== ADMIN_SECRET) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user_id || !plan) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  if (plan === "lifetime") {
    await pool.query("UPDATE users SET plan = 'pro', pro_expires_at = NULL WHERE id = $1", [user_id]);
  } else {
    await pool.query(
      `UPDATE users SET plan = 'pro',
        pro_expires_at = GREATEST(COALESCE(pro_expires_at, NOW()), NOW()) + INTERVAL '30 days'
       WHERE id = $1`,
      [user_id]
    );
  }

  const result = await pool.query("SELECT id, email, plan, pro_expires_at FROM users WHERE id = $1", [user_id]);
  return NextResponse.json({ ok: true, user: result.rows[0] });
}
