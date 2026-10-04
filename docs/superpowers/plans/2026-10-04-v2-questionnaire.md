# Active Plus v2: Web Questionnaire + Phone Sign-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/questionnaire` runs the app's current (v5) sign-up funnel on the web: the same questions, branching and copy, then name + phone + SMS code, then the answers are merged into the user's Supabase profile and the visitor lands on `/payment` signed in.

**Architecture:** A pure, unit-tested funnel core in `lib/funnel/` (steps, routing, copy, payload, storage) mirrors the iOS `FunnelOrchestrator` and is checked against the app's own routing fixture file. A single client component renders one step at a time. Auth uses Supabase phone OTP from the browser via `@supabase/ssr` (cookies, so plan 3's server code can read the session). After OTP, new users call `merge_funnel_session` and existing users call `fill_missing_funnel_answers`, both existing RPCs in the shared Supabase project. No database changes in this plan.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, `@supabase/ssr` + `@supabase/supabase-js`, Vitest, Playwright (Supabase calls stubbed with `page.route`).

**Spec:** `docs/superpowers/specs/2026-10-04-funnel-v5.md` (exact copy, keys, routing) + `docs/superpowers/plans/2026-10-04-v2-roadmap.md`. Depends on plan 1 (`lib/constants.ts`, layout system, `SITE_ROUTES`).

**Single source of truth:** the funnel's steps and answer keys come from the app's shared contract (`FitnessForSeniorsApp/shared/funnel-contract/contract.mjs`). Task 2a adds a TypeScript target to its generator, the same way Swift and Kotlin are derived, and Task 2b vendors that output plus the routing fixtures into this repo with a drift check. The web hand-writes only what the contract does not hold (Hebrew copy, option values, branch rules), and the routing is tested against the app's own fixture file.

## Global Constraints

- All Plan 1 global constraints apply (RTL, 18px floor, 48px targets, icons from `components/ui/icons.tsx`, verbatim copy, commit format).
- Copy is verbatim from the spec, including gendered forms (feminine only when `gender === "female"`).
- Answer keys and values exactly as `shared/funnel-contract/contract.mjs`. DOB stored as `"<year>-01-01"`. Time `"HH:mm"`. `pain_areas` in fixed order, `none` exclusive.
- Merge only after `verifyOtp` succeeds. Never call either RPC unauthenticated.
- Web accepts Israeli **mobile** numbers only (`^05\d{8}$` after stripping `-`, spaces, and `+972`/`972` -> `0`), sent as E.164 `+9725XXXXXXXX`.
- No secrets in the browser: only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public. The service-role key stays server-only.
- Local session: `localStorage` keys `ap.funnel.session_id` (UUID) and `ap.funnel.answers` (JSON) with a 30-day TTL; reset when welcome2 is continued and after a successful merge.

## Review Focus

1. **Back-and-change on the chair question leaves a stale branch answer** (`standing_stability` after switching to "קם בקלות"). Expected: the off-branch key is removed before merge. Pinned in Task 2 (`cleanOffBranch` test).
2. **A returning trainee created by the office runs the questionnaire.** Expected: their name and existing answers are not overwritten (fill-missing path, not merge). Pinned in Task 6 (e2e with a profile that has `full_name`).
3. **SMS never arrives or the code is mistyped.** Expected: clear Hebrew error, resend after 12s, "ערוך מספר" keeps the typed number. Pinned in Task 6.
4. **Refresh or closing the tab mid-funnel.** Expected: answers survive (localStorage), the user resumes at the last step. Pinned in Task 3 (storage test) and Task 6 (e2e reload).
5. **Visitor with `prefers-reduced-motion`.** Expected: the plan-building loader shows its finished state with a "המשך" button instead of a timed animation. Pinned in Task 5 (component test via e2e emulation).

---

### Task 0: Re-mock the questionnaire to v5 and get approval

The approved mockup (`.impeccable/mocks/site/questionnaire.html`) was built from the outdated `docs/funnel-flow.md`. It asks the old questions (goal, functionality, motivation, balance test, pain severity).

- [ ] **Step 1:** Rebuild `questionnaire.html` from `docs/superpowers/specs/2026-10-04-funnel-v5.md`: steps welcome2 -> ... -> time, then register (name, phone) and OTP inline, ending with a link to `payment.html`. Keep the mockup's existing visual system (centred column on sunken ground, 72px option cards, dots, back button). Use the app's interstitial images (Task 1 converts them).
- [ ] **Step 2:** Update `payment.html`: when arriving signed in, checkout steps 1 (name) and 3 (phone) show as confirmed rows ("דנה כהן · 050-123-4567 · עריכה") and only email + card remain.
- [ ] **Step 3:** Show the user both pages and wait for approval before Task 4.

---

### Task 1: Dependencies, env, Supabase browser client, funnel images

**Files:**
- Create: `lib/supabase/browser.ts`, `lib/supabase/server.ts`, `middleware.ts`, `public/img/funnel/*.webp`
- Modify: `package.json`, `.env.local` (local only), Vercel env

- [ ] **Step 1: Install** `npm i @supabase/ssr@^0`

