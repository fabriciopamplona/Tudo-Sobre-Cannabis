"use client";

import { useMemo, useState } from "react";
import type { Article } from "@/lib/site";
import { ArticleCard } from "./ArticleCard";
import { SearchIcon } from "./Icons";

type Filter = { id: string; label: string };

export function HomeArchive({
  articles,
  filters,
}: {
  articles: Article[];
  filters: Filter[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("todos");

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return articles.filter((article) => {
      const matchesFilter = active === "todos" || article.pillar === active;
      if (!matchesFilter) return false;
      if (!needle) return true;
      const haystack = `${article.title} ${article.description} ${article.keyword}`.toLocaleLowerCase("pt-BR");
      return haystack.includes(needle);
    });
  }, [articles, active, query]);

  return (
    <section id="arquivo" className="section wrap" style={{ scrollMarginTop: "6rem" }}>
      <div className="section-head">
        <div>
          <p className="section-kicker">Arquivo recente</p>
          <h2 className="section-title">
            Leituras que
            <br />
            ficam na cabeça.
          </h2>
        </div>
        <label className="search-line">
          <SearchIcon />
          <span className="sr-only">Buscar por tema ou palavra</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por tema ou palavra"
          />
        </label>
      </div>
      <div className="filter-row">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className="filter-chip"
            aria-pressed={active === filter.id}
            onClick={() => setActive(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {visible.length > 0 ? (
        <div className="card-grid">
          {visible.map((article, index) => (
            <ArticleCard key={article.slug} article={article} featured={index === 0} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Nada encontrado ainda.</h3>
          <p className="lede" style={{ margin: "0.75rem auto 0", maxWidth: "28rem" }}>
            Tente outra palavra, ou volte para todos os textos.
          </p>
          <button
            type="button"
            className="btn-ghost"
            style={{ color: "var(--tsc-ink)", marginTop: "1.5rem" }}
            onClick={() => {
              setQuery("");
              setActive("todos");
            }}
          >
            Ver todas as leituras
          </button>
        </div>
      )}
    </section>
  );
}
