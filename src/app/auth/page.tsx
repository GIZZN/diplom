import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AuthForm from "./AuthForm";

function safeRedirect(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "/dashboard";
  // Only allow internal absolute paths (no protocol, no //)
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Сессия устарела, попробуйте ещё раз",
  google_failed: "Не удалось войти через Google",
  email_failed: "Не удалось отправить код на почту",
  server_error: "Ошибка сервера, попробуйте позже",
  email_not_configured: "Отправка email не настроена",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; step?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = safeRedirect(sp.redirect);
  const initialStep = sp.step === "otp" ? "otp" : "form";
  const authError = sp.error ? (ERROR_MESSAGES[sp.error] ?? "Ошибка входа") : "";

  const token = (await cookies()).get("token")?.value;
  if (token && verifyToken(token)) {
    redirect(next);
  }

  return <AuthForm redirectTo={next} initialStep={initialStep as "form" | "otp"} authError={authError} />;
}
