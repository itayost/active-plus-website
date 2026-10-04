#!/usr/bin/env node
// Copies the app's generated funnel contract and routing fixtures into this repo.
// Source: FUNNEL_CONTRACT_DIR, default ../FitnessForSeniorsApp/shared/funnel-contract.
// `--check` exits 1 when the vendored copies differ from the source (drift).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve(
  process.env.FUNNEL_CONTRACT_DIR ??
    "../FitnessForSeniorsApp/shared/funnel-contract"
);
const pairs = [
  [
    resolve(src, "generated/funnel-contract.generated.ts"),
    resolve("lib/funnel/contract.generated.ts"),
  ],
  [
    resolve(src, "orchestrator.fixtures.json"),
    resolve("tests/fixtures/orchestrator.fixtures.json"),
  ],
];
const check = process.argv.includes("--check");
let drift = false;

for (const [from, to] of pairs) {
  if (!existsSync(from)) {
    console.error(`Missing contract source: ${from}`);
    process.exit(2);
  }
  const next = readFileSync(from, "utf8");
  const current = existsSync(to) ? readFileSync(to, "utf8") : "";
  if (next === current) continue;
  if (check) {
    console.error(`Drift: ${to} differs from ${from}`);
    drift = true;
  } else {
    writeFileSync(to, next);
    console.log(`Synced ${to}`);
  }
}
process.exit(drift ? 1 : 0);
