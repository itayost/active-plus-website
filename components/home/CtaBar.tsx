import Button from "@/components/ui/Button";
import { FIT_CHECK } from "@/lib/constants";

type Props = { label: string; href?: string };

/** A lone green action between sections: full width on a phone, centred pill from sm. */
export default function CtaBar({ label, href = FIT_CHECK.href }: Props) {
  return (
    <div className="gutter-x pt-2 lg:pt-8 sm:flex sm:justify-center">
      <Button href={href} variant="primary" size="lg" className="w-full sm:w-auto sm:min-w-[20rem]">
        {label}
      </Button>
    </div>
  );
}
