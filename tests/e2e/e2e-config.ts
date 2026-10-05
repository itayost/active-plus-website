import { defineConfig, devices } from "@playwright/test";
import { E2E_SUPABASE } from "./supabase-stub";

type Options = {
  port: number;
  /** next.config's distDir for this build, so each config builds and serves its own folder and leaves .next alone. */
  distDir: string;
  /** Build-time variables on top of the stub Supabase (e.g. the checkout flag). */
  extraEnv?: Record<string, string>;
  testMatch?: RegExp;
  testIgnore?: RegExp;
};

/** One e2e setup: a production build against stub Supabase, served on its own port, in a desktop and a mobile project. */
export function e2eConfig({ port, distDir, extraEnv = {}, testMatch, testIgnore }: Options) {
  return defineConfig({
    testDir: "tests/e2e",
    ...(testMatch ? { testMatch } : {}),
    ...(testIgnore ? { testIgnore } : {}),
    use: { baseURL: `http://localhost:${port}`, locale: "he-IL" },
    webServer: {
      command: `npm run build && npx next start -p ${port}`,
      port,
      // A server already on the port may be another project or a build with the real
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
        // The funnel-event route inserts with the service client: point it at the same dead host
        // so an e2e run can never write analytics rows to a real project (the insert just fails).
        SUPABASE_URL: E2E_SUPABASE.url,
        SUPABASE_SERVICE_ROLE_KEY: "e2e-service-key",
        ...extraEnv,
        NEXT_DIST_DIR: distDir,
      },
    },
    projects: [
      { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
      { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    ],
  });
}

/** The specs that need the web checkout's build (NEXT_PUBLIC_WEB_CHECKOUT=true). */
export const CHECKOUT_SPECS = /(checkout-[a-z-]+|payment-success)\.spec\.ts$/;
