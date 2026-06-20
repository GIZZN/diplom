import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getClientIp, logAdminAction } from "@/lib/admin-auth";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("token")?.value;
  if (!token) return false;
  const payload = verifyToken(token);
  if (!payload) return false;
  const result = await pool.query("SELECT role FROM users WHERE id = $1", [payload.userId]);
  return result.rows[0]?.role === "admin";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const ip = getClientIp(req);
  await logAdminAction("view_stats", ip);

  const [tgTx, dbPayments, userStats] = await Promise.all([
    BOT_TOKEN
      ? fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getStarTransactions`)
          .then((r) => r.json())
          .catch(() => null)
      : Promise.resolve(null),

    pool
      .query(
        `SELECT p.id, p.user_id, p.telegram_charge_id, p.stars_amount, p.plan_type, p.created_at,
                u.email, u.name
         FROM payments p
         LEFT JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC
         LIMIT 100`
      )
      .catch(() => ({ rows: [] })),

    pool
      .query(
        `SELECT
           COUNT(*)::int AS total_users,
           COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro_users,
           COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_last_7d
         FROM users`
      )
      .catch(() => ({ rows: [{ total_users: 0, pro_users: 0, new_last_7d: 0 }] })),
  ]);

  const transactions: { id: string; date: number; amount: number }[] =
    tgTx?.ok ? tgTx.result.transactions : [];
  const starsBalance = transactions.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0);

  return NextResponse.json({
    stars: { balance: starsBalance, transactions },
    payments: dbPayments.rows,
    users: userStats.rows[0],
  });
}
