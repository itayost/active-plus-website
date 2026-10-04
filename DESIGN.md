---
name: פעילים+ (Active Plus)
description: Dual-tasking fitness-and-cognition training for Israeli readers 55+, in Hebrew RTL.
colors:
  blue: "#0d68a4"
  blue-deep: "#0a5f81"
  blue-bright: "#1aa9e0"
  blue-wash: "#e6f6fd"
  green: "#3d7d23"
  green-deep: "#2a5f17"
  green-wash: "#eaf6e3"
  purple: "#6b4fd8"
  purple-deep: "#4b33a8"
  purple-wash: "#efebfe"
  burgundy: "#6a2532"
  burgundy-deep: "#4c1723"
  burgundy-wash: "#f7ecef"
  emphasis-cyan: "#5fd3ff"
  brand-yellow: "#fdb913"
  hero-field: "#08222f"
  ink: "#0f2230"
  ink-soft: "#375260"
  ink-faint: "#576f7d"
  surface: "#ffffff"
  sunken: "#f2f6f9"
  hairline: "#dfe7ed"
typography:
  display:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "clamp(2.125rem, 1.4rem + 3.6vw, 5.5rem)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 1.3rem + 2vw, 3.75rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.15rem + 0.7vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.05rem + 0.6vw, 1.625rem)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1rem + 0.25vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  sm: "14px"
  md: "20px"
  lg: "22px"
  card: "28px"
  hero: "clamp(20px, 2.5vw, 36px)"
  pill: "999px"
spacing:
  gutter: "clamp(1.25rem, 4vw, 4.5rem)"
  section-y: "clamp(4rem, 3rem + 6vw, 8.5rem)"
  shell: "1520px"
  narrow: "1080px"
  measure: "68ch"
components:
  button-primary:
    backgroundColor: "{colors.green-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px"
  button-primary-hover:
    backgroundColor: "{colors.green}"
  button-purple:
    backgroundColor: "{colors.purple-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px"
  button-purple-hover:
    backgroundColor: "{colors.purple}"
  button-onColor:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px"
  button-outline:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "clamp(1.5rem, 3vw, 2.5rem)"
  dark-hero-card:
    backgroundColor: "{colors.hero-field}"
    textColor: "#ffffff"
    rounded: "{rounded.hero}"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
---

# Design System: פעילים+ (Active Plus)

## Overview

**Creative North Star: "Two Things At Once"**

The site's thesis is that it never shows body or mind alone: every primary surface stages movement and thinking together, and the composition carries the claim rather than only stating it. In the v2 build that idea lives in three places. The home hero is a full-bleed video of people moving, held inside a dark rounded card, with a two-line headline whose second line ("וחדות המחשבה") is set in Emphasis Cyan, so body and mind arrive as one sentence in two colours. The three explainer cards (personal plan, motion detection, progress) each carry one brand field and lead to an explainer page. How-it-works makes the dual task concrete with paired examples: a physical action set beside a cognitive one ("הרמת ברכיים" with "שליפת מילים"), each in its own tinted chip. This remains a rebuild of a client-pinned reference (effectivate.co.il) in the client's own material: the reference supplied the page-scale colour cards, the two-arrow carousel with a progress bar, the lead form and the FAQ accordion; the client's v2 structure added the explainer pages, the fit-check close and the plan picker; Active Plus supplied the palette, the type pairing and the explicit refusal of the reference's orange.

Everything is built to a 55+ reading and motor floor, not just WCAG AA: an 18px body-text minimum that grows to 21px on wide screens, 48px+ touch targets throughout, and a focus ring sized to be seen rather than merely compliant. Hebrew RTL is the only mode; nothing in the system assumes LTR as a base case. The v2 shell is wide (1520px) and the type scale is raised to fill it, so large monitors read as generous rather than as a narrow column in empty space.

**Key Characteristics:**
- Brand hues used as page- or card-scale fields (never small accent chips)
- Rubik display over Heebo body, both variable-loaded via `next/font`
- A dark rounded hero card (Hero Field) opens the home and how-it-works pages
- Depth from offset-plus-blur shadows only; no flat coloured halos
- One shared entrance animation for every revealed element, gated by `prefers-reduced-motion`
- Structure inherited from a pinned reference and the client's v2 brief; palette and type are the project's own

## Colors

The palette is not a single accent on a neutral field: it is four co-equal brand hues, each used as a page- or card-scale colour field tied to a fixed meaning, plus a dark hero ground and two narrowly reserved emphasis colours.

