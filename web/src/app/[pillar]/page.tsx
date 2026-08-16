import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allPillars,
  formatDate,
  getArticlesByPillar,
  pillarMeta,
} from "@/lib/content";

type Props = PageProps<"/[pillar]">;

export const dynamicParams = false;

export function generateStaticParams() {
  return allPillars().map((pillar) => ({ pillar: pillar.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pillar } = await params;
  const meta = allPillars().find((item) => item.id === pillar);
  if (!meta) return {};
  return {
    title: meta.label,
    description: `Artigos do pilar ${meta.label} no Tudo Sobre Cannabis.`,
  };
}

export default async function PillarPage({ params }: Props) {
  const { pillar } = await params;
  if (!allPillars().some((item) => item.id === pillar)) notFound();
  const meta = pillarMeta(pillar);
  const articles = getArticlesByPillar(pillar);

  return (
    <div className="page-intro">
      <p className="kicker">Pilar</p>
      <h1>{meta.label}</h1>
      <p className="lede">
        Cluster editorial. Cada peça aponta de volta para cá; daqui você desce
        para a jornada específica.
      </p>
      <div className="article-list">
        {articles.length === 0 ? (
          <p className="meta-line">Ainda sem peças publicadas neste pilar.</p>
        ) : (
          articles.map((article) => (
            <Link key={article.slug} href={`/${article.pillar}/${article.slug}`}>
              <p className="kicker">{formatDate(article.datePublished)}</p>
              <h2>{article.title}</h2>
              <p>{article.description}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
