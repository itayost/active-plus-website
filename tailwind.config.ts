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
        /* Heebo too: the utility name stays so call sites do not churn. */
        display: ["var(--font-heebo)", "system-ui", "sans-serif"],
      },
      colors: {
        surface: cssVar("--surface"),
        sunken: cssVar("--surface-sunken"),
        hairline: cssVar("--hairline"),
        divider: cssVar("--divider"),
        ink: {
          DEFAULT: cssVar("--ink"),
          soft: cssVar("--ink-soft"),
          faint: cssVar("--ink-faint"),
        },
        blue: {
          DEFAULT: cssVar("--blue"),
          deep: cssVar("--blue-deep"),
          wash: cssVar("--blue-wash"),
          sky: cssVar("--blue-sky"),
        },
        green: {
          DEFAULT: cssVar("--green"),
          hi: cssVar("--green-hi"),
          lo: cssVar("--green-lo"),
          deep: cssVar("--green-deep"),
          wash: cssVar("--green-wash"),
        },
        star: cssVar("--star"),
        danger: {
          DEFAULT: cssVar("--danger"),
          deep: cssVar("--danger-deep"),
        },
      },
      backgroundImage: {
        /* The primary button's fill and the hero's top wash. */
        cta: "linear-gradient(180deg, var(--green-hi), var(--green-lo))",
        "hero-wash": "linear-gradient(180deg, var(--blue-sky) 0%, var(--surface) 60%)",
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
        card: "var(--shadow-card)",
        cta: "var(--shadow-cta)",
      },
      transitionTimingFunction: {
        "out-expo": "var(--ease-out-expo)",
      },
      /* The corner scale from DESIGN.md. Named for their jobs rather than
         sm/md/lg, which Tailwind already defines at 2-8px. */
      borderRadius: {
        field: "14px", // inputs and inline alerts
        logo: "16px", // partner logo tiles
        tile: "18px", // image tiles inset in a card, list cards
        video: "20px", // testimonial video tiles
        panel: "22px", // floating image panels
        card: "22px", // every card-scale container
        hero: "32px", // the hero block's bottom corners
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
