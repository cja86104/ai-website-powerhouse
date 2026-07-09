"use server";

/**
 * AI Website Powerhouse — auth server actions (W2).
 *
 * Sign-up, sign-in, and sign-out against Supabase Auth. All three run
 * exclusively on the server; failures are surfaced by redirecting back
 * to the form with a human-readable `error` search param (read by the
 * page and rendered inline), successes redirect to the app root.
 *
 * Password policy is enforced by Supabase (project settings), not
 * duplicated here — the only local checks are non-emptiness, so the
 * user gets an instant message for blank fields without a round trip.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Extract and minimally validate credentials from a form post. */
function credentialsFrom(formData: FormData): {
  email: string;
  password: string;
} | null {
  const email = formData.get("email");
  const password = formData.get("password");
  if (
    typeof email !== "string" ||
    email.trim().length === 0 ||
    typeof password !== "string" ||
    password.length === 0
  ) {
    return null;
  }
  return { email: email.trim(), password };
}

/** Server action: create an account, then prompt for email confirmation. */
export async function signUp(formData: FormData): Promise<void> {
  const credentials = credentialsFrom(formData);
  if (credentials === null) {
    redirect(
      `/sign-up?error=${encodeURIComponent("Email and password are required.")}`,
    );
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin") ?? "http://localhost:4000";

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error !== null) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  // With email confirmation enabled (Supabase default), a session is
  // not created yet — the user must click the link we just sent.
  if (data.session === null) {
    redirect(
      `/sign-in?message=${encodeURIComponent(
        "Check your email for a confirmation link, then sign in.",
      )}`,
    );
  }

  redirect("/");
}

/** Server action: sign in with email + password. */
export async function signIn(formData: FormData): Promise<void> {
  const credentials = credentialsFrom(formData);
  if (credentials === null) {
    redirect(
      `/sign-in?error=${encodeURIComponent("Email and password are required.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error !== null) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

/** Server action: end the current session. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

/** Server action: send a password-recovery email (W2 Thu). */
export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = formData.get("email");
  if (typeof email !== "string" || email.trim().length === 0) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Email is required.")}`,
    );
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin") ?? "http://localhost:4000";

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Supabase does not reveal whether the address exists; errors here
  // are operational (rate limits, misconfiguration) and safe to show.
  if (error !== null) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/sign-in?message=${encodeURIComponent(
      "If that email has an account, a password reset link is on its way.",
    )}`,
  );
}

/** Server action: set a new password from a recovery session (W2 Thu). */
export async function updatePassword(formData: FormData): Promise<void> {
  const password = formData.get("password");
  const confirm = formData.get("confirm");

  if (typeof password !== "string" || password.length < 6) {
    redirect(
      `/reset-password?error=${encodeURIComponent(
        "Password must be at least 6 characters.",
      )}`,
    );
  }
  if (password !== confirm) {
    redirect(
      `/reset-password?error=${encodeURIComponent("Passwords do not match.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error !== null) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

/** Server action: permanently delete the signed-in user's account (W2 Thu). */
export async function deleteAccount(formData: FormData): Promise<void> {
  const confirmation = formData.get("confirmation");
  if (confirmation !== "DELETE") {
    redirect(
      `/account?error=${encodeURIComponent(
        'Type "DELETE" in the confirmation box to delete your account.',
      )}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/sign-in");
  }

  // Admin API required: users cannot delete their own auth.users row
  // via the anon-key client. The public.users row and every child
  // table follow via on-delete-cascade (see 0001_initial.sql).
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error !== null) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect(
    `/sign-in?message=${encodeURIComponent(
      "Your account and all associated data have been permanently deleted.",
    )}`,
  );
}
