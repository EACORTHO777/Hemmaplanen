import webpush, { WebPushError } from "web-push";
import type { Env } from "./env.ts";
import type { Store, Subscription } from "./store.ts";

export type PushPayload = { title: string; body: string; url?: string };
export type PushSender = (subscriptions: Subscription[], payload: PushPayload) => Promise<number>;

// Sends Web Push messages signed with our VAPID keys. Returns how many were delivered.
export function webPushSender(
  env: Pick<Env, "VAPID_PUBLIC_KEY" | "VAPID_PRIVATE_KEY" | "VAPID_SUBJECT">,
  store: Pick<Store, "removeSubscription">,
): PushSender {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

  return async (subscriptions, payload) => {
    const results = await Promise.allSettled(
      subscriptions.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 },
        ),
      ),
    );

    let delivered = 0;
    await Promise.all(
      results.map(async (result, i) => {
        if (result.status === "fulfilled") {
          delivered++;
        } else if (
          result.reason instanceof WebPushError &&
          (result.reason.statusCode === 404 || result.reason.statusCode === 410)
        ) {
          // The phone turned notifications off or the app was removed: forget it
          await store.removeSubscription(subscriptions[i].endpoint);
        } else {
          console.error("Push failed", result.reason);
        }
      }),
    );
    return delivered;
  };
}
