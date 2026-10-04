import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";
import { ARTICLE_MEDIA } from "@/content/article-media";
import type { Article } from "@/content/articles";

/**
 * A secondary article teaser: the cover as an inset tile, the linked title,
 * the summary and a read-more cue. Used by the /articles list and by the
 * "keep reading" row under each article.
 */
export default function ArticleCard({
  article,
}: {
  article: Pick<Article, "slug" | "title" | "metaDescription">;
}) {
  return (
    <article className="group flex h-full flex-col rounded-card border border-hairline bg-white shadow-lift-1 transition-[transform,box-shadow] duration-[var(--dur)] ease-out-expo hover:-translate-y-[3px] hover:shadow-lift-2">
      <div className="p-3 pb-0">
        <div className="relative aspect-video overflow-hidden rounded-tile">
          <Image
            src={ARTICLE_MEDIA[article.slug].cover}
            alt=""
            fill
            sizes="(max-width: 768px) 92vw, 46vw"
            className="object-cover"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-[clamp(min(1.25rem,6.25vw),2.5vw,2rem)]">
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
  );
}
