/**
 * AI Website Powerhouse — sign-out route handler (W2).
 *
 * POST-only (sign-out mutates state; GET would be CSRF-prone and
 * gets prefetched by browsers). The header's sign-out button posts
 * here once account UI lands; until then it is reachable via any
 * form or fetch POST.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/sign-in", new URL(request.url).origin), {
    status: 303,
  });
}
