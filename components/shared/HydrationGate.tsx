"use client";

/**
 * HydrationGate — blocks rendering of the Zustand-backed UI until:
 *  1. the one-shot legacy-localStorage migration has run, AND
 *  2. all `persist`-backed stores have rehydrated from localStorage.
 *
 * This prevents two failure modes called out in
 * `PLAN/Section-06-Refactor-Plan.md` §3 PR-2:
 *   - "one-frame flicker where defaults show before stored values
 *     hydrate"
 *   - migration races where a Zustand store rehydrates from a stale
 *     legacy key before the migration runs.
 *
 * Rendering nothing during the wait is intentional: the legacy app
 * already had a similar gap (defaults visible for one paint before the
 * mount-time `useEffect` ran localStorage reads), and the migration
 * completes synchronously in a single tick.
 */

import { useEffect, useState } from "react";
import { migrateLegacyLocalStorage } from "@/lib/store/migrate-legacy-localstorage";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useIntegrationsStore } from "@/lib/store/integrations-store";
import { useTemplatesStore } from "@/lib/store/templates-store";

interface HydrationGateProps {
  children: React.ReactNode;
}

export function HydrationGate({ children }: HydrationGateProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Step 1 — run migration synchronously. The function early-returns
    // on subsequent mounts via the `aiwp-migrated-v1` flag.
    migrateLegacyLocalStorage();

    // Step 2 — kick off rehydration on every persisted store. `rehydrate`
    // returns a Promise that resolves when the value has been merged.
    const promises: Array<Promise<unknown>> = [];
    const settingsRehydrate = useSettingsStore.persist.rehydrate();
    if (settingsRehydrate) promises.push(settingsRehydrate);
    const integrationsRehydrate = useIntegrationsStore.persist.rehydrate();
    if (integrationsRehydrate) promises.push(integrationsRehydrate);
    const templatesRehydrate = useTemplatesStore.persist.rehydrate();
    if (templatesRehydrate) promises.push(templatesRehydrate);

    Promise.all(promises)
      .catch(() => {
        // Rehydration failure is non-fatal — the stores keep their
        // default values and the user can re-enter settings. We still
        // release the gate so the app is usable.
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!hydrated) return null;
  return <>{children}</>;
}
