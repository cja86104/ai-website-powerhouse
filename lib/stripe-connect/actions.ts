"use server";

/**
 * AI Website Powerhouse — Connect Your Stripe (2026-08-01).
 *
 * Mirrors lib/supabase-connect/actions.ts exactly: lets a user point ONE
 * project at their own Stripe account (publishable key only) so generated
 * code can wire a real Stripe Elements checkout UI, rather than a fake
 * "Buy Now" button that does nothing.
 *
 * SCOPE BOUNDARY — do not expand without a new design pass: this NEVER
 * collects a secret key or restricted key, and it NEVER creates a
 * PaymentIntent, Checkout Session, or any other server-side Stripe call
 * on the user's behalf. AIWP's generated output is a static frontend
 * with no server runtime — there is nowhere safe to hold a secret key
 * even if one were collected. Generated checkout UIs always need a
 * backend the user supplies themselves to actually complete a charge;
 * see lib/prompts/stripe-block.ts for how that limitation is surfaced
 * to the model (and, via a chat note, to the user).
 *
 * The publishable key is encrypted at rest via the same
 * lib/crypto/secrets.ts helper as the Supabase anon key, for
 * defense-in-depth and consistency — even though Stripe's own docs say
 * publishable keys are safe to expose client-side. It IS returned to
 * the caller by loadStripeConnection (same category as the Supabase
 * anon key / OpenRouter BYOK key): the generated app's own bundle needs
 * the literal value.
 *
 * Ownership: every function is scoped to the SIGNED-IN user's own
 * projects. RLS (`projects_owner_all`, 0002) is the actual enforcement
 * boundary; the explicit existence check below mirrors
 * `requireOwnedProject` in lib/supabase-connect/actions.ts.
 */

import { createClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secrets";

/** A project's saved Stripe connection, or null when unset/unreadable. */
export interface StripeConnection {
  publishableKey: string;
  connectedAt: string;
}

/**
 * Shape-check a pasted Stripe publishable key. Stripe issues these as
 * "pk_test_..." or "pk_live_..." — this deliberately does NOT reject a
 * live key (a live key pasted here still can't move money without a
 * secret-key-backed backend, so there's no safety reason to block it),
 * it only rejects obviously-wrong input like a secret key or a blank
 * paste.
 */
function isPublishableKeyShape(raw: string): boolean {
  return /^pk_(test|live)_[A-Za-z0-9]{16,}$/.test(raw.trim());
}

/** Throws unless a project row exists and is visible to the caller under RLS. */
async function requireOwnedProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (error !== null) {
    throw new Error(`Could not look up the project: ${error.message}`);
  }
  if (data === null) {
    throw new Error("Project not found.");
  }
}

/**
 * Save (or overwrite) a project's Stripe connection. Validates the
 * publishable-key shape; a value that looks like a secret key
 * ("sk_...") or restricted key ("rk_...") is rejected outright — this
 * function must never store one.
 */
export async function saveStripeConnection(
  projectId: string,
  publishableKey: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to connect a Stripe account.");
  }
  await requireOwnedProject(supabase, projectId);

  const trimmedKey = publishableKey.trim();
  if (/^(sk|rk)_(test|live)_/.test(trimmedKey)) {
    throw new Error(
      "That looks like a Stripe SECRET key, not a publishable key. AIWP never stores secret keys — paste the key that starts with \"pk_test_\" or \"pk_live_\" from your Stripe Dashboard's API keys page instead.",
    );
  }
  if (!isPublishableKeyShape(trimmedKey)) {
    throw new Error(
      'That doesn\'t look like a Stripe publishable key. It should look like "pk_test_51AbCdEf..." — find it on the API keys page of your Stripe Dashboard.',
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({
      stripe_publishable_key_encrypted: encryptSecret(trimmedKey),
      stripe_connected_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (error !== null) {
    throw new Error(`Failed to save the connection: ${error.message}`);
  }
}

/** Disconnects a project's Stripe account (both columns cleared). */
export async function clearStripeConnection(projectId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to manage your Stripe connection.");
  }
  await requireOwnedProject(supabase, projectId);

  const { error } = await supabase
    .from("projects")
    .update({
      stripe_publishable_key_encrypted: null,
      stripe_connected_at: null,
    })
    .eq("id", projectId);
  if (error !== null) {
    throw new Error(`Failed to disconnect: ${error.message}`);
  }
}

/**
 * Load a project's Stripe connection, decrypted, or null when the
 * project has none saved. A stored value that fails to decrypt (wrong
 * key version, tampered payload) surfaces as null rather than an
 * error — same posture as `loadSupabaseConnection`.
 */
export async function loadStripeConnection(
  projectId: string,
): Promise<StripeConnection | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("stripe_publishable_key_encrypted, stripe_connected_at")
    .eq("id", projectId)
    .maybeSingle();
  if (error !== null || data === null) return null;

  const encrypted = data.stripe_publishable_key_encrypted as string | null;
  const connectedAt = data.stripe_connected_at as string | null;
  if (encrypted === null || connectedAt === null) {
    return null;
  }

  try {
    return { publishableKey: decryptSecret(encrypted), connectedAt };
  } catch (decryptError) {
    console.error(
      `Stored Stripe connection for project ${projectId} could not be decrypted:`,
      decryptError,
    );
    return null;
  }
}
