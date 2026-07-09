/**
 * AI Website Powerhouse — browser-side Supabase client.
 *
 * For use inside client components only. Auth state (the session
 * cookie pair) is shared with the server-side client via @supabase/ssr
 * cookie handling, so a sign-in performed in the browser is visible to
 * server components and the middleware on the next request.
 */

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Create a Supabase client bound to browser cookie storage.
 * `createBrowserClient` returns a per-page singleton internally, so
 * calling this in multiple components does not multiply connections.
 */
export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
