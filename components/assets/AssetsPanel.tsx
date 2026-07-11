"use client";

/**
 * AssetsPanel — "Your Images" for the current project (2026-07-12,
 * user request). Collapsible card in the left column: upload photos/
 * logos, see thumbnails, copy a URL, delete. Every change also lands
 * in the generation store so the very next Generate/chat request
 * hands the model the real image URLs (see Builder's prompt notes).
 *
 * Uploads run browser -> Supabase Storage directly (see
 * lib/assets/client.ts for why). All hooks before any conditional
 * return — hooks-order rule per Section 6 §6.
 */

import { memo, useCallback, useRef, useState } from "react";
import { Copy, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useGenerationStore } from "@/lib/store/generation-store";
import {
  deleteProjectAsset,
  listProjectAssets,
  uploadProjectAsset,
} from "@/lib/assets/client";

export const AssetsPanel = memo(function AssetsPanel() {
  const projectId = useGenerationStore((s) => s.projectId);
  const assets = useGenerationStore((s) => s.assets);
  const setAssets = useGenerationStore((s) => s.setAssets);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    if (projectId === null) return;
    try {
      setAssets(await listProjectAssets(projectId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [projectId, setAssets]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) void refresh();
      return next;
    });
  }, [refresh]);

  const handleFilesChosen = useCallback(
    async (fileList: FileList | null) => {
      if (projectId === null || fileList === null || fileList.length === 0) {
        return;
      }
      setBusy(true);
      setError(null);
      try {
        for (const file of Array.from(fileList)) {
          await uploadProjectAsset(projectId, file);
        }
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
        if (fileInputRef.current !== null) fileInputRef.current.value = "";
      }
    },
    [projectId, refresh],
  );

  const handleDelete = useCallback(
    async (name: string) => {
      if (projectId === null) return;
      if (!confirm("Delete this image? Sites already using its URL will lose it.")) {
        return;
      }
      setBusy(true);
      try {
        await deleteProjectAsset(projectId, name);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [projectId, refresh],
  );

  const handleCopy = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
  }, []);

  if (projectId === null) return null;

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-cyan-500/30 shadow-2xl">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-6 py-3 text-cyan-100 font-semibold"
      >
        <span className="flex items-center gap-2">
          <ImagePlus className="w-5 h-5" />
          Your Images
          {assets.length > 0 && (
            <span className="text-xs text-cyan-300/60">({assets.length})</span>
          )}
        </span>
        <span className="text-xs text-cyan-300/60">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-cyan-200/60">
            Upload your own photos and logos — the AI will use them in
            your website instead of placeholders.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFilesChosen(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="w-full py-2 px-4 rounded-lg border border-dashed border-cyan-500/40 text-cyan-200 text-sm hover:bg-cyan-500/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            {busy ? "Working…" : "Upload images (max 10 MB each)"}
          </button>
          {error !== null && <p className="text-sm text-red-300">{error}</p>}
          {assets.length > 0 && (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
              {assets.map((asset) => (
                <div
                  key={asset.name}
                  className="relative group rounded-lg overflow-hidden border border-cyan-500/20 bg-[#1a1a2e]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote
                      user-uploaded storage URLs; next/image would require
                      remotePatterns config per Supabase project */}
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-20 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopy(asset.url)}
                      title="Copy image URL"
                      className="p-1.5 rounded bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-100"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => void handleDelete(asset.name)}
                      title="Delete image"
                      className="p-1.5 rounded bg-red-500/30 hover:bg-red-500/50 text-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
