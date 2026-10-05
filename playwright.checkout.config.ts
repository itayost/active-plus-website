import { defineConfig, devices } from "@playwright/test";
import { E2E_SUPABASE } from "./tests/e2e/supabase-stub";

/** The checkout needs NEXT_PUBLIC_WEB_CHECKOUT=true at build time, so it gets its own build, port and folder. */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: /checkout\.spec\.ts$/,
  use: { baseURL: "http://localhost:3101", locale: "he-IL" },
  webServer: {
    command: "npm run build && npx next start -p 3101",
    port: 3101,
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: E2E_SUPABASE.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: E2E_SUPABASE.anonKey,
      SUPABASE_URL: E2E_SUPABASE.url,
      SUPABASE_SERVICE_ROLE_KEY: "e2e-service-key",
      NEXT_PUBLIC_WEB_CHECKOUT: "true",
      NEXT_DIST_DIR: ".next-e2e-checkout",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
