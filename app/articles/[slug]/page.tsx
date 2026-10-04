import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import Prose from "@/components/ui/Prose";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import LeadSection from "@/components/sections/LeadSection";
import { ArrowIcon } from "@/components/ui/icons";
import { ARTICLES, getArticle } from "@/content/articles";

const COVER: Record<string, string> = {
  "improve-memory-after-50": "/img/article-1.webp",
  "balance-after-50": "/img/article-2.webp",
  "brain-plasticity-dual-tasking": "/img/article-3.webp",
};

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: "article",
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const others = ARTICLES.filter((item) => item.slug !== article.slug);

  return (
    <>
      <PageHero
        title={article.title}
        lede={article.metaDescription}
        tone="burgundy"
        breadcrumb={{ href: "/articles", label: "כל המאמרים" }}
      />

      <article className="bg-surface py-[var(--section-y)]">
        <Shell width="narrow">
          <Reveal>
            <Image
              src={COVER[article.slug] ?? "/img/article-1.webp"}
              alt=""
              width={1200}
              height={800}
              priority
              sizes="(max-width: 860px) 100vw, 820px"
              className="w-full rounded-card object-cover shadow-lift-1"
            />
          </Reveal>

          <Prose blocks={article.blocks} className="mt-12" />

          {article.faq.length > 0 ? (
            <div className="mt-16">
              <h2 className="text-h2 font-display font-black">שאלות נפוצות</h2>
              <div className="mt-8">
                <Accordion items={article.faq} />
              </div>
            </div>
          ) : null}

          <aside className="mt-16 rounded-card bg-[var(--green-wash)] p-[clamp(1.75rem,3vw,2.75rem)]">
            <h2 className="text-h3 font-display font-bold text-green-deep">
              פעילים+ — תנועה וחשיבה באותו אימון
            </h2>
            <p className="mt-4 text-ink-soft">
              כ־10 דקות ביום, מהבית ובקצב שמתאים לך.
            </p>
            <Button href="/contact" size="lg" className="mt-7">
              בוחרים להישאר פעילים
              <ArrowIcon className="h-5 w-5" />
            </Button>
          </aside>

          <nav aria-label="מאמרים נוספים" className="mt-16 border-t border-hairline pt-10">
            <h2 className="text-h3 font-display font-bold">להמשך קריאה</h2>
            <ul className="mt-6 space-y-4">
              {others.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/articles/${item.slug}`}
                    className="group flex items-start gap-4 rounded-[18px] border border-hairline p-5 transition-[border-color,box-shadow] duration-[var(--dur)] hover:border-transparent hover:shadow-lift-1"
                  >
                    <ArrowIcon className="mt-1 h-6 w-6 shrink-0 text-blue-deep transition-transform duration-[var(--dur)] ease-out-expo group-hover:-translate-x-1" />
                    <span className="font-display text-lead font-bold">
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Shell>
      </article>

      <LeadSection source={`article:${article.slug}`} />
    </>
  );
}
