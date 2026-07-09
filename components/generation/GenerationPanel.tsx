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

import { memo, useCallback } from "react";
import { useUiStore } from "@/lib/store/ui-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import {
  useGenerationStore,
  type ProjectFramework,
} from "@/lib/store/generation-store";
import { setProjectFramework } from "@/lib/projects/actions";
import { PromptForm } from "@/components/generation/PromptForm";
import { TemplatePicker } from "@/components/generation/TemplatePicker";

export interface GenerationPanelProps {
  /** See PromptForm. */
  onGenerate: () => void;
  /** Archives the current project and opens a fresh workspace (W5). */
  onNewProject: () => void;
}

export const GenerationPanel = memo(function GenerationPanel({
  onGenerate,
  onNewProject,
}: GenerationPanelProps) {
  const showTemplates = useUiStore((s) => s.showTemplates);
  const setShowTemplates = useUiStore((s) => s.setShowTemplates);
  const setShowSettings = useUiStore((s) => s.setShowSettings);
  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const openrouterKey = useSettingsStore((s) => s.openrouterKey);

  // Plain-words description of where the next generation will run —
  // the header chip is technical shorthand; this is for people who
  // don't know what an Ollama is (W5 UX).
  const providerBlurb =
    aiProvider === "ollama"
      ? "Using local AI (Ollama) — requires Ollama running on your computer"
      : openrouterKey.trim().length > 0
        ? "Using cloud AI with your own OpenRouter key — unlimited"
        : "Using free hosted AI (DeepSeek, 3/day) — add your own key or upgrade for more";
  const framework = useGenerationStore((s) => s.framework);
  const setFramework = useGenerationStore((s) => s.setFramework);
  const projectId = useGenerationStore((s) => s.projectId);

  // Framework toggle (W5 Thu): flips the store immediately for the
  // next generation and persists to projects.framework fire-and-forget.
  const handleFrameworkChange = useCallback(
    (next: ProjectFramework) => {
      if (next === framework) return;
      setFramework(next);
      if (projectId !== null) {
        setProjectFramework(projectId, next).catch((error: unknown) => {
          console.error("Failed to persist framework choice:", error);
        });
      }
    },
    [framework, setFramework, projectId],
  );

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-orange-100">Generate Website</h2>
        <div className="flex gap-2">
          <button
            onClick={onNewProject}
            className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg transition-colors text-sm font-medium"
            title="Save this project to history and start fresh"
          >
            New Project
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm font-medium"
          >
            {showTemplates ? "Hide Templates" : "Show Templates"}
          </button>
        </div>
      </div>

      {showTemplates && <TemplatePicker />}

      <p className="mb-3 text-xs text-orange-200/60">
        {providerBlurb}{" "}
        <button
          onClick={() => setShowSettings(true)}
          className="text-orange-400 hover:text-orange-300 font-medium underline underline-offset-2"
        >
          Change
        </button>
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-orange-200/70">Output:</span>
        <button
          onClick={() => handleFrameworkChange("react-vite")}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            framework === "react-vite"
              ? "bg-orange-500/40 text-orange-100"
              : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          }`}
        >
          React + Vite
        </button>
        <button
          onClick={() => handleFrameworkChange("html")}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            framework === "html"
              ? "bg-orange-500/40 text-orange-100"
              : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          }`}
        >
          Classic HTML
        </button>
      </div>

      <PromptForm onGenerate={onGenerate} />
    </div>
  );
});