- [ ] **Step 2: Env.** Add to `.env.local` and to Vercel (preview + production) with `vercel env add`:
  - `NEXT_PUBLIC_SUPABASE_URL`: same value as the existing `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the project's anon key (Supabase dashboard -> Project Settings -> API)
  Do not print either value in logs or commit them.

- [ ] **Step 3: Clients**

`lib/supabase/browser.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Anon-key client for the visitor's own session (phone OTP, own-row reads, RPCs). */
export function getBrowserSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  client = createBrowserClient(url, key);
  return client;
}
```

`lib/supabase/server.ts`:

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** The visitor's session on the server (route handlers, server actions). */
export async function getServerSupabase() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
}
```

`middleware.ts` (session refresh, scoped to the funnel and checkout only):

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ["/questionnaire", "/payment/:path*", "/api/checkout/:path*"] };
```

- [ ] **Step 4: Interstitial images.** Convert from the app repo (`ios/FitnessForSeniors/FitnessForSeniors/Assets.xcassets`; find with `find ../FitnessForSeniorsApp/ios -name "welcome2-hero.png" -o -name "social-proof-hero*.png" -o -name "reinforcement2-*.jpg"`) with `magick <in> -strip -resize "1400x1400>" -quality 82 public/img/funnel/<name>.webp` to `welcome2-hero.webp`, `social-proof-female.webp`, `social-proof-male.webp`, `reinforcement2-female.webp`, `reinforcement2-male.webp`.

- [ ] **Step 5: Verify Supabase settings** (read-only, Supabase dashboard): Auth -> Providers -> Phone is enabled; SMS OTP length (expect 6); the Send SMS hook points at `sendAuthOtpSms`; Auth -> URL Configuration "Site URL"/redirects include `https://activeplus.co.il` and the Vercel preview domain pattern. Record the OTP length in `lib/funnel/constants.ts` (Task 2) as `OTP_LENGTH`.

- [ ] **Step 6: Commit** `chore: add supabase ssr clients, session middleware and funnel images`

---

### Task 2a: TypeScript target for the shared funnel contract (FitnessForSeniorsApp repo)

The app's funnel is defined once in `shared/funnel-contract/contract.mjs`. `generate.mjs` emits the Swift and Kotlin files from it, and `.github/workflows/funnel-contract-drift.yml` fails CI when a generated file is stale. The web must derive from the same contract, not hand-copy the step list and answer keys.

**Files (in `../FitnessForSeniorsApp`, on a branch `feat/funnel-contract-ts`):**
- Modify: `shared/funnel-contract/generate.mjs` (add `emitTypeScript()`)
- Create: `shared/funnel-contract/generated/funnel-contract.generated.ts` (generator output, committed)
- Modify: `.github/workflows/funnel-contract-drift.yml` (include the new file in the drift diff, if the workflow lists paths explicitly)

- [ ] **Step 1: Add the emitter** next to `emitSwiftSteps`/`emitKotlinSteps`:

```js
const tsOut = resolve(here, "generated/funnel-contract.generated.ts");

function emitTypeScript() {
  const keys = fields.map((f) => `  ${f.jsonKey}: ${f.type === "stringArray" ? "string[]" : "string"}; // ${f.note}`).join("\n");
  const stepList = steps.map((s) => `  "${s.case}",`).join("\n");
  const paths = functionalityPaths.map((p) => `  { case: "${p.case}", functionalityLevel: "${p.functionalityLevel}" },`).join("\n");
  return `// AUTO-GENERATED by shared/funnel-contract/generate.mjs — DO NOT EDIT BY HAND.
// Edit shared/funnel-contract/contract.mjs and re-run the generator.
// Consumed by the website (active-plus-website) via scripts/sync-funnel-contract.mjs.

export const FUNNEL_STEPS = [
${stepList}
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

/** JSONB payload for merge_funnel_session / fill_missing_funnel_answers. Every key optional. */
export type QuestionnaireAnswers = Partial<{
${keys}
}>;

export const ANSWER_KEYS = [${fields.map((f) => `"${f.jsonKey}"`).join(", ")}] as const;

export const FUNCTIONALITY_PATHS = [
${paths}
] as const;
`;
}
```

and call `writeFile(tsOut, emitTypeScript());` with the other writers.

- [ ] **Step 2: Generate and check** `node shared/funnel-contract/generate.mjs && git status --short` -> only the new `.ts` file appears (the Swift/Kotlin outputs are unchanged). Run `npx tsc --noEmit --strict shared/funnel-contract/generated/funnel-contract.generated.ts` -> no errors.

- [ ] **Step 3: Commit in the app repo** `feat(funnel-contract): emit a TypeScript target for the website` and open a PR there. Do not merge without the user's review (shared contract change).

### Task 2b: Sync the contract into the website

**Files:**
- Create: `scripts/sync-funnel-contract.mjs`, `lib/funnel/contract.generated.ts` (synced copy), `tests/unit/funnel-contract.test.ts`
- Modify: `package.json` (scripts), `tests/fixtures/orchestrator.fixtures.json` (now written by the sync script)

- [ ] **Step 1: Sync script** `scripts/sync-funnel-contract.mjs`:

```js
#!/usr/bin/env node
// Copies the app's generated funnel contract and routing fixtures into this repo.
// Source: FUNNEL_CONTRACT_DIR, default ../FitnessForSeniorsApp/shared/funnel-contract.
// `--check` exits 1 when the vendored copies differ from the source (drift).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve(process.env.FUNNEL_CONTRACT_DIR ?? "../FitnessForSeniorsApp/shared/funnel-contract");
const pairs = [
  [resolve(src, "generated/funnel-contract.generated.ts"), resolve("lib/funnel/contract.generated.ts")],
  [resolve(src, "orchestrator.fixtures.json"), resolve("tests/fixtures/orchestrator.fixtures.json")],
];
const check = process.argv.includes("--check");
let drift = false;

