"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

type Mode = "login" | "register";

interface AuthFormProps {
  redirectTo?: string;
  initialStep?: "form" | "otp";
  authError?: string;
}

export default function AuthForm({ redirectTo = "/dashboard", initialStep = "form", authError = "" }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<"form" | "otp">(initialStep);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(authError);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login"
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Что-то пошло не так"); return; }
      router.push(redirectTo);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Неверный код"); return; }
      router.push(redirectTo);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <Logo />
            <span className={styles.logoText}>interview.ai</span>
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Подтверждение
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            Код отправлен на вашу почту
          </p>
          <div className={styles.field} style={{ width: "100%" }}>
            <label className={styles.label}>Код из письма</label>
            <input
              className={styles.input}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && otpCode.length === 6 && handleVerifyOtp()}
              autoFocus
              style={{ textAlign: "center", fontSize: 22, letterSpacing: "0.3em" }}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button
            className={styles.submitBtn}
            onClick={handleVerifyOtp}
            disabled={loading || otpCode.length < 6}
          >
            {loading ? "Проверка…" : "Войти"}
          </button>
          <button
            className={styles.switchBtn}
            style={{ marginTop: 14 }}
            onClick={() => { setStep("form"); setError(""); setOtpCode(""); }}
          >
            ← Назад
          </button>
        </div>
        <footer className={styles.footer}>
          <span>© 2026 interview.ai</span>
        </footer>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Logo />
          <span className={styles.logoText}>interview.ai</span>
        </div>

        <a
          href={`/api/auth/google/start?redirect=${encodeURIComponent(redirectTo)}`}
          className={styles.googleBtn}
        >
          <GoogleIcon />
          Войти через Google
        </a>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span>или</span>
          <div className={styles.dividerLine} />
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
            type="button"
          >
            Войти
          </button>
          <button
            className={`${styles.tab} ${mode === "register" ? styles.tabActive : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
            type="button"
          >
            Регистрация
          </button>
        </div>

        <form className={styles.form} onSubmit={submit} noValidate>
          {mode === "register" && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">Имя</label>
              <input
                id="name"
                className={styles.input}
                type="text"
                placeholder="Иван Иванов"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Пароль
              {mode === "login" && (
                <a href="#" className={styles.forgotLink}>Забыли?</a>
              )}
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              placeholder={mode === "register" ? "Минимум 8 символов" : "••••••••"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <p className={styles.hint}>
          {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            className={styles.switchBtn}
            type="button"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>

      <footer className={styles.footer}>
        <span>© 2026 interview.ai</span>
        <span className={styles.dot}>·</span>
        <a href="#" className={styles.footerLink}>Конфиденциальность</a>
      </footer>
    </div>
  );
}