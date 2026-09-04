import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleActions, ArticleSavedHint } from "@/components/ArticleActions";
import { ArrowLeftIcon, ClockIcon } from "@/components/Icons";
import { Markdown } from "@/lib/markdown";
import {
  formatDate,
  getArticle,
  getArticles,
  pillarMeta,
} from "@/lib/content";
import { articleHeadings, readingMinutes } from "@/lib/site";

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
  const headings = articleHeadings(article.body);
  const related =
    getArticles().find((item) => item.slug !== article.slug && item.pillar === article.pillar) ??
    getArticles().find((item) => item.slug !== article.slug);
  const minutes = readingMinutes(article.body);

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
    <main className="article-exploded">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="exploded-header">
        <Link href="/#arquivo" className="exploded-back">
          <ArrowLeftIcon /> voltar ao arquivo
        </Link>
        <Link href="/" className="exploded-brand" aria-label="Tudo Sobre Cannabis">
          <span className="exploded-mark" aria-hidden="true">
            T
          </span>
          <span className="article-display">Tudo Sobre Cannabis</span>
        </Link>
        <ArticleActions slug={article.slug} title={article.title} />
      </header>

      <section className="exploded-hero">
        <div className="exploded-ghost" aria-hidden="true">
          T
        </div>
        <div className="exploded-ring" aria-hidden="true" />
        <div className="exploded-frame">
          <div className="exploded-lede">
            <p className="article-mono exploded-meta">
              <Link href={pillarInfo.href}>{pillarInfo.label}</Link>
              <span>/</span>
              <span>{formatDate(article.datePublished)}</span>
              {article.keyword ? (
                <>
                  <span>/</span>
                  <span>{article.keyword}</span>
                </>
              ) : null}
            </p>
            <h1 className="article-display exploded-title">{article.title}</h1>
            {article.description ? <p className="exploded-dek">{article.description}</p> : null}
            <div className="exploded-byline">
              <strong>Redação Tudo Sobre Cannabis</strong>
              {article.reviewedBy ? <span>Revisão: {article.reviewedBy}</span> : null}
              <span className="exploded-readtime">
                <ClockIcon /> {minutes} min de leitura
              </span>
              <ArticleSavedHint slug={article.slug} />
            </div>
          </div>

          <div className="exploded-body">
            <article>
              <Markdown source={article.body} className="exploded-prose" />
              <p className="disclaimer">
                Conteúdo educativo · não substitui avaliação profissional
              </p>
            </article>

            <aside className="exploded-aside">
              {headings.length > 0 ? (
                <>
                  <p className="article-mono exploded-aside-label">Neste texto</p>
                  <nav aria-label="Índice do artigo">
                    {headings.map((heading) => (
                      <a key={heading.id} className="exploded-link" href={`#${heading.id}`}>
                        {heading.label}
                      </a>
                    ))}
                  </nav>
                </>
              ) : (
                <p className="article-mono exploded-aside-label">Matéria</p>
              )}
              {related ? (
                <Link href={`/${related.pillar}/${related.slug}`} className="exploded-related">
                  <p className="article-mono exploded-aside-label">Leia também</p>
                  <p className="article-display">{related.title}</p>
                </Link>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <footer className="exploded-footer">
        <div className="exploded-footer-inner">
          <span className="article-mono">Tudo Sobre Cannabis</span>
          <span>Informação para ficar por dentro.</span>
        </div>
      </footer>
    </main>
  );
}
