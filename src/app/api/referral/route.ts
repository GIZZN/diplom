import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { REFERRAL_BONUS_DAYS, getReferralStats } from "@/lib/referral";

function getJwt(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const jwt = getJwt(req);
  const payload = jwt ? verifyToken(jwt) : null;
  if (!payload) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  try {
    const stats = await getReferralStats(payload.userId);
    return NextResponse.json({ ...stats, bonusDays: REFERRAL_BONUS_DAYS });
  } catch (err) {
    console.error("referral stats error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
