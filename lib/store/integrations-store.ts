/**
 * AI Website Powerhouse — third-party integrations store.
 *
 * Holds the legacy GitHub PAT credentials used by the in-browser
 * GitHub API calls. Coexists with the GitHub-App OAuth flow in NEXT
 * until LATER+ when PAT support is dropped.
 *
 * The legacy Supabase URL/key trio (supabaseUrl/supabaseKey/
 * supabaseEnabled) was retired 2026-07-31 — it saved a pair nobody
 * read (confirmed dead by grep: zero wiring into any prompt builder or
 * generation path, only two decorative status-dot consumers) and is
 * replaced by the real, PROJECT-scoped connection in
 * `lib/supabase-connect/actions.ts` + `generation-store`'s
 * `supabaseConnected` (see PLAN/Feature-Connect-Your-Supabase.md).
 * `lib/store/migrate-legacy-localstorage.ts` still WRITES those three
 * keys for the one-time pre-Zustand-refactor migration path (its own
 * local, decoupled type) — left alone deliberately: Zustand's persist
 * `partialize` below simply ignores JSON keys it no longer declares,
 * so old localStorage payloads are harmless, and that migration ran
 * for every active user many months ago.
 *
 * Persistence key: `aiwp-integrations-v1`. Hydration is deferred via
 * `skipHydration: true` so the wrapping `<HydrationGate>` can run the
 * legacy-localStorage migration first.
 *
 * The `enabled` boolean is derived from "user supplied a token" but is
 * persisted as explicit state to preserve the legacy behavior (it gets
 * flipped to `true` when the user clicks "Save" in the Settings panel,
 * not when typing).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface IntegrationsState {
  // GitHub (legacy PAT path)
  githubUsername: string;
  setGithubUsername: (value: string) => void;
  githubToken: string;
  setGithubToken: (value: string) => void;
  githubEnabled: boolean;
  setGithubEnabled: (value: boolean) => void;
}

interface IntegrationsPersistedSlice {
  githubUsername: string;
  githubToken: string;
  githubEnabled: boolean;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set) => ({
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
        githubUsername: state.githubUsername,
        githubToken: state.githubToken,
        githubEnabled: state.githubEnabled,
      }),
    },
  ),
);
