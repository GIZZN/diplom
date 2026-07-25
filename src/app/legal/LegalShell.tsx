import Link from "next/link";
import styles from "./legal.module.css";

function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

interface CrossLink {
  href: string;
  title: string;
}

export default function LegalShell({
  eyebrow,
  title,
  updated,
  children,
  cross,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
  cross: CrossLink;
}) {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <Logo /> Interview Assistant
          </Link>
          <Link href="/" className={styles.backLink}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            На главную
          </Link>
        </div>
      </nav>

      <main className={styles.container}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.updated}>{updated}</div>

        <div className={styles.prose}>{children}</div>

        <Link href={cross.href} className={styles.crossLink}>
          <div className={styles.crossLinkText}>
            <span className={styles.crossLinkLabel}>Смотрите также</span>
            <span className={styles.crossLinkTitle}>{cross.title}</span>
          </div>
          <span className={styles.crossLinkArrow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      </main>

      <footer className={styles.foot}>© 2026 Interview Assistant · Все права защищены</footer>
    </div>
  );
}
