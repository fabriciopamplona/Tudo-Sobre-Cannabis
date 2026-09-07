"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/site";
import type { FaqHighlight } from "@/lib/content";
import { ArticleCard } from "./ArticleCard";
import { ChevronRightIcon } from "./Icons";

type Filter = { id: string; label: string };

function shuffleFaqs(faqs: FaqHighlight[]) {
  const list = [...faqs];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function HomeArchive({
  articles,
  filters,
  faqs,
}: {
  articles: Article[];
  filters: Filter[];
  faqs: FaqHighlight[];
}) {
  const [active, setActive] = useState("todos");
  const [deck, setDeck] = useState<FaqHighlight[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDeck(shuffleFaqs(faqs));
    setIndex(0);
  }, [faqs]);

  const faq = deck[index] ?? null;

  const visible = useMemo(() => {
    return articles.filter((article) => active === "todos" || article.pillar === active);
  }, [articles, active]);

  return (
    <section id="arquivo" className="section wrap archive-section" style={{ scrollMarginTop: "6rem" }}>
      <div className="archive-head">
        <div className="archive-intro">
          <p className="section-kicker">Direto do nosso FAQ</p>
          <h2 className="section-title">
            Perguntas que
            <br />
            <span className="archive-title-line2">fazem a cabeça.</span>
          </h2>
        </div>

        {faq ? (
          <blockquote className="archive-quote">
            <p className="archive-quote-mark" aria-hidden="true">
              ?
            </p>
            <div className="archive-quote-body">
              <p className="archive-quote-text">{faq.question}</p>
              <p className="archive-quote-answer">{faq.answer}</p>
              <div className="archive-quote-actions">
                <Link href={faq.href} className="archive-quote-link">
                  Ver no texto <ChevronRightIcon />
                </Link>
                {deck.length > 1 ? (
                  <button
                    type="button"
                    className="archive-quote-next"
                    onClick={() => setIndex((current) => (current + 1) % deck.length)}
                  >
                    Próxima
                  </button>
                ) : null}
              </div>
            </div>
          </blockquote>
        ) : null}
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
          <h3>Nada neste filtro ainda.</h3>
          <p className="lede" style={{ margin: "0.75rem auto 0", maxWidth: "28rem" }}>
            Escolha outro pilar, ou volte para todos os textos.
          </p>
          <button
            type="button"
            className="btn-ghost"
            style={{ color: "var(--tsc-ink)", marginTop: "1.5rem" }}
            onClick={() => setActive("todos")}
          >
            Ver todas as leituras
          </button>
        </div>
      )}
    </section>
  );
}
