/**
 * AI Website Powerhouse — service-role Supabase client (SERVER-ONLY).
 *
 * Wraps the service-role key, which bypasses RLS entirely. Only for
 * server code that has already authenticated the caller and needs
 * admin powers the anon-key client cannot have — today that is
 * exactly one operation: `auth.admin.deleteUser` for account
 * deletion (the `public.users` row and everything under it follows
 * via `on delete cascade`).
 *
 * NEVER import this from a client component, and never re-export it
 * through a module that client components import. The runtime guard
 * below is defense in depth, not permission.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Create a service-role client. No session persistence — one-shot admin use. */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient must only run on the server. The service-role key is never available to the browser.",
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey === undefined || serviceRoleKey.length === 0) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Copy it from your Supabase project's API settings into .env.local (server-only; never expose it to the browser).",
    );
  }

  const { url } = getSupabasePublicEnv();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
