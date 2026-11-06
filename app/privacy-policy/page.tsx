import type { Metadata } from "next";

import PageHero from "@/components/layout/PageHero";
import { Shell } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description:
    "כיצד פעילים+ אוספת, משתמשת ומגנה על המידע האישי שלך באפליקציה ובאתר.",
};

interface PrivacySectionProps {
  title: string;
  /** An anchor for links into the section (the cookie notice links to #cookies). */
  id?: string;
  children: React.ReactNode;
}

function PrivacySection({ title, id, children }: PrivacySectionProps) {
  return (
    <section id={id} className="legal-section scroll-mt-28">
      <h2 className="mb-4 font-display text-h3 font-extrabold text-blue">
        {title}
      </h2>
      <div className="text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero title="מדיניות פרטיות" lede="עדכון אחרון: נובמבר 2026" />
      <div className="bg-surface py-[var(--section-y)]">
        <Shell width="narrow">

      <PrivacySection title="1. מבוא">
        <p>
          אנו מחויבים להגן על פרטיותך. מדיניות זו מסבירה כיצד אנו אוספים,
          משתמשים ומגנים על המידע האישי שלך באפליקציה &quot;פעילים פלוס&quot;.
        </p>
      </PrivacySection>

      <PrivacySection title="2. מידע שאנו אוספים">
        <ul>
          <li>פרטים אישיים: שם, כתובת אימייל, מספר טלפון, תאריך לידה</li>
          <li>מידע בריאותי: גובה, משקל, מגבלות רפואיות (בהסכמתך)</li>
          <li>נתוני שימוש: היסטוריית אימונים, התקדמות, העדפות</li>
          <li>מידע טכני: סוג המכשיר, גרסת מערכת ההפעלה</li>
          <li>מיקום (מאמנים בלבד): מיקום הטלפון בזמן נסיעה לאימון בבית מתאמן</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="3. כיצד אנו משתמשים במידע">
        <ul>
          <li>התאמה אישית של תוכניות אימון</li>
          <li>שיפור השירות והחוויה באפליקציה</li>
          <li>שליחת תזכורות והתראות (בהסכמתך)</li>
          <li>תמיכה טכנית ושירות לקוחות</li>
          <li>מחקר ופיתוח לשיפור השירות</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="4. שיתוף מידע">
        <p>
          איננו מוכרים את המידע האישי שלך, ואיננו משתפים אותו עם צדדים שלישיים
          למטרות שיווקיות, מלבד כלי המדידה והפרסום באתר המתוארים בסעיף 9,
          שפועלים רק אחרי אישור ההודעה על העוגיות. המידע עשוי להיות משותף עם
          ספקי שירות הפועלים בשמנו (כגון שירותי אחסון ענן) תחת הסכמי סודיות.
        </p>
      </PrivacySection>

      <PrivacySection title="5. מיקום מאמנים בדרך לאימון">
        <p>
          כשמאמן/ת יוצא/ת לאימון בבית מתאמן, האפליקציה משתפת את מיקום הטלפון של
          המאמן/ת עם המשרד, ועם המתאמן כשהמאמן/ת מתקרב/ת, כדי לדעת מתי
          יגיע/תגיע. השיתוף מתחיל ביציאה לדרך ונעצר בהגעה לכתובת. מחוץ לנסיעה
          לאימון המיקום לא נאסף. נקודות המיקום נשמרות 30 יום ואז נמחקות; סיכום
          הנסיעה (שעת יציאה, שעת הגעה ואיחור) נשמר לצורך דוחות דייקנות. לחישוב
          זמן ההגעה ולהצגת המפה אנחנו משתמשים בשירותי Google Maps Platform.
          מיקום המתאמנים אינו נאסף. אפשר לבטל את ההסכמה בכל זמן מהפרופיל.
        </p>
      </PrivacySection>

      <PrivacySection title="6. אבטחת מידע">
        <p>
          אנו מיישמים אמצעי אבטחה מתקדמים להגנה על המידע שלך, כולל הצפנת נתונים,
          גישה מוגבלת ומעקב אחר פעילות חשודה. עם זאת, אין שיטת אבטחה מושלמת
          ב-100%.
        </p>
      </PrivacySection>

      <PrivacySection title="7. הזכויות שלך">
        <p className="mb-2">יש לך זכות:</p>
        <ul>
          <li>לגשת למידע האישי שלך</li>
          <li>לתקן מידע שגוי</li>
          <li>למחוק את המידע שלך (&quot;הזכות להישכח&quot;)</li>
          <li>להתנגד לעיבוד מסוים של המידע</li>
          <li>להעביר את המידע לשירות אחר</li>
        </ul>
      </PrivacySection>

      <PrivacySection title="8. שמירת מידע">
        <p>
          אנו שומרים את המידע שלך כל עוד החשבון שלך פעיל או כנדרש לספק לך
          שירותים. לאחר מחיקת החשבון, המידע יימחק תוך 30 יום, למעט מידע שנדרש
          לשמור על פי חוק.
        </p>
      </PrivacySection>

      <PrivacySection id="cookies" title="9. עוגיות (Cookies) וכלי מדידה">
        <p>
          האתר משתמש בעוגיות ובטכנולוגיות דומות (כמו אחסון בדפדפן). חלקן נחוצות
          לפעולת האתר: שמירת ההתקדמות בשאלון, ההתחברות והתשלום.
        </p>
        <p>
          אחרי לחיצה על &quot;אישור&quot; בהודעה על העוגיות, האתר מפעיל את Google
          Tag Manager, ודרכו כלי מדידה ופרסום של Google (כמו Google Analytics
          ו-Google Ads) ושל Meta (Meta Pixel). הכלים האלה מקבלים מידע על השימוש
          באתר, למשל אילו דפים נצפו, איזה שלב בשאלון הושלם, הרשמה, רכישה וסכומה,
          ומידע טכני כמו סוג הדפדפן וכתובת ה-IP. אנו משתמשים בו כדי למדוד ולשפר
          את הפרסום שלנו ואת האתר. איננו שולחים לכלים האלה את התשובות לשאלון,
          מידע בריאותי, שם, טלפון או אימייל. Google ו-Meta מעבדות את המידע לפי
          מדיניות הפרטיות שלהן.
        </p>
        <p>
          אפשר למחוק עוגיות ולחסום אותן בהגדרות הדפדפן. אחרי מחיקה, ההודעה על
          העוגיות תוצג שוב.
        </p>
        <p>
          האפליקציה משתמשת בטכנולוגיות דומות לשיפור חווית המשתמש ולאיסוף נתונים
          סטטיסטיים. ניתן לשלוט בהגדרות אלו דרך הגדרות המכשיר.
        </p>
      </PrivacySection>

      <PrivacySection title="10. שינויים במדיניות">
        <p>
          אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באפליקציה
          ותישלח הודעה למשתמשים.
        </p>
      </PrivacySection>

      <PrivacySection title="11. יצירת קשר">
        <p>
          לשאלות בנוגע לפרטיות, ניתן לפנות אלינו:
          <br />
          <a
            href="mailto:office@improve-movement.co.il"
            className="text-blue-deep underline hover:text-blue"
          >
            office@improve-movement.co.il
          </a>
        </p>
      </PrivacySection>
        </Shell>
      </div>
    </>
  );
}
