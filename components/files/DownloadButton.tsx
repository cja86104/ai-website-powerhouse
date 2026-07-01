"use client";

/**
 * DownloadButton — the "Download as ZIP" button in the file-browser
 * header. Reads `generatedFiles` from the store and calls the
 * `downloadAsZip` helper directly (JSZip flow per Section 6 §2).
 *
 * The `data-shortcut="download-zip"` attribute is required — the
 * global Ctrl+S keyboard shortcut handler in `AIWebsitePowerhouse.js`
 * dispatches by querying this selector.
 *
 * Extracted from the legacy `FileBrowser` header in W1 PR-3.
 */

import { memo } from "react";
import { Archive } from "lucide-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { downloadAsZip } from "@/lib/utils/download";

export const DownloadButton = memo(function DownloadButton() {
  const files = useGenerationStore((s) => s.generatedFiles);

  return (
    <button
      onClick={() => downloadAsZip(files)}
      data-shortcut="download-zip"
      className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
    >
      <Archive className="w-4 h-4" />
      ZIP
    </button>
  );
});
