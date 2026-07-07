"use client";

/**
 * SupabaseSection — the legacy "Supabase Configuration" card in the
 * Settings panel. Scheduled for removal in W4 NOW Tier 3 when the
 * platform-managed Supabase backend replaces the user-supplied pair.
 *
 * Reads the URL/key/enabled trio from the integrations store. The
 * URL/key persist on every keystroke via the store's persist
 * middleware; the "Save" button only flips the `enabled` flag and
 * shows the confirmation alert, matching legacy semantics.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useCallback } from "react";
import { Database } from "lucide-react";
import { useIntegrationsStore } from "@/lib/store/integrations-store";

export const SupabaseSection = memo(function SupabaseSection() {
  const supabaseUrl = useIntegrationsStore((s) => s.supabaseUrl);
  const setSupabaseUrl = useIntegrationsStore((s) => s.setSupabaseUrl);
  const supabaseKey = useIntegrationsStore((s) => s.supabaseKey);
  const setSupabaseKey = useIntegrationsStore((s) => s.setSupabaseKey);
  const supabaseEnabled = useIntegrationsStore((s) => s.supabaseEnabled);
  const setSupabaseEnabled = useIntegrationsStore((s) => s.setSupabaseEnabled);

  const saveSupabaseSettings = useCallback(() => {
    if (supabaseUrl && supabaseKey) {
      setSupabaseEnabled(true);
      alert("Supabase settings saved!");
    } else {
      alert("Please fill in both Supabase URL and Key");
    }
  }, [supabaseUrl, supabaseKey, setSupabaseEnabled]);

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-6 border border-green-500/20">
      <h3 className="text-xl font-bold text-green-100 mb-4 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Supabase Configuration
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Project URL
          </label>
          <input
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="https://your-project.supabase.co"
            className="w-full px-4 py-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg text-green-100 placeholder-green-400/50 focus:outline-none focus:border-green-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Anon Key
          </label>
          <input
            type="password"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            className="w-full px-4 py-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg text-green-100 placeholder-green-400/50 focus:outline-none focus:border-green-500/50"
          />
        </div>
        <button
          onClick={saveSupabaseSettings}
          className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          {supabaseEnabled ? "Update Settings" : "Enable Supabase"}
        </button>
      </div>
    </div>
  );
});
