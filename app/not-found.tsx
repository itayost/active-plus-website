import Link from "next/link";
import Button from "@/components/ui/Button";
import { Shell } from "@/components/ui/Section";
import { NAV } from "@/lib/constants";

export default function NotFound() {
  return (
    <section className="bg-surface py-[var(--section-y)]">
      <Shell width="narrow">
        <p className="font-display text-[clamp(4rem,3rem+6vw,8rem)] font-black leading-none tracking-tighter text-blue-wash">
          404
        </p>
        <h1 className="mt-4 text-h2 font-display font-black">הדף לא נמצא</h1>
        <p className="mt-5 max-w-measure text-lead text-ink-soft">
          הדף שחיפשתם אינו קיים או שהוסר. הנה כמה מקומות שאפשר להמשיך מהם.
        </p>

        <Button href="/" size="lg" className="mt-9">
          חזרה לדף הבית
        </Button>

        <nav aria-label="דפים באתר" className="mt-12 border-t border-hairline pt-8">
          <ul className="flex flex-wrap gap-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-[48px] items-center rounded-pill border border-hairline px-5 text-ink-soft transition-colors hover:border-blue-deep hover:text-blue-deep"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Shell>
    </section>
  );
}
