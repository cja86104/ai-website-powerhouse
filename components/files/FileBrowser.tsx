"use client";

/**
 * FileBrowser — center-column list of generated files with tab-style
 * selection and a header row of download/deploy actions.
 *
 * Reads `generatedFiles`, `selectedFile`, `generationStats` from
 * Zustand directly. The ZIP-download button is its own component
 * (`DownloadButton`, per Section 6 §2) because it owns the JSZip
 * flow. "All" (download-each-file) and "Deploy" are inline here
 * because they're one-liners and don't warrant separate files.
 *
 * The `generationStats` block is behavior-dead today (setter only
 * writes `null`); it renders when W5 populates real stats.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-3.
 */

import { memo } from "react";
import { CloudDownload, Download, FolderOpen } from "lucide-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { useUiStore } from "@/lib/store/ui-store";
import { downloadAllFiles } from "@/lib/utils/download";
import { DownloadButton } from "@/components/files/DownloadButton";
import { FileTab } from "@/components/files/FileTab";

export const FileBrowser = memo(function FileBrowser() {
  const files = useGenerationStore((s) => s.generatedFiles);
  const selectedFile = useGenerationStore((s) => s.selectedFile);
  const setSelectedFile = useGenerationStore((s) => s.setSelectedFile);
  const generationStats = useGenerationStore((s) => s.generationStats);
  const setShowDeployModal = useUiStore((s) => s.setShowDeployModal);

  const hasFiles = files.length > 0;

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-blue-500/30 shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-blue-100 flex items-center gap-2">
          <FolderOpen className="w-6 h-6" />
          Generated Files
        </h2>
        {hasFiles && (
          <div className="flex gap-2">
            <DownloadButton />
            <button
              onClick={() => downloadAllFiles(files)}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              All
            </button>
            <button
              onClick={() => setShowDeployModal(true)}
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <CloudDownload className="w-4 h-4" />
              Deploy
            </button>
          </div>
        )}
      </div>

      {hasFiles ? (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {files.map((file) => (
              <FileTab
                key={file.name}
                file={file}
                isSelected={selectedFile?.name === file.name}
                onSelect={setSelectedFile}
              />
            ))}
          </div>
          {generationStats && (
            <div className="flex gap-4 text-xs text-blue-300/70 pt-2 border-t border-blue-500/20">
              <span>⏱️ {generationStats.time}s</span>
              <span>📝 {generationStats.tokens.toLocaleString()} tokens</span>
              <span>⚡ {generationStats.speed} tok/s</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-blue-300">
          No files generated yet. Create a website to get started!
        </div>
      )}
    </div>
  );
});
