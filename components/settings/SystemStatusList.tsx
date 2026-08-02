"use client";

/**
 * SystemStatusList — the "System Status" card in the Settings panel.
 * Four status rows: active provider, OpenRouter server-key
 * availability, Supabase, GitHub. Covered by OPENROUTER-SMOKE-TEST
 * Group G (G-1..G-7).
 *
 * Reads the provider from the settings store, the server-key probe
 * result from the UI store, GitHub enablement from the integrations
 * store, and the ACTIVE PROJECT'S real Supabase + Stripe connection
 * state from generation-store (2026-07-31 / 2026-08-01 — previously a
 * dead, always-false legacy Supabase flag; see
 * PLAN/Feature-Connect-Your-Supabase.md). No props — the legacy
 * `systemStatus` memo on the main component is retired with this
 * extraction.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo } from "react";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useIntegrationsStore } from "@/lib/store/integrations-store";
import { useGenerationStore } from "@/lib/store/generation-store";
import { useUiStore } from "@/lib/store/ui-store";

export const SystemStatusList = memo(function SystemStatusList() {
  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const openrouterServerAvailable = useUiStore(
    (s) => s.openrouterServerAvailable,
  );
  const supabaseConnected = useGenerationStore((s) => s.supabaseConnected);
  const stripeConnected = useGenerationStore((s) => s.stripeConnected);
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
            className={`w-3 h-3 rounded-full ${supabaseConnected ? "bg-green-500" : "bg-gray-500"}`}
          ></div>
          <span className="text-orange-200">
            Supabase: {supabaseConnected ? "Connected" : "Disabled"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${stripeConnected ? "bg-green-500" : "bg-gray-500"}`}
          ></div>
          <span className="text-orange-200">
            Stripe: {stripeConnected ? "Connected" : "Disabled"}
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
