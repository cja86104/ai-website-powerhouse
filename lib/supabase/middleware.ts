/**
 * AI Website Powerhouse — session-refresh + auth-gate middleware helper.
 *
 * Called from the root `middleware.ts` on every matched request.
 * Recreates the Supabase client against the request/response cookie
 * pair and calls `auth.getUser()`, which transparently refreshes an
 * expired access token and re-sets the session cookies on the
 * response.
 *
 * W2 Fri gating: unauthenticated visitors are redirected to /sign-in
 * for everything except the public auth surface below. This landed
 * together with DB-backed projects — the builder now requires a user
 * context to load and persist work.
 *
 * IMPORTANT (per Supabase SSR docs): do not run logic between
 * `createServerClient` and `auth.getUser()`, and always return the
 * `supabaseResponse` object (or copy its cookies onto any response
 * you construct instead) — otherwise sessions randomly terminate.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Paths reachable without a session (auth surface only). */
const PUBLIC_PATH_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/signout",
  // Legal pages must be readable before signing up (W4).
  "/privacy",
  "/terms",
  "/refunds",
  // Stripe posts webhooks unauthenticated; the route verifies its own
  // HMAC signature instead of a session (W3).
  "/api/stripe/webhook",
] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Refresh the auth session; redirect signed-out visitors off private routes. */
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null && !isPublicPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.search = "";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Carry over any refreshed session cookies so we do not drop a
    // token refresh that happened during this request.
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