for (const [from, to] of pairs) {
  if (!existsSync(from)) { console.error(`Missing contract source: ${from}`); process.exit(2); }
  const next = readFileSync(from, "utf8");
  const current = existsSync(to) ? readFileSync(to, "utf8") : "";
  if (next === current) continue;
  if (check) { console.error(`Drift: ${to} differs from ${from}`); drift = true; }
  else { writeFileSync(to, next); console.log(`Synced ${to}`); }
}
process.exit(drift ? 1 : 0);
```

`package.json`: `"sync:funnel": "node scripts/sync-funnel-contract.mjs"`, `"check:funnel": "node scripts/sync-funnel-contract.mjs --check"`. Run `npm run check:funnel` before every funnel PR (Vercel builds do not have the app repo, so the vendored copy is what ships).

- [ ] **Step 2: Contract test** `tests/unit/funnel-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ANSWER_KEYS, FUNNEL_STEPS } from "@/lib/funnel/contract.generated";
import { COPY_KEYS } from "@/lib/funnel/copy";

describe("contract", () => {
  it("every answer key the web UI writes exists in the app contract", () => {
    for (const key of COPY_KEYS) expect(ANSWER_KEYS).toContain(key);
  });
  it("the contract still starts at welcome2 and ends at payment", () => {
    expect(FUNNEL_STEPS[0]).toBe("welcome2");
    expect(FUNNEL_STEPS.at(-1)).toBe("payment");
  });
});
```

(`COPY_KEYS` is the list of answer keys `lib/funnel/copy.ts` defines questions for; Task 3 exports it.)

- [ ] **Step 3: Run** `npm run sync:funnel && npm test`. Commit `chore: vendor the app's funnel contract and routing fixtures`.

### Task 2c: Funnel core: routing, indicator, branch cleanup (parity with the app)

**Files:**
- Create: `lib/funnel/types.ts`, `lib/funnel/routing.ts`, `lib/funnel/constants.ts`, `tests/unit/funnel-routing.test.ts`

**Interfaces:**
- Consumes: `FUNNEL_STEPS`, `FunnelStep`, `QuestionnaireAnswers` from `lib/funnel/contract.generated.ts`
- Produces:
  - `lib/funnel/types.ts`: `export type Step = FunnelStep; export type Answers = QuestionnaireAnswers;` (re-exports only; no hand-written step or key lists anywhere in the web code)
  - `firstStep(): Step`, `nextStep(step: Step, answers: Answers): Step | null`, `indicator(step: Step, answers: Answers): { index: number; total: 8 } | null`, `clearsHistory(step: Step): boolean`, `cleanOffBranch(answers: Answers): Answers`

- [ ] **Step 1: Failing tests** `tests/unit/funnel-routing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/orchestrator.fixtures.json";
import { cleanOffBranch, clearsHistory, firstStep, indicator, nextStep } from "@/lib/funnel/routing";
import type { Answers, Step } from "@/lib/funnel/types";

/** Walk the funnel the way the app's fixture contract does. Web has no Apple path. */
function walk(answers: Answers): Step[] {
  const seq: Step[] = [firstStep()];
  let step: Step | null = firstStep();
  while ((step = nextStep(step, answers))) seq.push(step);
  return seq;
}

describe("routing parity with the app's orchestrator fixtures", () => {
  for (const s of fixtures.scenarios.filter((x) => x.registerEvent === "standard")) {
    it(s.name, () => {
      expect(walk(s.initialAnswers as Answers)).toEqual(s.expectedSequence);
    });
  }
});

describe("indicator", () => {
  it("shows 8 dots on the 8 question steps and nothing elsewhere", () => {
    const a: Answers = { chair_rise_capability: "alone" };
    const shown = walk(a).filter((s) => indicator(s, a)).map((s) => indicator(s, a)!.index);
    expect(shown).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(indicator("socialProof", a)).toBeNull();
    expect(indicator("register", a)).toBeNull();
  });
  it("puts standingComfort at dot 5 on the handles branch", () => {
    expect(indicator("standingComfort", { chair_rise_capability: "with_handles" })).toEqual({ index: 5, total: 8 });
  });
});

describe("branch hygiene", () => {
  it("drops standing_stability when the chair answer is not with_handles", () => {
    expect(cleanOffBranch({ chair_rise_capability: "alone", standing_stability: "seated" })).toEqual({ chair_rise_capability: "alone" });
  });
  it("drops mobility_challenge on the with_handles branch", () => {
    expect(cleanOffBranch({ chair_rise_capability: "with_handles", mobility_challenge: "stairs", standing_stability: "stable" }))
      .toEqual({ chair_rise_capability: "with_handles", standing_stability: "stable" });
  });
  it("does not mutate its input", () => {
    const a: Answers = { chair_rise_capability: "alone", standing_stability: "seated" };
    cleanOffBranch(a);
    expect(a.standing_stability).toBe("seated");
  });
  it("clears history on entering gender only", () => {
    expect(clearsHistory("gender")).toBe(true);
    expect(clearsHistory("dob")).toBe(false);
  });
});
```

