import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";
import { ARTICLES } from "@/content/articles";
import { ARTICLE_MEDIA } from "@/content/article-media";

/** The three articles as a strip, for pages that point readers onward (payment). */
export default function ArticlesStrip() {
  return (
    <Section labelledBy="articles-strip-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="articles-strip-heading" className="text-h2 font-display font-black">
          מאמרים
        </h2>
        <Button href="/articles" variant="outline">
          לכל המאמרים
        </Button>
      </div>

      <ul className="mt-9 grid gap-5 md:grid-cols-3">
        {ARTICLES.map((article, index) => (
          <Reveal as="li" key={article.slug} delayIndex={index} className="min-w-0">
            <Link
              href={`/articles/${article.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-hairline bg-surface shadow-lift-1 transition-[transform,box-shadow] duration-[var(--dur-fast)] ease-out-expo hover:-translate-y-0.5 hover:shadow-lift-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={ARTICLE_MEDIA[article.slug].cover}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 92vw, 31vw"
                  className="object-cover"
                />
              </div>
              <span className="flex flex-1 flex-col gap-4 p-6">
                <h3 className="font-display text-[1.375rem] font-bold leading-[1.3]">{article.title}</h3>
                <span className="mt-auto inline-flex min-h-[48px] items-center gap-2 font-display font-bold text-blue-deep">
                  לקריאת המאמר
                  <ArrowIcon className="h-5 w-5" />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
