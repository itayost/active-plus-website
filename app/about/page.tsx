import type { Metadata } from "next";
import Image from "next/image";
import InnerPage from "@/components/layout/InnerPage";
import { ABOUT as C } from "@/content/pages";

export const metadata: Metadata = {
  title: "אודות",
  description: C.paragraphs[0],
};

export default function AboutPage() {
  return (
    <InnerPage
      title={C.title}
      intro={
        <Image
          src={C.photo}
          width={1200}
          height={798}
          alt="מידד גולן, מייסד ומנכ״ל המרכז לשיפור התנועה"
          // In the first viewport and the page's LCP element.
          priority
          fetchPriority="high"
          sizes="(min-width: 1024px) 560px, 92vw"
          className="aspect-[3/2] h-auto w-full rounded-card object-cover"
        />
      }
    >
      <h2>{C.heading}</h2>
      {C.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p className="font-extrabold">{C.closer}</p>
    </InnerPage>
  );
}
