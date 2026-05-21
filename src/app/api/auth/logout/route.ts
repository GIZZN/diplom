import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  const response = NextResponse.json({ ok: true }, { headers: cors });
  response.cookies.set("token", "", { maxAge: 0, path: "/" });
  return response;
}
