/**
 * AI Website Powerhouse — Cloudflare Turnstile verification (W4).
 *
 * Feature-flagged on the env pair: when TURNSTILE_SECRET_KEY is not
 * set, verification is skipped (returns ok) so local/dev and
 * self-host setups work without a Cloudflare account. The sign-up
 * page only renders the widget when NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is present, keeping the two sides consistent.
 */

const VERIFY_ENDPOINT =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True when Turnstile is configured server-side. */
export function turnstileEnabled(): boolean {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  return secret !== undefined && secret.length > 0;
}

/**
 * Verify a Turnstile token. Returns true when the challenge passed —
 * or when Turnstile is not configured. Verification-service outages
 * fail CLOSED for sign-up (a bot wave during an outage is worse than
 * a signup hiccup; users can retry).
 */
export async function verifyTurnstileToken(
  token: string | null,
  remoteIp: string | null,
): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (token === null || token.length === 0) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY as string;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp !== null) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return false;
  }
}
