/**
 * AI Website Powerhouse — server-side Supabase client.
 *
 * For use in Server Components, Server Actions, and Route Handlers.
 * Binds the client to the request's cookie store so RLS sees the
 * signed-in user.
 *
 * The `setAll` try/catch is required: Server Components cannot write
 * cookies (Next.js throws), but that is fine — the middleware
 * (`lib/supabase/middleware.ts`) owns session refresh, so cookie
 * writes from this client are safely ignorable in that context.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Create a Supabase client bound to the current request's cookies. */
export async function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — cookie writes are not
          // permitted there. Session refresh is handled by the
          // middleware, so this is safe to swallow.
        }
      },
    },
  });
}
