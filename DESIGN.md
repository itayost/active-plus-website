---
name: פעילים+ (Active Plus)
description: Dual-tasking fitness-and-cognition training for Israeli readers 55+, in Hebrew RTL. The client's 2026-10 handoff system - white, one blue, green actions.
colors:
  surface: "#ffffff"
  sunken: "#F7F9FC"
  hairline: "#EEF0F3"
  divider: "#ECEEF1"
  ink: "#111111"
  ink-soft: "#3d4450"
  ink-faint: "#5b6470"
  blue: "#1E6FD9"
  blue-deep: "#1659B3"
  blue-wash: "#EAF1FB"
  blue-sky: "#EEF5FE"
  green: "#2E9E5B"
  green-hi: "#29864E"
  green-lo: "#217241"
  green-deep: "#237A47"
  green-wash: "#E8F5ED"
  star: "#F5B301"
  danger: "#C62828"
  danger-deep: "#A81F1F"
typography:
  hero:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "37px phone; clamp(2.75rem, 4vw, 4.5rem) from lg"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  page-title:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.35rem + 1.6vw, 3rem); clamp(2.5rem, 1.2rem + 2.4vw, 3.75rem) from lg"
    fontWeight: 800
    lineHeight: 1.15
  section:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "27px phone; 40px from lg"
    fontWeight: 700
    lineHeight: 1.1
  card-title:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "19-20px"
    fontWeight: 700
  body:
    fontFamily: "Heebo, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1rem + 0.25vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  field: "14px"
  logo: "16px"
  tile: "18px"
  video: "20px"
  card: "22px"
  hero: "32px"
  pill: "999px"
spacing:
  gutter: "clamp(min(1.25rem, 6.25vw), 4vw, 4.5rem)"
  section-gap-phone: "48px"
  section-gap-desktop: "64px"
  shell: "1520px"
  narrow: "1080px"
  measure: "68ch"
components:
  button-primary:
    background: "linear-gradient(180deg, {colors.green-hi}, {colors.green-lo})"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    height: "58px (lg) / 52px (md)"
    shadow: "0 10px 22px rgb(33 114 65 / 0.28)"
  button-outline:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    border: "2px {colors.hairline}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    border: "1px {colors.hairline}"
    shadow: "0 10px 28px rgb(20 40 80 / 0.07)"
    rounded: "{rounded.card}"
  round-header-button:
    size: "46px disc in a 48px hit box"
    background: "{components.button-primary.background}"
  input:
    backgroundColor: "#ffffff"
    border: "1px #8A8F98"
    rounded: "{rounded.field}"
    height: "52px"
    fontSize: "17px"
---

# Design System: פעילים+ (Active Plus)

## Overview

**Creative North Star: "Clean, White, Premium"**

Since the 2026-10 handoff the client's phone prototype (`docs/handoff/peilim-plus-2026-10/prototype/index.html`) is the source of truth for look and structure. It replaces the earlier multi-colour field system (blue, green, purple and burgundy cards, a dark hero, Rubik display type). The page is white; one blue carries emphasis; green means "do this" and appears only on actions; cards are white, hairline-bordered and softly shadowed; sections are separated by space, not by colour bands.

The prototype only shows a phone. On phones the site follows it section for section, copy for copy. Desktop was designed in the same language: rows become grids where the count fits, carousels with arrows where it does not, and reading pages become an editorial spread. A phone column floating in a wide page is the failure this system is built to avoid.

Everything is built to a 55+ reading and motor floor, not just WCAG AA: 18px minimum for body text (growing to 21px on wide screens), 48px minimum touch targets, a focus ring sized to be seen, pinch-zoom never capped, reduced motion honoured, and layouts that survive the browser's text at 200% on a 320px phone. Hebrew RTL is the only mode.

**Key characteristics:**
- White ground, `#F7F9FC` only for the footer and quiet panels
- One accent blue (`#1E6FD9`) for title lines, card titles, links and hints
- Green gradient pills for every action, and only for actions
- Soft card shadow `0 10px 28px rgba(20,40,80,.07)` with a `#EEF0F3` hairline
- Heebo only, weights 400 / 500 / 700 / 800
- Swipe rows on phones, grids or arrowed carousels on desktop

## Colors

### Accent
- **Blue** `#1E6FD9` (4.85:1 on white): the accented second line of the hero h1, inner-page titles, card titles in the world cards, links, the "החליקו הצידה לעוד" hint and the FAQ markers.
- **Blue Deep** `#1659B3`: hover and pressed step of blue, the focus ring, active nav state, and **any blue text on a wash**.
- **Blue Wash** `#EAF1FB`: image placeholders, the fit-check close panels, the active nav pill, the ring around team portraits.
- **Blue Sky** `#EEF5FE`: the top of the hero wash (`linear-gradient(180deg, #EEF5FE 0%, #fff 60%)`).

