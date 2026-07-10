/**
 * AI Website Powerhouse — React/Vite chat-modify prompt (W5).
 *
 * The current project is serialized back into the marker format (via
 * serializeProjectFiles) so the model sees exactly the format it must
 * emit. The model returns the COMPLETE updated project — same
 * full-replacement contract as the legacy modify flow, which keeps
 * the per-generation file snapshots in project_files consistent.
 */

/** Options consumed by {@link buildReactModifyPrompt}. */
export interface BuildReactModifyPromptOptions {
  /** The current project serialized in AIWP:FILE marker format. */
  serializedProject: string;
  /** The user's natural-language modification request. */
  chatMessage: string;
}

/** Construct the user-role message for a React project modify round. */
export function buildReactModifyPrompt(
  opts: BuildReactModifyPromptOptions,
): string {
  const { serializedProject, chatMessage } = opts;

  return `You are an expert React developer refining a professional Vite + React project.

CURRENT PROJECT:
${serializedProject}

MODIFICATION REQUEST: ${chatMessage}

REQUIREMENTS:
- Maintain the sophisticated quality of the original
- Implement the change completely, with error handling and polish
- Keep the modification consistent with the existing design system
- Do not add npm dependencies; the package.json dependency set is fixed
- Tailwind loads from the CDN script in index.html: never add tailwind.config or @tailwind directives, and use only standard built-in utility classes (or arbitrary values), never invented theme tokens
- Keep every existing feature and file that the request does not remove

CRITICAL OUTPUT RULES:
- Return the COMPLETE updated project — EVERY file, including unchanged ones, in the same ===AIWP:FILE path="..."=== / ===AIWP:END=== marker format
- Omitting a file DELETES it from the project, so only omit files the request explicitly removes
- Output is ONLY the marker-formatted files: no prose before, between, or after`;
}
