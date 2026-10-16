import Link from "next/link";

const SIZES = {
  // Capped in px: a brand mark that doubled at 200% text would push the
  // header's buttons off a phone.
  md: "text-[min(1.625rem,30px)]",
  lg: "text-[30px]", // footer wordmark, as in the handoff
} as const;

/** The wordmark is text, not an image: no request, and it follows the font. */
export default function Logo({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-[48px] min-w-12 shrink-0 items-center ${className}`}
      aria-label="פעילים+ – לדף הבית"
    >
      <span className={`font-display font-extrabold leading-none tracking-tight ${SIZES[size]}`}>
        <span className="text-blue">פעילים</span>
        <span className="text-ink">+</span>
      </span>
    </Link>
  );
}
