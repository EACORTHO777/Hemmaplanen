import { defineConfig, devices } from '@playwright/test'

// End-to-end tests: a real browser against the dev server and the local Supabase
// (start it first with `supabase start`).
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    // Keep a recording of failed runs to see what went wrong
    trace: 'retain-on-failure',
  },
  // A phone-sized Chromium, since the app is used on phones
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
