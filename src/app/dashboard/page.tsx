"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bug,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Cpu,
  Download,
  HelpCircle,
  ImageIcon,
  KeyRound,
  LayoutGrid,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Mic,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import styles from "./dashboard.module.css";
import DownloadDropdown from "../components/DownloadDropdown";

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

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV: { id: NavItem; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", label: "Обзор", icon: LayoutGrid },
  { id: "sessions", label: "Сессии", icon: MessageSquare },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "settings", label: "Настройки", icon: Settings },
  { id: "help", label: "Помощь", icon: HelpCircle },
];

const PAGE_META: Record<NavItem, { title: string; sub: string }> = {
  dashboard: { title: "Обзор", sub: "Сводка активности и быстрый доступ к приложению" },
  sessions: { title: "Сессии", sub: "История вопросов и ответов из desktop-приложения" },
  analytics: { title: "Аналитика", sub: "Динамика использования и распределение по типам" },
  settings: { title: "Настройки", sub: "Профиль, аккаунт и безопасность" },
  help: { title: "Помощь", sub: "Начало работы, горячие клавиши и поддержка" },
};

const SESSION_TYPES: Record<string, { label: string; icon: typeof Mic }> = {
  live_answer: { label: "Голос", icon: Mic },
  screen_analysis: { label: "Экран", icon: ImageIcon },
  chat_message: { label: "Чат", icon: MessageSquare },
};

function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

function typeMeta(type: string) {
  return SESSION_TYPES[type] ?? { label: type, icon: MessageSquare };
}

function shortModel(model: string | null) {
  if (!model) return "—";
  return model.split("/").pop()?.split(":")[0] ?? model;
}

function seconds(ms: number | null) {
  return ms ? `${(ms / 1000).toFixed(1)}с` : "—";
}

function Fade({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statIcon}>
        <Icon size={15} strokeWidth={1.9} />
      </span>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {hint && <span className={styles.statHint}>{hint}</span>}
    </div>
  );
}

function SectionHead({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {action}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MessageSquare;
  title: string;
  text: string;
}) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <Icon size={20} strokeWidth={1.7} />
      </span>
      <span className={styles.emptyTitle}>{title}</span>
      <span className={styles.emptyText}>{text}</span>
    </div>
  );
}

