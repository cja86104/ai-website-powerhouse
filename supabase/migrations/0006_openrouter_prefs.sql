-- 0006: OpenRouter preferences follow the ACCOUNT (2026-07-12 UX).
--
-- User-reported: the BYOK key now follows the account (W5 UX), but the
-- MODEL choice still lived only in the browser's localStorage — so a
-- user who generated with Sonnet came back on another browser/session
-- and silently edited with the DeepSeek default. Model, custom slug,
-- and max output tokens now sync to user_integrations alongside the
-- key. None of these are secrets; stored in plain text.
--
-- RLS: user_integrations is already owner-scoped (0002) — new columns
-- inherit the row policies.

alter table public.user_integrations
  add column if not exists openrouter_model text,
  add column if not exists openrouter_custom_slug text,
  add column if not exists openrouter_max_tokens integer;
