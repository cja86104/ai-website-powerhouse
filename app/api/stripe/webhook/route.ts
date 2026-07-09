/**
 * AI Website Powerhouse — Stripe webhook handler (W3).
 *
 * The single source of truth for subscription state (Section 7 §6.3).
 * Every event is: (1) signature-verified against STRIPE_WEBHOOK_SECRET,
 * (2) recorded in processed_stripe_events — a duplicate delivery hits
 * the primary key and is acknowledged without reprocessing, (3) mapped
 * onto public.users columns via the service-role client (webhooks have
 * no user session; RLS is bypassed deliberately and narrowly here).
 *
 * Unhandled event types are acknowledged with 200 so Stripe does not
 * retry them forever. Signature failures get 400. Handler errors get
 * 500 so Stripe retries — the idempotency ledger only records events
 * whose writes SUCCEEDED, making retries safe.
 */

import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

/** Map a Stripe subscription status onto our users.subscription_status enum. */
function mapSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "pro" | "past_due" | "canceled" {
  switch (status) {
    case "active":
    case "trialing":
      return "pro";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      // incomplete, incomplete_expired, canceled, paused
      return "canceled";
  }
}

/**
 * Period end moved from Subscription.current_period_end to the
 * subscription item in newer Stripe API versions. Read both shapes.
 */
function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0] as unknown as Record<string, unknown>;
  const fromItem = item !== undefined ? item["current_period_end"] : undefined;
  if (typeof fromItem === "number") {
    return new Date(fromItem * 1000).toISOString();
  }
  const legacy = (subscription as unknown as Record<string, unknown>)[
    "current_period_end"
  ];
  if (typeof legacy === "number") {
    return new Date(legacy * 1000).toISOString();
  }
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (secret === undefined || secret.length === 0) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (signature === null) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Raw body required — any parsing before verification breaks the HMAC.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency check first: have we fully processed this event before?
  const { data: seen, error: seenError } = await admin
    .from("processed_stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (seenError !== null) {
    console.error("Idempotency lookup failed:", seenError.message);
    return NextResponse.json({ error: "Ledger unavailable." }, { status: 500 });
  }
  if (seen !== null) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (userId === null) {
          console.error(`checkout.session.completed ${event.id} has no client_reference_id.`);
          break;
        }
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription?.id ?? null);
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer?.id ?? null);

        let periodEnd: string | null = null;
        if (subscriptionId !== null) {
          const subscription =
            await getStripe().subscriptions.retrieve(subscriptionId);
          periodEnd = subscriptionPeriodEnd(subscription);
        }

        const { error } = await admin
          .from("users")
          .update({
            subscription_status: "pro",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
          })
          .eq("id", userId);
        if (error !== null) throw new Error(error.message);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const { error } = await admin
          .from("users")
          .update({
            subscription_status: mapSubscriptionStatus(subscription.status),
            current_period_end: subscriptionPeriodEnd(subscription),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("stripe_subscription_id", subscription.id);
        if (error !== null) throw new Error(error.message);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        // Access continues until current_period_end (Section 7 §6.3);
        // the status flips now, feature gating reads the period end.
        const { error } = await admin
          .from("users")
          .update({
            subscription_status: "canceled",
            cancel_at_period_end: false,
          })
          .eq("stripe_subscription_id", subscription.id);
        if (error !== null) throw new Error(error.message);
        break;
      }

      case "invoice.payment_succeeded": {
        // Log only in V1; receipt emails are a LATER nicety.
        console.log(`invoice.payment_succeeded: ${event.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : (invoice.customer?.id ?? null);
        if (customerId === null) break;
        const { error } = await admin
          .from("users")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        if (error !== null) throw new Error(error.message);
        break;
      }

      case "customer.deleted": {
        // Our own account-deletion flow removes users first; a customer
        // deleted directly in the Stripe dashboard just gets logged.
        console.log(`customer.deleted: ${event.id}`);
        break;
      }

      default:
        // Acknowledged, not processed — do not record in the ledger so
        // a future handler for this type can still process replays.
        return NextResponse.json({ received: true, ignored: event.type });
    }

    // Record success LAST: failures above return 500 → Stripe retries.
    const { error: ledgerError } = await admin
      .from("processed_stripe_events")
      .insert({ event_id: event.id, event_type: event.type });
    if (ledgerError !== null && !ledgerError.message.includes("duplicate")) {
      console.error("Ledger write failed:", ledgerError.message);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Webhook handler failed for ${event.type} ${event.id}:`, error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }
}
