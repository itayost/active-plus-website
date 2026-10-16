# Handoff Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the look, home page, menu and pages of פעילים+ to match the client's handoff prototype, keeping every working flow (lead capture, questionnaire, checkout, legal pages).

**Architecture:** Swap the design tokens first so every existing page re-themes at once, then rebuild the chrome (header, drawer, footer), the home sections, and the new pages on top of the new tokens. Content stays in `content/*.ts` and `lib/constants.ts`; components stay small and per-section. Horizontal "swipe rows" are one shared component that becomes a grid or an arrow carousel on desktop.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Tailwind 3, Vitest, Playwright (+ axe).

**Spec:** `docs/superpowers/specs/2026-10-16-handoff-redesign-design.md`. Visual reference: `docs/handoff/peilim-plus-2026-10/prototype/index.html` (base64 images inline; grep it, do not read it whole) and `docs/handoff/peilim-plus-2026-10/README.md`.

## Global Constraints

- Hebrew RTL everywhere (`<html lang="he" dir="rtl">` stays). No emojis in code, comments or docs.
- Font: Heebo only, weights 400 / 500 / 700 / 800. Rubik removed. No `font-black` (900) anywhere.
- Colours: accent blue `#1E6FD9`; ink `#111`; surface `#fff`; footer field `#F7F9FC`; green gradient `linear-gradient(180deg,#35AC64,#2A9253)`, flat green `#2E9E5B`, button shadow `0 10px 22px rgba(46,158,91,.28)`; image wash `#EAF1FB`; hero wash `linear-gradient(180deg,#EEF5FE 0%,#fff 60%)`; card border `#EEF0F3`; card shadow `0 10px 28px rgba(20,40,80,.07)`; dividers `#ECEEF1`; stars `#F5B301`; error `#C62828`.
- Radii: buttons pill; cards 22px; small/list cards 18px; partner tiles 16px; video tiles 20px; inputs 14px; hero block bottom 32px.
- No purple, burgundy, yellow, cyan-emphasis or dark hero field remain in the UI.
- Accessibility floors stay: long-reading body text >= 18px, touch targets >= 48px, AA contrast, pinch-zoom never capped, reduced motion honoured, existing large-text and safe-area behaviour (`tests/e2e/large-text.spec.ts`) keeps passing.
- `/privacy-policy` and `/delete-account` are never redirected and stay linked from the footer.
- Every primary CTA ("לתוכנית אישית לחצו כאן", "לבדיקת התאמה", "לקבלת תוכנית אישית", "בדקו איזו תוכנית מתאימה לכם") links to `/questionnaire`.
- Leads: `public.leads.source` stays `"website"`; the note (`raw_remark`) starts with `פעילים אתר · <source>`.
- Pricing: annual `total: 828`, shown `69 ₪ לחודש`, terms `ל-12 תשלומים · מנוי שנתי`, 1-12 installments; monthly 99; saving computed = 360.
- `/payment` behaviour unchanged (checkout when `NEXT_PUBLIC_WEB_CHECKOUT` is on, `StoreFallback` otherwise); restyle only.
- No new third-party origins (CSP in `lib/security/csp.ts` unchanged). WhatsApp is a plain `https://wa.me/972506316060` link.
- Copy is the prototype's verbatim unless a task says otherwise.

## Review Focus

1. **Enlarged browser text (150-200%) on a 320-390px phone:** the new header (wordmark + two round buttons), the swipe rows and the pricing cards must not overflow or hide controls. Pinned in Task 3 and Task 10 (`large-text.spec.ts` runs on the new chrome and on `/payment`).
2. **Swipe rows with keyboard only and with reduced motion:** every card in a row reachable by Tab, focused card scrolled into view, arrows disabled at the ends. Pinned in Task 4 (`swipe-row.spec.ts`).
3. **Lead and contact forms submitted with JavaScript off or with invalid phone:** native post still works and errors show under the field. Pinned in Task 7 (`lead-form.spec.ts` contact cases).
4. **Old URLs from WhatsApp and search (`/how-it-works`, `/dual-tasking`, `/pricing`, `/faq`):** one hop to a live page, no chain, no 404. Pinned in Task 2 (`redirects.test.ts`, `redirects.spec.ts`).
5. **Testimonial videos list empty versus filled:** empty renders no section and no heading but still renders the CTA; one entry renders a playable `<video>` with `controls playsinline preload="metadata"`. Pinned in Task 6 (`home-content.test.ts` + `home.spec.ts`).

---

### Task 1: Theme swap (tokens, type, buttons, cards)

