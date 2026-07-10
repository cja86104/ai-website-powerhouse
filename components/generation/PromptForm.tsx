"use client";

/**
 * PromptForm — textarea + "Save as Template" button + "Generate"
 * button. The bottom half of the `GenerationPanel`.
 *
 * Reads `prompt` and `isGenerating` from the generation store,
 * `setPrompt` too. Save-Template is fully self-contained (uses
 * `window.prompt` for the name and `addUserTemplate` from the
 * templates store).
 *
 * `onGenerate` remains a prop because `handleGenerate` in the
 * parent closes over ollama URL, sampling params, provider,
 * OpenRouter config, and the Supabase enablement flag — too many
 * concerns to pull into this leaf component in PR-3. That
 * consolidation is a candidate for a future `useGeneration()`
 * hook (out of scope here).
 *
 * The `data-shortcut="generate"` attribute is required — the
 * global Ctrl+Enter keyboard shortcut handler queries this
 * selector.
 *
 * Extracted from the legacy `GenerationPanel` in W1 PR-3.
 */

import { memo } from "react";
import { Code, Loader2 } from "lucide-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { useTemplatesStore } from "@/lib/store/templates-store";
import { createUserTemplate } from "@/lib/templates/actions";

export interface PromptFormProps {
  /**
   * Kicks off the current generation. Owned by the parent because it
   * closes over ollama URL, sampling params, and provider config.
   */
  onGenerate: () => void;
}

export const PromptForm = memo(function PromptForm({
  onGenerate,
}: PromptFormProps) {
  const prompt = useGenerationStore((s) => s.prompt);
  const setPrompt = useGenerationStore((s) => s.setPrompt);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const addUserTemplate = useTemplatesStore((s) => s.addUserTemplate);

  // Saves to the ACCOUNT (2026-07-11) — templates follow the login,
  // not the browser. The store is updated with the DB row so the
  // picker reflects the save instantly.
  const handleSaveTemplate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt first");
      return;
    }
    const templateName = window.prompt("Enter a name for this template:");
    if (!templateName?.trim()) return;
    try {
      const saved = await createUserTemplate(templateName, prompt);
      addUserTemplate(saved);
      alert(
        `Template "${saved.name}" saved to your account! Find it under "Your Templates" at the top of the template picker.`,
      );
    } catch (error) {
      alert(
        `Could not save the template: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  return (
    <>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the website you want to create... (or select a template above)"
        className="w-full h-48 px-4 py-3 bg-[#1a1a2e] border border-orange-500/30 rounded-lg text-orange-100 placeholder-orange-400/50 resize-none focus:outline-none focus:border-orange-500/50 mb-3"
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSaveTemplate}
          disabled={!prompt.trim()}
          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⭐ Save as Template
        </button>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        data-shortcut="generate"
        className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Code className="w-5 h-5" />
            Generate Website
          </>
        )}
      </button>
    </>
  );
});
