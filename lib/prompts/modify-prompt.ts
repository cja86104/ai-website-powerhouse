/**
 * AI Website Powerhouse — chat-modify prompt
 *
 * Lifted verbatim from the legacy `components/AIWebsitePowerhouse.js`
 * monolith in W1 PR-1. The template literal bodies are **byte-for-byte
 * identical** to the legacy code; any deviation changes what the LLM
 * receives during chat-modify rounds and risks regressing modification
 * quality.
 *
 * W1 PR-5 dead-branch cleanup (Section 6 §7 item 1): the
 * `requiresBackend` SUPABASE IS AVAILABLE section was removed. The
 * flag was hard-coded `false` at every call site since the PR-2
 * dead-state deletion, so the branch was unreachable and the
 * always-taken path — base template + critical output rules — is
 * unchanged byte-for-byte. Backend-aware prompting returns properly
 * with the W5 React/Vite prompt rewrite (Section 6 §11).
 *
 * Unit-test gap (acknowledged): the project's test framework is
 * scheduled for W11 (Vitest per Section 9 sprint plan). Byte-identical
 * preservation is enforced by direct source-to-source comparison
 * against the legacy template — see git history.
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
}

/**
 * Construct the user-role message for a chat-modify round: the base
 * instruction template with the current code and the requested
 * modification interpolated, followed by the CRITICAL OUTPUT RULES.
 */
export function buildModifyPrompt(opts: BuildModifyPromptOptions): string {
  const { generatedCode, chatMessage } = opts;

  // NOTE: the `\x20` after "website." reproduces the trailing space in
  // the legacy byte-identical template without leaving literal trailing
  // whitespace in this source file. Do not remove it.
  let modifyPrompt = `You are an expert developer refining a professional website.\x20

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

  modifyPrompt += `

CRITICAL OUTPUT RULES:
- Keep ALL CSS in <style> tags and ALL JavaScript in <script> tags (inline, not external files)
- Do NOT add external file references like <link href="styles.css"> or <script src="script.js">
- For images: Use real URLs like https://placehold.co/800x600 - never raw template literals like \${item.image}

IMPORTANT: Return the COMPLETE modified code with ALL improvements integrated seamlessly. If there are multiple files, use the same FILE: marker format. Return ONLY the code, nothing else.`;

  return modifyPrompt;
}
