/**
 * Blocker-note classifier and deterministic resume messages.
 *
 * 2026-08-01, Chat/Plan Mode work-plan item 1
 * (PLAN/Feature-Chat-Plan-Mode.md §5.1, §8 item 1).
 *
 * AIWP already pauses generation and asks the user to do something
 * manual in a couple of known situations: run `supabase/schema.sql`
 * (`supabaseSchemaNote`), or deploy the Stripe backend Edge Function
 * and set its secret (`stripeBackendFunctionInjectedNote`). Until now
 * the only way to resume was the user typing something like
 * "continue" and hoping the model correctly inferred what that
 * referred to — nothing told it what was actually done. That is
 * exactly what tripped up a weaker model (Kimi K2, 2026-08-01 user
 * report): it re-asked for SQL that had already been applied, and the
 * resulting build shipped broken.
 *
 * This module closes that gap deterministically. It recognizes the
 * EXACT note text AIWP itself generated — imported as constants from
 * the modules that emit them, never duplicated as a second copy that
 * could silently drift out of sync — and, when recognized, offers a
 * fixed resume message that tells the model plainly what was done and
 * to continue. No inference required, regardless of which model is
 * active.
 */

import { SUPABASE_SCHEMA_NOTE_TEXT } from "@/lib/generation/supabase-scaffold";
import { STRIPE_BACKEND_FUNCTION_NOTE_TEXT } from "@/lib/generation/stripe-scaffold";

/** The known "waiting on you" blocker classes AIWP can pause on. */
export type BlockerType = "supabase-schema" | "stripe-backend";

const RESUME_MESSAGES: Record<BlockerType, string> = {
  "supabase-schema":
    "The SQL in supabase/schema.sql has been applied in the Supabase " +
    "SQL editor and the tables now exist. Continue building the " +
    "previous request using them.",
  "stripe-backend":
    "The create-payment-intent Edge Function has been deployed (supabase " +
    "functions deploy create-payment-intent) and STRIPE_SECRET_KEY has " +
    "been set as its secret. Continue — checkout can now complete a " +
    "real charge.",
};

/** Label for the resume action shown in the chat UI. */
export const RESUME_BUTTON_LABEL = "I've done this — continue";

/**
 * Classifies an assistant chat message as a known "waiting on you"
 * blocker, or null if it isn't one. Matches by exact text equality
 * against the real note constants AIWP itself emits — deterministic,
 * not inferred, and immune to drift since both sides import the same
 * constant.
 */
export function classifyBlockerNote(content: string): BlockerType | null {
  if (content === SUPABASE_SCHEMA_NOTE_TEXT) return "supabase-schema";
  if (content === STRIPE_BACKEND_FUNCTION_NOTE_TEXT) return "stripe-backend";
  return null;
}

/** The deterministic resume message to send for a given blocker type. */
export function resumeMessageForBlocker(blocker: BlockerType): string {
  return RESUME_MESSAGES[blocker];
}
