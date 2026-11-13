import { defineConfig, devices } from "@playwright/test";

/**
 * Las pruebas E2E requieren:
 *  1. Supabase local levantado (`npx supabase start`) o un proyecto remoto.
 *  2. Seed ejecutado (`npm run seed`).
 *  3. La app corriendo (`npm run dev` o `npm run build && npm start`).
 * Ver README sección "Pruebas E2E".
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
