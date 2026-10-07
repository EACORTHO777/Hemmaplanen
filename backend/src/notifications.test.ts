import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";
import { fakePush, fakeStore, fakeVerifyToken, ITEM_ID, OTHER_ITEM_ID } from "./test/fakes.ts";

function setup() {
  const push = fakePush();
  const app = createApp(
    { FRONTEND_ORIGIN: "https://hemmaplanen.vercel.app" },
    { verifyToken: fakeVerifyToken, store: fakeStore(), push },
  );
  return { app, push };
}

describe("POST /notifications/item-added", () => {
  it("notifies the rest of the household, not the person who added it", async () => {
    const { app, push } = setup();
    const response = await request(app)
      .post("/notifications/item-added")
      .set("Authorization", "Bearer token-for-user-1")
      .send({ itemId: ITEM_ID });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ delivered: 1 });
    const [subscriptions, payload] = push.mock.calls[0];
    expect(subscriptions.map((s) => s.endpoint)).toEqual(["https://push.example/user-2"]);
    expect(payload.body).toBe("Fader lade till Mjölk");
  });

  it("refuses items from another household", async () => {
    const { app, push } = setup();
    const response = await request(app)
      .post("/notifications/item-added")
      .set("Authorization", "Bearer token-for-user-1")
      .send({ itemId: OTHER_ITEM_ID });

    expect(response.status).toBe(404);
    expect(push).not.toHaveBeenCalled();
  });

  it("validates the body", async () => {
    const { app, push } = setup();
    const response = await request(app)
      .post("/notifications/item-added")
      .set("Authorization", "Bearer token-for-user-1")
      .send({ itemId: "not-a-uuid" });

    expect(response.status).toBe(400);
    expect(push).not.toHaveBeenCalled();
  });

  it("requires login", async () => {
    const { app, push } = setup();
    const response = await request(app).post("/notifications/item-added").send({ itemId: ITEM_ID });
    expect(response.status).toBe(401);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("POST /notifications/test", () => {
  it("sends a test notification to the caller's own devices", async () => {
    const { app, push } = setup();
    const response = await request(app)
      .post("/notifications/test")
      .set("Authorization", "Bearer token-for-user-2");

    expect(response.status).toBe(200);
    const [subscriptions] = push.mock.calls[0];
    expect(subscriptions.map((s) => s.endpoint)).toEqual(["https://push.example/user-2"]);
  });
});