### Primary
- **Movement Blue** (base, deep, wash, bright): body and motion content, the motion-detection explainer, primary navigation state, links, the selected plan, and the focus ring.
- **Progress Green** (base, deep, wash): the site's action and progress colour. The default `Button` variant and the header's fit-check pill, the lead-form panel (wash), the progress explainer, the "what matters" and "included in both plans" check badges, and the store-fallback field.
- **Cognition Purple** (base, deep, wash): mind-training content. The personal-plan explainer, its fit-check close panel, the light lavender feature card, and the cognitive half of each How-it-works example pair.
- **Daily-Practice Burgundy** (base, deep, wash): the articles section's page hero and the destructive/error state (form errors, delete-account). No longer a feature-card field in v2.

Each brand hue ships as a triad: the base tone for large fields, `-deep` for text, icons and filled controls against a light wash, and `-wash` as the tinted background those sit on. Blue carries a fourth value, `bright`, the logo's turquoise, kept for marks and illustration only; no text is ever set on it.

Every field value is the brightest tone of its hue that still clears 4.5:1 with white, so fields can carry white copy (see The AA-on-Field Exception).

### Secondary
- **Emphasis Cyan**: reserved for one emphasised line on the dark hero field, the second line of the home hero headline. It never appears on a light ground and never becomes a field colour.

### Tertiary
- **Brand Yellow**: one semantic job, the money the visitor keeps. It appears only as the annual plan's savings figure, bold `lead`-size display type inside an ink pill (on the plan teaser photo and in the plan picker). Never body text, never on a light ground.

### Neutral
- **Hero Field** (`--hero-field`, Tailwind `hero`): the near-black teal ground of the Dark Hero Card. Its photo/video scrims are the same colour at partial alpha.
- **Ink**: primary text, AAA on white; also the ground of the savings pill, the carousel progress fill and the skip link.
- **Ink Soft** (AAA on white and on Cool Paper): secondary text, ledes, body inside neutral cards, nav labels at rest, long-form article body.
- **Ink Faint** (AA only: 5.28:1 on white, 4.86:1 on Cool Paper): placeholders, image captions and the faded first line of a large display heading. Never instructions, hints, labels or legal links, which use `ink-soft`.
- **Surface White**: the base ground and raised-card background.
- **Cool Paper** (`--surface-sunken`): the sunken ground that alternates with white to separate sections (What Matters, Testimonials, FAQ, narrow interludes on the explainers).
- **Hairline**: the border colour for inputs, plan cards at rest, dividers and accordion rules. Unboxed lists and carousel arrows use `ink/15` instead, so the rule reads on Cool Paper.

### Named Rules
**The Page-Scale Field Rule.** A brand hue is a section or card background, not a small UI accent; the palette reads as confident because each colour claims real territory, not a 2px underline.

**The Value-Separation Rule.** Fields have to separate by lightness, not only by hue. Saturated darks at the same luminance read as one dark field wearing several colours. The set therefore runs dark blue, dark green, **light lavender** and near-black burgundy: the purple card is a light ground with deep purple ink and a filled purple action. A new field colour joins this scale or it does not join.

**The No-Orange Rule.** The structural reference (effectivate.co.il) uses orange as its accent; this build deliberately excludes it. No orange appears anywhere in the token set; this is a confirmed brand decision, not an oversight.

**The Two-Step Rule.** Every filled-control hue ships as a pair: the `-deep` value is the resting state and the base value is its hover. The step is sized to read as a change (blue 7.08:1 to 5.73:1, green 7.64:1 to 5.05:1 against white). A hue whose two steps land within a ratio point of each other has no hover.

**The Inverted Action Exception.** Actions on a colour field are white pills, except on the light lavender field, where a white pill has nothing to stand against. There the action is the `purple` Button variant (filled `purple-deep`). The rule is "the action carries the strongest available contrast against its own field".

**The AA-on-Field Exception (stated, not accidental).** Ink and Ink Soft clear AAA on white and on Cool Paper; Ink Faint is AA only and is restricted to text that carries no meaning of its own (see Neutral). White text on a colour field reaches AA (4.5:1) and stops; AAA is unreachable at these hues without darkening the brand past recognition. So fields carry short card copy only, and every long-form reading surface stays on `ink-soft` over a neutral ground. Secondary copy on a field is the field's own foreground at the lowest opacity that still clears 4.5:1 there (green 95%, blue 90%, burgundy 85%, purple-deep 90% on lavender), never gray.

**The Var-Alpha Rule.** Every colour is a CSS variable, and Tailwind opacity modifiers on them (`bg-ink/85`, `border-ink/15`) are generated through a `color-mix(in srgb, ...)` helper in `tailwind.config.ts`. Use the modifier on the token; never hand-write an rgba copy of a token value.

