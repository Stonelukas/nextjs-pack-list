import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  reporter: [["line"], ["html", { open: "never" }]],
  use: {
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
    contextOptions: {
      reducedMotion: "reduce",
      serviceWorkers: "block",
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  expect: { timeout: 10_000 },
  webServer: {
    command:
      "bun run dev --host 127.0.0.1 --port 4173 --mode e2e",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ROUTE_LEDGER_E2E: "1",
      VITE_CLERK_PUBLISHABLE_KEY: "pk_test_route_ledger_playwright",
      VITE_CONVEX_URL: "https://route-ledger-e2e.convex.cloud",
      VITE_APP_URL: baseURL,
      VITE_SENTRY_DSN: "",
    },
  },
  projects: [
    {
      name: "desktop-chromium",
      grepInvert: /@mobile/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile-chromium",
      testMatch: /responsive\.spec\.ts/,
      grep: /@mobile/,
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
