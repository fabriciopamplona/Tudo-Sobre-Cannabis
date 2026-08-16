import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/lib/markdown";
import {
  formatDate,
  getArticle,
  getArticles,
  pillarMeta,
} from "@/lib/content";

type Props = PageProps<"/[pillar]/[slug]">;

export const dynamicParams = false;

export function generateStaticParams() {
  return getArticles().map((article) => ({
    pillar: article.pillar,
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    keywords: article.keyword,
    openGraph: {
      type: "article",
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { pillar, slug } = await params;
  const article = getArticle(slug);
  if (!article || article.pillar !== pillar) notFound();
  const pillarInfo = pillarMeta(article.pillar);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    inLanguage: "pt-BR",
    author: { "@type": "Organization", name: "Tudo Sobre Cannabis" },
    publisher: { "@type": "Organization", name: "Tudo Sobre Cannabis" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <header className="article-header">
          <p className="kicker">
            <a href={pillarInfo.href}>{pillarInfo.label}</a>
          </p>
          <h1>{article.title}</h1>
          <p className="lede">{article.description}</p>
          <p className="meta-line">
            Publicado {formatDate(article.datePublished)}
            {article.reviewedBy ? ` · ${article.reviewedBy}` : ""}
          </p>
        </header>
        <Markdown source={article.body} />
        <p className="disclaimer">
          Este texto é informativo e não substitui avaliação médica. Cannabis
          medicinal no Brasil depende de prescrição e das regras sanitárias em
          vigor.
        </p>
      </article>
    </>
  );
}
