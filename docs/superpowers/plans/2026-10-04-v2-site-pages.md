# Active Plus v2: Site Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public site to the client's v2 brief: six pages, three card explainers, new nav, new content and imagery, legacy redirects, with `/delete-account` and `/privacy-policy` kept exactly where the app stores expect them.

**Architecture:** Next.js 15 App Router, server components by default, client components only for carousels, the plan selector and the drawer. Copy lives in typed `content/*.ts` modules, never inline in JSX, so it can be tested and edited without touching layout. The approved HTML mockups in `.impeccable/mocks/site/` are the pixel reference: every section task names the mockup lines it ports. Markup is rebuilt in the existing Tailwind tokens and primitives (`Section`, `Shell`, `Button`, `Reveal`, `PageHero`, `Accordion`, `Prose`, `icons`), not pasted.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Tailwind 3, Vitest (new, unit), Playwright + @axe-core/playwright (new, e2e/a11y).

**Spec:** `docs/superpowers/plans/2026-10-04-v2-roadmap.md` (decisions) + `.impeccable/mocks/site/*.html` (visual spec) + `PRODUCT.md` / `DESIGN.md` (brand and system rules).

## Global Constraints

- Hebrew RTL only: `<html lang="he" dir="rtl">`. Logical properties (`ps-`, `pe-`, `start-`, `end-`), never `left`/`right` for layout.
- Body text never below 18px (`text-base` = 1.125rem). Touch targets >= 48px.
- No emojis, no unicode-glyph icons; icons come from `components/ui/icons.tsx` (1.75 stroke, round caps).
- No eyebrow/kicker labels above headings. No gradient text, no glassmorphism, no colored side-borders, no orange.
- Copy is the client's, verbatim. The mockups already carry the cleaned copy. Do not add claims, numbers, or testimonials.
- `/delete-account` and `/privacy-policy`: same URL, same behavior, indexable, linked from the footer. No redirect may have either as its source.
- Images from `public/img/v2/` (client photos, already converted to webp). `next/image` with explicit `width`/`height` or `fill` + `sizes`.
- Prices: annual 59 ₪/month, 708 ₪ one charge, 1-12 installments, savings 480 ₪; monthly 99 ₪, no commitment. No free trial anywhere.
- Commit messages: `<type>: <description>` (feat, fix, refactor, docs, test, chore), ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Work on branch `feat/brief-v2`.

## Review Focus

1. **Store-listed deletion URL breaks.** Someone following the App Store or Play link to `/delete-account` must land on the working form, never a redirect or a 404. Pinned by the redirect-source test (Task 2) and the e2e legal-pages test (Task 12).
2. **Old links from search, WhatsApp shares and the app.** `/dual-tasking`, `/faq`, `/contact`, `/pricing` and the old article slugs must 301 to a live page, not 404. Pinned by the e2e redirect test (Task 2).
3. **A home card's "תראו לי עוד" points nowhere.** Every `FEATURE_CARDS[].href` must be a real route. Pinned by the content test (Task 3).
4. **Wide desktop looks narrow again.** The user rejected the 1240px shell. Pinned by the 1920px screenshot check (Task 12).
5. **The "בדיקת התאמה" button wraps or disappears on a 390px phone.** Pinned by the mobile e2e header test (Task 4).

---

## File Structure

| Path | Responsibility | Task |
|------|----------------|------|
| `vitest.config.ts`, `playwright.config.ts`, `tests/` | test tooling | 1 |
| `lib/redirects.ts` | legacy URL -> new URL map (pure data) | 2 |
| `next.config.ts` | wires `LEGACY_REDIRECTS` into `redirects()` | 2 |
| `lib/routes.ts` | list of every live page route, used by tests, sitemap, 404 | 3 |
| `lib/constants.ts` | NAV, FIT_CHECK, PLANS, PLAN_INCLUDES, FEATURE_CARDS (partly done) | 3 |
| `lib/pricing.ts` | savings, installment math, shekel formatting | 3 |
| `tailwind.config.ts`, `app/globals.css`, `components/ui/Section.tsx` | wider shell + type scale | 4 |
| `components/layout/Header.tsx`, `Footer.tsx`, `app/layout.tsx`, `app/sitemap.ts`, `app/not-found.tsx` | chrome | 4 |
| `content/home.ts` | WHAT_MATTERS, TESTIMONIALS, FAQ (new 13 Q&As) | 5 |
| `components/home/*` | home sections | 5-7 |
| `components/sections/PlansTeaser.tsx` | 2 plan photo cards -> /payment | 7 |
| `content/explainers.ts`, `app/(explainers)/*` | 3 card explainer pages | 8 |
| `content/how-it-works.ts`, `app/how-it-works/page.tsx` | How it works | 9 |
| `content/pages.ts` (ABOUT, TEAM rewritten), `app/about/page.tsx` | About | 10 |
| `app/articles/*`, `content/articles.ts` (already rewritten) | Articles | 11 |
| `app/payment/page.tsx`, `components/payment/PlanSelector.tsx` | Payment, phase 1 | 11 |
| `tests/e2e/*` | smoke, legal, redirects, a11y, screenshots | 12 |

Delete after redirects are live (Task 2): `app/dual-tasking`, `app/research`, `app/team`, `app/faq`, `app/contact`, `app/pricing`, `components/home/ChoosingDaily.tsx`, `components/home/ResearchStrip.tsx`, `components/sections/Pricing.tsx` (replaced), `components/ui/ArcStage.tsx` (only ChoosingDaily used it; confirm with `grep -r ArcStage app components` first).

---

### Task 1: Baseline commit and test tooling

The working tree holds a large amount of uncommitted, untracked work (most of `app/`, `components/`, `content/`, `public/`). Commit it first so every later deletion is recoverable.

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (scripts, devDependencies), `.gitignore`

- [ ] **Step 1: Baseline commit**

```bash
git switch feat/brief-v2
git status --short | head -50   # expect many ?? and M entries
git add -A
git commit -m "chore: baseline the v1 site before the v2 rebuild

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: one commit. `git status` is clean. `.env.local` must NOT be in the commit: run `git show --stat HEAD | grep -c env.local`, expect `0`. If it appears, `git reset HEAD~1`, add `.env*.local` to `.gitignore`, and redo.

- [ ] **Step 2: Install tooling**

```bash
npm i -D vitest@^3 @vitejs/plugin-react@^5 vite-tsconfig-paths@^5 @playwright/test@^1 @axe-core/playwright@^4
npx playwright install chromium
```

- [ ] **Step 3: Configure**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    coverage: { provider: "v8", include: ["lib/**", "content/**"], thresholds: { lines: 80 } },
  },
});
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3100", locale: "he-IL" },
  webServer: { command: "npm run build && npx next start -p 3100", port: 3100, reuseExistingServer: true, timeout: 240_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
```

`package.json` scripts (add):

```json
"test": "vitest run",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"typecheck": "tsc --noEmit"
```

`.gitignore` (append): `test-results/`, `playwright-report/`, `coverage/`.

- [ ] **Step 4: Smoke tests**

