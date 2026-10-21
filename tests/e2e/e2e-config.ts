import { defineConfig, devices } from "@playwright/test";
import { E2E_DEAD_SUPABASE_URL, E2E_SUPABASE } from "./supabase-stub";

type Options = {
  port: number;
  /** next.config's distDir for this build, so each config builds and serves its own folder and leaves .next alone. */
  distDir: string;
  /** Build-time variables on top of the stub Supabase (e.g. the checkout flag). */
  extraEnv?: Record<string, string>;
  testMatch?: RegExp;
  testIgnore?: RegExp;
};

const SUPABASE_PORT_OFFSET = 1000;

/** One e2e setup: a production build against stub Supabase, served on its own port, in a desktop and a mobile project. */
export function e2eConfig({ port, distDir, extraEnv = {}, testMatch, testIgnore }: Options) {
  // Tests that stub server actions need this build's id (see build-id.ts).
  process.env.E2E_DIST_DIR = distDir;
  // The build's Supabase is a local stub: /payment reads web_plans on the server, out of page.route's reach.
  const supabasePort = port + SUPABASE_PORT_OFFSET;
  const supabaseUrl = `http://127.0.0.1:${supabasePort}`;
  // The specs' page.route stubs match this host (supabase-stub.ts reads it in the workers).
  process.env.E2E_SUPABASE_URL = supabaseUrl;
  return defineConfig({
    testDir: "tests/e2e",
    ...(testMatch ? { testMatch } : {}),
    ...(testIgnore ? { testIgnore } : {}),
    use: { baseURL: `http://localhost:${port}`, locale: "he-IL" },
    webServer: [{
      command: `node tests/e2e/plan-prices-stub.mjs ${supabasePort}`,
      port: supabasePort,
      reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    }, {
      command: `npm run build && npx next start -p ${port}`,
      port,
      // A server already on the port may be another project or a build with the real
      // Supabase env, so it is only reused on request (PW_REUSE_SERVER=1).
      // Otherwise Playwright fails loudly if the port is taken.
      reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
      timeout: 240_000,
      env: {
        // The local stub: it answers web_plans as PostgREST would and drops every other call,
        // so the browser reaches only the page.route stubs and never the project's Supabase.
        // Set here, these win over .env.local (Next never overrides a set variable).
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: E2E_SUPABASE.anonKey,
        // The funnel-event route inserts with the service client: point it at a host that never
        // resolves, so an e2e run can never write analytics rows to a real project (the insert just fails).
        SUPABASE_URL: E2E_DEAD_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: "e2e-service-key",
        ...extraEnv,
        NEXT_DIST_DIR: distDir,
      },
    }],
    projects: [
      { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
      { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    ],
  });
}

/** The specs that need the web checkout's build (NEXT_PUBLIC_WEB_CHECKOUT=true). */
export const CHECKOUT_SPECS = /(checkout-[a-z-]+|payment-success)\.spec\.ts$/;
