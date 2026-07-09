/**
 * AI Website Powerhouse — sign-in page (W2).
 *
 * Server component: the form posts to the `signIn` server action;
 * failures round-trip back here as `?error=`, and the post-sign-up
 * confirmation prompt arrives as `?message=`. Already-authenticated
 * visitors are bounced to the app root.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "@/app/(auth)/actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user !== null) {
    redirect("/");
  }

  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6b35] to-[#f7931e] bg-clip-text text-transparent mb-2">
          AI Website Powerhouse
        </h1>
        <h2 className="text-xl font-semibold text-orange-100 mb-6">Sign in</h2>

        {message !== undefined && (
          <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {message}
          </p>
        )}
        {error !== undefined && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <form action={signIn} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-orange-200 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-2 bg-[#1a1a2e] border border-orange-500/30 rounded-lg text-orange-100 placeholder-orange-400/50 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-orange-200 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2 bg-[#1a1a2e] border border-orange-500/30 rounded-lg text-orange-100 placeholder-orange-400/50 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-sm text-orange-200/70">
          No account yet?{" "}
          <Link
            href="/sign-up"
            className="text-orange-400 hover:text-orange-300 font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
