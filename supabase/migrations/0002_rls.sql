-- =============================================================================
-- AI Website Powerhouse — 0002_rls.sql
-- W2 Tuesday deliverable (PLAN/Section-09 §W2): RLS enablement + policies
-- (verbatim from PLAN/Section-05-Technical-Architecture.md §4) and the
-- auth.users → public.users mirror trigger (from §3, deferred here to match
-- the sprint-plan line item).
--
-- Apply order: after 0001_initial.sql.
--
-- Service-role writes (Stripe webhook, server-side billing logic) bypass RLS
-- by using the service_role key, which is held only by the server (never the
-- browser). The webhook route writes users.subscription_status and
-- users.stripe_subscription_id with the service-role client.
-- =============================================================================

alter table public.users               enable row level security;
alter table public.user_integrations   enable row level security;
alter table public.projects            enable row level security;
alter table public.generations         enable row level security;
alter table public.project_files       enable row level security;
alter table public.messages            enable row level security;
alter table public.usage_events        enable row level security;
alter table public.api_key_health      enable row level security;

-- users: each user sees and edits their own row only.
create policy users_self_select on public.users
  for select using (auth.uid() = id);
create policy users_self_update on public.users
  for update using (auth.uid() = id);

-- user_integrations: same.
create policy ui_self_all on public.user_integrations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- projects: owner-scoped.
create policy projects_owner_all on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- generations: owner-scoped via user_id (denormalized for fast checks).
create policy generations_owner_all on public.generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- project_files: owner-scoped via the parent project.
create policy project_files_owner_all on public.project_files
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.user_id = auth.uid()
    )
  );

-- messages: owner-scoped.
create policy messages_owner_all on public.messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- usage_events: read-only for the user; inserts come from service role.
create policy usage_events_self_select on public.usage_events
  for select using (auth.uid() = user_id);
-- inserts/updates restricted to service_role (no policy needed beyond enabling RLS)

-- api_key_health: owner-scoped.
create policy akh_self_all on public.api_key_health
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- TRIGGER: mirror auth.users → public.users on signup
-- =============================================================================

create or replace function public.tg_handle_new_user()
  returns trigger
  language plpgsql
  security definer
  as $$
  begin
    insert into public.users (id, email)
    values (new.id, new.email);
    insert into public.user_integrations (user_id) values (new.id);
    return new;
  end;
  $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();
