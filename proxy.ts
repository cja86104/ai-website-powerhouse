/**
 * AI Website Powerhouse — root proxy (W2; renamed from middleware.ts
 * in W4 per the Next 16.2 file-convention rename).
 *
 * Delegates to `lib/supabase/middleware.ts` to keep auth sessions
 * fresh on every request. See that module for the no-gating decision.
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { allowRequest, clientIp } from "@/lib/ratelimit/limiter";

/** Form-post paths covered by the auth rate limiter (W4). */
const AUTH_LIMITED_PATHS = new Set([
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
]);

export async function proxy(request: NextRequest) {
  // Rate limits run first — cheaper than session work, and abusive
  // traffic should never reach auth or billing code (W4, ADR-009).
  if (request.method === "POST") {
    const ip = clientIp(request.headers);
    if (AUTH_LIMITED_PATHS.has(request.nextUrl.pathname)) {
      const allowed = await allowRequest("auth", ip);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many attempts. Wait a few minutes and try again." },
          { status: 429 },
        );
      }
    }
    if (request.nextUrl.pathname === "/api/openrouter") {
      const allowed = await allowRequest("generation", ip);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many generation requests. Wait a few minutes and try again." },
          { status: 429 },
        );
      }
    }
  }

  // Subscription quotas moved INTO the route handler in W4 (it can see
  // the requested model; middleware cannot read bodies) — see
  // lib/billing/quota.ts. The proxy keeps auth + rate limiting only.
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets:
     * - _next/static, _next/image (build output)
     * - favicon.ico and common image extensions
     * The /api/openrouter route IS matched — harmless today (no
     * gating) and required later when generation becomes user-scoped.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
