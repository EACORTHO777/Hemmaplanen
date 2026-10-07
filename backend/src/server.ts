import { createApp } from "./app.ts";
import { loadEnv } from "./env.ts";
import { createAdminClient, supabaseVerifier } from "./supabase.ts";

const env = loadEnv();
const supabase = createAdminClient(env);
const app = createApp(env, { verifyToken: supabaseVerifier(supabase) });

app.listen(env.PORT, () => {
  console.log(`Hemmaplanen API listening on port ${env.PORT}`);
});