`tests/unit/smoke.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/constants";

describe("tooling", () => {
  it("resolves the @ alias", () => {
    expect(SITE_URL).toBe("https://activeplus.co.il");
  });
});
```

`tests/e2e/smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home renders an h1", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});
```

- [ ] **Step 5: Run**

Run: `npm test` -> PASS (1 test). `npm run typecheck` -> errors are expected only from files later tasks rewrite (`components/sections/Pricing.tsx`, `components/layout/Header.tsx`, `app/articles/[slug]/page.tsx`); note them, do not fix here.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts playwright.config.ts tests package.json package-lock.json .gitignore
git commit -m "test: add vitest and playwright tooling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Legacy redirects (legal pages untouched)

**Files:**
- Create: `lib/redirects.ts`, `tests/unit/redirects.test.ts`, `tests/e2e/redirects.spec.ts`
- Modify: `next.config.ts`
- Delete: `app/dual-tasking/`, `app/research/`, `app/team/`, `app/faq/`, `app/contact/`, `app/pricing/`

**Interfaces:**
- Produces: `LEGACY_REDIRECTS: readonly { source: string; destination: string }[]`, `PROTECTED_PATHS: readonly string[]`

- [ ] **Step 1: Write the failing unit test**

`tests/unit/redirects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LEGACY_REDIRECTS, PROTECTED_PATHS } from "@/lib/redirects";

describe("legacy redirects", () => {
  it("never redirects a store-listed legal page", () => {
    const sources = LEGACY_REDIRECTS.map((r) => r.source);
    for (const path of PROTECTED_PATHS) expect(sources).not.toContain(path);
  });

  it("protects exactly the two legal pages", () => {
    expect(PROTECTED_PATHS).toEqual(["/delete-account", "/privacy-policy"]);
  });

  it("covers every removed v1 page and old article slug", () => {
    const sources = LEGACY_REDIRECTS.map((r) => r.source);
    expect(sources).toEqual(
      expect.arrayContaining([
        "/dual-tasking", "/research", "/team", "/faq", "/contact", "/pricing",
        "/articles/improve-memory-after-50", "/articles/balance-after-50",
        "/articles/brain-plasticity-dual-tasking",
      ]),
    );
  });

  it("has no chains: no destination is itself a source", () => {
    const sources = new Set(LEGACY_REDIRECTS.map((r) => r.source));
    for (const r of LEGACY_REDIRECTS) expect(sources.has(r.destination.split("#")[0])).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (`Cannot find module '@/lib/redirects'`): `npx vitest run tests/unit/redirects.test.ts`

- [ ] **Step 3: Implement** `lib/redirects.ts`:

```ts
/**
 * v1 URLs that the v2 brief removed, mapped to where their content now lives.
 * Permanent: these URLs are in search results and in links people sent each
 * other on WhatsApp.
 *
 * PROTECTED_PATHS are registered in the App Store and Google Play listings
 * (account deletion is a store requirement). They must never appear as a
 * redirect source; tests/unit/redirects.test.ts enforces it.
 */
export const PROTECTED_PATHS = ["/delete-account", "/privacy-policy"] as const;

export const LEGACY_REDIRECTS = [
  { source: "/dual-tasking", destination: "/how-it-works" },
  { source: "/research", destination: "/about" },
  { source: "/team", destination: "/about" },
  { source: "/faq", destination: "/#faq" },
  { source: "/contact", destination: "/#lead" },
  { source: "/pricing", destination: "/payment" },
  { source: "/articles/improve-memory-after-50", destination: "/articles/memory-after-50" },
  { source: "/articles/balance-after-50", destination: "/articles/body-after-50" },
  { source: "/articles/brain-plasticity-dual-tasking", destination: "/articles/brain-and-movement" },
] as const;
```

`next.config.ts`, add inside `nextConfig`:

```ts
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
```

with `import { LEGACY_REDIRECTS } from "./lib/redirects";` at the top.

- [ ] **Step 4: Run, expect PASS**: `npx vitest run tests/unit/redirects.test.ts`

- [ ] **Step 5: Delete the removed pages**

```bash
git rm -r app/dual-tasking app/research app/team app/faq app/contact app/pricing
grep -rn '"/dual-tasking"\|"/research"\|"/team"\|"/faq"\|"/contact"\|"/pricing"' app components lib content
```

Expected grep output: only `lib/redirects.ts`. Fix any other hit by pointing it at the new route (e.g. `FaqSection`'s "לכל השאלות" button is removed in Task 7; the article page's `/contact` CTA becomes `/questionnaire` in Task 11).

- [ ] **Step 6: e2e redirect + legal test** `tests/e2e/redirects.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { LEGACY_REDIRECTS, PROTECTED_PATHS } from "../../lib/redirects";

for (const { source, destination } of LEGACY_REDIRECTS) {
  test(`${source} -> ${destination} (301)`, async ({ request }) => {
    const res = await request.get(source, { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain(destination);
  });
}

for (const path of PROTECTED_PATHS) {
  test(`${path} serves 200 with no redirect`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });
}

test("delete-account form is usable", async ({ page }) => {
  await page.goto("/delete-account");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="confirmation"]')).toBeVisible();
});
```

(Next.js emits 308 for `permanent: true`. The assertion accepts either 301 or 308.) Run the e2e tests in Task 12 together with the others, since they need a build.

- [ ] **Step 7: Commit**

```bash
git add -A lib/redirects.ts next.config.ts tests app
git commit -m "feat: redirect removed v1 pages, keep legal pages untouched

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Routes, constants and pricing math

`lib/constants.ts` already carries v2 `NAV`, `FIT_CHECK`, `PLANS`, `PLAN_INCLUDES` and `FEATURE_CARDS` (written during mockups). `FEATURE_CARDS[].image` still points at v1 images. Update them here.

**Files:**
- Create: `lib/routes.ts`, `lib/pricing.ts`, `tests/unit/routes.test.ts`, `tests/unit/pricing.test.ts`
- Modify: `lib/constants.ts` (images, `pending` field removed)

**Interfaces:**
- Produces: `SITE_ROUTES: readonly string[]`; `annualSavings(): number`; `installmentAmount(total: number, count: number): number`; `formatShekel(amount: number): string`

- [ ] **Step 1: Failing tests**

`tests/unit/pricing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { annualSavings, formatShekel, installmentAmount } from "@/lib/pricing";

describe("pricing", () => {
  it("computes the annual saving from the plan prices, not the brief's 600", () => {
    expect(annualSavings()).toBe(480);
  });
  it("splits 708 into installments rounded to agorot", () => {
    expect(installmentAmount(708, 1)).toBe(708);
    expect(installmentAmount(708, 12)).toBe(59);
    expect(installmentAmount(708, 7)).toBe(101.14);
  });
  it("rejects installment counts outside 1-12", () => {
    expect(() => installmentAmount(708, 0)).toThrow(RangeError);
    expect(() => installmentAmount(708, 13)).toThrow(RangeError);
    expect(() => installmentAmount(708, 2.5)).toThrow(RangeError);
  });
  it("formats shekels the Israeli way", () => {
    expect(formatShekel(708)).toBe("708 ₪");
    expect(formatShekel(101.14)).toBe("101.14 ₪");
    expect(formatShekel(1188)).toBe("1,188 ₪");
  });
});
```

