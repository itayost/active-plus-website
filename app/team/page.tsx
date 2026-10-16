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
    <InnerPage title="הצוות המקצועי">
      <ul className="m-0 grid list-none p-0 sm:grid-cols-2 sm:gap-x-10">
        {TEAM.map((m) => (
          <li key={m.name} className="flex items-center gap-3.5 border-b border-divider py-3.5 sm:gap-5">
            <Image
              src={m.photo}
              width={200}
              height={200}
              alt={m.name}
              sizes="(min-width: 640px) 96px, 72px"
              className="h-[72px] w-[72px] flex-none rounded-full object-cover shadow-[0_4px_12px_rgba(20,40,80,.12)] sm:h-24 sm:w-24"
            />
            <div className="min-w-0">
              <b className="block font-display text-[18px] font-bold leading-snug text-ink">{m.name}</b>
              <div className="mt-0.5 text-[15px] leading-snug text-blue">{m.role}</div>
            </div>
          </li>
        ))}
      </ul>
    </InnerPage>
  );
}
