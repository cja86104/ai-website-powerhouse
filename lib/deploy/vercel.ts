"use server";

/**
 * Vercel one-click deploy (W8 Tue-Thu, ADR-007).
 *
 * BYOK-consistent: deploys go to the USER'S Vercel account using
 * their own access token (stored AES-256-GCM encrypted in
 * `user_integrations.vercel_token_encrypted`, ADR-008). Unlike the
 * OpenRouter key — which the browser must hold to call the provider
 * directly — the Vercel token is decrypted ONLY server-side inside
 * these actions and is never returned to the client.
 *
 * Flow: `deployProjectToVercel` uploads the project's latest saved
 * file snapshot inline to Vercel's v13 deployments endpoint
 * (project auto-created by name; framework preset "vite" for
 * react-vite, static otherwise), records `projects.last_deploy_*`,
 * and returns the deployment id + URL. The client then polls
 * `getVercelDeploymentStatus` until READY/ERROR.
 */

import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto/secrets";

/** Result of a successfully created deployment (build may still run). */
export interface VercelDeployResult {
  deploymentId: string;
  /** Public deployment URL (live once the build is READY). */
  url: string;
}

/** Build status snapshot for polling. */
export interface VercelDeployStatus {
  readyState:
    | "QUEUED"
    | "BUILDING"
    | "INITIALIZING"
    | "READY"
    | "ERROR"
    | "CANCELED";
  url: string | null;
  errorMessage: string | null;
}

/** Vercel project names: lowercase, alphanumeric + hyphens, <=52 chars. */
function slugifyProjectName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52)
    .replace(/-+$/g, "");
  return slug.length > 0 ? slug : "aiwp-site";
}

/** Loads and decrypts the signed-in user's Vercel token, or throws. */
async function requireVercelToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to deploy.");
  }
  const { data, error } = await supabase
    .from("user_integrations")
    .select("vercel_token_encrypted")
    .eq("user_id", user.id)
    .single();
  if (error !== null || data === null) {
    throw new Error("Could not load your integration settings.");
  }
  const encrypted = data.vercel_token_encrypted as string | null;
  if (encrypted === null || encrypted.length === 0) {
    throw new Error(
      "No Vercel token saved. Add one in the Deploy dialog first.",
    );
  }
  try {
    return decryptSecret(encrypted);
  } catch {
    throw new Error(
      "Your saved Vercel token could not be read. Please re-enter it.",
    );
  }
}

/** Parses a Vercel API error body into an actionable message. */
async function vercelErrorMessage(response: Response): Promise<string> {
  let detail = `HTTP ${response.status}`;
  try {
    const body = (await response.json()) as {
      error?: { message?: string; code?: string };
    };
    if (typeof body.error?.message === "string") {
      detail = body.error.message;
    }
  } catch {
    // non-JSON body — keep the status line
  }
  if (response.status === 403) {
    return `Vercel rejected the token (${detail}). Check that the token is valid and has deploy access.`;
  }
  return `Vercel API error: ${detail}`;
}

/**
 * Deploys the project's latest saved snapshot to the user's Vercel
 * account as a production deployment. Returns the deployment id +
 * URL; the build runs asynchronously on Vercel's side.
 */
export async function deployProjectToVercel(
  projectId: string,
): Promise<VercelDeployResult> {
  const token = await requireVercelToken();
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("name, framework")
    .eq("id", projectId)
    .single();
  if (projectError !== null || project === null) {
    throw new Error("Project not found.");
  }

  const { data: latest, error: latestError } = await supabase
    .from("generations")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError !== null || latest === null) {
    throw new Error("Nothing to deploy yet — generate a website first.");
  }

  const { data: fileRows, error: filesError } = await supabase
    .from("project_files")
    .select("path, content")
    .eq("generation_id", latest.id as string);
  if (filesError !== null || fileRows === null || fileRows.length === 0) {
    throw new Error("The latest version has no files to deploy.");
  }

  const isReact = (project.framework as string) === "react-vite";
  const response = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: slugifyProjectName(project.name as string),
      target: "production",
      files: fileRows.map((row) => ({
        file: row.path as string,
        data: row.content as string,
        encoding: "utf-8",
      })),
      projectSettings: isReact ? { framework: "vite" } : { framework: null },
    }),
  });
  if (!response.ok) {
    throw new Error(await vercelErrorMessage(response));
  }
  const deployment = (await response.json()) as { id: string; url: string };
  const url = `https://${deployment.url}`;

  // Denormalized last-deploy info for the dashboard (0001 schema).
  // Best-effort: a failed bookkeeping write must not fail the deploy.
  const { error: recordError } = await supabase
    .from("projects")
    .update({
      last_deploy_provider: "vercel",
      last_deploy_url: url,
      last_deploy_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (recordError !== null) {
    console.error("last_deploy bookkeeping failed:", recordError.message);
  }

  return { deploymentId: deployment.id, url };
}

/** Polls one deployment's build status. */
export async function getVercelDeploymentStatus(
  deploymentId: string,
): Promise<VercelDeployStatus> {
  const token = await requireVercelToken();
  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error(await vercelErrorMessage(response));
  }
  const body = (await response.json()) as {
    readyState?: string;
    url?: string;
    errorMessage?: string;
  };
  const readyState = (
    ["QUEUED", "BUILDING", "INITIALIZING", "READY", "ERROR", "CANCELED"] as const
  ).includes(body.readyState as VercelDeployStatus["readyState"])
    ? (body.readyState as VercelDeployStatus["readyState"])
    : "BUILDING";
  return {
    readyState,
    url: typeof body.url === "string" ? `https://${body.url}` : null,
    errorMessage:
      typeof body.errorMessage === "string" ? body.errorMessage : null,
  };
}
