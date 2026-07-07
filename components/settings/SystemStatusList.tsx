"use client";

/**
 * SystemStatusList — the "System Status" card in the Settings panel.
 * Four status rows: active provider, OpenRouter server-key
 * availability, Supabase, GitHub. Covered by OPENROUTER-SMOKE-TEST
 * Group G (G-1..G-7).
 *
 * Reads the provider from the settings store, the server-key probe
 * result from the UI store, and the two integration flags from the
 * integrations store. No props — the legacy `systemStatus` memo on
 * the main component is retired with this extraction.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo } from "react";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useIntegrationsStore } from "@/lib/store/integrations-store";
import { useUiStore } from "@/lib/store/ui-store";

export const SystemStatusList = memo(function SystemStatusList() {
  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const openrouterServerAvailable = useUiStore(
    (s) => s.openrouterServerAvailable,
  );
  const supabaseEnabled = useIntegrationsStore((s) => s.supabaseEnabled);
  const githubEnabled = useIntegrationsStore((s) => s.githubEnabled);

  return (
    <div className="mt-6 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl p-6 border border-orange-500/20">
      <h3 className="text-xl font-bold text-orange-100 mb-4">System Status</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${aiProvider === "ollama" ? "bg-orange-500" : "bg-cyan-500"}`}
          ></div>
          <span className="text-orange-200">
            Active Provider:{" "}
            {aiProvider === "ollama" ? "Ollama (local)" : "OpenRouter (cloud)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              openrouterServerAvailable === true
                ? "bg-green-500"
                : openrouterServerAvailable === false
                  ? "bg-gray-500"
                  : "bg-yellow-500"
            }`}
          ></div>
          <span className="text-orange-200">
            OR Server Key:{" "}
            {openrouterServerAvailable === true
              ? "Available"
              : openrouterServerAvailable === false
                ? "Not configured"
                : "Checking…"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${supabaseEnabled ? "bg-green-500" : "bg-gray-500"}`}
          ></div>
          <span className="text-orange-200">
            Supabase: {supabaseEnabled ? "Connected" : "Disabled"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${githubEnabled ? "bg-green-500" : "bg-gray-500"}`}
          ></div>
          <span className="text-orange-200">
            GitHub: {githubEnabled ? "Connected" : "Disabled"}
          </span>
        </div>
      </div>
    </div>
  );
});
