import Image from "next/image";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { Shell } from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/icons";
import { FIT_CHECK } from "@/lib/constants";

/**
 * Phone and tablet artwork beside the platform's one-paragraph introduction,
 * with the fit check as the single action.
 */
export default function Intro() {
  return (
    <section id="intro" className="bg-surface py-[var(--section-y)]">
      <Shell>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <Image
              src="/img/v2/devices.webp"
              width={1536}
              height={864}
              alt="טלפון וטאבלט עם מסכי האימון וההתקדמות של פעילים+"
              sizes="(max-width: 1024px) 92vw, 46vw"
              className="h-auto w-full"
            />
          </Reveal>

          <Reveal className="order-1 lg:order-2" delayIndex={1}>
            <p className="max-w-measure text-[clamp(1.375rem,1.15rem+1vw,1.875rem)] leading-[1.45] text-ink">
              פעילים+ היא פלטפורמה אישית לאימון הגוף וחדות המחשבה, שנבנתה על ידי
              אנשי מקצוע מתחום הפיזיותרפיה, המוח והבריאות, במטרה לעזור לבני{" "}
              <span dir="ltr">55+</span> לחזק את הגוף, לשמור על חדות המחשבה
              ולהמשיך לתפקד בביטחון לאורך זמן.
            </p>
            <Button href={FIT_CHECK.href} size="lg" className="mt-9">
              {FIT_CHECK.label}
              <ArrowIcon className="h-5 w-5" />
            </Button>
          </Reveal>
        </div>
      </Shell>
    </section>
  );
}
