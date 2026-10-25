import type { Answers } from "./types";

/** Feminine only when gender is "female"; male and unknown get masculine. */
export const g = (gender: Answers["gender"], fem: string, masc: string): string =>
  gender === "female" ? fem : masc;

export type Gendered = { readonly fem: string; readonly masc: string };
export type Plain = { readonly value: string; readonly label: string };
export type GenderedOption = { readonly value: string; readonly fem: string; readonly masc: string };
/** The answer icons the apps draw in each card's leading badge (components/funnel/AnswerIcon). */
export type AnswerIconName = "dumbbell" | "scale" | "brain" | "stretch" | "shield" | "bolt" | "progress" | "leaf";
export type IconOption = (Plain | GenderedOption) & { readonly icon: AnswerIconName };
export type PhotoOption = Plain & { readonly image: string };

const both = (s: string): Gendered => ({ fem: s, masc: s });

/** The answer key each question step writes; checked against the contract. */
export const COPY_KEYS = [
  "training_goals",
  "gender",
  "age_group",
  "desired_feeling",
  "memory_forgetfulness",
  "chair_rise_capability",
  "mobility_challenge",
  "standing_stability",
  "sedentary_lifestyle",
  "training_frequency_choice",
  "pain_areas",
  "training_time_of_day",
  "full_name",
] as const satisfies readonly (keyof Answers)[];

