-- Move legacy users.avatar into a dedicated user_avatars table
CREATE TABLE IF NOT EXISTS user_avatars (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar     TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
