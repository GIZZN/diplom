import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getCorsHeaders } from "@/lib/cors";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

const PLANS = {
  test:     { label: "Тест",           description: "Тестовый платёж (1 звезда)",             amount: 1 },
  monthly:  { label: "Pro — 30 дней",  description: "Pro-подписка на 30 дней",                amount: 500 },
  lifetime: { label: "Pro — навсегда", description: "Пожизненный доступ к Pro-тарифу",        amount: 2000 },
} as const;

type PlanKey = keyof typeof PLANS;

function getJwt(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies.get("token")?.value ?? null;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  const jwt = getJwt(req);
  if (!jwt) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });

  const payload = verifyToken(jwt);
  if (!payload) return NextResponse.json({ error: "Не авторизован" }, { status: 401, headers: cors });

  let plan: PlanKey;
  try {
    const body = await req.json();
    plan = body.plan as PlanKey;
  } catch {
    return NextResponse.json({ error: "Неверный запрос" }, { status: 400, headers: cors });
  }

  if (!PLANS[plan]) {
    return NextResponse.json({ error: "Неизвестный тариф" }, { status: 400, headers: cors });
  }

  const p = PLANS[plan];

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "interview.ai — Pro",
        description: p.description,
        payload: `${payload.userId}:${plan}`,
        currency: "XTR",
        prices: [{ label: p.label, amount: p.amount }],
      }),
    });

    const tgData = await tgRes.json() as { ok: boolean; result?: string; description?: string };

    if (!tgData.ok) {
      console.error("Telegram createInvoiceLink error:", tgData.description);
      return NextResponse.json({ error: "Ошибка создания инвойса" }, { status: 502, headers: cors });
    }

    return NextResponse.json({ url: tgData.result }, { headers: cors });
  } catch (err) {
    console.error("create-invoice error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500, headers: cors });
  }
}
