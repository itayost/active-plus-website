import { defineConfig, devices } from "@playwright/test";
import { E2E_SUPABASE } from "./tests/e2e/supabase-stub";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3100", locale: "he-IL" },
  webServer: {
    command: "npm run build && npx next start -p 3100",
    port: 3100,
    reuseExistingServer: true,
    timeout: 240_000,
    // A host that can never resolve, so the browser and the middleware can
    // only ever reach the page.route stubs, never the project's Supabase.
    // Set here, these win over .env.local (Next never overrides a set variable).
    env: { NEXT_PUBLIC_SUPABASE_URL: E2E_SUPABASE.url, NEXT_PUBLIC_SUPABASE_ANON_KEY: E2E_SUPABASE.anonKey },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
