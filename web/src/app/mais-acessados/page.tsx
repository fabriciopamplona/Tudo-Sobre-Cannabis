import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticlesByViews } from "@/lib/content";

export const metadata: Metadata = {
  title: "Mais acessados",
  description:
    "Todos os posts do Tudo Sobre Cannabis, do mais acessado para o menos acessado.",
};

export default function MaisAcessadosPage() {
  const articles = getArticlesByViews();

  return (
    <div className="page-intro wrap">
      <p className="kicker">Por demanda</p>
      <h1>Mais acessados</h1>
      <p className="lede">
        A lista completa dos posts mais interessantes do blog
      </p>
      {articles.length === 0 ? (
        <p className="article-dek">Ainda sem peças publicadas.</p>
      ) : (
        <div className="card-grid" style={{ marginTop: "2.5rem" }}>
          {articles.map((article, index) => (
            <ArticleCard
              key={article.slug}
              article={article}
              featured={index === 0 && articles.length > 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
