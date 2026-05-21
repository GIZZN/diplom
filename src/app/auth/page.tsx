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

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  const next = safeRedirect(sp.redirect);

  const token = (await cookies()).get("token")?.value;
  if (token && verifyToken(token)) {
    redirect(next);
  }

  return <AuthForm redirectTo={next} />;
}
