/** Client imagery per article slug. The inner image sits before the second h2. */
export const ARTICLE_MEDIA: Record<string, { cover: string; inner?: string; innerAlt?: string }> = {
  "body-after-50": { cover: "/img/v2/article-body-cover.webp", inner: "/img/v2/article-body-inner.webp", innerAlt: "אישה עולה במדרגות ברחוב, נעזרת במעקה" },
  "memory-after-50": { cover: "/img/v2/article-memory-cover.webp", inner: "/img/v2/article-memory-inner.webp", innerAlt: "מבוגרים מבצעים תנועה ומשימת חשיבה באותו זמן" },
  "brain-and-movement": { cover: "/img/v2/article-brain-cover.webp", inner: "/img/v2/article-brain-inner.webp", innerAlt: "איור של מוח ושל אישה רצה, עם מסלולי העצבים ביניהם" },
};
