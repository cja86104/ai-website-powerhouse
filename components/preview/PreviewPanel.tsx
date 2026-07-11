"use client";

/**
 * PreviewPanel — right-column preview surface.
 *
 * Fully self-contained: reads `selectedFile`, `generatedFiles`,
 * `previewMode` from Zustand and owns its own iframe ref +
 * mode toggle. No props.
 *
 * The `shouldShowLivePreview` decision and the
 * `getCombinedPreviewContent` HTML assembly (external-CSS strip,
 * template-literal placeholder substitution, sibling CSS/JS
 * injection) are lifted verbatim from the legacy main component
 * so preview behavior is byte-identical to today.
 *
 * Since W6, React/Vite projects render live via Sandpack
 * (SandpackReactPreview); the legacy `srcDoc` iframe remains the
 * live path for 'html' projects — the W6 Wed framework-gated
 * fallback.
 *
 * Extracted from `components/AIWebsitePowerhouse.js` in W1 PR-3.
 */

import { memo, useCallback, useMemo, useRef } from "react";
import { Download, Eye } from "lucide-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { SandpackReactPreview } from "@/components/preview/SandpackReactPreview";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useUiStore } from "@/lib/store/ui-store";
import { downloadFile } from "@/lib/utils/download";
import { injectSlotBadges } from "@/lib/preview/slot-badges";
import type { PreviewMode } from "@/lib/store/ui-store";

/** Cycles Auto → Code → Live → Auto. */
function nextPreviewMode(current: PreviewMode): PreviewMode {
  if (current === "auto") return "code";
  if (current === "code") return "live";
  return "auto";
}

export const PreviewPanel = memo(function PreviewPanel() {
  const selectedFile = useGenerationStore((s) => s.selectedFile);
  const generatedFiles = useGenerationStore((s) => s.generatedFiles);
  const framework = useGenerationStore((s) => s.framework);
  const previewMode = useUiStore((s) => s.previewMode);
  const setPreviewMode = useUiStore((s) => s.setPreviewMode);
  const showImageSlots = useUiStore((s) => s.showImageSlots);
  const setShowImageSlots = useUiStore((s) => s.setShowImageSlots);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const shouldShowLivePreview = useCallback((): boolean => {
    // React projects render via Sandpack (W6) in every mode but
    // explicit Code view; Auto means Live for them.
    if (framework === "react-vite") return previewMode !== "code";
    if (previewMode === "code") return false;
    if (previewMode === "live") return true;
    return selectedFile?.name.endsWith(".html") ?? false;
  }, [framework, previewMode, selectedFile]);

  const getCombinedPreviewContent = useCallback((): string => {
    const htmlFile = generatedFiles.find((f) => f.name.endsWith(".html"));
    if (!htmlFile) return selectedFile?.content ?? "";

    let content = htmlFile.content;

    // Strip external CSS links that would fail in the sandboxed iframe
    // (keep CDN/http links).
    content = content.replace(
      /<link[^>]*href=["'](?!https?:\/\/)[^"']*\.css["'][^>]*\/?>/gi,
      "",
    );

    // Strip external JS script tags that would fail in the sandboxed
    // iframe (keep CDN/http links).
    content = content.replace(
      /<script[^>]*src=["'](?!https?:\/\/)[^"']*\.js["'][^>]*><\/script>/gi,
      "",
    );

    // Substitute unresolved template literals like `${item.image}` with
    // placeholder image URLs, then fall back to a generic placeholder
    // for any other `${...}` expression the model left in.
    content = content.replace(
      /\$\{[^}]*image[^}]*\}/gi,
      "https://placehold.co/400x300?text=Image",
    );
    content = content.replace(/\$\{[^}]*\}/g, "Placeholder");

    // Inject sibling CSS from generated files.
    const cssFile = generatedFiles.find((f) => f.name.endsWith(".css"));
    if (cssFile) {
      content = content.replace(
        "</head>",
        `<style>\n${cssFile.content}\n</style>\n</head>`,
      );
    }

    // Inject sibling JS from generated files.
    const jsFile = generatedFiles.find((f) => f.name.endsWith(".js"));
    if (jsFile) {
      content = content.replace(
        "</body>",
        `<script>\n${jsFile.content}\n</script>\n</body>`,
      );
    }

    return content;
  }, [generatedFiles, selectedFile]);

  const previewContent = useMemo(() => {
    if (!selectedFile) return "";
    if (previewMode === "live" && shouldShowLivePreview()) {
      const combined = getCombinedPreviewContent();
      // Numbered image-spot badges (2026-07-12) — preview only; the
      // saved/deployed files never contain the overlay script.
      return showImageSlots ? injectSlotBadges(combined) : combined;
    }
    return selectedFile.content;
  }, [
    selectedFile,
    previewMode,
    shouldShowLivePreview,
    getCombinedPreviewContent,
    showImageSlots,
  ]);

  const handleTogglePreview = () => {
    setPreviewMode(nextPreviewMode);
  };

  const handleDownloadFile = () => {
    if (selectedFile) downloadFile(selectedFile);
  };

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-green-500/30 shadow-2xl p-6 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-green-100 flex items-center gap-2">
          <Eye className="w-6 h-6" />
          Preview
        </h2>
        {selectedFile && (
          <div className="flex gap-2">
            <button
              onClick={handleTogglePreview}
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm font-medium"
            >
              {previewMode === "auto" ? "Auto" : previewMode === "code" ? "Code" : "Live"}
            </button>
            <button
              onClick={() => setShowImageSlots(!showImageSlots)}
              title="Show numbered badges on every image spot, so you can say 'put my photo in spot 3'"
              className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                showImageSlots
                  ? "bg-violet-500/40 text-violet-100"
                  : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300"
              }`}
            >
              Spots
            </button>
            <button
              onClick={handleDownloadFile}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        )}
      </div>

      {selectedFile ? (
        <div className="flex-1 overflow-hidden rounded-lg border border-green-500/20 min-h-0">
          {framework === "react-vite" && shouldShowLivePreview() ? (
            <ErrorBoundary>
              <SandpackReactPreview />
            </ErrorBoundary>
          ) : previewMode === "live" && shouldShowLivePreview() ? (
            <iframe
              ref={iframeRef}
              srcDoc={previewContent}
              className="w-full h-full bg-white"
              title="Preview"
              sandbox="allow-scripts"
            />
          ) : (
            <pre className="h-full overflow-auto p-4 bg-[#1a1a2e] text-green-100 text-sm font-mono">
              {previewContent}
            </pre>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-green-300">
          Select a file to preview
        </div>
      )}
    </div>
  );
});
