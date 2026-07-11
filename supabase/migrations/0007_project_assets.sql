-- 0007: Project asset uploads (2026-07-12, user request).
--
-- Users upload their own photos/logos for the sites they generate
-- (ADR-003 locked Supabase Storage; the user-facing feature was not
-- yet scheduled). Public bucket: generated sites embed these URLs and
-- must keep working when deployed to Vercel, so links cannot expire —
-- signed URLs are wrong here. Paths are namespaced userId/projectId/
-- and write/list/delete are owner-only via storage RLS.
--
-- 10 MB per file, images only (enforced bucket-side in addition to
-- the client checks).
--
-- NOTE: deleting a project does not yet garbage-collect its assets;
-- acceptable at current scale (revisit with ADR-003's >100GB clause).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  true,
  10485760,
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do nothing;

create policy "project_assets_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_assets_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_assets_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
