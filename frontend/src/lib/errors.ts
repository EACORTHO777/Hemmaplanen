import * as Sentry from "@sentry/react";

const GENERIC = "Något gick fel. Försök igen.";

// Database rules that answer in English get a Swedish text here
const TRANSLATED: Record<string, string> = {
  "Invalid invite code": "Fel inbjudningskod. Kolla koden och försök igen.",
  "Demo users cannot create households": "I demon kan du inte skapa ett eget hushåll.",
  "Demo users cannot join households": "I demon kan du inte gå med i ett hushåll.",
};

// Turns any error into a short Swedish sentence a user can act on.
// Messages from our own database rules (raise exception) are shown as they are,
// since they are written for users. Anything unexpected is reported to Sentry.
export function friendlyError(error: unknown, fallback = GENERIC): string {
  if (!navigator.onLine) {
    return "Ingen internetanslutning. Försök igen när du är online.";
  }

  const message =
    error instanceof Error ? error.message : (error as { message?: string } | null)?.message;
  const code = (error as { code?: string } | null)?.code;

  if (message && TRANSLATED[message]) return TRANSLATED[message];
  // P0001 = raised by one of our own database functions or triggers
  if (code === "P0001" && message) return message;

  Sentry.captureException(error);
  return fallback;
}