**Files:**
- Modify: `app/globals.css` (`:root` tokens, `--lift-*`), `tailwind.config.ts` (colours, radii, fonts, shadows), `app/layout.tsx` (drop Rubik), `components/ui/Button.tsx` (variants)
- Modify: every file that uses `purple`, `burgundy`, `yellow`, `emphasis`, `hero` colour utilities, `font-black` or `DarkHeroCard` (grep list below)
- Create: `tests/unit/tokens.test.ts`
- Modify: `tests/unit/tailwind-colors.test.ts`

**Interfaces:**
- Produces Tailwind colours: `surface`, `sunken` (= `#F7F9FC`), `hairline` (= `#EEF0F3`), `divider` (= `#ECEEF1`), `ink` (DEFAULT `#111`, `soft` `#3d4450`, `faint` `#5b6470`), `blue` (DEFAULT `#1E6FD9`, `deep` `#1659B3` for hover/pressed, `wash` `#EAF1FB`, `sky` `#EEF5FE`), `green` (DEFAULT `#2E9E5B`, `hi` `#35AC64`, `lo` `#2A9253`, `deep` `#237A47` for text on white), `star` `#F5B301`, `danger` `#C62828`. All through the existing `cssVar()` helper.
- Produces utilities: `shadow-card` (card shadow), `shadow-cta` (green button shadow), `bg-cta` (green gradient, a `backgroundImage` entry), `bg-hero-wash` (hero gradient); radii `rounded-card` 22px, `rounded-tile` 18px, `rounded-logo` 16px, `rounded-video` 20px, `rounded-field` 14px, `rounded-pill`.
- Produces `Button` variants: `primary` (green gradient, white 800 text, `shadow-cta`), `outline` (white, `#EEF0F3` border, ink text), `ghost`; sizes `md` (min-h 52px) and `lg` (min-h 58px). Variants `purple` and `onColor` are removed.
- `font-display` stays as a utility name and resolves to Heebo (no call-site churn).

- [ ] **Step 1: Write the failing token test** in `tests/unit/tokens.test.ts`: read `app/globals.css` as text and assert it contains `--blue: #1E6FD9`, `--ink: #111`, `--green: #2E9E5B`, `--hairline: #EEF0F3`, and does not contain `--purple`, `--burgundy`, `--yellow`, `--emphasis-cyan`, `--hero-field`. Read `app/layout.tsx` and assert it does not contain `Rubik`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/tokens.test.ts` — expect FAIL.
- [ ] **Step 3: Replace the tokens** in `app/globals.css` and `tailwind.config.ts` per Interfaces. Keep the `cssVar()` helper, `.gutter-x`, `.snap-gutter`, `.drawer-safe`, pill padding and every large-text rule. Leave `.hero-inset` and `.hero-stack` alone; Task 5 deletes them with the old hero. In `app/layout.tsx` drop Rubik; load Heebo with `weight: ["400","500","700","800"]`; map `--font-rubik` users to `--font-heebo`.
- [ ] **Step 4: Sweep call sites.** Run `grep -rnE "purple|burgundy|text-yellow|bg-yellow|emphasis|bg-hero|font-black|DarkHeroCard|onColor" app components` and replace: purple/burgundy fields and washes become `blue-wash`/`blue`; `font-black` becomes `font-extrabold`; `onColor` buttons become `primary`. `DarkHeroCard` is only used by the hero (rebuilt in Task 5) and `not-found`/`error`: give those two a plain white layout (h1 in ink, blue emphasis line, green `primary` button home) and delete `components/ui/DarkHeroCard.tsx` in Task 5. `PageHero` tones collapse to one look: `bg-hero-wash`, title `text-ink`, optional blue line; keep the `tone` prop accepted but ignored only if removing it touches more than the explainer pages, otherwise remove it.
- [ ] **Step 5: Update** `tests/unit/tailwind-colors.test.ts` to assert `.text-green-deep` and `.bg-ink` still emit bare vars, and that `bg-blue/85` emits `color-mix`.
- [ ] **Step 6: Run** `npx vitest run && npx tsc --noEmit && npx next lint` — expect PASS, and the Step 4 grep returns nothing.
- [ ] **Step 7: Check contrast.** Run `npx playwright test tests/e2e/a11y.spec.ts`. If axe reports `color-contrast` on the green buttons (white on `#35AC64` is under 4.5:1), darken both gradient stops by the same amount until it passes (keep the top stop lighter than the bottom), and record the final values in the Global Constraints of this plan and in `DESIGN.md` (Task 11). Same for blue text on `#EAF1FB`.
- [ ] **Step 8: Commit** `feat: switch to the handoff's white design tokens and Heebo-only type`.

### Task 2: Pricing, routes and redirects