### Action
- **CTA gradient** `#29864E` to `#217241` (top to bottom): every primary button and the two round header buttons. The handoff drew `#35AC64` to `#2A9253`; white text on that measures under 4.5:1, so the gradient was darkened, keeping the look. White text measures **4.55:1 on the top stop and 5.92:1 on the bottom stop**.
- **Green** `#2E9E5B`: the annual plan card's border and other decoration. White on it is 3.41:1, so never put text on it.
- **Green Deep** `#237A47`: green text on white (5.32:1), check badges.
- **Green Wash** `#E8F5ED`: the lead form's success state.

### Neutral
- **Ink** `#111`: all body copy and headings.
- **Ink Soft** `#3d4450`: secondary text, hours, legal links; AAA on white and on `#F7F9FC` (9.3:1).
- **Ink Faint** `#5b6470`: placeholders and the company line only (5.69:1 on `#F7F9FC`); never instructions or labels.
- **Surface** `#fff`, **Sunken** `#F7F9FC` (footer, the plans' "what both include" panel on desktop), **Hairline** `#EEF0F3` (card borders), **Divider** `#ECEEF1` (list rules, FAQ rows, footer rules).

### Status
- **Star** `#F5B301`: testimonial stars only.
- **Danger** `#C62828`: field errors. **Danger Deep** `#A81F1F`: hover of a filled danger button (white on it is 7.29:1).

### Named Rules
**The Blue-on-Wash Rule.** Normal-size blue text on `#EAF1FB` or `#EEF5FE` uses `blue-deep`, never `blue`. The hero and PageHero h1 accents are large text, where the 3:1 floor applies. `#1E6FD9` measures 4.27:1 on `#EAF1FB` and 4.42:1 on `#EEF5FE`, both under AA; `#1659B3` measures 5.93:1 and 6.14:1. This covers the back link on the page hero, the fit-check close headings and the active nav pill.

**The Green-Means-Act Rule.** Green fills are actions (buttons, the round header buttons). Green is never a field, a decorative band or a heading colour.

**The Gradient-Contrast Rule.** axe cannot read text over a CSS gradient, so every gradient pairing is computed by hand and recorded here. Any change to `--green-hi` / `--green-lo` must keep white text at 4.5:1 on both stops.

## Typography

**Font:** Heebo (`next/font/google`, Hebrew subset, weights 400 / 500 / 700 / 800). No other family. No 900 weight anywhere. The Tailwind `font-display` utility is kept as an alias of Heebo so call sites did not churn.

### Hierarchy
- **Hero h1** (800, 37px on a phone, `clamp(2.75rem, 4vw, 4.5rem)` from lg, 1.1, -0.02em): two lines, the second in blue.
- **Inner-page h1** (800, blue, `clamp(1.75rem, 1.35rem + 1.6vw, 3rem)`, and `clamp(2.5rem, 1.2rem + 2.4vw, 3.75rem)` in the desktop rail).
- **Section heading** (700, 27px phone, 40px from lg): every home section h2 (`SectionHeading`).
- **Inner-page section heading** (800, blue, `clamp(1.3125rem, 1.15rem + 0.6vw, 1.75rem)`): the prototype's h3 look on an h2.
- **Card title** (700, 19-20px): world cards in blue, program and article cards in ink.
- **Body** (400, `text-base` = 18px to 21px fluid, 1.65): all long reading (about, research, articles, FAQ answers).
- **Small** (13-14px): the swipe hint (14px/500, blue, 4.85:1) and the annual card's badge (13px/800 on the gradient); never long text.

### Named Rules
**The 18px Floor Rule.** Long-reading text is never under 18px. Card copy that the prototype sets at 15-16px is set at 18px here; only labels, badges and hints go smaller.

**The Balanced Heading Rule.** h1-h3 use `text-wrap: balance`, body `text-wrap: pretty`. A deliberate two-line headline uses block spans or a `<br>`, never a manual break inside a sentence.

## Layout

- **Shell:** `max-w-shell` (1520px) centred, with the fluid `--gutter` applied by `.gutter-x` (20px on a phone, as in the prototype; widened on whichever physical edge a notch occupies).
- **Rhythm:** about 48px between home sections on phones (`pt-12`), 64px from lg (`pt-16`). Inner pages use `--section-y` at the bottom.
- **Swipe rows** run edge to edge with the gutter as inline padding (`.snap-gutter` keeps the snap port aligned with it).
- **Breakpoints:** Tailwind defaults. `md` (768) turns the world cards two by two and the footer into two columns; `lg` (1024) is the desktop switch for grids, the hero's two columns, the inner-page rail, the pricing columns and the footer's three columns; the inline header nav switches on at 1200px (75rem), in globals.css, where its single row fits.
- **Grids** use `minmax(0, ...)` tracks so long Hebrew words and intrinsic image widths never push a column past its share. `html { overflow-x: clip }` guards the document.

### Desktop compositions
- **Home hero:** text and CTA at the start, the rounded photo (22px) at the end, from lg.
- **Home rows:** world cards 4 across; program cards and articles 3 across; testimonials and partners stay carousels with arrows (the arrows disappear when a row fits whole).
- **Inner pages** (`InnerPage`): from lg a 5/7 editorial spread. The title, plus the page's `intro` (the about photo; the contact details), holds a sticky start rail; the body runs beside it at the 68ch measure, its first heading flush with the title. `wide` pages (team) keep the title on top: four portrait cards in a row.
- **Contact:** details in the rail, the form in a card beside it.
- **Pricing:** plan cards and the sunken "what both include" panel side by side (equal columns at lg, 36rem plus the rest from xl).
- **Footer:** one column on a phone; brand across the top with menu and contact side by side on a tablet; brand, menu and contact as three columns over a ruled legal row from lg.

## Elevation & Depth

Depth is one soft drop shadow keyed to a navy ink, never a coloured halo.

- **shadow-card** `0 10px 28px rgb(20 40 80 / 0.07)`: every card, partner tile, plan card and the desktop form card.
- **shadow-cta** `0 10px 22px rgb(33 114 65 / 0.28)`: green buttons and the round header buttons.
- **lift-1**: the header once scrolled 12px. **lift-3**: the menu drawer.

Swipe tracks carry 20px of top padding (`pt-5`) and 40px of bottom padding so the card shadow (18px of upward reach) is never clipped by the scroller.

## Shapes

`rounded-field` 14px inputs; `rounded-logo` 16px partner tiles; `rounded-tile` 18px small and list cards (world cards, the monthly plan row); `rounded-video` 20px video tiles; `rounded-card` 22px every card and panel; `rounded-hero` 32px the hero block's bottom corners; `rounded-pill` buttons. Portraits are circles.

## Components

### Header (`components/layout/Header.tsx`)
Phone and up to 1199px: the text wordmark ("פעילים" in blue, "+" in ink, 800) at the start; at the end the menu button then the call button, as in the handoff (call ends the row at the left edge). Both are 46px gradient discs in 48px hit boxes, 12px apart, with a 1px focus offset so neighbouring rings never touch. The call button draws `CallIcon` (a filled handset, the handoff's glyph and the icon set's one stated fill exception).

From 1200px, and only while the bar is at least 75rem wide, the five links sit inline (48px pills, 18px text; the current page is `blue-wash` with `blue-deep`, never bold, because bold Hebrew is wider and would widen the row), followed by the green "בדיקת התאמה" pill and the call button. That switch lives in one place, `app/globals.css` (`@media (min-width: 1200px) { @container (width >= 75rem) }`); Header.tsx has no breakpoint classes for it. The row measures about 1,148px at 1200px, so it never wraps; re-measure if a link is added. So 1024-1199px and any width at enlarged text get the phone bar and the drawer.

The drawer: six 60px rows (48px on short screens), the fit-check button, the phone with `CallIcon`, and the hours. Focus trap, Escape, scroll lock, `inert` when closed.

### Footer (`components/layout/Footer.tsx`)
`#F7F9FC` field under a divider. Wordmark (30px), the six menu links, phone with the hours under it, WhatsApp (`https://wa.me/972506316060`), email in blue-deep, address, "מבית המרכז לשיפור התנועה בע״מ", and the legal links (privacy policy, delete account; "ניהול מנוי" only with the web checkout on). Grid areas place the blocks per breakpoint without changing reading or Tab order.

### Buttons (`components/ui/Button.tsx`)
- **Primary:** CTA gradient, white 800 text, `shadow-cta`. `lg` 58px, `md` 52px. Full width on phones and tablets for the lone CTAs (`CtaBar`, the hero), auto-width centred pills from lg.
- **Outline:** white, 2px hairline border, ink text (store buttons, "לכל המאמרים").
- **Ghost:** ink-soft text, sunken on hover.
- **States:** hover lifts 2px and dims 5%; `active:scale-[0.97]` is the pressed state for touch and mouse (hover compiles out on touch); radius is half the min height so a label wrapped at 200% text becomes a rounded rectangle, not a lens.

### SectionHeading (`components/ui/SectionHeading.tsx`)
The home h2 plus the optional blue "החליקו הצידה לעוד ←" hint (phones and tablets only) and an optional trailing link.

### SwipeRow (`components/ui/SwipeRow.tsx`)
Scroll-snap row on phones (card 284px, video 190px, logo 138px), becoming at lg either a plain grid (`grid-3`, `grid-4`) or the same track with `CarouselArrows` above it. Arrows are `aria-disabled` at the ends (focus stays put) and are not rendered at all when the whole row fits. `focusableItems` makes each card a Tab stop when it has nothing interactive inside; a focused card is scrolled into view. Smooth scrolling is dropped under reduced motion.

### Card (`components/ui/Card.tsx`)
White, 1px hairline border, `shadow-card`, 22px. World cards and the monthly plan row use the 18px tile radius.

### Hero (`components/home/Hero.tsx`)
On the hero wash with 32px bottom corners: h1, sub, the client's hero photo (a family in the park, 1370×1148; the LCP image, preloaded with high fetch priority, and described in its alt text), then the CTA. It replaced the hero video on 2026-10-16 at the client's request. Full-bleed photo on a phone; two columns from lg and on a short landscape phone (`.hero-grid`).

### InnerPage and PageHero
`InnerPage` is the prototype's inner-page shell (about, research, team, contact): see Desktop compositions. Its body styles plain descendant `h2` and `p`, so pages write semantic markup only; a component nested in the body that must look different sets its own margin and colour. `PageHero` opens the explainers and articles on the hero wash, with an optional `BackLink` (blue-deep, per the Blue-on-Wash Rule) and media aside.

### Pricing (`components/payment/PlanSelector.tsx`)
Annual card: 2px green border, the gradient badge "מנוי שנתי – החיסכון הגדול", 69 ₪ לחודש at 38px/800, terms, the computed saving in blue, full-width lg button. Monthly: a lighter 18px row with a text "לבחירה" action. Pressed state (checkout open) is a green ring. "What both include" sits in a sunken panel beside the plans from lg.

### Store Fallback
With the web checkout off, the purchase path ends in a `blue-wash` panel with a `blue-deep` heading, ink text and the two green store buttons.

### Fit-Check Close
The explainers' and articles list's closing panel: centred `blue-wash` panel, `blue-deep` heading, ink-soft body, the green CTA "בדקו איזו תוכנית מתאימה לכם".

### Accordion (FAQ)
Divider-ruled rows, 17px/700 questions (20px from lg), a blue "+" / "−" marker, answers at 18px. First item open. One open at a time.

### Forms (`components/forms/*`)
52px inputs, 14px radius, 1px `#8A8F98` border (3.25:1 on white, the 1.4.11 floor is 3:1), 17px text, blue-deep caret; focus turns the border blue-deep and adds a 2px blue-deep ring (3px in all, the site focus weight). Labels are 700 above the field; optional fields read "(לא חובה)" inline after the label text. One error line under its field (`role="alert"`). Submit is the full-width gradient pill.

### Icons (`components/ui/icons.tsx`)
One grammar: 1.75 stroke, round caps and joins, 24-unit grid, no fills, with one stated exception (`CallIcon`). `PhoneIcon` is the smartphone, for SMS codes and numbers to type. No emoji, no unicode glyph icons, no icon font.

## Do's and Don'ts

### Do:
- **Do** keep long-reading text at 18px or more and every touch target at 48px or more.
- **Do** use `blue-deep` for blue text on any wash.
- **Do** compute contrast by hand for text over a gradient and record it here.
- **Do** give desktop its own composition: grids, rails and columns, not the phone column on a wide page.
- **Do** keep the prototype's copy verbatim.
- **Do** honour reduced motion: no reveal, no smooth scroll.

### Don't:
- **Don't** bring back purple, burgundy, yellow, cyan emphasis, a dark hero field or Rubik.
- **Don't** use green as decoration or for headings; green means act.
- **Don't** put text on flat `#2E9E5B`.
- **Don't** add header breakpoint classes in Header.tsx; the switch lives in globals.css.
- **Don't** render carousel arrows that can go nowhere.
- **Don't** ship placeholder boxes ("[תמונה: ...]", "[לוגו שותף]"); use real assets or hide the section (the testimonial videos section renders nothing while its list is empty).
