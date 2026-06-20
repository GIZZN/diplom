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
        code_hash  TEXT NOT NULL,
        used       BOOLEAN NOT NULL DEFAULT false,
        attempts   INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("✓ Migrations applied");
  } catch (err) {
    console.error("Migration error:", err);
    migrated = false; // allow retry on next request
  }
}
