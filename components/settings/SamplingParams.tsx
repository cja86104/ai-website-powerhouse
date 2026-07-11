"use client";

/**
 * SamplingParams — the "Model Parameters" card in the Settings panel.
 * Four range sliders: context length, temperature, top_p, top_k.
 *
 * Reads all four values from the settings store; writes via the
 * matching setters. No props.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-4.
 */

import { memo } from "react";
import { Sliders } from "lucide-react";
import { useSettingsStore } from "@/lib/store/settings-store";

export const SamplingParams = memo(function SamplingParams() {
  const temperature = useSettingsStore((s) => s.temperature);
  const setTemperature = useSettingsStore((s) => s.setTemperature);
  const topP = useSettingsStore((s) => s.topP);
  const setTopP = useSettingsStore((s) => s.setTopP);
  const topK = useSettingsStore((s) => s.topK);
  const setTopK = useSettingsStore((s) => s.setTopK);

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl p-6 border border-purple-500/20">
      <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center gap-2">
        <Sliders className="w-5 h-5" />
        Model Parameters
      </h3>
      <p className="text-xs text-purple-300/70 mb-4">
        How creative vs. predictable the AI is. Temperature is the main
        dial: lower = safer and more consistent, higher = more varied
        ideas. Top P and Top K limit how far it wanders when picking
        each word. The defaults work well — experiment freely; you can
        always set them back (0.7 / 0.9 / 40).
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            Temperature: {temperature}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            Top P: {topP}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={topP}
            onChange={(e) => setTopP(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">
            Top K: {topK}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
});
