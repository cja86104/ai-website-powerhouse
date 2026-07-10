"use server";

/**
 * AI Website Powerhouse — workspace persistence server actions (W2 Fri).
 *
 * Replaces the localStorage autosave/restore flow. Work is persisted
 * at each COMPLETED generation as real relational rows:
 *
 *   generations      one row per generate/modify round
 *   project_files    immutable per-generation file snapshots
 *   messages         the chat thread, linked to its generation
 *
 * All reads/writes go through the user's RLS-scoped server client —
 * the service-role key is never involved here. The W5 pipeline
 * (React/Vite trees, token counts, cost) extends these same tables;
 * nothing here is throwaway.
 *
 * V1 project model: one implicit project per user, created on first
 * load ("My First Website"). The multi-project dashboard arrives in
 * W7 per the sprint plan.
 */

import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { GeneratedFile } from "@/lib/generation/types";
import { serializeProjectFiles } from "@/lib/generation/project-parser";

/** Frameworks the V1 UI exposes (schema also reserves 'next' for LATER+). */
export type ProjectFramework = "react-vite" | "html";

/** Chat message shape shared with the client stores. */
export interface WorkspaceMessage {
  role: "user" | "assistant";
  content: string;
  /** Set when the message was a file-scoped modify request (W8). */
  scopedFilePath?: string | null;
}

/** Everything the builder needs to resume where the user left off. */
export interface WorkspacePayload {
  projectId: string;
  projectName: string;
  /** The project's output framework (W5). */
  framework: ProjectFramework;
  /** Latest complete generation's files; empty on a fresh project. */
  files: GeneratedFile[];
  /** Reconstructed raw buffer (FILE-marker join); empty on fresh. */
  generatedCode: string;
  /** Persisted chat thread, oldest first. */
  chatHistory: WorkspaceMessage[];
  /** Latest complete generation id (parent for the next modify). */
  latestGenerationId: string | null;
}

/** Inputs persisted after a completed generation round. */
export interface PersistGenerationInput {
  projectId: string;
  kind: "initial" | "modify";
  prompt: string;
  provider: "ollama" | "openrouter";
  model: string;
  usedByoKey: boolean;
  parentGenerationId: string | null;
  files: GeneratedFile[];
  /** Chat messages added THIS round (not the whole thread). */
  newMessages: WorkspaceMessage[];
}

/**
 * Rebuild a raw text buffer from parsed files using the same
 * FILE-marker format the models emit, so the modify prompt sees
 * semantically identical context after a reload. Single-file
 * projects reload as bare content (markers optional per the format).
 */
function joinFiles(
  files: GeneratedFile[],
  framework: ProjectFramework,
): string {
  if (files.length === 0) return "";
  if (framework === "react-vite") {
    // AIWP marker format — what the React modify prompt expects (W5).
    return serializeProjectFiles(files);
  }
  if (files.length === 1) return files[0].content;
  return files
    .map((f) => `<!-- FILE: ${f.name} -->\n${f.content}`)
    .join("\n\n");
}

/** Summary row for the dashboard project list (W7). */
export interface ProjectSummary {
  id: string;
  name: string;
  framework: ProjectFramework;
  archived: boolean;
  updatedAt: string;
}

/** All of the user's projects, newest first, archived included (W7). */
export async function listProjects(): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, framework, archived, updated_at")
    .order("updated_at", { ascending: false });
  if (error !== null) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    framework: row.framework === "react-vite" ? "react-vite" : "html",
    archived: row.archived as boolean,
    updatedAt: row.updated_at as string,
  }));
}

/**
 * Load (and on first visit, create) the user's workspace: their
 * project, the latest complete generation's files, and the chat
 * thread. Throws when called without a session — the middleware
 * gate makes that unreachable in normal flows.
 */
