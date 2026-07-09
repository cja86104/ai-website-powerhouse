-- =============================================================================
-- AI Website Powerhouse — 0003_stripe_events.sql
-- W3 deliverable (PLAN/Section-07 §6.3): webhook idempotency ledger.
--
-- Every Stripe webhook handler records event.id here inside the same
-- logical operation as its DB writes; a replayed or duplicated event
-- hits the primary-key conflict and is skipped. Section 7 notes this
-- table was intentionally absent from the Section 5 schema and is to
-- be added in W3.
--
-- Apply order: after 0002_rls.sql.
-- =============================================================================

create table public.processed_stripe_events (
  event_id              text primary key,              -- Stripe event id, e.g. "evt_..."
  event_type            text not null,                 -- e.g. "checkout.session.completed"
  processed_at          timestamptz not null default now()
);

-- Service-role only: webhooks are server-side; no user should ever
-- read or write this table. Enabling RLS with no policies denies all
-- access through the anon/user keys while service_role bypasses RLS.
alter table public.processed_stripe_events enable row level security;
