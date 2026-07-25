import crypto from "crypto";
import pool from "./db";

export const REFERRAL_BONUS_DAYS = 7;

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function makeCode(): string {
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Код выдаётся лениво, при первом обращении — старым пользователям тоже. */
export async function ensureRefCode(userId: number): Promise<string> {
  const existing = await pool.query("SELECT ref_code FROM users WHERE id = $1", [userId]);
  if (existing.rows[0]?.ref_code) return existing.rows[0].ref_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    try {
      const res = await pool.query(
        "UPDATE users SET ref_code = $1 WHERE id = $2 AND ref_code IS NULL RETURNING ref_code",
        [code, userId],
      );
      if (res.rows[0]) return res.rows[0].ref_code;
      // Кто-то выдал код параллельно — читаем его.
      const now = await pool.query("SELECT ref_code FROM users WHERE id = $1", [userId]);
      if (now.rows[0]?.ref_code) return now.rows[0].ref_code;
    } catch {
      // Коллизия по UNIQUE — пробуем следующий код.
    }
  }
  throw new Error("Не удалось сгенерировать реферальный код");
}

/**
 * Начисляет бонус приглашённому и пригласившему.
 * UNIQUE(invited_id) в referral_rewards гарантирует однократность.
 */
export async function applyReferral(invitedId: number, code: string): Promise<boolean> {
  const referrer = await pool.query("SELECT id FROM users WHERE ref_code = $1", [
    code.toLowerCase(),
  ]);
  const referrerId: number | undefined = referrer.rows[0]?.id;
  if (!referrerId || referrerId === invitedId) return false;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const claim = await client.query(
      `INSERT INTO referral_rewards (referrer_id, invited_id, days)
       VALUES ($1, $2, $3)
       ON CONFLICT (invited_id) DO NOTHING
       RETURNING id`,
      [referrerId, invitedId, REFERRAL_BONUS_DAYS],
    );
    if (claim.rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query("UPDATE users SET referred_by = $1 WHERE id = $2", [
      referrerId,
      invitedId,
    ]);

    // Продлеваем от текущей даты окончания, если Pro ещё активен.
    const grant = `
      UPDATE users
      SET plan = 'pro',
          pro_expires_at = GREATEST(COALESCE(pro_expires_at, NOW()), NOW())
                           + ($2 || ' days')::interval
      WHERE id = $1`;
    await client.query(grant, [invitedId, REFERRAL_BONUS_DAYS]);
    await client.query(grant, [referrerId, REFERRAL_BONUS_DAYS]);

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("referral error:", err);
    return false;
  } finally {
    client.release();
  }
}

export async function getReferralStats(userId: number) {
  const [code, invited] = await Promise.all([
    ensureRefCode(userId),
    pool.query(
      "SELECT COUNT(*)::int AS count, COALESCE(SUM(days), 0)::int AS days FROM referral_rewards WHERE referrer_id = $1",
      [userId],
    ),
  ]);
  return {
    code,
    invited: invited.rows[0].count as number,
    daysEarned: invited.rows[0].days as number,
  };
}
