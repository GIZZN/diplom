import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getClientIp, verifyAdminSession, logAdminAction } from "@/lib/admin-auth";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (!verifyAdminSession(session)) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
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

  const transactions: { id: string; date: number; amount: number; from?: string; payload?: string }[] =
    tgTx?.ok ? tgTx.result.transactions : [];

  const starsBalance = transactions.reduce(
    (sum: number, tx: { amount: number }) => sum + tx.amount,
    0
  );

  return NextResponse.json({
    stars: { balance: starsBalance, transactions },
    payments: dbPayments.rows,
    users: userStats.rows[0],
  });
}
