/**
 * Scoped (file-aware) modify prompt — W8 Mon.
 *
 * When the user scopes a chat request to ONE file, we send the model
 * only that file's current content plus the project's path listing
 * for orientation, and require the complete updated content of that
 * single file back — raw, no markers, no fences, no other files.
 *
 * This is the token-saving counterpart to the full-replacement
 * contracts in modify-prompt.ts / react-modify-prompt.ts: the client
 * merges the returned content over the scoped file and leaves every
 * other file byte-untouched (see extractScopedFileContent in
 * lib/generation/scoped-parser.ts for the receiving side).
 */

export interface ScopedModifyPromptInput {
  /** Path of the one file being modified (e.g. "src/App.jsx"). */
  filePath: string;
  /** That file's current full content. */
  fileContent: string;
  /** Every path in the project, for cross-file orientation only. */
  projectPaths: string[];
  /** The user's modification request. */
  chatMessage: string;
}

/** Builds the single-file modify prompt. */
export function buildScopedModifyPrompt(
  input: ScopedModifyPromptInput,
): string {
  const pathListing = input.projectPaths.map((p) => `- ${p}`).join("\n");

  return `You are an expert web developer. The project contains these files:

${pathListing}

You are modifying EXACTLY ONE file: ${input.filePath}

Current content of ${input.filePath}:
------------------------------------------------------------
${input.fileContent}
------------------------------------------------------------

USER REQUEST: ${input.chatMessage}

OUTPUT RULES — follow every one:
1. Return the COMPLETE updated content of ${input.filePath} and nothing else.
2. Do NOT return any other file. Do NOT create new files.
3. Do NOT wrap the output in markdown code fences.
4. Do NOT add explanations, comments about the change, or file markers.
5. Keep everything in the file that the request does not ask you to change.
6. If the request cannot be satisfied inside this one file, do your best within it — never touch other files.
7. Keep every data-aiwp-slot attribute exactly as it is (invisible editor metadata). If the request asks to put an image in "spot N" or "box N", set the src (or background-image) of the element whose data-aiwp-slot equals N to the exact URL provided, keeping the existing layout classes.

Return only the raw file content, starting with its first character.`;
}
