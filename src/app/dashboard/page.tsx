"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./dashboard.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

type NavItem = "dashboard" | "sessions" | "analytics" | "settings" | "help";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconDashboard({ active }: { active?: boolean }) {
  const color = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

function IconSessions({ active }: { active?: boolean }) {
  const color = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 3.5C2 2.67 2.67 2 3.5 2h9C13.33 2 14 2.67 14 3.5v7c0 .83-.67 1.5-1.5 1.5H9l-3 2v-2H3.5C2.67 14 2 13.33 2 12.5v-9z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5 6h6M5 9h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconAnalytics({ active }: { active?: boolean }) {
  const color = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 13L5.5 8.5L8.5 10.5L12 5L14 7" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 13h12" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ active }: { active?: boolean }) {
  const color = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth="1.4" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.06 1.06M12.01 12.01l1.06 1.06M2.93 13.07l1.06-1.06M12.01 3.99l1.06-1.06" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconHelp({ active }: { active?: boolean }) {
  const color = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.4" />
      <path d="M6 6.2c0-1.1.9-2 2-2s2 .9 2 2c0 .9-.6 1.6-1.4 1.9C8.2 8.3 8 8.6 8 9v.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r=".75" fill={color} />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M5.5 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SESSIONS = [
  { id: 1, role: "Frontend разработчик", date: "Сегодня, 14:32", messages: 24, status: "success" },
  { id: 2, role: "React Engineer", date: "Вчера, 10:15", messages: 18, status: "success" },
  { id: 3, role: "Fullstack Developer", date: "12 июн, 09:40", messages: 31, status: "partial" },
  { id: 4, role: "TypeScript разработчик", date: "10 июн, 16:20", messages: 12, status: "neutral" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonSidebar}>
        <div className={styles.skeletonBlock} style={{ width: 120, height: 24, marginBottom: 32 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.skeletonBlock} style={{ width: "80%", height: 16, marginBottom: 12 }} />
        ))}
      </div>
      <div className={styles.skeletonMain}>
        <div className={styles.skeletonBlock} style={{ width: 200, height: 28, marginBottom: 8 }} />
        <div className={styles.skeletonBlock} style={{ width: 300, height: 16, marginBottom: 32 }} />
        <div className={styles.skeletonRow}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonBlock} style={{ flex: 1, height: 80 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DesktopSession {
  id: number;
  type: string;
  question: string | null;
  answer: string | null;
  model: string | null;
  response_time_ms: number | null;
  tokens_used: number | null;
  session_id: string | null;
  created_at: string;
}

interface DesktopStats {
  total: number;
  today: number;
  avg_response_ms: number | null;
  top_model: string | null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [role, setRole] = useState("Frontend разработчик");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [desktopSessions, setDesktopSessions] = useState<DesktopSession[]>([]);
  const [desktopStats, setDesktopStats] = useState<DesktopStats>({ total: 0, today: 0, avg_response_ms: null, top_model: null });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/auth");
        } else {
          setUser(data.user);
          setLoading(false);
          // Load desktop sessions
          fetch("/api/desktop/sessions?limit=10")
            .then((r) => r.json())
            .then((d) => {
              if (d.sessions) {
                setDesktopSessions(d.sessions);
                const today = new Date().toDateString();
                const todayCount = d.sessions.filter((s: DesktopSession) =>
                  new Date(s.created_at).toDateString() === today
                ).length;
                const withTime = d.sessions.filter((s: DesktopSession) => s.response_time_ms);
                const avgMs = withTime.length
                  ? Math.round(withTime.reduce((a: number, s: DesktopSession) => a + (s.response_time_ms ?? 0), 0) / withTime.length)
                  : null;
                const modelCounts: Record<string, number> = {};
                d.sessions.forEach((s: DesktopSession) => { if (s.model) modelCounts[s.model] = (modelCounts[s.model] ?? 0) + 1; });
                const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
                setDesktopStats({ total: d.sessions.length, today: todayCount, avg_response_ms: avgMs, top_model: topModel });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => router.replace("/auth"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await fetch("/api/auth/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setUser((u) => u ? { ...u, avatar: data.avatar } : u);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAvatarRemove() {
    await fetch("/api/auth/avatar", { method: "DELETE" });
    setUser((u) => u ? { ...u, avatar: null } : u);
  }

  if (loading) return <Skeleton />;

  const firstName = user?.name?.split(" ")[0] ?? "Пользователь";

  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <IconDashboard active={activeNav === "dashboard"} /> },
    { id: "sessions", label: "Sessions", icon: <IconSessions active={activeNav === "sessions"} /> },
    { id: "analytics", label: "Analytics", icon: <IconAnalytics active={activeNav === "analytics"} /> },
    { id: "settings", label: "Settings", icon: <IconSettings active={activeNav === "settings"} /> },
    { id: "help", label: "Help", icon: <IconHelp active={activeNav === "help"} /> },
  ];

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logoRow}>
            <Logo size={28} />
            <span className={styles.logoText}>interview.ai</span>
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.navItem} ${activeNav === item.id ? styles.navItemActive : ""}`}
                onClick={() => setActiveNav(item.id)}
                type="button"
                aria-current={activeNav === item.id ? "page" : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <button
              className={styles.userAvatarBtn}
              onClick={() => fileInputRef.current?.click()}
              title="Сменить аватар"
              type="button"
              aria-label="Загрузить аватар"
            >
              {user?.avatar
                  ? <Image src={user.avatar} alt="Аватар" width={32} height={32} className={styles.userAvatarImg} />
                  : <span className={styles.userAvatarInitial}>{user?.name?.charAt(0).toUpperCase() ?? "U"}</span>
              }
              <span className={styles.userAvatarOverlay}>
                {avatarUploading
                  ? <span className={styles.avatarSpinner} />
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                }
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.fileInput}
              onChange={handleAvatarChange}
              aria-hidden="true"
            />
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.planBadge}>Free</span>
              {user?.avatar && (
                <button className={styles.removeAvatarBtn} onClick={handleAvatarRemove} type="button">
                  Удалить фото
                </button>
              )}
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} type="button" aria-label="Выйти из аккаунта">
            <IconLogout />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <button className={styles.newSessionBtn} type="button">
            <IconPlus />
            <span>Новая сессия</span>
          </button>
        </header>

        <div className={styles.content}>
          {/* Welcome */}
          <section className={styles.welcome}>
            <h2 className={styles.welcomeTitle}>Добро пожаловать, {firstName}</h2>
            <p className={styles.welcomeSub}>Готовы к следующему интервью? Начните сессию или просмотрите прогресс.</p>
          </section>

          {/* Stats */}
          <section className={styles.statsRow} aria-label="Статистика">
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Сессий сегодня</span>
              <span className={styles.statValue}>2</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Всего сессий</span>
              <span className={styles.statValue}>14</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Успешных ответов</span>
              <span className={styles.statValue}>
                <span className={styles.statAccent}>78</span>
                <span className={styles.statUnit}>%</span>
              </span>
            </div>
          </section>

          {/* Quick start */}
          <section className={styles.quickStart}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Быстрый старт</h3>
            </div>
            <div className={styles.quickStartCard}>
              <p className={styles.quickStartDesc}>
                Укажите роль, на которую проходите интервью, и AI-ассистент подберёт релевантные вопросы.
              </p>
              <div className={styles.quickStartForm}>
                <div className={styles.inputWrapper}>
                  <label htmlFor="role-input" className={styles.inputLabel}>Роль</label>
                  <input
                    id="role-input"
                    className={styles.roleInput}
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Frontend разработчик"
                    autoComplete="off"
                  />
                </div>
                <button className={styles.startBtn} type="button" disabled={!role.trim()}>
                  <span>Начать сессию</span>
                  <IconArrow />
                </button>
              </div>
            </div>
          </section>

          {/* Recent sessions */}
          <section className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Последние сессии</h3>
              <button className={styles.viewAllBtn} type="button">Все сессии</button>
            </div>
            <div className={styles.sessionsList}>
              {MOCK_SESSIONS.map((session) => (
                <div key={session.id} className={styles.sessionItem}>
                  <div className={styles.sessionLeft}>
                    <span
                      className={styles.statusDot}
                      data-status={session.status}
                      aria-label={
                        session.status === "success"
                          ? "Успешно"
                          : session.status === "partial"
                          ? "Частично"
                          : "Нейтрально"
                      }
                    />
                    <div>
                      <span className={styles.sessionRole}>{session.role}</span>
                      <span className={styles.sessionDate}>{session.date}</span>
                    </div>
                  </div>
                  <div className={styles.sessionRight}>
                    <span className={styles.sessionMessages}>{session.messages} сообщений</span>
                    <button className={styles.sessionOpenBtn} type="button" aria-label={`Открыть сессию ${session.role}`}>
                      <IconArrow />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Desktop activity */}
          {desktopStats.total > 0 && (
            <section className={styles.desktopSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Активность в приложении</h3>
              </div>

              <div className={styles.desktopStatsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Сессий всего</span>
                  <span className={styles.statValue}>{desktopStats.total}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Сегодня</span>
                  <span className={styles.statValue}>{desktopStats.today}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Среднее время</span>
                  <span className={styles.statValue}>
                    {desktopStats.avg_response_ms
                      ? <>{(desktopStats.avg_response_ms / 1000).toFixed(1)}<span className={styles.statUnit}>с</span></>
                      : "—"}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Топ модель</span>
                  <span className={styles.statValue} style={{ fontSize: 13, letterSpacing: 0 }}>
                    {desktopStats.top_model?.split("/").pop()?.split(":")[0] ?? "—"}
                  </span>
                </div>
              </div>

              <div className={styles.sessionsList} style={{ marginTop: 12 }}>
                {desktopSessions.map((s) => (
                  <div key={s.id} className={styles.sessionItem}>
                    <div className={styles.sessionLeft}>
                      <span className={styles.desktopTypeIcon}>
                        {s.type === "live_answer" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                        )}
                        {s.type === "screen_analysis" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        )}
                        {s.type === "chat_message" && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        )}
                      </span>
                      <div>
                        <span className={styles.sessionRole}>
                          {s.question ? s.question.slice(0, 80) + (s.question.length > 80 ? "…" : "") : "—"}
                        </span>
                        <span className={styles.sessionDate}>
                          {new Date(s.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className={styles.sessionRight}>
                      {s.response_time_ms && (
                        <span className={styles.sessionMessages}>{(s.response_time_ms / 1000).toFixed(1)}с</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Download card */}
          <section className={styles.downloadCard} aria-label="Скачать приложение">            <div className={styles.downloadIcon} aria-hidden="true">
              <IconDownload />
            </div>
            <div className={styles.downloadText}>
              <span className={styles.downloadTitle}>Скачать desktop-приложение</span>
              <span className={styles.downloadSub}>Работайте офлайн и получите доступ к расширенным функциям</span>
            </div>
            <button className={styles.downloadBtn} type="button">
              Скачать
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
