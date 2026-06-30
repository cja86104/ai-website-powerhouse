/**
 * AI Website Powerhouse — third-party integrations store.
 *
 * Holds the legacy Supabase URL/key pair and the legacy GitHub PAT
 * credentials used by the in-browser GitHub API calls. Both blocks are
 * scheduled for removal/replacement in NEXT phase:
 *  - Supabase URL/key UI is removed in W4 NOW Tier 3.
 *  - GitHub PAT path coexists with the GitHub-App OAuth flow in NEXT
 *    until LATER+ when PAT support is dropped.
 *
 * Persistence key: `aiwp-integrations-v1`. Hydration is deferred via
 * `skipHydration: true` so the wrapping `<HydrationGate>` can run the
 * legacy-localStorage migration first.
 *
 * The `enabled` booleans are derived from "user supplied a key/token"
 * but are persisted as explicit state to preserve the legacy behavior
 * (they get flipped to `true` when the user clicks "Save" in the
 * Settings panel, not when typing).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface IntegrationsState {
  // Supabase
  supabaseUrl: string;
  setSupabaseUrl: (value: string) => void;
  supabaseKey: string;
  setSupabaseKey: (value: string) => void;
  supabaseEnabled: boolean;
  setSupabaseEnabled: (value: boolean) => void;

  // GitHub (legacy PAT path)
  githubUsername: string;
  setGithubUsername: (value: string) => void;
  githubToken: string;
  setGithubToken: (value: string) => void;
  githubEnabled: boolean;
  setGithubEnabled: (value: boolean) => void;
}

interface IntegrationsPersistedSlice {
  supabaseUrl: string;
  supabaseKey: string;
  supabaseEnabled: boolean;
  githubUsername: string;
  githubToken: string;
  githubEnabled: boolean;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set) => ({
      supabaseUrl: "",
      setSupabaseUrl: (value) => set({ supabaseUrl: value }),
      supabaseKey: "",
      setSupabaseKey: (value) => set({ supabaseKey: value }),
      supabaseEnabled: false,
      setSupabaseEnabled: (value) => set({ supabaseEnabled: value }),

      githubUsername: "",
      setGithubUsername: (value) => set({ githubUsername: value }),
      githubToken: "",
      setGithubToken: (value) => set({ githubToken: value }),
      githubEnabled: false,
      setGithubEnabled: (value) => set({ githubEnabled: value }),
    }),
    {
      name: "aiwp-integrations-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
      partialize: (state): IntegrationsPersistedSlice => ({
        supabaseUrl: state.supabaseUrl,
        supabaseKey: state.supabaseKey,
        supabaseEnabled: state.supabaseEnabled,
        githubUsername: state.githubUsername,
        githubToken: state.githubToken,
        githubEnabled: state.githubEnabled,
      }),
    },
  ),
);
