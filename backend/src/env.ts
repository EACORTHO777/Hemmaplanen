import { z } from "zod";

// All configuration comes from environment variables and is checked at startup,
// so a missing or broken value stops the server instead of failing later.
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGIN: z.url(),
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
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
