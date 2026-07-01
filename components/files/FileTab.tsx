"use client";

/**
 * FileTab — one selectable file tab in the file browser row.
 *
 * Extracted from the inline `.map` in the legacy `FileBrowser` in
 * W1 PR-3. Stateless; reads nothing from the store.
 */

import { memo } from "react";
import { FileCode } from "lucide-react";
import type { GeneratedFile } from "@/lib/generation/types";

export interface FileTabProps {
  file: GeneratedFile;
  isSelected: boolean;
  onSelect: (file: GeneratedFile) => void;
}

export const FileTab = memo(function FileTab({
  file,
  isSelected,
  onSelect,
}: FileTabProps) {
  return (
    <button
      onClick={() => onSelect(file)}
      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
        isSelected
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
          : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
      }`}
    >
      <FileCode className="w-4 h-4" />
      {file.name}
    </button>
  );
});