`tests/unit/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FEATURE_CARDS, FIT_CHECK, NAV } from "@/lib/constants";
import { SITE_ROUTES } from "@/lib/routes";
import { ARTICLES } from "@/content/articles";

describe("routes", () => {
  it("contains the six brief pages, three explainers and both legal pages", () => {
    expect(SITE_ROUTES).toEqual(expect.arrayContaining([
      "/", "/about", "/how-it-works", "/questionnaire", "/payment", "/articles",
      "/personal-plan", "/motion-detection", "/progress",
      "/delete-account", "/privacy-policy",
    ]));
  });
  it("every nav link, card link and the fit check point at real routes", () => {
    const targets = [...NAV.map((n) => n.href), ...FEATURE_CARDS.map((c) => c.href), FIT_CHECK.href];
    for (const href of targets) expect(SITE_ROUTES).toContain(href);
  });
  it("article slugs are unique", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("every card image is a v2 client photo", () => {
    for (const card of FEATURE_CARDS) expect(card.image).toMatch(/^\/img\/v2\//);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**: `npm test`

- [ ] **Step 3: Implement**

`lib/pricing.ts`:

```ts
import { PLANS } from "@/lib/constants";

const MAX_INSTALLMENTS = 12;

const plan = (id: "annual" | "monthly") => {
  const found = PLANS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown plan: ${id}`);
  return found;
};

/** What a year of the monthly plan costs, minus the annual plan's one charge. */
export function annualSavings(): number {
  return plan("monthly").price * 12 - plan("annual").total;
}

/** Per-installment amount in shekels, rounded to agorot. */
export function installmentAmount(total: number, count: number): number {
  if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) {
    throw new RangeError(`Installments must be an integer 1-${MAX_INSTALLMENTS}, got ${count}`);
  }
  return Math.round((total / count) * 100) / 100;
}

const formatter = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

export function formatShekel(amount: number): string {
  return `${formatter.format(amount)} ₪`;
}
```

`lib/routes.ts`:

```ts
import { ARTICLES } from "@/content/articles";

/** Every page the site serves. Tests, the sitemap and the 404 page read it. */
export const SITE_ROUTES = [
  "/",
  "/about",
  "/how-it-works",
  "/questionnaire",
  "/payment",
  "/articles",
  ...ARTICLES.map((a) => `/articles/${a.slug}`),
  "/personal-plan",
  "/motion-detection",
  "/progress",
  "/privacy-policy",
  "/delete-account",
] as const;
```

`lib/constants.ts`: in `FEATURE_CARDS` set `image` to `/img/v2/card-personal-plan.webp`, `/img/v2/card-motion.webp`, `/img/v2/card-progress.webp`. Set `alt` to the three alts in `.impeccable/mocks/site/home.html` lines 151-185, and delete every `pending` field. In `PLANS` set `image` to `/img/v2/plan-annual.webp` and `/img/v2/plan-monthly.webp`, `alt: ""` for both (decorative; the plan name is the heading). Rename `PLANS[].name` to `"שנתי"` / `"חודשי"` and add `longName: "מנוי שנתי"` / `"מנוי חודשי"` (the teaser uses the short name on the photo, the payment page uses the long one). Replace `note: "חיסכון של 480 ₪"` with a computed value in the components: `` `חיסכון של ${formatShekel(annualSavings())}` ``. Delete `note` from the type. Remove the stale `PARTNERS` export if `grep -rn "PARTNERS" app components` shows no importer (PartnersBand keeps its own list).

- [ ] **Step 4: Run, expect PASS**: `npm test`. Note that `/questionnaire` is in `SITE_ROUTES` before the page exists. Plan 2 builds it, and the roadmap ships plans 1 and 2 together.

- [ ] **Step 5: Commit** `feat: add route list and pricing math, point cards at client photos`

---

### Task 4: Wider layout system and site chrome

The user rejected the 1240px shell on desktop. Port the mockup scale (`.impeccable/mocks/site/mocks.css` `:root` and `.shell` rules).

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`, `components/ui/Section.tsx`, `components/layout/Header.tsx`, `components/layout/Footer.tsx`, `app/layout.tsx`, `app/sitemap.ts`, `app/not-found.tsx`
- Create: `tests/e2e/chrome.spec.ts`

- [ ] **Step 1: Tokens**

`tailwind.config.ts`:
- `maxWidth.shell: "1520px"`, add `maxWidth.narrow: "1080px"`
- `fontSize.base: ["clamp(1.125rem, 1rem + 0.25vw, 1.3125rem)", { lineHeight: "1.65" }]`
- `fontSize.lead: ["clamp(1.25rem, 1.05rem + 0.6vw, 1.625rem)", { lineHeight: "1.55" }]`
- `fontSize.h3: ["clamp(1.375rem, 1.15rem + 0.7vw, 1.875rem)", ...]`, `h2: ["clamp(1.875rem, 1.3rem + 2vw, 3.75rem)", ...]`, `h1: ["clamp(2.125rem, 1.4rem + 3.6vw, 5.5rem)", ...]`

`app/globals.css` `:root`: `--gutter: clamp(1.25rem, 4vw, 4.5rem);`.

`components/ui/Section.tsx` `Shell`: `const max = width === "narrow" ? "max-w-narrow" : "max-w-shell";`

- [ ] **Step 2: Header** (`components/layout/Header.tsx`)
- Delete `const PRIMARY = NAV.filter(...)`. The desktop `<ul>` maps `NAV` (4 items).
- Replace the "דברו איתנו" `Button` (desktop) with `<Button href={FIT_CHECK.href} className="whitespace-nowrap">{FIT_CHECK.label}</Button>`. Keep it visible at every width (remove `hidden sm:inline-flex`); below 420px use `px-4 text-[1.0625rem]` (mockup `mocks.css` lines for `.header-end .btn`).
- Drawer: delete the hard-coded extra "מאמרים" `<li>` (NAV now includes `/articles`); the drawer CTA becomes `FIT_CHECK` too; keep the phone block.
- Import `FIT_CHECK` from `@/lib/constants`.

- [ ] **Step 3: Footer** (`components/layout/Footer.tsx`)
- Delete the hard-coded "מאמרים" `<li>`. After `NAV.map`, add one `<li>` linking `FIT_CHECK`.
- Keep `LEGAL` exactly as is (`/privacy-policy`, `/delete-account`).

- [ ] **Step 4: Layout, sitemap, 404**
- `app/layout.tsx`: delete `DIRECTION_CONTRACT` and the `<div hidden dangerouslySetInnerHTML=...>` line (a development contract must not ship in page HTML). Update `metadata.description` to the new hero line: "תוכנית אישית לאימון הגוף וחדות המחשבה. רק 10 דקות ביום כדי להישאר פעילים, חדים ובטוחים יותר."
- `app/sitemap.ts`: build from `SITE_ROUTES`. Priority 1 for `/`, 0.8 for the six pages, 0.6 for articles/explainers, 0.3 for the two legal pages. Include `/payment`; exclude `/questionnaire` (plan 2 marks it `noindex`, and a sitemap must not list noindex pages). Do not exclude the legal pages.
- `app/not-found.tsx`: keep using `NAV`.

- [ ] **Step 5: e2e** `tests/e2e/chrome.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("fit check button is one line and visible", async ({ page }) => {
  await page.goto("/");
  const cta = page.getByRole("banner").getByRole("link", { name: "בדיקת התאמה" });
  await expect(cta).toBeVisible();
  const box = await cta.boundingBox();
  expect(box!.height).toBeLessThan(64); // one line at 52-60px, two lines would be ~90
  await expect(cta).toHaveAttribute("href", "/questionnaire");
});

test("footer links both legal pages", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "מחיקת חשבון" })).toHaveAttribute("href", "/delete-account");
  await expect(footer.getByRole("link", { name: "מדיניות פרטיות" })).toHaveAttribute("href", "/privacy-policy");
});

