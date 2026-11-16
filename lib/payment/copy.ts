import { CONTACT_PHONE } from "@/lib/constants";
import { g } from "@/lib/funnel/copy";
import type { Answers } from "@/lib/funnel/types";

type Gendered = { readonly fem: string; readonly masc: string };

export const gendered = (gender: Answers["gender"], text: Gendered): string => g(gender, text.fem, text.masc);

export const CHECKOUT_COPY = {
  heading: "רכישת מנוי",
  loading: "רגע, מכינים את הרכישה",
  chosenPlan: "המסלול שבחרת:",
  changePlan: "שינוי",
  stepOf: "שלב {x} מתוך {n}",
  back: "לשלב הקודם",
  next: "לשלב הבא",
  nameTitle: "הפרטים שלך",
  firstName: "שם פרטי",
  lastName: "שם משפחה",
  nameError: "צריך שם פרטי ושם משפחה, באותיות בלבד",
  /** The service is sold in Israel only (the phone must be Israeli): shown because Grow's review requires the field. */
  country: "ישראל",
  phoneLocked: "מספר הטלפון הוא החשבון שאיתו נכנסים לאפליקציה, ולכן הוא לא נערך כאן.",
  edit: "עריכה",
  save: "שמירה",
  summaryTitle: "סיכום הזמנה",
  rows: { plan: "מסלול", price: "מחיר", total: "סה״כ לתשלום", name: "שם", phone: "טלפון", country: "מדינה", installments: "מספר תשלומים" },
  installmentOption: "{n} תשלומים",
  singlePayment: "תשלום אחד",
  perInstallment: "כל תשלום: {amount}",
  monthlyTerms: "חיוב חודשי של {amount} בהוראת קבע. אפשר לבטל בכל עת באתר.",
  termsBefore: "קראתי ואישרתי את ",
  termsLink: "התקנון ותנאי השימוש",
  termsNewTab: "(נפתח בחלון חדש)",
  termsRequired: "כדי להמשיך לתשלום צריך לאשר את התקנון ותנאי השימוש",
  pay: "לתשלום מאובטח",
  paying: "מעבירים לעמוד התשלום המאובטח של Grow",
  openingWallet: "פותחים את חלון התשלום המאובטח של Grow",
  secureTitle: "תשלום מאובטח",
  /** Under the monthly plan's price (owner, 2026-11-14). */
  cancelAnytime: "אפשר לבטל בכל עת",
  methodsLabel: "אמצעי תשלום",
  secureNote: "התשלום מתבצע במערכת המאובטחת של Grow (משולם). פרטי הכרטיס לא עוברים דרך האתר ולא נשמרים בו.",
  cancelled: "התשלום לא הושלם ולא חויב דבר. אפשר לנסות שוב.",
  pricesUnavailable: "המחירים לא זמינים כרגע. אפשר לנסות שוב בעוד כמה דקות, או לרכוש מנוי באפליקציה.",
  /** A visitor who already has an active subscription (owner, 2026-11-16): no plans, no prices, the app. */
  subscribed: {
    chip: "המנוי שלך פעיל",
    title: "כבר יש לך מנוי פעיל",
    tagline: "התוכנית האישית שלך מחכה באפליקציה",
  },
  errors: {
    already_subscribed: "כבר יש לך מנוי פעיל. אפשר להמשיך להתאמן באפליקציה.",
    price_changed: "המחיר או מספר התשלומים עודכנו. בדקו את הפרטים ונסו שוב.",
    not_configured: "התשלום באתר עדיין לא פתוח. בינתיים אפשר לרכוש מנוי באפליקציה.",
    invalid_input: "חלק מהפרטים לא תקינים. כדאי לבדוק את השם והאימייל.",
    rate_limited: { fem: "היו הרבה ניסיונות ברצף. נסי שוב בעוד כמה דקות.", masc: "היו הרבה ניסיונות ברצף. נסה שוב בעוד כמה דקות." },
    signed_out: "צריך לאמת שוב את מספר הטלפון.",
    processor_error: "לא הצלחנו לפתוח את עמוד התשלום. אפשר לנסות שוב.",
    network: "אין חיבור כרגע. אפשר לנסות שוב.",
    payment_failed: "התשלום לא הושלם. אפשר לנסות שוב, גם באמצעי תשלום אחר.",
    expired: "עבר הזמן לתשלום והחלון נסגר. אפשר לנסות שוב.",
  },
  success: {
    title: { fem: "ברוכה הבאה לפעילים+", masc: "ברוך הבא לפעילים+" },
    titleNeutral: "ברוכים הבאים לפעילים+",
    paidChip: "נרשמת בהצלחה",
    tagline: "התוכנית האישית שלך מוכנה, ואפשר להתחיל כבר היום",
    /** The way from payment to the first workout in the app (owner, 2026-11-16), FirstWorkoutSteps. */
    stepsTitle: "3 צעדים לאימון הראשון שלך",
    insideTitle: "מה מחכה לך באפליקציה",
    closing: "האימון הראשון מחכה. מתחילים עוד היום?",
    checking: "בודקים את המנוי",
    // The invoice is issued by the webhook, which may still be running when this page shows.
    received: "התשלום התקבל, והחשבונית תישלח אליך בוואטסאפ לנייד שאיתו נכנסת.",
    pending: "התשלום התקבל ואנחנו מסיימים להפעיל את המנוי. זה יכול לקחת כמה דקות.",
    steps: [
      { title: "מורידים את האפליקציה", body: "" },
      { title: "נכנסים עם אותו מספר טלפון", body: "קוד חד־פעמי יגיע ב־SMS, בלי סיסמה." },
      { title: "לוחצים על \"התחל תרגול עכשיו\"", body: "התוכנית שלך כבר באפליקציה, והאימון הראשון מחכה במסך הבית. 10 דקות, מהבית." },
    ],
    storeButton: "להורדה מ-{store}",
    yourPhone: "המספר שלך:",
    help: "צריכים עזרה בהתקנה?",
    manage: "ניהול המנוי",
  },
} as const;

