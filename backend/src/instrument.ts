import * as Sentry from "@sentry/node";

// Loaded before everythin else so Sentry catches errors from the start.
// Does nothing when SENTRY_DSN is missin (tests, CI).
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Render sets RENDER=true, so local errors are tagged "development"
  environment: process.env.RENDER ? "production" : "development",
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
  }, 
});