test("no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("sitemap lists the delete-account page", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/delete-account");
  expect(xml).toContain("/privacy-policy");
});
```

- [ ] **Step 6: Typecheck** `npm run typecheck`. Header/Footer errors gone.

- [ ] **Step 7: Commit** `feat: widen layout system and rebuild header and footer for v2 nav`

---

### Task 5: Home content module and the first three sections

**Files:**
- Create: `content/home.ts`, `tests/unit/home-content.test.ts`, `components/home/ClientsRing.tsx`
- Modify: `components/home/Hero.tsx`, `components/home/Intro.tsx`
- Delete: `components/home/ChoosingDaily.tsx`, `components/home/ResearchStrip.tsx`, `components/ui/ArcStage.tsx` (after grep confirms no other importer)

**Interfaces:**
- Produces: `WHAT_MATTERS: { title: string; body: string }[]` (3), `TESTIMONIALS: { name: string; source: "google" | "facebook"; quote: string }[]` (6), `FAQ: QA[]` (13; replaces the export in `content/pages.ts`, keep the `QA` type there and re-export)

- [ ] **Step 1: Failing content test** `tests/unit/home-content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FAQ, TESTIMONIALS, WHAT_MATTERS } from "@/content/home";

describe("home content", () => {
  it("has the brief's three 'what matters' items", () => {
    expect(WHAT_MATTERS.map((w) => w.title)).toEqual([
      "שתמשיכו לעשות את מה שאתם אוהבים",
      "שתשמרו על חדות המחשבה",
      "לחיות טוב יותר, בכל יום",
    ]);
  });
  it("has six testimonials, each from google or facebook, none empty", () => {
    expect(TESTIMONIALS).toHaveLength(6);
    for (const t of TESTIMONIALS) {
      expect(["google", "facebook"]).toContain(t.source);
      expect(t.quote.length).toBeGreaterThan(40);
    }
  });
  it("has 13 FAQ items starting with 'מה זה פעילים+?' and ending with 'איך מתחילים?'", () => {
    expect(FAQ).toHaveLength(13);
    expect(FAQ[0].q).toBe("מה זה פעילים+?");
    expect(FAQ.at(-1)!.q).toBe("איך מתחילים?");
  });
  it("contains no RTL control characters left over from the PDF", () => {
    const all = JSON.stringify({ FAQ, TESTIMONIALS, WHAT_MATTERS });
    expect(all).not.toMatch(/[​‎‏‪-‮]/);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: `content/home.ts`**. Copy the text verbatim from `.impeccable/mocks/site/home.html`: `WHAT_MATTERS` from lines 124-149 (`<h3>` = title, `<p>` = body), `TESTIMONIALS` from lines 200-219 (name, source by the `ביקורת בגוגל`/`ביקורת בפייסבוק` label, quote without the surrounding ״), `FAQ` from lines 248-269 (13 `<summary>`/`<p>` pairs). Shape:

```ts
import type { QA } from "@/content/pages";

export type Testimonial = { name: string; source: "google" | "facebook"; quote: string };

export const WHAT_MATTERS = [
  { title: "שתמשיכו לעשות את מה שאתם אוהבים", body: "לנוע, לצאת, לטייל, לבלות עם המשפחה ולחיות חיים פעילים, עצמאיים ומהנים יותר." },
  // ...the other two, verbatim from the mockup
] as const;

export const TESTIMONIALS: readonly Testimonial[] = [
  { name: "אורלי אזולאי", source: "google", quote: "אני מאוד נהנית מפעילים+. ..." },
  // ...five more, verbatim
];

export const FAQ: readonly QA[] = [
  { q: "מה זה פעילים+?", a: "פעילים+ היא תוכנית אישית לאימון הגוף והמוח. ..." },
  // ...twelve more, verbatim
];
```

In `content/pages.ts` delete the old `FAQ` array and `RESEARCH`, `DUAL_TASKING` and `TEAM` exports once nothing imports them (`grep -rn "from \"@/content/pages\"" app components`). Keep `QA`, `TeamMember`, `ABOUT` (rewritten in Task 10).

- [ ] **Step 4: Hero** (`components/home/Hero.tsx`, mockup lines 78-93)
- Replace `<Image src="/img/hero.webp" ...>` with:

```tsx
<video
  className="absolute inset-0 -z-20 h-full w-full object-cover motion-reduce:hidden"
  autoPlay muted loop playsInline preload="metadata"
  poster="/img/v2/hero-poster.webp"
  aria-hidden="true"
>
  <source src="/video/hero.mp4" type="video/mp4" />
</video>
<Image src="/img/v2/hero-poster.webp" alt="" fill priority sizes="100vw"
  className="-z-30 object-cover" />
```

  (The image sits under the video: it is the LCP element and the reduced-motion fallback.)
- h1: `<span className="block">תוכנית אישית לאימון הגוף</span><span className="block text-[#5fd3ff]">וחדות המחשבה</span>`; `max-w-[18ch]`.
- Sub-line: "רק 10 דקות ביום כדי להישאר פעילים, חדים ובטוחים יותר."
- Actions: only the onColor button "בואו לראות איך זה עובד" with `PlayIcon`, `href="/how-it-works"`. Delete the "השארת פרטים" button (the brief lists one CTA).
- Update the file's header comment to describe the video, and delete the outdated reference to השארת פרטים in the height comment.

- [ ] **Step 5: ClientsRing** `components/home/ClientsRing.tsx` (mockup lines 95-103 and the `.clients*` styles at the top of `home.html`):

```tsx
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";

const LINE = "אלפי לקוחות מידי יום בוחרים להשקיע בעצמם ולשפר את איכות החיים";

/**
 * The client's own ring of portraits, with their line set in its open centre.
 * The edges fade so the artwork's own background never meets the page in a
 * hard rectangle. Below sm the centre is too small for the line, so it drops
 * under the picture.
 */
export default function ClientsRing() {
  return (
    <section aria-labelledby="clients-heading" className="bg-surface pb-[clamp(2rem,4vw,3.5rem)] pt-[clamp(1.5rem,3vw,3rem)]">
      <Shell>
        <Reveal className="relative mx-auto max-w-[1040px]">
          <Image
            src="/img/v2/clients-arc.webp" alt="" width={1447} height={1087}
            sizes="(max-width: 1100px) 92vw, 1040px"
            className="h-auto w-full [mask-image:radial-gradient(ellipse_72%_70%_at_50%_50%,#000_62%,transparent_100%)]"
          />
          <p
            id="clients-heading"
            className="mt-4 text-center font-display text-[clamp(1.25rem,0.8rem+1.7vw,2.5rem)] font-bold leading-snug text-ink [text-wrap:balance] sm:absolute sm:inset-0 sm:m-auto sm:h-fit sm:w-[min(52%,30ch)]"
          >
            {LINE}
          </p>
        </Reveal>
      </Shell>
    </section>
  );
}
```

- [ ] **Step 6: Intro** (`components/home/Intro.tsx`, mockup lines 105-121)
- Replace the three-screen `SCREENS` cluster with one `<Image src="/img/v2/devices.webp" width={1536} height={864} alt="טלפון וטאבלט עם מסכי האימון וההתקדמות של פעילים+" sizes="(max-width: 1024px) 92vw, 46vw" className="h-auto w-full" />`. Delete `SCREENS` and its comment.
- Replace the h2 + lede with the single lead paragraph (mockup line ~113, the "פעילים+ היא פלטפורמה אישית..." text) at `text-[clamp(1.375rem,1.15rem+1vw,1.875rem)] leading-[1.45] text-ink`. `55+` stays in `<span dir="ltr">`.
- Button: primary `lg`, `href={FIT_CHECK.href}`, label `FIT_CHECK.label`, with `ArrowIcon`.
- Keep `id="how-it-works"`? No: rename the section id to `intro`. The hero now links to `/how-it-works` (Step 4).

- [ ] **Step 7: Run** `npm test` (PASS) and `npm run typecheck`.

- [ ] **Step 8: Commit** `feat: home hero video, clients ring and devices intro`

---

### Task 6: "What matters" and the three cards

**Files:**
- Create: `components/home/WhatMatters.tsx`
- Modify: `components/home/FeatureCards.tsx`

- [ ] **Step 1: WhatMatters** (mockup lines 123-148; reference: hingehealth.com "Less pain, more living"). A client component. The active item advances every 6s, pauses on hover/focus, and does not auto-advance under `prefers-reduced-motion`. Clicking an item makes it active. The image beside it is a labeled placeholder until the client sends the three photos, so keep a typed `image?: string` per item and render a `<div role="img" aria-label=...>` placeholder when it is absent.

```tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { CheckIcon } from "@/components/ui/icons";
import { WHAT_MATTERS } from "@/content/home";

const ROTATE_MS = 6000;

export default function WhatMatters() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % WHAT_MATTERS.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const item = WHAT_MATTERS[active];

  return (
    <section aria-labelledby="matters-heading" className="bg-sunken py-[var(--section-y)]">
      <Shell>
        <h2 id="matters-heading" className="text-h2 font-display font-black">מה חשוב לנו?</h2>
        <div
          className="mt-12 grid items-center gap-12 lg:grid-cols-2"
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}
        >
          <ul className="space-y-3">
            {WHAT_MATTERS.map((w, i) => (
              <li key={w.title}>
                <button
                  type="button" aria-pressed={i === active} onClick={() => setActive(i)}
                  className="grid w-full grid-cols-[auto_1fr] gap-4 rounded-[20px] p-4 text-start transition-colors hover:bg-surface"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-deep ${i === active ? "bg-green-deep text-white" : "text-green-deep"}`}>
                    <CheckIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-h3 font-display font-bold">{w.title}</span>
                    <span className="mt-1 block text-ink-soft">{w.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Reveal>
            {"image" in item && item.image ? (
              <Image src={item.image} alt="" width={1200} height={900} className="h-auto w-full rounded-[22px] shadow-lift-2" />
            ) : (
              <div role="img" aria-label={item.title} className="flex aspect-[4/3] items-center justify-center rounded-[22px] bg-surface text-ink-faint shadow-lift-1">
                {item.title}
              </div>
            )}
          </Reveal>
        </div>
      </Shell>
    </section>
  );
}
```

Add `image?: string` to the `WHAT_MATTERS` element type in `content/home.ts` (no values yet).

- [ ] **Step 2: FeatureCards** (mockup lines 150-198; reference: hingehealth.com "Specialized care, built around you")
- Heading: "מעטפת מקצועית במיוחד בשבילכם", `max-w-[18ch]`.
- Card width: `w-[min(88vw,620px)] lg:w-[min(76vw,1280px)]`; image min-height `lg:min-h-[clamp(280px,26vw,460px)]`.
- The action is a `Link` to `card.href` with the label "תראו לי עוד" (constant, not per card). Delete `cta` from `FEATURE_CARDS` in `lib/constants.ts`.
- After the progress bar, a centred primary `lg` `Button` to `FIT_CHECK.href` labeled "לבדיקת התאמה".
- The `FIELD`/`ACTION`/`SOFT` maps already cover purple/blue/green; delete the `burgundy` entries only if `Tone` no longer needs them elsewhere (PageHero still uses burgundy, so keep the `Tone` type).

- [ ] **Step 3: Typecheck, then visual check** against mockup at 1440 and 390 (`npm run dev -- -p 3100`, open `/`).

- [ ] **Step 4: Commit** `feat: what-matters rotator and three-card carousel with explainer links`

---

### Task 7: Reviews, partners, lead form, FAQ, plans teaser; assemble home

**Files:**
- Create: `components/home/Testimonials.tsx`, `components/sections/PlansTeaser.tsx`
- Modify: `components/home/PartnersBand.tsx`, `components/forms/LeadForm.tsx`, `components/sections/LeadSection.tsx`, `components/sections/FaqSection.tsx`, `app/page.tsx`
- Delete: `components/sections/Pricing.tsx`

- [ ] **Step 1: Testimonials** (mockup lines 200-218; reference: effectivate.co.il "ממליצים עלינו"). Reuse the FeatureCards carousel mechanics: scroll-snap track, two 56px arrow buttons, `IntersectionObserver` index. Extract the shared hook first:

`components/ui/useSnapCarousel.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Scroll-snap carousel state: which child is most visible, and goTo(index). */
export function useSnapCarousel<T extends HTMLElement>(count: number) {
  const trackRef = useRef<T>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(next, count - 1));
    (track.children[clamped] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setIndex(clamped);
  }, [count]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver((entries) => {
      const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!best) return;
      const i = Array.from(track.children).indexOf(best.target);
      if (i >= 0) setIndex(i);
    }, { root: track, threshold: 0.6 });
    Array.from(track.children).forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return { trackRef, index, goTo };
}
```

Refactor `FeatureCards` to use it (behavior unchanged), then build `Testimonials` on it: heading "מה אומרים הלקוחות שלנו", cards `w-[min(84vw,600px)]`, white, `rounded-[24px]`, `shadow-lift-1`, name in `font-display text-h3 font-bold`, the source as text "ביקורת בגוגל" / "ביקורת בפייסבוק" (no third-party logo images), the quote in a `<blockquote>`. No star ratings (none were supplied). Leave a code comment that 3-4 testimonial videos are pending per the brief.

- [ ] **Step 2: PartnersBand**: heading text "עובדים איתנו" -> "שיתופי פעולה". Nothing else changes (the user asked to keep the marquee).

- [ ] **Step 3: LeadForm / LeadSection**
- `LeadForm`: add prop `withEmail?: boolean` (default `true`). When `false`, the email field block is not rendered and the phone field takes `sm:col-span-1`. `lib/leads.ts` already treats email as optional, so the server needs no change.
- `LeadSection` defaults: `heading = "השאירו פרטים ונחזור אליכם לתיאום"`, and pass `withEmail={false}` from the home page only.

- [ ] **Step 4: FaqSection**: import `FAQ` from `@/content/home`. Heading default "שאלות ותשובות". Delete `limit` and `showMore` (the `/faq` page is gone). Keep `id="faq"` (the `/faq` redirect targets it).

- [ ] **Step 5: PlansTeaser** (mockup lines 270-296): port the old `Pricing` photo-card markup (two cards, annual featured with a `ring-2 ring-blue-deep`, the savings badge in yellow on ink), with:
- heading "המסלול שמתאים בדיוק בשבילך", lede "הכנו בעבורכם 2 מסלולים כדי שאתם תוכלו להחליט מה מתאים לכם."
- price line `${plan.price} ₪` + "לחודש", terms line `plan.terms`
- badge `` `חיסכון של ${formatShekel(annualSavings())}` `` on the annual card only
- both buttons "לבחירת מסלולים" -> `/payment` (annual primary, monthly outline)
- no "what's included" block and no store links (the payment page owns those).

Then `git rm components/sections/Pricing.tsx`.

- [ ] **Step 6: Assemble `app/page.tsx`**:

```tsx
import Hero from "@/components/home/Hero";
import ClientsRing from "@/components/home/ClientsRing";
import Intro from "@/components/home/Intro";
import WhatMatters from "@/components/home/WhatMatters";
import FeatureCards from "@/components/home/FeatureCards";
import Testimonials from "@/components/home/Testimonials";
import PartnersBand from "@/components/home/PartnersBand";
import LeadSection from "@/components/sections/LeadSection";
import FaqSection from "@/components/sections/FaqSection";
import PlansTeaser from "@/components/sections/PlansTeaser";