export async function loadWorkspace(
  requestedProjectId?: string,
): Promise<WorkspacePayload> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("loadWorkspace requires a signed-in user.");
  }

  // W7: an explicit project id (from /p/[projectId]) wins; opening an
  // archived project un-archives it — "open" means "make active".
  // RLS guarantees the row belongs to the caller.
  if (requestedProjectId !== undefined) {
    const { data: requested, error: requestedError } = await supabase
      .from("projects")
      .select("id, name, framework, archived")
      .eq("id", requestedProjectId)
      .maybeSingle();
    if (requestedError !== null) {
      throw new Error(`Failed to open project: ${requestedError.message}`);
    }
    if (requested === null) {
      throw new Error("Project not found.");
    }
    if (requested.archived === true) {
      await supabase
        .from("projects")
        .update({ archived: false })
        .eq("id", requestedProjectId);
    }
    return loadWorkspaceForProject(
      supabase,
      requested.id as string,
      requested.name as string,
      requested.framework === "react-vite" ? "react-vite" : "html",
    );
  }

  // Fetch-or-create the implicit project (newest non-archived).
  const { data: existing, error: projectError } = await supabase
    .from("projects")
    .select("id, name, framework")
    .eq("archived", false)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (projectError !== null) {
    throw new Error(`Failed to load project: ${projectError.message}`);
  }

  let projectId: string;
  let projectName: string;
  let framework: ProjectFramework;
  if (existing !== null && existing.length > 0) {
    projectId = existing[0].id as string;
    projectName = existing[0].name as string;
    framework =
      existing[0].framework === "react-vite" ? "react-vite" : "html";
  } else {
    // New projects default to React + Vite (Section 5 §3) since W5.
    const { data: created, error: createError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: "My First Website",
        framework: "react-vite",
      })
      .select("id, name")
      .single();
    if (createError !== null) {
      throw new Error(`Failed to create project: ${createError.message}`);
    }
    projectId = created.id as string;
    projectName = created.name as string;
    framework = "react-vite";
  }

  return loadWorkspaceForProject(supabase, projectId, projectName, framework);
}

/**
 * Shared tail of loadWorkspace (W7): given a resolved project, load
 * its latest complete generation's files and the chat thread.
 */
async function loadWorkspaceForProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  projectName: string,
  framework: ProjectFramework,
): Promise<WorkspacePayload> {
  // Latest complete generation, if any.
  const { data: generations, error: genError } = await supabase
    .from("generations")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1);
  if (genError !== null) {
    throw new Error(`Failed to load generations: ${genError.message}`);
  }

  let files: GeneratedFile[] = [];
  let latestGenerationId: string | null = null;
  if (generations !== null && generations.length > 0) {
    latestGenerationId = generations[0].id as string;
    const { data: fileRows, error: filesError } = await supabase
      .from("project_files")
      .select("path, content")
      .eq("generation_id", latestGenerationId)
      .order("created_at", { ascending: true });
    if (filesError !== null) {
      throw new Error(`Failed to load files: ${filesError.message}`);
    }
    files = (fileRows ?? []).map((row) => ({
      name: row.path as string,
      content: row.content as string,
    }));
  }

  const { data: messageRows, error: messagesError } = await supabase
    .from("messages")
    .select("role, content")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (messagesError !== null) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }
  const chatHistory: WorkspaceMessage[] = (messageRows ?? [])
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({
      role: row.role as "user" | "assistant",
      content: row.content as string,
    }));

  return {
    projectId,
    projectName,
    framework,
    files,
    generatedCode: joinFiles(files, framework),
    chatHistory,
    latestGenerationId,
  };
}

/**
 * Start a fresh project (W5 UX follow-up): the current project is
 * ARCHIVED, not deleted — it disappears from the workspace but keeps
 * all generations/files/messages, and resurfaces as history when the
 * W7 multi-project dashboard lands. A new react-vite project becomes
 * the active workspace.
 */
