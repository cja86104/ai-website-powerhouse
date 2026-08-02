/**
 * Conditional Stripe-payments prompt block (2026-08-01, Connect Your
 * Stripe item 4; extended same day with the real backend piece).
 * Mirrors lib/prompts/supabase-block.ts's non-invasive append pattern
 * exactly — zero changes to react-system-prompt.ts / react-modify-prompt.ts
 * / scoped-modify-prompt.ts bytes. Returns an empty string when no
 * Stripe connection is passed, so callers can always concatenate the
 * result unconditionally.
 *
 * Deliberately gated by the CALLER passing `null`/`false` (Builder.tsx
 * only resolves real connections for react-vite projects) — this
 * module has no framework awareness of its own, on purpose.
 *
 * TWO OUTCOMES depending on whether the SAME project also has Supabase
 * connected:
 *  - Stripe only: a publishable key can build a fully real checkout UI
 *    with real client-side card validation, but cannot complete an
 *    actual charge — that needs a secret key on a server, and this
 *    project has none. The model is told to build the real UI and be
 *    honest in code about the missing piece (an intentionally
 *    unimplemented function that throws a clear error), never to fake
 *    a successful charge.
 *  - Stripe + Supabase: `lib/generation/stripe-scaffold.ts`'s
 *    `ensureStripeBackendFunction` backstop generates a real, deployable
 *    Supabase Edge Function that creates the PaymentIntent server-side
 *    (secret key supplied by the USER directly to Supabase, never seen
 *    by AIWP). The model is told to wire the submit handler to that
 *    real function instead of the throw-an-error stub.
 */

import type { StripeConnection } from "@/lib/stripe-connect/actions";

const SHARED_INTRO = `A real Stripe account is connected to this project (publishable key only — AIWP never stores a secret key). A ready-made Stripe promise already exists (or will be created for you) at src/lib/stripe.ts. Import it exactly like this:
  import { stripePromise } from './lib/stripe'
Wrap checkout UI in <Elements stripe={stripePromise}> from "@stripe/react-stripe-js", and build the form with the <PaymentElement /> (or <CardElement />) component plus the useStripe()/useElements() hooks for real client-side validation. NEVER call loadStripe() yourself anywhere else in the project, and NEVER invent, guess, or hardcode a publishable key — only ever use the pre-built stripePromise at src/lib/stripe.ts.`;

const NO_BACKEND_SECTION = `IMPORTANT LIMITATION — be upfront about it in the code, never fake it: actually completing a charge requires calling stripe.confirmPayment() with a client_secret from a real PaymentIntent, and PaymentIntents can only be created server-side with a Stripe SECRET key. This project has no backend and no secret key, so a real charge cannot succeed yet. Still build the COMPLETE checkout UI — cart/order summary, the PaymentElement, a submit button, loading and error states — exactly as if the backend existed. The submit handler should call a clearly-named async function such as createPaymentIntent(amountInCents) that is NOT implemented: have it throw new Error("Connect a backend to accept real payments — see the comment in src/lib/stripe.ts") with a code comment explaining the user needs to add a server endpoint (a Vercel serverless function, a Supabase Edge Function, or any backend they control) that creates the PaymentIntent using their own Stripe secret key. Never pretend a payment succeeded and never fabricate a client_secret.`;

const WITH_BACKEND_SECTION = `A ready-to-deploy backend also exists (or will be created for you) at supabase/functions/create-payment-intent/index.ts — a real Supabase Edge Function that creates a Stripe PaymentIntent server-side using a secret key the user sets directly in Supabase (AIWP never sees or stores it). Build the COMPLETE checkout UI — cart/order summary, the PaymentElement, a submit button, loading and error states — and wire the submit handler to call the real function through the already-connected Supabase client:
  const { data, error } = await supabase.functions.invoke('create-payment-intent', { body: { amount: amountInCents, currency: 'usd' } })
On success, call stripe.confirmPayment({ elements, clientSecret: data.clientSecret, confirmParams: { return_url: ... } }) (or confirmCardPayment for a bare CardElement). Handle the case where the function call fails (network error, or the user hasn't deployed/configured it yet) with a clear on-screen error — that failure is expected until the user runs \`supabase functions deploy create-payment-intent\` and sets their Stripe secret key, and is not a bug to work around. Never pretend a payment succeeded and never fabricate a client_secret yourself.`;

/**
 * Build the block telling the model a real Stripe account is
 * connected and how to use it safely. `connection === null` means "not
 * connected" — the model gets zero mention of Stripe and must not
 * import "@stripe/stripe-js" or "@stripe/react-stripe-js" (see the
 * IMPORT WHITELIST guidance in react-system-prompt.ts, which says
 * exactly that). `hasSupabaseConnection` switches between the
 * no-backend-yet instructions and the real-Edge-Function instructions.
 */
export function buildStripeBlock(
  connection: StripeConnection | null,
  hasSupabaseConnection: boolean,
): string {
  if (connection === null) return "";
  const backendSection = hasSupabaseConnection
    ? WITH_BACKEND_SECTION
    : NO_BACKEND_SECTION;
  return `

STRIPE PAYMENTS CONNECTED:
${SHARED_INTRO}
${backendSection}`;
}
