/**
 * AI Website Powerhouse — sampling parameter helpers.
 *
 * Created in W1 PR-5 per the deferred PR-2 tactical decision recorded
 * in memory/state.md (option b): the temperature boost lives in its
 * own utility file instead of `lib/llm.ts`, keeping the don't-touch
 * streaming helper genuinely untouched and making the math testable
 * in isolation when Vitest lands in W11.
 */

/**
 * Map the user-facing temperature slider value to the effective
 * temperature sent to the provider.
 *
 * The 1.3× boost (capped at 1.2) is intentional, inherited behavior:
 * the audit (AUDIT-REPORT-2026-06-02) flagged it as undocumented, and
 * the Section 6 §7 decision was to KEEP it but document it. Website
 * generation benefits from more creative sampling than the raw slider
 * default suggests; the cap keeps output coherent. Both `handleGenerate`
 * and `handleChatModify` call this for both providers, so the boost is
 * applied exactly once, in one place.
 *
 * Removing or changing the boost is a behavior change — do it in its
 * own PR, never inside a refactor.
 *
 * @param slider - The raw temperature from the Settings slider (0–1).
 * @returns The boosted temperature actually sent to the model (0–1.2).
 */
export function effectiveTemperature(slider: number): number {
  return Math.min(slider * 1.3, 1.2);
}