Add `"resolveJsonModule": true` is already in tsconfig; Vitest imports JSON natively.

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement** `lib/funnel/routing.ts`:

```ts
import { FUNNEL_STEPS } from "./contract.generated";
import type { Answers, Step } from "./types";

/** Canonical order comes from the app's contract; only the branch rules live here. */
const ORDER: readonly Step[] = FUNNEL_STEPS;

const onHandlesBranch = (a: Answers) => a.chair_rise_capability === "with_handles";

export const firstStep = (): Step => "welcome2";

/** Mirrors FunnelOrchestrator.nextStep (iOS) for the web's standard (OTP) path. */
export function nextStep(step: Step, answers: Answers): Step | null {
  switch (step) {
    case "chairRise":
      return onHandlesBranch(answers) ? "standingComfort" : "challengeArea";
    case "challengeArea":
    case "standingComfort":
      return "reinforcement2";
    case "payment":
      return null;
    default: {
      const i = ORDER.indexOf(step);
      return ORDER[i + 1] ?? null;
    }
  }
}

const DOTS: Partial<Record<Step, number>> = {
  gender: 1, aspiration: 2, activityLevel: 3, chairRise: 4,
  challengeArea: 5, standingComfort: 5, frequency: 6, bodyAreas: 7, time: 8,
};

export function indicator(step: Step, _answers: Answers): { index: number; total: 8 } | null {
  const index = DOTS[step];
  return index ? { index, total: 8 } : null;
}

export const clearsHistory = (step: Step) => step === "gender";

/** Remove the follow-up answer that belongs to the branch the user is no longer on. */
export function cleanOffBranch(answers: Answers): Answers {
  const { standing_stability, mobility_challenge, ...rest } = answers;
  if (onHandlesBranch(answers)) return standing_stability ? { ...rest, standing_stability } : rest;
  return mobility_challenge ? { ...rest, mobility_challenge } : rest;
}
```

`lib/funnel/types.ts` re-exports `Step` and `Answers` from the generated contract (Interfaces above). The contract types every answer as `string`; narrow at the UI edge (option values are typed in `copy.ts`), not by editing the generated file. `lib/funnel/constants.ts`: `export const OTP_LENGTH = 6; export const RESEND_SECONDS = 12; export const SESSION_TTL_DAYS = 30; export const PLAN_BUILD_MS = 6000;` (web shortens the 9.4s app loader; the checklist thresholds stay 28/56/82%).

- [ ] **Step 4: Run, expect PASS** (6 fixture scenarios minus the Apple one = 5, plus 7 others).

- [ ] **Step 5: Commit** `feat: funnel routing core with app fixture parity`

---

### Task 3: Payload, storage, phone, gendered copy

**Files:**
- Create: `lib/funnel/payload.ts`, `lib/funnel/storage.ts`, `lib/phone.ts`, `lib/funnel/copy.ts`, `tests/unit/funnel-payload.test.ts`, `tests/unit/phone.test.ts`, `tests/unit/funnel-storage.test.ts`
- Modify: `lib/leads.ts` (use `lib/phone.ts` instead of its private `toE164`)

**Interfaces:**
- Produces: `dobFromYear(year: number): string`; `normalizePainAreas(areas: string[]): string[]`; `toggleBodyArea(current: string[], area: string): string[]`; `buildMergePayload(answers: Answers): Answers`; `isIsraeliMobile(raw: string): boolean`; `toE164(raw: string): string`; `formatLocal(e164: string): string`; `loadSession(now?: number): { id: string; answers: Answers }`; `saveAnswers(answers: Answers): void`; `resetSession(): void`; `g(gender: Answers["gender"], fem: string, masc: string): string`; `COPY` (all funnel strings); `COPY_KEYS: readonly (keyof Answers)[]` (the answer key each question writes, checked against the contract in Task 2b)

- [ ] **Step 1: Failing tests**

