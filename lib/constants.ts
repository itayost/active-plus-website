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
 * The six menu items of the handoff prototype, in the order it shows them.
 * Home is the wordmark, so it is not listed. The questionnaire is the primary
 * action (FIT_CHECK), not a menu link.
 */
export const NAV = [
  { href: "/about", label: "הכירו את פעילים+" },
  { href: "/research", label: "המחקר והגישה המקצועית" },
  { href: "/team", label: "הצוות המקצועי" },
  { href: "/#faq", label: "שאלות נפוצות" },
  { href: "/payment", label: "מסלולים ומחירים" },
  { href: "/contact", label: "צור קשר" },
] as const;

/** The site's primary action: every "בדיקת התאמה" leads here. */
export const FIT_CHECK = { href: "/questionnaire", label: "בדיקת התאמה" } as const;

/**
 * Two plans. The annual is one charge of 828 ₪ (shown as 69 ₪ a month) that
 * the buyer may split into up to 12 installments; the monthly recurs at 99 ₪
 * with no commitment. The charge amount is always `total`, never `price`.
 *
 * The saving shown is computed from the prices by annualSavings() in
 * lib/pricing.ts (99 x 12 - 828 = 360), never typed by hand.
 */
export const PLANS = [
  {
    id: "annual",
    name: "שנתי",
    longName: "מנוי שנתי",
    price: 69,
    priceSuffix: "לחודש",
    terms: "ל-12 תשלומים · מנוי שנתי",
    total: 828,
    maxInstallments: 12,
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
    price: 99,
    priceSuffix: "לחודש",
    terms: "חיוב חודשי, ללא התחייבות",
    total: 99,
    maxInstallments: 1,
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
 * Three cards, each opening its own explainer page, each with its client photo.
 */
export const FEATURE_CARDS = [
  {
    id: "personal-plan",
    tone: "blue",
    title: "תוכנית אישית בהתאמה חכמה",
    body: [
      "התוכנית מותאמת לרמה האישית שלכם גם באימון הגופני וגם באימון המוח.",
      "המערכת לומדת את הביצועים שלכם, מספקת משוב, ומדייקת את התוכנית מאימון לאימון.",
    ],
    href: "/personal-plan",
    image: "/img/v2/card-personal-plan.webp",
    // A tall portrait in a wider frame: centred, the crop cut his head off.
    // Phones show about half the height, so aim high (head + exercise list);
    // the desktop frame shows about two thirds, enough for head to shoes.
    focus: { base: "50% 15%", lg: "50% 26%" },
    alt: "מבוגר בתרגיל מכרע צידי בסלון, לצד רשימת התרגילים שלו",
  },
  {
    id: "motion-detection",
    tone: "blue",
    title: "טכנולוגיה שמחזקת את הביטחון",
    body: [
      "המצלמה החכמה שלנו מזהה את התנועה בזמן אמת ומספקת משוב אישי במהלך האימון,",
      "כדי לעזור לכם לבצע כל תרגיל בצורה מדויקת יותר ולהפיק ממנו יותר.",
    ],
    href: "/motion-detection",
    image: "/img/v2/card-motion.webp",
    alt: "אישה מרימה ידיים בתנוחת Y מול הטלפון, עם נקודות זיהוי התנועה",
  },
  {
    id: "progress",
    tone: "green",
    title: "מדידה והתקדמות לאורך זמן",
    body: [
      "המערכת עוקבת אחר מדדים כמו קשב, זיכרון, מהירות תגובה, איכות התנועה והשליטה בגוף כדי להראות לכם מה משתפר ואיפה כדאי להתמקד יותר.",
    ],
    href: "/progress",
    image: "/img/v2/card-progress.webp",
    alt: "מבוגר מחייך מול טאבלט עם מסך ההתקדמות שלו",
  },
] as const;

export type FeatureCard = (typeof FEATURE_CARDS)[number];
export type Tone = "blue" | "green";
