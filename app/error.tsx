"use client";

import Button from "@/components/ui/Button";
import { Shell } from "@/components/ui/Section";
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/constants";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="bg-surface py-[var(--section-y)]">
      <Shell width="narrow">
        <h1 className="text-h2 font-display font-black">משהו השתבש בטעינת הדף</h1>
        <p className="mt-5 max-w-measure text-lead text-ink-soft">
          זו תקלה אצלנו, לא אצלכם. אפשר לנסות לטעון שוב — ואם זה חוזר, נשמח
          שתתקשרו.
        </p>

        <div className="mt-9 flex flex-wrap gap-4">
          <Button size="lg" onClick={() => reset()}>
            לטעון שוב
          </Button>
          <Button href={`tel:${CONTACT_PHONE_TEL}`} variant="outline" size="lg">
            {CONTACT_PHONE}
          </Button>
        </div>
      </Shell>
    </section>
  );
}
