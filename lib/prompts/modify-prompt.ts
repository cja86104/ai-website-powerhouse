/**
 * AI Website Powerhouse — chat-modify prompt
 *
 * Lifted verbatim from the legacy `components/AIWebsitePowerhouse.js`
 * monolith as part of the W1 PR-1 extraction. The template literal
 * bodies (base + optional supabase section + critical output rules) are
 * **byte-for-byte identical** to the legacy code; any deviation will
 * change what the LLM receives during chat-modify rounds and risks
 * regressing modification quality.
 *
 * The legacy call site now calls `buildModifyPrompt(...)` and embeds
 * the result as the single `user` message of the `generateStream`
 * call inside `handleChatModify`.
 *
 * Unit-test gap (acknowledged): the project's test framework is
 * scheduled for W11 (Vitest per Section 9 sprint plan). Byte-identical
 * preservation is enforced here by direct source-to-source comparison
 * against the legacy template — see git history of this PR for the
 * verbatim copy.
 */

/** Options consumed by {@link buildModifyPrompt}. */
export interface BuildModifyPromptOptions {
  /**
   * The most recent generated code shown in the editor. Inlined into
   * the prompt under the `CURRENT CODE:` heading so the model has full
   * context for the modification.
   */
  generatedCode: string;
  /**
   * The user's natural-language modification request typed in the
   * chat input.
   */
  chatMessage: string;
  /**
   * Whether the user's request triggers the "needs backend" code path.
   * As of W1 PR-1 this is always `false` at the call site because the
   * setter is never called — see audit notes. The arg is preserved so
   * the builder remains compatible with the legacy shape during PR-2
   * dead-code cleanup.
   */
  requiresBackend: boolean;
  /**
   * Whether the user has wired Supabase credentials in Settings. Only
   * checked when `requiresBackend` is true.
   */
  canUseSupabase: boolean;
  /**
   * The Supabase project URL. Interpolated into the SUPABASE IS
   * AVAILABLE block. Empty string is fine when `canUseSupabase` is
   * false.
   */
  supabaseUrl: string;
}

/**
 * Construct the user-role message for a chat-modify round. The output
 * is the concatenation (in order) of:
 *   1. Base instruction template with the current code and the
 *      requested modification interpolated.
 *   2. Optional SUPABASE IS AVAILABLE section, iff `requiresBackend`
 *      and `canUseSupabase`.
 *   3. CRITICAL OUTPUT RULES (always present).
 */
export function buildModifyPrompt(opts: BuildModifyPromptOptions): string {
  const { generatedCode, chatMessage, requiresBackend, canUseSupabase, supabaseUrl } = opts;

  let modifyPrompt = `You are an expert developer refining a professional website. 

CURRENT CODE:
${generatedCode}

MODIFICATION REQUEST: ${chatMessage}

QUALITY REQUIREMENTS:
- Maintain the sophisticated quality of the original
- If adding a feature, make it polished and complete with error handling
- Add complementary features that enhance the requested change
- Improve overall code quality and user experience
- Think: "How would a senior developer implement this?"
- Add smooth transitions and animations for any new UI elements
- Ensure the modification integrates seamlessly with existing design`;

  if (requiresBackend && canUseSupabase) {
    modifyPrompt += `

SUPABASE IS AVAILABLE:
- URL: ${supabaseUrl}
- You can add authentication, database operations, or real-time features
- Use the Supabase JS library from CDN`;
  }

  modifyPrompt += `

CRITICAL OUTPUT RULES:
- Keep ALL CSS in <style> tags and ALL JavaScript in <script> tags (inline, not external files)
- Do NOT add external file references like <link href="styles.css"> or <script src="script.js">
- For images: Use real URLs like https://placehold.co/800x600 - never raw template literals like \${item.image}

IMPORTANT: Return the COMPLETE modified code with ALL improvements integrated seamlessly. If there are multiple files, use the same FILE: marker format. Return ONLY the code, nothing else.`;

  return modifyPrompt;
}
