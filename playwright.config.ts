import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: 0, // a failing test must fail; no silent retries
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${String(port)}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Always a fresh production build, never a running dev server.
    command: `pnpm build && pnpm start --port ${String(port)}`,
    url: `http://localhost:${String(port)}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
