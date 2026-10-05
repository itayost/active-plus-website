import type { ComponentProps } from "react";
import Button from "@/components/ui/Button";
import { STORE_ANDROID, STORE_IOS } from "@/lib/constants";

type ButtonProps = ComponentProps<typeof Button>;

type Props = {
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
};

/** The App Store and Google Play buttons, side by side (wrapping on a narrow screen). */
export default function StoreButtons({ className = "mt-4 flex flex-wrap gap-3", variant = "outline", size }: Props) {
  return (
    <div className={className}>
      <Button href={STORE_IOS} variant={variant} size={size}>
        App Store
      </Button>
      <Button href={STORE_ANDROID} variant={variant} size={size}>
        Google Play
      </Button>
    </div>
  );
}
