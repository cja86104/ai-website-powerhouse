/**
 * Silent image-resolution pass (2026-07-21).
 *
 * The generation system prompts (react-system-prompt.ts / system-prompt.ts)
 * let the model fall back to placehold.co URLs for any image it can't
 * source a real photo for. This module is the client half of a small
 * second, non-streaming call — fired automatically right after a
 * generation finishes, against the SAME proxy route the main generation
 * used, with `silent: true` so it doesn't count against the user's quota
 * or get billed as a premium generation (see app/api/openrouter/route.ts)
 * — that asks the model to resolve every numbered data-aiwp-slot element
 * (IMAGE_SLOT_RULES, lib/prompts/image-slots.ts) to a real Unsplash photo
 * URL. Best-effort only: the call site (Builder.tsx) wraps the fetch in a
 * try/catch and ships the site with its placeholders on any failure —
 * nothing here throws for a malformed model response, it just returns
 * null/leaves content untouched so the caller can fall back cleanly.
 */

import type { GeneratedFile } from "@/lib/generation/types";

/**
 * Matches a full opening tag that carries a data-aiwp-slot attribute,
 * regardless of where in the tag that attribute falls relative to
 * `src`/`alt` — models don't emit attributes in a fixed order.
 */
const SLOT_TAG = /<[a-zA-Z][^>]*\bdata-aiwp-slot="(\d+)"[^>]*>/g;
const ALT_ATTR = /\balt="([^"]*)"/;
const SRC_ATTR = /\bsrc="[^"]*"/;

function slotAttrPattern(slot: string): RegExp {
  return new RegExp(`\\bdata-aiwp-slot="${slot}"`);
}

/**
 * Extract every numbered image slot across a project, keyed by slot
 * number, with a best-effort text description (the element's `alt`
 * text when present, else a generic label) to guide the model's photo
 * choice. Slot numbers are already unique 1..N site-wide by the time
 * this runs — see lib/generation/slot-renumber.ts, which the caller
 * runs before this.
 */
export function extractSlots(files: GeneratedFile[]): Record<string, string> {
  const slots: Record<string, string> = {};
  for (const file of files) {
    for (const match of file.content.matchAll(SLOT_TAG)) {
      const [tag, num] = match;
      if (slots[num] !== undefined) continue;
      const alt = ALT_ATTR.exec(tag)?.[1];
      slots[num] =
        alt !== undefined && alt.length > 0 ? alt : `image slot ${num}`;
    }
  }
  return slots;
}

/**
 * Swap the `src` of every element tagged with a resolved slot number.
 * Only rewrites `<img src="...">`-style elements — CSS background-image
 * slots (allowed by the IMAGE_SLOT_RULES contract) are left as-is by
 * this pass and keep their placeholder.
 */
export function applyImageUrls(
  files: GeneratedFile[],
  urls: Record<string, string>,
): GeneratedFile[] {
  return files.map((file) => {
    let content = file.content;
    for (const [slot, url] of Object.entries(urls)) {
      if (typeof url !== "string" || url.length === 0) continue;
      const slotAttr = slotAttrPattern(slot);
      content = content.replace(SLOT_TAG, (tag) => {
        if (!slotAttr.test(tag) || !SRC_ATTR.test(tag)) return tag;
        return tag.replace(SRC_ATTR, `src="${url}"`);
      });
    }
    return { ...file, content };
  });
}

/**
 * Parse the model's JSON slot→URL response, tolerating the markdown
 * code fences some models add despite being told not to. Returns
 * `null` on any parse failure or unexpected shape so the call site can
 * fall back to placeholders rather than throwing.
 */
export function parseImagePassResponse(
  text: string,
): Record<string, string> | null {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === "string" && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}
