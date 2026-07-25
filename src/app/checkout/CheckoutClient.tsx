"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./checkout.module.css";

export interface CheckoutPlan {
  id: "monthly" | "lifetime";
  title: string;
  description: string;
  price: number;
  kicker: string;
  period: string;
  features: string[];
}

const BOT_USERNAME = "AirStars_Robot";

function TgStar({ size = 16 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const g = `tgstar-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "inline", verticalAlign: "middle", flexShrink: 0 }}>
      <defs>
        <linearGradient id={g} x1="3" y1="2" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset="0.5" stopColor="#ffc01f" />
          <stop offset="1" stopColor="#f29e00" />
        </linearGradient>
      </defs>
      <path fill={`url(#${g})`} fillRule="evenodd" clipRule="evenodd" d="M11.4664 17.7532L6.96555 20.5105C6.49754 20.7972 5.88574 20.6502 5.59904 20.1822C5.45901 19.9536 5.41726 19.6782 5.48327 19.4184L6.18 16.676C6.4315 15.6861 7.10892 14.8586 8.02968 14.4165L12.9399 12.059C13.1688 11.9491 13.2653 11.6745 13.1553 11.4455C13.0663 11.2602 12.8651 11.1564 12.6624 11.1915L7.19676 12.1377C6.08572 12.3301 4.94636 12.0233 4.08213 11.299L2.35549 9.85207C1.93483 9.49955 1.8796 8.87276 2.23212 8.45211C2.40357 8.24752 2.65013 8.1205 2.91625 8.09968L8.19167 7.68682C8.56437 7.65765 8.88916 7.4218 9.03224 7.07642L11.0674 2.16367C11.2774 1.65662 11.8588 1.41586 12.3658 1.62591C12.6093 1.72677 12.8027 1.92021 12.9036 2.16367L14.9388 7.07642C15.0818 7.4218 15.4066 7.65765 15.7793 7.68682L21.0837 8.10194C21.6309 8.14477 22.0397 8.62304 21.9969 9.17021C21.9763 9.43343 21.8518 9.67763 21.6509 9.84891L17.6055 13.2978C17.3207 13.5405 17.1964 13.9227 17.284 14.2866L18.5277 19.4531C18.6561 19.9867 18.3277 20.5234 17.7941 20.6519C17.5377 20.7136 17.2673 20.6709 17.0424 20.5331L12.5046 17.7532C12.186 17.5581 11.7849 17.5581 11.4664 17.7532Z" />
    </svg>
  );
}

function CheckIcon({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CheckoutClient({ plan, email }: { plan: CheckoutPlan; email: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Verify session + brief skeleton, just like Stripe's mount state.
  useEffect(() => {
    let alive = true;
    const started = Date.now();
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          router.replace(`/auth?redirect=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`);
          return;
        }
        const data = await res.json().catch(() => null);
        if (alive && data?.user?.plan === "pro" && plan.id === "monthly") {
          // already pro — let them still extend, no hard block
        }
      } catch {
        /* show page anyway */
      } finally {
        const wait = Math.max(0, 650 - (Date.now() - started));
        setTimeout(() => alive && setReady(true), wait);
      }
    })();
    return () => {
      alive = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [plan.id, router]);

  function startPolling() {
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries += 1;
      if (tries > 40) {
        if (pollRef.current) clearInterval(pollRef.current);
        setWaiting(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (data?.user?.plan === "pro") {
          if (pollRef.current) clearInterval(pollRef.current);
          setWaiting(false);
          setSuccess(true);
          setTimeout(() => router.push("/dashboard"), 1600);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  }

  async function handlePay() {
    setError(null);
    setPaying(true);

    // Open the tab synchronously INSIDE the click gesture. If we wait until after
    // the awaited fetch, the browser has lost user-activation and strands the tab
    // on about:blank (most visible in prod, where the API call has real latency).
    const payWindow = window.open("", "_blank");

    try {
      const res = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      if (res.status === 401) {
        payWindow?.close();
        router.replace(`/auth?redirect=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        payWindow?.close();
        setError(data.error ?? "Не удалось создать счёт. Попробуйте ещё раз.");
        setPaying(false);
        return;
      }
      if (payWindow) {
        payWindow.opener = null; // sever reverse-tabnabbing before navigating
        payWindow.location.href = data.url;
      } else {
        // Popup was blocked — fall back to navigating the current tab.
        window.location.href = data.url;
        return;
      }
      setPaying(false);
      setWaiting(true);
      startPolling();
    } catch {
      payWindow?.close();
      setError("Ошибка соединения. Проверьте интернет и повторите.");
      setPaying(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.card}>
        {/* ---------- Order summary ---------- */}
        <aside className={styles.summary}>
          <Link href="/#pricing" className={styles.back}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Назад к тарифам
          </Link>

          <div className={styles.brand}>
            <span className={styles.brandMark}><span /></span>
            <span className={styles.brandName}>Interview Assistant</span>
          </div>

          <div className={styles.kicker}>{ready ? plan.kicker : <span className={styles.sk} style={{ display: "inline-block", width: 120, height: 13 }} />}</div>

          {ready ? (
            <>
              <div className={`${styles.amount} ${styles.reveal}`}>
                {plan.price.toLocaleString("ru-RU")} <TgStar size={30} />
              </div>
              <div className={styles.amountPeriod}>{plan.period}</div>
            </>
          ) : (
            <div className={styles.sk} style={{ width: 180, height: 40, marginTop: 6 }} />
          )}

          <div className={styles.lines}>
            {ready ? (
              <>
                <div className={`${styles.line} ${styles.reveal}`}>
                  <div>
                    <div className={styles.lineTitle}>{plan.title}</div>
                    <div className={styles.lineDesc}>{plan.description}</div>
                  </div>
                  <div className={styles.linePrice}>{plan.price.toLocaleString("ru-RU")} <TgStar size={14} /></div>
                </div>
                <div className={`${styles.total} ${styles.reveal}`}>
                  <span className={styles.totalLabel}>Итого</span>
                  <span className={styles.totalValue}>{plan.price.toLocaleString("ru-RU")} <TgStar size={16} /></span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.sk} style={{ height: 18, width: "75%", margin: "16px 0" }} />
                <div className={styles.sk} style={{ height: 22, width: "55%", marginTop: 18 }} />
              </>
            )}
          </div>

          {ready && (
            <div className={`${styles.features} ${styles.reveal}`}>
              {plan.features.map((f) => (
                <div className={styles.feature} key={f}>
                  <span className={styles.featureDot}><CheckIcon size={13} /></span>
                  {f}
                </div>
              ))}
            </div>
          )}

          <div className={styles.summaryFoot}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
            </svg>
            Защищённая оплата через Telegram
          </div>
        </aside>

        {/* ---------- Payment ---------- */}
        <section className={styles.pay}>
          <div className={styles.payHead}>Оформление</div>

          <div className={styles.field}>
            <label className={styles.label}>Аккаунт</label>
            <div className={`${styles.input} ${styles.inputReadonly}`}>
              {ready ? (
                <>
                  <span>{email}</span>
                  <span className={styles.inputBadge}>вошли</span>
                </>
              ) : (
                <span className={styles.sk} style={{ width: 160, height: 14 }} />
              )}
            </div>
          </div>

          <div className={styles.methodLabel}>Способ оплаты</div>
          {ready ? (
            <div className={`${styles.method} ${styles.reveal}`}>
              <span className={styles.methodIcon}><TgStar size={22} /></span>
              <div className={styles.methodMeta}>
                <span className={styles.methodName}>Telegram Stars</span>
                <span className={styles.methodSub}>Оплата звёздами Telegram (XTR)</span>
              </div>
              <span className={styles.methodCheck}><CheckIcon size={12} color="#04130d" /></span>
            </div>
          ) : (
            <div className={styles.sk} style={{ height: 66, borderRadius: 10 }} />
          )}

          {ready && (
            <div className={`${styles.info} ${styles.reveal}`}>
              <span className={styles.infoIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
                </svg>
              </span>
              <div className={styles.infoBody}>
                Оплата проходит <b>звёздами Telegram</b>. После нажатия «Оплатить» откроется счёт прямо в Telegram —
                подтвердите его, и доступ к Pro активируется автоматически.
                <br />
                Нет звёзд? Их можно купить за пару минут в боте <b>@{BOT_USERNAME}</b>, затем вернуться сюда.
                <br />
                <a className={styles.botLink} href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noopener noreferrer">
                  <TgStar size={14} /> Купить звёзды в @{BOT_USERNAME}
                </a>
              </div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {waiting && (
            <div className={styles.waiting}>
              <span className={styles.spinnerAccent} />
              <span>
                Ждём подтверждение оплаты в Telegram… Окно со счётом открыто в новой вкладке.
                Доступ обновится автоматически, как только платёж пройдёт.
              </span>
            </div>
          )}

          {ready ? (
            <button
              className={`${styles.payBtn} ${success ? styles.payBtnSuccess : ""}`}
              onClick={handlePay}
              disabled={paying || waiting || success}
              type="button"
            >
              {success ? (
                <><CheckIcon size={16} color="#04130d" /> Готово — открываем кабинет</>
              ) : paying ? (
                <><span className={styles.spinner} /> Открываем счёт…</>
              ) : waiting ? (
                <><span className={styles.spinner} /> Ожидаем оплату…</>
              ) : (
                <>Оплатить {plan.price.toLocaleString("ru-RU")} <TgStar size={16} /></>
              )}
            </button>
          ) : (
            <div className={styles.sk} style={{ height: 50, borderRadius: 10 }} />
          )}

          <div className={styles.secureFoot}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
            </svg>
            Платёж обрабатывается Telegram. Мы не храним платёжные данные.
          </div>
        </section>
      </div>
    </div>
  );
}