export const COPY = {
  /** The apps' entry screen (PetichaView): full photo, wordmark, one button. */
  welcome2: {
    title: "תוכנית אישית לאימון וחיזוק הגוף וחדות המחשבה",
    body: "רק 10 דקות ביום, מכל מקום ובקצב שלך.",
    cta: "מתחילים!",
  },
  common: {
    next: "המשך",
    /** The apps' gendered continue ("המשיכי" / "המשך"). */
    continue: { fem: "המשיכי", masc: "המשך" } as Gendered,
    trust: "המידע שלך בטוח ומאובטח",
  },
  goals: {
    // Non-breaking spaces: the only break, when one is needed, is before "שלך?" (as in the apps).
    title: "מה\u00A0המטרה\u00A0העיקרית שלך?",
    options: [
      { value: "strength", label: "לחזק את השרירים", icon: "dumbbell" },
      { value: "weight_loss", label: "לרדת במשקל", icon: "scale" },
      { value: "cognition", label: "לשפר את הזיכרון והריכוז", icon: "brain" },
      { value: "flexibility_balance", label: "לשפר את הגמישות ושיווי המשקל", icon: "stretch" },
    ] as readonly IconOption[],
  },
  /** Web-only chrome around every step (the app draws its own). */
  chrome: {
    back: "חזרה",
    cancel: "ביטול",
    dots: "שלב {i} מתוך {n}",
  },
  /** Two photo cards; a tap chooses and moves on (owner, 2026-10-21). */
  gender: {
    title: "מהו המגדר שלך?",
    subtitle: "המגדר שלך משפיע על מדדים גופניים חשובים.\nאנחנו משתמשים במידע הזה כדי לספק לך תוכן מותאם אישית.",
    options: [
      { value: "male", label: "זכר", image: "/img/funnel/app/gender-male.webp" },
      { value: "female", label: "נקבה", image: "/img/funnel/app/gender-female.webp" },
    ] as readonly PhotoOption[],
  },
  /** The dob step asks an age group in the apps (AgeGroupView); the photos follow the gender. */
  ageGroup: {
    title: "מה הגיל שלך?",
    subtitle: "כדי להתאים לך תרגול מדויק ובטוח לגיל שלך",
    options: [
      { value: "40_49", label: "40-49", file: "40-49" },
      { value: "50_59", label: "50-59", file: "50-59" },
      { value: "60_69", label: "60-69", file: "60-69" },
      { value: "70_79", label: "70-79", file: "70-79" },
      { value: "80_plus", label: "80+", file: "80-plus" },
    ],
  },
  /** Echoes the chosen goal over a full-screen photo (GoalReinforcementView). */
  goalReinforcement: {
    weight_loss: {
      lead: "השינוי מתחיל הרבה ",
      accent: "לפני שרואים אותו במראה.",
      body: "תנועה יומית עוזרת לרדת במשקל ולשמור על אנרגיה לאורך היום. מתחילים ב־10 דקות ביום ובונים הרגל שמתאים לחיים שלך.",
      female: "goal-female-walk",
    },
    flexibility_balance: {
      lead: "להמשיך לנוע בחופשיות. ",
      accent: "בכל גיל.",
      body: "תנועה טובה וביטחון בגוף מתחילים בתרגול נכון. רק 10 דקות ביום, בקצב שלך.",
      female: "goal-female-stretch",
    },
    cognition: {
      lead: "הגוף צריך תנועה. ",
      accent: "גם המוח אוהב אתגר.",
      body: "אימון שמשלב תנועה ואתגרי חשיבה, כדי להפעיל את הגוף והמחשבה יחד.",
      female: "goal-female-chess",
    },
    strength: {
      lead: "הכוח שלנו חשוב ",
      accent: "גם בעוד 10 שנים.",
      body: "שרירים חזקים עוזרים לנו להמשיך לעשות את הדברים שאנחנו אוהבים. מתחילים לחזק אותם כבר היום.",
      female: "goal-female-walk",
    },
  },
  desiredFeeling: {
    title: both("מה הכי חשוב לך להרגיש בעקבות האימונים?"),
    subtitle: { fem: "בחרי את התשובה שהכי מתאימה לך.", masc: "בחר את התשובה שהכי מתאימה לך." } as Gendered,
    cta: "ממשיכים",
    options: [
      { value: "body_confidence", label: "יותר ביטחון בגוף שלי", icon: "shield" },
      { value: "daily_energy", label: "יותר אנרגיה במהלך היום", icon: "bolt" },
      { value: "sense_of_progress", fem: "להרגיש שאני מתקדמת", masc: "להרגיש שאני מתקדם", icon: "progress" },
      { value: "healthy_habit", label: "להכניס הרגל בריא לחיים", icon: "leaf" },
    ] as readonly IconOption[],
  },
  memoryForgetfulness: {
    title: { fem: "האם במהלך היום קורה שאת שוכחת דברים?", masc: "האם במהלך היום קורה שאתה שוכח דברים?" } as Gendered,
    subtitle: { fem: "בחרי את התשובה שהכי מתאימה לך.", masc: "בחר את התשובה שהכי מתאימה לך." } as Gendered,
    options: [
      { value: "almost_never", label: "כמעט אף פעם" },
      { value: "sometimes", label: "לפעמים" },
      { value: "often", label: "לעיתים קרובות" },
      { value: "less_sharp", fem: "מרגישה שהזיכרון שלי פחות חד מבעבר", masc: "מרגיש שהזיכרון שלי פחות חד מבעבר" },
    ] as readonly (Plain | GenderedOption)[],
  },
  sedentaryLifestyle: {
    title: both("האם יש לך אורח חיים יושבני?"),
    options: [
      { value: "yes", label: "כן" },
      { value: "no", label: "לא" },
    ] as readonly Plain[],
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
  /** "התאמה אישית" over a full-screen photo (Reinforcement2View, owner copy 2026-10-18). */
  reinforcement2: {
    titleLead: "התאמה ",
    titleAccent: "אישית",
    body: "התשובות שלך עוזרות לנו להתאים עבורך תוכנית מדויקת בדיוק בשבילך",
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
    // Owner copy, 2026-10-19 (PlanBuildProgressView).
    checklist: [
      { at: 28, label: "בודקים את התשובות שלך" },
      { at: 56, label: "קובעים את התוכנית המדויקת עבורך" },
      { at: 82, label: "מבצעים דיוקים אחרונים" },
    ],
    review: {
      name: "אורלי אזולאי",
      source: "Google",
      stars: "5 כוכבים",
      text: "אני מאוד נהנית מפעילים+. האימונים קצרים אבל מרגישים אפקטיביים, ואחרי תקופה אני מרגישה יותר אנרגטית ויותר חדה. כיף לעשות משהו טוב בשביל עצמי כל יום.",
    },
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
    /** Network or server failure on verify. Written for the web; client approved 2026-10-05. */
    verifyFailed: "לא הצלחנו לאמת את הקוד. נסו שוב.",
    finishing: "מסיימים את ההרשמה...",
    mergeFailed: "לא הצלחנו לסיים את ההרשמה",
    retry: "נסו שוב",
    /**
     * Signed in, but the account has no trainee profile (staff, trainers): a retry cannot help.
     * Written for the web; client approved 2026-10-05.
     */
    noProfile: "לא הצלחנו להשלים את ההרשמה בחשבון הזה",
    noProfileContact: "התקשרו אלינו ונסדר את זה:",
    /** An existing user after fill_missing_funnel_answers (Task 5 brief). */
    welcomeBack: "ברוכים השבים, {name}",
    /** The hand-off action to /payment (approved mockup). */
    toPayment: "לבחירת מסלול",
  },
} as const;