**Files:**
- Modify: `lib/constants.ts` (`PLANS`, `NAV`, add `CONTACT_WHATSAPP`, `CONTACT_WHATSAPP_URL`, `COMPANY_LINE`), `lib/redirects.ts`, `lib/routes.ts`, `app/sitemap.ts`
- Delete: `app/how-it-works/`, `components/how/`, `content/how-it-works.ts`, `tests/unit/how-it-works.test.ts`
- Test: `tests/unit/pricing.test.ts`, `tests/unit/redirects.test.ts`, `tests/unit/routes.test.ts`, `tests/e2e/redirects.spec.ts`

**Interfaces:**
- Produces `PLANS[annual]`: `{ id: "annual", name: "שנתי", longName: "מנוי שנתי", price: 69, priceSuffix: "לחודש", terms: "ל-12 תשלומים · מנוי שנתי", total: 828, maxInstallments: 12, badge: "מנוי שנתי – החיסכון הגדול", cta: "לבחירת המנוי השנתי", featured: true }`; `PLANS[monthly]`: `{ price: 99, priceSuffix: "לחודש", total: 99, maxInstallments: 1, cta: "לבחירה", featured: false }` (keep existing `image`/`alt` fields if `PlanSelector` still reads them).
- Produces `NAV` (order fixed): `[{ href: "/about", label: "הכירו את פעילים+" }, { href: "/research", label: "המחקר והגישה המקצועית" }, { href: "/team", label: "הצוות המקצועי" }, { href: "/#faq", label: "שאלות נפוצות" }, { href: "/payment", label: "מסלולים ומחירים" }, { href: "/contact", label: "צור קשר" }]`.
- Produces `CONTACT_WHATSAPP = "050-631-60-60"`, `CONTACT_WHATSAPP_URL = "https://wa.me/972506316060"`, `COMPANY_LINE = "מבית המרכז לשיפור התנועה בע״מ"`.
- `SITE_ROUTES` gains `/research`, `/team`, `/contact`, loses `/how-it-works`. The three pages are created in Task 8; until then `routes.test.ts` asserts the list, and the e2e `pages.spec.ts` will fail for them, which is expected and fixed by Task 8.

- [ ] **Step 1: Update tests first.** `pricing.test.ts`: `annualSavings()` is `360`; `installmentAmount(828, 12)` is `69`; `installmentAmount(828, 7)` is `118.29`; `formatShekel(828)` is `"828 ₪"`. `redirects.test.ts`: sources include `/how-it-works`, `/dual-tasking`, `/faq`, `/pricing`; sources exclude `/research`, `/team`, `/contact`; `/how-it-works` and `/dual-tasking` both go to `/research`; the no-chain test stays. `routes.test.ts`: contains `/research`, `/team`, `/contact`; excludes `/how-it-works`; every `NAV` href (hash stripped) is in `SITE_ROUTES`. `redirects.spec.ts`: `/how-it-works` lands on `/research` with one 308 hop.
- [ ] **Step 2: Run** `npx vitest run tests/unit/pricing.test.ts tests/unit/redirects.test.ts tests/unit/routes.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** the constants, redirects (remove `/research`, `/team`, `/contact` entries; add `/how-it-works` -> `/research`; point `/dual-tasking` at `/research`), routes, sitemap; delete the how-it-works files. Grep for `708`, `59 `, `299`, `how-it-works` across `app components lib content` and fix every hit (copy in `PlanSelector`, `PlansTeaser`, checkout summary, FAQ).
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit` — expect PASS.
- [ ] **Step 5: Commit** `feat: prototype pricing (69 x 12), menu, and how-it-works redirect`.

### Task 3: Header, drawer and footer

**Files:**
- Modify: `components/layout/Logo.tsx`, `components/layout/Header.tsx`, `components/layout/Footer.tsx`, `components/ui/icons.tsx` (add `WhatsAppIcon` if missing)
- Test: `tests/e2e/chrome.spec.ts`, `tests/e2e/large-text.spec.ts`

**Interfaces:**
- Consumes `NAV`, `FIT_CHECK`, `CONTACT_*`, `CONTACT_WHATSAPP*`, `COMPANY_LINE` from Task 2.
- `Logo` renders text, no image: `<Link href="/" aria-label="פעילים+ – לדף הבית">` with `פעילים` in `text-blue` and `+` in `text-ink`, weight 800. Prop `size?: "md" | "lg"` (lg = footer, 30px).

