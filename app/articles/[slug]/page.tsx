import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import Prose from "@/components/ui/Prose";
import Reveal from "@/components/ui/Reveal";
import Section, { Shell } from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";
import { ARTICLES, getArticle } from "@/content/articles";
import { ARTICLE_MEDIA } from "@/content/article-media";
import { FIT_CHECK } from "@/lib/constants";

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

  const media = ARTICLE_MEDIA[article.slug];
  const others = ARTICLES.filter((item) => item.slug !== article.slug);

  const figure = media?.inner ? (
    <figure className="mt-12">
      <Image
        src={media.inner}
        alt={media.innerAlt ?? ""}
        width={1536}
        height={1024}
        sizes="(max-width: 1180px) 92vw, 720px"
        className="h-auto w-full rounded-[22px] shadow-lift-1"
      />
    </figure>
  ) : null;

  return (
    <>
      <PageHero
        article
        title={article.title}
        lede={article.metaDescription}
        tone="burgundy"
        breadcrumb={{ href: "/articles", label: "כל המאמרים" }}
      />

      {media ? (
        <Shell>
          <Image
            src={media.cover}
            alt=""
            width={1536}
            height={1024}
            priority
            sizes="(max-width: 1520px) 92vw, 1440px"
            className="-mt-[clamp(5rem,10vw,9rem)] aspect-[4/3] w-full rounded-card object-cover object-[50%_18%] shadow-lift-2 sm:aspect-video"
          />
        </Shell>
      ) : null}

      <article className="bg-surface pb-[var(--section-y)] pt-[clamp(2.5rem,5vw,4rem)]">
        <Shell className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-x-[clamp(3rem,7vw,9rem)]">
          <div className="min-w-0 xl:col-start-1">
            <Prose blocks={article.blocks} figure={figure} />

            {article.faq.length > 0 ? (
              <div className="mt-16">
                <h2 className="text-h2 font-display font-black">שאלות נפוצות</h2>
                <div className="mt-8">
                  <Accordion items={article.faq} />
                </div>
              </div>
            ) : null}

            <aside
              aria-labelledby="article-fit"
              className="mt-16 grid gap-7 rounded-card bg-[var(--green-wash)] p-[clamp(1.75rem,4vw,3rem)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div>
                <h2
                  id="article-fit"
                  className="font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-black leading-[1.15] text-green-deep"
                >
                  פעילים+ — תנועה וחשיבה באותו אימון
                </h2>
                <p className="mt-3 text-lead text-ink-soft">
                  כ־10 דקות ביום, מהבית ובקצב שמתאים לך.
                </p>
              </div>
              <Button href={FIT_CHECK.href} size="lg">
                לבדיקת התאמה
                <ArrowIcon className="h-5 w-5" />
              </Button>
            </aside>
          </div>

          <aside
            aria-label="בדיקת התאמה"
            className="hidden xl:sticky xl:top-36 xl:col-start-2 xl:row-start-1 xl:block"
          >
            <div className="rounded-card bg-[var(--burgundy-wash)] p-8">
              <p className="mb-6 font-display text-h3 font-bold text-burgundy">
                כ־10 דקות ביום, מהבית ובקצב שמתאים לך.
              </p>
              <Button href={FIT_CHECK.href} size="lg" className="w-full">
                לבדיקת התאמה
              </Button>
              <p className="mt-8 border-t border-burgundy/20 pt-6 font-display font-bold text-ink">
                מאמרים נוספים
              </p>
              <ul className="mt-3 grid gap-3">
                {others.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/articles/${item.slug}`}
                      className="text-ink-soft underline decoration-burgundy/35 underline-offset-[5px] hover:text-burgundy"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </Shell>
      </article>

      <Section tone="sunken" labelledBy="more-articles">
        <h2 id="more-articles" className="text-h2 font-display font-black">
          להמשך קריאה
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {others.map((item, index) => (
            <Reveal as="li" key={item.slug} delayIndex={index} className="min-w-0">
              <article className="group flex h-full flex-col rounded-card border border-hairline bg-white shadow-lift-1 transition-[transform,box-shadow] duration-[var(--dur)] ease-out-expo hover:-translate-y-[3px] hover:shadow-lift-2">
                <div className="p-3 pb-0">
                  <div className="relative aspect-video overflow-hidden rounded-[20px]">
                    <Image
                      src={ARTICLE_MEDIA[item.slug].cover}
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
                      href={`/articles/${item.slug}`}
                      className="hover:underline hover:decoration-2 hover:underline-offset-[5px]"
                    >
                      {item.title}
                    </Link>
                  </h3>
                  <p className="text-ink-soft">{item.metaDescription}</p>
                  <span className="mt-auto inline-flex min-h-[48px] items-center gap-2 self-start font-display text-base font-bold text-burgundy">
                    לקריאת המאמר
                    <ArrowIcon className="h-5 w-5 transition-transform duration-[var(--dur)] ease-out-expo group-hover:-translate-x-1" />
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </Section>
    </>
  );
}
