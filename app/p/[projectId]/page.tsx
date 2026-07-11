/**
 * /p/[projectId] — open a specific project in the builder (W7 Tue).
 * The id flows into loadWorkspace, which verifies ownership via RLS
 * and un-archives the project on open. Invalid ids surface through
 * the builder's workspace-load error path.
 */

import Builder from "@/components/Builder";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  // key: navigating /p/A -> /p/B reuses the same tree position, so
  // without a key React keeps the Builder instance and its mount-time
  // workspace load never re-runs (2026-07-12 user-reported stale-chat
  // bug). The key forces a full remount per project.
  return <Builder key={projectId} initialProjectId={projectId} />;
}
