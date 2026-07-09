/**
 * AI Website Powerhouse — account page (W2 Thu).
 *
 * Signed-in only. Shows the account email and member-since date,
 * offers sign-out, and hosts the destructive account-deletion flow
 * (type DELETE to confirm; server action verifies again). Reached by
 * URL for now — the header link lands with W2 Fri's authenticated
 * builder context.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut, deleteAccount } from "@/app/(auth)/actions";
import { startCheckout } from "@/app/account/actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; upgraded?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/sign-in");
  }

  const { error, upgraded } = await searchParams;

  // Billing state lives on public.users, written only by the webhook.
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_status, current_period_end")
    .eq("id", user.id)
    .single();
  const subscriptionStatus =
    (profile?.subscription_status as string | undefined) ?? "free";
  const periodEnd =
    profile?.current_period_end !== null &&
    profile?.current_period_end !== undefined
      ? new Date(profile.current_period_end as string).toLocaleDateString()
      : null;

  const memberSince =
    user.created_at !== undefined
      ? new Date(user.created_at).toLocaleDateString()
      : "unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-orange-400 hover:text-orange-300 text-sm font-medium"
          >
            ← Back to the builder
          </Link>
        </div>

        <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl p-8 mb-6">
          <h1 className="text-2xl font-bold text-orange-100 mb-6">Account</h1>
          <div className="space-y-2 text-orange-200">
            <p>
              <span className="text-orange-300/70">Email:</span> {user.email}
            </p>
            <p>
              <span className="text-orange-300/70">Member since:</span>{" "}
              {memberSince}
            </p>
          </div>

          <form action={signOut} className="mt-6">
            <button
              type="submit"
              className="py-2 px-6 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg font-semibold transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-cyan-500/30 shadow-2xl p-8 mb-6">
          <h2 className="text-xl font-bold text-cyan-100 mb-2">Plan</h2>

          {upgraded !== undefined && (
            <p className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              Payment received — your plan updates within a few seconds once
              Stripe confirms it. Refresh if you don&apos;t see Pro yet.
            </p>
          )}

          <p className="text-cyan-200 mb-1">
            <span className="text-cyan-300/70">Current plan:</span>{" "}
            <span className="font-semibold uppercase">{subscriptionStatus}</span>
          </p>
          {periodEnd !== null && (
            <p className="text-cyan-200 mb-4">
              <span className="text-cyan-300/70">Current period ends:</span>{" "}
              {periodEnd}
            </p>
          )}

          {subscriptionStatus !== "pro" && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <form action={startCheckout}>
                <input type="hidden" name="plan" value="pro_monthly" />
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Upgrade to Pro — $19/mo
                </button>
              </form>
              <form action={startCheckout}>
                <input type="hidden" name="plan" value="pro_annual" />
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg font-semibold transition-colors"
                >
                  Pro Annual — $190/yr (save 17%)
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl border border-red-500/30 shadow-2xl p-8">
          <h2 className="text-xl font-bold text-red-100 mb-2">Danger Zone</h2>
          <p className="text-red-200/80 text-sm mb-4">
            Deleting your account permanently removes your profile, projects,
            generations, and stored API keys. This cannot be undone.
          </p>

          {error !== undefined && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <form action={deleteAccount} className="space-y-4">
            <div>
              <label
                htmlFor="confirmation"
                className="block text-sm font-medium text-red-200 mb-2"
              >
                Type DELETE to confirm
              </label>
              <input
                id="confirmation"
                name="confirmation"
                type="text"
                autoComplete="off"
                required
                className="w-full px-4 py-2 bg-[#1a1a2e] border border-red-500/30 rounded-lg text-red-100 placeholder-red-400/50 focus:outline-none focus:border-red-500/50"
                placeholder="DELETE"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-6 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-semibold transition-colors"
            >
              Permanently delete account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
