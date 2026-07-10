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

/**
 * Sandpack's runtime executes Vite IN THE BROWSER, where native
 * esbuild cannot run — Vite needs the WebAssembly build. Projects
 * scaffolded before 2026-07-12 pin vite without `esbuild-wasm`, which
 * makes the in-browser dev server die with "Cannot find module
 * 'esbuild-wasm'". This patches the dependency into the PREVIEW's
 * copy of package.json only — the saved project files are untouched
 * (a real `npm run dev` neither needs nor misses it; new scaffolds
 * include it outright).
 */
function withEsbuildWasm(packageJson: string): string {
  try {
    const parsed = JSON.parse(packageJson) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    if (
      parsed.devDependencies?.["esbuild-wasm"] !== undefined ||
      parsed.dependencies?.["esbuild-wasm"] !== undefined
    ) {
      return packageJson;
    }
    parsed.devDependencies = {
      ...parsed.devDependencies,
      "esbuild-wasm": "^0.21.5",
    };
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Unparseable package.json — leave it for Sandpack's own overlay
    // to explain rather than masking the real problem here.
    return packageJson;
  }
}

/** Sandpack wants absolute-style paths; our store keeps them relative. */
function toSandpackFiles(
  files: { name: string; content: string }[],
): Record<string, { code: string }> {
  const map: Record<string, { code: string }> = {};
  for (const file of files) {
    map[`/${file.name}`] =
      file.name === "package.json"
        ? { code: withEsbuildWasm(file.content) }
        : { code: file.content };
  }
  return map;
}

export const SandpackReactPreview = memo(function SandpackReactPreview() {
  const generatedFiles = useGenerationStore((s) => s.generatedFiles);

  const files = useMemo(
    () => toSandpackFiles(generatedFiles),
    [generatedFiles],
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
