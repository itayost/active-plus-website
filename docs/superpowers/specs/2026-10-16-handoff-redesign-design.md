# Handoff redesign: the prototype becomes the site

Date: 2026-10-16. Branch: `feat/handoff-redesign`, cut from `main` at 2f276c5.

## Intent

The client sent a design handoff (`docs/handoff/peilim-plus-2026-10/`): a phone-only clickable
prototype (`prototype/index.html`), a README spec in Hebrew, and photos. The user decided that
this handoff is **the new source of truth for both look and structure**. It replaces the visual
system in `DESIGN.md` and the page list and nav recorded in `PRODUCT.md` and the v2 brief.

The direction is "clean, white, premium": white page, one typeface, one blue for emphasis, green
pill buttons for every action, soft-shadowed cards, generous space between sections. The current
site's multi-colour fields (blue, green, purple, burgundy cards, dark hero, Rubik display type) go
away.

Audience is unchanged: Israelis 55+, Hebrew RTL, mostly on phones, sometimes with weaker sight or
motor control. The senior-first floors stay (18px body minimum, 48px+ touch targets, AA contrast
or better, pinch-zoom never blocked, reduced motion honoured).

## Goals

1. Every page on the site uses the handoff's visual language.
2. The home page has the prototype's sections, in the prototype's order, with its copy.
3. The menu and pages match the prototype: about, research, team, FAQ, pricing, contact.
4. The pricing is the prototype's: annual 69 ₪ a month (12 payments), monthly 99 ₪.
5. Desktop gets a deliberate layout in the same language (the prototype only shows a phone).
6. Nothing that works today stops working: lead capture, questionnaire, checkout, legal pages.

## Non-goals

- No new backend. Forms post to the existing `submitLead` server action (`lib/leads.ts`), which
  already accepts name, phone, email, topic, message and the marketing opt-in.
- The questionnaire funnel (`/questionnaire`) and checkout logic (`/payment`) are not redesigned
  as flows. They are restyled to the new tokens only.
- The pages the README calls "defined but not built" (איך זה עובד, אודות, המעקב וההתקדמות, Dual
  Tasking, the three new SEO articles) are not built here.
- The results figures (71% / 62% / 100%) are not added; the README says they are not yet in.
- No accessibility widget. The prototype draws a floating accessibility button in the hero; there
  is no widget behind it, and a button that does nothing is worse than none. (Legal accessibility
  statement work is a separate task.)
- The Grow charge amount on the server (app repo checkout functions) is not changed here; see
  Constraints.

## Anti-goals (would make this a failure even if it "works")

- Shipping "[תמונה: ...]" or "[לוגו שותף]" placeholder boxes to production.
- Breaking `/privacy-policy` or `/delete-account` (registered in the App Store and Google Play;
  `PROTECTED_PATHS` in `lib/redirects.ts` must never be redirected).
- Old URLs that 404 instead of redirecting, or redirect chains.
- A desktop that is just the phone column stretched or centred at 390px.
- Losing the hero video (the user explicitly kept it).

## Decisions made with the user

| Topic | Decision |
|---|---|
| Scope | Prototype is the source of truth for look and structure. |
| Pricing | Prototype's: annual shown as **69 ₪ לחודש**, "ל-12 תשלומים · מנוי שנתי", "חיסכון של 360 ₪ לעומת המנוי החודשי". Monthly 99 ₪. The unpushed `feat/annual-299` branch (299 a year) is abandoned. |
| Hero | The existing hero **video stays**, placed where the prototype has the family photo. |
| Animated sections | The "אלפי לקוחות" arcs section (`ChoosingDaily` + `ArcStage`) and the partners marquee are **removed**. Partners become the prototype's swipe row. |
| /how-it-works | Removed, follow the prototype. Redirected (see Routes). |
| Missing content | Use the real assets already in the repo instead of placeholders. |
| `/payment` behaviour | **Kept as is**, restyled only. With `NEXT_PUBLIC_WEB_CHECKOUT` on, plan choice leads into the existing Grow checkout; with it off, the existing `StoreFallback` shows, copy unchanged. The site is not really live yet, so a plan that cannot be bought today is acceptable. |

