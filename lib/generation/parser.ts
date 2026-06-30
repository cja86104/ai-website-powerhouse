/**
 * AI Website Powerhouse — multi-file generation parser
 *
 * Lifted from the legacy `components/AIWebsitePowerhouse.js` monolith as
 * part of the W1 PR-1 extraction. This is the **Section A bridge fix**
 * version of the parser, not the original buggy regex — it supports:
 *
 *   - Three marker syntaxes (`<!-- FILE: x -->`, `// FILE: x`, `/* FILE: x *\/`),
 *     all case-insensitive on the FILE keyword.
 *   - CRLF normalization to LF before any matching.
 *   - Surrounding ```` ```html ... ``` ```` markdown fence stripping for models
 *     that wrap their output despite the prompt asking them not to.
 *   - Implicit-first-file rescue: if the response begins with HTML
 *     content before the first FILE marker, the preamble is promoted
 *     to `index.html`. Rescues the DeepSeek pattern where only files
 *     2..N are explicitly marked.
 *   - Postamble strip after the last `</html>`: anything the model
 *     leaks after the final closing HTML tag (chatty afterword, etc.)
 *     is discarded.
 *   - Non-HTML files (CSS / JS) pass through `trimToHtmlBounds`
 *     unchanged.
 *
 * Behavior is preserved verbatim from the legacy implementation. Any
 * deviation will be caught by the W1 PR-1 fixture tests scheduled for
 * the acceptance gate (Section 6 §3 PR-1 risk mitigation).
 *
 * Future-proof note: in W5–W6 this parser will be rewritten to handle
 * project-tree output (package.json + nested src/), likely using a
 * manifest-driven format instead of HTML comment markers. The shape
 * here is the W1 transitional version.
 */

import type { GeneratedFile } from "@/lib/generation/types";

/**
 * Parse the raw streamed LLM output into discrete files.
 *
 * Returns an empty array when input is missing or empty. Never throws.
 */
export function parseGeneratedFiles(content: string): GeneratedFile[] {
  if (typeof content !== "string" || content.length === 0) {
    return [];
  }

  // Normalize line endings so the marker regex does not have to handle CRLF.
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Strip surrounding markdown code fences if the model wrapped its output
  // in ```html ... ``` despite the prompt telling it not to.
  const fenceStripped = normalized
    .replace(/^\s*```[a-zA-Z]*\s*\n/, "")
    .replace(/\n```\s*$/, "")
    .trim();

  // Match every file marker. Three syntaxes are accepted for forward
  // compatibility, all case-insensitive on the FILE keyword:
  //   <!-- FILE: name.html -->     (the documented HTML form)
  //   // FILE: name.js              (line-comment form, future JS gens)
  //   /* FILE: name.css */          (block-comment form, future CSS gens)
  const markerPatterns: RegExp[] = [
    /(?:^|\n)\s*<!--\s*FILE:\s*([^\n>]+?)\s*-->\s*\n/gi,
    /(?:^|\n)\s*\/\/\s*FILE:\s*([^\n]+?)\s*\n/gi,
    /(?:^|\n)\s*\/\*\s*FILE:\s*([^\n*]+?)\s*\*\/\s*\n/gi,
  ];

  interface Marker {
    filename: string;
    markerStart: number;
    contentStart: number;
  }

  const markers: Marker[] = [];
  for (const pattern of markerPatterns) {
    for (const m of fenceStripped.matchAll(pattern)) {
      const filename = (m[1] || "").trim();
      if (filename.length > 0 && typeof m.index === "number") {
        markers.push({
          filename,
          markerStart: m.index,
          contentStart: m.index + m[0].length,
        });
      }
    }
  }
  // Process in document order regardless of which pattern matched first.
  markers.sort((a, b) => a.markerStart - b.markerStart);

  const files: GeneratedFile[] = [];

  if (markers.length === 0) {
    // No markers anywhere — single-file response. Use the original
    // heuristic to name it.
    const cleaned = trimToHtmlBounds(fenceStripped);
    if (cleaned.length === 0) return [];

    const lower = cleaned.toLowerCase();
    if (lower.includes("<!doctype") || lower.includes("<html")) {
      files.push({ name: "index.html", content: cleaned });
    } else if (
      cleaned.includes("function ") ||
      cleaned.includes("const ") ||
      cleaned.includes("import ")
    ) {
      files.push({ name: "script.js", content: cleaned });
    } else if (cleaned.includes("{") && cleaned.includes("}")) {
      files.push({ name: "styles.css", content: cleaned });
    } else {
      files.push({ name: "index.html", content: cleaned });
    }
    return files;
  }

  // Implicit first file: if there is HTML content before the first marker,
  // promote it to index.html. This rescues the DeepSeek pattern where the
  // model only marks files 2..N.
  const preamble = fenceStripped.slice(0, markers[0].markerStart);
  const preambleLower = preamble.toLowerCase();
  if (preambleLower.includes("<!doctype") || preambleLower.includes("<html")) {
    const cleaned = trimToHtmlBounds(preamble);
    if (cleaned.length > 0) {
      files.push({ name: "index.html", content: cleaned });
    }
  }

  // Slice content between consecutive markers.
  for (let i = 0; i < markers.length; i++) {
    const { filename, contentStart } = markers[i];
    const contentEnd =
      i + 1 < markers.length
        ? markers[i + 1].markerStart
        : fenceStripped.length;
    const raw = fenceStripped.slice(contentStart, contentEnd);
    const cleaned = trimToHtmlBounds(raw);
    if (cleaned.length > 0) {
      files.push({ name: filename, content: cleaned });
    }
  }

  return files;
}

/**
 * Trim a per-file slice to just its HTML document.
 *
 *   - Strips any narration before `<!DOCTYPE` (or `<html`).
 *   - Strips anything after the last `</html>`. This is what kills the
 *     postamble paragraph DeepSeek leaks at the end of long responses.
 *   - Non-HTML content (CSS, JS) passes through unchanged.
 *
 * Exported for direct use by future callers (e.g. the chat-modify
 * pipeline if it wants to re-apply the postamble strip to incremental
 * patches).
 */
export function trimToHtmlBounds(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";

  const lower = trimmed.toLowerCase();
  const docTypeIdx = lower.indexOf("<!doctype");
  const htmlOpenIdx = lower.indexOf("<html");

  let startIdx = -1;
  if (docTypeIdx !== -1 && htmlOpenIdx !== -1) {
    startIdx = Math.min(docTypeIdx, htmlOpenIdx);
  } else if (docTypeIdx !== -1) {
    startIdx = docTypeIdx;
  } else if (htmlOpenIdx !== -1) {
    startIdx = htmlOpenIdx;
  }

  // Not an HTML document — return as-is so CSS/JS files are not corrupted.
  if (startIdx === -1) {
    return trimmed;
  }

  // Strip anything after the last </html>. This is what kills the
  // postamble paragraph DeepSeek leaks at the end of long responses.
  const htmlCloseIdx = lower.lastIndexOf("</html>");
  const endIdx =
    htmlCloseIdx !== -1 ? htmlCloseIdx + "</html>".length : trimmed.length;

  return trimmed.slice(startIdx, endIdx);
}