## Typography

**Display Font:** Rubik (weights 500/700/900), with `system-ui, sans-serif` fallback
**Body Font:** Heebo (variable weight), with `system-ui, sans-serif` fallback

**Character:** Rubik carries every heading at heavy weight (700 to 900) with tightened tracking (-0.025em) and `text-wrap: balance`, a blunt, confident display layer; Heebo runs everything else at a calm 1.65 line-height built for a reader who wants zero ambiguity, not editorial flourish.

### Hierarchy
- **Display** (900, 34px to 88px fluid, 1.02): the h1, one per page, in the hero and page hero.
- **Headline** (900, 30px to 60px fluid, 1.1): the h2, every section heading.
- **Title** (700, 22px to 30px fluid, 1.25): the h3, card titles, FAQ questions, footer column headings.
- **Lead** (400, 20px to 26px fluid, 1.55, Heebo): ledes and standfirsts under a headline, plan figures, testimonial quotes; capped to the 68ch measure.
- **Body** (400, 18px to 21px fluid via `text-base`, 1.65, Heebo): the reading size. The document root is fixed at the 18px floor; components opt into the fluid step.

Two in-between sizes are sanctioned: the article page hero sets a long editorial h1 smaller and wider (`clamp(2rem, 1.3rem + 2.6vw, 4.25rem)`, 24ch), and article-body `h2`s (`Prose`) use `clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem)` bold, between Title and Headline. Field-card titles (feature cards, How-it-works challenges, the blue fit-check card) run a heavier card-title step around `clamp(1.5rem, 1.2rem + 1.4vw, 2.5rem)` at 900.

### Named Rules
**The 18px Floor Rule.** Body text never goes below 1.125rem anywhere on the site, including inside buttons (`md` buttons set `text-base`). This is the audience's accessibility floor and is not negotiable for a "compact" variant.

**The Balanced Heading Rule.** `h1` to `h3` set `text-wrap: balance`; body copy sets `text-wrap: pretty`. Hebrew line breaks are handled by the browser, never by manual `<br>`; a deliberate two-line headline uses block spans.

## Layout

A single centred shell (`max-w-shell`, 1520px) with a fluid side gutter (`--gutter`, up to 4.5rem) applied through `.gutter-x`, which also widens on whichever physical edge a notch or home indicator occupies (`max(var(--gutter), env(safe-area-inset-*))`). A narrow shell (1080px) holds single-column content: FAQ, legal pages, error pages and the centred interludes and closes on the explainer pages. Vertical rhythm is `--section-y` on every top-level section through the shared `Section`/`Shell` primitives. Reading measure is 68ch.

Sections alternate white and Cool Paper to separate without a hairline. Carousel tracks break out of the shell and run edge to edge with the gutter as their inline padding, while their heading, arrows and progress bar stay in the shell.

Image and card grids use `minmax(0, …)` tracks (for example `minmax(0,1.15fr) minmax(0,0.85fr)` for the plan picker), so long Hebrew words or intrinsic image widths can never push a column past its share. `html { overflow-x: clip }` guards against any overlapping composition widening the document, and `clip` (not `hidden`) keeps the sticky header working.

Breakpoints are Tailwind's defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280); the header adds one 420px step where the fit-check pill tightens its padding to stay on one line at 320px.

## Elevation & Depth

Depth is soft, offset drop shadows at three strengths (`--lift-1/2/3`), all keyed to the ink colour; no flat colour-matched halo, no tonal surface-layering scheme. Resting buttons, outline elements, testimonial cards and unselected plan cards use `lift-1`; field cards, the lead-form inner card, plan teasers and the selected plan use `lift-2`; the mobile drawer uses `lift-3`. The sticky header gains `lift-1` and a hairline only after 12px of scroll.

### Shadow Vocabulary
- **lift-1** (`0 1px 2px rgb(15 34 48 / 0.06), 0 4px 12px -4px rgb(15 34 48 / 0.1)`): resting buttons, testimonial cards, unselected plan cards, the scrolled header.
- **lift-2** (`0 2px 4px rgb(15 34 48 / 0.06), 0 16px 32px -12px rgb(15 34 48 / 0.18)`): field cards, plan teasers, the selected plan, hovered buttons.
- **lift-3** (`0 4px 8px rgb(15 34 48 / 0.08), 0 32px 64px -24px rgb(15 34 48 / 0.28)`): the mobile navigation drawer, the most lifted surface.

