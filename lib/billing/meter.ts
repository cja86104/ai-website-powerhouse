/**
 * Premium-model usage metering (2026-07-12, user request: "the money
 * makers need to be in there").
 *
 * Called ONLY from inside POST /api/openrouter — the one place that
 * is by construction the HOSTED-key path (BYOK requests go
 * browser→OpenRouter directly and never touch this server). One
 * meter event = one generation on a premium model = the per-site
 * surcharge on the user's next invoice (Stripe meters created by
 * scripts/stripe-setup.mjs; aggregation = count × unit price).
 *
 * Fail-open by design: a metering hiccup must never block a paying
 * user's generation — but it is logged loudly because it is lost
 * revenue.
 */

import { createClient } from "@/lib/supabase/server";
import { findCuratedModel } from "@/lib/models";

/** Model slug -> Stripe meter event_name (must match stripe-setup.mjs). */
const METER_EVENT_BY_MODEL: Record<string, string> = {
  "qwen/qwen3-coder": "aiwp_premium_qwen480",
  "anthropic/claude-haiku-4.5": "aiwp_premium_haiku",
  "anthropic/claude-sonnet-5": "aiwp_premium_sonnet",
  "anthropic/claude-opus-4.8": "aiwp_premium_opus",
};

/** Whether hosted use of this model bills a per-generation surcharge. */
export function isPremiumHostedModel(model: string): boolean {
  return (
    METER_EVENT_BY_MODEL[model] !== undefined &&
    findCuratedModel(model)?.hostedSurcharge !== undefined
  );
}

/**
 * Record one billable premium generation for the signed-in user.
 * Resolves the Stripe customer id under RLS and posts the meter
 * event. All failure paths log and return — see fail-open note above.
 */
export async function recordPremiumUsage(model: string): Promise<void> {
  const eventName = METER_EVENT_BY_MODEL[model];
  if (eventName === undefined) return;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (typeof stripeKey !== "string" || stripeKey.length === 0) {
    console.error("METERING LOST: STRIPE_SECRET_KEY not configured.");
    return;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user === null) return;

    const { data: profile, error } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    const customerId = profile?.stripe_customer_id as string | null;
    if (error !== null || customerId === null || customerId.length === 0) {
      console.error(
        `METERING LOST: no stripe_customer_id for user ${user.id} (model ${model}).`,
      );
      return;
    }

    const body = new URLSearchParams({
      event_name: eventName,
      "payload[stripe_customer_id]": customerId,
      "payload[value]": "1",
    });
    const response = await fetch(
      "https://api.stripe.com/v1/billing/meter_events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
    if (!response.ok) {
      console.error(
        `METERING LOST: Stripe meter_events ${response.status} for ${eventName}: ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error("METERING LOST:", error);
  }
}
