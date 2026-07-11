"use server";

/**
 * Usage meter (W9 Mon). Read-only summary of the signed-in user's
 * generation activity for the header chip:
 *
 *  - Hosted quota position: used/limit inside the SAME rolling window
 *    the quota gate enforces (rolling 24h free / rolling 30d Pro) —
 *    both readers share `hasProQuotaRules`, so the chip can never
 *    disagree with the gate.
 *  - Month-to-date counts by path (hosted / BYOK / Ollama) for the
 *    tooltip breakdown.
 *
 * Fails soft: signed-out or any query error returns null and the
 * chip simply doesn't render — a metering hiccup must never break
 * the builder UI.
 */

import { createClient } from "@/lib/supabase/server";
import { QUOTA_LIMITS, hasProQuotaRules } from "@/lib/billing/quota";

export interface UsageSummary {
  /** Which rule set applies right now. */
  effectivePlan: "free" | "pro";
  /** Hosted generations used inside the enforced rolling window. */
  hostedUsed: number;
  hostedLimit: number;
  /** Human label for the window ("today" / "30 days"). */
  windowLabel: string;
  /** Calendar-month-to-date counts by generation path. */
  monthHosted: number;
  monthByok: number;
  monthOllama: number;
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function countGenerations(
  supabase: ServerClient,
  sinceIso: string,
  filters: { provider: string; usedByoKey?: boolean },
): Promise<number | null> {
  let query = supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("provider", filters.provider)
    .gte("created_at", sinceIso);
  if (filters.usedByoKey !== undefined) {
    query = query.eq("used_byo_key", filters.usedByoKey);
  }
  const { count, error } = await query;
  if (error !== null) {
    console.error("Usage count failed:", error.message);
    return null;
  }
  return count ?? 0;
}

/** Usage summary for the signed-in user, or null (signed out / error). */
export async function getUsageSummary(): Promise<UsageSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("subscription_status, current_period_end")
    .eq("id", user.id)
    .single();
  if (profileError !== null) {
    console.error("Usage profile lookup failed:", profileError.message);
    return null;
  }

  const now = Date.now();
  const periodEndMs =
    typeof profile.current_period_end === "string"
      ? new Date(profile.current_period_end).getTime()
      : null;
  const pro = hasProQuotaRules(
    profile.subscription_status as string,
    periodEndMs,
    now,
  );

  const windowSince = pro
    ? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthSince = monthStart.toISOString();

  const [hostedUsed, monthHosted, monthByok, monthOllama] = await Promise.all([
    countGenerations(supabase, windowSince, {
      provider: "openrouter",
      usedByoKey: false,
    }),
    countGenerations(supabase, monthSince, {
      provider: "openrouter",
      usedByoKey: false,
    }),
    countGenerations(supabase, monthSince, {
      provider: "openrouter",
      usedByoKey: true,
    }),
    countGenerations(supabase, monthSince, { provider: "ollama" }),
  ]);
  if (
    hostedUsed === null ||
    monthHosted === null ||
    monthByok === null ||
    monthOllama === null
  ) {
    return null;
  }

  return {
    effectivePlan: pro ? "pro" : "free",
    hostedUsed,
    hostedLimit: pro ? QUOTA_LIMITS.proPerMonth : QUOTA_LIMITS.freePerDay,
    windowLabel: pro ? "30 days" : "today",
    monthHosted,
    monthByok,
    monthOllama,
  };
}
