import fs from "node:fs";
import path from "node:path";
import { type Article, allPillars, extractFaqs, formatDate, pillarMeta } from "./site";

export type { Article };
export { allPillars, formatDate, pillarMeta };

export type FaqHighlight = {
  question: string;
  answer: string;
  href: string;
  title: string;
};

/** Pool de FAQs dos posts publicados, para destaque na home. */
export function getFaqHighlights(): FaqHighlight[] {
  return getArticles().flatMap((article) =>
    extractFaqs(article.body).map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      href: `/${article.pillar}/${article.slug}#perguntas-frequentes`,
      title: article.title,
    })),
  );
}

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
    headline: data.headline || data.title || slug,
    pillar: data.pillar || "acesso",
    keyword: data.keyword || "",
    description: data.description || "",
    takeaway: data.takeaway || "",
    audience: data.audience || "",
    datePublished: data.datePublished || "",
    dateModified: data.dateModified || data.datePublished || "",
    reviewedBy: data.reviewedBy || "",
    status: data.status || "draft",
    image: data.image || "",
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

function pageviewsPath() {
  return path.join(process.cwd(), "..", "content", "analytics", "pageviews.json");
}

export function getPageviews(): Record<string, number> {
  const file = pageviewsPath();
  if (!fs.existsSync(/* turbopackIgnore: true */ file)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")) as {
      views?: Record<string, number>;
    };
    return raw.views ?? {};
  } catch {
    return {};
  }
}

export function getArticleViews(slug: string): number {
  return getPageviews()[slug] ?? 0;
}

/** Todos os posts, do mais acessado para o menos (empate: data mais recente). */
export function getArticlesByViews(): Article[] {
  const views = getPageviews();
  return [...getArticles()].sort((a, b) => {
    const diff = (views[b.slug] ?? 0) - (views[a.slug] ?? 0);
    if (diff !== 0) return diff;
    return b.datePublished.localeCompare(a.datePublished);
  });
}

export function getArticle(slug: string): Article | undefined {
  return getArticles().find((article) => article.slug === slug);
}

export function getArticlesByPillar(pillar: string): Article[] {
  return getArticles().filter((article) => article.pillar === pillar);
}
