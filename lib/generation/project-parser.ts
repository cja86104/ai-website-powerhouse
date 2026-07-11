/**
 * AI Website Powerhouse — structured project parser (W5).
 *
 * Parses the multi-file project format the React/Vite system prompt
 * instructs models to emit (Section 6 §11's "per-file delimiters"
 * design):
 *
 *   ===AIWP:FILE path="src/App.tsx"===
 *   ...file content...
 *   ===AIWP:END===
 *
 * Deliberately tolerant of the ways models mangle formats, informed
 * by the legacy parser's bridge fixes:
 *  - marker keywords matched case-insensitively, flexible whitespace
 *  - single quotes, double quotes, or bare paths in the attribute
 *  - CRLF normalized up front
 *  - a single ``` fence wrapping the WHOLE output is stripped
 *  - missing ===AIWP:END=== closes implicitly at the next FILE marker
 *    or at end-of-input
 *  - prose before the first marker and after the last file is ignored
 *  - duplicate paths: the LAST occurrence wins (models sometimes
 *    re-emit a corrected file)
 *
 * Path safety: every path is sanitized (no absolute paths, no `..`
 * traversal, restricted charset). Files with unsafe paths are DROPPED,
 * not fixed — a wrong guess about intent is worse than one missing
 * file the user can regenerate.
 *
 * The legacy HTML parser (parser.ts) is untouched and still owns the
 * 'html' framework mode.
 */

import type { GeneratedFile } from "@/lib/generation/types";

/** Marker syntax: ===AIWP:FILE path="src/App.tsx"=== */
const FILE_MARKER =
  /^[ \t]*={2,}[ \t]*AIWP:FILE[ \t]+path[ \t]*=[ \t]*(?:"([^"\n]+)"|'([^'\n]+)'|([^\s=]+))[ \t]*={2,}[ \t]*$/i;
/** Marker syntax: ===AIWP:END=== */
const END_MARKER = /^[ \t]*={2,}[ \t]*AIWP:END[ \t]*={2,}[ \t]*$/i;

/** Path charset: letters, digits, and common project-file punctuation. */
const SAFE_PATH = /^[A-Za-z0-9_@+][A-Za-z0-9._\-\/+@]*$/;
const MAX_PATH_LENGTH = 200;

/**
 * Sanitize a marker path. Returns the normalized relative path, or
 * null when the path is unsafe and the file must be dropped.
 */
export function sanitizeProjectPath(raw: string): string | null {
  let path = raw.trim().replace(/\\/g, "/");
  while (path.startsWith("./")) path = path.slice(2);
  // Absolute paths are dropped, not normalized — an absolute path
  // means the model misunderstood the project-relative contract.
  if (path.startsWith("/")) return null;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length === 0 || path.length > MAX_PATH_LENGTH) return null;
  if (path.endsWith("/")) return null;
  const segments = path.split("/");
  if (segments.some((s) => s === ".." || s === "." || s.length === 0)) {
    return null;
  }
  if (!SAFE_PATH.test(path)) return null;
  return path;
}

/**
 * Strip a single markdown fence wrapping the ENTIRE payload (a common
 * model failure despite instructions). Inner fences are content and
 * are preserved.
 */
function stripWholeOutputFence(text: string): string {
  const trimmed = text.trim();
  const match = /^```[A-Za-z0-9_-]*\n([\s\S]*?)\n?```$/.exec(trimmed);
  return match !== null ? match[1] : text;
}

/**
 * Parse structured project output into files. Returns [] when no
 * valid FILE markers are found — callers decide the fallback (the
 * Builder rescues via the legacy parser).
 */
export function parseProjectFiles(text: string): GeneratedFile[] {
  const normalized = stripWholeOutputFence(text.replace(/\r\n/g, "\n"));
  const lines = normalized.split("\n");

  const byPath = new Map<string, string>();
  let currentPath: string | null = null;
  let currentLines: string[] = [];

  const flush = (): void => {
    if (currentPath !== null) {
      // Trim exactly one trailing blank line left by the marker layout.
      let content = currentLines.join("\n");
      content = content.replace(/\n$/, "");
      byPath.set(currentPath, content);
    }
    currentPath = null;
    currentLines = [];
  };

  for (const line of lines) {
    const fileMatch = FILE_MARKER.exec(line);
    if (fileMatch !== null) {
      flush();
      const rawPath = fileMatch[1] ?? fileMatch[2] ?? fileMatch[3] ?? "";
      currentPath = sanitizeProjectPath(rawPath);
      // Unsafe path: currentPath stays null → lines are discarded
      // until the next marker (drop, don't guess).
      continue;
    }
    if (END_MARKER.test(line)) {
      flush();
      continue;
    }
    if (currentPath !== null) {
      currentLines.push(line);
    }
  }
  flush();

  return Array.from(byPath.entries()).map(([name, content]) => ({
    name,
    content,
  }));
}

/**
 * Serialize files back into the marker format — used by the React
 * modify prompt so the model sees the current project in exactly the
 * format it must emit.
 */
export function serializeProjectFiles(files: GeneratedFile[]): string {
  return files
    .map(
      (file) =>
        `===AIWP:FILE path="${file.name}"===\n${file.content}\n===AIWP:END===`,
    )
    .join("\n\n");
}

/** Marker syntax: ===AIWP:DELETE path="src/Old.jsx"=== (delta edits, 2026-07-12). */
const DELETE_MARKER =
  /^[ \t]*={2,}[ \t]*AIWP:DELETE[ \t]+path="([^"]*)"[ \t]*={2,}[ \t]*$/i;

/**
 * Paths explicitly deleted by a delta modify response (2026-07-12).
 * Under the delta contract the model emits only created/changed
 * files; deletions must be explicit via the DELETE marker — silent
 * omission no longer deletes anything.
 */
export function parseDeletedPaths(text: string): string[] {
  const deleted: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const match = DELETE_MARKER.exec(line);
    if (match === null) continue;
    const path = sanitizeProjectPath(match[1]);
    if (path === null || seen.has(path)) continue;
    seen.add(path);
    deleted.push(path);
  }
  return deleted;
}

/**
 * Merge a delta modify response into the current file set: updated
 * files replace (or add to) the current ones by path; explicitly
 * deleted paths are removed. Order: existing files keep their
 * positions, new files append — stable ordering keeps the file
 * browser from reshuffling on every edit.
 */
export function mergeProjectFiles(
  current: GeneratedFile[],
  updated: GeneratedFile[],
  deletedPaths: string[],
): GeneratedFile[] {
  const updatedByName = new Map(updated.map((f) => [f.name, f]));
  const deleted = new Set(deletedPaths);
  const merged: GeneratedFile[] = [];
  const usedNames = new Set<string>();

  for (const file of current) {
    if (deleted.has(file.name)) continue;
    merged.push(updatedByName.get(file.name) ?? file);
    usedNames.add(file.name);
  }
  for (const file of updated) {
    if (usedNames.has(file.name) || deleted.has(file.name)) continue;
    merged.push(file);
    usedNames.add(file.name);
  }
  return merged;
}
