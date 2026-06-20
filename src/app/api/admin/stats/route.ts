import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_FIX_SECRET;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [tgTx, dbPayments, userStats] = await Promise.all([
    // Stars transactions from Telegram
    BOT_TOKEN
      ? fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getStarTransactions`)
          .then((r) => r.json())
          .catch(() => null)
      : Promise.resolve(null),

    // Payments from DB
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

    // User stats
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
    (sum: number, tx: { amount: number; nanostar_amount?: number }) =>
      sum + tx.amount,
    0
  );

  return NextResponse.json({
    stars: {
      balance: starsBalance,
      transactions,
    },
    payments: dbPayments.rows,
    users: userStats.rows[0],
  });
}
