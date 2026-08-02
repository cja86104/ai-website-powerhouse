"use client";

/**
 * SandpackReactPreview — live, in-browser bundled preview for
 * React/Vite projects (W6, ADR-004: Sandpack over WebContainers for
 * its MIT license and zero cross-origin-isolation requirements).
 *
 * Reads `generatedFiles` from the store and feeds them to Sandpack's
 * vite-react template. The template supplies anything the model
 * omitted (defensive; the W5 scaffold backstop should mean it rarely
 * has to). Files re-bundle automatically when a chat-modify round
 * lands — that IS the W6 hot-reload requirement.
 *
 * Error posture (W6 Thu): generated projects are barred from adding
 * dependencies and the scaffold pins react/react-dom, so unresolvable
 * imports are rare; when a project does break, Sandpack's own error
 * overlay explains it inside the preview frame, and the wrapping
 * ErrorBoundary (applied at the PreviewPanel call site) keeps a
 * Sandpack crash from taking the app down.
 *
 * The generated index.html (with the Tailwind CDN script) is passed
 * through so previews are styled identically to a real `npm run dev`.
 */

import { memo, useMemo } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { useUiStore } from "@/lib/store/ui-store";
import { appendSlotBadges } from "@/lib/preview/slot-badges";

/**
 * Files the PREVIEW must not override (2026-07-12, second fix for the
 * user-reported dead preview): Sandpack's runtime executes the dev
 * server IN THE BROWSER with its own known-good toolchain pins.
 * Feeding it OUR package.json / vite.config.js replaced those pins
 * with versions tuned for real machines (vite ^5.4), which the
 * in-browser runtime cannot reliably run ("Cannot find module
 * 'esbuild-wasm'" and friends). The preview now overrides ONLY the
 * app files (src/, index.html — the Tailwind CDN ride-along) and
 * lets the template supply the toolchain. ZIP downloads still get
 * the real pins from the scaffold; the preview never needed them.
 * Generated projects are barred from adding dependencies (prompt
 * contract), so the template's react/react-dom always suffice.
 */
const PREVIEW_EXCLUDED_FILES = new Set(["package.json", "vite.config.js"]);

/** Sandpack wants absolute-style paths; our store keeps them relative. */
function toSandpackFiles(
  files: { name: string; content: string }[],
  withSlotBadges: boolean,
): Record<string, { code: string }> {
  const map: Record<string, { code: string }> = {};
  for (const file of files) {
    if (PREVIEW_EXCLUDED_FILES.has(file.name)) continue;
    // Numbered image-spot badges (2026-07-12): appended to the
    // PREVIEW's copy of the entry module — editing the entry forces a
    // full reload so the toggle takes effect immediately (index.html
    // is never re-served by the running dev server). Saved files stay
    // clean.
    const code =
      withSlotBadges && file.name === "src/main.jsx"
        ? appendSlotBadges(file.content)
        : file.content;
    map[`/${file.name}`] = { code };
  }
  return map;
}

/**
 * Base quality-pack dependencies every react-vite preview gets.
 * "@supabase/supabase-js" is deliberately NOT here — see the
 * customSetup below for why it's added conditionally instead.
 */
const BASE_DEPENDENCIES: Record<string, string> = {
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "@hookform/resolvers": "^5.5.0",
  "@tanstack/react-query": "^5.101.0",
  "date-fns": "^4.4.0",
  "framer-motion": "^11.0.0",
  "lucide-react": "^0.553.0",
  "react-hook-form": "^7.83.0",
  "react-markdown": "^10.1.0",
  "react-router-dom": "^6.26.0",
  "recharts": "^3.10.0",
  "zod": "^4.4.0",
  "zustand": "^5.0.14",
};

/** Must match lib/supabase-connect/actions.ts's saved connection version. */
const SUPABASE_JS_VERSION = "^2.110.1";

/** Stripe quality-pack versions (2026-08-01, Connect Your Stripe item 3). */
const STRIPE_JS_VERSION = "^9.12.1";
const REACT_STRIPE_JS_VERSION = "^6.8.0";

