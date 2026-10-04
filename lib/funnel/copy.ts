import type { Answers } from "./types";

/** Feminine only when gender is "female"; male and unknown get masculine. */
export const g = (gender: Answers["gender"], fem: string, masc: string): string =>
  gender === "female" ? fem : masc;

export type Gendered = { readonly fem: string; readonly masc: string };
export type Plain = { readonly value: string; readonly label: string };
export type GenderedOption = { readonly value: string; readonly fem: string; readonly masc: string };

const both = (s: string): Gendered => ({ fem: s, masc: s });

/** The answer key each question step writes; checked against the contract. */
export const COPY_KEYS = [
  "gender",
  "date_of_birth",
  "aspiration_goal",
  "daily_activity_level",
  "chair_rise_capability",
  "mobility_challenge",
  "standing_stability",
  "training_frequency_choice",
  "pain_areas",
  "training_time_of_day",
  "full_name",
] as const satisfies readonly (keyof Answers)[];

export const COPY = {
  welcome2: {
    titleLead: "שומרים על ",
    titleAccent: "איכות החיים",
    body: "מחקרים מראים שתרגול יומי קצר מסייע לשמור על אנרגיה, משקל תקין וכוח בכל גיל",
    cta: "בואו נתחיל",
  },
  common: {
    next: "המשך",
    trust: "המידע שלך בטוח ומאובטח",
  },
  /** Web-only chrome around every step (the app draws its own). */
  chrome: {
    back: "חזרה",
    cancel: "ביטול",
    dots: "שלב {i} מתוך {n}",
  },
  gender: {
    title: "מהו המגדר שלך?",
    subtitle: "המגדר שלך משפיע על מדדים גופניים חשובים.\nאנחנו משתמשים במידע הזה כדי לספק לך תוכן מותאם אישית.",
    options: [
      { value: "male", label: "זכר" },
      { value: "female", label: "נקבה" },
    ] as readonly Plain[],
  },
  dob: {
    title: "מה שנת הלידה שלך?",
    subtitle: "כדי להתאים לך תרגול מדויק ובטוח לגיל שלך",
    privacy: "המידע שלך נשמר בצורה מאובטחת ולא משותף עם אף אחד",
    footer: "לוקח כמה שניות בלבד",
  },
  socialProof: {
    title: { fem: "אלפי נשים בגילאי +{band}", masc: "אלפי גברים בגילאי +{band}" } as Gendered,
    subtitle: { fem: "כבר מרגישות את השינוי עם פעילים פלוס", masc: "כבר מרגישים את השינוי עם פעילים פלוס" } as Gendered,
    bullets: ["תוכניות מותאמות אישית", "ליווי מקצועי", "תוצאות אמיתיות"],
    callouts: [
      { title: "חיזוק הגוף", body: "שיפור מסת השריר וכוח יומיומי" },
      { title: "ניידות ואנרגיה", body: "יותר קלות בתנועה ויותר אנרגיה ביום-יום" },
      { title: "בריאות כללית", body: "תוכניות מבוססות מדע לתוצאות לאורך זמן" },
    ],
  },
  aspiration: {
    title: "בעוד 10 שנים מהיום,\nמה חשוב לך להמשיך לעשות?",
    options: [
      { value: "fitness", label: "לשמור על כושר וחיוניות" },
      { value: "leisure", label: "לטייל וליהנות מהחיים" },
      { value: "family", label: "לשחק עם המשפחה והנכדים" },
      { value: "all", label: "כל התשובות נכונות" },
    ] as readonly Plain[],
  },
  activityLevel: {
    title: both("איך נראה רוב היום שלך?"),
    subtitle: both("רמת הפעילות שלך תעזור לנו לדייק עבורך את התוכנית האישית"),
    options: [
      { value: "very_active", fem: "אני פעילה במהלך היום", masc: "אני פעיל במהלך היום" },
      { value: "partially_active", fem: "אני פעילה בחלק מהיום", masc: "אני פעיל בחלק מהיום" },
      { value: "mostly_sitting", fem: "אני רוב היום בישיבה", masc: "אני רוב היום בישיבה" },
    ] as readonly GenderedOption[],
  },
  chairRise: {
    title: { fem: "כשאת קמה מכיסא בבית", masc: "כשאתה קם מכיסא בבית" } as Gendered,
    subtitle: both("כדי להתאים לך תוכנית אישית"),
    options: [
      { value: "alone", fem: "קמה בקלות", masc: "קם בקלות" },
      { value: "with_support", fem: "קמה עם מעט מאמץ", masc: "קם עם מעט מאמץ" },
      { value: "with_handles", fem: "נעזרת בידיות", masc: "נעזר בידיות" },
    ] as readonly GenderedOption[],
  },
  challengeArea: {
    title: both("מה כבר לא מרגיש קל כמו פעם?"),
    subtitle: { fem: "בחרי את מה שהכי נכון עבורך", masc: "בחר את מה שהכי נכון עבורך" } as Gendered,
    options: [
      { value: "stairs", label: "עלייה במדרגות" },
      { value: "walking", label: "הליכה למרחקים" },
      { value: "floor_rise", label: "קימה מהרצפה" },
      { value: "none", label: "אף אחד מאלה" },
    ] as readonly Plain[],
  },
  standingComfort: {
    title: { fem: "איך את מרגישה בזמן עמידה?", masc: "איך אתה מרגיש בזמן עמידה?" } as Gendered,
    subtitle: { fem: "בחרי את התשובה המתאימה ביותר", masc: "בחר את התשובה המתאימה ביותר" } as Gendered,
    options: [
      { value: "stable", fem: "אני מרגישה יציבה ונוחה", masc: "אני מרגיש יציב ונוח" },
      { value: "holds_support", fem: "אני מרגישה יציבה יותר כשאני אוחזת במשהו", masc: "אני מרגיש יציב יותר כשאני אוחז במשהו" },
      { value: "seated", fem: "אני מרגישה בטוחה יותר כשאני יושבת", masc: "אני מרגיש בטוח יותר כשאני יושב" },
    ] as readonly GenderedOption[],
  },
  reinforcement2: {
    titleLead: "הגוף מגיב למה ",
    titleAccent: "שמתרגלים",
    body: "לא צריך להתאמן שעות. מחקרים מראים שכמה דקות של תנועה מותאמת אישית בכל יום עושות הבדל משמעותי",
  },
  frequency: {
    title: { fem: "באיזו תדירות את מבצעת פעילות גופנית?", masc: "באיזו תדירות אתה מבצע פעילות גופנית?" } as Gendered,
    subtitle: both("רמת הפעילות שלך תעזור לנו לדייק עבורך את התוכנית האישית"),
    options: [
      { value: "almost_daily", label: "כמעט כל יום" },
      { value: "three_week", label: "כ־3 פעמים בשבוע" },
      { value: "one_two_week", label: "1–2 פעמים בשבוע" },
      { value: "none", fem: "אני לא מתרגלת בכלל", masc: "אני לא מתרגל בכלל" },
    ] as readonly (Plain | GenderedOption)[],
  },
  bodyAreas: {
    title: "האם יש איזורים שמרגישים פחות נוח או כואבים?",
    options: [
      { value: "neck", label: "צוואר" },
      { value: "shoulders_neck", label: "כתף" },
      { value: "elbows", label: "מרפק" },
      { value: "lower_back", label: "גב תחתון" },
      { value: "hips", label: "ירך" },
      { value: "knees", label: "ברך" },
      { value: "ankle", label: "קרסול" },
      { value: "none", label: "אין כאב או אי-נוחות" },
    ] as readonly Plain[],
  },
  planBuilding: {
    title: "בונים את התוכנית שלך",
    checklist: [
      { at: 28, label: "מבינים מה הגוף שלך צריך עכשיו" },
      { at: 56, label: "מתאימים תרגול לרמה שלך בדיוק" },
      { at: 82, label: "בונים לך דרך פשוטה להתחיל כבר היום" },
    ],
  },
  time: {
    periodTitle: "באיזה זמן ביום\nמתאים לך להשקיע בעצמך?",
    periodSubtitle: "הרגל קבוע = תוצאה גדולה.",
    periods: [
      { value: "morning", label: "בוקר" },
      { value: "midday", label: "צהריים" },
      { value: "afternoon", label: "אחר הצהריים" },
    ] as readonly Plain[],
    hourTitle: {
      morning: "באיזו שעה בבוקר\nמתאים לך?",
      midday: "באיזו שעה בצהריים\nמתאים לך?",
      afternoon: "באיזו שעה אחר הצהריים\nמתאים לך?",
    },
    hourSubtitle: { fem: "בחרי שעה שמתאימה לך", masc: "בחר שעה שמתאימה לך" } as Gendered,
    presets: {
      morning: ["08:00", "09:00", "10:00"],
      midday: ["11:00", "12:00", "13:00"],
      afternoon: ["16:00", "17:00", "18:00"],
    },
    /*
      Gendered on purpose: the spec and the app keep these masculine for
      everyone, but the user decided on 2026-10-04 that a woman gets the
      feminine form. Do not "fix" them back to match the app.
    */
    otherHour: { fem: "בחרי שעה אחרת שמתאימה לי", masc: "בחר שעה אחרת שמתאימה לי" } as Gendered,
    pickerTitle: { fem: "בחרי שעה", masc: "בחר שעה" } as Gendered,
    pickerConfirm: "אישור",
    /** Picker ranges in whole hours (start inclusive, end inclusive), 15-minute steps. */
    pickerRanges: {
      morning: { from: 5, to: 10 },
      midday: { from: 11, to: 15 },
      afternoon: { from: 16, to: 21 },
    },
    pickerStepMinutes: 15,
  },
  register: {
    nameHeader: "כבר מסיימים",
    phoneHeader: "שלב 2 מתוך 2",
    nameTitle: { fem: "איך תרצי שנקרא לך?", masc: "איך תרצה שנקרא לך?" } as Gendered,
    namePlaceholder: "הקלידו את שמכם",
    nameCta: "הבא",
    nameError: "השם חייב להכיל לפחות 2 תווים",
    phoneTitle: "נשלח לך קוד",
    phoneSubtitle: "להמשך מהיר ובטוח",
    phoneLabel: "מספר טלפון",
    phonePlaceholder: { fem: "הקלידי מספר טלפון", masc: "הקלידו מספר טלפון" } as Gendered,
    phoneSecure: "הפרטים שלך מאובטחים",
    phoneCta: "שלחו לי קוד",
    phoneFooter: "לוקח פחות מדקה • ללא התחייבות",
    /*
      The spec's consent line, split so its two documents can be links:
      lead + terms + " " + and + privacy. The spec writes "ו מדיניות" with a
      space (the app joins a link there); Hebrew attaches the "ו", as the
      approved mockup does.
    */
    consent: {
      lead: {
        fem: "בלחיצה על \"שלחו לי קוד\" אני מאשרת את",
        masc: "בלחיצה על \"שלחו לי קוד\" אני מאשר את",
      } as Gendered,
      terms: "תנאי השימוש",
      and: "ו",
      privacy: "מדיניות הפרטיות",
    },
    phoneError: "מספר טלפון לא תקין",
    /** Task 5 brief: signInWithOtp refused or failed. */
    sendFailed: "לא הצלחנו לשלוח קוד. בדקו את המספר ונסו שוב.",
  },
  otp: {
    title: "קוד אימות נשלח אליך",
    subtitle: "הכנס את הקוד שקיבלת ב־SMS",
    sentTo: "ל-{phone}",
    resendIn: "שלח שוב בעוד {n} שניות",
    resend: "לא קיבלת קוד? שלח שוב",
    editPhone: "ערוך מספר",
    /** The single code input's accessible name (approved mockup). */
    codeLabel: "קוד אימות, {n} ספרות",
    /** Wrong or expired code (approved mockup; the app's ErrorMapper says the same). */
    wrongCode: "קוד האימות שגוי",
    /** 429 from verify (the app's ErrorMapper wording). */
    rateLimited: "יותר מדי ניסיונות, נסה מאוחר יותר",
    /** Network or server failure on verify. Not in the spec or the app: written for the web. */
    verifyFailed: "לא הצלחנו לאמת את הקוד. נסו שוב.",
    finishing: "מסיימים את ההרשמה...",
    mergeFailed: "לא הצלחנו לסיים את ההרשמה",
    retry: "נסו שוב",
    /**
     * Signed in, but the account has no trainee profile (staff, trainers): a retry cannot help.
     * Not in the spec or the app: written for the web, needs the client's OK.
     */
    noProfile: "לא הצלחנו להשלים את ההרשמה בחשבון הזה",
    noProfileContact: "התקשרו אלינו ונסדר את זה:",
    /** An existing user after fill_missing_funnel_answers (Task 5 brief). */
    welcomeBack: "ברוכים השבים, {name}",
    /** The hand-off action to /payment (approved mockup). */
    toPayment: "לבחירת מסלול",
  },
} as const;
