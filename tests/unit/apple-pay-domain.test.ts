import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FILE = "public/.well-known/apple-developer-merchantid-domain-association";
/** production_domain_verification.txt as Grow sent it on 2026-11-05. Apple reads the bytes, so it must stay untouched. */
const GROW_PRODUCTION_SHA256 = "ad492c6c89f0e227ef7dbef5641d9d4abe138e738adcfaf14c84a8ea5f286976";

describe("Apple Pay domain association file", () => {
  it("is Grow's production file, byte for byte", () => {
    const hash = createHash("sha256").update(readFileSync(FILE)).digest("hex");
    expect(hash).toBe(GROW_PRODUCTION_SHA256);
  });
});