export const SandpackReactPreview = memo(function SandpackReactPreview() {
  const generatedFiles = useGenerationStore((s) => s.generatedFiles);
  const showImageSlots = useUiStore((s) => s.showImageSlots);
  const projectId = useGenerationStore((s) => s.projectId);
  // 2026-07-31 (Connect Your Supabase item 3): unlike every other
  // package above, "@supabase/supabase-js" is only useful — and only
  // meant to be imported — when this project actually has a saved
  // connection (lib/prompts/supabase-block.ts gates the model on the
  // same signal). Reading it live here means the preview picks it up
  // the moment SupabaseConnectSection saves a connection, no reload
  // needed, the same as the ChipRow/SystemStatusList wiring.
  const supabaseConnected = useGenerationStore((s) => s.supabaseConnected);
  // 2026-08-01 (Connect Your Stripe item 3): same live-toggle reasoning
  // as supabaseConnected above — Stripe's UI packages only matter once
  // this project has a saved publishable key.
  const stripeConnected = useGenerationStore((s) => s.stripeConnected);

  const files = useMemo(
    () => toSandpackFiles(generatedFiles, showImageSlots),
    [generatedFiles, showImageSlots],
  );

  const dependencies = useMemo(() => {
    let deps = BASE_DEPENDENCIES;
    if (supabaseConnected) {
      deps = { ...deps, "@supabase/supabase-js": SUPABASE_JS_VERSION };
    }
    if (stripeConnected) {
      deps = {
        ...deps,
        "@stripe/stripe-js": STRIPE_JS_VERSION,
        "@stripe/react-stripe-js": REACT_STRIPE_JS_VERSION,
      };
    }
    return deps;
  }, [supabaseConnected, stripeConnected]);

  if (generatedFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-green-300">
        Generate a project to see the live preview
      </div>
    );
  }

  return (
    // aiwp-sandpack (2026-07-19 layout fix): Sandpack sizes its internal
    // stacks to --sp-layout-height (~300px default), not the parent, so
    // the live preview rendered at half the panel. The globals.css rules
    // scoped to this class force the full internal chain to 100%.
    <div className="aiwp-sandpack h-full">
      <SandpackProvider
        // key (2026-07-14, user-reported: preview showed a DIFFERENT
        // previously-built site while the file browser was correct):
        // Sandpack hot-reloads file edits fine within one provider
        // instance (that's the modify-with-chat path, verified
        // working), but nothing forces it to tear down its internal
        // bundler/iframe state when the underlying project itself
        // changes — it can keep serving a stale bundle from whatever it
        // built earlier. Keying on projectId forces a full remount
        // whenever the actual project changes, while edits within the
        // same project (same id) keep using the fast hot-reload path.
        // Also keyed on supabaseConnected (2026-07-31) and stripeConnected
        // (2026-08-01): customSetup dependencies are only read by
        // Sandpack on mount/key-change, so connecting/disconnecting
        // Supabase or Stripe mid-session — without switching projects —
        // needs the same forced remount to pick up (or drop) their
        // packages.
        key={`${projectId ?? "no-project"}-${supabaseConnected ? "sb" : "nosb"}-${stripeConnected ? "st" : "nost"}`}
        template="vite-react"
        files={files}
        theme="dark"
        // Quality-pack runtime deps (2026-07-12, expanded 2026-07-31):
        // merged into the TEMPLATE's dependency set — unlike overriding
        // package.json, this cannot replace the toolchain that broke
        // under vite 5. Must match the scaffold's package.json versions.
        // "@supabase/supabase-js" and the Stripe pair ride along ONLY
        // for connected projects — see the `dependencies` useMemo above.
        customSetup={{
          dependencies,
        }}
        options={{
          // Re-init the provider when the file set changes shape so
          // deleted files don't linger in the bundler's memory.
          activeFile: "/src/App.jsx",
        }}
        style={{ height: "100%" }}
      >
        <SandpackLayout style={{ height: "100%", border: "none" }}>
          <SandpackPreview
            style={{ height: "100%" }}
            showOpenInCodeSandbox={false}
            showRefreshButton
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
});
