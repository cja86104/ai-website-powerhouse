/**
 * AI Website Powerhouse — session-refresh middleware helper.
 *
 * Called from the root `middleware.ts` on every matched request.
 * Recreates the Supabase client against the request/response cookie
 * pair and calls `auth.getUser()`, which transparently refreshes an
 * expired access token and re-sets the session cookies on the
 * response. Without this, server components would see stale sessions
 * after the access token's one-hour lifetime.
 *
 * IMPORTANT (per Supabase SSR docs): do not run logic between
 * `createServerClient` and `auth.getUser()`, and always return the
 * `supabaseResponse` object (or copy its cookies onto any response
 * you construct instead) — otherwise sessions randomly terminate.
 *
 * Route gating decision (W2 Wed): this helper refreshes sessions but
 * does NOT redirect unauthenticated visitors. `/` remains public
 * until W2 Fri lands DB-backed projects, when the builder gains an
 * authenticated context. Gating belongs there, not here.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Refresh the auth session for this request; returns the response to send. */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const { url, anonKey } = getSupabasePublicEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refreshes the token if expired. The result is intentionally not
  // used for gating here — see the module docblock.
  await supabase.auth.getUser();

  return supabaseResponse;
}
