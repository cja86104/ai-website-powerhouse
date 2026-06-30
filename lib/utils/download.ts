/**
 * AI Website Powerhouse — file download utilities
 *
 * Lifted from the legacy `components/AIWebsitePowerhouse.js` monolith as
 * part of the W1 PR-1 extraction. Three browser-side helpers for
 * delivering generated files to the user's disk:
 *
 *   - `downloadFile(file)`     single file via anchor + Blob
 *   - `downloadAllFiles(files)` every file individually, staggered to
 *                                avoid the browser blocking back-to-back
 *                                anchor clicks
 *   - `downloadAsZip(files)`    bundle every file via dynamically-loaded
 *                                JSZip, falling back to `downloadAllFiles`
 *                                on any failure (load error, generation
 *                                error). The fallback preserves the
 *                                original UX from the legacy code.
 *
 * Behavior is preserved verbatim from the legacy implementations.
 */

import type { GeneratedFile } from "@/lib/generation/types";

/**
 * Save a single file to the user's downloads folder via a temporary
 * anchor element + Blob URL. Synchronous; resolves immediately.
 */
export function downloadFile(file: GeneratedFile): void {
  const blob = new Blob([file.content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Save every file individually, staggered by 100ms per file so that
 * the browser does not block consecutive anchor clicks in the same tick.
 * Returns immediately; the actual downloads fire on the macrotask queue.
 */
export function downloadAllFiles(files: GeneratedFile[]): void {
  files.forEach((file, index) => {
    setTimeout(() => downloadFile(file), index * 100);
  });
}

/**
 * Bundle every file into `website.zip` via dynamically-loaded JSZip
 * and trigger a single download. On any failure (JSZip load, zip
 * generation), logs the error, alerts the user, and falls back to
 * `downloadAllFiles` so the user still gets their files.
 *
 * Returns a Promise that resolves once either the ZIP download has
 * fired or the fallback has been scheduled; never rejects.
 */
export async function downloadAsZip(files: GeneratedFile[]): Promise<void> {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    files.forEach((file) => {
      zip.file(file.name, file.content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "website.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("ZIP creation error:", error);
    alert("Error creating ZIP file. Downloading files individually instead.");
    downloadAllFiles(files);
  }
}
