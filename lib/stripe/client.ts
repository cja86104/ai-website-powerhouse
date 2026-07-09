/**
 * AI Website Powerhouse — server-side Stripe client (W3).
 *
 * Singleton wrapper around the official SDK. SERVER-ONLY: the secret
 * key must never reach a client bundle; the runtime guard is defense
 * in depth on top of "only server code imports this".
 *
 * No `apiVersion` pin: the SDK uses the account's default API version,
 * which matches how the Test-mode catalog was created. Pinning is
 * revisited at launch (W12) together with the Live-mode switch.
 */

import Stripe from "stripe";

let cached: Stripe | null = null;

/** Get the process-wide Stripe client, creating it on first use. */
export function getStripe(): Stripe {
  if (typeof window !== "undefined") {
    throw new Error(
      "getStripe must only run on the server. The Stripe secret key is never available to the browser.",
    );
  }
  if (cached !== null) {
    return cached;
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (key === undefined || key.length === 0) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Copy the sk_test_ key from the Stripe dashboard into .env.local.",
    );
  }
  cached = new Stripe(key);
  return cached;
}
