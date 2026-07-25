import { NextRequest, NextResponse } from "next/server";
import {
  ATTRIBUTION_COOKIE,
  getVisitorId,
  logEvent,
  persistAttribution,
  readAttribution,
} from "@/lib/attribution";

const FILES: Record<string, string> = {
  setup: "/Interview Assistant_0.1.0_x64-setup.exe",
  portable: "/IntrviwAssistant.exe",
};

export async function GET(req: NextRequest) {
  const variant = req.nextUrl.searchParams.get("f") ?? "setup";
  const file = FILES[variant];
  if (!file) {
    return NextResponse.json({ error: "Неизвестный файл" }, { status: 404 });
  }

  const visitor = getVisitorId(req);
  const attribution = readAttribution(req);

  await logEvent({
    event: "download",
    attribution,
    variant,
    visitor,
    referrer: req.headers.get("referer"),
  });

  const res = NextResponse.redirect(new URL(file, req.nextUrl.origin));
  persistAttribution(res, visitor, attribution, Boolean(req.cookies.get(ATTRIBUTION_COOKIE)));
  return res;
}
