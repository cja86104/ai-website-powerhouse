-- =============================================================================
-- AI Website Powerhouse — 0004_cancel_at_period_end.sql
-- W4: surface scheduled cancellations (found during W3 portal testing:
-- a period-end cancel leaves status='pro' — correct — but the UI gave
-- no hint the plan was ending; users would cancel, see "PRO", and
-- assume it failed).
--
-- Written by the Stripe webhook from subscription.cancel_at_period_end;
-- reset to false on new checkouts and on reactivation updates.
--
-- Apply order: after 0003_stripe_events.sql.
-- =============================================================================

alter table public.users
  add column cancel_at_period_end boolean not null default false;
