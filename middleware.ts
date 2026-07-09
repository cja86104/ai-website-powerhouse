/**
 * AI Website Powerhouse — root middleware (W2).
 *
 * Delegates to `lib/supabase/middleware.ts` to keep auth sessions
 * fresh on every request. See that module for the no-gating decision.
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { gateHostedGeneration } from "@/lib/billing/gate";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Subscription gate for the hosted-key generation path (W3 Thu).
  // Only POST /api/openrouter is metered; the GET availability probe
  // stays free. See lib/billing/gate.ts for the entitlement rules.
  if (
    request.nextUrl.pathname === "/api/openrouter" &&
    request.method === "POST"
  ) {
    const denial = await gateHostedGeneration(request);
    if (denial !== null) {
      return denial;
    }
  }

  return response;
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
