import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import LeadSection from "@/components/sections/LeadSection";
import { ArrowIcon } from "@/components/ui/icons";
import { ARTICLES } from "@/content/articles";

export const metadata: Metadata = {
  title: "מאמרים",
  description:
    "זיכרון, שיווי משקל ופלסטיות מוחית אחרי גיל 50 — מה המחקר אומר ומה אפשר לעשות עם זה בשגרה.",
};

const COVER = ["/img/article-1.webp", "/img/article-2.webp", "/img/article-3.webp"];

export default function ArticlesPage() {
  return (
    <>
      <PageHero
        title="מאמרים"
        lede="מה שכדאי לדעת על זיכרון, שיווי משקל ותנועה אחרי גיל 50 — בלי הבטחות ובלי הפחדות."
        tone="burgundy"
      />

      <section className="bg-surface py-[var(--section-y)]">
        <Shell>
          <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((article, index) => (
              <Reveal as="li" key={article.slug} delayIndex={index}>
                <article className="group flex h-full flex-col">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="flex h-full flex-col overflow-hidden rounded-card border border-hairline transition-[box-shadow,transform,border-color] duration-[var(--dur)] ease-out-expo hover:-translate-y-1.5 hover:border-transparent hover:shadow-lift-2"
                  >
                    <span className="relative block aspect-[4/3] overflow-hidden">
                      <Image
                        src={COVER[index] ?? COVER[0]}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1240px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[var(--dur-slow)] ease-out-expo group-hover:scale-[1.04]"
                      />
                    </span>

                    <span className="flex flex-1 flex-col p-7">
                      <h2 className="font-display text-h3 font-bold text-ink">
                        {article.title}
                      </h2>
                      <span className="mt-4 flex-1 text-ink-soft">
                        {article.metaDescription}
                      </span>
                      <span className="mt-6 inline-flex items-center gap-2 font-display font-bold text-blue-deep">
                        לקריאת המאמר
                        <ArrowIcon className="h-5 w-5 transition-transform duration-[var(--dur)] ease-out-expo group-hover:-translate-x-1" />
                      </span>
                    </span>
                  </Link>
                </article>
              </Reveal>
            ))}
          </ul>
        </Shell>
      </section>

      <LeadSection source="articles" />
    </>
  );
}