export async function startNewProject(
  currentProjectId: string | null,
): Promise<{ projectId: string; projectName: string; framework: ProjectFramework }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("startNewProject requires a signed-in user.");
  }

  if (currentProjectId !== null) {
    const { error: archiveError } = await supabase
      .from("projects")
      .update({ archived: true })
      .eq("id", currentProjectId);
    if (archiveError !== null) {
      throw new Error(`Failed to archive project: ${archiveError.message}`);
    }
  }

  const name = `Website — ${new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
  const { data: created, error: createError } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name, framework: "react-vite" })
    .select("id, name")
    .single();
  if (createError !== null) {
    throw new Error(`Failed to create project: ${createError.message}`);
  }
  return {
    projectId: created.id as string,
    projectName: created.name as string,
    framework: "react-vite",
  };
}

/**
 * Update the active project's output framework (W5 Thu toggle). The
 * next generation uses the new mode; existing snapshots are untouched.
 */
export async function setProjectFramework(
  projectId: string,
  framework: ProjectFramework,
): Promise<void> {
  if (framework !== "react-vite" && framework !== "html") {
    throw new Error(`Unknown framework: ${String(framework)}`);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("setProjectFramework requires a signed-in user.");
  }
  const { error } = await supabase
    .from("projects")
    .update({ framework })
    .eq("id", projectId);
  if (error !== null) {
    throw new Error(`Failed to update framework: ${error.message}`);
  }
}

/**
 * Persist one completed generation round: the generations row, a
 * project_files snapshot, and any chat messages from this round.
 * Returns the new generation id (the parent for the next modify).
 *
 * Failure surfaces as a thrown Error — the builder shows it in the
 * chat thread but keeps the in-memory work intact, so a transient
 * network problem never destroys the user's result.
 */
export async function persistGeneration(
  input: PersistGenerationInput,
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("persistGeneration requires a signed-in user.");
  }
  if (input.files.length === 0) {
    throw new Error("persistGeneration requires at least one file.");
  }
  if (input.prompt.length === 0) {
    throw new Error("persistGeneration requires the round's prompt.");
  }

  // A fresh initial generation starts a new site: clear the previous
  // chat thread so the persisted state matches what the user sees
  // (handleGenerate resets the on-screen thread the same way).
  if (input.kind === "initial") {
    const { error: clearError } = await supabase
      .from("messages")
      .delete()
      .eq("project_id", input.projectId);
    if (clearError !== null) {
      throw new Error(`Failed to reset chat thread: ${clearError.message}`);
    }
  }

  const { data: generation, error: genError } = await supabase
    .from("generations")
    .insert({
      project_id: input.projectId,
      user_id: user.id,
      parent_generation_id: input.parentGenerationId,
      kind: input.kind,
      prompt: input.prompt,
      provider: input.provider,
      model: input.model,
      used_byo_key: input.usedByoKey,
      status: "complete",
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (genError !== null) {
    throw new Error(`Failed to record generation: ${genError.message}`);
  }
  const generationId = generation.id as string;

  const fileRows = input.files.map((file) => ({
    project_id: input.projectId,
    generation_id: generationId,
    path: file.name,
    content: file.content,
    content_sha256: createHash("sha256").update(file.content).digest("hex"),
    size_bytes: Buffer.byteLength(file.content, "utf8"),
  }));
  const { error: filesError } = await supabase
    .from("project_files")
    .insert(fileRows);
  if (filesError !== null) {
    throw new Error(`Failed to store files: ${filesError.message}`);
  }

  if (input.newMessages.length > 0) {
    const messageRows = input.newMessages.map((message) => ({
      project_id: input.projectId,
      user_id: user.id,
      role: message.role,
      content: message.content,
      scoped_file_path: message.scopedFilePath ?? null,
      generation_id: generationId,
    }));
    const { error: messagesError } = await supabase
      .from("messages")
      .insert(messageRows);
    if (messagesError !== null) {
      throw new Error(`Failed to store messages: ${messagesError.message}`);
    }
  }

  return generationId;
}

/** One row in the project's version history (W7 Wed). */
export interface GenerationSummary {
  id: string;
  kind: "initial" | "modify" | "restore";
  prompt: string;
  provider: string;
  model: string;
  parentGenerationId: string | null;
  createdAt: string;
}

/** Complete generations for a project, newest first (W7 Wed). */
export async function listGenerations(
  projectId: string,
): Promise<GenerationSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return [];

  const { data, error } = await supabase
    .from("generations")
    .select("id, kind, prompt, provider, model, parent_generation_id, created_at")
    .eq("project_id", projectId)
    .eq("status", "complete")
    .order("created_at", { ascending: false });
  if (error !== null) {
    throw new Error(`Failed to load history: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    kind:
      row.kind === "modify"
        ? "modify"
        : row.kind === "restore"
          ? "restore"
          : "initial",
    prompt: row.prompt as string,
    provider: row.provider as string,
    model: row.model as string,
    parentGenerationId: row.parent_generation_id as string | null,
    createdAt: row.created_at as string,
  }));
}

