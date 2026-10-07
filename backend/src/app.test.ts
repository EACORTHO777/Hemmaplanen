import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.ts";

const env = { FRONTEND_ORIGIN: "https://hemmaplanen.vercel.app" };
// A fake token check: only "good-token" belongs to a user
const verifyToken = async (token: string) => (token === "good-token" ? "user-1" : null);
const app = createApp(env, { verifyToken });

describe("API basics", () => {
  it("answers the health check", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("sets security headers with helmet", async () => {
    const response = await request(app).get("/health");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("only allows the Hemmaplanen frontend (CORS)", async () => {
    const allowed = await request(app).get("/health").set("Origin", "https://hemmaplanen.vercel.app");
    expect(allowed.headers["access-control-allow-origin"]).toBe("https://hemmaplanen.vercel.app");

    const other = await request(app).get("/health").set("Origin", "https://evil.example");
    expect(other.headers["access-control-allow-origin"]).not.toBe("https://evil.example");
  });

  it("returns JSON 404 for unknown routes", async () => {
    const response = await request(app).get("/nope").set("Authorization", "Bearer good-token");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Not found" });
  });

  it("rate limits after 100 requests per minute", async () => {
    const limited = createApp(env, { verifyToken });
    for (let i = 0; i < 100; i++) await request(limited).get("/health");
    const response = await request(limited).get("/health");
    expect(response.status).toBe(429);
  });
});

describe("requireUser (token check)", () => {
  it("refuses requests without a token", async () => {
    const response = await request(app).get("/me");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not logged in" });
  });

  it("refuses an invalid token", async () => {
    const response = await request(app).get("/me").set("Authorization", "Bearer forged-token");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid or expired login" });
  });

  it("refuses a header that isn't a Bearer token", async () => {
    const response = await request(app).get("/me").set("Authorization", "Basic good-token");
    expect(response.status).toBe(401);
  });

  it("lets a valid token through and tells the endpoint who is calling", async () => {
    const response = await request(app).get("/me").set("Authorization", "Bearer good-token");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: "user-1" });
  });

  it("keeps the health check public", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
  });
});
