import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // White text on the gradient: 4.55:1 on the lighter stop, 5.92:1 on the darker (globals.css).
  primary:
    "bg-cta text-white font-extrabold shadow-cta hover:brightness-95 active:brightness-90",
  outline:
    "border-2 border-hairline bg-white font-bold text-ink hover:border-ink/25 hover:shadow-lift-1",
  ghost: "font-bold text-ink-soft hover:text-ink hover:bg-sunken",
};

// pill-pad-*: inline padding that gives way to enlarged text (globals.css).
// The radius is half the minimum height rather than 999px: a one-line button
// is exactly the same pill, but a label that wraps to three or four lines at
// enlarged text becomes a rounded rectangle instead of a lens whose curve
// runs into the words.
const SIZES: Record<Size, string> = {
  md: "min-h-[52px] rounded-[26px] pill-pad-md text-base",  // never below the 18px floor
  lg: "min-h-[58px] rounded-[29px] pill-pad-lg text-lead",
};

/*
 * `hover:` compiles out on touch (see `hoverOnlyWhenSupported` in the Tailwind
 * config), so the hover lift cannot be the only thing that tells a finger the
 * press landed. `active:scale` is the pressed state for both kinds of input: on
 * a mouse it reads as the button giving under the click and cancels the lift,
 * on a finger it is the whole of the feedback. Scale stays on the compositor,
 * and `prefers-reduced-motion` collapses its duration without removing the
 * state itself.
 */
const SHARED =
  "inline-flex items-center justify-center gap-2.5 font-display tracking-tight " +
  // A flex row will squash an SVG before it wraps the label. On a 320px screen
  // that is where the longest CTAs live, so the icon is pinned at its authored
  // size here rather than at each of the sixteen call sites. `text-balance`
  // evens the two lines a long Hebrew label breaks into at that width, instead
  // of leaving a full first line over a two-word orphan.
  "[&_svg]:shrink-0 text-balance " +
  "transition-[background-color,box-shadow,border-color,transform,filter] duration-[var(--dur-fast)] ease-out-expo " +
  "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 " +
  // Forced colours strip the fill, which left every pill as bare text; a
  // border there is drawn in the system colour and gives it back its edge.
  "forced-colors:border-2";

type Props = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  "aria-pressed"?: boolean;
  "aria-describedby"?: string;
};

export default function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled,
  onClick,
  "aria-pressed": ariaPressed,
  "aria-describedby": ariaDescribedBy,
}: Props) {
  const classes = `${SHARED} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (href) {
    const external = href.startsWith("http");
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
          {/* Every external Button leaves the site in a new tab. A sighted
              visitor gets the tab itself as the notice; a screen-reader user
              gets nothing unless the name says so. */}
          <span className="sr-only"> (נפתח בחלון חדש)</span>
        </a>
      );
    }
    return (
      <Link href={href} className={classes} aria-describedby={ariaDescribedBy}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={ariaPressed}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </button>
  );
}
