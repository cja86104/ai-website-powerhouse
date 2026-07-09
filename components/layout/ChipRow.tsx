"use client";

/**
 * ChipRow — the small badge row in the header:
 *   [Full-Stack (if Supabase)] [GitHub (if enabled)] [AI provider chip]
 *
 * Reads its data from the integrations store (Supabase/GitHub
 * enablement) and the settings store (active provider + model /
 * ollama URL). No props.
 *
 * The AI-provider chip title-attribute reproduces the legacy
 * hover-tooltip behavior verbatim so power users who rely on it
 * to see whether their key or the server key is active don't lose
 * that affordance.
 *
 * Extracted from the header block of the legacy main component in
 * W1 PR-3.
 */

import { memo } from "react";
import { Cloud, Database, Github } from "lucide-react";
import { CUSTOM_MODEL_ID, DEFAULT_OLLAMA_MODEL_ID } from "@/lib/models";
import { useIntegrationsStore } from "@/lib/store/integrations-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUiStore } from "@/lib/store/ui-store";

export const ChipRow = memo(function ChipRow() {
  const supabaseEnabled = useIntegrationsStore((s) => s.supabaseEnabled);
  const githubEnabled = useIntegrationsStore((s) => s.githubEnabled);
  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl);
  const openrouterKey = useSettingsStore((s) => s.openrouterKey);
  const openrouterModel = useSettingsStore((s) => s.openrouterModel);
  const openrouterCustomSlug = useSettingsStore((s) => s.openrouterCustomSlug);
  const setShowSettings = useUiStore((s) => s.setShowSettings);

  const providerTitle =
    aiProvider === "ollama"
      ? `Local Ollama at ${ollamaUrl}`
      : openrouterKey.trim()
      ? "OpenRouter (your key)"
      : "OpenRouter (server key)";

  const providerLabel =
    aiProvider === "ollama"
      ? `Ollama · ${DEFAULT_OLLAMA_MODEL_ID}`
      : `OpenRouter · ${
          openrouterModel === CUSTOM_MODEL_ID
            ? openrouterCustomSlug.trim() || "(no model)"
            : openrouterModel
        }`;

  return (
    <>
      {supabaseEnabled && (
        <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium flex items-center gap-1">
          <Database className="w-3 h-3" />
          Full-Stack
        </span>
      )}
      {githubEnabled && (
        <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium flex items-center gap-1">
          <Github className="w-3 h-3" />
          GitHub
        </span>
      )}
      {/* Clickable since W5 UX: the chip was display-only and users
          had no discoverable path to switch providers. */}
      <button
        onClick={() => setShowSettings(true)}
        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 cursor-pointer transition-colors ${
          aiProvider === "ollama"
            ? "bg-orange-500/20 border border-orange-500/30 text-orange-300 hover:bg-orange-500/30"
            : "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30"
        }`}
        title={`${providerTitle} — click to change`}
      >
        <Cloud className="w-3 h-3" />
        {providerLabel}
      </button>
    </>
  );
});
