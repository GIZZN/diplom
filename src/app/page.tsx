"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Background from "./components/Background";
import BackgroundPaths from "./bg/BackgroundPaths";
import DownloadDropdown from "./components/DownloadDropdown";

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

export default function Home() {
  return (
    <div className={styles.page}>
      <Background />
      <div className={styles.content}>
        <Header />
        <Hero />
        <Stats />
        <Features />
        <How />
        <Pricing />
        <Faq />
        <FinalCta />
        <Footer />
      </div>
    </div>
  );
}

function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.logoWrap}>
          <Logo size={24} />
          <span className={styles.logoName}>
            interview<span className={styles.logoDot}>.</span>ai
          </span>
        </div>
        <nav className={styles.nav}>
          <a href="#features" className={styles.navLink}>Возможности</a>
          <a href="#how" className={styles.navLink}>Как работает</a>
          <a href="#pricing" className={styles.navLink}>Тарифы</a>
          <a href="#faq" className={styles.navLink}>FAQ</a>
        </nav>
        <div className={styles.headerActions}>
          {user ? (
            <a href="/dashboard" className={styles.userChip}>
              <div className={styles.userChipAvatar}>
                {user.avatar
                  ? <Image src={user.avatar} alt="" width={24} height={24} className={styles.userChipAvatarImg} />
                  : <span>{user.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <span className={styles.userChipName}>{user.name.split(" ")[0]}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ) : (
            <a href="/auth" className={styles.loginBtn}>Войти</a>
          )}
          <DownloadDropdown align="right" trigger={
            <span className={styles.ctaBtn}>
              Скачать
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          } />
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
          <DownloadDropdown align="center" trigger={
            <span className={styles.heroCtaPrimary}>
              Скачать бесплатно
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          } />
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              Ассистент
            </div>
            <div className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Чат
            </div>
            <div className={styles.sidebarItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
              Горячие клавиши
            </div>
            <div className={styles.sidebarItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Скрытность
            </div>
            <div className={styles.sidebarItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Аналитика
            </div>
          </aside>
          <main className={styles.appMain}>
            <div className={styles.appMainHeader}>
              <h3 className={styles.appMainTitle}>Интервью-ассистент</h3>
              <span className={styles.onlineBadge}><span /> Онлайн</span>
            </div>
            <div className={styles.chatMsg}>
              <div className={styles.msgHeader}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {" "}Ассистент · 19:24
              </div>
              <p>Готов помочь. Укажите роль и технологии.</p>
            </div>
            <div className={`${styles.chatMsg} ${styles.chatMsgUser}`}>
              <div className={styles.msgHeader}>Вы · 19:24</div>
              <p>Frontend разработчик, React + TypeScript</p>
            </div>
            <div className={styles.chatMsg}>
              <div className={styles.msgHeader}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {" "}Ассистент · 19:24
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

function Stats() {
  return (
    <section className={styles.statsSection}>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>12k+</div>
          <div className={styles.statLabel}>Активных пользователей</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statValue}>94%</div>
          <div className={styles.statLabel}>Успешных офферов</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statValue}>&lt;50ms</div>
          <div className={styles.statLabel}>Задержка ответа</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <div className={styles.statValue}>24/7</div>
          <div className={styles.statLabel}>Доступность</div>
        </div>
      </div>
    </section>
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
            <div className={styles.miniMsgUser}>Он управляет очередями задач...</div>
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
          <p className={styles.bentoText}>Глобальные хоткеи — открывайте ассистента поверх любого окна.</p>
          <div className={styles.kbdRow}>
            <kbd>⌘</kbd>
            <kbd>⇧</kbd>
            <kbd>I</kbd>
          </div>
        </div>

        <div className={`${styles.bento} ${styles.bentoStealth}`}>
          <div className={styles.bentoLabel}>03 / Скрытность</div>
          <h3 className={styles.bentoTitle}>Режим невидимки</h3>
          <p className={styles.bentoText}>Окно не попадает в скриншоты и запись экрана.</p>
          <div className={styles.stealthDots}>
            <div className={styles.stealthDot} />
            <div className={styles.stealthDot} />
            <div className={styles.stealthDot} />
          </div>
        </div>

        <div className={styles.bento}>
          <div className={styles.bentoLabel}>04 / Аналитика</div>
          <h3 className={styles.bentoTitle}>Прогресс и слабые места</h3>
          <p className={styles.bentoText}>Отчёты по темам, трекинг роста навыков.</p>
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
          <div className={styles.bentoLabel}>05 / Платформы</div>
          <h3 className={styles.bentoTitle}>Нативно на вашей ОС</h3>
          <p className={styles.bentoText}>Быстрый старт, минимум ресурсов. Один файл — и запустили.</p>
          <div className={styles.ideList}>
            <div className={styles.ideChip}>macOS · Intel</div>
            <div className={styles.ideChip}>macOS · Apple Silicon</div>
            <div className={styles.ideChip}>Windows 10/11</div>
            <div className={styles.ideChip}>Linux (deb/rpm)</div>
          </div>
        </div>
      </div>
    </section>
  );
}

const HOW_STEPS = [
  { n: "01", t: "Скачайте приложение", d: "macOS, Windows, Linux. Установка в один клик." },
  { n: "02", t: "Авторизуйтесь", d: "Вход через браузер, сессия синхронизируется автоматически." },
  { n: "03", t: "Задайте контекст", d: "Укажите роль, стек, уровень — ИИ настроит ответы." },
  { n: "04", t: "Практикуйтесь", d: "Хоткей вызывает ассистента поверх любого окна." },
];

function How() {
  return (
    <section className={styles.how} id="how">
      <div className={styles.howBg} aria-hidden="true">
        <div className={styles.howGrid} />
      </div>
      <div className={styles.sectionHeader}>
        <div className={styles.eyebrow}>Как работает</div>
        <h2 className={styles.sectionTitle}>
          От установки до первого
          <br />
          <span className={styles.muted}>оффера.</span>
        </h2>
      </div>

      <div className={styles.timeline}>
        <div className={styles.timelineLine} />
        {HOW_STEPS.map((s) => (
          <div className={styles.tlStep} key={s.n}>
            <div className={styles.tlMarker}><span>{s.n}</span></div>
            <div className={styles.tlCard}>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.pricingBg} aria-hidden="true">
        <div className={styles.spotlight} />
      </div>
      <div className={styles.sectionHeader}>
        <div className={styles.eyebrow}>Тарифы</div>
        <h2 className={styles.sectionTitle}>
          Простая цена.
          <br />
          <span className={styles.muted}>Без сюрпризов.</span>
        </h2>
      </div>

      <div className={styles.pricingGrid}>
        <div className={styles.pricingCard}>
          <div className={styles.planHeader}>
            <h3>Базовый</h3>
            <span className={styles.planTag}>Free</span>
          </div>
          <div className={styles.price}>
            0 <span>₽ / мес</span>
          </div>
          <div className={styles.priceSub}>Навсегда</div>
          <ul className={styles.pricingList}>
            <li>5 сессий в день</li>
            <li>Базовая ИИ-модель</li>
            <li>Чат-ассистент</li>
            <li>Сообщество</li>
          </ul>
          <a href="/auth" className={styles.pricingBtn}>Начать</a>
        </div>

        <div className={`${styles.pricingCard} ${styles.pricingCardPro}`}>
          <div className={styles.proBadge}>Популярный</div>
          <div className={styles.planHeader}>
            <h3>Pro</h3>
            <span className={styles.planTagPro}>Pro</span>
          </div>
          <div className={styles.price}>
            990 <span>₽ / мес</span>
          </div>
          <div className={styles.priceSub}>Отмена в один клик</div>
          <ul className={styles.pricingList}>
            <li>Безлимитные сессии</li>
            <li>GPT-4 / Claude Opus</li>
            <li>Режим скрытности</li>
            <li>Аналитика и прогресс</li>
            <li>Приоритетная поддержка</li>
            <li>Экспорт данных</li>
          </ul>
          <a href="/auth" className={styles.pricingBtnPro}>
            Оформить Pro
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Видно ли ассистента во время звонка?", a: "Нет. Окно исключается из записи экрана и скриншотов на уровне OS." },
  { q: "На какой ОС работает?", a: "macOS (Intel и Apple Silicon), Windows 10/11, Linux. Нативные сборки под каждую платформу." },
  { q: "Можно ли отменить подписку?", a: "Да, в любой момент. Деньги вернутся за неиспользованный период." },
  { q: "Данные остаются конфиденциальными?", a: "Запросы не сохраняются дольше 24 часов и не используются для обучения моделей." },
];

function Faq() {
  return (
    <section className={styles.faq} id="faq">
      <div className={styles.sectionHeader}>
        <div className={styles.eyebrow}>FAQ</div>
        <h2 className={styles.sectionTitle}>Частые вопросы</h2>
      </div>
      <div className={styles.faqGrid}>
        {FAQS.map((f) => (
          <details className={styles.faqItem} key={f.q}>
            <summary>
              {f.q}
              <span className={styles.faqIcon}>+</span>
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className={styles.finalCta}>
      <div className={styles.ctaCard}>
        <div className={styles.ctaGlow} aria-hidden="true" />
        <h2>
          Готовы к <span className={styles.ctaAccent}>офферу мечты</span>?
        </h2>
        <p>Установите за 30 секунд. Первая сессия бесплатно.</p>
        <div className={styles.ctaButtons}>
          <DownloadDropdown align="center" trigger={
            <span className={styles.heroCtaPrimary}>
              Скачать бесплатно
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          } />
          <a href="#pricing" className={styles.heroCtaSecondary}>Сравнить тарифы</a>
        </div>
      </div>
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
              <a href="#">Конфиденциальность</a>
              <a href="#">Условия</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2026 interview.ai · Все права защищены</p>
          <div className={styles.socials}>
            <a href="#" aria-label="GitHub">GH</a>
            <a href="#" aria-label="Twitter">TW</a>
            <a href="#" aria-label="Telegram">TG</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
