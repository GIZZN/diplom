"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  date: number;
  amount: number;
  source?: { user?: { username?: string; first_name?: string }; invoice_payload?: string };
}

interface Payment {
  id: number;
  user_id: number;
  email: string;
  name: string;
  stars_amount: number;
  plan_type: string;
  created_at: string;
}

interface Stats {
  stars: { balance: number; transactions: Transaction[] };
  payments: Payment[];
  users: { total_users: number; pro_users: number; new_last_7d: number };
}

const PLAN_LABEL: Record<string, string> = {
  test: "Тест (1 ⭐)",
  monthly: "30 дней (500 ⭐)",
  lifetime: "Навсегда (2000 ⭐)",
};

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

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ color: "#666", paddingTop: 80, textAlign: "center" }}>Загрузка…</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div style={styles.page}>
        <p style={{ color: "#f87171" }}>{error || "Нет данных"}</p>
        <button style={styles.refreshBtn} onClick={loadStats}>Повторить</button>
      </div>
    );
  }

  const { stars, payments, users } = stats;
  const canWithdraw = stars.balance >= 1000;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Panel</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>Выйти</button>
      </div>

      <div style={styles.row}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Всего пользователей</div>
          <div style={styles.cardValue}>{users.total_users}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Pro-аккаунтов</div>
          <div style={{ ...styles.cardValue, color: "#a78bfa" }}>{users.pro_users}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Новых за 7 дней</div>
          <div style={styles.cardValue}>{users.new_last_7d}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Баланс Stars</div>
          <div style={{ ...styles.cardValue, color: "#fbbf24" }}>⭐ {stars.balance}</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Кошелёк Stars</h2>
        <div style={styles.walletCard}>
          <div>
            <div style={styles.walletBalance}>⭐ {stars.balance}</div>
            <div style={styles.walletSub}>
              {canWithdraw ? "Можно вывести на Fragment" : `Нужно ещё ${1000 - stars.balance} ⭐`}
            </div>
          </div>
          <a
            href="https://fragment.com/stars"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.withdrawBtn, opacity: canWithdraw ? 1 : 0.45, pointerEvents: canWithdraw ? "auto" : "none" }}
          >
            Вывести на Fragment →
          </a>
        </div>
        <p style={styles.hint}>Fragment конвертирует Stars → TON. Минимум: 1000 ⭐ ≈ $9.</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Транзакции Telegram ({stars.transactions.length})</h2>
        {stars.transactions.length === 0 ? <div style={styles.empty}>Нет транзакций</div> : (
          <div style={styles.table}>
            <div style={{ ...styles.tableRow, ...styles.tableHead }}>
              <span>Дата</span><span>Сумма</span><span>От кого</span><span>Тариф</span>
            </div>
            {stars.transactions.map((tx) => (
              <div key={tx.id} style={styles.tableRow}>
                <span style={styles.muted}>{new Date(tx.date * 1000).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span style={{ color: "#fbbf24", fontWeight: 600 }}>⭐ {tx.amount}</span>
                <span>{tx.source?.user?.username ? `@${tx.source.user.username}` : tx.source?.user?.first_name ?? "—"}</span>
                <span style={styles.muted}>{tx.source?.invoice_payload ? PLAN_LABEL[tx.source.invoice_payload.split(":")[1]] ?? tx.source.invoice_payload : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Платежи в БД ({payments.length})</h2>
        {payments.length === 0 ? <div style={styles.empty}>Нет платежей в БД</div> : (
          <div style={styles.table}>
            <div style={{ ...styles.tableRow, ...styles.tableHead }}>
              <span>Дата</span><span>Пользователь</span><span>Тариф</span><span>⭐</span>
            </div>
            {payments.map((p) => (
              <div key={p.id} style={styles.tableRow}>
                <span style={styles.muted}>{new Date(p.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span title={p.email}>{p.name ?? p.email}</span>
                <span>{PLAN_LABEL[p.plan_type] ?? p.plan_type}</span>
                <span style={{ color: "#fbbf24" }}>⭐ {p.stars_amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <button style={styles.refreshBtn} onClick={loadStats} disabled={loading}>↻ Обновить</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif", padding: "32px 24px", maxWidth: 900, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  logoutBtn: { background: "none", border: "1px solid #333", color: "#888", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  row: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 },
  card: { background: "#111", border: "1px solid #222", borderRadius: 10, padding: "16px 20px" },
  cardLabel: { fontSize: 12, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  cardValue: { fontSize: 26, fontWeight: 700, color: "#fff" },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#ccc" },
  walletCard: { background: "#111", border: "1px solid #333", borderRadius: 12, padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  walletBalance: { fontSize: 36, fontWeight: 700, color: "#fbbf24" },
  walletSub: { fontSize: 13, color: "#666", marginTop: 4 },
  withdrawBtn: { background: "#fbbf24", color: "#000", borderRadius: 8, padding: "12px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none", display: "inline-block" },
  hint: { fontSize: 12, color: "#555", marginTop: 10 },
  table: { background: "#111", border: "1px solid #222", borderRadius: 10, overflow: "hidden" },
  tableHead: { background: "#161616", color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" },
  tableRow: { display: "grid", gridTemplateColumns: "140px 80px 1fr 1fr", gap: 16, padding: "10px 16px", borderBottom: "1px solid #1a1a1a", fontSize: 13, alignItems: "center" },
  muted: { color: "#666" },
  empty: { color: "#555", padding: "20px 0", textAlign: "center", fontSize: 14 },
  footer: { marginTop: 16, display: "flex", justifyContent: "flex-end" },
  refreshBtn: { background: "#1a1a1a", border: "1px solid #333", color: "#ccc", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 },
};