Builder-check calls (made by Claude, not the user; the user may override):

- Lead source: the `public.leads.source` column keeps `"website"` (it is the CRM's own vocabulary).
  The "פעילים אתר" tag goes into the free-text note (`raw_remark`) that `lib/leads.ts` already
  writes.
- Release: build on the branch and deploy a Vercel preview. Production is a separate go-ahead from
  the user. The client-confirmation list below does not block the preview.
- Midad's photo on `/about`: `public/img/about.webp` (the real photo the current about page uses).

## The design system

From the README and the prototype markup. These replace the tokens in `app/globals.css`,
`tailwind.config.ts` and `DESIGN.md`.

- **Type:** Heebo only, weights 400 / 500 / 700 / 800 (`next/font/google`, Hebrew subset
  preloaded as today). Rubik is removed.
- **Colour:**
  - accent blue `#1E6FD9` (headings' emphasis line, card titles, links, small "swipe" hints)
  - ink `#111`
  - surface `#fff`; footer field `#F7F9FC`
  - action green: gradient `linear-gradient(180deg,#35AC64,#2A9253)`, flat `#2E9E5B`,
    shadow `0 10px 22px rgba(46,158,91,.28)`
  - image wash `#EAF1FB`; hero wash `linear-gradient(180deg,#EEF5FE 0%,#fff 60%)`
  - card border `#EEF0F3`, card shadow `0 10px 28px rgba(20,40,80,.07)`; list dividers `#ECEEF1`
  - stars `#F5B301`; error `#C62828`
- **Shape:** buttons fully round (pill). Cards 22px (small cards and FAQ-style list cards 18px,
  partner tiles 16px, video tiles 20px, inputs 14px). Hero block has a 32px bottom radius.
- **Buttons:** primary = green gradient pill, white 800-weight text, 58-60px tall full-width on
  phones. Secondary in-card = smaller green pill ("תראו לי עוד", "לקריאת המאמר").
- **Header:** two round 46px green buttons (menu, call) on phones. Wordmark "פעילים" in blue +
  "+" in `#111`, as text. `public/img/logo.webp` is not used.
- **Rhythm:** about 48px between sections on phones, 20px side gutter.
- **Contrast check (builder must verify):** `#1E6FD9` on white is about 4.6:1 and white on the
  lighter end of the green gradient is under 4.5:1. Body copy stays `#111`. If button text fails
  AA at its size, darken the gradient slightly rather than change the look.
- **Motion:** keep what exists only where it serves (drawer slide, accordion, carousel snap,
  reveal-on-scroll if it stays subtle). Reduced motion removes it.

## Home page (`/`), top to bottom

Copy is the prototype's unless noted. Content lives in `content/home.ts`.

1. **Header:** menu button and call button (`tel:` the existing `CONTACT_PHONE_TEL`).
2. **Hero:** on the light-blue wash. H1 "תוכנית אישית" + line break + blue "לאימון וחיזוק הגוף
   וחדות המחשבה". Sub "רק 10 דקות ביום מהבית ובקצב שלך". Then the **existing hero video**
   full-bleed (`components/home/HeroVideo.tsx`, `public/video/hero.mp4`, poster as today), then
   the CTA "לתוכנית אישית לחצו כאן" to `/questionnaire`. The video is now a picture under the
   headline, not a dark background behind white text.
3. **"עולם שלם בחיבור אחד":** four cards, title in blue, one line under it: לחזק את השרירים,
   לאמן את המוח, אתגרים, התאמה אישית AI.
4. **"מעטפת מקצועית במיוחד בשבילכם":** three swipe cards with image, title, text and "תראו לי
   עוד" linking to the existing explainer pages. Images: `card-personal-plan.webp`,
   `card-motion.webp`, `card-progress.webp`.
5. CTA "לבדיקת התאמה" to `/questionnaire`.
6. **"מה אומרים הלקוחות שלנו":** six testimonials, swipe row, name, Google/Facebook mark,
   five stars, quote. Reuse `ReviewSourceLogo`.
7. **"סרטוני ממליצים":** four video tiles. **Hidden while there are no videos.** Driven by a
   list in content (empty list = section not rendered). Each entry: src, poster, name, caption.
   Followed by the CTA "לקבלת תוכנית אישית"; the CTA stays even while the videos are hidden.
8. **"שיתופי פעולה":** swipe row of partner logo tiles, about 2.5 visible on a phone. The seven
   logos in `public/img/partners/`. Haifa municipality is missing; add when the client sends it.
9. **Lead form:** "השאירו פרטים ונחזור אליכם לתיאום:", full name + phone, plus the "אני אשמח
   לקבל מבצעים והטבות" opt-in (README requirement). Posts via `submitLead`; "פעילים אתר" goes in
   the lead's note; the `source` column stays `"website"`. Keep `id="lead"` anchor.
10. **"מאמרים":** three swipe cards (cover, "מאמר N", title, excerpt, "לקריאת המאמר"). Same three
    articles as today; reuse their covers.
11. **"שאלות ותשובות":** accordion, `id="faq"`.
12. **Footer:** wordmark, the six menu links, phone, WhatsApp (`https://wa.me/972506316060`,
    "050-631-60-60"), email, address, "מבית המרכז לשיפור התנועה בע״מ". Keep the privacy policy
    link (legal; not in the prototype but must stay reachable).

Sections removed from home: `ChoosingDaily` (arcs), `Intro`, `WhatMatters`, `FeatureCards` (replaced
by sections 3-4), `PartnersBand` marquee (replaced by 8), `PlansTeaser`. Components that end up
unused are deleted, after confirming nothing else imports them.

### Copy differences to apply from the prototype

- Testimonial "אביבה סטלקול": the prototype's text ends "אפילו ירדתי 2 ק״ג בשבוע". Apply it, and
  list it in the client-confirmation list (it is a weight-loss claim).
- FAQ: the prototype replaces the camera answer with a longer one, and adds "אפשר להתאמן גם
  בחו״ל?". The prototype also **drops** "האם פעילים+ מחליפה פיזיותרפיה או טיפול רפואי?", while
  the README says that disclaimer is in the FAQ and should also go on signup pages. **Builder's
  call recorded here: keep the disclaimer question** (14 questions), and flag it for the client.

## Menu and pages

Menu (drawer on phones, header nav on desktop, footer links), in this order:

| Label | Route | Content |
|---|---|---|
| הכירו את פעילים+ | `/about` | **Replaced.** Title "הגוף והמוח שלך עובדים יחד", Midad Golan's letter (prototype `P[0]`). Photo: `about.webp`. The current about story and team block go away. |
| המחקר והגישה המקצועית | `/research` | **New page.** Prototype `P[1]`. |
| הצוות המקצועי | `/team` | **New page.** Four people, round photo, name, role (prototype `P[2]`). Photos: existing `team-meidad/gadi/daniel.webp` plus the handoff's `team-dr-anat-keren.jpg` (convert to webp). |
| שאלות נפוצות | `/#faq` | Home FAQ section. |
| מסלולים ומחירים | `/payment` | The existing plan-choice + checkout page, behaviour unchanged, restyled so the plan choice looks like the prototype's pricing page (`P[3]`): featured annual card with green border and badge "מנוי שנתי – החיסכון הגדול", then the monthly row. |
| צור קשר | `/contact` | **New page.** Title "רוצה לדבר איתנו?", contact details, form: name, phone, email, topic select (בירור והצטרפות / שירות לקוחות / תמיכה באפליקציה / אחר), message, opt-in. Posts via `submitLead`. |

The prototype puts "בדיקת התאמה" in no menu slot; the green CTAs on the page carry it. On desktop
the header may still carry a green "בדיקת התאמה" pill next to the nav (builder's call, keeps the
primary action one click away).

Pages kept and restyled only: `/questionnaire`, `/payment` (+ `/payment/success`),
`/account/subscription`, `/articles` (index, reachable from the home "מאמרים" heading),
`/articles/[slug]`, the three explainers, `/privacy-policy`, `/delete-account`, `not-found`,
`error`.

Explainer URLs stay as they are (`/personal-plan`, `/motion-detection`, `/progress`), not the
prototype's `/program`, `/camera`, `/progress`. Their copy already matches the prototype; the
closing CTA is "בדקו איזו תוכנית מתאימה לכם" to `/questionnaire`.

Article pages close with "לבדיקת התאמה" to `/questionnaire`. Known content gap from the README
(missing sentence after the CDC figure in the memory article) is left for the client.

## Routes and redirects (`lib/redirects.ts`)

- Remove the redirects for `/research`, `/team`, `/contact`; they are real pages again.
- Keep `/faq` → `/#faq` and `/pricing` → `/payment`.
- Add `/how-it-works` → `/research` (permanent). Change `/dual-tasking` to point straight to
  `/research` (no chain).
- Delete `app/how-it-works/` and its components (`components/how/*`, `content/how-it-works.ts`).
- Update `SITE_ROUTES` (`lib/routes.ts`), `app/sitemap.ts`, and the redirect unit tests.

## Pricing (`lib/constants.ts`, `lib/pricing.ts`)

- Annual: `total: 828`, displayed as `price: 69`, `priceSuffix: "לחודש"`, terms "ל-12 תשלומים ·
  מנוי שנתי". Still one charge split into 1-12 installments (`maxInstallments: 12`).
- Monthly: 99, unchanged.
- `annualSavings()` already computes 99 × 12 − 828 = 360; the UI shows that number, not a
  hard-coded one.
- Update `tests/unit/pricing.test.ts` and any copy that says 708, 59 or 299.

## Desktop

The prototype has no desktop. The desktop layout uses the same tokens and section order:

- Header: wordmark, the six links inline, call button, green CTA pill.
- Hero: headline and sub beside or above a wide rounded video, CTA under the headline.
- Swipe rows become grids where the count fits (4 world cards in one row, 3 explainers, 3
  articles), and carousels with arrows where it does not (6 testimonials, partners). The
  existing `useSnapCarousel` and `CarouselArrows` can be reused.
- Content width capped (the existing shell width is fine); reading pages keep a ~68ch measure.

## Constraints

- Stack stays: Next.js 15 App Router, React 19, Tailwind 3, TypeScript strict, Vercel.
- RTL Hebrew throughout. The prototype's "החליקו הצידה לעוד ←" hint is kept on phones and hidden
  on desktop where the rows are grids or have arrows.
- CSP (`lib/security/csp.ts`) stays; no new third-party origins. WhatsApp is a plain link.
- Existing tests (Vitest unit, Playwright e2e incl. axe) must pass after updates; tests that
  assert removed sections or old copy are updated, not deleted wholesale.
- **Grow charge amount:** the server side that creates the Grow payment lives in the
  FitnessForSeniorsApp repo. Its annual amount must change to 828 before checkout is switched on
  (checkout is dormant today: `NEXT_PUBLIC_WEB_CHECKOUT` unset). Out of scope here, must be
  tracked.
- `DESIGN.md` and `PRODUCT.md` are updated at the end to describe what shipped.

## Left to the builder

- Component breakdown, file layout, and which existing components are reused versus rewritten.
- Exact desktop breakpoints and grid columns.
- Fine type scale between the prototype's phone sizes (h1 37px, h2 27px, card title 19-20px,
  body 15-18px). Body text must not go under 18px for long reading (articles, about, research);
  card copy may follow the prototype's sizes only if it stays legible at 320px.
- Whether `Reveal` animations survive the cleaner look.

## To confirm with the client (does not block the build)

1. Aviva's testimonial now claims "ירדתי 2 ק״ג בשבוע".
2. The physio/medical disclaimer FAQ was kept although the prototype dropped it.
3. Haifa municipality logo, testimonial videos.
4. The research page's medical and study claims (Lancet, 42% fewer falls) need professional sign-off
   (README).
