/**
 * AI Website Powerhouse — shared generation types
 *
 * Created in the W1 PR-1 extraction. Minimal at this stage — a single
 * `GeneratedFile` shape consumed by the multi-file parser, the download
 * utility, and the file-browser UI. Expanded in W5–W6 when the system
 * prompt and parser are rewritten to emit Vite / Next.js project trees
 * (the future shape adds a manifest and per-file metadata).
 */

/**
 * One element of a generated website: a relative filename plus its
 * full text content. Names are taken verbatim from the model's
 * `<!-- FILE: ... -->` markers; no sanitization is applied here, so
 * callers that write to disk must validate.
 */
export interface GeneratedFile {
  name: string;
  content: string;
}