function SessionRow({
  session,
  expandable = false,
  expanded = false,
  onToggle,
}: {
  session: DesktopSession;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const { label, icon: Icon } = typeMeta(session.type);

  return (
    <div className={`${styles.row} ${expanded ? styles.rowOpen : ""}`}>
      <button
        className={styles.rowHead}
        onClick={onToggle}
        type="button"
        disabled={!expandable}
        aria-expanded={expandable ? expanded : undefined}
      >
        <span className={styles.rowType}>
          <Icon size={13} strokeWidth={2} />
          {label}
        </span>
        <span className={styles.rowQuestion}>{session.question || "Без вопроса"}</span>
        <span className={styles.rowModel}>{shortModel(session.model)}</span>
        <span className={styles.rowTime}>{seconds(session.response_time_ms)}</span>
        <span className={styles.rowDate}>
          {new Date(session.created_at).toLocaleString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {expandable && (
          <span className={styles.rowChevron}>
            <ChevronDown size={15} strokeWidth={2} />
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className={styles.rowBody}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className={styles.rowBodyInner}>
              {session.question && (
                <div className={styles.qa}>
                  <span className={styles.qaLabel}>Вопрос</span>
                  <p className={styles.qaText}>{session.question}</p>
                </div>
              )}
              {session.answer && (
                <div className={styles.qa}>
                  <span className={styles.qaLabel}>Ответ</span>
                  <p className={styles.qaText}>{session.answer}</p>
                </div>
              )}
              {session.tokens_used && (
                <span className={styles.qaMeta}>{session.tokens_used} токенов</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TableHead() {
  return (
    <div className={styles.tableHead}>
      <span>Тип</span>
      <span>Вопрос</span>
      <span>Модель</span>
      <span>Время</span>
      <span>Дата</span>
      <span />
    </div>
  );
}

function Skeleton() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logoRow}>
            <Logo />
            <span className={styles.logoText}>
              interview<span className={styles.logoDot}>.</span>ai
            </span>
          </div>
          <div className={styles.nav}>
            {NAV.map((n) => (
              <span key={n.id} className={styles.skelNav} />
            ))}
          </div>
        </div>
      </aside>
      <main className={styles.main}>
        <div className={styles.content}>
          <span className={styles.skelTitle} />
          <div className={styles.statsRow}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={styles.skelCard} />
            ))}
          </div>
          <span className={styles.skelBlock} />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [desktopSessions, setDesktopSessions] = useState<DesktopSession[]>([]);
  const [desktopStats, setDesktopStats] = useState({
    total: 0,
    today: 0,
    avg_response_ms: null as number | null,
  });

  const [sessionFilter, setSessionFilter] = useState("all");
  const [allSessions, setAllSessions] = useState<DesktopSession[]>([]);
  const [sessionsOffset, setSessionsOffset] = useState(0);
  const [sessionsHasMore, setSessionsHasMore] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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
        if (!data.user) {
          router.replace("/auth");
          return;
        }
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
        const todayCount = d.sessions.filter(
          (s: DesktopSession) => new Date(s.created_at).toDateString() === today,
        ).length;
        const withTime = d.sessions.filter((s: DesktopSession) => s.response_time_ms);
        const avgMs = withTime.length
          ? Math.round(
              withTime.reduce(
                (a: number, s: DesktopSession) => a + (s.response_time_ms ?? 0),
                0,
              ) / withTime.length,
            )
          : null;
        setDesktopStats({ total: d.sessions.length, today: todayCount, avg_response_ms: avgMs });
      })
      .catch(() => {});
  }

  async function loadSessions(filter = "all", offset = 0, append = false) {
    setSessionsLoading(true);
    const url =
      filter === "all"
        ? `/api/desktop/sessions?limit=20&offset=${offset}`
        : `/api/desktop/sessions?limit=20&offset=${offset}&type=${filter}`;
    try {
      const res = await fetch(url);
      const d = await res.json();
      if (d.sessions) {
        setAllSessions((prev) => (append ? [...prev, ...d.sessions] : d.sessions));
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
      if (res.ok) setUser((u) => (u ? { ...u, avatar: data.avatar } : u));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAvatarRemove() {
    await fetch("/api/auth/avatar", { method: "DELETE" });
    setUser((u) => (u ? { ...u, avatar: null } : u));
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileMsg("");
    setProfileError("");
    const body: Record<string, string> = {};
    if (profileName.trim() !== user?.name) body.name = profileName.trim();
    if (newPassword) {
      body.current_password = currentPassword;
      body.new_password = newPassword;
    }
    if (!Object.keys(body).length) {
      setProfileError("Нет изменений");
      setProfileSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) {
        setProfileError(d.error ?? "Ошибка");
        return;
      }
      setUser((u) => (u ? { ...u, name: d.user.name } : u));
      setProfileMsg("Сохранено");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setProfileError("Ошибка соединения");
    } finally {
      setProfileSaving(false);
    }
  }

  if (loading) return <Skeleton />;

  const firstName = user?.name?.split(" ")[0] ?? "Пользователь";
  const isPro = user?.plan === "pro";
  const meta = PAGE_META[activeNav];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logoRow}>
            <Logo />
            <span className={styles.logoText}>
              interview<span className={styles.logoDot}>.</span>ai
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Разделы">
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = activeNav === id;
              return (
                <button
                  key={id}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  onClick={() => handleNavClick(id)}
                  type="button"
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="navActive"
                      className={styles.navActiveBg}
                      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.7 }}
                    />
                  )}
                  <Icon size={16} strokeWidth={1.9} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          {!isPro && (
            <div className={styles.upsell}>
              <span className={styles.upsellIcon}>
                <Sparkles size={14} strokeWidth={2} />
              </span>
              <span className={styles.upsellTitle}>Тариф Free</span>
              <span className={styles.upsellText}>
                Безлимитные сессии и приоритетные модели — в Pro.
              </span>
              <Link href="/#pricing" className={styles.upsellBtn}>
                Улучшить план
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
            </div>
          )}

          <div className={styles.userCard}>
            <button
              className={styles.avatarBtn}
              onClick={() => fileInputRef.current?.click()}
              title="Сменить аватар"
              type="button"
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt=""
                  width={34}
                  height={34}
                  className={styles.avatarImg}
                />
              ) : (
                <span className={styles.avatarInitial}>
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </span>
              )}
              <span className={styles.avatarOverlay}>
                {avatarUploading ? (
                  <Loader2 size={13} className={styles.spinner} />
                ) : (
                  <Plus size={13} strokeWidth={2.4} />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.fileInput}
              onChange={handleAvatarChange}
            />
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
            <span className={`${styles.plan} ${isPro ? styles.planPro : ""}`}>
              {isPro ? "Pro" : "Free"}
            </span>
          </div>

          {user?.role === "admin" && (
            <Link href="/admin" className={styles.sideLink}>
              <Shield size={15} strokeWidth={1.9} />
              Админ-панель
            </Link>
          )}
          <button className={styles.sideLink} onClick={handleLogout} type="button">
            <LogOut size={15} strokeWidth={1.9} />
            Выйти
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.topBarInner}>
            <div>
              <h1 className={styles.pageTitle}>{meta.title}</h1>
              <p className={styles.pageSub}>{meta.sub}</p>
            </div>
            <DownloadDropdown
              align="right"
              trigger={
                <span className={styles.primaryBtn}>
                  <Download size={15} strokeWidth={2} />
                  Скачать приложение
                </span>
              }
            />
          </div>
        </header>

        <div className={styles.content}>
          {activeNav === "dashboard" && (
            <>
              <Fade>
                <section className={styles.hero}>
                  <div className={styles.heroGlow} aria-hidden="true" />
                  <div className={styles.heroText}>
                    <span className={styles.heroEyebrow}>
                      <Sparkles size={12} strokeWidth={2.2} />
                      Рабочее место
                    </span>
                    <h2 className={styles.heroTitle}>Привет, {firstName}</h2>
                    <p className={styles.heroSub}>
                      Запустите desktop-приложение и начните сессию — история и статистика
                      появятся здесь автоматически.
                    </p>
                  </div>
                  <div className={styles.heroActions}>
                    <DownloadDropdown
                      align="left"
                      trigger={
                        <span className={styles.primaryBtn}>
                          Скачать для Windows
                          <ArrowRight size={15} strokeWidth={2.2} />
                        </span>
                      }
                    />
                    <button
                      className={styles.ghostBtn}
                      onClick={() => handleNavClick("help")}
                      type="button"
                    >
                      Как начать
                    </button>
                  </div>
                </section>
              </Fade>

              <Fade delay={0.06}>
                <section className={styles.statsRow}>
                  <StatCard
                    icon={Activity}
                    label="Сессий сегодня"
                    value={desktopStats.today}
                  />
                  <StatCard
                    icon={MessageSquare}
                    label="Последних сессий"
                    value={desktopStats.total}
                  />
                  <StatCard
                    icon={Clock}
                    label="Среднее время ответа"
                    value={seconds(desktopStats.avg_response_ms)}
                  />
                </section>
              </Fade>

              <Fade delay={0.12}>
                <section>
                  <SectionHead
                    title="Последние сессии"
                    action={
                      <button
                        className={styles.linkBtn}
                        onClick={() => handleNavClick("sessions")}
                        type="button"
                      >
                        Все сессии
                        <ArrowUpRight size={14} strokeWidth={2.2} />
                      </button>
                    }
                  />
                  {desktopSessions.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="Сессий пока нет"
                      text="Запустите приложение и задайте первый вопрос — записи появятся здесь."
                    />
                  ) : (
                    <div className={styles.table}>
                      <TableHead />
                      {desktopSessions.slice(0, 5).map((s) => (
                        <SessionRow key={s.id} session={s} />
                      ))}
                    </div>
                  )}
                </section>
              </Fade>
            </>
          )}

          {activeNav === "sessions" && (
            <>
              <Fade>
                <div className={styles.toolbar}>
                  <div className={styles.filters}>
                    {[
                      { key: "all", label: "Все" },
                      { key: "chat_message", label: "Чат" },
                      { key: "live_answer", label: "Голос" },
                      { key: "screen_analysis", label: "Экран" },
                    ].map((f) => {
                      const active = sessionFilter === f.key;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          className={`${styles.filter} ${active ? styles.filterActive : ""}`}
                          onClick={() => {
                            setSessionFilter(f.key);
                            setAllSessions([]);
                            setSessionsOffset(0);
                            setExpandedSession(null);
                            loadSessions(f.key, 0);
                          }}
                        >
                          {active && (
                            <motion.span
                              layoutId="filterActive"
                              className={styles.filterBg}
                              transition={{ duration: 0.26, ease: EASE }}
                            />
                          )}
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span className={styles.counter}>{allSessions.length} записей</span>
                </div>
              </Fade>

              <Fade delay={0.06}>
                {sessionsLoading && allSessions.length === 0 ? (
                  <div className={styles.loadingBox}>
                    <Loader2 size={18} className={styles.spinner} />
                    Загружаем сессии…
                  </div>
                ) : allSessions.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="Ничего не найдено"
                    text="По выбранному фильтру записей нет. Попробуйте другой тип сессии."
                  />
                ) : (
                  <div className={styles.table}>
                    <TableHead />
                    {allSessions.map((s) => (
                      <SessionRow
                        key={s.id}
                        session={s}
                        expandable
                        expanded={expandedSession === s.id}
                        onToggle={() =>
                          setExpandedSession(expandedSession === s.id ? null : s.id)
                        }
                      />
                    ))}
                  </div>
                )}
              </Fade>

              {sessionsHasMore && (
                <button
                  className={styles.loadMore}
                  onClick={() => loadSessions(sessionFilter, sessionsOffset, true)}
                  disabled={sessionsLoading}
                  type="button"
                >
                  {sessionsLoading ? (
                    <Loader2 size={15} className={styles.spinner} />
                  ) : (
                    <ChevronDown size={15} strokeWidth={2.2} />
                  )}
                  Загрузить ещё
                </button>
              )}
            </>
          )}

          {activeNav === "analytics" &&
            (analyticsLoading || !analytics ? (
              <div className={styles.loadingBox}>
                <Loader2 size={18} className={styles.spinner} />
                Считаем аналитику…
              </div>
            ) : (
              <>
                <Fade>
                  <section className={styles.statsRow}>
                    <StatCard icon={Activity} label="Всего сессий" value={analytics.total} />
                    <StatCard icon={CalendarDays} label="Сегодня" value={analytics.today} />
                    <StatCard icon={TrendingUp} label="За 7 дней" value={analytics.last_7d} />
                    <StatCard
                      icon={Clock}
                      label="Среднее время"
                      value={seconds(analytics.avg_ms)}
                    />
                  </section>
                </Fade>

                {analytics.by_day.length > 0 && (
                  <Fade delay={0.06}>
                    <section>
                      <SectionHead title="Сессии за 14 дней" />
                      <div className={styles.panel}>
                        <div className={styles.chart}>
                          {(() => {
                            const max = Math.max(...analytics.by_day.map((d) => d.count), 1);
                            return analytics.by_day.map((d, i) => (
                              <div key={d.date} className={styles.chartCol}>
                                <span className={styles.chartValue}>{d.count}</span>
                                <motion.span
                                  className={styles.chartBar}
                                  initial={{ height: "2%" }}
                                  animate={{
                                    height: `${Math.max((d.count / max) * 100, 4)}%`,
                                  }}
                                  transition={{
                                    duration: 0.6,
                                    delay: i * 0.04,
                                    ease: EASE,
                                  }}
                                />
                                <span className={styles.chartLabel}>{d.date}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </section>
                  </Fade>
                )}

                {analytics.by_type.length > 0 && (
                  <Fade delay={0.12}>
                    <section>
                      <SectionHead title="Распределение по типу" />
                      <div className={styles.panel}>
                        {analytics.by_type.map((t, i) => {
                          const pct = analytics.total
                            ? Math.round((t.count / analytics.total) * 100)
                            : 0;
                          const { label, icon: Icon } = typeMeta(t.type);
                          return (
                            <div key={t.type} className={styles.distRow}>
                              <span className={styles.distLabel}>
                                <Icon size={14} strokeWidth={1.9} />
                                {label}
                              </span>
                              <span className={styles.distTrack}>
                                <motion.span
                                  className={styles.distFill}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{
                                    duration: 0.7,
                                    delay: 0.1 + i * 0.08,
                                    ease: EASE,
                                  }}
                                />
                              </span>
                              <span className={styles.distValue}>
                                {t.count}
                                <span className={styles.distPct}>{pct}%</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </Fade>
                )}

                {analytics.top_models.length > 0 && (
                  <Fade delay={0.18}>
                    <section>
                      <SectionHead title="Топ моделей" />
                      <div className={styles.panel}>
                        {analytics.top_models.map((m, i) => (
                          <div key={m.model} className={styles.modelRow}>
                            <span className={styles.modelRank}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className={styles.modelIcon}>
                              <Cpu size={14} strokeWidth={1.9} />
                            </span>
                            <span className={styles.modelName}>{shortModel(m.model)}</span>
                            <span className={styles.modelCount}>{m.count} сессий</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </Fade>
                )}
              </>
            ))}

          {activeNav === "settings" && (
            <>
              <Fade>
                <section className={styles.profilePanel}>
                  <button
                    className={styles.profileAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    title="Сменить аватар"
                    type="button"
                  >
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt=""
                        width={72}
                        height={72}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.profileInitial}>
                        {user?.name?.charAt(0).toUpperCase() ?? "U"}
                      </span>
                    )}
                    <span className={styles.avatarOverlay}>
                      {avatarUploading ? (
                        <Loader2 size={16} className={styles.spinner} />
                      ) : (
                        <Plus size={16} strokeWidth={2.4} />
                      )}
                    </span>
                  </button>

                  <div className={styles.profileIdentity}>
                    <span className={styles.profileName}>{user?.name}</span>
                    <span className={styles.profileEmail}>{user?.email}</span>
                  </div>

                  <div className={styles.profileSide}>
                    <span className={`${styles.plan} ${isPro ? styles.planPro : ""}`}>
                      {isPro ? "Pro" : "Free"}
                    </span>
                    {user?.avatar && (
                      <button
                        className={styles.dangerLink}
                        onClick={handleAvatarRemove}
                        type="button"
                      >
                        <Trash2 size={13} strokeWidth={2} />
                        Удалить фото
                      </button>
                    )}
                  </div>
                </section>
              </Fade>

              <Fade delay={0.06}>
                <section className={styles.statsRow}>
                  <StatCard
                    icon={Sparkles}
                    label="Тариф"
                    value={isPro ? "Pro" : "Free"}
                    hint={isPro ? "Полный доступ" : "Базовые возможности"}
                  />
                  <StatCard
                    icon={CalendarDays}
                    label="Подписка"
                    value={
                      isPro
                        ? user?.pro_expires_at
                          ? new Date(user.pro_expires_at).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Навсегда"
                        : "Не активна"
                    }
                  />
                  <StatCard
                    icon={UserIcon}
                    label="С нами с"
                    value={
                      user?.created_at
                        ? new Date(user.created_at).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"
                    }
                  />
                </section>
              </Fade>

              <Fade delay={0.12}>
                <section>
                  <SectionHead title="Профиль" />
                  <div className={styles.panel}>
                    <div className={styles.formGrid}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="displayName">
                          Отображаемое имя
                        </label>
                        <div className={styles.inputWrap}>
                          <UserIcon size={15} strokeWidth={1.9} className={styles.inputIcon} />
                          <input
                            id="displayName"
                            className={styles.input}
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Ваше имя"
                          />
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="email">
                          Email
                        </label>
                        <div className={styles.inputWrap}>
                          <Mail size={15} strokeWidth={1.9} className={styles.inputIcon} />
                          <input
                            id="email"
                            className={styles.input}
                            type="email"
                            value={user?.email ?? ""}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {(profileError || profileMsg) && (
                        <motion.p
                          className={profileError ? styles.msgError : styles.msgOk}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.24, ease: EASE }}
                        >
                          {!profileError && <Check size={14} strokeWidth={2.4} />}
                          {profileError || profileMsg}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <div className={styles.formActions}>
                      <button
                        className={styles.primaryBtn}
                        onClick={handleProfileSave}
                        disabled={profileSaving}
                        type="button"
                      >
                        {profileSaving ? (
                          <Loader2 size={15} className={styles.spinner} />
                        ) : (
                          <>
                            Сохранить
                            <ArrowRight size={15} strokeWidth={2.2} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </section>
              </Fade>

              <Fade delay={0.18}>
                <section>
                  <SectionHead title="Безопасность" />
                  <div className={styles.panel}>
                    <div className={styles.formGrid}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="currentPassword">
                          Текущий пароль
                        </label>
                        <div className={styles.inputWrap}>
                          <KeyRound size={15} strokeWidth={1.9} className={styles.inputIcon} />
                          <input
                            id="currentPassword"
                            className={styles.input}
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                          />
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="newPassword">
                          Новый пароль
                        </label>
                        <div className={styles.inputWrap}>
                          <KeyRound size={15} strokeWidth={1.9} className={styles.inputIcon} />
                          <input
                            id="newPassword"
                            className={styles.input}
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Минимум 8 символов"
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                    </div>

                    <p className={styles.note}>
                      Если аккаунт создан через Google, смена пароля недоступна.
                    </p>

                    <div className={styles.formActions}>
                      <button
                        className={styles.primaryBtn}
                        onClick={handleProfileSave}
                        disabled={profileSaving || !currentPassword || !newPassword}
                        type="button"
                      >
                        {profileSaving ? (
                          <Loader2 size={15} className={styles.spinner} />
                        ) : (
                          <>
                            Сменить пароль
                            <ArrowRight size={15} strokeWidth={2.2} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </section>
              </Fade>
            </>
          )}

          {activeNav === "help" && (
            <>
              <Fade>
                <section className={styles.hero}>
                  <div className={styles.heroGlow} aria-hidden="true" />
                  <div className={styles.heroText}>
                    <span className={styles.heroEyebrow}>
                      <Download size={12} strokeWidth={2.2} />
                      Начало работы
                    </span>
                    <h2 className={styles.heroTitle}>Три шага до первой сессии</h2>
                    <p className={styles.heroSub}>
                      Скачайте приложение для Windows, войдите через браузер — сессия
                      синхронизируется автоматически.
                    </p>
                  </div>
                  <div className={styles.heroActions}>
                    <DownloadDropdown
                      align="left"
                      trigger={
                        <span className={styles.primaryBtn}>
                          Скачать приложение
                          <ArrowRight size={15} strokeWidth={2.2} />
                        </span>
                      }
                    />
                  </div>
                </section>
              </Fade>

              <Fade delay={0.06}>
                <section>
                  <SectionHead title="Горячие клавиши" />
                  <div className={styles.panel}>
                    {[
                      { keys: ["Ctrl", "Shift", "I"], action: "Открыть / скрыть ассистента" },
                      { keys: ["Ctrl", "Shift", "R"], action: "Начать новую сессию" },
                      { keys: ["Esc"], action: "Закрыть ассистент" },
                      { keys: ["Ctrl", "Enter"], action: "Отправить сообщение" },
                      { keys: ["Ctrl", "Shift", "C"], action: "Скопировать последний ответ" },
                    ].map((s) => (
                      <div key={s.action} className={styles.hotkeyRow}>
                        <span className={styles.kbdGroup}>
                          {s.keys.map((k) => (
                            <kbd key={k} className={styles.kbd}>
                              {k}
                            </kbd>
                          ))}
                        </span>
                        <span className={styles.hotkeyAction}>{s.action}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </Fade>

              <Fade delay={0.12}>
                <section>
                  <SectionHead title="Поддержка" />
                  <div className={styles.linkGrid}>
                    {[
                      {
                        icon: LifeBuoy,
                        label: "Написать в поддержку",
                        sub: "support@interview.ai",
                        href: "mailto:support@interview.ai",
                      },
                      {
                        icon: Bug,
                        label: "Сообщить об ошибке",
                        sub: "GitHub Issues",
                        href: "https://github.com/GIZZN/diplom/issues",
                      },
                    ].map(({ icon: Icon, label, sub, href }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkCard}
                      >
                        <span className={styles.linkIcon}>
                          <Icon size={16} strokeWidth={1.9} />
                        </span>
                        <span className={styles.linkLabel}>{label}</span>
                        <span className={styles.linkSub}>{sub}</span>
                        <ArrowUpRight size={15} strokeWidth={2} className={styles.linkArrow} />
                      </a>
                    ))}
                  </div>
                </section>
              </Fade>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
