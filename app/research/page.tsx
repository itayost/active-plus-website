import type { Metadata } from "next";
import InnerPage from "@/components/layout/InnerPage";
import { RESEARCH as C } from "@/content/pages";

export const metadata: Metadata = {
  title: C.title,
  description: C.sections[0].paragraphs[0],
};

export default function ResearchPage() {
  return (
    <InnerPage title={C.title}>
      {C.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
      <p className="font-extrabold">{C.closer}</p>
    </InnerPage>
  );
}
