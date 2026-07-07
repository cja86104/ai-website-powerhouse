"use client";

/**
 * OllamaSection — the "Ollama Settings" card in the Settings panel.
 *
 * Reads `ollamaUrl` from the settings store; writes via `setOllamaUrl`
 * and re-probes connectivity against the new URL on every change
 * (fire-and-forget, matching the legacy `handleOllamaUrlChange`).
 *
 * The connectivity probe here intentionally duplicates the mount-time
 * probe in `AIWebsitePowerhouse.js` — the model-picker UI it used to
 * feed was unwired during the OpenRouter restructure, and both probes
 * collapse into a real model list when the picker is rebuilt in the W5
 * generation refactor.
 *
 * NOTE (PR-4 latent-bug fix, per memory/state.md open question): the
 * legacy JSX referenced `availableModels` / `selectedModel` /
 * `onSelectedModelChange`, none of which were in scope — opening the
 * Settings panel would throw a ReferenceError caught by the
 * ErrorBoundary. That dead model-picker block is removed here; the
 * picker returns with real state in W5.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useCallback } from "react";
import { Sliders } from "lucide-react";
import { useSettingsStore } from "@/lib/store/settings-store";

export const OllamaSection = memo(function OllamaSection() {
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl);
  const setOllamaUrl = useSettingsStore((s) => s.setOllamaUrl);

  /**
   * Best-effort connectivity probe. Mirrors the legacy
   * `fetchAvailableModels` no-op check so server-side issues surface
   * in DevTools; the response body is intentionally unused until the
   * model picker is rebuilt in W5.
   */
  const probeOllama = useCallback(async (url: string) => {
    try {
      await fetch(`${url}/api/tags`);
    } catch (error) {
      console.log(
        "Could not reach Ollama:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }, []);

  const handleUrlChange = useCallback(
    (newUrl: string) => {
      setOllamaUrl(newUrl);
      probeOllama(newUrl);
    },
    [setOllamaUrl, probeOllama],
  );

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl p-6 border border-orange-500/20">
      <h3 className="text-xl font-bold text-orange-100 mb-4 flex items-center gap-2">
        <Sliders className="w-5 h-5" />
        Ollama Settings
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-orange-200 mb-2">
            Ollama URL
          </label>
          <input
            type="text"
            value={ollamaUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full px-4 py-2 bg-[#1a1a2e] border border-orange-500/30 rounded-lg text-orange-100 placeholder-orange-400/50 focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>
    </div>
  );
});
