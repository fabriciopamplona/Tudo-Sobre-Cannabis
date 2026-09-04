import fs from "node:fs";
import path from "node:path";
import { type Article, allPillars, formatDate, pillarMeta } from "./site";

export type { Article };
export { allPillars, formatDate, pillarMeta };

export function publishedDir() {
  return path.join(process.cwd(), "..", "content", "published");
}

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw.trim() };
  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    data[key] = value;
  }
  return { data, body: match[2].trim() };
}

function toArticle(filename: string, raw: string): Article {
  const { data, body } = parseFrontmatter(raw);
  const slug = data.slug || filename.replace(/\.md$/, "");
  return {
    slug,
    title: data.title || slug,
    pillar: data.pillar || "acesso",
    keyword: data.keyword || "",
    description: data.description || "",
    audience: data.audience || "",
    datePublished: data.datePublished || "",
    dateModified: data.dateModified || data.datePublished || "",
    reviewedBy: data.reviewedBy || "",
    status: data.status || "draft",
    body,
  };
}

export function getArticles(): Article[] {
  const dir = publishedDir();
  if (!fs.existsSync(/* turbopackIgnore: true */ dir)) return [];
  return fs
    .readdirSync(/* turbopackIgnore: true */ dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) =>
      toArticle(
        file,
        fs.readFileSync(/* turbopackIgnore: true */ path.join(dir, file), "utf8"),
      ),
    )
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export function getArticle(slug: string): Article | undefined {
  return getArticles().find((article) => article.slug === slug);
}

export function getArticlesByPillar(pillar: string): Article[] {
  return getArticles().filter((article) => article.pillar === pillar);
}
