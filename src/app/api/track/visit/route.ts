import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getVisitorId, logEvent, readAttribution } from "@/lib/attribution";

/** Дедуп: один визит на посетителя в сутки, иначе перезагрузки раздувают цифры. */
export async function POST(req: NextRequest) {
  const visitor = getVisitorId(req);
  const attribution = readAttribution(req);

  try {
    const recent = await pool.query(
      `SELECT 1 FROM traffic_events
       WHERE event = 'visit' AND visitor = $1 AND created_at > NOW() - INTERVAL '1 day'
       LIMIT 1`,
      [visitor],
    );
    if (recent.rows.length > 0) {
      return NextResponse.json({ ok: true, skipped: true });
    }
  } catch {
    return NextResponse.json({ ok: true });
  }

  await logEvent({
    event: "visit",
    attribution,
    visitor,
    referrer: req.headers.get("referer"),
  });

  return NextResponse.json({ ok: true });
}
