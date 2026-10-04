import Image from "next/image";
import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex min-h-[48px] min-w-12 shrink-0 items-center gap-2.5 ${className}`}
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
        className="h-[38px] w-auto min-[421px]:h-11 transition-transform duration-[var(--dur)] ease-out-expo group-hover:-translate-y-0.5"
      />
      {/* logo-wordmark collapses inside the header at enlarged text; the
          link keeps its name through aria-label either way. */}
      <span className="logo-wordmark font-display text-[1.375rem] font-black min-[421px]:text-h3 leading-none tracking-tight">
        <span className="text-blue-deep">פעילים</span>
        <span className="text-green-deep">+</span>
      </span>
    </Link>
  );
}
