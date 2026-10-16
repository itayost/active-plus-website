import { readFileSync } from "node:fs";
import { join } from "node:path";

let buildId: string | undefined;

/**
 * The id of the build under test, which a stubbed server-action response must
 * echo. Read from the dist dir the e2e config built into (e2eConfig exports it
 * as E2E_DIST_DIR), not a hard-coded `.next`, and lazily: on a fresh clone the
 * folder only exists once Playwright's webServer has built the app.
 */
export function getBuildId(): string {
  buildId ??= readFileSync(
    join(process.env.E2E_DIST_DIR ?? ".next-e2e", "BUILD_ID"),
    "utf8",
  ).trim();
  return buildId;
}
