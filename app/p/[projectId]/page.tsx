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
  return <Builder initialProjectId={projectId} />;
}
