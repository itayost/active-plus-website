import Image from "next/image";

/**
 * What the plan holds, in one picture under the plans' heading (owner, 2026-11-21): the daily
 * workout as the questionnaire matched it, and one memory game beside it. A visitor from a link
 * (no answers in this tab) sees the independent workout with the trainer woman.
 */
const PICTURES = {
  chair: {
    image: "/img/v2/pay-chair.webp",
    alt: "אימון יומי בישיבה על כיסא, ולצדו המשחק הגולה המהירה",
  },
  chairSupport: {
    image: "/img/v2/pay-chair-support.webp",
    alt: "אימון יומי בעמידה עם כיסא לתמיכה, ולצדו המשחק זכירת פרצופים",
  },
  woman: {
    image: "/img/v2/pay-independent-woman.webp",
    alt: "אימון יומי עצמאי עם המאמנת, ולצדו המשחק זיכרון פורח",
  },
  man: {
    image: "/img/v2/pay-independent-man.webp",
    alt: "אימון יומי עצמאי עם המאמן, ולצדו המשחק נגד הזרם",
  },
} as const;

export function paymentPicture(level: string | undefined, gender: string | undefined) {
  if (level === "chair_only") return PICTURES.chair;
  if (level === "balance_issues") return PICTURES.chairSupport;
  return gender === "male" ? PICTURES.man : PICTURES.woman;
}

export default function PaymentIncludes({ level, gender }: { level?: string; gender?: string }) {
  const picture = paymentPicture(level, gender);
  return (
    <div className="mt-5 overflow-hidden rounded-[20px] shadow-[0_6px_18px_rgb(0_0_0/0.08)]">
      <div className="relative aspect-[27/22] w-full">
        <Image src={picture.image} alt={picture.alt} fill sizes="(max-width: 560px) 100vw, 560px" className="object-cover" />
      </div>
    </div>
  );
}
