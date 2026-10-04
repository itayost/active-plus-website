import type { MetadataRoute } from "next";
import { ARTICLES } from "@/content/articles";
import { NAV, SITE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { path: "/", priority: 1 },
    ...NAV.map((item) => ({ path: item.href, priority: 0.8 })),
    { path: "/articles", priority: 0.7 },
    { path: "/privacy-policy", priority: 0.3 },
    { path: "/delete-account", priority: 0.3 },
  ];

  return [
    ...staticRoutes.map(({ path, priority }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      priority,
    })),
    ...ARTICLES.map((article) => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
