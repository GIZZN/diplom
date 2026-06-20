import { NextRequest, NextResponse } from "next/server";
import { getClientIp, logAdminAction } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  await logAdminAction("logout", getClientIp(req));
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", "", { maxAge: 0, path: "/" });
  return response;
}
