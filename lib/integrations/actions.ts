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

/** Account-stored OpenRouter settings (2026-07-12 UX). */
export interface OpenrouterProfile {
  /** Decrypted BYOK key, or null when none is saved/decryptable. */
  key: string | null;
  model: string | null;
  customSlug: string | null;
  maxTokens: number | null;
}

/**
 * Persist the user's non-secret OpenRouter preferences (model,
 * custom slug, max output tokens) to the account, so the model they
 * generated with is the model their next session edits with —
 * regardless of browser (user-reported: "we don't want them making
 * one with sonnet and coming back later editing with deepseek").
 * Fire-and-forget from the client; failures only log.
 */
export async function saveOpenrouterPrefs(prefs: {
  model: string;
  customSlug: string;
  maxTokens: number;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to save your settings.");
  }

  const { error } = await supabase
    .from("user_integrations")
    .update({
      openrouter_model: prefs.model,
      openrouter_custom_slug: prefs.customSlug,
      openrouter_max_tokens: prefs.maxTokens,
    })
    .eq("user_id", user.id);
  if (error !== null) {
    throw new Error(`Failed to save settings: ${error.message}`);
  }
}

/**
 * Load the user's full OpenRouter profile (key + preferences), or
 * null when signed out. Decryption failures on the key surface as a
 * null key rather than an error — the user can simply re-enter it.
 */
export async function loadOpenrouterProfile(): Promise<OpenrouterProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_integrations")
    .select(
      "openrouter_key_encrypted, openrouter_model, openrouter_custom_slug, openrouter_max_tokens",
    )
    .eq("user_id", user.id)
    .single();
  if (error !== null || data === null) {
    return null;
  }

  let key: string | null = null;
  const encrypted = data.openrouter_key_encrypted as string | null;
  if (encrypted !== null && encrypted.length > 0) {
    try {
      key = decryptSecret(encrypted);
    } catch (decryptError) {
      console.error("Stored key could not be decrypted:", decryptError);
    }
  }

  return {
    key,
    model: (data.openrouter_model as string | null) ?? null,
    customSlug: (data.openrouter_custom_slug as string | null) ?? null,
    maxTokens: (data.openrouter_max_tokens as number | null) ?? null,
  };
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
