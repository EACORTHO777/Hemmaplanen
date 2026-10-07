import { createClient } from "@supabase/supabase-js";
import type { VerifyToken } from "./auth.ts";
import type { Env } from "./env.ts";

// Server-side client with the secret key. It bypasses RLS, so every query
// made with it must check household membership itself.
export function createAdminClient(env: Pick<Env, "SUPABASE_URL" | "SUPABASE_SECRET_KEY">) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminClient = ReturnType<typeof createAdminClient>;

// Asks Supabase Auth whether the token is valid and who it belongs to
export function supabaseVerifier(supabase: AdminClient): VerifyToken {
  return async (token) => {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  };
}
