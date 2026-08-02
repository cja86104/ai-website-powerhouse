"use server";

/**
 * AI Website Powerhouse — Connect Your Supabase (2026-07-31).
 *
 * Design: PLAN/Feature-Connect-Your-Supabase.md (all 5 decision points
 * approved by the user 2026-07-31). Lets a user point ONE project at
 * their own Supabase project (URL + anon key) so generated code can
 * write real CRUD/auth against it, rather than a client asking their
 * app builder to fetch/mutate mock data.
 *
 * Scope boundary (§3/§6 of the design doc — do not expand without a
 * new design pass): this NEVER collects a service-role key or a
 * Supabase Management API token, and it NEVER executes SQL against the
 * user's project. Schema changes are always generated as a
 * `supabase/schema.sql` file for the user to run themselves in their
 * own SQL editor — same trust model as AIWP's own
 * `supabase/migrations/*.sql` being user-applied.
 *
 * The anon key is encrypted at rest (AES-256-GCM, ADR-008,
 * lib/crypto/secrets.ts) for defense-in-depth, but — unlike the Vercel
 * token — IS returned to the caller by `loadSupabaseConnection`: the
 * running generated app needs the literal value in its own bundle
 * (design doc §8 decision 3: inline, no env-var indirection). This is
 * the same category as the OpenRouter BYOK key, not the Vercel token.
 *
 * Ownership: every function is scoped to the SIGNED-IN user's own
 * projects. RLS (`projects_owner_all`, 0002) is the actual enforcement
 * boundary; the explicit existence check below (mirroring
 * `deleteProject` in lib/projects/actions.ts) exists only to turn a
 * silent zero-row RLS mismatch into a real "Project not found" error.
 */

import { createClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secrets";

/** A project's saved Supabase connection, or null when unset/unreadable. */
export interface SupabaseConnection {
  url: string;
  anonKey: string;
  connectedAt: string;
}

/**
 * Normalize a user-pasted Supabase project URL to the bare origin.
 * Mirrors `getSupabasePublicEnv`'s normalization in
 * lib/supabase/env.ts (2026-07-12) for the identical mistake class —
 * dashboards make it easy to copy the URL with an API path suffix
 * ("/rest/v1/", "/auth/v1") — but this validates USER input from the
 * Settings form rather than an environment variable, so it returns a
 * result instead of throwing.
 */
function normalizeProjectUrl(raw: string): string | null {
  const normalized = raw
    .trim()
    .replace(/\/(rest|auth|storage|realtime|functions)\/v1\/?$/i, "")
    .replace(/\/+$/, "");
  return /^https:\/\/[^/]+$/.test(normalized) ? normalized : null;
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
 * Save (or overwrite) a project's Supabase connection. Validates the
 * URL shape and requires a non-empty anon key — this is a save
 * action, not a clear action; use {@link clearSupabaseConnection} to
 * disconnect.
 */
export async function saveSupabaseConnection(
  projectId: string,
  url: string,
  anonKey: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to connect a Supabase project.");
  }
  await requireOwnedProject(supabase, projectId);

  const normalizedUrl = normalizeProjectUrl(url);
  if (normalizedUrl === null) {
    throw new Error(
      `That doesn't look like a Supabase project URL. It should look like https://abcdefgh.supabase.co — got "${url}".`,
    );
  }
  const trimmedKey = anonKey.trim();
  if (trimmedKey.length === 0) {
    throw new Error("The anon key can't be empty.");
  }

  const { error } = await supabase
    .from("projects")
    .update({
      supabase_project_url: normalizedUrl,
      supabase_anon_key_encrypted: encryptSecret(trimmedKey),
      supabase_connected_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (error !== null) {
    throw new Error(`Failed to save the connection: ${error.message}`);
  }
}

/** Disconnects a project's Supabase backend (all three columns cleared). */
export async function clearSupabaseConnection(projectId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to manage your Supabase connection.");
  }
  await requireOwnedProject(supabase, projectId);

  const { error } = await supabase
    .from("projects")
    .update({
      supabase_project_url: null,
      supabase_anon_key_encrypted: null,
      supabase_connected_at: null,
    })
    .eq("id", projectId);
  if (error !== null) {
    throw new Error(`Failed to disconnect: ${error.message}`);
  }
}

/**
 * Load a project's Supabase connection, decrypted, or null when the
 * project has none saved. A stored value that fails to decrypt (wrong
 * key version, tampered payload) surfaces as null rather than an
 * error — same posture as `loadOpenrouterProfile` — so the caller
 * just sees "not connected" and the user can simply reconnect.
 */
export async function loadSupabaseConnection(
  projectId: string,
): Promise<SupabaseConnection | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("supabase_project_url, supabase_anon_key_encrypted, supabase_connected_at")
    .eq("id", projectId)
    .maybeSingle();
  if (error !== null || data === null) return null;

  const url = data.supabase_project_url as string | null;
  const encrypted = data.supabase_anon_key_encrypted as string | null;
  const connectedAt = data.supabase_connected_at as string | null;
  if (url === null || encrypted === null || connectedAt === null) {
    return null;
  }

  try {
    return { url, anonKey: decryptSecret(encrypted), connectedAt };
  } catch (decryptError) {
    console.error(
      `Stored Supabase connection for project ${projectId} could not be decrypted:`,
      decryptError,
    );
    return null;
  }
}
