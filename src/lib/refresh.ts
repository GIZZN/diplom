import crypto from "crypto";
import pool from "./db";

// Short-lived desktop access token (JWT). Renewed via POST /api/auth/refresh.
export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "60m";

// Sliding refresh-token lifetime. Extended on every rotation.
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS || 60);

function generateRawToken(): string {
  // Opaque, NOT a JWT — pure random secret. Only its hash is stored.
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Create a brand-new refresh-token family for a user (called at pairing/login).
 * Returns the raw token to hand to the client; only the hash is persisted.
 */
export async function issueRefreshToken(userId: number): Promise<string> {
  const raw = generateRawToken();
  const familyId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 || ' days')::interval)`,
    [userId, familyId, hashToken(raw), String(REFRESH_TTL_DAYS)]
  );
  return raw;
}

export type RotateResult =
  | { ok: true; userId: number; refreshToken: string }
  | { ok: false; reason: "invalid" | "expired" | "revoked" | "reuse" };

/**
 * Rotate a refresh token:
 *  - unknown hash               → invalid
 *  - revoked (family killed)    → revoked
 *  - expired                    → expired
 *  - already consumed (used)    → REUSE: revoke the entire family, return reuse
 *  - valid                      → consume it, mint a fresh token in the same family
 *
 * Row is locked FOR UPDATE so two concurrent rotations of the same token can't
 * both succeed — the loser sees `used = true` and trips reuse-detection.
 */
export async function rotateRefreshToken(raw: string): Promise<RotateResult> {
  const tokenHash = hashToken(raw);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sel = await client.query(
      `SELECT id, user_id, family_id, used, revoked, expires_at
         FROM refresh_tokens
        WHERE token_hash = $1
        FOR UPDATE`,
      [tokenHash]
    );

    if (sel.rows.length === 0) {
      await client.query("COMMIT");
      return { ok: false, reason: "invalid" };
    }

    const row = sel.rows[0];

    if (row.revoked) {
      await client.query("COMMIT");
      return { ok: false, reason: "revoked" };
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await client.query("COMMIT");
      return { ok: false, reason: "expired" };
    }

    // Reuse of a token that was already rotated away = likely theft → kill family.
    if (row.used) {
      await client.query(
        "UPDATE refresh_tokens SET revoked = true WHERE family_id = $1",
        [row.family_id]
      );
      await client.query("COMMIT");
      return { ok: false, reason: "reuse" };
    }

    // Consume current token, mint the next one in the same family (sliding TTL).
    await client.query("UPDATE refresh_tokens SET used = true WHERE id = $1", [row.id]);

    const newRaw = generateRawToken();
    await client.query(
      `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + ($4 || ' days')::interval)`,
      [row.user_id, row.family_id, hashToken(newRaw), String(REFRESH_TTL_DAYS)]
    );

    await client.query("COMMIT");
    return { ok: true, userId: row.user_id, refreshToken: newRaw };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Revoke every refresh token for a user (logout / ban). */
export async function revokeUserRefreshTokens(userId: number): Promise<void> {
  await pool.query(
    "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false",
    [userId]
  );
}
