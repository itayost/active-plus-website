import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "purple" | "onColor" | "outline" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-green-deep text-white shadow-lift-1 hover:bg-green hover:shadow-lift-2 active:shadow-lift-1",
  purple:
    "bg-purple-deep text-white shadow-lift-1 hover:bg-purple hover:shadow-lift-2 active:shadow-lift-1",
  onColor:
    "bg-white text-ink shadow-lift-1 hover:shadow-lift-2 active:shadow-lift-1",
  outline:
    "border-2 border-ink/15 bg-white text-ink hover:border-ink/35 hover:shadow-lift-1",
  ghost: "text-ink-soft hover:text-ink hover:bg-sunken",
};

// pill-pad-*: inline padding that gives way to enlarged text (globals.css).
// The radius is half the minimum height rather than 999px: a one-line button
// is exactly the same pill, but a label that wraps to three or four lines at
// enlarged text becomes a rounded rectangle instead of a lens whose curve
// runs into the words.
const SIZES: Record<Size, string> = {
  md: "min-h-[52px] rounded-[26px] pill-pad-md text-base",  // never below the 18px floor
  lg: "min-h-[60px] rounded-[30px] pill-pad-lg text-lead",
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
  "inline-flex items-center justify-center gap-2.5 font-display font-bold tracking-tight " +
  // A flex row will squash an SVG before it wraps the label. On a 320px screen
  // that is where the longest CTAs live, so the icon is pinned at its authored
  // size here rather than at each of the sixteen call sites. `text-balance`
  // evens the two lines a long Hebrew label breaks into at that width, instead
  // of leaving a full first line over a two-word orphan.
  "[&_svg]:shrink-0 text-balance " +
  "transition-[background-color,box-shadow,border-color,transform] duration-[var(--dur-fast)] ease-out-expo " +
  "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55";

type Props = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
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
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
