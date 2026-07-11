"use client";

/**
 * Project asset uploads — browser-side helpers (2026-07-12, user
 * request; storage per ADR-003).
 *
 * Uploads go DIRECTLY from the browser to Supabase Storage under the
 * user's RLS-scoped path (userId/projectId/filename) — never through
 * a server action, whose body-size limits are wrong for photos. The
 * bucket is public: generated sites embed these URLs and must keep
 * working on the live deployed site, so links cannot expire.
 *
 * The returned public URLs are what the generation prompts hand to
 * the model (see Builder) — "use these real images" beats a page of
 * placeholder stock photos.
 */

import { createClient } from "@/lib/supabase/client";

/** One uploaded image belonging to the current project. */
export interface ProjectAsset {
  /** Display name (the sanitized file name). */
  name: string;
  /** Stable public URL — safe to embed in generated/deployed sites. */
  url: string;
}

const BUCKET = "project-assets";
/** Client-side ceiling; the bucket enforces the same limit server-side. */
export const MAX_ASSET_BYTES = 10 * 1024 * 1024;

/** Keeps storage keys URL-safe and collision-resistant. */
function sanitizeFileName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned : "image";
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to upload images.");
  }
  return user.id;
}

/** Uploads one image and returns its public URL entry. */
export async function uploadProjectAsset(
  projectId: string,
  file: File,
): Promise<ProjectAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image.`);
  }
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error(`${file.name} is larger than 10 MB.`);
  }
  const userId = await requireUserId();
  const supabase = createClient();
  const name = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const path = `${userId}/${projectId}/${name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error !== null) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { name, url: data.publicUrl };
}

/** Lists the current project's uploaded images (newest first). */
export async function listProjectAssets(
  projectId: string,
): Promise<ProjectAsset[]> {
  const userId = await requireUserId();
  const supabase = createClient();
  const prefix = `${userId}/${projectId}`;

  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error !== null) {
    throw new Error(`Could not load images: ${error.message}`);
  }
  return (data ?? [])
    .filter((entry) => entry.name.length > 0)
    .map((entry) => {
      const { data: pub } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(`${prefix}/${entry.name}`);
      return { name: entry.name, url: pub.publicUrl };
    });
}

/** Deletes one uploaded image by its display name. */
export async function deleteProjectAsset(
  projectId: string,
  name: string,
): Promise<void> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([`${userId}/${projectId}/${name}`]);
  if (error !== null) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
