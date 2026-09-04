import Link from "next/link";
import { formatDate, pillarMeta, readingMinutes, type Article } from "@/lib/site";
import { EditorialArt } from "./EditorialArt";
import { ClockIcon } from "./Icons";

export function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  const minutes = readingMinutes(article.body);
  return (
    <Link
      href={`/${article.pillar}/${article.slug}`}
      className={`article-card${featured ? " article-card-featured" : ""}`}
    >
      <EditorialArt seed={article.slug} large={featured} />
      <div className="article-card-body">
        <p className="article-card-cat">{pillarMeta(article.pillar).label}</p>
        <h3>{article.title}</h3>
        <p className="article-card-excerpt">{article.description}</p>
        <div className="article-card-meta">
          <span>
            {article.reviewedBy || "Redação Tudo Sobre Cannabis"} · {formatDate(article.datePublished)}
          </span>
          <span className="font-mono-editorial" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ClockIcon /> {minutes} min
          </span>
        </div>
        <span className="article-card-read">Ler o texto →</span>
      </div>
    </Link>
  );
}
