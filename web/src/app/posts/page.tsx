import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Posts",
  description: "Arquivo de textos do Tudo Sobre Cannabis: ciência, acesso e regulação.",
};

export default function PostsPage() {
  const articles = getArticles();

  return (
    <div className="page-intro wrap">
      <p className="kicker">Arquivo</p>
      <h1>Posts publicados</h1>
      <p className="lede">
        Tudo o que já escrevemos sobre cannabis por aqui.
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
