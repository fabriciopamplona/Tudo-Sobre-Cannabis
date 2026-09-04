import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { notFound } from "next/navigation";
import {
  allPillars,
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
    <div className="page-intro wrap">
      <p className="kicker">Pilar</p>
      <h1>{meta.label}</h1>
      <p className="lede">
        Cluster editorial. Cada peça aponta de volta para cá; daqui você desce
        para a jornada específica.
      </p>
      {articles.length === 0 ? (
        <p className="article-dek">Ainda sem peças publicadas neste pilar.</p>
      ) : (
        <div className="card-grid" style={{ marginTop: "2.5rem" }}>
          {articles.map((article, index) => (
            <ArticleCard key={article.slug} article={article} featured={index === 0 && articles.length > 1} />
          ))}
        </div>
      )}
    </div>
  );
}
