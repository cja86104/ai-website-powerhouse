"use server";

/**
 * AI Website Powerhouse — account-synced user templates (2026-07-11).
 *
 * Saved prompt templates are account data (user_templates table under
 * RLS), not browser data — previously they lived only in localStorage
 * and silently failed to follow the login (same failure class as the
 * BYOK key). The Zustand templates store remains a local cache
 * hydrated from here at workspace load; these actions are the source
 * of truth.
 */

import { createClient } from "@/lib/supabase/server";
import type { UserTemplate } from "@/lib/store/templates-store";

/** All of the signed-in user's saved templates, newest first. */
export async function listUserTemplates(): Promise<UserTemplate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return [];

  const { data, error } = await supabase
    .from("user_templates")
    .select("id, name, prompt, created_at")
    .order("created_at", { ascending: false });
  if (error !== null) {
    throw new Error(`Failed to load templates: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    prompt: row.prompt as string,
    createdAt: new Date(row.created_at as string).getTime(),
  }));
}

/** Save a template to the account; returns the stored row. */
export async function createUserTemplate(
  name: string,
  prompt: string,
): Promise<UserTemplate> {
  const trimmedName = name.trim();
  const trimmedPrompt = prompt.trim();
  if (trimmedName.length === 0 || trimmedPrompt.length === 0) {
    throw new Error("Template name and prompt are both required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) {
    throw new Error("Sign in to save templates.");
  }

  const { data, error } = await supabase
    .from("user_templates")
    .insert({ user_id: user.id, name: trimmedName, prompt: trimmedPrompt })
    .select("id, name, prompt, created_at")
    .single();
  if (error !== null) {
    throw new Error(`Failed to save template: ${error.message}`);
  }
  return {
    id: data.id as string,
    name: data.name as string,
    prompt: data.prompt as string,
    createdAt: new Date(data.created_at as string).getTime(),
  };
}

/** Delete an account template by id (RLS scopes to the owner). */
export async function deleteUserTemplate(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_templates")
    .delete()
    .eq("id", id);
  if (error !== null) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}
