import { CANONICAL_HOST } from "./domains";

export const SITE_NAME = "פעילים+";
export const SITE_NAME_FULL = "פעילים פלוס";
export const SITE_URL = `https://${CANONICAL_HOST}`;

export const CONTACT_EMAIL = "office@improve-movement.co.il";
export const CONTACT_PHONE = "073-729-66-99";
export const CONTACT_PHONE_TEL = "+972737296699";
export const CONTACT_HOURS = "ימים א׳–ה׳, 10:00–17:00";
export const CONTACT_ADDRESS = "יצחק שמיר 2, קרית ביאליק";
export const CONTACT_WHATSAPP = "050-631-60-60";
export const CONTACT_WHATSAPP_URL = "https://wa.me/972506316060";
export const COMPANY_LINE = "מבית המרכז לשיפור התנועה בע״מ";

export const STORE_IOS = "https://apps.apple.com/il/app/id6757860198";
export const STORE_ANDROID =
  "https://play.google.com/store/apps/details?id=com.activeplus.app";

/**
 * The menu items of the handoff prototype, in the order it shows them, minus
 * "מסלולים ומחירים": the client asked (2026-10-16) to hide the pricing page.
 * /payment is still served, because the questionnaire hands off to it, but it
 * is unlisted (no menu, no footer, no sitemap) and noindex. Home leads the
 * list: the client asked (2026-10-17) for a way back to the home page from
 * the menu, the wordmark alone was not read as one. The questionnaire is the
 * primary action (FIT_CHECK), so it is not a menu link.
 */
export const NAV = [
  { href: "/", label: "עמוד בית" },
  { href: "/about", label: "הכירו את פעילים+" },
  { href: "/research", label: "המחקר והגישה המקצועית" },
  { href: "/team", label: "הצוות המקצועי" },
  { href: "/#faq", label: "שאלות נפוצות" },
  { href: "/contact", label: "צור קשר" },
] as const;

/** The site's primary action: every "בדיקת התאמה" leads here. */
export const FIT_CHECK = { href: "/questionnaire", label: "בדיקת התאמה" } as const;

/**
 * Two plans: the annual is one charge the buyer may split into installments,
 * shown spread over its 12 months; the monthly recurs with no commitment.
 * Their copy lives here, their prices do not: the total and the installment
 * ceiling come from Supabase's web_plans (lib/plan-prices.ts), the same rows
 * createGrowPayment charges, and every figure shown (per month, total,
 * installments, the saving) is derived from them in lib/pricing.ts.
 */
export const PLANS = [
  {
    id: "annual",
    name: "שנתי",
    longName: "מנוי שנתי",
    months: 12,
    priceSuffix: "לחודש",
    /** After the installment count, which comes from web_plans (lib/pricing.ts annualCardCopy). */
    terms: "מנוי שנתי",
    badge: "מנוי שנתי – החיסכון הגדול",
    cta: "לבחירת המנוי השנתי",
    image: "/img/v2/plan-annual.webp",
    alt: "",
    featured: true,
  },
  {
    id: "monthly",
    name: "חודשי",
    longName: "מנוי חודשי",
    months: 1,
    priceSuffix: "לחודש",
    terms: "חיוב חודשי, ללא התחייבות",
    cta: "לבחירה",
    image: "/img/v2/plan-monthly.webp",
    alt: "",
    featured: false,
  },
] as const;

export type Plan = (typeof PLANS)[number];
export type PlanId = Plan["id"];

/** What both plans include, as the brief lists it on the payment page. */
export const PLAN_INCLUDES = [
  "תוכנית אימון מותאמת אישית",
  "זיהוי תנועה לדיוק מרבי",
  "אימון חדות המחשבה",
  "מעקב התקדמות",
] as const;

/**
 * "מעטפת מקצועית" cards on the home page: each opens its own explainer page and
 * carries its client photo. Copy is the handoff prototype's, verbatim.
 */
export const PROGRAM_CARDS = [
  {
    id: "personal-plan",
    title: "תוכנית אישית בהתאמה חכמה",
    body: "התוכנית מותאמת לרמה האישית שלכם גם באימון הגופני וגם באימון המוח. המערכת לומדת את הביצועים שלכם, מספקת משוב, ומדייקת את התוכנית מאימון לאימון.",
    href: "/personal-plan",
    image: "/img/v2/card-personal-plan.webp",
    // A tall portrait in a wide frame: aim high so his head stays in.
    focus: "50% 15%",
    alt: "מבוגר בתרגיל מכרע צידי בסלון, לצד רשימת התרגילים שלו",
    cta: "תראו לי עוד",
  },
  {
    id: "motion-detection",
    title: "טכנולוגיה שמחזקת את הביטחון",
    body: "המצלמה החכמה שלנו מזהה את התנועה בזמן אמת ומספקת משוב אישי במהלך האימון, כדי לעזור לכם לבצע כל תרגיל בצורה מדויקת יותר ולהפיק ממנו יותר.",
    href: "/motion-detection",
    image: "/img/v2/card-motion.webp",
    focus: "50% 50%",
    alt: "אישה מרימה ידיים בתנוחת Y מול הטלפון, עם נקודות זיהוי התנועה",
    cta: "תראו לי עוד",
  },
  {
    id: "progress",
    title: "מדידה והתקדמות לאורך זמן",
    body: "המערכת עוקבת אחר מדדים כמו קשב, זיכרון, מהירות תגובה, איכות התנועה והשליטה בגוף כדי להראות לכם מה משתפר ואיפה כדאי להתמקד יותר.",
    href: "/progress",
    image: "/img/v2/card-progress.webp",
    focus: "50% 50%",
    alt: "מבוגר מחייך מול טאבלט עם מסך ההתקדמות שלו",
    cta: "תראו לי עוד",
  },
] as const;

