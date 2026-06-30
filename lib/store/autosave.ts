/**
 * AI Website Powerhouse — autosave snapshot helpers.
 *
 * The legacy app debounces a "snapshot" of in-progress generation
 * work — the parsed file list, the raw `generatedCode` buffer, and the
 * chat thread — into a single localStorage key. On next mount the
 * snapshot is detected and the user is prompted via RestoreWorkModal
 * to decide whether to bring the work back or discard it.
 *
 * This is intentionally NOT a Zustand `persist` middleware target: the
 * snapshot is a user-confirmed save/load, not an automatic rehydrate.
 *
 * Storage key: `aiwp-autosave-v1`. Migrated from the legacy
 * `aiwebsite_autosave` key by `migrate-legacy-localstorage.ts` —
 * shape is unchanged so the rename is lossless.
 */

import type { GeneratedFile } from "@/lib/generation/types";
import type { ChatMessage } from "@/lib/store/chat-store";

/** localStorage key used to persist the in-progress work snapshot. */
export const AUTOSAVE_KEY = "aiwp-autosave-v1";

/** Shape of the autosave snapshot. Identical to the legacy `aiwebsite_autosave` payload. */
export interface AutosaveSnapshot {
  files: GeneratedFile[];
  code: string;
  chatHistory: ChatMessage[];
  timestamp: number;
}

/**
 * Persist the current work snapshot to localStorage. Silently no-ops
 * when called outside a browser environment so SSR code paths and
 * test runners don't throw.
 */
export function saveSnapshot(
  files: GeneratedFile[],
  code: string,
  chatHistory: ChatMessage[],
): void {
  if (typeof window === "undefined") return;
  const snapshot: AutosaveSnapshot = {
    files,
    code,
    chatHistory,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota errors and serialization failures are non-fatal — the
    // user can still continue working. Matches the legacy behavior
    // which had no try/catch around the same write.
  }
}

/**
 * Load the most recent snapshot from localStorage. Returns `null`
 * when no snapshot is present or the stored payload fails to parse
 * as expected.
 */
export function loadSnapshot(): AutosaveSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTOSAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AutosaveSnapshot>;
    if (
      Array.isArray(parsed.files) &&
      typeof parsed.code === "string" &&
      Array.isArray(parsed.chatHistory)
    ) {
      return {
        files: parsed.files,
        code: parsed.code,
        chatHistory: parsed.chatHistory,
        timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Remove any persisted autosave snapshot. */
export function clearSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // ignore
  }
}

/** Whether a snapshot is currently present in localStorage. */
export function hasSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTOSAVE_KEY) !== null;
}
