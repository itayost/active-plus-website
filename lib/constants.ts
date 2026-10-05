export const SITE_NAME = "פעילים+";
export const SITE_NAME_FULL = "פעילים פלוס";
export const SITE_URL = "https://activeplus.co.il";

export const CONTACT_EMAIL = "office@improve-movement.co.il";
export const CONTACT_PHONE = "073-729-66-99";
export const CONTACT_PHONE_TEL = "+972737296699";
export const CONTACT_HOURS = "ימים א׳–ה׳, 10:00–17:00";
export const CONTACT_ADDRESS = "יצחק שמיר 2, קרית ביאליק";

export const STORE_IOS = "https://apps.apple.com/il/app/id6757860198";
export const STORE_ANDROID =
  "https://play.google.com/store/apps/details?id=com.activeplus.app";

/**
 * The client's v2 brief names six pages. Home is the logo, the questionnaire is
 * the green action that closes the bar, and the other four are the links. Four
 * fit at full size in one row, so every item now carries the same weight in the
 * bar, the drawer and the footer.
 */
export const NAV = [
  { href: "/about", label: "אודות" },
  { href: "/how-it-works", label: "איך זה עובד" },
  { href: "/payment", label: "מסלולים ומחירים" },
  { href: "/articles", label: "מאמרים" },
] as const;

/** The site's primary action: every "בדיקת התאמה" leads here. */
export const FIT_CHECK = { href: "/questionnaire", label: "בדיקת התאמה" } as const;

/**
 * Two plans. The annual is one charge of 708 ₪ that the buyer may split into
 * up to 12 installments; the monthly recurs at 99 ₪ with no commitment.
 *
 * The brief prints a saving of 600, but the prices produce a different figure,
 * so the saving shown is computed from the prices by annualSavings() in lib/pricing.ts.
 */
export const PLANS = [
  {
    id: "annual",
    name: "שנתי",
    longName: "מנוי שנתי",
    price: 59,
    priceSuffix: "לחודש",
    terms: "708 ₪ לשנה, בהתחייבות ל־12 חודשים",
    total: 708,
    maxInstallments: 12,
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
    tone: "purple",
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
export type Tone = "blue" | "green" | "purple" | "burgundy";
