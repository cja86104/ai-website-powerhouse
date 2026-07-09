/**
 * AI Website Powerhouse — auth confirmation callback (W2).
 *
 * Target of the email-confirmation link sent on sign-up (and later,
 * password-reset links in W2 Thu). Exchanges the one-time `code` for
 * a session, then forwards into the app. Errors land on /sign-in with
 * an inline message rather than a bare error page.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

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

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
