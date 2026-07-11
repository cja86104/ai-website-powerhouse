/**
 * AI Website Powerhouse — Stripe price-ID resolution (W3).
 *
 * Maps the app's plan names to the price IDs created by
 * scripts/stripe-setup.mjs (Section 7 §6.2). IDs live in env vars so
 * Test → Live is a five-line .env change at launch, no code edit.
 */

/** Self-serve subscription plans available in V1. */
export type SubscriptionPlan = "pro_monthly" | "pro_annual";

const PLAN_ENV_NAMES: Record<SubscriptionPlan, string> = {
  pro_monthly: "STRIPE_PRICE_ID_PRO_MONTHLY",
  pro_annual: "STRIPE_PRICE_ID_PRO_ANNUAL",
};

/** Narrowing guard for values arriving from form posts. */
export function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return value === "pro_monthly" || value === "pro_annual";
}

/** Resolve a plan's Stripe price ID; throws with a setup hint when unset. */
export function priceIdForPlan(plan: SubscriptionPlan): string {
  const envName = PLAN_ENV_NAMES[plan];
  const id = process.env[envName];
  if (id === undefined || id.length === 0) {
    throw new Error(
      `${envName} is not set. Run \`node scripts/stripe-setup.mjs\` and paste the printed price IDs into .env.local.`,
    );
  }
  return id;
}

/** Env names of the premium per-generation metered prices (Section 7). */
const PREMIUM_PRICE_ENV_NAMES = [
  "STRIPE_PRICE_ID_PREMIUM_QWEN480",
  "STRIPE_PRICE_ID_PREMIUM_HAIKU",
  "STRIPE_PRICE_ID_PREMIUM_SONNET",
  "STRIPE_PRICE_ID_PREMIUM_OPUS",
] as const;

/**
 * Premium metered price IDs to attach to every Pro subscription
 * (2026-07-12). Meter events only bill when the metered price is a
 * SUBSCRIPTION ITEM — without these on the checkout, premium usage
 * was recorded but never invoiced. Missing env vars are skipped with
 * a loud log so a partial setup degrades to unbilled (never broken
 * checkout).
 */
export function premiumMeteredPriceIds(): string[] {
  const ids: string[] = [];
  for (const envName of PREMIUM_PRICE_ENV_NAMES) {
    const id = process.env[envName];
    if (id === undefined || id.length === 0) {
      console.error(
        `BILLING SETUP: ${envName} is not set — that premium model's usage will NOT be invoiced.`,
      );
      continue;
    }
    ids.push(id);
  }
  return ids;
}