### Named Rules
**The Offset-Not-Halo Rule.** Depth always comes from an asymmetric, blurred drop shadow keyed to the ink colour; never a symmetric glow, never a shadow tinted to the element's own hue.

## Shapes

Corners run on a fixed scale: 14px for inputs and inline alerts, 20px for inset image tiles inside field cards and the What Matters rotator rows, 22px for floating image panels, 28px (`rounded-card`) for every card-scale container, a fluid 20px to 36px for the Dark Hero Card, and 999px (`rounded-pill`) for every button, pill and the carousel progress bar. Icon buttons (carousel arrows, check badges, nav toggle) are full circles. Borders are 2px: `hairline` on inputs and plan cards, `ink/15` on outline buttons and carousel arrows; unboxed list rules are 1px `ink/15`.

## Components

### Buttons
- **Shape:** fully round (`rounded-pill`), always; Rubik bold, `text-balance` so a long label breaks into even lines at 320px, icons pinned at their authored size.
- **Primary:** `green-deep` fill, white text, `lift-1` resting, `green` + `lift-2` + a 2px rise on hover. The default for every CTA, including the header's "בדיקת התאמה" pill, which never wraps and drops to tighter padding below 421px so it holds one line at 320px.
- **Purple:** `purple-deep` fill, `purple` hover; used only on the lavender field (Inverted Action Exception).
- **On-Color:** white fill, ink text; the action on blue, green and dark-hero fields.
- **Outline:** white fill, 2px `ink/15` border darkening to `ink/35` on hover; secondary verbs (the monthly plan teaser).
- **Ghost:** no fill, `ink-soft` text, Cool Paper on hover; used sparingly.
- **Pressed:** `active:scale-[0.97]` on every variant, because `hover:` compiles out on touch (`hoverOnlyWhenSupported`).
- **Sizes:** `md` (52px, `text-base`) and `lg` (60px, `text-lead`). Both clear the 48px floor. External links append a screen-reader "(נפתח בחלון חדש)".

### Cards / Containers
- **Corner Style:** 28px for every card-scale container.
- **Background:** a brand field (feature cards, How-it-works challenges, fit-check closes, store fallback) or white/wash (plans, lead panel, testimonials).
- **Shadow Strategy:** `lift-2` for field and feature cards, `lift-1` for quieter white cards; see Elevation & Depth.
- **Internal Padding:** fluid, `clamp(1.5rem, 3vw, 2.5rem)` up to `clamp(1.75rem, 4vw, 4rem)` by card size.

### Dark Hero Card (signature component)
The rounded dark card that opens the home and how-it-works pages. It runs almost the full viewport width, inset only by a small fluid margin so its fluid 20px to 36px corners read against white. Ground is Hero Field; media (video with a poster, or a photo) sits behind a Hero Field scrim strongest at the centre where the copy sits. The card sets `.on-dark`, which switches the focus ring to white. The video is hidden under `prefers-reduced-motion`, leaving the poster. Copy is centred: h1 with the cyan second line, a white/90 lead, one On-Color action.

### Page Hero
The interior-page opener: a full-bleed brand wash with the h1 in that hue's deep ink and an `ink-soft` lede. Variants: `back` (a Back Link above the h1, used by the explainers), `aside` (media beside the copy on wide screens, below on narrow), and `article` (smaller, wider h1 and deep bottom padding so the cover image can overlap the hero's lower edge).

### Back Link
A 48px-tall Rubik bold `ink-soft` link with a right-pointing arrow ("חזרה לעמוד הבית"); on hover the text darkens and underlines and the arrow nudges 3px.

### The Card Carousel (signature component)
A scroll-snapped row driven by the shared `useSnapCarousel` hook: position from `IntersectionObserver` (first child at least 60% visible), an `atEnd` flag that disables "next" when several cards are visible and the track can no longer scroll. Controls are 56px circular outline arrows beside the heading, each pointing the way it moves the track in RTL. Two instances:
- **Feature Cards:** three field cards (lavender, blue, green), one at a time, with the illustration inset as a 20px-radius tile on the field rather than butted to its edge, a 56px card action pill, and a thin ink progress bar under the shell; a primary fit-check CTA closes the section.
- **Testimonials:** white quote cards on Cool Paper with `lift-1`, several visible at once, name as the h3 and the source as a text label (no stars, no third-party logos), quote in `lead`.

### What Matters (signature component)
Without photos, an unboxed list: rows ruled by 1px `ink/15` hairlines top and bottom, each with a 48px solid `green-deep` check badge, an h3 title and an `ink-soft` body that moves into a third column on `lg`. When photos exist it becomes a rotator: pressable rows (outlined check badge, filled when active) beside a 22px-radius image, advancing every 6s, pausing on hover or focus and not advancing under reduced motion.

