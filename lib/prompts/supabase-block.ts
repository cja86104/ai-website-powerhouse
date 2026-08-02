/**
 * Conditional Supabase-backend prompt block (2026-07-31, Connect Your
 * Supabase item 4). Design: PLAN/Feature-Connect-Your-Supabase.md §5.
 *
 * Appended to the user prompt the SAME non-invasive way as the
 * assets note (`buildAssetsNote` in Builder.tsx) and the (shelved)
 * import brief — zero changes to react-system-prompt.ts /
 * react-modify-prompt.ts / scoped-modify-prompt.ts bytes. Returns an
 * empty string when no connection is passed, so callers can always
 * concatenate the result unconditionally (matching buildAssetsNote's
 * own empty-input contract).
 *
 * Deliberately gated by the CALLER passing `null` when the project
 * isn't connected (Builder.tsx only resolves a real connection for
 * react-vite projects — decision 5, html is out of V1 scope) — this
 * module has no framework awareness of its own, on purpose, so it
 * can't silently drift out of sync with that gate.
 */

import type { SupabaseConnection } from "@/lib/supabase-connect/actions";

/**
 * Build the block telling the model a real Supabase backend exists
 * and how to use it safely. `null` means "not connected" — the model
 * gets zero mention of Supabase and must not import "@supabase/supabase-js"
 * (see the IMPORT WHITELIST guidance in react-system-prompt.ts, which
 * says exactly that).
 */
export function buildSupabaseBlock(connection: SupabaseConnection | null): string {
  if (connection === null) return "";
  return `

SUPABASE BACKEND CONNECTED:
A real Supabase backend is connected to this project. A working client already exists (or will be created for you) at src/lib/supabase.ts. Import it exactly like this:
  import { supabase } from './lib/supabase'
Use supabase.auth.* for authentication (signUp, signInWithPassword, signOut, getUser, onAuthStateChange) and supabase.from('table_name').select()/.insert()/.update()/.delete() for data. NEVER call createClient() yourself anywhere else in the project, and NEVER invent, guess, or hardcode a URL or anon key — only ever use the pre-built client at src/lib/supabase.ts.
If this request needs tables that don't already exist in this project, emit a file at supabase/schema.sql containing the needed \`create table\` statements, \`alter table ... enable row level security\`, and matching \`create policy\` statements for each table. The user runs this SQL themselves in their own Supabase SQL editor — you are NOT executing it. Do not assume a table already exists unless the project's current code already reads or writes it.`;
}
