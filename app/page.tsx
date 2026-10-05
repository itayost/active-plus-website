import Hero from "@/components/home/Hero";
import ChoosingDaily from "@/components/home/ChoosingDaily";
import Intro from "@/components/home/Intro";
import WhatMatters from "@/components/home/WhatMatters";
import FeatureCards from "@/components/home/FeatureCards";
import Testimonials from "@/components/home/Testimonials";
import PartnersBand from "@/components/home/PartnersBand";
import LeadSection from "@/components/sections/LeadSection";
import FaqSection from "@/components/sections/FaqSection";
import PlansTeaser from "@/components/sections/PlansTeaser";

/** Section order is the client's v2 brief ("עמוד הבית פעילים פלוס"), top to bottom. */
export default function Home() {
  return (
    <>
      <Hero />
      <ChoosingDaily />
      <Intro />
      <WhatMatters />
      <FeatureCards />
      <Testimonials />
      <PartnersBand />
      <LeadSection source="home" withEmail={false} />
      <FaqSection />
      <PlansTeaser />
    </>
  );
}
