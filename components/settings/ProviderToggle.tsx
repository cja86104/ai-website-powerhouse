"use client";

/**
 * ProviderToggle — the "AI Provider" card at the top of the Settings
 * panel. Switches between the local Ollama path and the OpenRouter
 * cloud path.
 *
 * Reads `aiProvider` from the settings store; writes via
 * `setAiProvider`. No props.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo } from "react";
import { Cloud } from "lucide-react";
import { useSettingsStore } from "@/lib/store/settings-store";

export const ProviderToggle = memo(function ProviderToggle() {
  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const setAiProvider = useSettingsStore((s) => s.setAiProvider);

  return (
    <div className="mb-6 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl p-6 border border-cyan-500/20">
      <h3 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
        <Cloud className="w-5 h-5" />
        AI Provider
      </h3>
      <div className="flex gap-3">
        <button
          onClick={() => setAiProvider("ollama")}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            aiProvider === "ollama"
              ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg"
              : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20"
          }`}
        >
          Local (Ollama)
        </button>
        <button
          onClick={() => setAiProvider("openrouter")}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
            aiProvider === "openrouter"
              ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg"
              : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20"
          }`}
        >
          Cloud (OpenRouter)
        </button>
      </div>
      {/* The note sits under WHICHEVER button is active (2026-07-12
          user feedback: it always sat left, under Ollama, even when
          Cloud was selected). */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <p className="text-sm text-cyan-300/70">
          {aiProvider === "ollama"
            ? "Generation uses your local Ollama server (configured below)."
            : ""}
        </p>
        <p className="text-sm text-cyan-300/70">
          {aiProvider === "openrouter"
            ? "Generation uses OpenRouter cloud models (configured below)."
            : ""}
        </p>
      </div>
    </div>
  );
});
