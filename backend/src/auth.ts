import type { RequestHandler } from "express";

// Checks a Supabase login token and returns the user's id, or null if it's invalid. 
// It's passed in as a function so tests can use a fake one without a real Supabase.
export type VerifyToken = (token: string) => Promise<string| null>;

export function requireUser(verifyToken: VerifyToken): RequestHandler {
  return async (req, res, next) => {
    // The header looks like: "Bearer eyJhbGci0i..."
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

    if(!token) {
      res.status(401).json({ error: "Not logged in" });
      return;
    }

    const userId = await verifyToken(token);
    if(!userId) {
      res.status(401).json({ error: "Invalid or expired login"});
      return;
    }

    // Later handlers can read who is calling
    res.locals.userId = userId;
    next();
  }
}