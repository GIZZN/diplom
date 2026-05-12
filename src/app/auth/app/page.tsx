"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./app-auth.module.css";

type State = "loading" | "confirm" | "success" | "error" | "not-logged-in";

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

export default function AppAuthPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p className={styles.hint}>Загрузка...</p>
        </div>
      </div>
    }>
      <AppAuthContent />
    </Suspense>
  );
}

function AppAuthContent() {
  const params = useSearchParams();
  const token = params.get("token");

  const [state, setState] = useState<State>("loading");
  const [user, setUser] = useState<{ name: string; email: string; avatar: string | null } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setError("Токен не найден"); return; }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          setState("not-logged-in");
        } else {
          setUser(d.user);
          // Auto-approve immediately — user is already logged in
          fetch("/api/auth/app/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.ok || data.error === "Токен недействителен или истёк") {
                setState("success");
              } else {
                setState("confirm");
              }
            })
            .catch(() => setState("confirm"));
        }
      })
      .catch(() => setState("error"));
  }, [token]);

  async function handleApprove() {
    setState("loading");
    const res = await fetch("/api/auth/app/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (res.ok) setState("success");
    else { setError(data.error || "Ошибка"); setState("error"); }
  }

  if (state === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p className={styles.hint}>Проверяем сессию...</p>
        </div>
      </div>
    );
  }

  if (state === "not-logged-in") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Logo />
          <h1 className={styles.title}>Войдите в аккаунт</h1>
          <p className={styles.subtitle}>Чтобы авторизовать приложение, сначала войдите на сайте.</p>
          <a href={`/auth?redirect=/auth/app?token=${token}`} className={styles.btn}>
            Войти
          </a>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#1cdda4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className={styles.title}>Готово!</h1>
          <p className={styles.subtitle}>Приложение успешно авторизовано. Можете закрыть эту вкладку.</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Ошибка</h1>
          <p className={styles.subtitle}>{error || "Что-то пошло не так"}</p>
        <Link href="/" className={styles.btnSecondary}>На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Logo />
        <h1 className={styles.title}>Авторизация приложения</h1>
        <p className={styles.subtitle}>
          Приложение <strong>interview.ai</strong> запрашивает доступ к вашему аккаунту.
        </p>

        <div className={styles.userRow}>
          <div className={styles.userAvatar}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>
          <div>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
        </div>

        <div className={styles.permissions}>
          <div className={styles.permission}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#1cdda4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Чтение профиля
          </div>
          <div className={styles.permission}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#1cdda4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Доступ к сессиям
          </div>
          <div className={styles.permission}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#1cdda4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Использование ИИ-ассистента
          </div>
        </div>

        <button className={styles.btn} onClick={handleApprove} type="button">
          Подтвердить вход
        </button>
        <Link href="/" className={styles.btnSecondary}>Отменить</Link>

        <p className={styles.hint}>Токен действителен 10 минут</p>
      </div>
    </div>
  );
}
