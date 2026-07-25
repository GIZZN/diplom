import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "./db";

export const VISITOR_COOKIE = "vid";
export const ATTRIBUTION_COOKIE = "attr";
export const REF_COOKIE = "ref";

const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 30;

export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
}

/** UTM-значения приходят из URL — обрезаем и чистим, прежде чем писать в БД. */
function clean(value: string | null, max = 60): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, max);
  return /^[\w.\-:/ ]+$/.test(trimmed) ? trimmed : undefined;
}

export function readAttribution(req: NextRequest): Attribution {
  const url = req.nextUrl;
  const fromUrl: Attribution = {
    source: clean(url.searchParams.get("utm_source")),
    medium: clean(url.searchParams.get("utm_medium")),
    campaign: clean(url.searchParams.get("utm_campaign")),
  };
  if (fromUrl.source) return fromUrl;

  const stored = req.cookies.get(ATTRIBUTION_COOKIE)?.value;
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    return {
      source: clean(parsed.source ?? null),
      medium: clean(parsed.medium ?? null),
      campaign: clean(parsed.campaign ?? null),
    };
  } catch {
    return {};
  }
}

export function getVisitorId(req: NextRequest): string {
  return req.cookies.get(VISITOR_COOKIE)?.value ?? crypto.randomUUID().slice(0, 36);
}

/** Первый источник побеждает — переписывать его поздними кликами нельзя, иначе теряется канал привлечения. */
export function persistAttribution(
  res: NextResponse,
  visitor: string,
  attribution: Attribution,
  alreadyStored: boolean,
) {
  res.cookies.set(VISITOR_COOKIE, visitor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ATTRIBUTION_MAX_AGE,
    path: "/",
  });

  if (!alreadyStored && attribution.source) {
    res.cookies.set(ATTRIBUTION_COOKIE, JSON.stringify(attribution), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ATTRIBUTION_MAX_AGE,
      path: "/",
    });
  }
}

export async function logEvent(params: {
  event: "visit" | "download" | "signup";
  attribution?: Attribution;
  variant?: string;
  visitor?: string;
  userId?: number;
  referrer?: string | null;
}) {
  try {
    await pool.query(
      `INSERT INTO traffic_events (event, source, medium, campaign, variant, user_id, visitor, referrer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        params.event,
        params.attribution?.source ?? null,
        params.attribution?.medium ?? null,
        params.attribution?.campaign ?? null,
        params.variant ?? null,
        params.userId ?? null,
        params.visitor ?? null,
        params.referrer?.slice(0, 500) ?? null,
      ],
    );
  } catch (err) {
    // Аналитика не должна ронять пользовательский сценарий.
    console.error("traffic log error:", err);
  }
}
