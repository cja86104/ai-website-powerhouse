/**
 * AI Website Powerhouse — Model Catalog
 *
 * Single source of truth for the LLM providers and curated OpenRouter models
 * the app can call. Imported by the Settings UI, the streaming helper, and
 * (later) the OpenRouter proxy route.
 *
 * Pricing was verified directly against OpenRouter model pages on the date
 * stored in `PRICE_LIST_VERIFIED_AT`. When prices change upstream, refresh
 * the constants below and bump that date — there is no other source of
 * pricing truth elsewhere in the codebase.
 */

/** The two LLM transports the app supports. */
export type Provider = "ollama" | "openrouter";

/**
 * Sentinel slug used in the OpenRouter model dropdown when the user chooses
 * to type a custom OpenRouter model slug instead of picking from the curated
 * list. Distinct from any real model id so it can be compared by equality.
 */
export const CUSTOM_MODEL_ID = "__custom__" as const;

/** Type of the custom-slug sentinel for narrow comparisons. */
export type CustomModelId = typeof CUSTOM_MODEL_ID;

/**
 * Date the curated OpenRouter prices below were last verified.
 * Surfaced in the Settings UI so users can see how fresh the numbers are.
 * Format: ISO 8601 calendar date (YYYY-MM-DD).
 */
export const PRICE_LIST_VERIFIED_AT = "2026-07-12";

/**
 * One entry in the curated OpenRouter model list.
 *
 * `contextWindow` is intentionally nullable: it is filled in only when the
 * native window size is publicly documented on OpenRouter's model page.
 * Models whose context is not formally documented are stored as `null`
 * rather than guessed.
 */
export interface CuratedModel {
  /** Exact OpenRouter model slug, e.g. "deepseek/deepseek-v3.2". */
  id: string;
  /** Friendly display name. Shown alone in compact UI spots. */
  shortLabel: string;
  /** One-line rationale shown beneath the dropdown entry. */
  description: string;
  /** USD per million input tokens. */
  inputPricePerMillion: number;
  /** USD per million output tokens. */
  outputPricePerMillion: number;
  /** Native context window in tokens, or null if not publicly documented. */
  contextWindow: number | null;
  /**
   * USD billed to the USER per generation when run on the HOSTED key
   * (Section 7 metered SKU; Stripe meters aiwp_premium_*). Absent =
   * no surcharge. BYOK usage is never surcharged.
   */
  hostedSurcharge?: number;
}

/**
 * Curated coding-focused OpenRouter models, ordered cheap → premium by
 * effective per-generation cost for long-output website builds.
 *
 * The list is intentionally short. Users who need something outside this
 * set pick `CUSTOM_MODEL_ID` in the dropdown and type their own slug.
 */
export const CURATED_OPENROUTER_MODELS: readonly CuratedModel[] = [
  {
    id: "deepseek/deepseek-v3.2",
    shortLabel: "DeepSeek V3.2 — Best value",
    description:
      "Lowest effective cost for long-output generations. Output price is roughly half of peers at this tier.",
    inputPricePerMillion: 0.23,
    outputPricePerMillion: 0.34,
    contextWindow: null,
  },
  {
    id: "qwen/qwen3-coder-next",
    shortLabel: "Qwen3-Coder-Next — Cheap & coding-specialized",
    description:
      "Same Qwen family as the local default. Coder-tuned. Conceptual continuity when switching between local and OpenRouter.",
    inputPricePerMillion: 0.11,
    outputPricePerMillion: 0.8,
    contextWindow: null,
  },
  {
    id: "mistralai/codestral-2508",
    shortLabel: "Codestral 2508 — Coding specialist, 256K context",
    description:
      "Mistral coding specialist with the same 256K context window the local model uses.",
    inputPricePerMillion: 0.3,
    outputPricePerMillion: 0.9,
    contextWindow: 256000,
  },
  {
    id: "qwen/qwen3-coder",
    shortLabel: "Qwen3-Coder 480B — Same as local, hosted",
    description:
      "Identical model the local Ollama path uses, routed through OpenRouter instead.",
    inputPricePerMillion: 0.22,
    outputPricePerMillion: 1.8,
    contextWindow: 256000,
  },
  {
    id: "anthropic/claude-haiku-4.5",
    shortLabel: "Claude Haiku 4.5 — Premium",
    description:
      "Strongest coding quality at this price tier. Escalation option when cheaper models fall short.",
    inputPricePerMillion: 1.0,
    outputPricePerMillion: 5.0,
    contextWindow: 200000,
    hostedSurcharge: 0.3,
  },
  {
    id: "anthropic/claude-sonnet-5",
    shortLabel: "Claude Sonnet 5 — Premium",
    description:
      "Frontier coding quality. The step up when a site has to be impressive on the first try.",
    inputPricePerMillion: 2.0,
    outputPricePerMillion: 10.0,
    contextWindow: 1000000,
    hostedSurcharge: 0.75,
  },
  {
    id: "anthropic/claude-opus-4.8",
    shortLabel: "Claude Opus 4.8 — Premium",
    description:
      "Anthropic's most capable generally available model. Maximum quality for flagship builds.",
    inputPricePerMillion: 5.0,
    outputPricePerMillion: 25.0,
    contextWindow: 1000000,
    hostedSurcharge: 2.0,
  },
];

/**
 * Default OpenRouter model when a user switches to the OpenRouter provider
 * without explicitly picking one. Chosen for low cost, coding specialization,
 * and family continuity with the existing local Ollama default.
 */
export const DEFAULT_OPENROUTER_MODEL_ID = "qwen/qwen3-coder-next";

/**
 * Default model the local Ollama path uses. Mirrors the value currently
 * hardcoded inside `handleGenerate` and `handleChatModify` in
 * `components/AIWebsitePowerhouse.js` so the two paths stay aligned.
 *
 * NOTE: per the project's read-only audit decision for the local path, do
 * not change this value without an explicit decision — the component still
 * uses its own hardcoded string today; this constant exists for the
 * provider-agnostic helper (Section 3) and for future consolidation.
 */
export const DEFAULT_OLLAMA_MODEL_ID = "qwen3-coder:480b-cloud";

/**
 * Format a curated model's price as a compact label, e.g.
 *   "$0.23 in / $0.34 out per 1M"
 *
 * Used by the Settings model dropdown to surface price next to every option.
 * Always renders two decimal places so the list visually aligns even when
 * one of the prices is a round number.
 */
export function formatPriceLabel(model: CuratedModel): string {
  const fmt = (n: number): string => `$${n.toFixed(2)}`;
  return `${fmt(model.inputPricePerMillion)} in / ${fmt(
    model.outputPricePerMillion
  )} out per 1M`;
}

/**
 * Compose the full dropdown label: short label + parenthesized price.
 * Example: "DeepSeek V3.2 — Best value ($0.23 in / $0.34 out per 1M)".
 */
export function formatDropdownLabel(model: CuratedModel): string {
  const surcharge =
    model.hostedSurcharge !== undefined
      ? ` — +$${model.hostedSurcharge.toFixed(2)} per generation on hosted plan, builds AND edits (free with your own key)`
      : "";
  return `${model.shortLabel} (${formatPriceLabel(model)})${surcharge}`;
}

/**
 * Look up a curated model by its OpenRouter slug.
 * Returns `null` when the slug is not on the curated list — e.g. the user
 * has picked the Custom option and supplied their own slug.
 */
export function findCuratedModel(id: string): CuratedModel | null {
  return CURATED_OPENROUTER_MODELS.find((m) => m.id === id) ?? null;
}
