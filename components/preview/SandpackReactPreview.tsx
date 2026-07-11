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
import { injectSlotBadges } from "@/lib/preview/slot-badges";

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
    // Numbered image-spot badges (2026-07-12): injected into the
    // PREVIEW's copy of index.html only — saved files stay clean.
    const code =
      withSlotBadges && file.name === "index.html"
        ? injectSlotBadges(file.content)
        : file.content;
    map[`/${file.name}`] = { code };
  }
  return map;
}

export const SandpackReactPreview = memo(function SandpackReactPreview() {
  const generatedFiles = useGenerationStore((s) => s.generatedFiles);
  const showImageSlots = useUiStore((s) => s.showImageSlots);

  const files = useMemo(
    () => toSandpackFiles(generatedFiles, showImageSlots),
    [generatedFiles, showImageSlots],
  );

  if (generatedFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-green-300">
        Generate a project to see the live preview
      </div>
    );
  }

  return (
    <SandpackProvider
      template="vite-react"
      files={files}
      theme="dark"
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
  );
});
