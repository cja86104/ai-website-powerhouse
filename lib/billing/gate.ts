/**
 * AI Website Powerhouse — hosted-generation subscription gate (W3 Thu).
 *
 * Applied by the root middleware to POST /api/openrouter — the
 * server-key proxy path. BYOK requests go browser-direct to
 * openrouter.ai and Ollama runs locally, so neither passes through
 * here: this gate prices exactly the thing AIWP pays for.
 *
 * Entitlement rules (Section 7):
 *  - pro                       → allowed (200/mo quota lands in W4
 *                                with the usage-metering work)
 *  - canceled, period not over → still allowed (§6.3: access
 *                                continues until current_period_end)
 *  - past_due                  → allowed; the 7-day soft-degrade
 *                                arrives with W4's grace tracking
 *  - free                      → 3 hosted generations per rolling
 *                                24h, counted from the user's own
 *                                generations rows via RLS
 *
 * V1 approximations, documented deliberately:
 *  - The free cap counts ALL curated models, not just DeepSeek —
 *    restricting by model needs the request body, which Next
 *    middleware cannot read; the in-route check is W4 work (touches
 *    the protected proxy route, needs explicit approval).
 *  - "Daily" is a rolling 24h window, not user-local midnight.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Free-tier hosted generations per rolling 24 hours (Section 7 Tier 1). */
const FREE_HOSTED_GENERATIONS_PER_DAY = 3;

/**
 * Returns null when the request may proceed, or a 4xx response to
 * short-circuit with. Fails OPEN on infrastructure errors (a broken
 * billing lookup must not take generation down for paying users) —
 * errors are logged for W4's observability pass.
 */
export async function gateHostedGeneration(
  request: NextRequest,
): Promise<NextResponse | null> {
  const { url, anonKey } = getSupabasePublicEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Read-only client: session refresh already happened in
        // updateSession earlier in the middleware chain.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    // The auth gate runs before this; an unauthenticated request here
    // means a non-browser client hitting the API directly.
    return NextResponse.json(
      { error: "Sign in to use hosted generations." },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("subscription_status, current_period_end")
    .eq("id", user.id)
    .single();
  if (profileError !== null) {
    console.error("Billing gate profile lookup failed:", profileError.message);
    return null; // fail open
  }

  const status = profile.subscription_status as string;
  if (status === "pro" || status === "past_due") {
    return null;
  }
  if (
    status === "canceled" &&
    typeof profile.current_period_end === "string" &&
    new Date(profile.current_period_end).getTime() > Date.now()
  ) {
    return null;
  }

  // Free tier: count hosted (non-BYOK) OpenRouter generations in the
  // last 24h. RLS scopes the count to the requesting user.
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("provider", "openrouter")
    .eq("used_byo_key", false)
    .gte("created_at", windowStart);
  if (countError !== null) {
    console.error("Billing gate usage count failed:", countError.message);
    return null; // fail open
  }

  if ((count ?? 0) >= FREE_HOSTED_GENERATIONS_PER_DAY) {
    return NextResponse.json(
      {
        error:
          "Free plan includes 3 hosted generations per day and you've used them. " +
          "Paste your own OpenRouter API key in Settings for unlimited generations, " +
          "switch to local Ollama, or upgrade to Pro for 200 hosted generations a month.",
      },
      { status: 402 },
    );
  }

  return null;
}
