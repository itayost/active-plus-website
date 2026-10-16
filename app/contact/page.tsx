import type { Metadata } from "next";
import InnerPage from "@/components/layout/InnerPage";
import LeadForm from "@/components/forms/LeadForm";
import { CONTACT as C } from "@/content/pages";
import {
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP,
  CONTACT_WHATSAPP_URL,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "צור קשר",
  description: C.lede,
};

const LINK = "inline-flex min-h-[48px] items-center";

export default function ContactPage() {
  return (
    <InnerPage title={C.title}>
      <p className="font-extrabold">{C.lede}</p>
      <address className="mb-6 not-italic leading-[1.9]">
        <a href={`tel:${CONTACT_PHONE_TEL}`} className={LINK}>
          {CONTACT_PHONE}
        </a>
        <br />
        {CONTACT_HOURS}
        <br />
        <a href={CONTACT_WHATSAPP_URL} className={LINK}>
          {CONTACT_WHATSAPP} (וואטסאפ)
        </a>
        <br />
        <a href={`mailto:${CONTACT_EMAIL}`} className={`${LINK} text-blue-deep`}>
          {CONTACT_EMAIL}
        </a>
        <br />
        {CONTACT_ADDRESS}
      </address>
      <LeadForm source="contact" variant="contact" />
    </InnerPage>
  );
}
