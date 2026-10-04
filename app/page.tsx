import Hero from "@/components/home/Hero";
import ChoosingDaily from "@/components/home/ChoosingDaily";
import Intro from "@/components/home/Intro";
import Abilities from "@/components/home/Abilities";
import FeatureCards from "@/components/home/FeatureCards";
import PartnersBand from "@/components/home/PartnersBand";
import DualTaskDemo from "@/components/home/DualTaskDemo";
import LeadSection from "@/components/sections/LeadSection";
import FaqSection from "@/components/sections/FaqSection";
import Pricing from "@/components/sections/Pricing";

/**
 * Section order follows the client's brief, not the reference site and not
 * this build's earlier guesses:
 *
 *   hero · the "אלפי לקוחות" line · device shot + intro · מה הייתם רוצים לחזק ·
 *   four cards · [חוות דעת] · שיתופי פעולה · תרגיל שלושת הפירות · טופס ·
 *   שאלות נפוצות · מה מתאים לי
 *
 * Two notes:
 * - The brief's "מה אומרים עלינו" slot is empty: no testimonials have been
 *   supplied, and inventing them is out. It belongs between the cards and the
 *   partners when the material arrives.
 * - The Lancet 42% strip used to sit here and was removed at the client's
 *   request. The finding still lives in full at /research, which is in the
 *   nav; re-adding <ResearchStrip /> before <PartnersBand /> restores it.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <ChoosingDaily />
      <Intro />
      <Abilities />
      <FeatureCards />
      <PartnersBand />
      <DualTaskDemo />
      <LeadSection source="home" />
      <FaqSection limit={6} showMore />
      <Pricing heading="מה מתאים לי?" />
    </>
  );
}
