"use client";

/**
 * GenerationPanel — the left-column "Generate Website" card. Owns
 * the collapsible template picker + the prompt form.
 *
 * Reads `showTemplates` from the UI store; toggles it via
 * `setShowTemplates`.
 *
 * `onGenerate` is passed through to `PromptForm` — see
 * `PromptForm` header for why that callback still lives on the
 * parent.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-3.
 */

import { memo } from "react";
import { useUiStore } from "@/lib/store/ui-store";
import { PromptForm } from "@/components/generation/PromptForm";
import { TemplatePicker } from "@/components/generation/TemplatePicker";

export interface GenerationPanelProps {
  /** See PromptForm. */
  onGenerate: () => void;
}

export const GenerationPanel = memo(function GenerationPanel({
  onGenerate,
}: GenerationPanelProps) {
  const showTemplates = useUiStore((s) => s.showTemplates);
  const setShowTemplates = useUiStore((s) => s.setShowTemplates);

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-orange-100">Generate Website</h2>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm font-medium"
        >
          {showTemplates ? "Hide Templates" : "Show Templates"}
        </button>
      </div>

      {showTemplates && <TemplatePicker />}

      <PromptForm onGenerate={onGenerate} />
    </div>
  );
});
