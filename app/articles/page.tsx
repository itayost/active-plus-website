import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
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
      <div className="bg-[var(--burgundy-wash)] pb-[clamp(4rem,8vw,7rem)]">
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
              <div className="p-[clamp(0.75rem,1.6vw,1.25rem)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] lg:aspect-auto lg:h-full lg:min-h-[460px]">
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
              <div className="flex min-w-0 flex-col justify-center p-[clamp(1.5rem,3.5vw,3.5rem)] pt-[clamp(0.75rem,3.5vw,3.5rem)]">
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
                <article className="group flex h-full flex-col rounded-card border border-hairline bg-white shadow-lift-1 transition-[transform,box-shadow] duration-[var(--dur)] ease-out-expo hover:-translate-y-[3px] hover:shadow-lift-2">
                  <div className="p-3 pb-0">
                    <div className="relative aspect-video overflow-hidden rounded-[20px]">
                      <Image
                        src={ARTICLE_MEDIA[article.slug].cover}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 92vw, 46vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-[clamp(1.25rem,2.5vw,2rem)]">
                    <h3 className="font-display text-h3 font-bold">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="hover:underline hover:decoration-2 hover:underline-offset-[5px]"
                      >
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-ink-soft">{article.metaDescription}</p>
                    <span className="mt-auto inline-flex min-h-[48px] items-center gap-2 self-start font-display text-base font-bold text-burgundy">
                      לקריאת המאמר
                      <ArrowIcon className="h-5 w-5 transition-transform duration-[var(--dur)] ease-out-expo group-hover:-translate-x-1" />
                    </span>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </Shell>
      </section>

      <Section labelledBy="articles-cta" className="!pt-0">
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
