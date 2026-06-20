import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

const PLAN_STARS: Record<string, number> = {
  test: 1,
  monthly: 500,
  lifetime: 2000,
};

async function answerPreCheckoutQuery(id: string, ok: boolean, error?: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pre_checkout_query_id: id, ok, error_message: error }),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let update: Record<string, unknown>;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // pre_checkout_query (fiat only, not Stars)
  if (update.pre_checkout_query) {
    const pcq = update.pre_checkout_query as {
      id: string;
      invoice_payload: string;
      total_amount: number;
    };
    const [, planType] = pcq.invoice_payload.split(":");
    if (!planType || !(planType in PLAN_STARS)) {
      await answerPreCheckoutQuery(pcq.id, false, "Неверный инвойс");
    } else {
      await answerPreCheckoutQuery(pcq.id, true);
    }
    return NextResponse.json({ ok: true });
  }

  // successful_payment
  const message = update.message as Record<string, unknown> | undefined;
  if (message?.successful_payment) {
    const payment = message.successful_payment as {
      telegram_payment_charge_id: string;
      total_amount: number;
      invoice_payload: string;
    };

    const [userIdStr, planType] = payment.invoice_payload.split(":");
    const userId = parseInt(userIdStr, 10);

    if (!userId || !planType) {
      console.error("Webhook: invalid payload:", payment.invoice_payload);
      return NextResponse.json({ ok: true });
    }

    // Update plan first — this is critical
    try {
      if (planType === "lifetime") {
        await pool.query(
          "UPDATE users SET plan = 'pro', pro_expires_at = NULL WHERE id = $1",
          [userId]
        );
      } else {
        await pool.query(
          `UPDATE users
           SET plan = 'pro',
               pro_expires_at = GREATEST(COALESCE(pro_expires_at, NOW()), NOW()) + INTERVAL '30 days'
           WHERE id = $1`,
          [userId]
        );
      }
    } catch (err) {
      console.error("Webhook: failed to update user plan:", err);
    }

    // Record payment separately so a missing table doesn't block the plan update
    try {
      await pool.query(
        `INSERT INTO payments (user_id, telegram_charge_id, stars_amount, plan_type)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (telegram_charge_id) DO NOTHING`,
        [userId, payment.telegram_payment_charge_id, payment.total_amount, planType]
      );
    } catch (err) {
      console.error("Webhook: failed to record payment:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
