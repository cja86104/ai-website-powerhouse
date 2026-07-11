"use client";

/**
 * SettingsPanel — the Settings modal shell. Owns the backdrop, the
 * close button, and the composition of the eight section components:
 * ProviderToggle, OllamaSection, SamplingParams, SupabaseSection,
 * GithubSection, OpenRouterSection, SystemStatusList. (DangerZone was
 * retired in W4 — the localStorage snapshot it cleared no longer
 * exists; account deletion lives on /account.)
 *
 * Reads `showSettings` from the UI store; closes via
 * `setShowSettings(false)`. All hooks are declared before the
 * `if (!showSettings) return null` guard — hooks-order rule per
 * Section 6 §6. No props.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo } from "react";
import { X } from "lucide-react";
import { useUiStore } from "@/lib/store/ui-store";
import { ProviderToggle } from "@/components/settings/ProviderToggle";
import { OllamaSection } from "@/components/settings/OllamaSection";
import { SamplingParams } from "@/components/settings/SamplingParams";
import { SupabaseSection } from "@/components/settings/SupabaseSection";
import { GithubSection } from "@/components/settings/GithubSection";
import { OpenRouterSection } from "@/components/settings/OpenRouterSection";
import { SystemStatusList } from "@/components/settings/SystemStatusList";

export const SettingsPanel = memo(function SettingsPanel() {
  const showSettings = useUiStore((s) => s.showSettings);
  const setShowSettings = useUiStore((s) => s.setShowSettings);

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-orange-500/30 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-orange-100">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-orange-300" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <ProviderToggle />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OllamaSection />
            <OpenRouterSection />
            <SamplingParams />
            <SupabaseSection />
            <GithubSection />
          </div>

          <SystemStatusList />
        </div>
      </div>
    </div>
  );
});
