-- =============================================================================
-- AI Website Powerhouse — 0005_user_templates.sql
-- Templates overhaul (2026-07-11, user request): saved prompt templates
-- previously lived only in browser localStorage and silently failed to
-- follow the account — same failure class as the BYOK key. This table
-- makes them account-owned.
--
-- Apply order: after 0004_cancel_at_period_end.sql.
-- =============================================================================

create table public.user_templates (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  name                  text not null,
  prompt                text not null,
  created_at            timestamptz not null default now()
);

create index user_templates_user_idx on public.user_templates(user_id, created_at desc);

alter table public.user_templates enable row level security;

create policy user_templates_owner_all on public.user_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
