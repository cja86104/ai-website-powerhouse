-- 0008: Connect Your Supabase — per-project backend connection
-- (2026-07-31, user request; design: PLAN/Feature-Connect-Your-Supabase.md).
--
-- Lets a user point ONE project at their own Supabase project so
-- generated code can write real CRUD/auth against it. Connection is
-- project-scoped, not account-scoped (different projects can target
-- different backends) — denormalized directly onto `projects`, same
-- cardinality as the existing `last_deploy_*` columns (W8).
--
-- The anon key is encrypted at rest (AES-256-GCM, ADR-008,
-- lib/crypto/secrets.ts) even though anon keys are designed to reach
-- the browser — this is defense-in-depth against a bulk DB dump
-- handing out many users' project URLs+keys at once, not a claim that
-- the key is a secret on the level of a service-role key or a Vercel
-- token. AIWP never collects a service-role key or Management API
-- token for this feature (design doc §3/§6) — schema changes are
-- always generated as SQL for the user to run in their own Supabase
-- SQL editor, never auto-executed.
--
-- RLS: projects is already owner-scoped (0002's projects_owner_all) —
-- new columns inherit the row policy automatically.

alter table public.projects
  add column if not exists supabase_project_url text,
  add column if not exists supabase_anon_key_encrypted text,
  add column if not exists supabase_connected_at timestamptz;
