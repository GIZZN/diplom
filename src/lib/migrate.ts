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
        avatar        TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;

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
    `);

    console.log("✓ Migrations applied");
  } catch (err) {
    console.error("Migration error:", err);
    migrated = false; // allow retry on next request
  }
}