/** The subscription page (/account/subscription). Gender-neutral: every verb here is spelled the same for both. */
export const ACCOUNT_COPY = {
  title: "ניהול מנוי",
  loading: "טוענים את המנוי",
  signedOut: "כדי לנהל את המנוי צריך לאמת את מספר הטלפון שאיתו נרשמת.",
  codeLabel: "הקוד שקיבלת ב־SMS",
  /** The same words whether or not the number has an account: the page never says which. */
  codeHint: `אם המספר רשום אצלנו, שלחנו אליו קוד ב־SMS. אם הקוד לא מגיע תוך כמה דקות, כדאי לבדוק את המספר או להתקשר אלינו ל־${CONTACT_PHONE}.`,
  verify: "אימות",
  none: "לא מצאנו מנוי פעיל למספר הזה.",
  error: "לא הצלחנו לטעון את המנוי. אפשר לנסות שוב.",
  retry: "לנסות שוב",
  plans: { ANNUAL: "מנוי שנתי", MONTHLY: "מנוי חודשי" } as Record<string, string>,
  nextCharge: "החיוב הבא: {date}",
  activeUntil: "המנוי פעיל עד {date}",
  annualNote: "המנוי השנתי לא מתחדש אוטומטית. אם בחרת לשלם בתשלומים, הכרטיס יחויב פעם בחודש עד התשלום האחרון, ואחרי זה לא יהיה חיוב נוסף.",
  cancel: "ביטול המנוי",
  confirmTitle: "לבטל את המנוי החודשי?",
  confirmBody: "לא יהיו חיובים נוספים. אפשר להמשיך להתאמן עד {date}.",
  confirmYes: "כן, לבטל",
  confirmNo: "לא, להשאיר",
  cancelled: "המנוי בוטל. לא יהיו חיובים נוספים, והגישה נשארת עד {date}.",
  cancelFailed: "הביטול לא הושלם. אפשר לנסות שוב, או להתקשר אלינו.",
  apple: "המנוי נרכש ב־App Store, ולכן מבטלים אותו שם.",
  appleLink: "לניהול מנויים ב־App Store",
  google: "המנוי נרכש ב־Google Play, ולכן מבטלים אותו שם.",
  googleLink: "לניהול מנויים ב־Google Play",
  manual: "את המנוי הזה מנהל המשרד. לביטול אפשר להתקשר אלינו:",
} as const;
