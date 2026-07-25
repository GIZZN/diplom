import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

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

  const days = Math.min(Number(req.nextUrl.searchParams.get("days") ?? 14) || 14, 90);

  try {
    const [funnel, byDay, totals, referrals] = await Promise.all([
      // Воронка по источникам: клик → скачивание → регистрация → оплата.
      // Платящие считаются от signup_source, т.к. оплата может быть позже cookie.
      pool.query(
        `WITH ev AS (
           SELECT source, event, visitor
           FROM traffic_events
           WHERE created_at > NOW() - ($1 || ' days')::interval
         )
         SELECT
           COALESCE(ev.source, 'direct')                                   AS source,
           COUNT(DISTINCT ev.visitor) FILTER (WHERE event = 'visit')::int   AS visits,
           COUNT(DISTINCT ev.visitor) FILTER (WHERE event = 'download')::int AS downloads,
           COUNT(*) FILTER (WHERE event = 'signup')::int                    AS signups
         FROM ev
         GROUP BY 1
         ORDER BY visits DESC
         LIMIT 20`,
        [days],
      ),

      pool.query(
        `SELECT TO_CHAR(created_at::date, 'DD.MM')                 AS date,
                COUNT(*) FILTER (WHERE event = 'visit')::int       AS visits,
                COUNT(*) FILTER (WHERE event = 'download')::int    AS downloads,
                COUNT(*) FILTER (WHERE event = 'signup')::int      AS signups
         FROM traffic_events
         WHERE created_at > NOW() - ($1 || ' days')::interval
         GROUP BY created_at::date
         ORDER BY created_at::date`,
        [days],
      ),

      pool.query(
        `SELECT
           COUNT(DISTINCT visitor) FILTER (WHERE event = 'visit')::int    AS visits,
           COUNT(DISTINCT visitor) FILTER (WHERE event = 'download')::int AS downloads,
           COUNT(*) FILTER (WHERE event = 'signup')::int                  AS signups
         FROM traffic_events
         WHERE created_at > NOW() - ($1 || ' days')::interval`,
        [days],
      ),

      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_7d
         FROM referral_rewards`,
      ),
    ]);

    // Платящие в разрезе источника — берём из users, а не из событий.
    const paying = await pool.query(
      `SELECT COALESCE(signup_source, 'direct') AS source, COUNT(*)::int AS paying
       FROM users
       WHERE plan = 'pro'
       GROUP BY 1`,
    );
    const payingBySource = new Map<string, number>(
      paying.rows.map((r) => [r.source as string, r.paying as number]),
    );

    return NextResponse.json({
      days,
      totals: totals.rows[0],
      byDay: byDay.rows,
      referrals: referrals.rows[0],
      sources: funnel.rows.map((r) => ({
        ...r,
        paying: payingBySource.get(r.source) ?? 0,
      })),
    });
  } catch (err) {
    console.error("traffic stats error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
