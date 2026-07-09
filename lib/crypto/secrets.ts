/**
 * AI Website Powerhouse — at-rest secrets encryption (ADR-008).
 *
 * AES-256-GCM with an app-level symmetric key held in the environment.
 * Used to encrypt user-supplied secrets (OpenRouter/Anthropic/OpenAI
 * keys, GitHub/Vercel/Netlify tokens) before they are written to the
 * `user_integrations` table, and to decrypt them server-side at call
 * time. The database never sees plaintext; the browser never sees the
 * encryption key.
 *
 * Wire format (matches the comment on `user_integrations` in
 * supabase/migrations/0001_initial.sql):
 *
 *   base64( version_byte || iv (12 bytes) || ciphertext || authtag (16 bytes) )
 *
 * The leading version byte selects the key: version 1 → env var
 * `ENCRYPTION_KEY_V1`. Rotation adds `ENCRYPTION_KEY_V2` side-by-side
 * and bumps CURRENT_KEY_VERSION; old rows keep decrypting with V1
 * until re-encrypted (per ADR-008 and .env.example).
 *
 * `ENCRYPTION_KEY_V1` accepts a 32-byte key as base64 (44 chars) or
 * hex (64 chars). Keys are resolved lazily on first use so importing
 * this module never throws at build time.
 *
 * SERVER-ONLY. Both entry points throw immediately in a browser
 * context as defense in depth.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** GCM initialization-vector length in bytes (NIST-recommended). */
const IV_LENGTH = 12;
/** GCM authentication-tag length in bytes. */
const AUTH_TAG_LENGTH = 16;
/** Key version new encryptions are written with. */
const CURRENT_KEY_VERSION = 1;
/** Minimum decodable payload: version byte + IV + auth tag (empty ciphertext). */
const MIN_PAYLOAD_LENGTH = 1 + IV_LENGTH + AUTH_TAG_LENGTH;

/** Lazily-resolved key cache, indexed by version. */
const keyCache = new Map<number, Buffer>();

function assertServerSide(operation: string): void {
  if (typeof window !== "undefined") {
    throw new Error(
      `${operation} must only run on the server. The encryption key is never available to the browser.`,
    );
  }
}

/**
 * Resolve and validate the 32-byte key for a given version from
 * `ENCRYPTION_KEY_V<version>`. Accepts base64 or hex. Cached after
 * first successful resolution.
 */
function keyForVersion(version: number): Buffer {
  const cached = keyCache.get(version);
  if (cached !== undefined) {
    return cached;
  }

  const envName = `ENCRYPTION_KEY_V${version}`;
  const raw = process.env[envName];
  if (raw === undefined || raw.length === 0) {
    throw new Error(
      `${envName} is not set. Generate a 32-byte key (e.g. \`openssl rand -base64 32\`) and set it in the environment.`,
    );
  }

  let key: Buffer | null = null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) {
      key = decoded;
    }
  }

  if (key === null || key.length !== 32) {
    throw new Error(
      `${envName} must decode to exactly 32 bytes (got a value that decodes to ${
        key === null ? Buffer.from(raw, "base64").length : key.length
      } bytes). Provide 44 base64 chars or 64 hex chars.`,
    );
  }

  keyCache.set(version, key);
  return key;
}

/**
 * Encrypt a plaintext secret for at-rest storage.
 *
 * @param plaintext - The secret to protect (e.g. an API key). Must be
 *   non-empty — storing empty secrets is always a caller bug.
 * @returns The versioned, base64-encoded payload for the
 *   `*_encrypted` columns of `user_integrations`.
 */
export function encryptSecret(plaintext: string): string {
  assertServerSide("encryptSecret");
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("encryptSecret requires a non-empty string.");
  }

  const key = keyForVersion(CURRENT_KEY_VERSION);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([
    Buffer.from([CURRENT_KEY_VERSION]),
    iv,
    ciphertext,
    authTag,
  ]);
  return payload.toString("base64");
}

/**
 * Decrypt a payload produced by {@link encryptSecret}.
 *
 * Throws on: malformed base64, truncated payloads, unknown key
 * versions, missing keys, and — via GCM tag verification — any
 * tampering with the ciphertext or use of the wrong key.
 *
 * @param payload - The base64 string from a `*_encrypted` column.
 * @returns The original plaintext secret.
 */
export function decryptSecret(payload: string): string {
  assertServerSide("decryptSecret");
  if (typeof payload !== "string" || payload.length === 0) {
    throw new Error("decryptSecret requires a non-empty string.");
  }

  const decoded = Buffer.from(payload, "base64");
  if (decoded.length < MIN_PAYLOAD_LENGTH) {
    throw new Error(
      `Encrypted payload is too short (${decoded.length} bytes; minimum ${MIN_PAYLOAD_LENGTH}). The stored value is corrupt or not an AIWP secret payload.`,
    );
  }

  const version = decoded[0];
  if (version !== CURRENT_KEY_VERSION) {
    // Future rotations extend this to try older key versions.
    throw new Error(
      `Unknown encryption key version ${version}. This deployment supports version ${CURRENT_KEY_VERSION}.`,
    );
  }

  const key = keyForVersion(version);
  const iv = decoded.subarray(1, 1 + IV_LENGTH);
  const authTag = decoded.subarray(decoded.length - AUTH_TAG_LENGTH);
  const ciphertext = decoded.subarray(
    1 + IV_LENGTH,
    decoded.length - AUTH_TAG_LENGTH,
  );

  const decipher = createDecipheriv("aes-256-gcm", key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error(
      "Decryption failed: authentication tag mismatch. The stored value was tampered with or encrypted with a different key.",
    );
  }
}
