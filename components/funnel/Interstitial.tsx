import Image from "next/image";
import type { ReactNode } from "react";
import { HeartIcon, MovementIcon, StrengthIcon } from "@/components/ui/icons";
import { ageBand } from "@/lib/funnel/age";
import { COPY, g } from "@/lib/funnel/copy";
import type { Answers } from "@/lib/funnel/types";
import { AccentTitle, ContinueButton, FootNote, StepTitle } from "./parts";

const IMG = "/img/funnel";
const CARD = "rounded-card bg-surface p-[clamp(1rem,3.5vw,2.5rem)] shadow-lift-2";

type Props = { gender: Answers["gender"]; onContinue: () => void };

/** Image beside the copy from md up, above it on phones. */
function SplitCard({ image, priority = false, children }: { image: string; priority?: boolean; children: ReactNode }) {
  return (
    <div className={`${CARD} grid gap-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-stretch md:gap-[clamp(1.5rem,3vw,2.5rem)]`}>
      <div>
        <Image
          src={image}
          alt=""
          width={788}
          height={1400}
          priority={priority}
          sizes="(min-width: 860px) 300px, (min-width: 768px) 34vw, calc(100vw - 4.5rem)"
          className="aspect-[4/3] h-full w-full rounded-tile object-cover object-[50%_30%] md:aspect-auto md:max-h-[560px] md:min-h-[420px]"
        />
      </div>
      <div className="flex flex-col justify-center">{children}</div>
    </div>
  );
}

export function Welcome2({ onContinue }: Pick<Props, "onContinue">) {
  return (
    <SplitCard image={`${IMG}/welcome2-hero.webp`} priority>
      <AccentTitle lead={COPY.welcome2.titleLead} accent={COPY.welcome2.titleAccent} />
      <p className="mt-4 max-w-measure text-lead text-ink-soft">{COPY.welcome2.body}</p>
      <ContinueButton label={COPY.welcome2.cta} onClick={onContinue} />
    </SplitCard>
  );
}

export function Reinforcement2({ gender, onContinue }: Props) {
  const image = gender === "female" ? "reinforcement2-female" : "reinforcement2-male";
  return (
    <SplitCard image={`${IMG}/${image}.webp`}>
      <AccentTitle lead={COPY.reinforcement2.titleLead} accent={COPY.reinforcement2.titleAccent} />
      <p className="mt-4 max-w-measure text-lead text-ink-soft">{COPY.reinforcement2.body}</p>
      <ContinueButton onClick={onContinue} />
    </SplitCard>
  );
}

const CALLOUT_ICONS = [
  { Icon: StrengthIcon, tone: "bg-blue-wash text-blue-deep" },
  { Icon: MovementIcon, tone: "bg-green-wash text-green-deep" },
  { Icon: HeartIcon, tone: "bg-purple-wash text-purple-deep" },
] as const;

/*
  Both group shots are cut-outs on transparency, set on the green wash and
  standing on the box's floor. The female file was cropped above the row of
  icons the source artwork had baked in under the group.
*/
const SOCIAL_IMAGES = {
  female: { src: `${IMG}/social-proof-female.webp`, width: 853, height: 792 },
  male: { src: `${IMG}/social-proof-male.webp`, width: 1400, height: 898 },
} as const;

export function SocialProof({ gender, dob, onContinue }: Props & { dob: string | undefined }) {
  const image = SOCIAL_IMAGES[gender === "female" ? "female" : "male"];
  const band = ageBand(dob, new Date().getFullYear());
  const title = g(gender, COPY.socialProof.title.fem, COPY.socialProof.title.masc).replace("{band}", String(band));
  return (
    <div className={CARD}>
      <div className="relative mb-7 h-[clamp(220px,30vw,320px)] overflow-hidden rounded-tile bg-green-wash">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(min-width: 860px) 780px, calc(100vw - 4.5rem)"
          className="object-contain object-bottom"
        />
      </div>
      <StepTitle size="interstitial">{title}</StepTitle>
      <p className="mt-4 max-w-measure text-lead text-ink-soft">
        {g(gender, COPY.socialProof.subtitle.fem, COPY.socialProof.subtitle.masc)}
      </p>
      <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1.5 font-display font-bold text-blue-deep">
        {COPY.socialProof.bullets.map((bullet) => (
          <li key={bullet} className="inline-flex items-center">
            <span aria-hidden="true" className="me-2 h-[7px] w-[7px] shrink-0 rounded-pill bg-green" />
            {bullet}
          </li>
        ))}
      </ul>
      <ul className="mt-7 grid gap-[1.1rem] border-t border-hairline pt-6">
        {COPY.socialProof.callouts.map((callout, i) => {
          const { Icon, tone } = CALLOUT_ICONS[i];
          return (
            <li key={callout.title} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-4">
              <span className={`inline-flex h-[52px] w-[52px] items-center justify-center rounded-field ${tone}`}>
                <Icon className="h-[26px] w-[26px]" />
              </span>
              <span>
                <span className="block font-display text-[1.25rem] font-bold leading-[1.3]">{callout.title}</span>
                <span className="block leading-[1.45] text-ink-soft">{callout.body}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <ContinueButton onClick={onContinue} />
      <FootNote text={COPY.common.trust} lock />
    </div>
  );
}
