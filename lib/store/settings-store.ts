/**
 * AI Website Powerhouse — settings store.
 *
 * Persists user configuration that survives reloads: the active AI
 * provider, the Ollama URL, the OpenRouter BYOK + model selection, and
 * the four sampling parameters (num_ctx, temperature, top_p, top_k).
 *
 * Persistence key: `aiwp-settings-v1`. The version suffix lets future
 * migrations target a specific schema. Hydration is deferred via
 * `skipHydration: true` so the wrapping `<HydrationGate>` can run the
 * legacy-localStorage migration first.
 *
 * The dead-code states `needsBackend` and `uploadProgress` (audit-noted
 * setters never called) are intentionally NOT included here — they are
 * deleted as part of W1 PR-2 per Section 6 §7.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_OPENROUTER_MODEL_ID } from "@/lib/models";

/** AI provider identifier. Mirrors the discriminator on `Provider` in `lib/llm.ts`. */
export type AiProvider = "ollama" | "openrouter";

/** Public shape of the settings store including action setters. */
export interface SettingsState {
  // Provider
  aiProvider: AiProvider;
  setAiProvider: (value: AiProvider) => void;

  // Ollama
  ollamaUrl: string;
  setOllamaUrl: (value: string) => void;

  // OpenRouter
  openrouterKey: string;
  setOpenrouterKey: (value: string) => void;
  openrouterModel: string;
  setOpenrouterModel: (value: string) => void;
  openrouterCustomSlug: string;
  setOpenrouterCustomSlug: (value: string) => void;
  openrouterMaxTokens: number;
  setOpenrouterMaxTokens: (value: number) => void;

  // Sampling
  numCtx: number;
  setNumCtx: (value: number) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  topP: number;
  setTopP: (value: number) => void;
  topK: number;
  setTopK: (value: number) => void;
}

/** Persisted slice of the settings store — actions are never persisted. */
interface SettingsPersistedSlice {
  aiProvider: AiProvider;
  ollamaUrl: string;
  openrouterKey: string;
  openrouterModel: string;
  openrouterCustomSlug: string;
  openrouterMaxTokens: number;
  numCtx: number;
  temperature: number;
  topP: number;
  topK: number;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiProvider: "ollama",
      setAiProvider: (value) => set({ aiProvider: value }),

      ollamaUrl: "http://localhost:11434",
      setOllamaUrl: (value) => set({ ollamaUrl: value }),

      openrouterKey: "",
      setOpenrouterKey: (value) => set({ openrouterKey: value }),
      openrouterModel: DEFAULT_OPENROUTER_MODEL_ID,
      setOpenrouterModel: (value) => set({ openrouterModel: value }),
      openrouterCustomSlug: "",
      setOpenrouterCustomSlug: (value) => set({ openrouterCustomSlug: value }),
      openrouterMaxTokens: 16000,
      setOpenrouterMaxTokens: (value) => set({ openrouterMaxTokens: value }),

      numCtx: 32768,
      setNumCtx: (value) => set({ numCtx: value }),
      temperature: 0.7,
      setTemperature: (value) => set({ temperature: value }),
      topP: 0.9,
      setTopP: (value) => set({ topP: value }),
      topK: 40,
      setTopK: (value) => set({ topK: value }),
    }),
    {
      name: "aiwp-settings-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      partialize: (state): SettingsPersistedSlice => ({
        aiProvider: state.aiProvider,
        ollamaUrl: state.ollamaUrl,
        openrouterKey: state.openrouterKey,
        openrouterModel: state.openrouterModel,
        openrouterCustomSlug: state.openrouterCustomSlug,
        openrouterMaxTokens: state.openrouterMaxTokens,
        numCtx: state.numCtx,
        temperature: state.temperature,
        topP: state.topP,
        topK: state.topK,
      }),
    },
  ),
);
