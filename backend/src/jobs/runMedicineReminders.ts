// Entry point for the scheduled GitHub Action (.github/workflows/medicine-reminders.yml).
// Runs once and exits; it talks to Supabase directly, so the Render server can stay asleep.
import { z } from "zod";
import { webPushSender } from "../push.ts";
import { supabaseStore } from "../store.ts";
import { createAdminClient } from "../supabase.ts";
import { sendMedicineReminders } from "./medicineReminders.ts";

const env = z
  .object({
    SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().min(1),
    VAPID_PUBLIC_KEY: z.string().min(1),
    VAPID_PRIVATE_KEY: z.string().min(1),
    VAPID_SUBJECT: z.string().min(1),
  })
  .parse(process.env);

const store = supabaseStore(createAdminClient(env));
const result = await sendMedicineReminders(store, webPushSender(env, store));
console.log(`Medicine reminders: ${result.reminders} due, ${result.delivered} notifications delivered`);
