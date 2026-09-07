import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleActions, ArticleSavedHint } from "@/components/ArticleActions";
import { ArrowLeftIcon, ClockIcon } from "@/components/Icons";
import { Brand } from "@/components/SiteChrome";
import { Markdown } from "@/lib/markdown";
import {
  formatDate,
  getArticle,
  getArticles,
  pillarMeta,
} from "@/lib/content";
import { AuthorExpediente } from "@/components/AuthorExpediente";
import { FitoCanabicaBanner } from "@/components/FitoCanabicaBanner";
import { EDITOR, ABOUT_BLOG } from "@/lib/authors";
import { articleHeadings, extractFaqs, readingMinutes, splitBodyAtMidpoint, stripAboutBlogSection } from "@/lib/site";

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
      ...(article.image
        ? { images: [{ url: article.image }] }
        : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { pillar, slug } = await params;
  const article = getArticle(slug);
  if (!article || article.pillar !== pillar) notFound();
  const pillarInfo = pillarMeta(article.pillar);
  const body = stripAboutBlogSection(article.body);
  const [bodyBefore, bodyAfter] = splitBodyAtMidpoint(body);
  const headings = articleHeadings(body).filter((h) => h.label.toLowerCase() !== "sobre o blog");
  const related =
    getArticles().find((item) => item.slug !== article.slug && item.pillar === article.pillar) ??
    getArticles().find((item) => item.slug !== article.slug);
  const minutes = readingMinutes(body);
  const faqs = extractFaqs(body);
  const displayHeadline = article.headline || article.title;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: displayHeadline,
    name: article.title,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    inLanguage: "pt-BR",
    author: { "@type": "Organization", name: "Tudo Sobre Cannabis" },
    publisher: { "@type": "Organization", name: "Tudo Sobre Cannabis" },
    ...(article.reviewedBy
      ? {
          editor: {
            "@type": "Person",
            name: article.reviewedBy,
            description: EDITOR.oneLiner,
          },
        }
      : {}),
  };

  const faqLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  return (
    <main className="article-exploded">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      ) : null}
      <header className="exploded-header">
        <Link href="/#arquivo" className="exploded-back">
          <ArrowLeftIcon /> voltar ao arquivo
        </Link>
        <Link href="/" className="exploded-brand" aria-label="Tudo Sobre Cannabis">
          <Brand />
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
            <h1 className="article-display exploded-title">{displayHeadline}</h1>
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
              <Markdown source={bodyBefore} className="exploded-prose" />
              {bodyAfter ? <FitoCanabicaBanner variant="inline" /> : null}
              {bodyAfter ? <Markdown source={bodyAfter} className="exploded-prose" /> : null}
              <AuthorExpediente />
              <p className="disclaimer">{ABOUT_BLOG.footer}</p>
            </article>

            <aside className="exploded-aside">
              <FitoCanabicaBanner />
              {headings.length > 0 ? (
                <>
                  <p className="article-mono exploded-aside-label exploded-aside-toc">Neste texto</p>
                  <nav aria-label="Índice do artigo">
                    {headings.map((heading) => (
                      <a key={heading.id} className="exploded-link" href={`#${heading.id}`}>
                        {heading.label}
                      </a>
                    ))}
                  </nav>
                </>
              ) : (
                <p className="article-mono exploded-aside-label exploded-aside-toc">Matéria</p>
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
