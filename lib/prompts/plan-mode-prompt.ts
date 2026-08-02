/**
 * Plan-mode prompt (2026-08-01, Chat/Plan Mode work-plan item 3,
 * PLAN/Feature-Chat-Plan-Mode.md §5.1).
 *
 * Plan mode is strictly read + discuss: the model sees the current
 * project's files and the user's message, and may answer questions,
 * investigate the current code, or propose/update a build plan — but
 * it must NEVER emit a file-block/delta response and must NEVER claim
 * to have changed anything. This is enforced by instruction only (the
 * same enforcement level as every other prompt contract in this
 * codebase, e.g. "never invent a URL," "never call createClient()
 * yourself") — Builder.tsx's Plan-mode branch never runs the file
 * parser/merge logic against a Plan-mode response regardless of what
 * the model returns, so even an instruction-violating response cannot
 * corrupt the project.
 *
 * When the user asks for a plan (or an update to one), the model is
 * instructed to emit it inside a fenced ```aiwp-plan block — a fixed,
 * recognizable format so a later, deterministic parser (work-plan
 * item 4) can extract it without inferring anything from prose. This
 * item does not parse or persist that block yet ("conversational
 * only," per the approved work plan §8 item 3) — the contract is
 * established now so item 4 has a stable format to build against
 * rather than retrofitting one later.
 */

/**
 * The fenced-block language tag the model uses to mark a plan. Shared
 * with the future extractor (work-plan item 4) so both sides always
 * agree on the exact same marker — single source of truth, not a
 * second copy that could drift.
 */
export const PLAN_BLOCK_LANGUAGE_TAG = "aiwp-plan";

export interface PlanModePromptInput {
  /**
   * The current project's files, serialized the same way Build-mode
   * prompts see them (`serializeProjectFiles` for react-vite, the raw
   * `generatedCode` buffer for legacy html) — read-only context.
   */
  serializedProject: string;
  /** The user's Plan-mode message for this round. */
  chatMessage: string;
  /**
   * Bounded recent-history block from
   * `lib/prompts/recent-history-block.ts`, already formatted — empty
   * string when there's no history yet.
   */
  recentHistoryBlock: string;
}

/**
 * Builds the full user-turn prompt sent to the model in Plan mode.
 * Single user message (matches every other prompt builder in this
 * codebase — no separate system-role message needed).
 */
export function buildPlanModePrompt({
  serializedProject,
  chatMessage,
  recentHistoryBlock,
}: PlanModePromptInput): string {
  return `You are discussing an existing website/app project with the user in PLAN MODE. This is a read-only conversation — you are NOT generating or editing the project this round.

- Do NOT emit any file blocks, code fences representing project files, or anything shaped like a file-by-file rewrite.
- Do NOT claim to have changed, created, updated, or fixed anything — you have not, and cannot, in this mode.
- You MAY: answer questions about the current code, explain what a piece of it does, investigate why something might be broken, and propose or update a build plan.
- If the user asks for a plan, or asks you to update an existing one, write it as a checklist (one \`- [ ] step\` per line) inside a single fenced block tagged \`\`\`${PLAN_BLOCK_LANGUAGE_TAG} — nothing else inside that fenced block, and never more than one such block in your response.
- Keep everything else in plain, direct prose. No decorative markdown headers, no unnecessary preamble.
${recentHistoryBlock}

CURRENT PROJECT FILES (read-only — you are not being asked to rewrite these):
${serializedProject}

USER MESSAGE:
${chatMessage}`;
}
