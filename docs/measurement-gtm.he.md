# מדידה באתר: Google Tag Manager

למי: תומר (הגדרת התגים ב-GTM), מידד (פתיחת החשבון), איתי (הפעלה ב-Vercel).

## איך זה עובד

- בראש כל עמוד מופיעה הודעה על עוגיות עם כפתור אחד, "אישור". עד שלוחצים עליו לא נטען שום תג ושום מידע לא יוצא מהדפדפן.
- אחרי האישור נטען הקונטיינר של Google Tag Manager. האישור נשמר בדפדפן לשנה, ובביקורים הבאים GTM נטען מיד והודעה לא מוצגת.
- כל התגים (GA4, Meta Pixel, Google Ads) מנוהלים בתוך GTM, לא בקוד. הקוד רק דוחף אירועים ל-`dataLayer` (הטבלה למטה).
- אירוע שקרה לפני האישור באותו עמוד מחכה ב-`dataLayer`, ו-GTM קורא אותו כשהוא נטען. כך מי שמאשר בשאלה החמישית נספר גם בארבע שלפניה.

## הקמה (פעם אחת)

1. **מידד:** נכנסים ל-tagmanager.google.com עם חשבון Google של מידד ← Create Account. שם החשבון: פעילים פלוס. קונטיינר: `peilimplus.co.il`, סוג Web.
2. **מידד:** Admin ← User Management ← הוספת משתמש: `tomergips@gmail.com`, בהרשאת הקונטיינר **Publish**.
3. **מידד או תומר:** שולחים לאיתי את מזהה הקונטיינר (`GTM-XXXXXXX`, מופיע בראש המסך ב-GTM).
4. **איתי:** ב-Vercel, בפרויקט האתר, משתנה סביבה `NEXT_PUBLIC_GTM_ID` = המזהה, ב-Production, ואז Redeploy. בלי המשתנה אין הודעה ואין תגים (כך גם בסביבות תצוגה).

## האירועים ב-dataLayer

| אירוע | מתי | פרמטרים | הצעה ל-GA4 / Meta |
|---|---|---|---|
| `funnel_start` | לחיצה על "מתחילים!" במסך הפתיחה של השאלון | | אירוע מותאם |
| `funnel_step` | הצגת מסך בשאלון | `step_number` (1 עד 21), `step_total` (21) | אירוע מותאם |
| `questionnaire_complete` | סוף מסך "בונים את התוכנית" | | אירוע מותאם |
| `sign_up` | חשבון **חדש** אומת בקוד SMS (לא מי שכבר רשום ומתחבר שוב) | `method` = `phone` | GA4 `sign_up` / Meta `CompleteRegistration` |
| `begin_checkout` | הגעה לעמוד המסלולים והתשלום (`/payment`); חזרה מתשלום שבוטל לא נספרת | | GA4 `begin_checkout` / Meta `InitiateCheckout` |
| `store_click` | לחיצה על App Store או Google Play | `store` = `app_store` / `google_play` | אירוע מותאם. כל עוד התשלום באתר כבוי, זו ההמרה של האתר |
| `purchase` | תשלום באתר שהשרת אישר שהמנוי פעיל (`/payment/success`), פעם אחת לכל תשלום | `ecommerce.transaction_id`, `ecommerce.value` (בשקלים), `ecommerce.currency` = `ILS`, `ecommerce.items` | GA4 `purchase` / Meta `Purchase` עם value ו-currency מה-ecommerce, ו-`eventID` = `transaction_id` |
| `generate_lead` | טופס יצירת קשר נשלח ונשמר | `form_source` = `home` / `contact` | GA4 `generate_lead` / Meta `Lead` |

`purchase` קיים רק כשהתשלום באתר מופעל (`NEXT_PUBLIC_WEB_CHECKOUT`). היום הוא כבוי, והרכישה עוברת באפליקציות.

### מספרי המסכים ב-`funnel_step`

לכל מסך מספר קבוע, לא משנה באיזה מסלול המתאמן נמצא. אחד ממסכים 12 ו-13 תמיד מדולג, לפי התשובות.

| # | מסך | # | מסך |
|---|---|---|---|
| 1 | פתיחה | 12 | אתגר בתנועה |
| 2 | מטרות | 13 | יציבות בעמידה |
| 3 | מגדר | 14 | מסך חיזוק 2 |
| 4 | קבוצת גיל | 15 | ישיבה ממושכת |
| 5 | מסך חיזוק | 16 | תדירות אימונים |
| 6 | המלצות | 17 | אזורי כאב |
| 7 | שאיפה | 18 | בניית התוכנית |
| 8 | תחושה רצויה | 19 | שעת אימון |
| 9 | זיכרון | 20 | שם וטלפון |
| 10 | רמת פעילות | 21 | קוד SMS |
| 11 | קימה מכיסא | | |

המקור הקובע לסדר הוא `FUNNEL_STEPS` (`lib/funnel/contract.generated.ts`). שם המסך והתשובות **לא** נשלחים, רק המספר: השאלון שואל על שיווי משקל, זיכרון וכאב, ומדיניות הפרסום של Meta ו-Google אוסרת לשלוח להן מידע בריאותי.

## חשוב בהגדרת התגים

- **Meta Pixel, אירועים אוטומטיים:** בתג הבסיס של הפיקסל להוסיף לפני `fbq('init', ...)` את השורה `fbq('set', 'autoConfig', false, '<PIXEL_ID>');`. בלי זה הפיקסל קורא לבד את הטקסט של כפתורים שנלחצו, וכפתורי התשובות בשאלון מתארים מצב בריאותי.
- **Meta, Automatic advanced matching:** להשאיר כבוי (Events Manager ← הפיקסל ← Settings). מדיניות הפרטיות כותבת שאנחנו לא שולחים שם, טלפון או אימייל; אם מדליקים, צריך קודם לעדכן אותה.
- **בלי משתני Custom JavaScript ב-GTM:** מדיניות האבטחה של האתר (CSP) לא מתירה `eval`, שהם צריכים. להשתמש ב-Data Layer Variables.
- **ספקים מותרים:** GTM (כולל מצב Preview), GA4, Google Ads ו-Meta Pixel. תג של ספק אחר (TikTok, Hotjar, Clarity, LinkedIn ועוד) ייחסם בדפדפן עד שאיתי יוסיף את הכתובות שלו ב-`lib/security/csp.ts`. אם משהו לא נשלח, לחפש בקונסולה של הדפדפן שגיאה שמתחילה ב-"Content Security Policy".
- **מניעת כפילות ברכישה:** `eventID` של Meta = `ecommerce.transaction_id`. כך, אם בעתיד נשלח את הרכישה גם מהשרת (Conversions API), Meta תספור אותה פעם אחת.

## בדיקה

1. ב-GTM: Preview ← `https://peilimplus.co.il` ← לאשר את ההודעה ← לעבור כמה מסכים בשאלון, ולראות את האירועים ב-Tag Assistant.
2. ב-Meta Events Manager: Test events, אותו מסלול.
3. בקונסולה של הדפדפן: אין שגיאות "Content Security Policy".