/** The file snapshot of one generation (W7 Wed — history view/restore). */
export async function loadGenerationFiles(
  generationId: string,
): Promise<GeneratedFile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_files")
    .select("path, content")
    .eq("generation_id", generationId)
    .order("created_at", { ascending: true });
  if (error !== null) {
    throw new Error(`Failed to load version files: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    name: row.path as string,
    content: row.content as string,
  }));
}

/**
 * Fork from a historical generation into a NEW project (W7 Thu).
 * The source stays untouched; the fork starts a fresh chain (kind
 * 'restore', no parent — chains stay project-scoped) seeded with the
 * source generation's files and prompt. Returns the new project id
 * for navigation.
 */
export async function forkFromGeneration(
  generationId: string,
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("forkFromGeneration requires a signed-in user.");
  }

  const { data: source, error: sourceError } = await supabase
    .from("generations")
    .select("id, project_id, prompt, provider, model, used_byo_key")
    .eq("id", generationId)
    .maybeSingle();
  if (sourceError !== null || source === null) {
    throw new Error("Source version not found.");
  }

  const { data: sourceProject, error: projectError } = await supabase
    .from("projects")
    .select("name, framework")
    .eq("id", source.project_id as string)
    .single();
  if (projectError !== null) {
    throw new Error(`Failed to load source project: ${projectError.message}`);
  }

  const files = await loadGenerationFiles(generationId);
  if (files.length === 0) {
    throw new Error("That version has no files to fork.");
  }

  const { data: newProject, error: createError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: `Fork of ${sourceProject.name as string}`,
      framework: sourceProject.framework as string,
    })
    .select("id")
    .single();
  if (createError !== null) {
    throw new Error(`Failed to create fork: ${createError.message}`);
  }
  const newProjectId = newProject.id as string;

  const { data: newGeneration, error: genError } = await supabase
    .from("generations")
    .insert({
      project_id: newProjectId,
      user_id: user.id,
      parent_generation_id: null,
      kind: "restore",
      prompt: source.prompt as string,
      provider: source.provider as string,
      model: source.model as string,
      used_byo_key: source.used_byo_key as boolean,
      status: "complete",
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (genError !== null) {
    throw new Error(`Failed to seed fork: ${genError.message}`);
  }

  const fileRows = files.map((file) => ({
    project_id: newProjectId,
    generation_id: newGeneration.id as string,
    path: file.name,
    content: file.content,
    content_sha256: createHash("sha256").update(file.content).digest("hex"),
    size_bytes: Buffer.byteLength(file.content, "utf8"),
  }));
  const { error: filesError } = await supabase
    .from("project_files")
    .insert(fileRows);
  if (filesError !== null) {
    throw new Error(`Failed to copy files into fork: ${filesError.message}`);
  }

  return newProjectId;
}
