"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Keyboard,
  Loader2,
  LogIn,
  MessageSquare,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Timer,
} from "lucide-react";
import styles from "./app-auth.module.css";

type State = "loading" | "confirm" | "success" | "error" | "not-logged-in";

const EASE = [0.22, 1, 0.36, 1] as const;

const PERMISSIONS = [
  { icon: MessageSquare, label: "Чтение профиля", sub: "Имя, email и тариф" },
  { icon: BarChart3, label: "Доступ к сессиям", sub: "История вопросов и ответов" },
  { icon: Sparkles, label: "ИИ-ассистент", sub: "Подсказки во время интервью" },
];

const BRAND_POINTS = [
  { icon: ShieldOff, text: "Окно не попадает в скриншоты и запись экрана" },
  { icon: Keyboard, text: "Управление горячими клавишами" },
  { icon: Timer, text: "Токен доступа действует 10 минут" },
];

function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

function BrandPanel() {
  return (
    <aside className={styles.brand}>
      <div className={styles.brandGlow} aria-hidden="true" />
      <div className={styles.brandGrid} aria-hidden="true" />

      <Link href="/" className={styles.brandLogo}>
        <Logo />
        <span className={styles.logoText}>
          interview<span className={styles.logoDot}>.</span>ai
        </span>
      </Link>

      <div className={styles.brandBody}>
        <motion.h2
          className={styles.brandTitle}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          Подключение
          <br />
          <span className={styles.brandTitleMuted}>приложения.</span>
        </motion.h2>

        <ul className={styles.brandList}>
          {BRAND_POINTS.map(({ icon: Icon, text }, i) => (
            <motion.li
              key={text}
              className={styles.brandItem}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.15 + i * 0.09, ease: EASE }}
            >
              <span className={styles.brandItemIcon}>
                <Icon size={14} strokeWidth={1.9} />
              </span>
              {text}
            </motion.li>
          ))}
        </ul>
      </div>

      <p className={styles.brandFoot}>Нативное приложение для Windows 10/11</p>
    </aside>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <BrandPanel />
      <main className={styles.pane}>
        <Link href="/" className={styles.logoMobile}>
          <Logo size={24} />
          <span className={styles.logoText}>
            interview<span className={styles.logoDot}>.</span>ai
          </span>
        </Link>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {children}
        </motion.div>

        <footer className={styles.footer}>
          <span>© 2026 interview Assistant</span>
          <Link href="/privacy" className={styles.footerLink}>
            Конфиденциальность
          </Link>
        </footer>
      </main>
    </div>
  );
}

function Head({
  icon: Icon,
  tone = "accent",
  title,
  subtitle,
}: {
  icon: typeof LogIn;
  tone?: "accent" | "danger";
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <header className={styles.head}>
      <span
        className={`${styles.headIcon} ${tone === "danger" ? styles.headIconDanger : ""}`}
      >
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}

export default function AppAuthPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className={styles.stateBox}>
            <Loader2 size={22} className={styles.spinner} />
            <span className={styles.stateText}>Загрузка…</span>
          </div>
        </Shell>
      }
    >
      <AppAuthContent />
    </Suspense>
  );
}

function AppAuthContent() {
  const params = useSearchParams();
  const token = params.get("token");

  const [state, setState] = useState<State>("loading");
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string | null;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setError("Токен не найден");
      return;
    }

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
            .then(async (r) => {
              const data = await r.json().catch(() => ({}));
              if (r.ok) setState("success");
              else {
                setError(data.error || "Не удалось подтвердить");
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
    else {
      setError(data.error || "Ошибка");
      setState("error");
    }
  }

  if (state === "loading") {
    return (
      <Shell>
        <div className={styles.stateBox}>
          <Loader2 size={22} className={styles.spinner} />
          <span className={styles.stateText}>Проверяем сессию…</span>
          <span className={styles.stateHint}>Это займёт пару секунд</span>
        </div>
      </Shell>
    );
  }

  if (state === "not-logged-in") {
    return (
      <Shell>
        <Head
          icon={LogIn}
          title="Войдите в аккаунт"
          subtitle="Чтобы авторизовать приложение, сначала войдите на сайте — после этого вы вернётесь сюда автоматически."
        />
        <a
          href={`/auth?redirect=${encodeURIComponent(`/auth/app?token=${token ?? ""}`)}`}
          className={styles.primaryBtn}
        >
          Войти
          <ArrowRight size={16} strokeWidth={2.2} />
        </a>
        <Link href="/" className={styles.ghostLink}>
          <ArrowLeft size={14} strokeWidth={2.2} />
          На главную
        </Link>
      </Shell>
    );
  }

  if (state === "success") {
    return (
      <Shell>
        <motion.span
          className={styles.successIcon}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
        >
          <Check size={26} strokeWidth={2.6} />
        </motion.span>
        <h1 className={styles.title}>Приложение подключено</h1>
        <p className={styles.subtitle}>
          Доступ выдан. Вернитесь в приложение — эту вкладку можно закрыть.
        </p>
        {user && (
          <div className={styles.userRow}>
            <span className={styles.userAvatar}>
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt=""
                  width={36}
                  height={36}
                  className={styles.userAvatarImg}
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className={styles.userMeta}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </span>
            <span className={styles.userBadge}>
              <ShieldCheck size={13} strokeWidth={2.2} />
              Активно
            </span>
          </div>
        )}
        <Link href="/dashboard" className={styles.ghostLink}>
          Открыть личный кабинет
          <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </Shell>
    );
  }

  if (state === "error") {
    return (
      <Shell>
        <Head
          icon={AlertTriangle}
          tone="danger"
          title="Не удалось подключить"
          subtitle={error || "Что-то пошло не так"}
        />
        <p className={styles.note}>
          Токен действует 10 минут. Если время истекло — запросите вход из
          приложения заново.
        </p>
        <Link href="/" className={styles.ghostLink}>
          <ArrowLeft size={14} strokeWidth={2.2} />
          На главную
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <Head
        icon={ShieldCheck}
        title="Подтвердите доступ"
        subtitle={
          <>
            Приложение <strong>Interview Assistant</strong> запрашивает доступ к
            вашему аккаунту.
          </>
        }
      />

      {user && (
        <div className={styles.userRow}>
          <span className={styles.userAvatar}>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                width={36}
                height={36}
                className={styles.userAvatarImg}
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </span>
          <span className={styles.userMeta}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userEmail}>{user.email}</span>
          </span>
        </div>
      )}

      <ul className={styles.permissions}>
        {PERMISSIONS.map(({ icon: Icon, label, sub }) => (
          <li key={label} className={styles.permission}>
            <span className={styles.permissionIcon}>
              <Icon size={14} strokeWidth={1.9} />
            </span>
            <span className={styles.permissionText}>
              <span className={styles.permissionLabel}>{label}</span>
              <span className={styles.permissionSub}>{sub}</span>
            </span>
            <Check size={14} strokeWidth={2.6} className={styles.permissionCheck} />
          </li>
        ))}
      </ul>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.primaryBtn} onClick={handleApprove} type="button">
        Подтвердить вход
        <ArrowRight size={16} strokeWidth={2.2} />
      </button>

      <Link href="/" className={styles.ghostLink}>
        Отменить
      </Link>

      <p className={styles.note}>
        <Timer size={12} strokeWidth={2.2} />
        Токен действителен 10 минут
      </p>
    </Shell>
  );
}
