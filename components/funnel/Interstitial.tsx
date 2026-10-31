import Image from "next/image";
import type { ReactNode } from "react";
import { COPY, g } from "@/lib/funnel/copy";
import { goalImage, HERO, isGoal, reinforcement2Image, SIZES } from "@/lib/funnel/images";
import type { Answers } from "@/lib/funnel/types";
import { ContinueButton, STEP_TITLE_ID } from "./parts";

type Gender = Answers["gender"];

/*
  The apps' photo screens: the photo fills the whole screen and a navy scrim
  deepens behind the white copy at the bottom, so it keeps its contrast on any
  photo. The funnel draws its top bar over the photo (FunnelChrome overPhoto).
*/
function PhotoScreen({
  image,
  focusX = 50,
  priority = false,
  children,
}: {
  image: string;
  /** Horizontal crop centre in percent; the women's stretching photo sits right of centre. */
  focusX?: number;
  priority?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate flex flex-1 flex-col justify-end overflow-hidden bg-[#0e1e3c] text-center text-white">
      <Image
        src={image}
        alt=""
        fill
        priority={priority}
        sizes={SIZES.screen}
        className="-z-10 object-cover"
        style={{ objectPosition: `${focusX}% 30%` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(14_30_60/0)_0%,rgb(14_30_60/0)_40%,rgb(14_30_60/0.6)_58%,rgb(14_30_60/0.85)_75%,rgb(14_30_60/0.92)_100%)]"
      />
      <div className="gutter-x pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
    </div>
  );
}

function PhotoTitle({ lead, accent }: { lead: string; accent: string }) {
  return (
    <h1
      id={STEP_TITLE_ID}
      tabIndex={-1}
      className="font-display text-[clamp(2rem,1.6rem+1.6vw,2.5rem)] font-extrabold leading-[1.12] tracking-[-0.02em] outline-none"
    >
      {lead}
      <em className="not-italic text-[#8be0a4]">{accent}</em>
    </h1>
  );
}

const PHOTO_BODY = "mx-auto mt-4 max-w-[30rem] text-[1.25rem] font-bold leading-[1.45]";

/** The website's entry screen, as the apps open: wordmark, promise, one button. */
export function Welcome2({ onContinue }: { onContinue: () => void }) {
  return (
    <PhotoScreen image={HERO} priority>
      <p aria-label="פעילים פלוס" className="font-display text-[2.75rem] font-extrabold leading-none">
        פעילים<span className="text-[#8be0a4]">+</span>
      </p>
      <h1
        id={STEP_TITLE_ID}
        tabIndex={-1}
        className="mx-auto mt-5 max-w-[26rem] font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.25rem)] font-extrabold leading-[1.15] outline-none"
      >
        {COPY.welcome2.title}
      </h1>
      <p className={PHOTO_BODY}>{COPY.welcome2.body}</p>
      <ContinueButton label={COPY.welcome2.cta} onClick={onContinue} />
    </PhotoScreen>
  );
}

const STRETCH = goalImage("female", "flexibility_balance");

/** Right after the age question: echoes the goal picked first (strength when none was saved). */
export function GoalReinforcement({ gender, goal, onContinue }: { gender: Gender; goal: string | undefined; onContinue: () => void }) {
  const copy = COPY.goalReinforcement[isGoal(goal) ? goal : "strength"];
  const image = goalImage(gender, goal);
  return (
    <PhotoScreen image={image} focusX={image === STRETCH ? 60 : 50}>
      <PhotoTitle lead={copy.lead} accent={copy.accent} />
      <p className={PHOTO_BODY}>{copy.body}</p>
      <ContinueButton label={g(gender, COPY.common.continue.fem, COPY.common.continue.masc)} onClick={onContinue} />
    </PhotoScreen>
  );
}

/** "התאמה אישית", between the second and third parts of the questionnaire. */
export function Reinforcement2({ gender, onContinue }: { gender: Gender; onContinue: () => void }) {
  return (
    <PhotoScreen image={reinforcement2Image(gender)}>
      <PhotoTitle lead={COPY.reinforcement2.titleLead} accent={COPY.reinforcement2.titleAccent} />
      <p className={PHOTO_BODY}>{COPY.reinforcement2.body}</p>
      <ContinueButton label={g(gender, COPY.common.continue.fem, COPY.common.continue.masc)} onClick={onContinue} />
    </PhotoScreen>
  );
}
