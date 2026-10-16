import SectionHeading from "@/components/ui/SectionHeading";
import SwipeRow from "@/components/ui/SwipeRow";
import { TESTIMONIAL_VIDEOS, VIDEOS_HEADING, type TestimonialVideo } from "@/content/home";

type Props = { videos?: readonly TestimonialVideo[] };

/**
 * Recommender videos. Renders nothing at all while the list is empty, so no
 * heading is left promising videos that are not there; the CTA bar that
 * follows it on the page is rendered either way.
 */
export default function TestimonialVideos({ videos = TESTIMONIAL_VIDEOS }: Props) {
  if (videos.length === 0) return null;

  return (
    <section aria-labelledby="videos-heading" className="pt-12 lg:pt-16">
      <div className="mx-auto w-full max-w-shell gutter-x">
        <SectionHeading id="videos-heading" title={VIDEOS_HEADING} swipeHint />
      </div>
      <div className="mx-auto w-full max-w-shell lg:mt-6">
        <SwipeRow label={VIDEOS_HEADING} desktop="carousel" itemWidth="video">
          {videos.map((video) => (
            <figure key={video.src} className="m-0 flex flex-col gap-2">
              <video
                src={video.src}
                poster={video.poster}
                controls
                playsInline
                preload="metadata"
                aria-label={`${video.name}: ${video.caption}`}
                className="h-[300px] w-full rounded-video bg-blue-wash object-cover"
              />
              <figcaption className="flex flex-col">
                <b className="text-base font-bold text-ink">{video.name}</b>
                <span className="text-lg text-ink">{video.caption}</span>
              </figcaption>
            </figure>
          ))}
        </SwipeRow>
      </div>
    </section>
  );
}
