import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getClientIp, logAdminAction } from "@/lib/admin-auth";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

interface TgTransaction {
  id: string;
  date: number;
  amount: number;
  source?: {
    user?: { username?: string; first_name?: string };
    invoice_payload?: string;
  };
}

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

  const [tgRes, dbChargeRows, userStatsRow] = await Promise.all([
    BOT_TOKEN
      ? fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getStarTransactions`)
          .then((r) => r.json())
          .catch(() => null)
      : Promise.resolve(null),

    pool.query("SELECT telegram_charge_id FROM payments").then((r) => r.rows).catch(() => []),

    pool
      .query(
        `SELECT
           COUNT(*)::int AS total_users,
           COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro_users,
           COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_last_7d
         FROM users`
      )
      .then((r) => r.rows[0])
      .catch(() => ({ total_users: 0, pro_users: 0, new_last_7d: 0 })),
  ]);

  const tgTransactions: TgTransaction[] = tgRes?.ok ? tgRes.result.transactions : [];
  const starsBalance = tgTransactions.reduce((sum, t) => sum + t.amount, 0);

  const recordedChargeIds = new Set(
    (dbChargeRows as { telegram_charge_id: string }[]).map((r) => r.telegram_charge_id)
  );

  // Resolve the website account each transaction activated, via invoice_payload "userId:planType"
  const userIds = Array.from(
    new Set(
      tgTransactions
        .map((t) => Number(t.source?.invoice_payload?.split(":")[0]))
        .filter((n) => Number.isInteger(n))
    )
  );

  let usersById = new Map<number, { id: number; name: string; email: string }>();
  if (userIds.length > 0) {
    const result = await pool.query("SELECT id, name, email FROM users WHERE id = ANY($1)", [userIds]);
    usersById = new Map(result.rows.map((u) => [u.id, u]));
  }

  const transactions = tgTransactions
    .slice()
    .sort((a, b) => b.date - a.date)
    .map((t) => {
      const [userIdStr, planType] = (t.source?.invoice_payload ?? "").split(":");
      const userId = Number(userIdStr);
      return {
        id: t.id,
        date: t.date,
        amount: t.amount,
        planType: planType ?? null,
        payer: t.source?.user?.username
          ? `@${t.source.user.username}`
          : t.source?.user?.first_name ?? "—",
        account: usersById.get(userId) ?? null,
        recorded: recordedChargeIds.has(t.id),
      };
    });

  return NextResponse.json({
    stars: { balance: starsBalance },
    transactions,
    users: userStatsRow,
  });
}
