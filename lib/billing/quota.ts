/**
 * AI Website Powerhouse — hosted-generation quota check (W4).
 *
 * Called from inside POST /api/openrouter (user-approved modification
 * of the protected route, 2026-07-10) — the one place that can see
 * the requested model. Replaces the coarser middleware gate from W3
 * Thu, which could not read the request body.
 *
 * Entitlement rules (Section 7):
 *  - Free:     hosted generations use DeepSeek V3.2 ONLY, max 3 per
 *              rolling 24h.
 *  - Pro:      any curated model, max 200 hosted generations per
 *              rolling 30 days.
 *  - canceled: keeps Pro rules until current_period_end (§6.3).
 *  - past_due: keeps Pro rules for a 7-day grace window past
 *              current_period_end, then degrades to Free rules.
 *
 * Counting uses the user's own `generations` rows (provider =
 * openrouter, used_byo_key = false) under RLS. Infrastructure
 * failures fail OPEN — a billing outage must never break generation
 * for paying users — but a missing session fails CLOSED (401).
 */

import { createClient } from "@/lib/supabase/server";

/**
 * The free tier's only hosted model. Matches the curated catalog
 * entry in lib/models.ts ("DeepSeek V3.2 — Best value").
 */
const FREE_TIER_MODEL = "deepseek/deepseek-v3.2";
/** Free-tier hosted generations per rolling 24 hours. */
const FREE_PER_DAY = 3;
/** Pro-tier hosted generations per rolling 30 days. */
const PRO_PER_MONTH = 200;
/** Grace window for past_due before Pro rules degrade (ms). */
const PAST_DUE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/** Quota constants shared with the usage meter (W9 Mon). */
export const QUOTA_LIMITS = {
  freePerDay: FREE_PER_DAY,
  proPerMonth: PRO_PER_MONTH,
} as const;

/**
 * Pure entitlement rule: does this subscription state get Pro quota
 * rules right now? Exported so the W9 usage meter displays EXACTLY
 * the window/limit the quota gate will enforce — one rule, two
 * readers.
 */
export function hasProQuotaRules(
  status: string,
  periodEndMs: number | null,
  nowMs: number,
): boolean {
  return (
    status === "pro" ||
    (status === "canceled" && periodEndMs !== null && periodEndMs > nowMs) ||
    (status === "past_due" &&
      (periodEndMs === null || periodEndMs + PAST_DUE_GRACE_MS > nowMs))
  );
}

export type QuotaDecision =
  | { allowed: true }
  | { allowed: false; status: 401 | 402; message: string };

async function countHostedGenerations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sinceIso: string,
): Promise<number | null> {
  const { count, error } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("provider", "openrouter")
    .eq("used_byo_key", false)
    .gte("created_at", sinceIso);
  if (error !== null) {
    console.error("Quota count failed:", error.message);
    return null;
  }
  return count ?? 0;
}

/** Decide whether the signed-in user may run a hosted generation on `model`. */
export async function checkHostedQuota(model: string): Promise<QuotaDecision> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    return {
      allowed: false,
      status: 401,
      message: "Sign in to use hosted generations.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("subscription_status, current_period_end")
    .eq("id", user.id)
    .single();
  if (profileError !== null) {
    console.error("Quota profile lookup failed:", profileError.message);
    return { allowed: true }; // fail open
  }

  const status = profile.subscription_status as string;
  const periodEndMs =
    typeof profile.current_period_end === "string"
      ? new Date(profile.current_period_end).getTime()
      : null;
  const now = Date.now();

  const hasProRules = hasProQuotaRules(status, periodEndMs, now);

  if (hasProRules) {
    const since = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const used = await countHostedGenerations(supabase, since);
    if (used === null) return { allowed: true }; // fail open
    if (used >= PRO_PER_MONTH) {
      return {
        allowed: false,
        status: 402,
        message:
          `Pro includes ${PRO_PER_MONTH} hosted generations per 30 days and you've used them. ` +
          "Paste your own OpenRouter API key in Settings for unlimited generations at provider-direct prices, or switch to local Ollama.",
      };
    }
    return { allowed: true };
  }

  // Free rules: DeepSeek only, 3 per rolling 24h.
  if (model !== FREE_TIER_MODEL) {
    return {
      allowed: false,
      status: 402,
      message:
        "Free hosted generations use DeepSeek V3.2 only — select it in Settings, " +
        "paste your own OpenRouter API key for any model, or upgrade to Pro.",
    };
  }
  const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const used = await countHostedGenerations(supabase, since);
  if (used === null) return { allowed: true }; // fail open
  if (used >= FREE_PER_DAY) {
    return {
      allowed: false,
      status: 402,
      message:
        `Free plan includes ${FREE_PER_DAY} hosted generations per day and you've used them. ` +
        "Paste your own OpenRouter API key in Settings for unlimited generations, switch to local Ollama, or upgrade to Pro.",
    };
  }
  return { allowed: true };
}
