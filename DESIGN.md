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
  ink: "#0f2230"
  ink-soft: "#375260"
  ink-faint: "#576f7d"
  surface: "#ffffff"
  sunken: "#f2f6f9"
  hairline: "#dfe7ed"
typography:
  display:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "clamp(2.125rem, 1.5rem + 4vw, 5rem)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 1.4rem + 2.1vw, 3.25rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  sm: "14px"
  md: "20px"
  lg: "22px"
  card: "28px"
  pill: "999px"
spacing:
  gutter: "clamp(1.25rem, 4vw, 3rem)"
  section-y: "clamp(4rem, 3rem + 6vw, 8.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.green-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 24px"
  button-primary-hover:
    backgroundColor: "{colors.green}"
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
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
---

# Design System: פעילים+ (Active Plus)

## Overview

**Creative North Star: "Two Things At Once"**

The site's thesis is that it never shows body or mind alone — every primary surface stages a moment where movement and thinking happen together, and the composition itself proves the claim rather than just stating it. The hero doesn't cut to a smiling-couple stock photo; it holds a real workout screen overlapping a cognitive prompt ("ובאותו הזמן: איזה פרי נעלם?") in one frame. The interactive demo doesn't explain Dual Tasking, it makes the visitor do it. This is a rebuild of a client-pinned reference (effectivate.co.il) in the client's own material: the reference supplied the *structure* — the page-scale color cards, the two-arrow carousel with a progress bar, the abilities grid, the game-style interactive demo, the lead form, the FAQ accordion — while Active Plus supplied the palette, the type pairing, and the explicit refusal of the reference's orange.

Everything is built to a 55+ reading and motor floor, not just WCAG AA: an 18px body-text minimum, 48px+ touch targets throughout, and a focus ring sized to be seen rather than merely compliant. Hebrew RTL is the only mode; nothing in the system assumes LTR as a base case.

**Key Characteristics:**
- Four brand hues used as full-bleed page fields (never small accent chips)
- Rubik display over Heebo body, both variable-loaded via `next/font`
- Depth from offset-plus-blur shadows only — no flat coloured halos
- One shared entrance animation for every revealed element, gated by `prefers-reduced-motion`
- Structure inherited from a pinned reference; palette and type are the project's own

## Colors

The palette is not a single accent on a neutral field — it is four co-equal brand hues, each one used as a page- or card-scale colour field tied to a fixed meaning, plus one narrow emphasis colour reserved for dark-ground moments.

