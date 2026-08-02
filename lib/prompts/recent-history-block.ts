/**
 * Bounded recent-history context (2026-08-01, Chat/Plan Mode
 * work-plan item 2, PLAN/Feature-Chat-Plan-Mode.md §5.2).
 *
 * Root cause this fixes: `handleChatModify` (Builder.tsx) sends the
 * model only `[{ role: "user", content: modifyPrompt }]` — the
 * current round's single message, nothing else. `chatHistory` is
 * displayed to the user but never re-sent, so even a strong model
 * isn't reading "a few rounds ago I said tables were needed" — it
 * re-derives everything from the current file set each round alone.
 * This is exactly what let a weaker model (Kimi K2, 2026-08-01 user
 * report) get confused by a bare "continue" after a schema.sql pause.
 *
 * Fix: append a bounded window of the most recent chat messages to
 * the Build-mode prompt, the same non-invasive append pattern as
 * every other block in this codebase (`buildAssetsNote`,
 * `buildSupabaseBlock`, `buildStripeBlock`) — zero bytes changed in
 * `react-modify-prompt.ts` / `scoped-modify-prompt.ts` /
 * `modify-prompt.ts` / the system prompts. Deliberately bounded, not
 * the full thread — an unbounded resend grows without limit as a
 * project accumulates rounds. Mirrors Bolt.new's own Discussion Mode
 * design (researched 2026-08-01, see the Sources list in
 * PLAN/Feature-Chat-Plan-Mode.md §5): full project context plus a
 * fixed number of the most recent messages, not the entire thread.
 */

import type { ChatMessage } from "@/lib/store/chat-store";

/**
 * How many of the most recent chat messages to include. Bolt's own
 * number is 6; AIWP uses a deliberate margin above that (§7 decision
 * 2, PLAN/Feature-Chat-Plan-Mode.md) since AIWP's rounds tend to be
 * sparser/higher-signal than a live-coding chat — the existing
 * backstop notes (schema.sql, Stripe backend) are single dense lines,
 * not conversational chatter.
 */
const RECENT_MESSAGE_COUNT = 10;

/** Hard per-message character cap, applied after selecting the window. */
const MESSAGE_CHAR_CAP = 500;

const TRUNCATION_MARKER = "[...truncated]";

function truncate(content: string): string {
  if (content.length <= MESSAGE_CHAR_CAP) return content;
  return content.slice(0, MESSAGE_CHAR_CAP) + TRUNCATION_MARKER;
}

/**
 * Builds the "RECENT CONVERSATION" block appended to Build-mode
 * prompts. Empty string when there's no history yet (e.g. the very
 * first round of a project) — same empty-input contract as
 * `buildSupabaseBlock`/`buildStripeBlock`, so callers can always
 * concatenate the result unconditionally. Deterministic: a fixed
 * window and a fixed per-message cap, no model call involved in
 * deciding what to keep.
 */
export function buildRecentHistoryBlock(messages: ChatMessage[]): string {
  if (messages.length === 0) return "";
  const recent = messages.slice(-RECENT_MESSAGE_COUNT);
  const lines = recent
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "You"}: ${truncate(m.content)}`,
    )
    .join("\n");
  const plural = recent.length === 1 ? "message" : "messages";
  return `

RECENT CONVERSATION (most recent ${recent.length} ${plural} — use this to understand what short replies like "continue" or "that" refer to):
${lines}`;
}
