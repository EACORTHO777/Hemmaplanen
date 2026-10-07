// Entry point for the daily GitHub Action (.github/workflows/demo-cleanup.yml).
// Deletes demo households and anonymous demo users older than a day.
import { z } from "zod";
import { createAdminClient } from "../supabase.ts";

const env = z
  .object({ SUPABASE_URL: z.url(), SUPABASE_SECRET_KEY: z.string().min(1) })
  .parse(process.env);

const { data, error } = await createAdminClient(env).rpc("cleanup_demo");
if (error) throw error;
console.log(`Demo cleanup: removed ${data} demo households`);
