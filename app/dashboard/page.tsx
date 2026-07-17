/**
 * /dashboard — the multi-project list (W7 Mon). Server component:
 * active projects up top, archived history below (everything the
 * "New Project" button ever put away). Click-through opens the
 * project in the builder via /p/[projectId], which un-archives it.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/projects/actions";
import { RenameProjectButton } from "@/components/dashboard/RenameProjectButton";
import { DeleteProjectButton } from "@/components/dashboard/DeleteProjectButton";

export const dynamic = "force-dynamic";

function ProjectCard({
  id,
  name,
  framework,
  updatedAt,
  archived,
}: {
  id: string;
  name: string;
  framework: string;
  updatedAt: string;
  archived: boolean;
}) {
  return (
    <Link
      href={`/p/${id}`}
      className={`block rounded-2xl border p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        archived
          ? "border-purple-500/20 bg-purple-500/5 opacity-80"
          : "border-orange-500/30 bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-orange-100">{name}</h3>
        <RenameProjectButton projectId={id} currentName={name} />
        <DeleteProjectButton projectId={id} currentName={name} />
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
            framework === "react-vite"
              ? "bg-cyan-500/20 text-cyan-300"
              : "bg-orange-500/20 text-orange-300"
          }`}
        >
          {framework === "react-vite" ? "React + Vite" : "HTML"}
        </span>
      </div>
      <p className="mt-2 text-sm text-orange-200/60">
        Updated {new Date(updatedAt).toLocaleDateString()}
        {archived ? " · archived" : ""}
      </p>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    redirect("/sign-in");
  }

  const projects = await listProjects();
  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6b35] to-[#f7931e] bg-clip-text text-transparent">
            My Projects
          </h1>
          <Link
            href="/"
            className="py-2 px-5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Open Builder
          </Link>
        </div>

        {active.length === 0 && archived.length === 0 ? (
          <p className="text-orange-200/70">
            No projects yet — open the builder and generate your first
            website.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {active.map((p) => (
                <ProjectCard key={p.id} {...p} />
              ))}
            </div>

            {archived.length > 0 && (
              <>
                <h2 className="mt-10 mb-4 text-lg font-semibold text-purple-200">
                  History{" "}
                  <span className="text-sm font-normal text-purple-300/60">
                    — projects you set aside; opening one restores it
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {archived.map((p) => (
                    <ProjectCard key={p.id} {...p} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
