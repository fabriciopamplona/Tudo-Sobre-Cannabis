import type { MetadataRoute } from "next";
import { allPillars, getArticles } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const articles = getArticles().map((article) => ({
    url: `${base}/${article.pillar}/${article.slug}`,
    lastModified: article.dateModified || article.datePublished,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const pillars = allPillars().map((pillar) => ({
    url: `${base}${pillar.href}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/sobre`, changeFrequency: "yearly", priority: 0.3 },
    ...pillars,
    ...articles,
  ];
}
