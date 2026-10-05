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
  nameTitle: "מה שמך המלא?",
  namePlaceholder: "שם פרטי ושם משפחה",
  nameError: "צריך שם פרטי ושם משפחה, באותיות בלבד",
  emailTitle: "לאן לשלוח את החשבונית?",
  emailPlaceholder: "האימייל שלך",
  emailError: "כתובת האימייל לא נראית תקינה",
  phoneLocked: "מספר הטלפון הוא החשבון שאיתו נכנסים לאפליקציה, ולכן הוא לא נערך כאן.",
  edit: "עריכה",
  save: "שמירה",
  summaryTitle: "סיכום הזמנה",
  rows: { plan: "מסלול", price: "מחיר", total: "סה״כ לתשלום", name: "שם", email: "אימייל", phone: "טלפון", installments: "מספר תשלומים" },
  installmentOption: "{n} תשלומים",
  singlePayment: "תשלום אחד",
  perInstallment: "כל תשלום: {amount}",
  monthlyTerms: "חיוב חודשי של {amount} בהוראת קבע. אפשר לבטל בכל עת באתר.",
  consentLabel: "שמירת פרטי הכרטיס לחידוש עתידי",
  consentHelp: {
    fem: "אני מסכימה ש־Grow תשמור אסימון מוצפן של הכרטיס, לא את מספר הכרטיס, כדי שנוכל להציע חידוש בעוד שנה. בלי הסכמה לא נשמר דבר.",
    masc: "אני מסכים ש־Grow תשמור אסימון מוצפן של הכרטיס, לא את מספר הכרטיס, כדי שנוכל להציע חידוש בעוד שנה. בלי הסכמה לא נשמר דבר.",
  },
  pay: "לתשלום מאובטח",
  paying: "מעבירים לעמוד התשלום המאובטח של Grow",
  secureNote: "התשלום מתבצע בעמוד המאובטח של Grow (משולם). פרטי הכרטיס לא עוברים דרך האתר ולא נשמרים בו.",
  cancelled: "התשלום לא הושלם ולא חויב דבר. אפשר לנסות שוב.",
  errors: {
    already_subscribed: "כבר יש לך מנוי פעיל. אפשר להמשיך להתאמן באפליקציה.",
    not_configured: "התשלום באתר עדיין לא פתוח. בינתיים אפשר לרכוש מנוי באפליקציה.",
    invalid_input: "חלק מהפרטים לא תקינים. כדאי לבדוק את השם והאימייל.",
    rate_limited: { fem: "היו הרבה ניסיונות ברצף. נסי שוב בעוד כמה דקות.", masc: "היו הרבה ניסיונות ברצף. נסה שוב בעוד כמה דקות." },
    signed_out: "צריך לאמת שוב את מספר הטלפון.",
    processor_error: "לא הצלחנו לפתוח את עמוד התשלום. אפשר לנסות שוב.",
    network: "אין חיבור כרגע. אפשר לנסות שוב.",
  },
  success: {
    title: { fem: "ברוכה הבאה לפעילים+", masc: "ברוך הבא לפעילים+" },
    titleNeutral: "ברוכים הבאים לפעילים+",
    checking: "בודקים את המנוי",
    // The invoice is issued by the webhook, which may still be running when this page shows.
    received: "התשלום התקבל, והחשבונית תישלח ל־{email}.",
    receivedNoEmail: "התשלום התקבל, והחשבונית תישלח לכתובת האימייל שמסרת.",
    pending: "התשלום התקבל ואנחנו מסיימים להפעיל את המנוי. זה יכול לקחת כמה דקות.",
    steps: [
      { title: "מורידים את האפליקציה", body: "פעילים+ זמינה לאייפון ולאנדרואיד." },
      { title: "נכנסים עם אותו מספר טלפון", body: "מתחברים עם המספר שאימתת כאן, וקוד חד־פעמי יישלח ב־SMS." },
      { title: "התוכנית האישית כבר מחכה", body: "התשובות מהשאלון נשמרו בפרופיל, כך שאפשר להתחיל להתאמן מיד." },
    ],
    manage: "ניהול המנוי",
  },
} as const;

/** The subscription page (/account/subscription). Gender-neutral: every verb here is spelled the same for both. */
export const ACCOUNT_COPY = {
  title: "ניהול מנוי",
  loading: "טוענים את המנוי",
  signedOut: "כדי לנהל את המנוי צריך לאמת את מספר הטלפון שאיתו נרשמת.",
  noAccount: `לא מצאנו חשבון עם המספר הזה. כדאי לבדוק את המספר, או להתקשר אלינו ל־${CONTACT_PHONE}.`,
  codeLabel: "הקוד שקיבלת ב־SMS",
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
