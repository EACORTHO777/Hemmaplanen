import { z } from "zod";

// All configuration comes from environment variables and is checked at startup,
// so a missing or broken value stops the server instead of failing later.
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGIN: z.url(),
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  // Who push services can contact about this sender (a URL or mailto:)
  VAPID_SUBJECT: z.string().startsWith("https://").or(z.string().startsWith("mailto:")),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    console.error("Invalid environment:", z.prettifyError(result.error));
    process.exit(1);
  }
  return result.data;
}
