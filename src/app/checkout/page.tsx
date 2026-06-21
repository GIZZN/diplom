import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import CheckoutClient, { type CheckoutPlan } from "./CheckoutClient";

const PLANS: Record<"monthly" | "lifetime", CheckoutPlan> = {
  monthly: {
    id: "monthly",
    title: "Pro — 30 дней",
    description: "Доступ ко всем возможностям Pro на 30 дней",
    price: 500,
    kicker: "Подписка interview.ai Pro",
    period: "за 30 дней · продление вручную",
    features: [
      "Безлимитные сессии",
      "GPT-4 / Claude Opus",
      "Режим скрытности",
      "Аналитика и прогресс",
      "Приоритетная поддержка",
    ],
  },
  lifetime: {
    id: "lifetime",
    title: "Pro — навсегда",
    description: "Разовый платёж — пожизненный доступ к Pro",
    price: 2000,
    kicker: "interview.ai Pro · Lifetime",
    period: "разовый платёж · без продлений",
    features: [
      "Всё из подписки Pro",
      "Доступ навсегда без продлений",
      "Безлимитные сессии",
      "GPT-4 / Claude Opus",
      "Приоритетная поддержка",
    ],
  },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const sp = await searchParams;
  const planKey = sp.plan === "lifetime" ? "lifetime" : sp.plan === "monthly" ? "monthly" : null;
  if (!planKey) redirect("/#pricing");

  const token = (await cookies()).get("token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    redirect(`/auth?redirect=${encodeURIComponent(`/checkout?plan=${planKey}`)}`);
  }

  return <CheckoutClient plan={PLANS[planKey]} email={payload.email} />;
}