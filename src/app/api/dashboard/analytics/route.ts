import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

function getJwt(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  const jwt = getJwt(req);
  if (!jwt) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });
  const payload = verifyToken(jwt);
  if (!payload) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });

  const uid = payload.userId;

  try {
    const [totals, byType, byDay, topModels] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int                                                              AS total,
           COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE)::int             AS today,
           AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL)::int   AS avg_ms,
           COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int      AS last_7d
         FROM desktop_sessions WHERE user_id = $1`,
        [uid]
      ),
      pool.query(
        `SELECT type, COUNT(*)::int AS count
         FROM desktop_sessions WHERE user_id = $1
         GROUP BY type ORDER BY count DESC`,
        [uid]
      ),
      pool.query(
        `SELECT TO_CHAR(created_at::date, 'DD.MM') AS date, COUNT(*)::int AS count
         FROM desktop_sessions
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '14 days'
         GROUP BY created_at::date
         ORDER BY created_at::date`,
        [uid]
      ),
      pool.query(
        `SELECT model, COUNT(*)::int AS count
         FROM desktop_sessions WHERE user_id = $1 AND model IS NOT NULL
         GROUP BY model ORDER BY count DESC LIMIT 5`,
        [uid]
      ),
    ]);

    return NextResponse.json({
      total:    totals.rows[0].total,
      today:    totals.rows[0].today,
      avg_ms:   totals.rows[0].avg_ms,
      last_7d:  totals.rows[0].last_7d,
      by_type:  byType.rows,
      by_day:   byDay.rows,
      top_models: topModels.rows,
    }, { headers: cors });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500, headers: cors });
  }
}