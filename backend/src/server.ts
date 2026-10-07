import "./instrument.ts";
import { createApp } from "./app.ts";
import { loadEnv } from "./env.ts";
import { webPushSender } from "./push.ts";
import { supabaseStore } from "./store.ts";
import { createAdminClient, supabaseVerifier } from "./supabase.ts";

const env = loadEnv();
const supabase = createAdminClient(env);
const store = supabaseStore(supabase);
const app = createApp(env, {
  verifyToken: supabaseVerifier(supabase),
  store,
  push: webPushSender(env, store),
});

app.listen(env.PORT, () => {
  console.log(`Hemmaplanen API listening on port ${env.PORT}`);
});
