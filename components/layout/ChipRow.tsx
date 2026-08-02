"use client";

/**
 * ChipRow — the small badge row in the header:
 *   [Full-Stack (if Supabase)] [Payments (if Stripe)] [GitHub (if enabled)] [AI provider chip]
 *
 * Reads GitHub enablement from the integrations store, the ACTIVE
 * PROJECT'S real Supabase connection state from generation-store
 * (2026-07-31 — previously a dead, always-false legacy flag; see
 * PLAN/Feature-Connect-Your-Supabase.md), the same project's Stripe
 * connection state (2026-08-01, same store, mirrors supabaseConnected),
 * and provider/model info from the settings store. No props.
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
import { Cloud, CreditCard, Database, Github } from "lucide-react";
import { CUSTOM_MODEL_ID, DEFAULT_OLLAMA_MODEL_ID } from "@/lib/models";
import { useIntegrationsStore } from "@/lib/store/integrations-store";
import { useGenerationStore } from "@/lib/store/generation-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUiStore } from "@/lib/store/ui-store";

export const ChipRow = memo(function ChipRow() {
  const supabaseConnected = useGenerationStore((s) => s.supabaseConnected);
  const stripeConnected = useGenerationStore((s) => s.stripeConnected);
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
      {supabaseConnected && (
        <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium flex items-center gap-1">
          <Database className="w-3 h-3" />
          Full-Stack
        </span>
      )}
      {stripeConnected && (
        <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium flex items-center gap-1">
          <CreditCard className="w-3 h-3" />
          Payments
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
        <span className="opacity-60 underline decoration-dotted underline-offset-2">
          change
        </span>
      </button>
    </>
  );
});
