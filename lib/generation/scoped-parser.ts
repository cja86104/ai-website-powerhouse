/**
 * Receiving side of the scoped-modify contract (W8 Mon) — see
 * lib/prompts/scoped-modify-prompt.ts.
 *
 * The contract says "raw file content, no fences", but models
 * habitually wrap single-file answers in a markdown code fence
 * anyway, so we tolerantly strip ONE outer fence (with or without a
 * language tag) before merging. Inner fences — legitimate content in
 * e.g. a README — survive because only a fence pair that wraps the
 * ENTIRE trimmed output is removed.
 */

/** Strips one whole-output markdown code fence, if present. */
export function extractScopedFileContent(raw: string): string {
  const trimmed = raw.trim();
  const match = /^```[A-Za-z0-9_.-]*\r?\n([\s\S]*?)\r?\n```$/.exec(trimmed);
  if (match !== null) {
    return match[1];
  }
  return trimmed;
}
