import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const articles = getArticles().map((article) => ({
    url: `${base}/${article.pillar}/${article.slug}`,
    lastModified: article.dateModified || article.datePublished,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/posts`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/mais-acessados`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/sobre`, changeFrequency: "yearly", priority: 0.3 },
    ...articles,
  ];
}
