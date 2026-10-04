import type { Config } from "tailwindcss";

/**
 * Colours are CSS variables, which Tailwind cannot split into channels. For an
 * unmodified utility Tailwind passes either no opacityValue or its own
 * `var(--tw-*-opacity, 1)` placeholder; both mean "fully opaque", so the bare
 * variable is returned. That keeps plain bg-*, text-* and border-* working on
 * engines without color-mix (iOS Safari < 16.2, Chrome < 111, Firefox < 113).
 * Only a real modifier (bg-ink/85) needs color-mix.
 */
const cssVar = (name: string): string =>
  (({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined || opacityValue.startsWith("var(--tw-")
      ? `var(${name})`
      : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`) as unknown as string;

const config: Config = {
  /*
   * Wraps every `hover:` utility in `@media (hover: hover)`, so the whole set
   * compiles out on touch. Without it a finger leaves hover latched: tap a
   * feature card and it stays lifted and shadowed until something else is
   * tapped, which on this site means a card that looks selected when nothing
   * is. Pressed feedback is the `active:` states instead, which fire on both
   * kinds of input.
   */
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
        display: ["var(--font-rubik)", "system-ui", "sans-serif"],
      },
      colors: {
        surface: cssVar("--surface"),
        sunken: cssVar("--surface-sunken"),
        hairline: cssVar("--hairline"),
        hero: cssVar("--hero-field"),
        ink: {
          DEFAULT: cssVar("--ink"),
          soft: cssVar("--ink-soft"),
          faint: cssVar("--ink-faint"),
        },
        blue: {
          DEFAULT: cssVar("--blue"),
          bright: cssVar("--blue-bright"),
          deep: cssVar("--blue-deep"),
          wash: cssVar("--blue-wash"),
        },
        green: {
          DEFAULT: cssVar("--green"),
          deep: cssVar("--green-deep"),
          wash: cssVar("--green-wash"),
        },
        purple: {
          DEFAULT: cssVar("--purple"),
          deep: cssVar("--purple-deep"),
          wash: cssVar("--purple-wash"),
        },
        yellow: cssVar("--yellow"),
        emphasis: cssVar("--emphasis-cyan"),
        burgundy: {
          DEFAULT: cssVar("--burgundy"),
          deep: cssVar("--burgundy-deep"),
          wash: cssVar("--burgundy-wash"),
        },
      },
      fontSize: {
        base: ["clamp(1.125rem, 1rem + 0.25vw, 1.3125rem)", { lineHeight: "1.65" }],
        lead: ["clamp(1.25rem, 1.05rem + 0.6vw, 1.625rem)", { lineHeight: "1.55" }],
        h3: ["clamp(1.375rem, 1.15rem + 0.7vw, 1.875rem)", { lineHeight: "1.25" }],
        h2: ["clamp(1.875rem, 1.3rem + 2vw, 3.75rem)", { lineHeight: "1.1" }],
        h1: ["clamp(2.125rem, 1.4rem + 3.6vw, 5.5rem)", { lineHeight: "1.02" }],
        /* The three in-between steps DESIGN.md sanctions. Size only: each
           call site keeps its own leading, and Prose h2s inherit the global
           heading leading. */
        "h1-article": "clamp(2rem, 1.3rem + 2.6vw, 4.25rem)", // long editorial h1
        "h2-prose": "clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem)", // article-body h2
        "card-title": "clamp(1.5rem, 1.2rem + 1.4vw, 2.5rem)", // field-card title
      },
      maxWidth: {
        measure: "var(--measure)",
        shell: "1520px",
        narrow: "1080px",
      },
      boxShadow: {
        "lift-1": "var(--lift-1)",
        "lift-2": "var(--lift-2)",
        "lift-3": "var(--lift-3)",
      },
      transitionTimingFunction: {
        "out-expo": "var(--ease-out-expo)",
      },
      keyframes: {
        /* One copy's width, because the track holds the list three times
           (see PartnersBand). */
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% / 3))" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
      },
      /* The corner scale from DESIGN.md. Named for their jobs rather than
         sm/md/lg, which Tailwind already defines at 2-8px. */
      borderRadius: {
        field: "14px", // inputs and inline alerts
        tile: "20px", // image tiles inset in a card, list rows
        panel: "22px", // floating image panels
        card: "28px", // every card-scale container
        hero: "clamp(20px, 2.5vw, 36px)", // the Dark Hero Card
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
