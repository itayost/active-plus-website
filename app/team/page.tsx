import type { Metadata } from "next";
import Image from "next/image";
import InnerPage from "@/components/layout/InnerPage";
import { TEAM } from "@/content/pages";

export const metadata: Metadata = {
  title: "הצוות המקצועי",
  description: "הצוות שמאחורי פעילים+: פיזיותרפיה, ריפוי בעיסוק, שיקום נוירולוגי ואימון.",
};

export default function TeamPage() {
  return (
    <InnerPage title="הצוות המקצועי" wide>
      {/* The prototype's list rows on a phone, two columns of rows on a
          tablet, and from lg portrait cards three to a row, a short last
          row centred. */}
      <ul className="m-0 grid list-none p-0 sm:grid-cols-2 sm:gap-x-10 lg:flex lg:flex-wrap lg:justify-center lg:gap-6">
        {TEAM.map((m) => (
          <li
            key={m.name}
            className="flex items-center gap-3.5 border-b border-divider py-3.5 sm:gap-5 lg:basis-[calc((100%-3rem)/3)] lg:flex-col lg:gap-4 lg:rounded-card lg:border lg:border-hairline lg:bg-surface lg:px-6 lg:pb-8 lg:pt-9 lg:text-center lg:shadow-card"
          >
            <Image
              src={m.photo}
              width={200}
              height={200}
              alt=""
              sizes="(min-width: 1024px) 160px, (min-width: 640px) 96px, 72px"
              className="h-[72px] w-[72px] flex-none rounded-full object-cover shadow-[0_4px_12px_rgba(20,40,80,.12)] sm:h-24 sm:w-24 lg:h-40 lg:w-40 lg:ring-8 lg:ring-blue-wash"
            />
            <div className="min-w-0">
              <b className="block font-display text-[18px] font-bold leading-snug text-ink lg:text-[22px]">{m.name}</b>
              <div className="mt-0.5 text-[15px] leading-snug text-blue lg:mt-1.5 lg:text-base lg:text-blue-deep">{m.role}</div>
              {m.bio ? <p className="m-0 mt-1.5 text-[15px] leading-snug text-ink-soft lg:mt-3 lg:text-base">{m.bio}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </InnerPage>
  );
}
