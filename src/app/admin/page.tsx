"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

interface Transaction {
  id: string;
  date: number;
  amount: number;
  planType: string | null;
  payer: string;
  account: { id: number; name: string; email: string } | null;
  recorded: boolean;
}

interface Stats {
  stars: { balance: number };
  transactions: Transaction[];
  users: { total_users: number; pro_users: number; new_last_7d: number };
}

const PLAN_LABEL: Record<string, string> = {
  test: "Тест",
  monthly: "30 дней",
  lifetime: "Навсегда",
};

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <rect x="0" y="0" width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
      <path d="M5.5 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401 || res.status === 403) {
        router.replace("/auth?redirect=/admin");
        return;
      }
      setStats(await res.json());
    } catch {
      setError("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth");
  }

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading && !stats) {
    return (
      <div className={styles.page}>
        <div className={styles.centerState}>Загрузка…</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.page}>
        <div className={styles.centerState}>
          <span>{error || "Нет данных"}</span>
          <button className={styles.refreshBtn} onClick={loadStats}>
            <IconRefresh /> Повторить
          </button>
        </div>
      </div>
    );
  }

  const { stars, transactions, users } = stats;
  const canWithdraw = stars.balance >= 1000;
  const unrecorded = transactions.filter((t) => !t.recorded).length;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Logo />
          <span className={styles.logoText}>interview.ai</span>
          <span className={styles.badge}>Admin</span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <IconLogout /> Выйти
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Всего пользователей</span>
            <span className={styles.statValue}>{users.total_users}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pro-аккаунтов</span>
            <span className={`${styles.statValue} ${styles.statValuePro}`}>{users.pro_users}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Новых за 7 дней</span>
            <span className={styles.statValue}>{users.new_last_7d}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Баланс Stars</span>
            <span className={`${styles.statValue} ${styles.statValueStars}`}>⭐ {stars.balance}</span>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Кошелёк Stars</span>
          </div>
          <div className={styles.walletCard}>
            <div>
              <div className={styles.walletBalance}>⭐ {stars.balance}</div>
              <div className={styles.walletSub}>
                {canWithdraw ? "Можно вывести на Fragment" : `Нужно ещё ${1000 - stars.balance} ⭐ для вывода`}
              </div>
            </div>
            <a
              href="https://fragment.com/stars"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.withdrawBtn} ${!canWithdraw ? styles.withdrawBtnDisabled : ""}`}
            >
              Вывести на Fragment →
            </a>
          </div>
          <p className={styles.hint}>Fragment конвертирует Stars → TON. Минимум для вывода: 1000 ⭐ ≈ $9.</p>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionTitle}>Платежи</span>
              <span className={styles.sectionCount}> · {transactions.length}</span>
              {unrecorded > 0 && (
                <span className={styles.sectionCount} style={{ color: "#f59e0b" }}>
                  {" "}· {unrecorded} не записано в БД
                </span>
              )}
            </div>
            <button className={styles.refreshBtn} onClick={loadStats} disabled={loading}>
              <IconRefresh /> {loading ? "Обновление…" : "Обновить"}
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className={styles.empty}>Платежей пока нет</div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Дата</span>
                <span>Оплатил (Telegram)</span>
                <span>Аккаунт на сайте</span>
                <span>Тариф</span>
                <span>⭐</span>
                <span>Статус</span>
              </div>
              {transactions.map((t) => (
                <div key={t.id} className={styles.row}>
                  <span className={styles.cellDate}>
                    {new Date(t.date * 1000).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={styles.cellPayer}>{t.payer}</span>
                  {t.account ? (
                    <div className={styles.cellAccount}>
                      <span className={styles.cellAccountName}>{t.account.name}</span>
                      <span className={styles.cellAccountEmail}>{t.account.email}</span>
                    </div>
                  ) : (
                    <span className={styles.cellAccountMissing}>аккаунт не найден</span>
                  )}
                  <span className={styles.cellPlan}>{t.planType ? PLAN_LABEL[t.planType] ?? t.planType : "—"}</span>
                  <span className={styles.cellStars}>⭐ {t.amount}</span>
                  {t.recorded ? (
                    <span className={styles.statusOk}>✓ записано</span>
                  ) : (
                    <span className={styles.statusWarn}>⚠ нет в БД</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
