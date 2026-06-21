"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./dashboard.module.css";
import DownloadDropdown from "../components/DownloadDropdown";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
  plan: string;
  pro_expires_at: string | null;
  role: string;
}

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

interface Analytics {
  total: number;
  today: number;
  avg_ms: number | null;
  last_7d: number;
  by_type: { type: string; count: number }[];
  by_day: { date: string; count: number }[];
  top_models: { model: string; count: number }[];
}

type NavItem = "dashboard" | "sessions" | "analytics" | "settings" | "help";

// ─── Icons ────────────────────────────────────────────────────────────────────

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

function IconDashboard({ active }: { active?: boolean }) {
  const c = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke={c} strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke={c} strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke={c} strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke={c} strokeWidth="1.4" />
    </svg>
  );
}

function IconSessions({ active }: { active?: boolean }) {
  const c = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 3.5C2 2.67 2.67 2 3.5 2h9C13.33 2 14 2.67 14 3.5v7c0 .83-.67 1.5-1.5 1.5H9l-3 2v-2H3.5C2.67 14 2 13.33 2 12.5v-9z" stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5 6h6M5 9h4" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconAnalytics({ active }: { active?: boolean }) {
  const c = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 13L5.5 8.5L8.5 10.5L12 5L14 7" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 13h12" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ active }: { active?: boolean }) {
  const c = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" stroke={c} strokeWidth="1.4" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.06 1.06M12.01 12.01l1.06 1.06M2.93 13.07l1.06-1.06M12.01 3.99l1.06-1.06" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconHelp({ active }: { active?: boolean }) {
  const c = active ? "var(--accent)" : "currentColor";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke={c} strokeWidth="1.4" />
      <path d="M6 6.2c0-1.1.9-2 2-2s2 .9 2 2c0 .9-.6 1.6-1.4 1.9C8.2 8.3 8 8.6 8 9v.5" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r=".75" fill={c} />
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 4v5c0 4.42-3.37 8.56-8 9.93C7.37 20.56 4 16.42 4 12V7l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function IconMic() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    </svg>
  );
}

