import pool from "./db";

let migrated = false;

export async function runMigrations() {
  if (migrated) return;
  migrated = true;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        plan          VARCHAR(20) NOT NULL DEFAULT 'free',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

      CREATE TABLE IF NOT EXISTS user_avatars (
        user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        avatar     TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Move legacy avatar column data into user_avatars, then drop it
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'avatar'
        ) THEN
          INSERT INTO user_avatars (user_id, avatar)
          SELECT id, avatar FROM users WHERE avatar IS NOT NULL
          ON CONFLICT (user_id) DO NOTHING;
          ALTER TABLE users DROP COLUMN avatar;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS app_tokens (
        token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status      VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes'
      );

      CREATE TABLE IF NOT EXISTS desktop_sessions (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type             VARCHAR(30) NOT NULL,
        question         TEXT,
        answer           TEXT,
        model            VARCHAR(100),
        response_time_ms INTEGER,
        tokens_used      INTEGER,
        session_id       VARCHAR(100),
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS desktop_sessions_user_id_idx
        ON desktop_sessions (user_id);
      CREATE INDEX IF NOT EXISTS desktop_sessions_created_at_idx
        ON desktop_sessions (created_at DESC);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_revoked_before TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS payments (
        id                 SERIAL PRIMARY KEY,
        user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        telegram_charge_id TEXT NOT NULL UNIQUE,
        stars_amount       INTEGER NOT NULL,
        plan_type          VARCHAR(20) NOT NULL,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments (user_id);

      CREATE TABLE IF NOT EXISTS admin_login_attempts (
        id         SERIAL PRIMARY KEY,
        ip         TEXT NOT NULL,
        success    BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS admin_login_attempts_ip_idx ON admin_login_attempts (ip, created_at);

      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id         SERIAL PRIMARY KEY,
        action     TEXT NOT NULL,
        ip         TEXT,
        details    JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON admin_audit_log (created_at DESC);

      CREATE TABLE IF NOT EXISTS admin_otp_codes (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        code_hash  TEXT NOT NULL,
        used       BOOLEAN NOT NULL DEFAULT false,
        attempts   INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE admin_otp_codes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

      -- Opaque refresh tokens for desktop sliding sessions.
      -- Rotation on every use; reuse of a consumed token revokes the whole family.
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- jti
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        family_id   UUID NOT NULL,                                -- chain for reuse-detection
        token_hash  TEXT NOT NULL UNIQUE,                         -- sha256(raw refresh token)
        used        BOOLEAN NOT NULL DEFAULT false,               -- consumed by a rotation
        revoked     BOOLEAN NOT NULL DEFAULT false,               -- family-level kill switch
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS refresh_tokens_hash_idx   ON refresh_tokens (token_hash);
      CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON refresh_tokens (family_id);
      CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx   ON refresh_tokens (user_id);

      -- ─── Атрибуция трафика ────────────────────────────────────────────────
      -- Каждое событие воронки: заход на сайт, скачивание, регистрация.
      -- Позволяет ответить "какой канал принёс платящих", а не только клики.
      CREATE TABLE IF NOT EXISTS traffic_events (
        id         SERIAL PRIMARY KEY,
        event      VARCHAR(20) NOT NULL,      -- visit | download | signup
        source     VARCHAR(60),               -- utm_source
        medium     VARCHAR(60),               -- utm_medium
        campaign   VARCHAR(60),               -- utm_campaign
        variant    VARCHAR(60),               -- какой файл скачали / доп. контекст
        user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        visitor    VARCHAR(40),               -- анонимный id из cookie, склеивает воронку
        referrer   TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS traffic_events_created_idx ON traffic_events (created_at DESC);
      CREATE INDEX IF NOT EXISTS traffic_events_source_idx  ON traffic_events (source, event);
      CREATE INDEX IF NOT EXISTS traffic_events_visitor_idx ON traffic_events (visitor);

      -- ─── Рефералы ─────────────────────────────────────────────────────────
      -- Код выдаётся каждому пользователю; за приглашённого оба получают Pro.
      ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_code    VARCHAR(12) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source VARCHAR(60);

      CREATE TABLE IF NOT EXISTS referral_rewards (
        id          SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invited_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        days        INTEGER NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (invited_id)
      );
      CREATE INDEX IF NOT EXISTS referral_rewards_referrer_idx ON referral_rewards (referrer_id);
    `);

    console.log("✓ Migrations applied");
  } catch (err) {
    console.error("Migration error:", err);
    migrated = false; // allow retry on next request
  }
}
