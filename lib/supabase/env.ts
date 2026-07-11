/**
 * AI Website Powerhouse — Supabase environment resolution.
 *
 * Single source of truth for the two public Supabase values. Both are
 * safe to expose to the browser (the anon key is designed for that;
 * RLS enforces authorization). The service-role key is deliberately
 * NOT handled here — server-only admin code reads it directly so it
 * can never leak into a module imported by client components.
 */

/** Validated pair of public Supabase connection values. */
export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

/**
 * Read and validate `NEXT_PUBLIC_SUPABASE_URL` and
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Throws with a setup hint when
 * either is missing — a misconfigured deployment should fail loudly
 * at first use, not limp along with undefined behavior.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url === undefined || url.length === 0) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Copy it from your Supabase project's API settings into .env.local.",
    );
  }
  if (anonKey === undefined || anonKey.length === 0) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Copy it from your Supabase project's API settings into .env.local.",
    );
  }

  // Normalize (2026-07-12, hit twice now — locally in W2, then on
  // Vercel): dashboards make it easy to copy the URL with an API path
  // suffix ("/rest/v1/", "/auth/v1"), which Supabase rejects at sign-in
  // with the cryptic "invalid path specified in request url". The
  // client needs the BARE project origin; strip known suffixes and
  // trailing slashes rather than failing on a recoverable mistake.
  const normalizedUrl = url
    .trim()
    .replace(/\/(rest|auth|storage|realtime|functions)\/v1\/?$/i, "")
    .replace(/\/+$/, "");
  if (!/^https?:\/\/[^/]+$/.test(normalizedUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be the bare project URL like https://abcdefgh.supabase.co — got "${url}".`,
    );
  }

  return { url: normalizedUrl, anonKey };
}
