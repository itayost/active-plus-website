import Button from "@/components/ui/Button";
import { FIT_CHECK } from "@/lib/constants";

type Props = { label: string; href?: string };

/**
 * A lone green action between sections: full width up to lg, as the hero's
 * action is, then a centred pill with more room above it, one breakpoint for
 * both.
 */
export default function CtaBar({ label, href = FIT_CHECK.href }: Props) {
  return (
    <div className="gutter-x pt-2 lg:flex lg:justify-center lg:pt-8">
      <Button href={href} variant="primary" size="lg" className="w-full lg:w-auto lg:min-w-[20rem]">
        {label}
      </Button>
    </div>
  );
}
