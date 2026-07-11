/**
 * Deterministic image-slot renumbering (2026-07-12).
 *
 * The prompt contract asks for site-wide unique data-aiwp-slot
 * numbers, but real output numbered slots PER COMPONENT (seven files,
 * all reusing 1 and 2) — so the preview showed duplicate badges and a
 * "put it in spot 1" request was ambiguous. Model discipline can't be
 * trusted for uniqueness, so the app reassigns numbers 1..N in stable
 * file order after every parse/merge. File order is stable across
 * delta edits (mergeProjectFiles keeps positions), so numbers only
 * shift when image elements are added or removed.
 */

import type { GeneratedFile } from "@/lib/generation/types";

const SLOT_ATTR = /data-aiwp-slot="[^"]*"/g;
const RENUMBERABLE = /\.(jsx|js|html)$/;

/** Reassigns every data-aiwp-slot to a site-wide unique 1..N. */
export function renumberImageSlots(files: GeneratedFile[]): GeneratedFile[] {
  let counter = 0;
  return files.map((file) => {
    if (!RENUMBERABLE.test(file.name)) return file;
    if (!file.content.includes("data-aiwp-slot")) return file;
    const content = file.content.replace(SLOT_ATTR, () => {
      counter += 1;
      return `data-aiwp-slot="${counter}"`;
    });
    return { ...file, content };
  });
}