Decisions for this task:
- Phone header (below `lg`): wordmark at the start (right), two 46px round `bg-cta` buttons at the end: menu (opens the drawer) and call (`tel:` link, `aria-label="התקשרו אלינו"`). Touch target stays >= 48px via padding/hit area. No fit-check pill on phones (the prototype has none; every page carries its own CTA). The prototype omits the wordmark on phones; it is kept so inner pages have identity and a home link.
- Desktop header (`lg+`): wordmark, the six `NAV` links inline, call button, green `FIT_CHECK` pill.
- Drawer: the six `NAV` links as large rows (21px, 700, `#ECEEF1` dividers), then the green `FIT_CHECK` button, then phone + hours. Keep all existing focus-trap, Escape, inert and scroll-lock behaviour. The pill-on-top logic is removed with the phone pill.
- Footer on `bg-sunken` with top `divider` border: large wordmark, the six `NAV` links, phone, WhatsApp, email (blue), address, then `COMPANY_LINE` in small `ink-faint`, then the legal links (`מדיניות פרטיות`, `מחיקת חשבון`, plus `ניהול מנוי` when checkout is on). Store badges are removed (the prototype has none).

- [ ] **Step 1: Update** `chrome.spec.ts`: at 1280px the header pill "בדיקת התאמה" is visible, one line, href `/questionnaire`; at 390px the header has a link named `פעילים+ – לדף הבית` and buttons/links named "פתיחת התפריט" and "התקשרו אלינו", and no horizontal overflow at 320/360/390; opening the drawer lists the six `NAV` labels in order; the footer links both legal pages and has a link with href `https://wa.me/972506316060`.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/chrome.spec.ts` — expect FAIL.
- [ ] **Step 3: Implement** Logo, Header, Footer per the decisions above.
- [ ] **Step 4: Run** `npx playwright test tests/e2e/chrome.spec.ts tests/e2e/large-text.spec.ts tests/e2e/a11y.spec.ts` — expect PASS. If `large-text.spec.ts` asserts the removed phone pill, change those assertions to the new bar (wordmark + two buttons fit, no overflow, toggle on screen) rather than deleting the test.
- [ ] **Step 5: Commit** `feat: handoff header, drawer and footer`.

### Task 4: Shared section primitives

**Files:**
- Create: `components/ui/SwipeRow.tsx`, `components/ui/SectionHeading.tsx`, `components/ui/Card.tsx`
- Modify: `components/ui/useSnapCarousel.ts`, `components/ui/CarouselArrows.tsx` (restyle only)
- Test: `tests/e2e/swipe-row.spec.ts` (runs against the home page once Task 6 lands; until then against the testimonials row from Task 6, so write it now and expect it to pass at the end of Task 6)

**Interfaces:**
- `SectionHeading({ id, title, swipeHint?: boolean, action?: ReactNode })`: h2 27px/700 on phones, scaling up on desktop; when `swipeHint` the line "החליקו הצידה לעוד ←" (14px, 500, blue) shows below `lg` only.
- `SwipeRow({ label, desktop, children, itemWidth })`: `label` is the region's accessible name; `desktop: "grid-3" | "grid-4" | "carousel"`; `itemWidth: "card" (284px) | "video" (190px) | "logo" (138px)`. Below `lg`: horizontal scroll-snap track with `.snap-gutter`, hidden scrollbar, items as `<li>`. At `lg+`: `grid-3`/`grid-4` render a plain grid; `carousel` keeps the track and shows `CarouselArrows` (reuse `useSnapCarousel`).
- `Card({ as?, className, children })`: white, `border-hairline`, `shadow-card`, `rounded-card`.

- [ ] **Step 1: Write** `swipe-row.spec.ts`: at 390px the testimonials region has 6 list items and the first is fully in view; pressing Tab through the row focuses each card link/quote container in order and the focused one is scrolled into view; at 1280px the arrows exist, "previous" is disabled at the start, clicking "next" until disabled reaches the last card; with `reducedMotion: "reduce"` scrolling is instant (no smooth behaviour on the track).
- [ ] **Step 2: Implement** the three components.
- [ ] **Step 3: Run** `npx tsc --noEmit && npx next lint` — expect PASS (the spec runs green at the end of Task 6).
- [ ] **Step 4: Commit** `feat: swipe row, section heading and card primitives`.

### Task 5: Home, top half (hero, world cards, professional cards)

**Files:**
- Modify: `components/home/Hero.tsx`, `components/home/HeroVideo.tsx` (only if its positioning assumes the dark card), `app/globals.css` (delete `.hero-inset`, `.hero-stack` and other old-hero rules), `content/home.ts`, `lib/constants.ts` (`FEATURE_CARDS` -> renamed `PROGRAM_CARDS`), `app/page.tsx`
- Create: `components/home/WorldCards.tsx`, `components/home/ProgramCards.tsx`, `components/home/CtaBar.tsx`
- Delete: `components/home/Intro.tsx`, `components/home/WhatMatters.tsx`, `components/home/FeatureCards.tsx`, `components/home/ChoosingDaily.tsx`, `components/ui/ArcStage.tsx`, `components/ui/DarkHeroCard.tsx`, `public/img/people/*` only if nothing else imports them (grep first)
- Test: `tests/unit/home-content.test.ts`, `tests/unit/routes.test.ts`, `tests/e2e/home.spec.ts`

**Interfaces:**
- `content/home.ts` produces `HERO = { titleLead: "תוכנית אישית", titleAccent: "לאימון וחיזוק הגוף וחדות המחשבה", sub: "רק 10 דקות ביום מהבית ובקצב שלך", cta: "לתוכנית אישית לחצו כאן" }`, `WORLD = { heading: "עולם שלם בחיבור אחד", cards: [{title, body}] x4 }` with the prototype's four titles and lines, `PROGRAM_HEADING = "מעטפת מקצועית במיוחד בשבילכם"`, `CTAS = { fit: "לבדיקת התאמה", plan: "לקבלת תוכנית אישית" }`. `WHAT_MATTERS` is removed.
- `PROGRAM_CARDS` (in `lib/constants.ts`): three `{ title, body, href, image, cta: "תראו לי עוד" }` with the prototype titles/bodies, hrefs `/personal-plan`, `/motion-detection`, `/progress`, images `/img/v2/card-personal-plan.webp`, `/img/v2/card-motion.webp`, `/img/v2/card-progress.webp`.
- `CtaBar({ label, href = FIT_CHECK.href })`: full-width green `lg` button on phones, centred auto-width on desktop.

Decisions: Hero sits on `bg-hero-wash` with a 32px bottom radius. Phone: h1 37px/800 (accent line blue) and sub 18px, then the video full-bleed at its natural aspect (poster `/img/v2/hero-poster.webp`, `priority`), then the CTA. Desktop: two columns, text + CTA at the start, rounded video at the end. `HeroVideo` keeps its reduced-motion and data-saver behaviour.

- [ ] **Step 1: Update tests.** `home-content.test.ts`: replace the `WHAT_MATTERS` case with `WORLD.cards` titles equal `["לחזק את השרירים","לאמן את המוח","אתגרים","התאמה אישית AI"]`; `HERO.titleAccent` is `"לאימון וחיזוק הגוף וחדות המחשבה"`. `routes.test.ts`: `PROGRAM_CARDS` hrefs are in `SITE_ROUTES` and images match `/^\/img\/v2\//`. `home.spec.ts`: the first section order check covers `hero-heading`, `world-heading`, `program-heading`; the hero CTA href is `/questionnaire`; the three "תראו לי עוד" hrefs equal `["/personal-plan","/motion-detection","/progress"]`; the hero contains a `video` element.
- [ ] **Step 2: Run** `npx vitest run tests/unit/home-content.test.ts tests/unit/routes.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** content, components, `app/page.tsx` top half; delete the listed files after grepping for imports.
- [ ] **Step 4: Run** `npx vitest run && npx tsc --noEmit && npx playwright test tests/e2e/home.spec.ts` — expect PASS for the cases written in Step 1.
- [ ] **Step 5: Commit** `feat: handoff hero, world cards and program cards`.

### Task 6: Home, bottom half (testimonials, videos, partners, lead, articles, FAQ)

**Files:**
- Modify: `components/home/Testimonials.tsx`, `components/sections/FaqSection.tsx`, `components/ui/Accordion.tsx`, `components/articles/ArticlesStrip.tsx`, `components/articles/ArticleCard.tsx`, `components/sections/LeadSection.tsx`, `content/home.ts`, `app/page.tsx`
- Create: `components/home/TestimonialVideos.tsx`, `components/home/Partners.tsx`
- Delete: `components/home/PartnersBand.tsx`, `components/sections/PlansTeaser.tsx` (grep imports first); the `marquee` and `arc-*` keyframes in `tailwind.config.ts`
- Test: `tests/unit/home-content.test.ts`, `tests/e2e/home.spec.ts`, `tests/e2e/swipe-row.spec.ts`

**Interfaces:**
- `content/home.ts` produces `TESTIMONIAL_VIDEOS: readonly { src: string; poster: string; name: string; caption: string }[] = []`, `PARTNERS: readonly { src: string; name: string }[]` (the seven from the old `PartnersBand`, same order), headings `TESTIMONIALS_HEADING = "מה אומרים הלקוחות שלנו"`, `VIDEOS_HEADING = "סרטוני ממליצים"`, `PARTNERS_HEADING = "שיתופי פעולה"`, `LEAD_HEADING = "השאירו פרטים ונחזור אליכם לתיאום:"`, `ARTICLES_HEADING = "מאמרים"`, `FAQ_HEADING = "שאלות ותשובות"`.
- `FAQ` becomes 14 items: the prototype's 13 in its order (camera question text: "איך מערכת זיהוי התנועה עובדת?" with the prototype's long answer; add "אפשר להתאמן גם בחו״ל?" after "אפשר להתאמן מהבית?"), plus the kept disclaimer "האם פעילים+ מחליפה פיזיותרפיה או טיפול רפואי?" placed before "איך מתחילים?" so the list still ends with "איך מתחילים?".
- Aviva's quote becomes the prototype's text ending "אפילו ירדתי 2 ק״ג בשבוע."

Decisions: Order after the program cards: `CtaBar(fit)`, testimonials (`SwipeRow carousel`, `Card` with name, `ReviewSourceLogo`, 5 stars in `text-star` with `aria-label="5 כוכבים"`, quote), `TestimonialVideos` (renders nothing when the list is empty; tiles 190x300 `rounded-video`, `<video controls playsinline preload="metadata" poster>`), `CtaBar(plan)` (always rendered), `Partners` (`SwipeRow`, `itemWidth: "logo"`, desktop `carousel`, tiles 96px tall `rounded-logo`, logo `object-contain`), `LeadSection` (Task 7 styles the form), articles (`SwipeRow grid-3`; card: cover 120px, "מאמר N" label in blue, title, excerpt, green "לקריאת המאמר"; heading links to `/articles`), FAQ (`id="faq"`, `+`/`−` blue markers, `divider` borders, keep the existing accessible accordion semantics).

- [ ] **Step 1: Update tests.** `home-content.test.ts`: `FAQ` has 14 items, first "מה זה פעילים+?", last "איך מתחילים?", contains "אפשר להתאמן גם בחו״ל?" and the disclaimer; `TESTIMONIAL_VIDEOS` is an array; `PARTNERS` has 7 entries each with a `/img/partners/` src. `home.spec.ts`: full section order by heading id is hero, world, program, testimonials, partners, lead, articles, faq; with the videos list empty there is no "סרטוני ממליצים" heading but a link "לקבלת תוכנית אישית" to `/questionnaire` exists; the "לבדיקת התאמה" bar sits between program and testimonials; `#faq` exists.
- [ ] **Step 2: Run** `npx vitest run tests/unit/home-content.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** per Interfaces and Decisions.
- [ ] **Step 4: Run** `npx vitest run && npx playwright test tests/e2e/home.spec.ts tests/e2e/swipe-row.spec.ts tests/e2e/a11y.spec.ts` — expect PASS.
- [ ] **Step 5: Commit** `feat: handoff testimonials, partners, articles and FAQ on home`.

### Task 7: Lead and contact forms

**Files:**
- Modify: `components/forms/LeadForm.tsx`, `components/sections/LeadSection.tsx`, `lib/leads.ts`, `lib/lead-form.ts` (if field validation lives there)
- Test: `tests/unit/lead-form.test.ts`, `tests/e2e/lead-form.spec.ts`

**Interfaces:**
- `LeadForm` props become `{ source: string; variant: "short" | "contact"; submitLabel?: string; className?: string }`. `short` = full name, phone, marketing opt-in "אני אשמח לקבל מבצעים והטבות". `contact` = full name, phone, email, topic `<select name="topic">` with options `בירור והצטרפות`, `שירות לקוחות`, `תמיכה באפליקציה`, `אחר`, message `<textarea name="message">`, the same opt-in. Submit label defaults to "שליחה". `withEmail` is removed; update every caller.
- `submitLead` remark first line becomes `` `פעילים אתר · ${source}` ``; `source` column stays `"website"`.
- Field styling: labels 700 above inputs; inputs 52px, `rounded-field`, 1px `#CFCFCF` border, 17px text; errors in `text-danger`; success message in `text-green-deep`.

- [ ] **Step 1: Update tests.** `lead-form.test.ts`: the remark built for `source: "home"` starts with `"פעילים אתר · home"`; topic and message lines still appear when given; `source` written to the row is `"website"`. `lead-form.spec.ts`: home form has `fullName`, `phone`, `marketingOptIn` and no `email`; `/contact` form has `fullName`, `phone`, `email`, `topic` (4 options), `message`, `marketingOptIn`; submitting `/contact` with phone `123` shows the phone error under the field; with JavaScript disabled the home form still posts and re-renders with the error.
- [ ] **Step 2: Run** `npx vitest run tests/unit/lead-form.test.ts` — expect FAIL.
- [ ] **Step 3: Implement.** If `lead-form.test.ts` cannot reach the remark without a DB, extract `buildLeadRemark({ source, topic, message, marketingOptIn }): string` in `lib/leads.ts` (exported, pure) and test that.
- [ ] **Step 4: Run** `npx vitest run && npx playwright test tests/e2e/lead-form.spec.ts` — expect PASS (the `/contact` cases pass after Task 8; run them then).
- [ ] **Step 5: Commit** `feat: handoff lead form with offers opt-in and a contact variant`.

### Task 8: New pages (about, research, team, contact)

**Files:**
- Modify: `content/pages.ts`, `app/about/page.tsx`
- Create: `app/research/page.tsx`, `app/team/page.tsx`, `app/contact/page.tsx`, `components/layout/InnerPage.tsx`, `public/img/v2/team-anat.webp` (from `docs/handoff/peilim-plus-2026-10/assets/team-dr-anat-keren.jpg`, convert with `npx sharp-cli` or `cwebp`, about 400px square)
- Test: `tests/unit/about.test.ts`, `tests/e2e/pages.spec.ts`

**Interfaces:**
- `InnerPage({ title, children, back?: boolean })`: the prototype's inner-page shell: h1 28px/800 blue (scales up on desktop), content column at the reading measure, body 17-18px/1.65, section h3 21px/800 blue. Used by about, research, team, contact (and available to explainers in Task 9).
- `content/pages.ts` produces `ABOUT = { title: "הגוף והמוח שלך עובדים יחד", heading: "למה הקמתי את פעילים+", paragraphs: string[], closer: "פעילים+ נולדה כדי להיות שם קודם.", photo: "/img/about.webp" }`, `RESEARCH = { title: "המחקר והגישה המקצועית", sections: { heading: string; paragraphs: string[] }[], closer: "פעילים+ נבנתה כדי לאמן בדיוק את החיבור הזה." }`, `TEAM: { name; role; photo }[]` with four entries in the prototype's order (מידד גולן / מייסד ומנכ״ל פעילים +; גדי בן שטרית / פיזיותרפיסט מוסמך – כוח ושיווי משקל; ד״ר ענת קרן / ריפוי בעיסוק | תפקוד וקוגניציה; דניאל שפיר / שיקום נוירולוגי | מאמן כושר ובריאות מוסמך), `CONTACT = { title: "רוצה לדבר איתנו?", lede: "נשמח לשמוע ממך." }`. All copy verbatim from prototype `P[0]`, `P[1]`, `P[2]`, `P[4]` (grep `var P=` in the prototype). The old `ABOUT` shape and `TEAM.bio`/`org` go away.
- `/contact` renders the contact block (phone + hours, WhatsApp, email, address) and `<LeadForm source="contact" variant="contact" />`.

- [ ] **Step 1: Update tests.** `about.test.ts`: `ABOUT.title` is `"הגוף והמוח שלך עובדים יחד"`; `TEAM.map(m => m.name)` equals the four names in order and every `photo` exists under `public/`; `RESEARCH.sections[0].heading` is `"הגוף והמוח עובדים יחד — וכך גם נכון לאמן אותם"`. `pages.spec.ts` already iterates `SITE_ROUTES` (200, one h1, no overflow); add: `/contact` has a form with `select[name="topic"]`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/about.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** content, `InnerPage`, the four pages (metadata title + description each), and the team photo conversion.
- [ ] **Step 4: Run** `npx vitest run && npx playwright test tests/e2e/pages.spec.ts tests/e2e/lead-form.spec.ts tests/e2e/a11y.spec.ts` — expect PASS.
- [ ] **Step 5: Commit** `feat: about letter, research, team and contact pages`.

### Task 9: Restyle the kept pages

**Files:**
- Modify: `app/personal-plan/page.tsx`, `app/motion-detection/page.tsx`, `app/progress/page.tsx`, `components/explainers/FitCheckClose.tsx`, `components/layout/PageHero.tsx`, `app/articles/page.tsx`, `app/articles/[slug]/page.tsx`, `components/ui/Prose.tsx`, `components/ui/BackLink.tsx`, `app/privacy-policy/page.tsx`, `app/delete-account/*`, `app/not-found.tsx`, `app/error.tsx`, `components/funnel/FunnelChrome.tsx` and funnel parts only where colours/radii look off, `app/account/subscription/page.tsx`
- Test: `tests/unit/explainers.test.ts`, `tests/e2e/pages.spec.ts`, `tests/e2e/questionnaire.spec.ts`

**Interfaces:**
- `FitCheckClose` drops `tone`; renders the closing green CTA. Explainers close with "בדקו איזו תוכנית מתאימה לכם" -> `/questionnaire`; articles close with "לבדיקת התאמה" -> `/questionnaire`.
- `BackLink` reads "→ חזרה" in blue 700, as in the prototype.

Decisions: explainers and articles use the `InnerPage` look (blue h1, blue section heads, ink body, `#EAF1FB` image frames, 22px image radius). Explainer copy already matches the prototype; do not rewrite it. The funnel keeps its layout; only make sure its buttons are the new `primary`, surfaces white, accents blue.

- [ ] **Step 1: Update** `explainers.test.ts`: each explainer's closing CTA label is "בדקו איזו תוכנית מתאימה לכם" (add the field to `content/explainers.ts` if missing).
- [ ] **Step 2: Run** `npx vitest run tests/unit/explainers.test.ts` — expect FAIL.
- [ ] **Step 3: Implement** the restyle across the listed files.
- [ ] **Step 4: Run** `npx vitest run && npx playwright test tests/e2e/pages.spec.ts tests/e2e/questionnaire.spec.ts tests/e2e/browser-back.spec.ts tests/e2e/a11y.spec.ts` — expect PASS.
- [ ] **Step 5: Commit** `feat: restyle explainers, articles, funnel and legal pages`.

### Task 10: Pricing page restyle

**Files:**
- Modify: `components/payment/PlanSelector.tsx`, `components/payment/PaymentFlow.tsx`, `components/payment/CheckoutSummary.tsx`, `components/payment/StoreFallback.tsx` (style only, copy unchanged), `app/payment/page.tsx`
- Test: `tests/e2e/checkout-steps.spec.ts`, `tests/e2e/large-text.spec.ts`, `tests/unit/checkout.test.ts`

**Interfaces:**
- Consumes `PLANS` from Task 2 (`badge`, `cta`, `price`, `priceSuffix`, `terms`) and `annualSavings()`.

Decisions: page title "מסלולים ומחירים". Annual card first: 2px `green` border, 22px radius, badge pill (`bg-cta`, white 800 13px) with `badge`, price "69 ₪" 38px/800 + "לחודש", terms line, "חיסכון של 360 ₪ לעומת המנוי החודשי" in blue 700 (number from `annualSavings()`), full-width green `cta` button. Monthly as a lighter row card: "מנוי חודשי", "99 ₪ לחודש", blue "לבחירה ←" action. The buttons keep doing what the current selector does (select the plan and continue into checkout when enabled; with checkout off the `StoreFallback` shows as today). `PLAN_INCLUDES` list stays below the cards.

- [ ] **Step 1: Update** `checkout-steps.spec.ts` selectors for the new labels ("לבחירת המנוי השנתי", "לבחירה") and assert the annual card shows "69 ₪" and "חיסכון של 360 ₪"; `checkout.test.ts` expectations for the annual total become 828. Add a `large-text.spec.ts` case: `/payment` at 200% text on 320px has no horizontal overflow and the annual button is fully on screen.
- [ ] **Step 2: Run** `npx vitest run tests/unit/checkout.test.ts && npm run test:e2e:checkout` — expect FAIL.
- [ ] **Step 3: Implement** the restyle.
- [ ] **Step 4: Run** `npx vitest run && npm run test:e2e:checkout && npx playwright test tests/e2e/large-text.spec.ts tests/e2e/payment-success.spec.ts` — expect PASS.
- [ ] **Step 5: Commit** `feat: pricing cards in the handoff style`.

### Task 11: Desktop pass, docs and preview

**Files:**
- Modify: any component from Tasks 3-10 needing desktop fixes; `DESIGN.md`; `PRODUCT.md`
- Create: `tests/e2e/visual.spec.ts`

- [ ] **Step 1: Write** `visual.spec.ts`: for `/`, `/about`, `/research`, `/team`, `/contact`, `/payment`, `/articles/body-after-50`, `/personal-plan` at widths 320, 390, 768, 1024, 1440: status 200, no horizontal overflow, and save a full-page screenshot to `test-results/visual/<route>-<width>.png` (artefacts for review, not snapshot assertions).
- [ ] **Step 2: Run** `npx playwright test tests/e2e/visual.spec.ts`, open the screenshots, and compare the 390px ones against the prototype (`open docs/handoff/peilim-plus-2026-10/prototype/index.html`). Fix spacing, type scale and desktop layouts until each page reads as the prototype on phones and as an intentional layout on desktop (no 390px column floating in a wide page; grids at 3/4 columns where the spec says).
- [ ] **Step 3: Run the full suite** `npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run test:e2e:checkout && npm run build` — expect all PASS.
- [ ] **Step 4: Update docs.** Rewrite `DESIGN.md` front matter and body to the new tokens and components; in `PRODUCT.md` update pages, nav, pricing (69 x 12 = 828, monthly 99) and brand (text wordmark). Note in `PRODUCT.md` that the Grow annual amount in the app repo must become 828 before checkout is enabled.
- [ ] **Step 5: Commit** `docs: design system and product notes for the handoff redesign`.
- [ ] **Step 6: Push and deploy a preview** (`git push -u origin feat/handoff-redesign`; Vercel builds the preview from the push). Report the preview URL. Do not promote to production.
