import type { Metadata } from "next";
import BackLink from "@/components/explainers/BackLink";
import FitCheckClose from "@/components/explainers/FitCheckClose";
import PageHero from "@/components/layout/PageHero";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import {
  ArrowDownIcon,
  ArrowIcon,
  ArrowUpIcon,
  ClipboardIcon,
  MindIcon,
  MovementIcon,
  SlidersIcon,
} from "@/components/ui/icons";
import { PERSONAL_PLAN as C } from "@/content/explainers";

export const metadata: Metadata = {
  title: C.title,
  description: C.lede,
};

const STEP_ICONS = [ClipboardIcon, SlidersIcon];

export default function PersonalPlanPage() {
  return (
    <>
      <PageHero tone="purple" title={C.title} lede={C.lede} back={<BackLink />} />

      <Section>
        <ol className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch lg:gap-5">
          {C.start.map((text, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li key={text} className="contents">
                {i === 1 ? (
                  <span
                    aria-hidden="true"
                    className="flex min-h-[48px] items-center justify-center text-purple"
                  >
                    <ArrowIcon className="h-8 w-8 -rotate-90 lg:rotate-0" />
                  </span>
                ) : null}
                <Reveal
                  delayIndex={i}
                  className="flex flex-col gap-5 rounded-card border border-hairline bg-white p-[clamp(min(1.5rem,7.5vw),3vw,2.5rem)] shadow-lift-1"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-purple-wash text-purple-deep">
                    <Icon className="h-7 w-7" />
                  </span>
                  <p className="text-lead text-ink">{text}</p>
                </Reveal>
              </li>
            );
          })}
        </ol>

        <div className="mt-[clamp(4rem,8vw,7rem)] grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
          <h2 id="pivot-h" className="max-w-[14ch] text-h2 font-display font-black text-purple-deep">
            {C.pivot.heading}
          </h2>
          <p className="max-w-[40ch] text-lead text-ink-soft">{C.pivot.body}</p>
        </div>

        <ul
          aria-labelledby="pivot-h"
          className="mt-[clamp(2.5rem,5vw,3.5rem)] grid gap-5 md:grid-cols-2"
        >
          {C.pair.map((item, i) => {
            const isBody = i === 0;
            const Icon = isBody ? MovementIcon : MindIcon;
            return (
              <Reveal as="li" key={item.label} delayIndex={i}>
                <div
                  className={`flex h-full flex-col gap-5 rounded-card p-[clamp(min(1.75rem,8.75vw),3.5vw,3rem)] ${
                    isBody ? "bg-blue-wash text-blue-deep" : "bg-purple-wash text-purple-deep"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-white shadow-lift-1">
                      <Icon className="h-7 w-7" />
                    </span>
                    <h3 className="text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] font-display font-black leading-[1.1]">
                      {item.label}
                    </h3>
                  </div>
                  <p className="max-w-[46ch] text-[1.25rem] leading-[1.6] text-ink-soft">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </Section>

      <Section tone="sunken" width="narrow" className="!py-[clamp(3.5rem,7vw,6rem)]">
        <ul className="rounded-card bg-white shadow-lift-2">
          {[
            { rule: C.rule.up, Icon: ArrowUpIcon, chip: "bg-purple-deep text-white" },
            { rule: C.rule.down, Icon: ArrowDownIcon, chip: "bg-purple-wash text-purple-deep" },
          ].map(({ rule, Icon, chip }, i) => (
            <li
              key={rule.strong}
              className={`grid grid-cols-[auto_1fr] items-center gap-5 px-[clamp(min(1.25rem,6.25vw),3vw,2.5rem)] py-[clamp(1.5rem,3vw,2.25rem)] ${
                i > 0 ? "border-t border-hairline" : ""
              }`}
            >
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-pill ${chip}`}>
                <Icon className="h-7 w-7" />
              </span>
              <p className="font-display text-h3 font-medium text-ink-soft">
                {rule.lead}
                <strong className="font-bold text-ink">{rule.strong}</strong>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="result-h">
        <FitCheckClose
          tone="purple"
          cta={C.cta}
          headingId="result-h"
          body={C.result.body}
          heading={
            <>
              <span className="block text-purple">{C.result.kicker}</span>
              {C.result.statement}
            </>
          }
        />
      </Section>
    </>
  );
}