/** Section order is the client's v2 brief ("עמוד הבית פעילים פלוס"), top to bottom. */
export default function Home() {
  return (
    <>
      <Hero />
      <ClientsRing />
      <Intro />
      <WhatMatters />
      <FeatureCards />
      <Testimonials />
      <PartnersBand />
      <LeadSection source="home" withEmail={false} />
      <FaqSection />
      <PlansTeaser />
    </>
  );
}
```

`LeadSection` needs a `withEmail` prop forwarded to `LeadForm`.

- [ ] **Step 7: e2e** `tests/e2e/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("home has every brief section in order", async ({ page }) => {
  await page.goto("/");
  const headings = await page.locator("main h2").allInnerTexts();
  const order = ["מה חשוב לנו?", "מעטפת מקצועית במיוחד בשבילכם", "מה אומרים הלקוחות שלנו", "שיתופי פעולה", "השאירו פרטים ונחזור אליכם לתיאום", "שאלות ותשובות", "המסלול שמתאים בדיוק בשבילך"];
  const positions = order.map((h) => headings.findIndex((x) => x.includes(h)));
  expect(positions.every((p) => p >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

test("lead form asks for name and phone only", async ({ page }) => {
  await page.goto("/");
  const form = page.locator("#lead form");
  await expect(form.locator('input[name="fullName"]')).toBeVisible();
  await expect(form.locator('input[name="phone"]')).toBeVisible();
  await expect(form.locator('input[name="email"]')).toHaveCount(0);
});

test("each card opens its explainer", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.getByRole("link", { name: "תראו לי עוד" }).evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs).toEqual(["/personal-plan", "/motion-detection", "/progress"]);
});
```

- [ ] **Step 8: Commit** `feat: reviews, partners, lead, faq and plans teaser; assemble v2 home`

---

### Task 8: The three card explainer pages

**Files:**
- Create: `content/explainers.ts`, `app/personal-plan/page.tsx`, `app/motion-detection/page.tsx`, `app/progress/page.tsx`, `components/explainers/BackLink.tsx`, `components/explainers/FitCheckClose.tsx`, `tests/unit/explainers.test.ts`

**Interfaces:**
- Produces: `PERSONAL_PLAN`, `MOTION_DETECTION`, `PROGRESS` typed content objects (shapes below)

- [ ] **Step 1: Failing test** `tests/unit/explainers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MOTION_DETECTION, PERSONAL_PLAN, PROGRESS } from "@/content/explainers";

describe("explainers", () => {
  it("titles match the brief", () => {
    expect(PERSONAL_PLAN.title).toBe("תוכנית אישית שמתקדמת יחד איתכם");
    expect(MOTION_DETECTION.title).toBe("המערכת שרואה איך אתם באמת מתאמנים");
    expect(PROGRESS.title).toBe("כשאפשר לראות את ההתקדמות, אפשר להתאמן בצורה חכמה יותר");
  });
  it("each ends with the fit-check action", () => {
    for (const page of [PERSONAL_PLAN, MOTION_DETECTION, PROGRESS]) {
      expect(page.cta).toBe("בדקו איזו תוכנית מתאימה לכם");
    }
  });
  it("the body/mind pairs are both present", () => {
    expect(PERSONAL_PLAN.pair.map((p) => p.label)).toEqual(["בגוף", "במוח"]);
    expect(PROGRESS.pair.map((p) => p.label)).toEqual(["בתנועה", "בחשיבה"]);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: `content/explainers.ts`**: copy text verbatim from the mockups (`personal-plan.html` lines 122-238, `motion-detection.html` 118-209, `progress.html` 122-243). Shapes:

```ts
type Pair = { label: string; body: string };

export const PERSONAL_PLAN = {
  title: "תוכנית אישית שמתקדמת יחד איתכם",
  lede: "כל אחד מתחיל מנקודה אחרת — ולכן גם התוכנית שלכם צריכה להתחיל במקום שמתאים לכם.",
  start: ["בפעילים+ מתחילים בשאלון קצר שמכיר את היכולות, המטרות וההרגלים שלכם.", "על בסיס התשובות, המערכת בונה עבורכם תוכנית אישית לאימון הגוף והמוח."],
  pivot: { heading: "אבל ההתאמה לא נעצרת שם.", body: "אחרי כל אימון, המערכת מנתחת את הביצועים שלכם ומתאימה את האימון הבא בהתאם להתקדמות." },
  pair: [{ label: "בגוף", body: "..." }, { label: "במוח", body: "..." }] as Pair[],
  rule: { up: "אם משהו הופך קל מדי — רמת האתגר עולה.", down: "אם משהו קשה מדי — המערכת מתאימה את הקושי." },
  result: { kicker: "התוצאה?", statement: "תוכנית שלא נשארת קבועה בזמן שאתם משתנים.", body: "..." },
  cta: "בדקו איזו תוכנית מתאימה לכם",
} as const;
// MOTION_DETECTION: { title, lede, image, pivotHeading, checks, example, steps: string[], emphasis, precise, closing, cta }
// PROGRESS: { title, lede, tracked, notJustCount, strengths: { heading, intro: string[], ifs: string[], goal }, pair: Pair[], pairOutro, beats: { heading, body: string[] }, final: { heading, body, question }, cta }
```

Fill every `...` from the mockup source. Every string comes from the brief.

- [ ] **Step 4: Shared pieces**
- `BackLink`: `Link` to `/` labeled "חזרה לעמוד הבית" with `ArrowBackIcon` (points right in RTL), `min-h-[48px]`.
- `FitCheckClose`: props `{ heading?: string; body?: string; tone: "purple" | "blue" | "green"; cta: string }`, a full-width colour card ending in a `Button` to `FIT_CHECK.href`. Purple uses the light wash + filled `purple-deep` button (DESIGN.md "Inverted Action Exception"); blue/green use the field colour + white button.

- [ ] **Step 5: Pages**: port each mockup's sections in order into server components using `PageHero` (extend `PageHero` with an optional `back?: ReactNode` slot rendered above the h1, used for `BackLink`), `Section`/`Shell`, `Reveal`, `Image`. Images: motion-detection hero `/img/v2/card-motion.webp` (1536x1024), progress focal `/img/v2/card-progress.webp` (1600x900). `metadata` per page: title = page title, description = lede. Each page's three distinct closes (lavender panel, blue card, green band) must stay distinct, not one template recoloured.

- [ ] **Step 6: Run** `npm test`, `npm run typecheck`; check each page at 390 and 1440 against its mockup.

- [ ] **Step 7: Commit** `feat: personal-plan, motion-detection and progress explainer pages`

---

### Task 9: How it works

**Files:**
- Create: `content/how-it-works.ts`, `app/how-it-works/page.tsx`, `components/how/Steps.tsx`, `components/how/Challenges.tsx`, `tests/unit/how-it-works.test.ts`

- [ ] **Step 1: Failing test**:

```ts
import { describe, expect, it } from "vitest";
import { HOW } from "@/content/how-it-works";

describe("how it works", () => {
  it("has four ordered steps", () => {
    expect(HOW.steps.map((s) => s.title)).toEqual(["עונים על כמה שאלות", "מקבלים תוכנית אישית", "מתאמנים כ־10 דקות ביום", "רואים את ההתקדמות"]);
  });
  it("has the three challenges", () => {
    expect(HOW.challenges.items.map((c) => c.title)).toEqual(["אתגר הגוף החזק", "אתגר שיווי המשקל", "אתגר המוח החד"]);
  });
  it("names both professionals with photos", () => {
    expect(HOW.pros.people.map((p) => [p.name, p.photo])).toEqual([
      ["גדי בן שטרית", "/img/v2/team-gadi.webp"],
      ["דניאל שפיר", "/img/v2/team-daniel.webp"],
    ]);
  });
});
```

- [ ] **Step 2: FAIL. Step 3: content** from `how-it-works.html` lines 175-330, verbatim. Shape `HOW = { hero: { title, sub, cta }, intro: { heading, body: string[] }, steps: { n: "01"|"02"|"03"|"04"; title; body }[], dual: { heading, body: string[], examples: [string, string, string][], definition, outro }, daily: { heading, lede, body: string[] }, progress: { heading, lede, body: string[] }, challenges: { heading, lede, body, items: { title; body; tone }[], outro }, pros: { heading, body: string[], people: { name; role; photo }[] }, close: { heading, body: string[], strong, cta } }`.

- [ ] **Step 4: Page.** Hero: the same rounded dark card as home's `Hero`, but its background is a solid `#08222f` field until the client sends the hero photo; add `image?: string` to `HOW.hero` and render it when present. The steps track: horizontal with a connecting hairline at `lg`, stacked with a vertical line below (`components/how/Steps.tsx`). Progress section: `/img/v2/devices.webp` as the focal image (it shows the cognitive measures the copy describes). Daily: `/img/app-workout.webp`. Kitchen photo: render the section without an image until it arrives, but keep the `image?: string` field. Challenges: three colour-field cards blue/green/purple-wash. Pros: square photos `object-[50%_25%]`. Close: blue `cta-band` with white button to `FIT_CHECK.href`, label "בדקו מה מתאים לכם".

- [ ] **Step 5: Test, typecheck, visual check, commit** `feat: how-it-works page`

---

### Task 10: About

**Files:**
- Modify: `content/pages.ts` (`ABOUT`, `TEAM`), `app/about/page.tsx`
- Create: `tests/unit/about.test.ts`

- [ ] **Step 1: Failing test**:

```ts
import { describe, expect, it } from "vitest";
import { ABOUT, TEAM } from "@/content/pages";

describe("about", () => {
  it("opens with the personal story", () => {
    expect(ABOUT.title).toBe("הרעיון התחיל מסיפור אישי");
  });
  it("has the three team members with v2 portraits", () => {
    expect(TEAM.map((m) => [m.name, m.photo])).toEqual([
      ["גדי בן שטרית", "/img/v2/team-gadi.webp"],
      ["דניאל שפיר", "/img/v2/team-daniel.webp"],
      ["מידד גולן", "/img/v2/team-meidad.webp"],
    ]);
  });
});
```

- [ ] **Step 2: FAIL. Step 3: content.** Rewrite `ABOUT` as `{ title, lede, story: string[], pullQuote, middle: { heading, body: string[], closer }, born: { heading, body: string[], vision, cta }, measure: { heading, body: string[], line, cta } }` from `about.html` lines 117-216, verbatim. `TeamMember` becomes `{ name: string; role: string; bio: string; photo: string }`.

- [ ] **Step 4: Page** in the mockup order: `PageHero` blue -> story with `/img/about.webp` (sticky on `lg`) and the pull-quote -> sunken "היה חסר משהו באמצע" -> "מכאן נולדה פעילים+" with the green-wash vision panel and the primary button to `FIT_CHECK.href` ("מתחילים עם פעילים+") -> sunken "התקדמות ומדידה" with `/img/v2/progress-woman.webp` and the button "מתחילים עכשיו" -> team (3 columns at `lg`, compact rows on mobile) -> `<FaqSection />`. Drop the old `LeadSection` from About (not in the brief).

- [ ] **Step 5: Test, typecheck, visual check, commit** `feat: about page with story, progress and team`

---

### Task 11: Articles and the phase-1 payment page

**Files:**
- Modify: `app/articles/page.tsx`, `app/articles/[slug]/page.tsx`
- Create: `content/article-media.ts`, `components/articles/ArticlesStrip.tsx`, `app/payment/page.tsx`, `components/payment/PlanSelector.tsx`, `components/payment/StoreFallback.tsx`, `tests/unit/article-media.test.ts`

**Interfaces:**
- Produces: `ARTICLE_MEDIA: Record<string, { cover: string; inner?: string; innerAlt?: string }>`; `<ArticlesStrip />` (used by `/payment`); `<PlanSelector onContinue={() => void} />` (plan 3 reuses it); `WEB_CHECKOUT_ENABLED: boolean` from `process.env.NEXT_PUBLIC_WEB_CHECKOUT === "true"`

- [ ] **Step 1: Failing test** `tests/unit/article-media.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ARTICLES } from "@/content/articles";
import { ARTICLE_MEDIA } from "@/content/article-media";

describe("article media", () => {
  it("every article has a v2 cover and nothing else is mapped", () => {
    expect(Object.keys(ARTICLE_MEDIA).sort()).toEqual(ARTICLES.map((a) => a.slug).sort());
    for (const m of Object.values(ARTICLE_MEDIA)) expect(m.cover).toMatch(/^\/img\/v2\//);
  });
});
```

- [ ] **Step 2: FAIL. Step 3:** `content/article-media.ts`:

```ts
export const ARTICLE_MEDIA: Record<string, { cover: string; inner?: string; innerAlt?: string }> = {
  "body-after-50": { cover: "/img/v2/article-body-cover.webp", inner: "/img/v2/article-body-inner.webp", innerAlt: "אישה עולה במדרגות ברחוב, נעזרת במעקה" },
  "memory-after-50": { cover: "/img/v2/article-memory-cover.webp", inner: "/img/v2/article-memory-inner.webp", innerAlt: "מבוגרים מבצעים תנועה ומשימת חשיבה באותו זמן" },
  "brain-and-movement": { cover: "/img/v2/article-brain-cover.webp", inner: "/img/v2/article-brain-inner.webp", innerAlt: "איור של מוח ושל אישה רצה, עם מסלולי העצבים ביניהם" },
};
```

- [ ] **Step 4: Articles index** (mockup `articles.html`): lead card for `ARTICLES[0]` on the burgundy field overlapping the hero, two smaller white cards, closing blue `cta-band` "רוצים לראות איך פעילים+ יכולה להתאים גם לכם?" -> `FIT_CHECK`. Delete `LeadSection` and the `COVER` array.

- [ ] **Step 5: Article page** (mockup `article.html`): delete the `COVER` map; read `ARTICLE_MEDIA[slug]`. Hero on the full shell (`h1` up to 24ch, `clamp(2rem,1.3rem+2.6vw,4.25rem)`), cover overlapping the hero, body grid `minmax(0,1fr) 360px` at `xl` with the sticky burgundy-wash rail ("כ־10 דקות ביום, מהבית ובקצב שמתאים לך.", the fit-check button, links to the other two articles). Insert the inner image as a `<figure>` before the article's second `h2` block. Change the in-article CTA from `/contact` to `FIT_CHECK.href`, label "לבדיקת התאמה". Delete `LeadSection` here too. Keep `generateStaticParams`/`generateMetadata`; `notFound()` for unknown slugs stays.

- [ ] **Step 6: Payment page, phase 1** (mockup `payment.html` lines 193-247 and 378-392):
- `PlanSelector` (client): two radio cards in a `role="radiogroup"` with `aria-labelledby`, annual selected by default, arrow keys move selection (native `<input type="radio">` with visually styled labels gives this for free). Annual shows `59 ₪ לחודש`, `סה״כ 59 ₪ × 12 חודשים = 708 ₪ לשנה`, and the savings badge; monthly shows `99 ₪ לחודש` and `PLANS[1].terms`. Below: `PLAN_INCLUDES` with green checks, and the payment-method pills (Bit, Apple Pay, Google Pay, Visa, Mastercard as text). A primary `lg` button "המשך לרכישה" calls `onContinue`.
- `app/payment/page.tsx`: heading "חיים פעילים יותר, חיים טובים יותר." and sub-heading "התוכנית האישית שלך". When `WEB_CHECKOUT_ENABLED` is false, `onContinue` scrolls to `<StoreFallback />`: "ההרשמה והתשלום מתבצעים כרגע באפליקציה" + App Store / Google Play buttons (`STORE_IOS`, `STORE_ANDROID`). Plan 3 replaces the fallback with the checkout.
- `ArticlesStrip`: heading "מאמרים", "לכל המאמרים" link, three cards from `ARTICLES` + `ARTICLE_MEDIA[slug].cover`.
- Because `PlanSelector` needs a client callback, wrap the selector + fallback in a small client component `components/payment/PaymentFlow.tsx` that owns `selectedPlan` state. Plan 3 extends this file.

- [ ] **Step 7: Run** `npm test` (all unit tests PASS), `npm run typecheck`, `npm run lint`.

- [ ] **Step 8: Commit** `feat: v2 articles with client imagery and phase-1 payment page`

---

### Task 12: Verification, accessibility and design finish

**Files:**
- Create: `tests/e2e/pages.spec.ts`, `tests/e2e/a11y.spec.ts`
- Modify: `PRODUCT.md`, `DESIGN.md` (through the impeccable documenter)

- [ ] **Step 1: Every route renders** `tests/e2e/pages.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { SITE_ROUTES } from "../../lib/routes";

for (const route of SITE_ROUTES.filter((r) => r !== "/questionnaire")) {
  test(`${route} renders without overflow`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
```

(`/questionnaire` is covered by plan 2's tests.)

- [ ] **Step 2: a11y** `tests/e2e/a11y.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/", "/about", "/how-it-works", "/payment", "/articles", "/articles/body-after-50", "/personal-plan", "/delete-account"]) {
  test(`${route} has no serious axe violations`, async ({ page }) => {
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""))).toEqual([]);
  });
}
```

- [ ] **Step 3: Run the whole suite**: `npm test && npm run typecheck && npm run lint && npm run test:e2e`. All PASS. Fix failures in the owning component, not in the test.

- [ ] **Step 4: Screenshots** at 390, 1440 and 1920 for `/`, `/how-it-works`, `/payment`, `/articles/body-after-50` into `.impeccable/review/`. Compare with the mockups. 1920 must not show a narrow centre column (Review Focus 4).

- [ ] **Step 5: Impeccable finish**: run `~/.claude/skills/impeccable/scripts/impeccable detect --json app components` and fix mechanical findings. Spawn the `impeccable-finish-reviewer` with the screenshots, mockup paths and the roadmap. Apply its material fixes in one batch. Then run `impeccable-documenter` to update DESIGN.md (wider shell, type scale, new components: WhatMatters, Testimonials, ClientsRing, PlanSelector) and update PRODUCT.md "Capabilities and Constraints" (new nav, primary CTA = fit check, prices, web checkout coming).

- [ ] **Step 6: Commit** `test: e2e, a11y and visual verification for v2 pages` and `docs: update PRODUCT.md and DESIGN.md for v2`

- [ ] **Step 7: Preview deploy** (after plan 2 is merged into the branch): `vercel` (preview), share the URL with the client. Do not deploy to production before plan 2 is in.
