-- =============================================================================
-- AI Website Powerhouse — 0001_initial.sql
-- W2 Monday deliverable (PLAN/Section-09 §W2; DDL verbatim from
-- PLAN/Section-05-Technical-Architecture.md §3, locked 2026-06-03).
--
-- Scope of this migration: tables, indexes, and the updated_at triggers.
-- RLS enablement + policies + the auth.users mirror trigger land in
-- 0002_rls.sql (the W2 Tuesday deliverable) so each migration matches one
-- sprint-plan line item and can be reviewed/applied independently.
--
-- Apply order matters: run 0001 before 0002.
-- =============================================================================

-- =============================================================================
-- USERS (extends Supabase Auth's auth.users)
-- =============================================================================
-- Public-schema mirror so we can add columns and join freely. The trigger in
-- 0002_rls.sql syncs this on every auth.users insert.

create table public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  display_name          text,
  avatar_url            text,
  subscription_status   text not null default 'free'      -- 'free' | 'pro' | 'past_due' | 'canceled'
                          check (subscription_status in ('free','pro','past_due','canceled')),
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  current_period_end    timestamptz,
  privacy_mode_enabled  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index users_stripe_customer_id_idx on public.users(stripe_customer_id);
create index users_subscription_status_idx on public.users(subscription_status);

-- =============================================================================
-- USER INTEGRATIONS (encrypted secrets per user)
-- =============================================================================

create table public.user_integrations (
  user_id                       uuid primary key references public.users(id) on delete cascade,
  -- Encrypted blobs: format = base64(version_byte || iv || ciphertext || authtag)
  openrouter_key_encrypted      text,
  anthropic_key_encrypted       text,
  openai_key_encrypted          text,
  github_installation_id        bigint,                   -- not a secret; numeric ID of GitHub App install
  github_token_encrypted        text,                     -- GitHub App user-access token
  github_token_expires_at       timestamptz,
  vercel_token_encrypted        text,
  netlify_token_encrypted       text,
  ollama_base_url               text default 'http://localhost:11434',
  ollama_default_model          text,
  encryption_key_version        smallint not null default 1,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

-- =============================================================================
-- PROJECTS
-- =============================================================================
-- Framework enum, V1 scope (Option 3, decided 2026-06-03): the check
-- constraint permits 'next' so the column is forward-compatible, but the
-- V1 UI exposes only 'react-vite' and 'html'. See Section 5 §3 note.

create table public.projects (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  name                  text not null,
  description           text,
  framework             text not null default 'react-vite'  -- V1 UI: 'react-vite' | 'html' only; 'next' reserved for LATER+
                          check (framework in ('react-vite','next','html')),
  archived              boolean not null default false,
  -- Last deploy info (denormalized for fast project-list rendering)
  last_deploy_provider  text,                              -- 'vercel' | 'netlify' | null
  last_deploy_url       text,
  last_deploy_at        timestamptz,
  github_repo_full_name text,                              -- e.g. "octocat/my-site"
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id, archived, updated_at desc);

-- =============================================================================
-- GENERATIONS (chain of AI generations forming the project's history)
-- =============================================================================

create table public.generations (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  user_id               uuid not null references public.users(id) on delete cascade,
  parent_generation_id  uuid references public.generations(id) on delete set null,
  kind                  text not null check (kind in ('initial','modify','restore')),
  prompt                text not null,
  provider              text not null check (provider in ('ollama','openrouter','anthropic','openai')),
  model                 text not null,
  input_tokens          integer,
  output_tokens         integer,
  cost_usd              numeric(10,6),                      -- 6 decimal places: e.g. 0.001234
  used_byo_key          boolean not null default false,
  status                text not null default 'streaming'
                          check (status in ('streaming','complete','failed','aborted')),
  error_message         text,
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

create index generations_project_idx on public.generations(project_id, created_at desc);
create index generations_user_idx on public.generations(user_id, created_at desc);

-- =============================================================================
-- PROJECT FILES (per-generation file snapshots — never updated, only inserted)
-- =============================================================================
-- "Per-file version history" is reconstructed by walking the generations chain
-- and selecting the latest project_files row for each path up to a generation.

create table public.project_files (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  generation_id         uuid not null references public.generations(id) on delete cascade,
  path                  text not null,                      -- e.g. "src/App.tsx"
  content               text not null,
  content_sha256        text not null,                      -- enables dedup of unchanged files across generations
  size_bytes            integer not null,
  created_at            timestamptz not null default now()
);

create index project_files_project_path_idx on public.project_files(project_id, path, created_at desc);
create index project_files_generation_idx on public.project_files(generation_id);
create index project_files_sha_idx on public.project_files(content_sha256);

-- =============================================================================
-- MESSAGES (chat threads per project)
-- =============================================================================

create table public.messages (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  user_id               uuid not null references public.users(id) on delete cascade,
  role                  text not null check (role in ('system','user','assistant')),
  content               text not null,
  scoped_file_path      text,                              -- null = global; non-null = file-aware modify
  generation_id         uuid references public.generations(id) on delete set null,
  created_at            timestamptz not null default now()
);

create index messages_project_idx on public.messages(project_id, created_at);

-- =============================================================================
-- USAGE EVENTS (every billable / metered call)
-- =============================================================================

create table public.usage_events (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  project_id            uuid references public.projects(id) on delete set null,
  generation_id         uuid references public.generations(id) on delete set null,
  provider              text not null,
  model                 text not null,
  input_tokens          integer not null default 0,
  output_tokens         integer not null default 0,
  cost_usd              numeric(10,6) not null default 0,
  used_byo_key          boolean not null default false,
  created_at            timestamptz not null default now()
);

create index usage_events_user_period_idx
  on public.usage_events(user_id, created_at desc);
create index usage_events_project_idx on public.usage_events(project_id, created_at desc);

-- =============================================================================
-- API KEY HEALTH (last-call status for BYOK keys; UI uses this for green/amber/red)
-- =============================================================================

create table public.api_key_health (
  user_id               uuid not null references public.users(id) on delete cascade,
  provider              text not null,
  last_success_at       timestamptz,
  last_failure_at       timestamptz,
  last_failure_message  text,
  primary key (user_id, provider)
);

-- =============================================================================
-- TRIGGER: keep updated_at fresh on relevant tables
-- =============================================================================

create or replace function public.tg_set_updated_at()
  returns trigger
  language plpgsql
  as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$;

create trigger users_updated_at before update on public.users
  for each row execute function public.tg_set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.tg_set_updated_at();
create trigger user_integrations_updated_at before update on public.user_integrations
  for each row execute function public.tg_set_updated_at();
