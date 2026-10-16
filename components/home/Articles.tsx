import Link from "next/link";
import ArticleCard from "@/components/articles/ArticleCard";
import SectionHeading from "@/components/ui/SectionHeading";
import SwipeRow from "@/components/ui/SwipeRow";
import { ARTICLES } from "@/content/articles";
import { ARTICLES_HEADING } from "@/content/home";

/** The three articles: a swipe row on a phone, a three-column grid from lg. */
export default function Articles() {
  return (
    <section aria-labelledby="articles-heading" className="pt-12 lg:pt-16">
      <div className="mx-auto w-full max-w-shell gutter-x">
        <SectionHeading
          id="articles-heading"
          title={ARTICLES_HEADING}
          swipeHint
          action={
            <Link
              href="/articles"
              className="inline-flex min-h-12 items-center text-lg font-bold text-blue-deep underline underline-offset-4"
            >
              לכל המאמרים
            </Link>
          }
        />
      </div>
      <div className="mx-auto mt-3 w-full max-w-shell lg:mt-6">
        <SwipeRow label={ARTICLES_HEADING} desktop="grid-3" itemWidth="card">
          {ARTICLES.map((article, i) => (
            <ArticleCard key={article.slug} article={article} number={i + 1} />
          ))}
        </SwipeRow>
      </div>
    </section>
  );
}
