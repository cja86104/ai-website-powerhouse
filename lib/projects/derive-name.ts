/**
 * Project auto-naming (2026-07-12, user-reported: every same-day
 * project was named "Website — Jul 12" — indistinguishable).
 *
 * Pure helpers (separate module so they're unit-testable — the
 * "use server" actions file may only export async functions).
 *
 * Strategy: prompts very often contain the site's name in quotes
 * ('a website for "Cedar & Stone Coffee Roasters"') — use it when
 * present; otherwise strip the create-a-website-for boilerplate off
 * the first line and take a word-boundary-trimmed 48 chars.
 */

/** Trailing punctuation that reads badly in a card title. */
const TRAILING_PUNCTUATION = /[\s.,;:!\-–—]+$/;

/** Derive a human name from a generation prompt, or null. */
export function deriveProjectName(prompt: string): string | null {
  const text = prompt.trim();
  if (text.length === 0) return null;

  const quoted =
    /"([^"\n]{3,60})"/.exec(text) ?? /“([^”\n]{3,60})”/.exec(text);
  if (quoted !== null) {
    const name = quoted[1].replace(TRAILING_PUNCTUATION, "").trim();
    if (name.length >= 3) return name;
  }

  let first = text
    .split("\n")[0]
    .replace(
      /^(please\s+)?(create|make|build|design|generate)\s+(me\s+)?(a|an)?\s*(website|site|web\s*page|webpage|landing\s*page)?\s*(for|about|called|named)?\s*/i,
      "",
    )
    .trim();
  if (first.length === 0) first = text.split("\n")[0].trim();
  if (first.length > 48) {
    const cut = first.slice(0, 48);
    const lastSpace = cut.lastIndexOf(" ");
    first = `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim()}…`;
  }
  first = first.replace(TRAILING_PUNCTUATION, "").trim();
  return first.length >= 3 ? first : null;
}

/**
 * Whether a project still carries a machine default name — only
 * these get auto-renamed; a name the user chose is never touched.
 */
export function isDefaultProjectName(name: string): boolean {
  return name === "My First Website" || /^Website — /.test(name);
}
