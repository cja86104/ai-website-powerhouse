/**
 * Shared prose shell for the legal pages (W4). Server component.
 * These pages are PUBLIC (see PUBLIC_PATH_PREFIXES in
 * lib/supabase/middleware.ts) — visitors must be able to read terms
 * before creating an account.
 */

import Link from "next/link";
import type { ReactNode } from "react";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/sign-in"
            className="text-orange-400 hover:text-orange-300 text-sm font-medium"
          >
            ← AI Website Powerhouse
          </Link>
          <nav className="text-sm text-orange-200/60 space-x-4">
            <Link href="/terms" className="hover:text-orange-300">Terms</Link>
            <Link href="/privacy" className="hover:text-orange-300">Privacy</Link>
            <Link href="/refunds" className="hover:text-orange-300">Refunds</Link>
          </nav>
        </div>
        <article className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl p-8 text-orange-100/90 leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-orange-100 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-orange-200 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
          <h1>{title}</h1>
          <p className="text-sm text-orange-300/60">Last updated: {updated}</p>
          {children}
        </article>
      </div>
    </div>
  );
}