### Primary
- **Movement Blue** (#0d68a4, deep #0a5f81, wash #e6f6fd, bright #1aa9e0): body/motion content — the app's motor-training material, primary navigation state, links, and the focus ring.
- **Progress Green** (#3d7d23, deep #2a5f17, wash #eaf6e3): the site's own progress and action colour — the default `Button` variant (`primary`), the lead-form submit, and the "included in your plan" checklist.
- **Cognition Purple** (#6b4fd8, deep #4b33a8, wash #efebfe): the mind-training content — the AI-personalisation card, the abilities grid's cognitive items, the entire Dual Task interactive demo section.
- **Daily-Practice Burgundy** (#6a2532, deep #4c1723, wash #f7ecef): the "today's session" content — the daily-workout feature card and one half of the "life doesn't happen one task at a time" argument.

Each brand hue ships as a triad: the base tone for large fields, `-deep` for text/icons/active states set against a light wash, and `-wash` as the tinted background those elements sit on. Blue carries a fourth value, `bright` (#1aa9e0) — the logo's turquoise, kept for marks, dots and illustration only. No text is ever set on it; it fails AA with white and with ink alike, which is why it is not the field value.

Every field value above is the brightest tone of its hue that still clears 4.5:1 with white, so the fields can carry white copy. They were darkened from the client's original card mockups for that reason — see The AA-on-Field Exception below.

### Secondary
- **Emphasis Cyan** (#5fd3ff): reserved for exactly one emphasised element per dark section — the hero's second headline line and the research strip's "42%" statistic. It never appears on a light background and never functions as a fifth field colour.

### Accent
- **Brand Yellow** (#fdb913): the third declared brand colour, held to exactly one semantic job — the money the visitor keeps (the annual plan's savings badge). 4.09:1 on the blue field, so it appears only as bold display type at 20px or larger and never as body text.

### Neutral
- **Ink** (#0f2230): primary text colour, AAA against white at body sizes; also used as a full-bleed dark section ground (the research strip) alongside the hero's own slightly warmer near-black (#08222f, a one-off used only behind the intro video).
- **Ink Soft** (#375260, 8.27:1 on white, 7.61:1 on Cool Paper — AAA): secondary text — ledes, body copy inside neutral cards, nav labels at rest.
- **Ink Faint** (#576f7d, 5.29:1 on white): tertiary text — captions, fine print, disabled-adjacent copy.
- **Surface White** (#ffffff): the base ground and raised-card background.
- **Cool Paper** (#f2f6f9, `--surface-sunken`): the sunken ground used to separate alternating sections (Header/Footer chrome, the FAQ/pricing/what-matters sections) from white ones.
- **Hairline** (#dfe7ed): the only border colour — dividers, card outlines, accordion rules.

### Named Rules
**The Page-Scale Field Rule.** A brand hue is a section or card background, not a small UI accent — the palette reads as confident because each colour claims real territory, not a 2px underline.

**The Value-Separation Rule.** Four fields have to separate by lightness, not only by hue. Three saturated darks at the same luminance read as one dark field wearing three colours, however far apart their hues are. The set therefore runs dark blue, dark green, **light lavender** and near-black burgundy: the purple card is a light ground with deep purple ink and a filled purple action, because a white pill disappears on it. A new field colour joins this scale or it does not join.

**The No-Orange Rule.** The structural reference (effectivate.co.il) uses orange as its accent; this build deliberately excludes it. No orange appears anywhere in the token set — this is a confirmed brand decision, not an oversight.

**The Two-Step Rule.** Every field hue ships as a pair: the `-deep` value is a filled control's resting state and the base value is its hover. The step is sized to read as a change — blue 7.08:1 → 5.73:1, green 7.64:1 → 5.05:1 against white. A hue whose two steps land within a ratio point of each other has no hover.

**The Inverted Action Exception.** Actions on a colour field are white pills — except on the light lavender field, where a white pill has nothing to stand against. That card takes a filled `purple-deep` pill instead. The rule is not "white pills"; it is "the action carries the strongest available contrast against its own field", and on three of the four fields that happens to be white.

**The AA-on-Field Exception (stated, not accidental).** Every text colour in this system clears AAA (≥7:1) on white and on `sunken`, including `ink-soft`, which sets the article body. White text on a colour field does not: it reaches AA (4.5:1) and stops. AAA is unreachable at these hues without darkening the brand colours past recognition, so the trade is deliberate and bounded — colour fields carry short card copy only, and every long-form reading surface stays on `ink-soft` over a neutral ground. Secondary copy on a field is tinted white at the lowest opacity that still clears 4.5:1 on that specific field (green, the lightest, needs 95%; burgundy, the darkest, tolerates 85%) — never gray.

## Typography

**Display Font:** Rubik (weights 500/700/900), with `system-ui, sans-serif` fallback
**Body Font:** Heebo (variable weight), with `system-ui, sans-serif` fallback

**Character:** Rubik carries every heading at heavy weight (700–900) with tightened tracking (-0.025em) and `text-wrap: balance`, giving the display layer a blunt, confident stance; Heebo runs everything else at a calm, generous 1.65 line-height built for a reader who wants zero ambiguity, not editorial flourish.

### Hierarchy
- **Display** (900, `clamp(2.125rem, 1.5rem + 4vw, 5rem)`, 1.02): the h1 — one per page, the hero and page-hero headline.
- **Headline** (900, `clamp(1.875rem, 1.4rem + 2.1vw, 3.25rem)`, 1.1): the h2 — every section heading.
- **Title** (700, `clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)`, 1.25): the h3 — card titles, FAQ questions, footer column headings.
- **Lead** (400, `clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem)`, 1.55, Heebo): section ledes and standfirsts under a headline; capped to the `measure` width (68ch).
- **Body** (400, 1.125rem / 18px, 1.65, Heebo): the reading floor for every paragraph on the site — this is a hard minimum, not a default that gets overridden downward.

Long-form article body (`Prose`) uses its own in-between heading size (`clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem)`, bold) for in-article `h2`s, distinct from the section-heading scale above — it sits between Title and Headline because article bodies read at a slower, denser rhythm than marketing sections.

### Named Rules
**The 18px Floor Rule.** Body text never goes below 1.125rem anywhere on the site. This is the audience's accessibility floor, not a stylistic choice, and it is not to be treated as negotiable for a "compact" variant.

**The Balanced Heading Rule.** `h1`–`h3` set `text-wrap: balance`; body copy sets `text-wrap: pretty`. Hebrew ragged-line breaks are handled by the browser, never by manual `<br>` insertion.

## Layout

The page runs on a single centred shell (`max-w-shell`, 1240px) with a fluid side gutter (`--gutter`, `clamp(1.25rem, 4vw, 3rem)`) and a fluid vertical section rhythm (`--section-y`, `clamp(4rem, 3rem + 6vw, 8.5rem)`) — every top-level `<section>` uses these two variables via the shared `Section`/`Shell` primitives, so page rhythm is centrally controlled rather than re-declared per section. Reading measure is capped at 68ch (`--measure`) for ledes and long-form prose. A narrower shell variant (820px) exists for single-column content (FAQ). Sections alternate between white (`surface`) and Cool Paper (`sunken`) grounds to separate adjacent sections without a hairline. `html { overflow-x: clip }` is a deliberate guard: several compositions (the intro screen stack, the hero's overlapping figure) use rotation and negative-margin offsets that must never be allowed to widen the document — `clip` rather than `hidden` was chosen specifically because it preserves `position: sticky` (the header).

## Elevation & Depth

Depth is conveyed entirely through soft, offset drop shadows layered at three strengths (`--lift-1/2/3`) — there is no flat, non-offset colour-matched halo anywhere in the system, and no tonal (Material-style) surface-layering scheme. Shadows scale with how "raised" an element is: cards at rest use `lift-1`–`lift-2`, floating elements (the hero's overlapping demo panel, the pricing feature card) use `lift-2`–`lift-3`.

### Shadow Vocabulary
- **lift-1** (`0 1px 2px rgb(15 34 48 / 0.06), 0 4px 12px -4px rgb(15 34 48 / 0.1)`): resting buttons and outline cards.
- **lift-2** (`0 2px 4px rgb(15 34 48 / 0.06), 0 16px 32px -12px rgb(15 34 48 / 0.18)`): feature cards, the carousel article, hovered buttons.
- **lift-3** (`0 4px 8px rgb(15 34 48 / 0.08), 0 32px 64px -24px rgb(15 34 48 / 0.28)`): the hero's floating app-screen imagery — the single most "lifted" element on the site.

### Named Rules
**The Offset-Not-Halo Rule.** Depth always comes from an asymmetric, blurred drop shadow keyed to the ink colour — never a symmetric glow, never a shadow tinted to match the element's own hue.

## Shapes

Corners run on a five-step radius scale, from tight (form inputs) to fully round (pills): 14px for inputs and small inline elements, 20px for compact tiles (ability cards, the dual-task demo's fruit tiles), 22px for floating image panels (the intro screen stack, the hero's overlapping demo card), 28px (`rounded-card`) for every major card-scale container, and 999px (`rounded-pill`) for every button and pill-shaped action. Icon-badge and nav-toggle buttons use a full circle instead of the pill radius. Borders are single-purpose: 2px `hairline` (or `ink/15`) rules on outline buttons, card borders and dividers — never a second border colour.

## Components

### Buttons
- **Shape:** fully round (999px / `rounded-pill`), always.
- **Primary:** `green-deep` fill, white text, `lift-1` → `lift-2` on hover, a −2px vertical lift on hover (`hover:-translate-y-0.5`). This is the default variant and the one used for every submit/CTA action.
- **On-Color:** white fill, ink text — used when a button sits on a coloured field (the hero's secondary CTA, the featured pricing plan).
- **Outline:** white fill, 2px `ink/15` border that darkens on hover — the secondary action verb ("לפרטים נוספים", "איך זה עובד באפליקציה").
- **Ghost:** no fill, `ink-soft` text that darkens and gains a `sunken` background on hover — used sparingly (the demo's "עוד סיבוב" replay action).
- Two sizes only: `md` (52px min-height) and `lg` (60px min-height, `lead`-size text). Every size clears the 48px touch-target floor.

### Cards / Containers
- **Corner Style:** 28px (`rounded-card`) for every card-scale container — feature cards, pricing plans, the lead-form panel, the dual-task demo panel.
- **Background:** either a brand-hue field (feature carousel, "what matters" argument cards) or white/wash (pricing, demo, lead panel).
- **Shadow Strategy:** `lift-2` at rest; see Elevation & Depth.
- **Internal Padding:** fluid, `clamp(1.5rem, 3vw, 2.5rem)` to `clamp(1.75rem, 4vw, 4rem)` depending on card size.

### The Card CTA Pill (signature component)
Inside a full-bleed colour-field card, the call-to-action is always a solid white pill button, never an outline or on-field-coloured button — this is the reference's signature device, carried over intact: a bright, unmissable white pill sitting on a saturated field, with its own `lift-1 → lift-2` hover lift independent of the card's own shadow.

### Inputs / Fields
- **Style:** 14px radius, 2px `hairline` border, white fill, 3.5-unit vertical / 4-unit horizontal padding, `lead`-size text.
- **Focus:** border shifts to `blue-deep`; no separate glow — the global focus-visible ring (see Do's and Don'ts) does not apply inside a bordered field, the border colour shift is the field's own focus signal.
- **Error:** border and message shift to `burgundy` / `burgundy-wash`, `role="alert"` on the message. A honeypot field is visually and programmatically hidden (off-screen, `tabIndex={-1}`) rather than merely `display:none`, to catch bots without penalising assistive tech.

### Navigation
Sticky header, white ground, transparent border until scrolled past 12px (then a `hairline` border and `lift-1` appear). Active link: `blue-wash` pill background with `blue-deep` bold text; inactive: `ink-soft`, `sunken` on hover. Below `xl`, the nav collapses to a full-screen-height drawer with 56px-tall link rows and a full-width primary CTA at the bottom. Every nav target — desktop pill, mobile row, menu toggle — clears 44–56px.

### The Card Carousel (signature component)
A single-row, scroll-snapped, one-card-at-a-time carousel (not a JS-animated slider) — prev/next controls are 56px circular icon buttons, position is tracked by `IntersectionObserver` rather than manual index math, and progress is shown as a thin filled bar beneath the shell rather than dots. Structure is reference-derived (effectivate.co.il); palette (one full brand field per card) and imagery are the project's own.

### The Accordion (signature component)
Single-open FAQ list, full-width hairline-divided rows, no card chrome. The disclosure affordance is a circular chevron badge that fills solid `blue-deep` and rotates 180° when open — not a bare chevron glyph. First item defaults open.

### The Abilities Grid (signature component)
A responsive 1–3 column grid of link cards, each marked only by a small solid colour dot (not an icon) keyed to the ability's cognitive/physical tone — deliberately quieter than the feature-card carousel, since this section's job is breadth, not persuasion.

## Do's and Don'ts

### Do:
- **Do** keep body text at 1.125rem (18px) minimum everywhere — this is the audience's floor, not a default.
- **Do** give every interactive target at least 48px in its shortest dimension.
- **Do** give focus a 3px solid outline (`blue-deep`) with 3px offset — sized to be seen, not merely to pass an audit.
- **Do** treat each brand hue as a full-bleed field claim (section or card background), never a small accent.
- **Do** use the authored stroke-icon set only (1.75 stroke, round caps/joins, 24-unit grid, no fill) — never an emoji, a unicode glyph, or a third-party icon font.
- **Do** run the shared `Reveal` entrance (rise, de-blur, settle) for content that enters on scroll, staggered by 90ms per sibling, and respect `prefers-reduced-motion` by rendering content visible with no animation.
- **Do** author section headings without an eyebrow/kicker — the `SectionHeading` primitive has no eyebrow slot by design; the heading carries its own weight.

### Don't:
- **Don't** use orange anywhere — the structural reference's accent colour is a confirmed exclusion, not an oversight.
- **Don't** use a flat, colour-matched glow as a shadow — depth is always an offset, ink-tinted blur (`--lift-1/2/3`).
- **Don't** drop a touch target below 48px or body text below 18px to fit a "compact" layout.
- **Don't** give an element its own bespoke entrance animation — there is exactly one authored entrance (`Reveal`), shared by everything that animates on scroll.
- **Don't** reach for a glyph icon, an emoji, or an icon font — every icon on the site is hand-authored to the same stroke grammar.
