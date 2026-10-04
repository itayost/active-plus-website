import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import ArticleCard from "@/components/articles/ArticleCard";
import PageHero from "@/components/layout/PageHero";
import FitCheckClose from "@/components/explainers/FitCheckClose";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Section, { Shell } from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";
import { ARTICLES } from "@/content/articles";
import { ARTICLE_MEDIA } from "@/content/article-media";

export const metadata: Metadata = {
  title: "מאמרים",
  description: "מה שכדאי לדעת על הגוף, המוח והתנועה אחרי גיל 50.",
};

const [LEAD, ...MORE] = ARTICLES;

export default function ArticlesPage() {
  return (
    <>
      <div className="bg-burgundy-wash pb-[clamp(4rem,8vw,7rem)]">
        <PageHero
          title="מאמרים"
          lede="מה שכדאי לדעת על הגוף, המוח והתנועה אחרי גיל 50."
          tone="burgundy"
        />
      </div>

      <section aria-label="רשימת המאמרים" className="bg-surface pb-[var(--section-y)]">
        <Shell>
          <Reveal>
            <article className="relative -mt-[clamp(4rem,8vw,7rem)] grid min-w-0 overflow-hidden rounded-card bg-burgundy text-white [--focus-ring:#ffffff] shadow-lift-2 transition-[transform,box-shadow] duration-[var(--dur)] ease-out-expo hover:-translate-y-[3px] hover:shadow-lift-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
              <div className="p-[clamp(min(0.75rem,3.75vw),1.6vw,1.25rem)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-tile lg:aspect-auto lg:h-full lg:min-h-[460px]">
                  <Image
                    src={ARTICLE_MEDIA[LEAD.slug].cover}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 92vw, 760px"
                    className="object-cover object-[50%_30%]"
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-col justify-center p-[clamp(min(1.5rem,7.5vw),3.5vw,3.5rem)] pt-[clamp(0.75rem,3.5vw,3.5rem)]">
                <h2 className="font-display text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)] font-black leading-[1.12]">
                  <Link
                    href={`/articles/${LEAD.slug}`}
                    className="hover:underline hover:decoration-2 hover:underline-offset-[6px]"
                  >
                    {LEAD.title}
                  </Link>
                </h2>
                <p className="mt-5 max-w-[44ch] text-lead text-white/90">{LEAD.metaDescription}</p>
                <Button
                  href={`/articles/${LEAD.slug}`}
                  variant="onColor"
                  size="lg"
                  className="mt-9 self-start"
                >
                  לקריאת המאמר
                  <ArrowIcon className="h-5 w-5" />
                </Button>
              </div>
            </article>
          </Reveal>

          <ul className="mt-6 grid gap-6 md:grid-cols-2">
            {MORE.map((article, index) => (
              <Reveal as="li" key={article.slug} delayIndex={index} className="min-w-0">
                <ArticleCard article={article} />
              </Reveal>
            ))}
          </ul>
        </Shell>
      </section>

      <Section labelledBy="articles-cta" className="pt-0">
        <FitCheckClose
          tone="blue"
          centered
          cta="לבדיקת התאמה"
          headingId="articles-cta"
          heading="רוצים לראות איך פעילים+ יכולה להתאים גם לכם?"
        />
      </Section>
    </>
  );
}
