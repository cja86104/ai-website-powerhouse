"use server";

/**
 * AI Website Powerhouse — billing server actions (W3).
 *
 * `startCheckout` creates a Stripe Checkout session for the signed-in
 * user and redirects the browser to Stripe's hosted payment page.
 * The user's `stripe_customer_id` is created on first checkout and
 * saved through the RLS-scoped client (own-row update).
 *
 * The subscription state itself is NEVER written here — that is the
 * webhook's job (single source of truth, Section 7 §6.3). Checkout
 * success sends the user back to /account?upgraded=1 while the
 * webhook lands the DB writes.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { isSubscriptionPlan, priceIdForPlan } from "@/lib/stripe/prices";

export async function startCheckout(formData: FormData): Promise<void> {
  const plan = formData.get("plan");
  if (!isSubscriptionPlan(plan)) {
    redirect(`/account?error=${encodeURIComponent("Unknown plan selected.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/sign-in");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("stripe_customer_id, subscription_status")
    .eq("id", user.id)
    .single();
  if (profileError !== null) {
    redirect(`/account?error=${encodeURIComponent(profileError.message)}`);
  }
  if (profile.subscription_status === "pro") {
    redirect(
      `/account?error=${encodeURIComponent("You are already on Pro. Manage your plan below.")}`,
    );
  }

  const stripe = getStripe();

  // First checkout: create the Stripe customer and remember it.
  let customerId = profile.stripe_customer_id as string | null;
  if (customerId === null) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { aiwp_user_id: user.id },
    });
    customerId = customer.id;
    const { error: saveError } = await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
    if (saveError !== null) {
      redirect(`/account?error=${encodeURIComponent(saveError.message)}`);
    }
  }

  const headerList = await headers();
  const origin = headerList.get("origin") ?? "http://localhost:4000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
    subscription_data: { metadata: { aiwp_user_id: user.id } },
    success_url: `${origin}/account?upgraded=1`,
    cancel_url: `${origin}/account`,
  });

  if (session.url === null) {
    redirect(
      `/account?error=${encodeURIComponent("Stripe did not return a checkout URL.")}`,
    );
  }
  redirect(session.url);
}
