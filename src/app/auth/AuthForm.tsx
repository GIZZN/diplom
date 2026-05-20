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

type Mode = "login" | "register";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      if (!res.ok) {
        setError(data.error || "Что-то пошло не так");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Logo />
          <span className={styles.logoText}>interview.ai</span>
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
            {loading
              ? "Загрузка..."
              : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <p className={styles.hint}>
          {mode === "login"
            ? "Нет аккаунта? "
            : "Уже есть аккаунт? "}
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
