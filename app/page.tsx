import Hero from "@/components/home/Hero";
import WorldCards from "@/components/home/WorldCards";
import ProgramCards from "@/components/home/ProgramCards";
import CtaBar from "@/components/home/CtaBar";
import Testimonials from "@/components/home/Testimonials";
import TestimonialVideos from "@/components/home/TestimonialVideos";
import Partners from "@/components/home/Partners";
import Articles from "@/components/home/Articles";
import LeadSection from "@/components/sections/LeadSection";
import FaqSection from "@/components/sections/FaqSection";
import { CTAS } from "@/content/home";

/** Section order follows the handoff prototype, top to bottom. */
export default function Home() {
  return (
    <>
      <Hero />
      <WorldCards />
      <ProgramCards />
      <CtaBar label={CTAS.fit} />
      <Testimonials />
      <TestimonialVideos />
      <CtaBar label={CTAS.plan} />
      <Partners />
      <LeadSection source="home" withEmail={false} />
      <Articles />
      <FaqSection />
    </>
  );
}
