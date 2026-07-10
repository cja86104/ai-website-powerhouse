"use server";

/**
 * AI Website Powerhouse — account-synced integrations (W5 UX).
 *
 * The BYOK OpenRouter key previously lived only in the browser's
 * localStorage (Zustand persist), so it silently failed to follow the
 * user across browsers/machines. These actions make the ACCOUNT the
 * source of truth: the key is AES-256-GCM encrypted (ADR-008,
 * lib/crypto/secrets.ts) into `user_integrations
 * .openrouter_key_encrypted` under RLS, and restored at sign-in.
 * localStorage remains a local cache for instant hydration.
 *
 * Returning the decrypted key to its owner's browser is inherent to
 * the BYOK-direct architecture — the browser must hold the key to
 * call openrouter.ai directly (that IS the privacy feature: the key
 * and prompts bypass our server entirely). RLS + session auth ensure
 * only the owner can read it.
 *
 * Multi-key BYOK (several providers stored at once, key health) is
 * the W10 deliverable; this is the single-key foundation.
 */

import { createClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secrets";

/**
 * Persist (or clear, with an empty string) the user's OpenRouter key.
 * Throws with an actionable message when ENCRYPTION_KEY_V1 is not
 * configured on the deployment.
 */
export async function saveOpenrouterKey(key: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to save your API key.");
  }

  const trimmed = key.trim();
  const encrypted = trimmed.length > 0 ? encryptSecret(trimmed) : null;

  const { error } = await supabase
    .from("user_integrations")
    .update({ openrouter_key_encrypted: encrypted })
    .eq("user_id", user.id);
  if (error !== null) {
    throw new Error(`Failed to save key: ${error.message}`);
  }
}

/**
 * Load the user's stored OpenRouter key, or null when none is saved.
 * Decryption failures (e.g. rotated encryption key without
 * re-encryption) surface as null rather than an error — the user can
 * simply re-enter the key.
 */
export async function loadOpenrouterKey(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_integrations")
    .select("openrouter_key_encrypted")
    .eq("user_id", user.id)
    .single();
  if (error !== null || data === null) {
    return null;
  }
  const encrypted = data.openrouter_key_encrypted as string | null;
  if (encrypted === null || encrypted.length === 0) {
    return null;
  }
  try {
    return decryptSecret(encrypted);
  } catch (decryptError) {
    console.error("Stored key could not be decrypted:", decryptError);
    return null;
  }
}

/**
 * Persist (or clear, with an empty string) the user's Vercel access
 * token (W8). Encrypted at rest like the OpenRouter key — but unlike
 * that key it is NEVER returned to the browser: deploys decrypt it
 * server-side only (lib/deploy/vercel.ts).
 */
export async function saveVercelToken(token: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to save your Vercel token.");
  }

  const trimmed = token.trim();
  const encrypted = trimmed.length > 0 ? encryptSecret(trimmed) : null;

  const { error } = await supabase
    .from("user_integrations")
    .update({ vercel_token_encrypted: encrypted })
    .eq("user_id", user.id);
  if (error !== null) {
    throw new Error(`Failed to save token: ${error.message}`);
  }
}

/** Whether a Vercel token is saved (the token itself never leaves the server). */
export async function hasVercelToken(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return false;

  const { data, error } = await supabase
    .from("user_integrations")
    .select("vercel_token_encrypted")
    .eq("user_id", user.id)
    .single();
  if (error !== null || data === null) return false;
  const encrypted = data.vercel_token_encrypted as string | null;
  return encrypted !== null && encrypted.length > 0;
}
