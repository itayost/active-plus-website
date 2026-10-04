import Image from "next/image";
import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="פעילים פלוס — לעמוד הבית"
    >
      {/*
        The declared pair only has to carry the file's real proportions —
        512x883, a tall walking figure — because CSS sets the rendered height.
        It previously claimed 40x44, a ratio the file does not have, so Next
        reserved a box half again as wide as the mark that arrived in it and
        warned about it on every page. 51x88 is that true ratio at the 2x of the
        44px the header actually draws.
      */}
      <Image
        src="/img/logo.webp"
        alt=""
        width={51}
        height={88}
        priority
        className="h-11 w-auto transition-transform duration-[var(--dur)] ease-out-expo group-hover:-translate-y-0.5"
      />
      <span className="font-display text-h3 font-black leading-none tracking-tight">
        <span className="text-blue-deep">פעילים</span>
        <span className="text-green-deep">+</span>
      </span>
    </Link>
  );
}
