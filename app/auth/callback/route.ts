/**
 * AI Website Powerhouse — auth confirmation callback (W2).
 *
 * Target of the email links Supabase sends: sign-up confirmation
 * (W2 Wed) and password-recovery links (W2 Thu). Exchanges the
 * one-time `code` for a session, then forwards to `?next=` when it
 * names a safe internal path (must start with a single "/") or to
 * the app root otherwise. Errors land on /sign-in with an inline
 * message rather than a bare error page.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only allow same-site relative paths — never protocol-relative or absolute URLs. */
function safeNextPath(raw: string | null): string {
  if (raw === null || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (code === null || code.length === 0) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent("Missing confirmation code. Use the link from your email.")}`,
        requestUrl.origin,
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error !== null) {
    return NextResponse.redirect(
      new URL(
        `/sign-in?error=${encodeURIComponent(error.message)}`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
