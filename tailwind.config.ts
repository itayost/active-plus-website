import type { Config } from "tailwindcss";

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
        surface: "var(--surface)",
        sunken: "var(--surface-sunken)",
        hairline: "var(--hairline)",
        hero: "var(--hero-field)",
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          faint: "var(--ink-faint)",
        },
        blue: {
          DEFAULT: "var(--blue)",
          bright: "var(--blue-bright)",
          deep: "var(--blue-deep)",
          wash: "var(--blue-wash)",
        },
        green: {
          DEFAULT: "var(--green)",
          deep: "var(--green-deep)",
          wash: "var(--green-wash)",
        },
        purple: {
          DEFAULT: "var(--purple)",
          deep: "var(--purple-deep)",
          wash: "var(--purple-wash)",
        },
        yellow: "var(--yellow)",
        burgundy: {
          DEFAULT: "var(--burgundy)",
          deep: "var(--burgundy-deep)",
          wash: "var(--burgundy-wash)",
        },
      },
      fontSize: {
        base: ["clamp(1.125rem, 1rem + 0.25vw, 1.3125rem)", { lineHeight: "1.65" }],
        lead: ["clamp(1.25rem, 1.05rem + 0.6vw, 1.625rem)", { lineHeight: "1.55" }],
        h3: ["clamp(1.375rem, 1.15rem + 0.7vw, 1.875rem)", { lineHeight: "1.25" }],
        h2: ["clamp(1.875rem, 1.3rem + 2vw, 3.75rem)", { lineHeight: "1.1" }],
        h1: ["clamp(2.125rem, 1.4rem + 3.6vw, 5.5rem)", { lineHeight: "1.02" }],
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
        /* Half the track's width, because the track holds the list twice. */
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        /*
         * Travel along the arc, not up and down. One layer rotates about the
         * ring centre so the child slides along the curve; an inner layer runs
         * the exact inverse so the portrait stays upright instead of tumbling.
         * Both must share a duration and delay or they stop cancelling.
         */
        /*
         * A full revolution from each child's own start angle. The cancel
         * pair turns the opposite way at the same rate, which keeps the face
         * upright while its position still travels the ring. Duration must
         * match between a spin and its cancel or the two stop agreeing.
         */
        "arc-cw": {
          from: { transform: "rotate(var(--arc-start))" },
          to: { transform: "rotate(calc(var(--arc-start) + 360deg))" },
        },
        "arc-ccw": {
          from: { transform: "rotate(var(--arc-start))" },
          to: { transform: "rotate(calc(var(--arc-start) - 360deg))" },
        },
        "arc-cw-cancel": {
          from: { transform: "rotate(var(--arc-start))" },
          to: { transform: "rotate(calc(var(--arc-start) - 360deg))" },
        },
        "arc-ccw-cancel": {
          from: { transform: "rotate(var(--arc-start))" },
          to: { transform: "rotate(calc(var(--arc-start) + 360deg))" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        "arc-cw": "arc-cw 30s linear infinite",
        "arc-ccw": "arc-ccw 30s linear infinite",
        "arc-cw-cancel": "arc-cw-cancel 30s linear infinite",
        "arc-ccw-cancel": "arc-ccw-cancel 30s linear infinite",
      },
      borderRadius: {
        card: "28px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
