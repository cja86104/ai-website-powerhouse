/**
 * AI Website Powerhouse — React/Vite chat-modify prompt (W5; delta
 * contract 2026-07-12).
 *
 * The current project is serialized back into the marker format (via
 * serializeProjectFiles) so the model sees exactly the format it must
 * emit. Since 2026-07-12 the model returns ONLY created/changed files
 * (each complete top-to-bottom) plus explicit DELETE markers — the
 * client merges them over the current set (mergeProjectFiles). This
 * cut simple edits from full-rebuild time to seconds (user-reported:
 * a background-color change took as long as the original build).
 * Snapshots in project_files stay complete because the MERGED set is
 * what gets persisted.
 */

import { IMAGE_SLOT_RULES } from "@/lib/prompts/image-slots";

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
- Do not add npm dependencies; the package.json dependency set is fixed. The ONLY allowed imports are "react", "react-dom"/"react-dom/client", "framer-motion", "lucide-react", "react-router-dom" (HashRouter only, never BrowserRouter), and relative paths — importing anything else (react-scroll, axios, react-icons, etc.) breaks the build. Implement such behavior with plain React/CSS/fetch instead
- Tailwind loads from the CDN script in index.html: never add tailwind.config or @tailwind directives, and use only standard built-in utility classes (or arbitrary values), never invented theme tokens
- Keep every existing feature and file that the request does not remove

${IMAGE_SLOT_RULES}

CRITICAL OUTPUT RULES:
- Return ONLY the files you are creating or changing, in the same ===AIWP:FILE path="..."=== / ===AIWP:END=== marker format. Files you do not emit are kept exactly as they are — do NOT re-emit unchanged files (this makes edits much faster)
- Every file you DO emit must be its COMPLETE final content, top to bottom — never a fragment or a diff
- To DELETE a file, emit exactly this marker on its own line: ===AIWP:DELETE path="src/OldFile.jsx"===
- Output is ONLY markers: no prose before, between, or after`;
}
