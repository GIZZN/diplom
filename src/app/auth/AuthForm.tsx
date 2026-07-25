"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  BarChart3,
  Eye,
  EyeOff,
  KeyRound,
  Keyboard,
  Loader2,
  MailCheck,
  MessageSquare,
  ShieldOff,
  Timer,
  User,
} from "lucide-react";
import styles from "./auth.module.css";
import BackgroundPaths from "../bg/BackgroundPaths";

function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="white" />
      <circle cx="16" cy="16" r="7" fill="black" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

const CHAT = [
  { from: "ai" as const, text: "Готов помочь. Укажите роль и технологии." },
  { from: "user" as const, text: "Frontend разработчик, React + TypeScript" },
  { from: "ai" as const, text: "Отлично. Начнём с virtual DOM — как он работает?" },
];

const SIDEBAR = [
  { icon: MessageSquare, label: "Чат" },
  { icon: Keyboard, label: "Горячие клавиши" },
  { icon: ShieldOff, label: "Скрытность" },
  { icon: BarChart3, label: "Аналитика" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function BrandPanel() {
  return (
    <aside className={styles.brand}>
      <div className={styles.brandPaths} aria-hidden="true">
        <BackgroundPaths />
      </div>
      <div className={styles.brandGlow} aria-hidden="true" />

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
          Всё в одном окне.
          <br />
          <span className={styles.brandTitleMuted}>Ничего лишнего.</span>
        </motion.h2>

        <motion.div
          className={styles.mock}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
          aria-hidden="true"
        >
          <div className={styles.mockBar}>
            <span className={styles.mockDots}>
              <i />
              <i />
              <i />
            </span>
            <span className={styles.mockTitle}>Интервью-ассистент</span>
            <span className={styles.mockOnline}>
              <i />
              Онлайн
            </span>
          </div>

          <div className={styles.mockBody}>
            <nav className={styles.mockSide}>
              {SIDEBAR.map(({ icon: Icon, label }, i) => (
                <span
                  key={label}
                  className={`${styles.mockSideItem} ${i === 0 ? styles.mockSideItemActive : ""}`}
                >
                  <Icon size={13} strokeWidth={1.9} />
                  {label}
                </span>
              ))}
            </nav>

            <div className={styles.mockChat}>
              {CHAT.map((m, i) => (
                <motion.div
                  key={m.text}
                  className={`${styles.mockMsg} ${m.from === "user" ? styles.mockMsgUser : ""}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.28, ease: EASE }}
                >
                  {m.text}
                </motion.div>
              ))}
              <motion.div
                className={styles.mockTyping}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.3 }}
              >
                <span />
                <span />
                <span />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className={styles.brandHint}>
          <ShieldOff size={14} strokeWidth={1.9} />
          Окно не попадает в скриншоты и запись экрана
        </div>
      </div>

      <p className={styles.brandFoot}>Нативное приложение для Windows 10/11</p>
    </aside>
  );
}

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60;

function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete: (code: string) => void;
  disabled: boolean;
  invalid: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const write = useCallback(
    (next: string) => {
      const clean = next.replace(/\D/g, "").slice(0, OTP_LENGTH);
      onChange(clean);
      if (clean.length === OTP_LENGTH) {
        refs.current[OTP_LENGTH - 1]?.blur();
        onComplete(clean);
      }
      return clean;
    },
    [onChange, onComplete],
  );

  return (
    <div
      className={`${styles.otpRow} ${invalid ? styles.otpRowInvalid : ""}`}
      onPaste={(e) => {
        e.preventDefault();
        const clean = write(e.clipboardData.getData("text"));
        refs.current[Math.min(clean.length, OTP_LENGTH - 1)]?.focus();
      }}
    >
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`${styles.otpCell} ${value[i] ? styles.otpCellFilled : ""}`}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Цифра ${i + 1} из ${OTP_LENGTH}`}
          value={value[i] ?? ""}
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, "").slice(-1);
            if (!digit) return;
            const chars = value.padEnd(OTP_LENGTH, " ").split("");
            chars[i] = digit;
            write(chars.join("").trimEnd());
            refs.current[Math.min(i + 1, OTP_LENGTH - 1)]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (value[i]) {
                onChange(value.slice(0, i) + value.slice(i + 1));
              } else if (i > 0) {
                onChange(value.slice(0, i - 1) + value.slice(i));
                refs.current[i - 1]?.focus();
              }
            } else if (e.key === "ArrowLeft" && i > 0) {
              e.preventDefault();
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
              e.preventDefault();
              refs.current[i + 1]?.focus();
            }
          }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

function formatLeft(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Mode = "login" | "register";

interface AuthFormProps {
  redirectTo?: string;
  initialStep?: "form" | "otp";
  authError?: string;
}

export default function AuthForm({
  redirectTo = "/dashboard",
  initialStep = "form",
  authError = "",
}: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<"form" | "otp">(initialStep);
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(authError);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);

  const isLogin = mode === "login";

  useEffect(() => {
    if (step !== "otp") return;
    setSecondsLeft(OTP_TTL_SECONDS);
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Что-то пошло не так");
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(code = otpCode) {
    if (code.length < OTP_LENGTH || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Неверный код");
        setOtpCode("");
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

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
          {step === "otp" ? (
            <>
              <header className={styles.head}>
                <span className={styles.headIcon}>
                  <MailCheck size={18} strokeWidth={1.9} />
                </span>
                <h1 className={styles.title}>Подтвердите вход</h1>
                <p className={styles.subtitle}>
                  Мы отправили шестизначный код на вашу почту. Введите его ниже —
                  вход произойдёт автоматически.
                </p>
              </header>

              <div className={styles.form}>
                <OtpInput
                  value={otpCode}
                  onChange={(next) => {
                    setOtpCode(next);
                    setError("");
                  }}
                  onComplete={(code) => handleVerifyOtp(code)}
                  disabled={loading}
                  invalid={Boolean(error)}
                />

                <div className={styles.otpMeta}>
                  <span
                    className={`${styles.otpTimer} ${secondsLeft === 0 ? styles.otpTimerDead : ""}`}
                  >
                    <Timer size={13} strokeWidth={2} />
                    {secondsLeft > 0
                      ? `Код действителен ${formatLeft(secondsLeft)}`
                      : "Срок действия кода истёк"}
                  </span>
                  <span className={styles.otpCount}>
                    {otpCode.length}/{OTP_LENGTH}
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {error && (
                    <motion.p
                      className={styles.error}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.24, ease: EASE }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  className={styles.submitBtn}
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otpCode.length < OTP_LENGTH}
                  type="button"
                >
                  {loading ? (
                    <Loader2 size={16} className={styles.spinner} />
                  ) : (
                    <>
                      Войти
                      <ArrowRight size={16} strokeWidth={2.2} />
                    </>
                  )}
                </button>

                <button
                  className={styles.backBtn}
                  onClick={() => {
                    setStep("form");
                    setError("");
                    setOtpCode("");
                  }}
                  type="button"
                >
                  <ArrowLeft size={14} strokeWidth={2.2} />
                  Ввести другой email
                </button>
              </div>
            </>
          ) : (
            <>
              <header className={styles.head}>
                <h1 className={styles.title}>
                  {isLogin ? "Вход в аккаунт" : "Создание аккаунта"}
                </h1>
                <p className={styles.subtitle}>
                  {isLogin
                    ? "Продолжите подготовку к собеседованиям"
                    : "Настройка занимает меньше минуты"}
                </p>
              </header>

              <div className={styles.segmented} role="tablist">
                <button
                  role="tab"
                  aria-selected={isLogin}
                  className={styles.segment}
                  onClick={() => switchMode("login")}
                  type="button"
                >
                  {isLogin && (
                    <motion.span
                      layoutId="segment"
                      className={styles.segmentActive}
                      transition={{ duration: 0.3, ease: EASE }}
                    />
                  )}
                  <span>Войти</span>
                </button>
                <button
                  role="tab"
                  aria-selected={!isLogin}
                  className={styles.segment}
                  onClick={() => switchMode("register")}
                  type="button"
                >
                  {!isLogin && (
                    <motion.span
                      layoutId="segment"
                      className={styles.segmentActive}
                      transition={{ duration: 0.3, ease: EASE }}
                    />
                  )}
                  <span>Регистрация</span>
                </button>
              </div>

              <a
                href={`/api/auth/google/start?redirect=${encodeURIComponent(redirectTo)}`}
                className={styles.googleBtn}
              >
                <GoogleIcon />
                Продолжить с Google
              </a>

              <div className={styles.divider}>
                <span>или по email</span>
              </div>

              <form className={styles.form} onSubmit={submit} noValidate>
                <AnimatePresence initial={false}>
                  {!isLogin && (
                    <motion.div
                      className={styles.field}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: EASE }}
                    >
                      <label className={styles.label} htmlFor="name">
                        Имя
                      </label>
                      <div className={styles.inputWrap}>
                        <User size={15} strokeWidth={1.9} className={styles.inputIcon} />
                        <input
                          id="name"
                          className={styles.input}
                          type="text"
                          placeholder="Как вас зовут"
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          required
                          autoComplete="name"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">
                    Email
                  </label>
                  <div className={styles.inputWrap}>
                    <AtSign size={15} strokeWidth={1.9} className={styles.inputIcon} />
                    <input
                      id="email"
                      className={styles.input}
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="password">
                    Пароль
                    {isLogin && (
                      <a href="#" className={styles.forgotLink}>
                        Забыли пароль?
                      </a>
                    )}
                  </label>
                  <div className={styles.inputWrap}>
                    <KeyRound size={15} strokeWidth={1.9} className={styles.inputIcon} />
                    <input
                      id="password"
                      className={styles.input}
                      type={showPassword ? "text" : "password"}
                      placeholder={isLogin ? "Ваш пароль" : "Минимум 8 символов"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      className={styles.peekBtn}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? (
                        <EyeOff size={15} strokeWidth={1.9} />
                      ) : (
                        <Eye size={15} strokeWidth={1.9} />
                      )}
                    </button>
                  </div>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button className={styles.submitBtn} type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 size={16} className={styles.spinner} />
                  ) : (
                    <>
                      {isLogin ? "Войти" : "Создать аккаунт"}
                      <ArrowRight size={16} strokeWidth={2.2} />
                    </>
                  )}
                </button>
              </form>

              {!isLogin && (
                <p className={styles.terms}>
                  Регистрируясь, вы принимаете{" "}
                  <Link href="/terms" className={styles.termsLink}>
                    условия использования
                  </Link>{" "}
                  и{" "}
                  <Link href="/privacy" className={styles.termsLink}>
                    политику конфиденциальности
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </motion.div>

        <footer className={styles.footer}>
          <span>© 2026 interview.ai</span>
          <Link href="/privacy" className={styles.footerLink}>
            Конфиденциальность
          </Link>
        </footer>
      </main>
    </div>
  );
}
