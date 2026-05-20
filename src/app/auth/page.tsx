import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AuthForm from "./AuthForm";

export default async function AuthPage() {
  const token = (await cookies()).get("token")?.value;
  if (token && verifyToken(token)) {
    redirect("/dashboard");
  }

  return <AuthForm />;
}