`tests/unit/funnel-payload.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildMergePayload, dobFromYear, normalizePainAreas, toggleBodyArea } from "@/lib/funnel/payload";

describe("payload", () => {
  it("stores DOB as Jan 1 of the year", () => {
    expect(dobFromYear(1958)).toBe("1958-01-01");
  });
  it("orders pain areas the way the app stores them", () => {
    expect(normalizePainAreas(["knees", "neck", "lower_back"])).toEqual(["neck", "lower_back", "knees"]);
  });
  it("makes 'none' exclusive in both directions", () => {
    expect(toggleBodyArea(["knees", "neck"], "none")).toEqual(["none"]);
    expect(toggleBodyArea(["none"], "knees")).toEqual(["knees"]);
    expect(toggleBodyArea(["knees"], "knees")).toEqual([]);
  });
  it("builds a merge payload with only answered keys and no off-branch follow-up", () => {
    const p = buildMergePayload({
      gender: "female", chair_rise_capability: "alone", standing_stability: "seated",
      mobility_challenge: "stairs", pain_areas: ["knees", "neck"], full_name: "  רחל כהן ",
    });
    expect(p).toEqual({ gender: "female", chair_rise_capability: "alone", mobility_challenge: "stairs", pain_areas: ["neck", "knees"], full_name: "רחל כהן" });
  });
});
```

`tests/unit/phone.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatLocal, isIsraeliMobile, toE164 } from "@/lib/phone";

describe("phone", () => {
  it.each(["050-1234567", "0501234567", "+972501234567", "972 50 123 4567"])("accepts %s", (n) => {
    expect(isIsraeliMobile(n)).toBe(true);
  });
  it.each(["04-8123456", "12345", "05012345678", ""])("rejects %s", (n) => {
    expect(isIsraeliMobile(n)).toBe(false);
  });
  it("converts to E.164", () => {
    expect(toE164("050-1234567")).toBe("+972501234567");
    expect(toE164("+972501234567")).toBe("+972501234567");
  });
  it("formats for display", () => {
    expect(formatLocal("+972501234567")).toBe("050-1234567");
  });
});
```

`tests/unit/funnel-storage.test.ts` (Vitest `environment: "jsdom"` for this file via `// @vitest-environment jsdom`; install `npm i -D jsdom`):

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadSession, resetSession, saveAnswers } from "@/lib/funnel/storage";

const DAY = 86_400_000;

