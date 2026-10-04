import { defineConfig, devices } from "@playwright/test";
import { E2E_SUPABASE } from "./tests/e2e/supabase-stub";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3100", locale: "he-IL" },
  webServer: {
    command: "npm run build && npx next start -p 3100",
    port: 3100,
    // A server already on 3100 may be another project or a build with the real
    // Supabase env, so it is only reused on request (PW_REUSE_SERVER=1).
    // Otherwise Playwright fails loudly if the port is taken.
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 240_000,
    env: {
      // A host that can never resolve, so the browser and the middleware can
      // only ever reach the page.route stubs, never the project's Supabase.
      // Set here, these win over .env.local (Next never overrides a set variable).
      NEXT_PUBLIC_SUPABASE_URL: E2E_SUPABASE.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: E2E_SUPABASE.anonKey,
      // Build and serve from .next-e2e (next.config distDir), leaving .next alone.
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