### Clients Ring
The client's own ring of portraits, edge-faded with a radial mask so the artwork never meets the page in a hard rectangle, with the clients line set bold in the open centre (`sm` and up) or dropped under the picture on phones.

### Plans Teaser and Plan Selector
The home teaser is two photo cards (28px, `lift-2`) with the plan name set white over an ink-to-transparent scrim, the featured annual plan ringed in 2px `blue-deep` and carrying the yellow-on-ink savings pill; figures and a full-width lg Button sit beneath the photo. On /payment the Plan Selector is a native radio group (shared `name`, visually hidden inputs, so arrow keys come from the browser): each plan is a 28px white card with a 2px border, `hairline` and `lift-1` at rest, `blue-deep` border and `lift-2` when selected, with a circular check that fills `blue-deep`. Focus is drawn on the card via `peer-focus-visible`.

### Store Fallback
The phase-1 end of the purchase path: a `green-deep` field card, white h3 and lead, white focus ring, and two On-Color store buttons.

### Fit-Check Close (signature component)
The shared close of the three explainers: same action, three shapes. Purple: a centred lavender panel, h2 in `purple-deep`, `purple` Button. Blue: either a start-aligned blue card with a card-title heading and an On-Color button, or a centred blue band. Green: a centred green band with white/90 body lines and an optional bold closing line. All field versions set a white focus ring.

### Inputs / Fields
- **Style:** 14px radius, 2px `hairline` border, white fill, 14px by 16px padding, `lead`-size text, `blue-deep` caret.
- **Focus:** border shifts to `blue-deep` (to `burgundy` on the delete-account form); the bordered field's colour shift is its focus signal.
- **Error:** `burgundy` border and a `burgundy-wash` message with `role="alert"`. The honeypot is off-screen with `tabIndex={-1}`, not `display:none`.

### Navigation
Sticky white header; transparent border until 12px of scroll, then `hairline` and `lift-1`. Desktop links (from `lg`) are 48px pills: active `blue-wash` with bold `blue-deep`, inactive `ink-soft` with Cool Paper on hover. The green fit-check pill sits at the end of the bar at every width. Below `lg` the nav moves to a start-edge drawer (`min(88vw, 380px)`, `lift-3`, scrim `ink/45`) with 60px rows that drop to 48px on short landscape screens.

### The Accordion (signature component)
Single-open FAQ list in the narrow shell, hairline-divided rows, no card chrome. The disclosure is a circular chevron badge that fills `blue-deep` and rotates 180° when open. First item open by default.

## Do's and Don'ts

### Do:
- **Do** keep body text at 1.125rem (18px) minimum everywhere; use `text-base` (18px to 21px) for reading copy in components.
- **Do** give every interactive target at least 48px in its shortest dimension.
- **Do** give focus a 3px solid outline (`blue-deep`) with 3px offset, and switch it to white on any dark or saturated field (`.on-dark` or `[--focus-ring:#ffffff]`).
- **Do** treat each brand hue as a full-bleed field claim (section or card background), never a small accent.
- **Do** use the authored stroke-icon set only (1.75 stroke, round caps/joins, 24-unit grid, no fill); never an emoji, a unicode glyph, or a third-party icon font.
- **Do** run the shared `Reveal` entrance (rise, de-blur, settle) for content that enters on scroll, staggered by 90ms per sibling, and render content visible with no animation under `prefers-reduced-motion`.
- **Do** author section headings without an eyebrow/kicker; the `SectionHeading` primitive has no eyebrow slot by design.
- **Do** use `minmax(0, …)` tracks for any grid that holds images or long Hebrew words.
- **Do** use opacity modifiers on colour tokens (`ink/15`, `white/90`) rather than hand-written rgba copies.

### Don't:
- **Don't** use orange anywhere; the structural reference's accent is a confirmed exclusion.
- **Don't** use a flat, colour-matched glow as a shadow; depth is always an offset, ink-tinted blur (`--lift-1/2/3`).
- **Don't** drop a touch target below 48px or body text below 18px to fit a "compact" layout.
- **Don't** give an element its own bespoke entrance animation; `Reveal` is the one authored entrance.
- **Don't** reach for a glyph icon, an emoji, or an icon font.
- **Don't** set a white action pill on the lavender field; it takes the `purple` variant.
- **Don't** use Emphasis Cyan or Brand Yellow outside their single jobs (the hero's second line; the savings figure on ink).
