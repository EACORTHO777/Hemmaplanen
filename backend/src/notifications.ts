import { Router } from "express";
import { z } from "zod";
import type { PushSender } from "./push.ts";
import type { Store } from "./store.ts";

const itemAddedBody = z.object({ itemId: z.uuid() });

export function notificationsRouter(store: Store, push: PushSender) {
  const router = Router();

  // "Skicka testnotis": sends a notification to the caller's own devices
  router.post("/test", async (_req, res) => {
    const subscriptions = await store.subscriptionsForUser(res.locals.userId);
    const delivered = await push(subscriptions, {
      title: "Hemmaplanen",
      body: "Aviseringar fungerar! 🎉",
    });
    res.json({ delivered });
  });

  // Tells the rest of the household that something was added to the shopping list
  router.post("/item-added", async (req, res) => {
    const parsed = itemAddedBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "itemId must be a UUID" });
      return;
    }

    const item = await store.findItem(parsed.data.itemId);
    // Same answer whether the item doesn't exist or belongs to another household,
    // so the API never reveals other households' data
    const member = item && (await store.findMember(res.locals.userId, item.householdId));
    if (!item || !member) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const subscriptions = await store.subscriptionsForHousehold(item.householdId, res.locals.userId);
    const delivered = await push(subscriptions, {
      title: "Handla",
      body: `${member.displayName} lade till ${item.name}`,
      url: "/",
    });
    res.json({ delivered });
  });

  return router;
}
