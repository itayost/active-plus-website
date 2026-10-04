import Link from "next/link";
import { ArrowBackIcon } from "@/components/ui/icons";

/**
 * The one link back up a level, above a page hero's h1: the explainers return
 * home, an article returns to the list. The arrow points right, the way back
 * in RTL.
 */
export default function BackLink({
  href = "/",
  label = "חזרה לעמוד הבית",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="group mb-5 inline-flex min-h-[48px] items-center gap-2 font-display text-base font-bold text-ink-soft transition-colors hover:text-ink hover:underline hover:underline-offset-[5px]"
    >
      <ArrowBackIcon className="h-5 w-5 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-[3px]" />
      {label}
    </Link>
  );
}