describe("funnel storage", () => {
  beforeEach(() => localStorage.clear());
  it("creates one stable session id", () => {
    expect(loadSession().id).toBe(loadSession().id);
  });
  it("persists answers across reloads", () => {
    saveAnswers({ gender: "male" });
    expect(loadSession().answers).toEqual({ gender: "male" });
  });
  it("expires after 30 days", () => {
    saveAnswers({ gender: "male" });
    expect(loadSession(Date.now() + 31 * DAY).answers).toEqual({});
  });
  it("reset clears id and answers", () => {
    const { id } = loadSession();
    saveAnswers({ gender: "male" });
    resetSession();
    const after = loadSession();
    expect(after.id).not.toBe(id);
    expect(after.answers).toEqual({});
  });
  it("survives corrupted storage", () => {
    localStorage.setItem("ap.funnel.answers", "{not json");
    expect(loadSession().answers).toEqual({});
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement.**

`lib/phone.ts`:

```ts
const MOBILE = /^05\d{8}$/;

function toLocal(raw: string): string {
  const digits = raw.trim().replace(/[\s-]/g, "");
  if (digits.startsWith("+972")) return `0${digits.slice(4)}`;
  if (digits.startsWith("972")) return `0${digits.slice(3)}`;
  return digits;
}

export const isIsraeliMobile = (raw: string) => MOBILE.test(toLocal(raw));

export function toE164(raw: string): string {
  const local = toLocal(raw);
  if (!MOBILE.test(local)) throw new Error("Not an Israeli mobile number");
  return `+972${local.slice(1)}`;
}

export function formatLocal(e164: string): string {
  const local = toLocal(e164);
  return `${local.slice(0, 3)}-${local.slice(3)}`;
}
```

(`lib/leads.ts` accepts landlines for leads. Keep its own pattern, but replace its private `toE164` with a local helper that does not throw for landlines. Only the funnel uses `lib/phone.ts`'s strict mobile rule.)

`lib/funnel/payload.ts`:

```ts
import { cleanOffBranch } from "./routing";
import type { Answers } from "./types";

const PAIN_ORDER = ["neck", "shoulders_neck", "elbows", "lower_back", "hips", "knees", "ankle", "none"];

export const dobFromYear = (year: number) => `${year}-01-01`;

export const normalizePainAreas = (areas: string[]) =>
  PAIN_ORDER.filter((a) => areas.includes(a));

export function toggleBodyArea(current: string[], area: string): string[] {
  if (area === "none") return current.includes("none") ? [] : ["none"];
  const without = current.filter((a) => a !== "none");
  return without.includes(area) ? without.filter((a) => a !== area) : normalizePainAreas([...without, area]);
}

/** Exactly what merge_funnel_session / fill_missing_funnel_answers receive. */
export function buildMergePayload(answers: Answers): Answers {
  const clean = cleanOffBranch(answers);
  const entries = Object.entries(clean).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));
  const out = Object.fromEntries(entries) as Answers;
  if (out.pain_areas) out.pain_areas = normalizePainAreas(out.pain_areas);
  if (out.full_name) out.full_name = out.full_name.trim();
  return out;
}
```

`lib/funnel/storage.ts`:

```ts
import { SESSION_TTL_DAYS } from "./constants";
import type { Answers } from "./types";

const ID = "ap.funnel.session_id";
const ANSWERS = "ap.funnel.answers";
const STAMP = "ap.funnel.updated_at";
const TTL = SESSION_TTL_DAYS * 86_400_000;

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private mode: the funnel still works in memory */ }
}

export function resetSession() {
  try { [ID, ANSWERS, STAMP].forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
}

export function loadSession(now = Date.now()): { id: string; answers: Answers } {
  const stamp = Number(safeGet(STAMP) ?? 0);
  if (stamp && now - stamp > TTL) resetSession();
  let id = safeGet(ID);
  if (!id) { id = crypto.randomUUID().toLowerCase(); safeSet(ID, id); safeSet(STAMP, String(now)); }
  let answers: Answers = {};
  try { answers = JSON.parse(safeGet(ANSWERS) ?? "{}") as Answers; } catch { answers = {}; }
  return { id, answers };
}

export function saveAnswers(answers: Answers) {
  safeSet(ANSWERS, JSON.stringify(answers));
  safeSet(STAMP, String(Date.now()));
}
```

`lib/funnel/copy.ts`: `export const g = (gender, fem, masc) => (gender === "female" ? fem : masc);` plus a `COPY` object holding every string from the spec, grouped by step. Options are `{ value, fem, masc }` where gendered and `{ value, label }` otherwise. Copy every string character for character from `docs/superpowers/specs/2026-10-04-funnel-v5.md`, including the maqaf in "כ־3" and the en dash in "1–2". Add a test asserting `COPY.frequency.options.map((o) => o.value)` equals `["almost_daily", "three_week", "one_two_week", "none"]`, plus one test per question step asserting its option values match the contract.

- [ ] **Step 4: Run, expect PASS.** `npm test`

- [ ] **Step 5: Commit** `feat: funnel payload, storage, phone and copy modules`

---

### Task 4: Question and interstitial UI

**Files:**
- Create: `app/questionnaire/page.tsx`, `components/funnel/Funnel.tsx` (state owner), `components/funnel/FunnelChrome.tsx` (back, dots, cancel), `components/funnel/OptionList.tsx`, `components/funnel/YearSelect.tsx`, `components/funnel/BodyAreas.tsx`, `components/funnel/TimeStep.tsx`, `components/funnel/Interstitial.tsx`, `components/funnel/PlanBuilding.tsx`, `components/funnel/steps.tsx` (step -> element map)

- [ ] **Step 1: `Funnel.tsx`** (client): owns `{ step, history: Step[], answers }`. On mount, `loadSession()` restores answers and the last step (store `ap.funnel.step` too, through `storage.ts`). `answer(patch)` does `const next = cleanOffBranch({ ...answers, ...patch }); saveAnswers(next);` and then advances with `nextStep`. `back()` pops history, except that back from `time` sub-screen A goes to `bodyAreas`, never to `planBuilding`. Entering `gender` clears history (`clearsHistory`). Continuing welcome2 calls `resetSession()` first. On step change, move focus to the step's `<h1>` (`tabIndex={-1}`) and scroll to top. Cancel ("ביטול") navigates to `/` without clearing answers.

- [ ] **Step 2: Chrome and option cards** match the mockup (`.impeccable/mocks/site/questionnaire.html` after Task 0): centred column `max-w-[860px]` on `bg-sunken`; top row = back (48px, `ArrowBackIcon`) | dots (`aria-label={\`שלב ${i} מתוך 8\`}`) | "ביטול". `OptionList` renders a `role="radiogroup"` of native radio inputs styled as 72px cards (selected: `border-blue-deep bg-blue-wash` + `CheckIcon`). Single-select pre-selects the saved answer; "המשך" is disabled until chosen (the app behavior: selecting does not auto-advance).

- [ ] **Step 3: Special steps**
- `YearSelect`: a native `<select>` (most legible for this audience) with years `currentYear-30 ... currentYear-100`, default `currentYear-65`; on continue stores `dobFromYear(year)`.
- `BodyAreas`: two-column toggle buttons with `aria-pressed`, full-width "אין כאב או אי-נוחות" last, logic via `toggleBodyArea`.
- `TimeStep`: sub-screen A (segment radios), sub-screen B (3 preset radios + "בחר שעה אחרת שמתאימה לי" opening an inline `<select>` of 15-minute slots within the segment's range; no modal). Stores `"HH:mm"`.
- `Interstitial`: image (gendered per spec), headline with the green emphasis span, body, callouts with icons from `icons.tsx` (add `BoltIcon`, `HeartIcon`, `WalkIcon` to `icons.tsx` in the existing stroke style if missing), "המשך". socialProof computes the age band: `Math.floor((currentYear - year) / 5) * 5`, fallback 50.
- `PlanBuilding`: progress ring + checklist (28/56/82%), `PLAN_BUILD_MS` total, auto-advance. Under `prefers-reduced-motion`, render 100% immediately with a "המשך" button. No back, no cancel.

- [ ] **Step 4: Page** `app/questionnaire/page.tsx`: server component with `metadata` (title "בדיקת התאמה", `robots: { index: false }` — a personal flow, not a landing page), rendering `<Funnel />`. Hide the site footer on this route? No: keep header and footer (the brief keeps the menu everywhere).

- [ ] **Step 5: Manual check** of every step at 390 and 1440, both genders, both chair branches.

- [ ] **Step 6: Commit** `feat: questionnaire question and interstitial screens`

---

### Task 5: Register, OTP, merge and hand-off to payment

**Files:**
- Create: `components/funnel/Register.tsx`, `components/funnel/Otp.tsx`, `lib/funnel/finish.ts`, `tests/unit/funnel-finish.test.ts`

**Interfaces:**
- Consumes: `getBrowserSupabase()`, `toE164`, `buildMergePayload`, `loadSession`, `resetSession`
- Produces: `finishSignup(supabase, sessionId: string, answers: Answers): Promise<{ kind: "new" } | { kind: "existing"; name: string } | { kind: "error" }>`

- [ ] **Step 1: Failing test** `tests/unit/funnel-finish.test.ts` with a fake Supabase client:

```ts
import { describe, expect, it, vi } from "vitest";
import { finishSignup } from "@/lib/funnel/finish";

function fakeSupabase(profileName: string | null, rpcError: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data: { success: !rpcError }, error: rpcError });
  return {
    rpc,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } }, error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: profileName === null ? null : { full_name: profileName }, error: null }) }) }) }),
  };
}

describe("finishSignup", () => {
  it("merges a new user's answers with the session id", async () => {
    const sb = fakeSupabase(null);
    const r = await finishSignup(sb as never, "s1", { gender: "female", full_name: "רחל" });
    expect(sb.rpc).toHaveBeenCalledWith("merge_funnel_session", { p_session_id: "s1", p_answers: { gender: "female", full_name: "רחל" } });
    expect(r).toEqual({ kind: "new" });
  });
  it("only fills missing answers for an existing user and keeps their name", async () => {
    const sb = fakeSupabase("דוד לוי");
    const r = await finishSignup(sb as never, "s1", { gender: "male", full_name: "דוד" });
    expect(sb.rpc).toHaveBeenCalledWith("fill_missing_funnel_answers", { p_answers: { gender: "male" } });
    expect(r).toEqual({ kind: "existing", name: "דוד לוי" });
  });
  it("reports a merge failure instead of throwing", async () => {
    const r = await finishSignup(fakeSupabase(null, { message: "boom" }) as never, "s1", {});
    expect(r).toEqual({ kind: "error" });
  });
});
```

(For existing users `full_name` is stripped from the payload: `fill_missing_funnel_answers` never writes it anyway, and sending it would suggest otherwise.)

- [ ] **Step 2: FAIL. Step 3: implement** `lib/funnel/finish.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildMergePayload } from "./payload";
import type { Answers } from "./types";

type Result = { kind: "new" } | { kind: "existing"; name: string } | { kind: "error" };

export async function finishSignup(supabase: SupabaseClient, sessionId: string, answers: Answers): Promise<Result> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { kind: "error" };

  const { data: profile } = await supabase.from("users").select("full_name").eq("id", auth.user.id).maybeSingle();
  const existingName = profile?.full_name?.trim();
  const payload = buildMergePayload(answers);

  if (existingName) {
    const { full_name: _drop, ...rest } = payload;
    const { error } = await supabase.rpc("fill_missing_funnel_answers", { p_answers: rest });
    return error ? { kind: "error" } : { kind: "existing", name: existingName };
  }

  const { error } = await supabase.rpc("merge_funnel_session", { p_session_id: sessionId, p_answers: payload });
  return error ? { kind: "error" } : { kind: "new" };
}
```

**Verify before relying on it:** the signed-in user can `select full_name from users where id = auth.uid()` under the live RLS (Supabase SQL editor: `select polname, qual from pg_policies where tablename = 'users';`). If not, use the same detection the app uses (`reloadProfile`, see `ios/.../Core/Network/SupabaseManager+User.swift`) and adjust `finishSignup` and its test to match.

- [ ] **Step 4: PASS. Step 5: UI.**
- `Register.tsx`: name sub-step then phone sub-step, copy from the spec. Validation messages via `aria-describedby`, `role="alert"`. "שלחו לי קוד" calls `supabase.auth.signInWithOtp({ phone: toE164(raw) })`. On error, show "לא הצלחנו לשלוח קוד. בדקו את המספר ונסו שוב." and log the error code only (no phone number in logs). The consent line links to `/privacy-policy` and to the terms page (if the site has no terms page, link the app's terms URL used in `ios/.../Components/SubscriptionLegalLinks.swift`; ask the user if it is missing).
- `Otp.tsx`: one `<input inputMode="numeric" autoComplete="one-time-code" maxLength={OTP_LENGTH}>`, visually split into boxes (a single input keeps paste and SMS autofill working). Auto-verify at `OTP_LENGTH` digits with `verifyOtp({ phone, token, type: "sms" })`. Resend countdown `RESEND_SECONDS`. "ערוך מספר" returns to the phone sub-step with the number kept. On success show "מסיימים את ההרשמה...", call `finishSignup`; `new` -> `resetSession()` but keep `gender` in `sessionStorage` (`ap.funnel.gender`) for the payment page's wording, then `router.push("/payment")`; `existing` -> "ברוכים השבים, {name}" with a button to `/payment`; `error` -> "לא הצלחנו לסיים את ההרשמה" + "נסו שוב" (retries `finishSignup` only, not the OTP).

- [ ] **Step 6: Commit** `feat: phone sign-in, answer merge and hand-off to payment`

---

### Task 6: Funnel analytics and end-to-end tests

**Files:**
- Create: `app/api/funnel-event/route.ts`, `tests/unit/funnel-event.test.ts`, `tests/e2e/questionnaire.spec.ts`

- [ ] **Step 1: Verify `funnel_events` on the live DB** (SQL editor, read-only): `select column_name, data_type from information_schema.columns where table_name = 'funnel_events';` and `select polname, cmd, roles from pg_policies where tablename = 'funnel_events';`. Expected columns include `session_id, step, data, client_platform, client_version`. If `client_platform` has a CHECK constraint without `'web'`, stop and ask before changing the app's database.

- [ ] **Step 2: Route handler** `app/api/funnel-event/route.ts`: POST `{ sessionId, step, data? }`. Validate `sessionId` as a UUID, `step` against the `Step` union (plus `"register_name"`, `"otp_verified"`). Cap `data` at 2KB and drop any key named `phone`, `full_name` or `name`. Insert with the service client (`createServiceClient()`): `{ session_id, step, data: { ...data, funnel_version: "v2-web" }, client_platform: "web", client_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev" }`. Rate limit 120/min per IP using the same in-memory pattern as `lib/leads.ts`. Always return 204 (analytics never blocks the funnel). Unit-test the validator as a pure function `parseFunnelEvent(body: unknown)` in `lib/funnel/events.ts`: valid body, bad UUID, unknown step, PII keys stripped, oversize data rejected.

- [ ] **Step 3: Fire events** from `Funnel.tsx` on each step view with `navigator.sendBeacon("/api/funnel-event", ...)` (fallback `fetch(..., { keepalive: true })`).

- [ ] **Step 4: e2e** `tests/e2e/questionnaire.spec.ts`. Stub Supabase in the browser with `page.route("**/auth/v1/otp**", ...)` (200 `{}`), `page.route("**/auth/v1/verify**", ...)` (200 with a fake session `{ access_token, refresh_token, user: { id: "u1", phone: "972501234567" } }`), `page.route("**/rest/v1/users**", ...)` (returns `[]` for new or `[{ full_name: "דוד לוי" }]` for existing), `page.route("**/rest/v1/rpc/merge_funnel_session", ...)` (capture the body, return `{ success: true }`), `page.route("**/rest/v1/rpc/fill_missing_funnel_answers", ...)`. Scenarios:
  1. Female, chair alone, knees + neck, morning 09:00: walks every step; the merge body has `p_answers.pain_areas == ["neck","knees"]`, `date_of_birth` ends in `-01-01`, no `standing_stability`; lands on `/payment`.
  2. Male, chair with_handles -> standingComfort seated; back to chairRise, change to with_support -> challengeArea; merge body has `mobility_challenge` and no `standing_stability` (Review Focus 1).
  3. Existing user: `fill_missing_funnel_answers` called, `merge_funnel_session` not called, "ברוכים השבים, דוד לוי" visible (Review Focus 2).
  4. Wrong code: verify stub returns 400 -> error text visible, input cleared; "ערוך מספר" shows the phone field still holding the number (Review Focus 3).
  5. Reload at bodyAreas -> resumes at bodyAreas with earlier answers intact (Review Focus 4).
  6. `page.emulateMedia({ reducedMotion: "reduce" })` -> plan building shows a "המשך" button (Review Focus 5).
  7. Mobile project: no horizontal overflow on any step.

- [ ] **Step 5: Run** `npm test && npm run typecheck && npm run test:e2e -- tests/e2e/questionnaire.spec.ts`. All PASS.

- [ ] **Step 6: Commit** `test: questionnaire e2e with stubbed supabase; funnel events endpoint`

---

### Task 7: Live smoke on a preview deployment

- [ ] **Step 1:** Deploy a preview (`vercel`). With a real phone number you control, run the funnel end to end. Then in the Supabase dashboard confirm: a new `auth.users` row with that phone, `public.users.full_name` set, `trainee_profiles` with `chair_rise_capability`, `training_frequency` and `functionality_level` derived, `onboarding_completed = true`, `funnel_events` rows with `client_platform = 'web'` linked to the user.
- [ ] **Step 2:** Sign in to the iOS app with the same phone: the app treats the user as already onboarded (no funnel) and the paywall appears. This proves the web and the app share the account.
- [ ] **Step 3:** Delete the test user afterwards through the normal path: submit `/delete-account` with the test account's email, or delete in the dashboard if the account has no email. Record the result in the PR description.

## Known app-side gaps (report to the user, not fixed here)

- `merge_funnel_session` v5 does not store `daily_activity_level` (dropped in v4). The web sends it; the server ignores it. Fixing it is a migration in the app repo.
- iOS paywall shows masculine copy to everyone (session reset before the paywall reads gender).
- iOS Apple Sign-In merges without the existing-user check.
