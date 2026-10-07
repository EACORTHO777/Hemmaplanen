import { vi } from "vitest";
import type { PushPayload, PushSender } from "../push.ts";
import type { Store, Subscription } from "../store.ts";

// A tiny in-memory household for tests:
// user-1 (Fader) and user-2 (Moder) in household h1, user-3 in household h2
export const ITEM_ID = "11111111-1111-4111-8111-111111111111";
export const OTHER_ITEM_ID = "22222222-2222-4222-8222-222222222222";

const phone = (owner: string): Subscription => ({ endpoint: `https://push.example/${owner}`, p256dh: "k", auth: "a" });

export function fakeStore(): Store {
  const items: Record<string, { householdId: string; name: string }> = {
    [ITEM_ID]: { householdId: "h1", name: "Mjölk" },
    [OTHER_ITEM_ID]: { householdId: "h2", name: "Hemligt" },
  };
  const members: Record<string, { householdId: string; displayName: string }> = {
    "user-1": { householdId: "h1", displayName: "Fader" },
    "user-2": { householdId: "h1", displayName: "Moder" },
    "user-3": { householdId: "h2", displayName: "Granne" },
  };

  return {
    findItem: async (id) => items[id] ?? null,
    findMember: async (userId, householdId) =>
      members[userId]?.householdId === householdId ? { displayName: members[userId].displayName } : null,
    subscriptionsForUser: async (userId) => [phone(userId)],
    subscriptionsForHousehold: async (householdId, exceptUserId) =>
      Object.entries(members)
        .filter(([id, m]) => m.householdId === householdId && id !== exceptUserId)
        .map(([id]) => phone(id)),
    claimMedicineReminders: async () => [],
    removeSubscription: async () => {},
  };
}

// Records what would have been sent instead of sending it
export function fakePush() {
  return vi.fn<PushSender>(async (subscriptions: Subscription[], _payload: PushPayload) => subscriptions.length);
}

// "token-for-user-1" → "user-1"
export const fakeVerifyToken = async (token: string) =>
  token.startsWith("token-for-") ? token.slice("token-for-".length) : null;
