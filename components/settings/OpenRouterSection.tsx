"use client";

/**
 * OpenRouterSection — the "OpenRouter Configuration" card in the
 * Settings panel: BYOK key input, curated model dropdown (with the
 * Custom… sentinel that reveals the slug input), and the max-tokens
 * slider.
 *
 * Reads OpenRouter config from the settings store and the
 * server-availability probe result from the UI store. Settings
 * persist on change; the "Save" button is only the confirmation
 * alert, matching legacy semantics.
 *
 * The Custom-slug input renders conditionally, but no hooks are
 * declared after that branch — hooks-order rule per Section 6 §6.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo, useCallback } from "react";
import { Cloud } from "lucide-react";
import {
  CURATED_OPENROUTER_MODELS,
  CUSTOM_MODEL_ID,
  PRICE_LIST_VERIFIED_AT,
  formatDropdownLabel,
} from "@/lib/models";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useUiStore } from "@/lib/store/ui-store";
import { saveOpenrouterKey } from "@/lib/integrations/actions";

export const OpenRouterSection = memo(function OpenRouterSection() {
  const openrouterKey = useSettingsStore((s) => s.openrouterKey);
  const setOpenrouterKey = useSettingsStore((s) => s.setOpenrouterKey);
  const openrouterModel = useSettingsStore((s) => s.openrouterModel);
  const setOpenrouterModel = useSettingsStore((s) => s.setOpenrouterModel);
  const openrouterCustomSlug = useSettingsStore((s) => s.openrouterCustomSlug);
  const setOpenrouterCustomSlug = useSettingsStore(
    (s) => s.setOpenrouterCustomSlug,
  );
  const openrouterMaxTokens = useSettingsStore((s) => s.openrouterMaxTokens);
  const setOpenrouterMaxTokens = useSettingsStore(
    (s) => s.setOpenrouterMaxTokens,
  );
  const openrouterServerAvailable = useUiStore(
    (s) => s.openrouterServerAvailable,
  );

  // Save persists the key to the ACCOUNT (encrypted at rest) so it
  // follows the user across browsers (W5 UX). Model/token settings
  // still persist locally on change, as before.
  const saveOpenrouterSettings = useCallback(async () => {
    try {
      await saveOpenrouterKey(openrouterKey);
      alert("OpenRouter settings saved to your account!");
    } catch (error) {
      alert(
        `Could not save the key to your account: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }, [openrouterKey]);

  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl p-6 border border-cyan-500/20">
      <h3 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
        <Cloud className="w-5 h-5" />
        OpenRouter Configuration
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-cyan-200 mb-2">
            API Key
            {openrouterServerAvailable !== null && (
              <span className="ml-2 text-xs text-cyan-300/60">
                {openrouterServerAvailable
                  ? "(leave blank to use server key)"
                  : "(server key not configured)"}
              </span>
            )}
          </label>
          <input
            type="password"
            value={openrouterKey}
            onChange={(e) => setOpenrouterKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full px-4 py-2 bg-[#1a1a2e] border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-cyan-400/50 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-cyan-200 mb-2">
            Model
          </label>
          <select
            value={openrouterModel}
            onChange={(e) => setOpenrouterModel(e.target.value)}
            className="w-full px-4 py-2 bg-[#1a1a2e] border border-cyan-500/30 rounded-lg text-cyan-100 focus:outline-none focus:border-cyan-500/50"
          >
            {CURATED_OPENROUTER_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {formatDropdownLabel(m)}
              </option>
            ))}
            <option value={CUSTOM_MODEL_ID}>Custom… (enter slug below)</option>
          </select>
          <p className="text-xs text-cyan-300/60 mt-1">
            Prices verified {PRICE_LIST_VERIFIED_AT}.
          </p>
        </div>
        {openrouterModel === CUSTOM_MODEL_ID && (
          <div>
            <label className="block text-sm font-medium text-cyan-200 mb-2">
              Custom Model Slug
            </label>
            <input
              type="text"
              value={openrouterCustomSlug}
              onChange={(e) => setOpenrouterCustomSlug(e.target.value)}
              placeholder="provider/model-name"
              className="w-full px-4 py-2 bg-[#1a1a2e] border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-cyan-400/50 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-cyan-200 mb-2">
            Max Output Tokens: {openrouterMaxTokens}
          </label>
          <input
            type="range"
            min="1024"
            max="64000"
            step="512"
            value={openrouterMaxTokens}
            onChange={(e) => setOpenrouterMaxTokens(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>
        <button
          onClick={saveOpenrouterSettings}
          className="w-full py-2 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          Save OpenRouter Settings
        </button>
      </div>
    </div>
  );
});
