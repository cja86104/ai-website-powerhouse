-- Connect Your Stripe (2026-08-01) — mirrors 0008's Supabase connection
-- shape. Adds a per-project Stripe PUBLISHABLE key so generated code can
-- wire a real Stripe Elements checkout UI against the user's own Stripe
-- account.
--
-- SAFETY BOUNDARY (do not expand without a new design pass): this NEVER
-- collects a Stripe SECRET key or restricted API key. A publishable key
-- (pk_test_.../pk_live_...) is designed by Stripe to be embedded in
-- client-side code and is safe to expose — it cannot create charges,
-- refunds, or payouts on its own. AIWP's generated output is a static
-- frontend with no server runtime, so there is nowhere safe to hold a
-- secret key even if one were collected; completing an actual charge
-- always requires a backend the user supplies themselves (same
-- generate-only posture as 0008's schema.sql handoff).
--
-- The key is still encrypted at rest (defense-in-depth, same
-- AES-256-GCM helper as 0008), even though Stripe's own docs say
-- publishable keys are safe to expose.
--
-- RLS: inherited from the existing owner-scoped `projects_owner_all`
-- policy (0002_rls.sql covers all columns on `projects`, verified by
-- grep before 0008 shipped) — no new policy needed for these columns.

alter table public.projects
  add column if not exists stripe_publishable_key_encrypted text,
  add column if not exists stripe_connected_at timestamptz;
