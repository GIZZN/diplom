"use client";

import { useEffect, useState, useId, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  Download,
  LogIn,
  SlidersHorizontal,
  Sparkles,
  Zap,
  Infinity as InfinityIcon,
  Check,
  ArrowRight,
  ChevronDown,
  EyeOff,
  Monitor,
  CreditCard,
  Lock,
} from "lucide-react";
import styles from "./page.module.css";
import Background from "./components/Background";
import BackgroundPaths from "./bg/BackgroundPaths";
import DownloadDropdown from "./components/DownloadDropdown";
import GridDistortion from "./components/name/GridDistortion";

interface AuthUser {
  name: string;
  avatar: string | null;
}

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

function IconStar({ size = 13 }: { size?: number; color?: string }) {
  const uid = useId().replace(/:/g, "");
  const g = `tgstar-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}
    >
      <defs>
        <linearGradient
          id={g}
          x1="3"
          y1="2"
          x2="20"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.5" stopColor="#ffc01f" />
          <stop offset="1" stopColor="#f29e00" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.4664 17.7532L6.96555 20.5105C6.49754 20.7972 5.88574 20.6502 5.59904 20.1822C5.45901 19.9536 5.41726 19.6782 5.48327 19.4184L6.18 16.676C6.4315 15.6861 7.10892 14.8586 8.02968 14.4165L12.9399 12.059C13.1688 11.9491 13.2653 11.6745 13.1553 11.4455C13.0663 11.2602 12.8651 11.1564 12.6624 11.1915L7.19676 12.1377C6.08572 12.3301 4.94636 12.0233 4.08213 11.299L2.35549 9.85207C1.93483 9.49955 1.8796 8.87276 2.23212 8.45211C2.40357 8.24752 2.65013 8.1205 2.91625 8.09968L8.19167 7.68682C8.56437 7.65765 8.88916 7.4218 9.03224 7.07642L11.0674 2.16367C11.2774 1.65662 11.8588 1.41586 12.3658 1.62591C12.6093 1.72677 12.8027 1.92021 12.9036 2.16367L14.9388 7.07642C15.0818 7.4218 15.4066 7.65765 15.7793 7.68682L21.0837 8.10194C21.6309 8.14477 22.0397 8.62304 21.9969 9.17021C21.9763 9.43343 21.8518 9.67763 21.6509 9.84891L17.6055 13.2978C17.3207 13.5405 17.1964 13.9227 17.284 14.2866L18.5277 19.4531C18.6561 19.9867 18.3277 20.5234 17.7941 20.6519C17.5377 20.7136 17.2673 20.6709 17.0424 20.5331L12.5046 17.7532C12.186 17.5581 11.7849 17.5581 11.4664 17.7532Z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <Background />
      <div className={styles.content}>
        <Header />
        <Hero />
        <Features />
        <How />
        <Pricing />
        <Faq />
        <FinalCta />
        <Footer />
        <DistortionBanner />
      </div>
    </div>
  );
}

function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}
    >
      <div className={styles.headerInner}>
        <div className={styles.logoWrap}>
          <Logo size={24} />
          <span className={styles.logoName}>
            interview<span className={styles.logoDot}>.</span>ai
          </span>
        </div>
        <nav className={styles.nav}>
          <a href="#features" className={styles.navLink}>
            Возможности
          </a>
          <a href="#how" className={styles.navLink}>
            Как работает
          </a>
          <a href="#pricing" className={styles.navLink}>
            Тарифы
          </a>
          <a href="#faq" className={styles.navLink}>
            FAQ
          </a>
        </nav>
        <div className={styles.headerActions}>
          {user ? (
            <a href="/dashboard" className={styles.userChip}>
              <div className={styles.userChipAvatar}>
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt=""
                    width={24}
                    height={24}
                    className={styles.userChipAvatarImg}
                  />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className={styles.userChipName}>
                {user.name.split(" ")[0]}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14m-5-5l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ) : (
            <a href="/auth" className={styles.loginBtn}>
              Войти
            </a>
          )}
          <DownloadDropdown
            align="right"
            trigger={
              <span className={styles.ctaBtn}>
                Скачать
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14m-5-5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            }
          />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroPaths} aria-hidden="true">
        <BackgroundPaths />
      </div>

      <div className={styles.heroContent}>
        <a href="#features" className={styles.heroBadge}>
          <span className={styles.badgeDot} />
          <span>Новая версия 2.0</span>
          <span className={styles.badgeDivider} />
          <span className={styles.badgeMuted}>Посмотреть →</span>
        </a>

        <h1 className={styles.heroTitle}>
          Собеседования
          <br />
          <span className={styles.heroAccent}>без страха.</span>
        </h1>

        <p className={styles.heroSub}>
          Десктоп-приложение с ИИ-ассистентом.
          <br />
          Невидимые подсказки, практика и обратная связь в реальном времени.
        </p>

        <div className={styles.heroCtas}>
          <DownloadDropdown
            align="center"
            trigger={
              <span className={styles.heroCtaPrimary}>
                Скачать бесплатно
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14m-7-7l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            }
          />
          <a href="#how" className={styles.heroCtaSecondary}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polygon points="6 4 20 12 6 20" fill="currentColor" />
            </svg>
            Демо 2 мин
          </a>
        </div>

        <div className={styles.trustRow}>
          <span className={styles.trustLabel}>Доверяют инженеры из</span>
          <div className={styles.trustLogos}>
            <span>YANDEX</span>
            <span>VK</span>
            <span>TINKOFF</span>
            <span>AVITO</span>
            <span>OZON</span>
          </div>
        </div>
      </div>

      <AppPreview />
    </section>
  );
}

function AppPreview() {
  return (
    <div className={styles.appPreview}>
      <div className={styles.appGlow} aria-hidden="true" />
      <div className={styles.appWindow}>
        <div className={styles.appTitleBar}>
          <div className={styles.appDots}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.appTitle}>
            <Logo size={12} /> interview.ai
          </div>
          <div className={styles.appTitleSpacer} />
        </div>
        <div className={styles.appBody}>
          <aside className={styles.appSidebar}>
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarTitle}>Навигация</div>
              <div className={styles.sidebarSub}>Интервью-ассистент</div>
            </div>
            <div className={styles.sidebarItem}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              Ассистент
            </div>
            <div
              className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Чат
            </div>
            <div className={styles.sidebarItem}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
              </svg>
              Горячие клавиши
            </div>
            <div className={styles.sidebarItem}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Скрытность
            </div>
            <div className={styles.sidebarItem}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Аналитика
            </div>
          </aside>
          <main className={styles.appMain}>
            <div className={styles.appMainHeader}>
              <h3 className={styles.appMainTitle}>Интервью-ассистент</h3>
              <span className={styles.onlineBadge}>
                <span /> Онлайн
              </span>
            </div>
            <div className={styles.chatMsg}>
              <div className={styles.msgHeader}>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>{" "}
                Ассистент · 19:24
              </div>
              <p>Готов помочь. Укажите роль и технологии.</p>
            </div>
            <div className={`${styles.chatMsg} ${styles.chatMsgUser}`}>
              <div className={styles.msgHeader}>Вы · 19:24</div>
              <p>Frontend разработчик, React + TypeScript</p>
            </div>
            <div className={styles.chatMsg}>
              <div className={styles.msgHeader}>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>{" "}
                Ассистент · 19:24
              </div>
              <p>Отлично. Начнём с virtual DOM — как он работает?</p>
            </div>
            <div className={styles.typing}>
              <span />
              <span />
              <span />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section className={styles.features} id="features">
      <div className={styles.featuresBg} aria-hidden="true" />
      <div className={styles.sectionHeader}>
        <div className={styles.eyebrow}>Возможности</div>
        <h2 className={styles.sectionTitle}>
          Всё в одном окне.
          <br />
          <span className={styles.muted}>Ничего лишнего.</span>
        </h2>
      </div>

      <div className={styles.bentoGrid}>
        <div className={`${styles.bento} ${styles.bentoLarge}`}>
          <div className={styles.bentoLabel}>01 / Чат</div>
          <h3 className={styles.bentoTitle}>Контекстный ИИ-чат</h3>
          <p className={styles.bentoText}>
            Укажите роль и стек — ответы адаптируются под вашу вакансию.
          </p>
          <div className={styles.miniChat}>
            <div className={styles.miniMsg}>Расскажи про event loop</div>
            <div className={styles.miniMsgUser}>
              Он управляет очередями задач...
            </div>
            <div className={styles.miniTyping}>
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className={styles.bento}>
          <div className={styles.bentoLabel}>02 / Горячие клавиши</div>
          <h3 className={styles.bentoTitle}>Невидимое управление</h3>
          <p className={styles.bentoText}>
            Глобальные хоткеи — открывайте ассистента поверх любого окна.
          </p>
          <div className={styles.kbdRow}>
            <kbd>⌘</kbd>
            <kbd>⇧</kbd>
            <kbd>I</kbd>
          </div>
        </div>

        <div className={`${styles.bento} ${styles.bentoStealth}`}>
          <div className={styles.bentoLabel}>03 / Скрытность</div>
          <h3 className={styles.bentoTitle}>Режим невидимки</h3>
          <p className={styles.bentoText}>
            Окно не попадает в скриншоты и запись экрана.
          </p>
          <div className={styles.stealthDots}>
            <div className={styles.stealthDot} />
            <div className={styles.stealthDot} />
            <div className={styles.stealthDot} />
          </div>
        </div>

        <div className={styles.bento}>
          <div className={styles.bentoLabel}>04 / Аналитика</div>
          <h3 className={styles.bentoTitle}>Прогресс и слабые места</h3>
          <p className={styles.bentoText}>
            Отчёты по темам, трекинг роста навыков.
          </p>
          <div className={styles.bars}>
            <div className={styles.bar} style={{ height: "35%" }} />
            <div className={styles.bar} style={{ height: "60%" }} />
            <div className={styles.bar} style={{ height: "45%" }} />
            <div className={styles.bar} style={{ height: "80%" }} />
            <div className={styles.bar} style={{ height: "95%" }} />
            <div className={styles.bar} style={{ height: "70%" }} />
          </div>
        </div>

        <div className={`${styles.bento} ${styles.bentoWide}`}>
          <div className={styles.bentoLabel}>05 / Платформа</div>
          <h3 className={styles.bentoTitle}>Нативно на Windows</h3>
          <p className={styles.bentoText}>
            Быстрый старт, минимум ресурсов. Один файл — и запустили.
          </p>
          <div className={styles.ideList}>
            <div className={styles.ideChip}>Windows 10/11</div>
          </div>
        </div>
      </div>
    </section>
  );
}

const HOW_STEPS = [
  {
    icon: Download,
    t: "Скачайте приложение",
    d: "Windows 10/11. Установка в один клик.",
  },
  {
    icon: LogIn,
    t: "Авторизуйтесь",
    d: "Вход через браузер, сессия синхронизируется автоматически.",
  },
  {
    icon: SlidersHorizontal,
    t: "Задайте контекст",
    d: "Укажите роль, стек, уровень — ИИ настроит ответы.",
  },
  {
    icon: Sparkles,
    t: "Практикуйтесь",
    d: "Хоткей вызывает ассистента поверх любого окна.",
  },
];

function How() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 75%", "end 60%"],
  });
  const lineScale = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <section className={styles.how} id="how">
      <div className={styles.howBg} aria-hidden="true">
        <div className={styles.howGrid} />
      </div>
      <div className={styles.howAside}>
        <div className={styles.eyebrow}>Как работает</div>
        <h2 className={styles.howTitle}>
          Четыре шага
          <br />
          от установки
          <br />
          <span className={styles.howTitleAccent}>до оффера.</span>
        </h2>
        <p className={styles.howAsideText}>
          Ничего настраивать вручную не нужно — приложение готово к работе сразу
          после установки.
        </p>
      </div>

      <div className={styles.timeline} ref={trackRef}>
        <div className={styles.timelineTrack} aria-hidden="true">
          <motion.div
            className={styles.timelineFill}
            style={{ scaleY: lineScale }}
          />
        </div>
        {HOW_STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              className={styles.tlStep}
              key={s.t}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className={styles.tlMarker}>
                <Icon size={20} strokeWidth={1.75} />
                <span className={styles.tlMarkerNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className={styles.tlCard}>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

const PLANS = [
  {
    id: "monthly",
    name: "Pro",
    tag: "30 дней",
    icon: Zap,
    price: "500",
    unit: "Stars / мес",
    lead: "Полный доступ ко всем функциям за",
    highlight: "500 Stars в месяц",
    tail: "— с отменой в любой момент.",
    cta: "Оформить подписку",
    featured: false,
    features: [
      "Безлимитные сессии",
      "GPT-4 / Claude Opus",
      "Режим скрытности",
      "Аналитика и прогресс",
      "Приоритетная поддержка",
      "Экспорт данных",
    ],
  },
  {
    id: "lifetime",
    name: "Pro навсегда",
    tag: "",
    icon: InfinityIcon,
    price: "2 000",
    unit: "Stars разово",
    lead: "Заплатите один раз",
    highlight: "2 000 Stars",
    tail: "и пользуйтесь навсегда — без продлений и списаний.",
    cta: "Купить навсегда",
    featured: true,
    features: [
      "Всё из подписки Pro",
      "Безлимитные сессии",
      "GPT-4 / Claude Opus",
      "Режим скрытности",
      "Аналитика и прогресс",
      "Доступ навсегда без продлений",
    ],
  },
];

function Pricing() {
  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.pricingBg} aria-hidden="true">
        <div className={styles.spotlight} />
      </div>
      <div className={styles.pricingInner}>
        <div className={styles.sectionHeader}>
          <div className={styles.eyebrow}>Тарифы</div>
          <h2 className={styles.sectionTitle}>
            Простая цена.
            <br />
            <span className={styles.muted}>Без сюрпризов.</span>
          </h2>
        </div>

        <div className={styles.pricingGrid}>
          {PLANS.map((plan, i) => {
            const PlanIcon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                className={`${styles.planCard} ${plan.featured ? styles.planCardPro : ""}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6 }}
              >
                {plan.featured && (
                  <div className={styles.proBadge}>
                    <Sparkles size={11} strokeWidth={2.4} />
                    Выгодно
                  </div>
                )}

                <div className={styles.planPreview}>
                  <div className={styles.planPreviewHead}>
                    <span className={styles.planIcon}>
                      <PlanIcon size={16} strokeWidth={2} />
                    </span>
                    <span className={styles.planPreviewName}>{plan.name}</span>
                    <span className={styles.planPreviewTag}>{plan.tag}</span>
                  </div>

                  <div className={styles.planPreviewPrice}>
                    {plan.price}
                    <span>
                      <IconStar size={16} color="#fbbf24" /> {plan.unit}
                    </span>
                  </div>

                  <ul className={styles.planPreviewList}>
                    {plan.features.map((f) => (
                      <li key={f}>
                        <Check size={14} strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.planPreviewFade} aria-hidden="true" />
                </div>

                <div className={styles.planBody}>
                  <span className={styles.planBodyLogo}>
                    interview<span className={styles.logoDot}>.</span>ai
                  </span>
                  <p className={styles.planClaim}>
                    {plan.lead}{" "}
                    <span className={styles.planClaimAccent}>
                      {plan.highlight}
                    </span>{" "}
                    {plan.tail}
                  </p>
                  <Link
                    href={`/checkout?plan=${plan.id}`}
                    className={styles.planLink}
                  >
                    {plan.cta}
                    <span className={styles.planLinkArrow}>
                      <ArrowRight size={15} strokeWidth={2.4} />
                    </span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    icon: EyeOff,
    tag: "Приватность",
    q: "Видно ли ассистента во время звонка?",
    a: "Нет. Окно исключается из записи экрана и скриншотов на уровне OS — собеседник видит только вашу презентацию или камеру.",
  },
  {
    icon: Monitor,
    tag: "Платформа",
    q: "На какой ОС работает?",
    a: "Windows 10/11. Нативная сборка — установщик с ярлыком или portable-версия, которая запускается без установки.",
  },
  {
    icon: CreditCard,
    tag: "Оплата",
    q: "Можно ли отменить подписку?",
    a: "Да, в любой момент. Деньги вернутся за неиспользованный период, доступ сохранится до конца оплаченного срока.",
  },
  {
    icon: Lock,
    tag: "Данные",
    q: "Данные остаются конфиденциальными?",
    a: "Запросы не сохраняются дольше 24 часов и не используются для обучения моделей. История сессий хранится только у вас.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className={styles.faq} id="faq">
      <div className={styles.faqAside}>
        <div className={styles.eyebrow}>Частые вопросы</div>
        <h2 className={styles.faqTitle}>
          Остались
          <br />
          вопросы?
          <br />
          <span className={styles.faqTitleAccent}>Есть ответы.</span>
        </h2>
        <p className={styles.faqAsideText}>
          Не нашли нужное — напишите, ответим в течение дня.
        </p>
        <a href="#pricing" className={styles.faqAsideLink}>
          Посмотреть тарифы
          <ArrowRight size={15} strokeWidth={2.2} />
        </a>
      </div>

      <div className={styles.faqGrid}>
        {FAQS.map((f, i) => {
          const Icon = f.icon;
          const isOpen = open === i;
          return (
            <motion.div
              key={f.q}
              className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                className={styles.faqTrigger}
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className={styles.faqIconBox}>
                  <Icon size={16} strokeWidth={1.9} />
                </span>
                <span className={styles.faqQuestion}>
                  <span className={styles.faqTag}>{f.tag}</span>
                  {f.q}
                </span>
                <motion.span
                  className={styles.faqChevron}
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ChevronDown size={18} strokeWidth={2} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className={styles.faqBody}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function DistortionBanner() {
  return (
    <section className={styles.distortion}>
      <div className={styles.distortionCanvas}>
        <GridDistortion
          imageSrc="/logobot.png"
          grid={10}
          mouse={0.25}
          strength={0.15}
          relaxation={0.9}
        />
      </div>
    </section>
  );
}

const CTA_POINTS = [
  { icon: Monitor, label: "Windows 10/11" },
  { icon: EyeOff, label: "Невидимо для шаринга" },
  { icon: Zap, label: "Установка в один клик" },
];

function FinalCta() {
  const mx = useMotionValue(50);
  const my = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${mx}% ${my}%, rgba(28,221,164,0.16), transparent 70%)`;

  return (
    <section className={styles.finalCta}>
      <motion.div
        className={styles.ctaCard}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set(((e.clientX - r.left) / r.width) * 100);
          my.set(((e.clientY - r.top) / r.height) * 100);
        }}
      >
        <div className={styles.ctaBeam} aria-hidden="true" />
        <div className={styles.ctaGrid} aria-hidden="true" />
        <motion.div
          className={styles.ctaSpot}
          style={{ background: spotlight }}
          aria-hidden="true"
        />

        <div className={styles.ctaContent}>
          <div className={styles.eyebrow}>
            <Sparkles size={12} />
            Последний шаг
          </div>

          <h2 className={styles.ctaTitle}>
            Готовы к <span className={styles.ctaAccent}>офферу мечты</span>?
          </h2>
          <p className={styles.ctaText}>
            Установите за 30 секунд. Первая сессия бесплатно.
          </p>

          <div className={styles.ctaButtons}>
            <DownloadDropdown
              align="center"
              trigger={
                <span className={styles.ctaPrimary}>
                  Скачать бесплатно
                  <span className={styles.ctaPrimaryArrow}>
                    <ArrowRight size={15} />
                  </span>
                </span>
              }
            />
            <a href="#pricing" className={styles.ctaSecondary}>
              Сравнить тарифы
            </a>
          </div>

          <ul className={styles.ctaPoints}>
            {CTA_POINTS.map((p, i) => (
              <motion.li
                key={p.label}
                className={styles.ctaPoint}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.25 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <p.icon size={14} />
                {p.label}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Logo size={22} />
            <span>interview.ai</span>
          </div>
          <div className={styles.footerCols}>
            <div>
              <div className={styles.footerColTitle}>Продукт</div>
              <a href="#features">Возможности</a>
              <a href="#pricing">Тарифы</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <div className={styles.footerColTitle}>Компания</div>
              <a href="#">О нас</a>
              <a href="#">Блог</a>
              <a href="#">Контакты</a>
            </div>
            <div>
              <div className={styles.footerColTitle}>Правовое</div>
              <a href="/privacy">Конфиденциальность</a>
              <a href="/terms">Условия</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2026 interview.ai · Все права защищены</p>
          <div className={styles.socials}>
            <a href="#" aria-label="GitHub">
              GH
            </a>
            <a href="#" aria-label="Twitter">
              TW
            </a>
            <a href="#" aria-label="Telegram">
              TG
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
