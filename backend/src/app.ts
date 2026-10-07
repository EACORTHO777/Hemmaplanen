import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { requireUser, type VerifyToken } from "./auth.ts";
import type { Env } from "./env.ts";
import { notificationsRouter } from "./notifications.ts";
import type { PushSender } from "./push.ts";
import type { Store } from "./store.ts";

type Dependencies = {
  verifyToken: VerifyToken;
  store: Store;
  push: PushSender;
};

export function createApp(env: Pick<Env, "FRONTEND_ORIGIN">, deps: Dependencies) {
  const app = express();

  // Render runs the app behind a proxy; trust it so rate limiting sees the real client IP
  app.set("trust proxy", 1);
  // Secure HTTP headers
  app.use(helmet());
  // Only the Hemmaplanen frontend may call this API from a browser
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  // At most 100 requests per minute per IP
  app.use(rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false }));
  // Small JSON bodies only
  app.use(express.json({ limit: "10kb" }));

  // Used by Render (and humans) to check that the server is up
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Everything below this line requires a logged-in user
  app.use(requireUser(deps.verifyToken));

  app.get("/me", (_req, res) => {
    res.json({ userId: res.locals.userId });
  });

  app.use("/notifications", notificationsRouter(deps.store, deps.push));

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Never leak stack traces to the client
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(handleError);

  return app;
}