function IconScreen() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SessionTypeIcon({ type }: { type: string }) {
  if (type === "live_answer") return <IconMic />;
  if (type === "screen_analysis") return <IconScreen />;
  return <IconChat />;
}

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dashboard
  const [desktopSessions, setDesktopSessions] = useState<DesktopSession[]>([]);
  const [desktopStats, setDesktopStats] = useState({ total: 0, today: 0, avg_response_ms: null as number | null });

  // Sessions tab
  const [sessionFilter, setSessionFilter] = useState("all");
  const [allSessions, setAllSessions] = useState<DesktopSession[]>([]);
  const [sessionsOffset, setSessionsOffset] = useState(0);
  const [sessionsHasMore, setSessionsHasMore] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  // Analytics tab
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Settings tab
  const [profileName, setProfileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) { router.replace("/auth"); return; }
        setUser(data.user);
        setProfileName(data.user.name);
        setLoading(false);
        loadDashboard();
      })
      .catch(() => router.replace("/auth"));
  }, [router]);

  function loadDashboard() {
    fetch("/api/desktop/sessions?limit=10")
      .then((r) => r.json())
      .then((d) => {
        if (!d.sessions) return;
        setDesktopSessions(d.sessions);
        const today = new Date().toDateString();
        const todayCount = d.sessions.filter((s: DesktopSession) => new Date(s.created_at).toDateString() === today).length;
        const withTime = d.sessions.filter((s: DesktopSession) => s.response_time_ms);
        const avgMs = withTime.length ? Math.round(withTime.reduce((a: number, s: DesktopSession) => a + (s.response_time_ms ?? 0), 0) / withTime.length) : null;
        setDesktopStats({ total: d.sessions.length, today: todayCount, avg_response_ms: avgMs });
      })
      .catch(() => {});
  }

  async function loadSessions(filter = "all", offset = 0, append = false) {
    setSessionsLoading(true);
    const url = filter === "all"
      ? `/api/desktop/sessions?limit=20&offset=${offset}`
      : `/api/desktop/sessions?limit=20&offset=${offset}&type=${filter}`;
    try {
      const res = await fetch(url);
      const d = await res.json();
      if (d.sessions) {
        setAllSessions(prev => append ? [...prev, ...d.sessions] : d.sessions);
        setSessionsHasMore(d.sessions.length === 20);
        setSessionsOffset(offset + d.sessions.length);
      }
    } finally {
      setSessionsLoading(false);
    }
  }

  async function loadAnalytics() {
    if (analytics) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/dashboard/analytics");
      const d = await res.json();
      setAnalytics(d);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  function handleNavClick(id: NavItem) {
    setActiveNav(id);
    if (id === "sessions" && allSessions.length === 0) loadSessions();
    if (id === "analytics") loadAnalytics();
  }

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

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileMsg("");
    setProfileError("");
    const body: Record<string, string> = {};
    if (profileName.trim() !== user?.name) body.name = profileName.trim();
    if (newPassword) { body.current_password = currentPassword; body.new_password = newPassword; }
    if (!Object.keys(body).length) { setProfileError("Нет изменений"); setProfileSaving(false); return; }
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setProfileError(d.error ?? "Ошибка"); return; }
      setUser((u) => u ? { ...u, name: d.user.name } : u);
      setProfileMsg("Сохранено");
      setCurrentPassword("");
      setNewPassword("");
    } catch { setProfileError("Ошибка соединения"); }
    finally { setProfileSaving(false); }
  }

  if (loading) return <Skeleton />;

  const firstName = user?.name?.split(" ")[0] ?? "Пользователь";
  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard",  icon: <IconDashboard active={activeNav === "dashboard"} /> },
    { id: "sessions",  label: "Sessions",   icon: <IconSessions  active={activeNav === "sessions"}  /> },
    { id: "analytics", label: "Analytics",  icon: <IconAnalytics active={activeNav === "analytics"} /> },
    { id: "settings",  label: "Settings",   icon: <IconSettings  active={activeNav === "settings"}  /> },
    { id: "help",      label: "Help",        icon: <IconHelp      active={activeNav === "help"}      /> },
  ];

  const NAV_TITLE: Record<NavItem, string> = {
    dashboard: "Dashboard", sessions: "Sessions", analytics: "Analytics", settings: "Settings", help: "Help",
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logoRow}>
            <Logo size={28} /><span className={styles.logoText}>interview.ai</span>
          </Link>
          <nav className={styles.nav} aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.navItem} ${activeNav === item.id ? styles.navItemActive : ""}`}
                onClick={() => handleNavClick(item.id)}
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
            <button className={styles.userAvatarBtn} onClick={() => fileInputRef.current?.click()} title="Сменить аватар" type="button" aria-label="Загрузить аватар">
              {user?.avatar
                ? <Image src={user.avatar} alt="Аватар" width={32} height={32} className={styles.userAvatarImg} />
                : <span className={styles.userAvatarInitial}>{user?.name?.charAt(0).toUpperCase() ?? "U"}</span>}
              <span className={styles.userAvatarOverlay}>
                {avatarUploading
                  ? <span className={styles.avatarSpinner} />
                  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>}
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={styles.fileInput} onChange={handleAvatarChange} aria-hidden="true" />
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={`${styles.planBadge} ${user?.plan === "pro" ? styles.planBadgePro : ""}`}>
                {user?.plan === "pro" ? "Pro" : "Free"}
              </span>
              {user?.plan === "pro" && user.pro_expires_at && (
                <span className={styles.planExpiry}>до {new Date(user.pro_expires_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
              )}
              {user?.avatar && (
                <button className={styles.removeAvatarBtn} onClick={handleAvatarRemove} type="button">Удалить фото</button>
              )}
            </div>
          </div>
          {user?.role === "admin" && (
            <Link href="/admin" className={styles.adminBtn}>
              <IconAdmin /><span>Admin Panel</span>
            </Link>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout} type="button" aria-label="Выйти из аккаунта">
            <IconLogout /><span>Выйти</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>{NAV_TITLE[activeNav]}</h1>
          {activeNav === "dashboard" && (
            <button className={styles.newSessionBtn} type="button">
              <IconPlus /><span>Новая сессия</span>
            </button>
          )}
        </header>

        <div className={styles.content}>

          {/* ─── DASHBOARD ─── */}
          {activeNav === "dashboard" && (
            <>
              <section className={styles.welcome}>
                <h2 className={styles.welcomeTitle}>Добро пожаловать, {firstName}</h2>
                <p className={styles.welcomeSub}>Готовы к следующему интервью? Начните сессию или просмотрите прогресс.</p>
              </section>

              <section className={styles.statsRow} aria-label="Статистика">
                {[
                  { label: "Сессий сегодня", value: desktopStats.today },
                  { label: "Всего сессий",   value: desktopStats.total },
                  { label: "Среднее время",   value: desktopStats.avg_response_ms ? `${(desktopStats.avg_response_ms / 1000).toFixed(1)}с` : "—" },
                ].map((s) => (
                  <div key={s.label} className={styles.statCard}>
                    <span className={styles.statLabel}>{s.label}</span>
                    <span className={styles.statValue}>{s.value}</span>
                  </div>
                ))}
              </section>

              <section className={styles.quickStart}>
                <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Быстрый старт</h3></div>
                <div className={styles.quickStartCard}>
                  <p className={styles.quickStartDesc}>Запустите desktop-приложение, войдите в аккаунт и начните практическую сессию прямо сейчас.</p>
                  <div className={styles.quickStartForm}>
                    <DownloadDropdown align="left" trigger={
                      <button className={styles.startBtn} type="button"><span>Скачать приложение</span><IconArrow /></button>
                    } />
                  </div>
                </div>
              </section>

              <section className={styles.recentSection}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Последние сессии</h3>
                  <button className={styles.viewAllBtn} onClick={() => handleNavClick("sessions")}>Все сессии →</button>
                </div>
                {desktopSessions.length === 0 ? (
                  <div className={styles.emptyState}>Сессий пока нет. Запустите приложение и начните практику.</div>
                ) : (
                  <div className={styles.sessionsTable}>
                    <div className={styles.sessionsTableHead}><span>Тип</span><span>Вопрос</span><span>Ответ</span><span>Модель</span><span>Время</span><span>Дата</span></div>
                    {desktopSessions.slice(0, 5).map((s) => (
                      <div key={s.id} className={styles.sessionsTableRow}>
                        <span className={styles.desktopTypeIcon}><SessionTypeIcon type={s.type} /></span>
                        <span className={styles.tableCell} title={s.question ?? ""}>{s.question ? s.question.slice(0, 60) + (s.question.length > 60 ? "…" : "") : "—"}</span>
                        <span className={styles.tableCell} title={s.answer ?? ""}>{s.answer ? s.answer.slice(0, 80) + (s.answer.length > 80 ? "…" : "") : "—"}</span>
                        <span className={styles.tableCellMono}>{s.model?.split("/").pop()?.split(":")[0] ?? "—"}</span>
                        <span className={styles.tableCellMono}>{s.response_time_ms ? `${(s.response_time_ms / 1000).toFixed(1)}с` : "—"}</span>
                        <span className={styles.tableCellMuted}>{new Date(s.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className={styles.downloadCard} aria-label="Скачать приложение">
                <div className={styles.downloadIcon} aria-hidden="true"><IconDownload /></div>
                <div className={styles.downloadText}>
                  <span className={styles.downloadTitle}>Desktop-приложение</span>
                  <span className={styles.downloadSub}>Работайте офлайн и получите доступ к расширенным функциям</span>
                </div>
                <DownloadDropdown align="right" trigger={<button className={styles.downloadBtn} type="button">Скачать</button>} />
              </section>
            </>
          )}

          {/* ─── SESSIONS ─── */}
          {activeNav === "sessions" && (
            <>
              <div className={styles.sectionHeader}>
                <div className={styles.filterRow}>
                  {[
                    { key: "all",             label: "Все" },
                    { key: "chat_message",    label: "Чат" },
                    { key: "live_answer",     label: "Голос" },
                    { key: "screen_analysis", label: "Скриншот" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`${styles.filterBtn} ${sessionFilter === f.key ? styles.filterBtnActive : ""}`}
                      onClick={() => { setSessionFilter(f.key); setAllSessions([]); setSessionsOffset(0); setExpandedSession(null); loadSessions(f.key, 0); }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className={styles.tableCellMuted}>{allSessions.length} записей</span>
              </div>

              {sessionsLoading && allSessions.length === 0 ? (
                <div className={styles.emptyState}>Загрузка…</div>
              ) : allSessions.length === 0 ? (
                <div className={styles.emptyState}>Нет сессий. Запустите desktop-приложение.</div>
              ) : (
                <div className={styles.sessionsTable}>
                  <div className={styles.sessionsTableHead}><span>Тип</span><span>Вопрос</span><span>Ответ</span><span>Модель</span><span>Время</span><span>Дата</span></div>
                  {allSessions.map((s) => (
                    <>
                      <div
                        key={s.id}
                        className={styles.sessionsTableRow}
                        onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <span className={styles.desktopTypeIcon}><SessionTypeIcon type={s.type} /></span>
                        <span className={styles.tableCell} title={s.question ?? ""}>{s.question ? s.question.slice(0, 60) + (s.question.length > 60 ? "…" : "") : "—"}</span>
                        <span className={styles.tableCell} title={s.answer ?? ""}>{s.answer ? s.answer.slice(0, 80) + (s.answer.length > 80 ? "…" : "") : "—"}</span>
                        <span className={styles.tableCellMono}>{s.model?.split("/").pop()?.split(":")[0] ?? "—"}</span>
                        <span className={styles.tableCellMono}>{s.response_time_ms ? `${(s.response_time_ms / 1000).toFixed(1)}с` : "—"}</span>
                        <span className={styles.tableCellMuted}>{new Date(s.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {expandedSession === s.id && (
                        <div key={`exp-${s.id}`} style={{ padding: "14px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                          {s.question && <><strong style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Вопрос</strong><p style={{ marginTop: 6, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.question}</p></>}
                          {s.answer && <><strong style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 12, display: "block" }}>Ответ</strong><p style={{ marginTop: 6, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.answer}</p></>}
                        </div>
                      )}
                    </>
                  ))}
                </div>
              )}

              {sessionsHasMore && (
                <button
                  className={styles.downloadBtn}
                  style={{ alignSelf: "center", marginTop: 4 }}
                  onClick={() => loadSessions(sessionFilter, sessionsOffset, true)}
                  disabled={sessionsLoading}
                >
                  {sessionsLoading ? "Загрузка…" : "Загрузить ещё"}
                </button>
              )}
            </>
          )}

          {/* ─── ANALYTICS ─── */}
          {activeNav === "analytics" && (
            analyticsLoading || !analytics ? (
              <div className={styles.emptyState}>Загрузка аналитики…</div>
            ) : (
              <>
                <section className={styles.statsRow}>
                  {[
                    { label: "Всего сессий",    value: analytics.total },
                    { label: "Сегодня",         value: analytics.today },
                    { label: "За 7 дней",       value: analytics.last_7d },
                    { label: "Среднее время",   value: analytics.avg_ms ? `${(analytics.avg_ms / 1000).toFixed(1)}с` : "—" },
                  ].map((s) => (
                    <div key={s.label} className={styles.statCard}>
                      <span className={styles.statLabel}>{s.label}</span>
                      <span className={styles.statValue}>{s.value}</span>
                    </div>
                  ))}
                </section>

                {analytics.by_day.length > 0 && (
                  <section className={styles.recentSection}>
                    <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Сессии за 14 дней</h3></div>
                    <div className={styles.quickStartCard} style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, padding: "20px 16px", minHeight: 110 }}>
                      {(() => {
                        const max = Math.max(...analytics.by_day.map(d => d.count), 1);
                        return analytics.by_day.map((d) => (
                          <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <div style={{ width: "100%", background: "var(--accent)", borderRadius: 3, height: `${Math.max((d.count / max) * 72, 4)}px`, transition: "height 0.3s" }} />
                            <span style={{ fontSize: 9, color: "var(--text-faint)", whiteSpace: "nowrap" }}>{d.date}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </section>
                )}

                {analytics.by_type.length > 0 && (
                  <section className={styles.recentSection}>
                    <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>По типу</h3></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {analytics.by_type.map((t) => {
                        const pct = analytics.total ? Math.round((t.count / analytics.total) * 100) : 0;
                        const label = t.type === "chat_message" ? "Чат" : t.type === "live_answer" ? "Голосовой ответ" : t.type === "screen_analysis" ? "Анализ экрана" : t.type;
                        return (
                          <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ width: 130, fontSize: 12.5, color: "var(--text-secondary)" }}>{label}</span>
                            <div style={{ flex: 1, height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 3, transition: "width 0.4s" }} />
                            </div>
                            <span style={{ fontSize: 12, color: "var(--text-muted)", width: 60, textAlign: "right" }}>{t.count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {analytics.top_models.length > 0 && (
                  <section className={styles.recentSection}>
                    <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Топ моделей</h3></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {analytics.top_models.map((m, i) => (
                        <div key={m.model} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                          <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "var(--font-mono)", width: 16 }}>{i + 1}</span>
                          <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{m.model.split("/").pop()?.split(":")[0] ?? m.model}</span>
                          <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{m.count} сессий</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )
          )}

          {/* ─── SETTINGS ─── */}
          {activeNav === "settings" && (
            <>
              <section className={styles.quickStartCard} style={{ flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button className={styles.userAvatarBtn} style={{ width: 56, height: 56 }} onClick={() => fileInputRef.current?.click()} title="Сменить аватар" type="button">
                    {user?.avatar
                      ? <Image src={user.avatar} alt="Аватар" width={56} height={56} className={styles.userAvatarImg} style={{ borderRadius: "50%" }} />
                      : <span className={styles.userAvatarInitial} style={{ fontSize: 20 }}>{user?.name?.charAt(0).toUpperCase() ?? "U"}</span>}
                    <span className={styles.userAvatarOverlay}>
                      {avatarUploading ? <span className={styles.avatarSpinner} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>}
                    </span>
                  </button>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{user?.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{user?.email}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, background: user?.plan === "pro" ? "rgba(167,139,250,0.12)" : "var(--bg-elevated)", color: user?.plan === "pro" ? "#a78bfa" : "var(--text-muted)", border: "1px solid", borderColor: user?.plan === "pro" ? "rgba(167,139,250,0.25)" : "var(--border)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {user?.plan === "pro" ? "Pro" : "Free"}
                      </span>
                      {user?.plan !== "pro" && (
                        <Link href="/#pricing" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>Улучшить план →</Link>
                      )}
                    </div>
                  </div>
                </div>
                {user?.avatar && (
                  <button className={styles.removeAvatarBtn} onClick={handleAvatarRemove} type="button" style={{ alignSelf: "flex-start" }}>Удалить фото</button>
                )}
              </section>

              <section className={styles.recentSection}>
                <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Профиль</h3></div>
                <div className={styles.quickStartCard} style={{ flexDirection: "column", gap: 16 }}>
                  <div className={styles.inputWrapper} style={{ maxWidth: 360 }}>
                    <label className={styles.inputLabel}>Отображаемое имя</label>
                    <input
                      className={styles.roleInput}
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div className={styles.inputWrapper} style={{ maxWidth: 360 }}>
                    <label className={styles.inputLabel}>Email</label>
                    <input className={styles.roleInput} type="email" value={user?.email ?? ""} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Зарегистрирован: {user?.created_at ? new Date(user.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  </div>
                  {profileError && <div style={{ fontSize: 13, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius-sm)", padding: "8px 12px" }}>{profileError}</div>}
                  {profileMsg  && <div style={{ fontSize: 13, color: "var(--accent)", background: "var(--accent-soft)", border: "1px solid rgba(28,221,164,0.2)", borderRadius: "var(--radius-sm)", padding: "8px 12px" }}>{profileMsg}</div>}
                  <button className={styles.startBtn} onClick={handleProfileSave} disabled={profileSaving} style={{ alignSelf: "flex-start" }}>
                    {profileSaving ? "Сохранение…" : "Сохранить"}<IconArrow />
                  </button>
                </div>
              </section>

              <section className={styles.recentSection}>
                <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Смена пароля</h3></div>
                <div className={styles.quickStartCard} style={{ flexDirection: "column", gap: 14 }}>
                  <div className={styles.inputWrapper} style={{ maxWidth: 360 }}>
                    <label className={styles.inputLabel}>Текущий пароль</label>
                    <input className={styles.roleInput} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <div className={styles.inputWrapper} style={{ maxWidth: 360 }}>
                    <label className={styles.inputLabel}>Новый пароль</label>
                    <input className={styles.roleInput} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 8 символов" />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Если аккаунт создан через Google, смена пароля недоступна.</p>
                  <button className={styles.startBtn} onClick={handleProfileSave} disabled={profileSaving || !currentPassword || !newPassword} style={{ alignSelf: "flex-start" }}>
                    {profileSaving ? "Сохранение…" : "Сменить пароль"}<IconArrow />
                  </button>
                </div>
              </section>
            </>
          )}

          {/* ─── HELP ─── */}
          {activeNav === "help" && (
            <>
              <section className={styles.recentSection}>
                <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Начало работы</h3></div>
                <div className={styles.quickStartCard} style={{ flexDirection: "column", gap: 16 }}>
                  <p className={styles.quickStartDesc}>Скачайте desktop-приложение, войдите через браузер — сессия синхронизируется автоматически.</p>
                  <DownloadDropdown align="left" trigger={<button className={styles.startBtn} type="button"><span>Скачать приложение</span><IconArrow /></button>} />
                </div>
              </section>

              <section className={styles.recentSection}>
                <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Горячие клавиши</h3></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    { keys: ["⌘", "⇧", "I"], action: "Открыть / скрыть ассистента" },
                    { keys: ["⌘", "⇧", "R"], action: "Начать новую сессию" },
                    { keys: ["Esc"],           action: "Закрыть ассистент" },
                    { keys: ["⌘", "Enter"],    action: "Отправить сообщение" },
                    { keys: ["⌘", "⇧", "C"],   action: "Скопировать последний ответ" },
                  ].map((s) => (
                    <div key={s.action} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {s.keys.map((k) => <kbd key={k} style={{ padding: "2px 7px", background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 4, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{k}</kbd>)}
                      </div>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{s.action}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.recentSection}>
                <div className={styles.sectionHeader}><h3 className={styles.sectionTitle}>Поддержка</h3></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Написать в поддержку", href: "mailto:support@interview.ai" },
                    { label: "Сообщить об ошибке",   href: "https://github.com/GIZZN/diplom/issues" },
                  ].map((l) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13.5, color: "var(--text-primary)", textDecoration: "none", transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-strong)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                    >
                      {l.label}<span style={{ color: "var(--text-muted)" }}>→</span>
                    </a>
                  ))}
                </div>
              </section>
            </>
          )}

        </div>
      </main>
    </div>
  );
}