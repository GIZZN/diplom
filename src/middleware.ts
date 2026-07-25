import { NextRequest, NextResponse } from "next/server";

const ATTRIBUTION_COOKIE = "attr";
const VISITOR_COOKIE = "vid";
const REF_COOKIE = "ref";
const MAX_AGE = 60 * 60 * 24 * 30;

function clean(value: string | null, max = 60): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, max);
  return /^[\w.\-:/ ]+$/.test(trimmed) ? trimmed : undefined;
}

/**
 * Ставит cookie атрибуции при первом заходе. Работает в edge-runtime,
 * поэтому здесь только куки — запись в БД делает /api/track/visit.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const sp = req.nextUrl.searchParams;
  const secure = process.env.NODE_ENV === "production";

  if (!req.cookies.get(VISITOR_COOKIE)) {
    res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: MAX_AGE,
      path: "/",
    });
  }

  // Первый источник побеждает: перезапись поздним кликом стёрла бы канал привлечения.
  const source = clean(sp.get("utm_source"));
  if (source && !req.cookies.get(ATTRIBUTION_COOKIE)) {
    res.cookies.set(
      ATTRIBUTION_COOKIE,
      JSON.stringify({
        source,
        medium: clean(sp.get("utm_medium")),
        campaign: clean(sp.get("utm_campaign")),
      }),
      { httpOnly: true, sameSite: "lax", secure, maxAge: MAX_AGE, path: "/" },
    );
  }

  const ref = clean(sp.get("ref"), 12);
  if (ref && !req.cookies.get(REF_COOKIE)) {
    res.cookies.set(REF_COOKIE, ref, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: MAX_AGE,
      path: "/",
    });
  }

  return res;
}

export const config = {
  matcher: ["/", "/auth", "/checkout"],
};
