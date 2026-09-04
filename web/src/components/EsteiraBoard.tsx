"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Board, BoardCard, CardAction, ScoreSet, Ticks } from "@/lib/board";

const SCORE_KEYS: { id: keyof ScoreSet; label: string }[] = [
  { id: "factual", label: "Fato" },
  { id: "editorial", label: "Voz" },
  { id: "seo", label: "SEO" },
  { id: "ranking", label: "Rank" },
];

const TICK_ORDER: (keyof Ticks)[] = [
  "scrap",
  "briefed",
  "researched",
  "draft",
  "humanized",
  "candidate",
];

function verdictClass(verdict: string) {
  if (verdict === "BLOQUEAR") return "is-block";
  if (verdict === "AJUSTAR") return "is-adjust";
  if (verdict === "APROVAR") return "is-ok";
  return "";
}

function readLabel(card: BoardCard) {
  if (!(card.ticks?.draft || card.ticks?.humanized || card.ticks?.candidate || card.href)) return "";
  if (card.column === "gate" || card.column === "approved") return "Ler e apontar";
  if (card.ticks?.draft || card.ticks?.humanized || card.ticks?.candidate) return "Ler rascunho";
  return "Ler texto";
}

function agentCommand(id: number) {
  return `npm run agent -- --id ${id}`;
}

function ScoreRow({ scores }: { scores: ScoreSet }) {
  const values = SCORE_KEYS.map((item) => scores[item.id]).filter((n) => n != null) as number[];
  if (!values.length) return null;
  return (
    <div className="esteira-scores" aria-label="Scores">
      {SCORE_KEYS.map((item) => {
        const value = scores[item.id];
        return (
          <div key={item.id} className="esteira-score">
            <span>{item.label}</span>
            <span className="esteira-score-track">
              <span
                className="esteira-score-fill"
                style={{ width: value == null ? "0%" : `${Math.max(0, Math.min(10, value)) * 10}%` }}
                data-missing={value == null ? "true" : undefined}
              />
            </span>
            <b>{value == null ? "—" : value}</b>
          </div>
        );
      })}
    </div>
  );
}

function TickStrip({ ticks }: { ticks: Ticks }) {
  return (
    <ol className="esteira-ticks" aria-label="Estágios da esteira">
      {TICK_ORDER.map((id) => (
        <li key={id} className={ticks[id] ? "is-done" : ""} title={id} />
      ))}
    </ol>
  );
}

export function EsteiraActions({ card, onDone }: { card: BoardCard; onDone: () => void }) {
  const [reviewer, setReviewer] = useState("");
  const [credential, setCredential] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const actions = card.actions || [];
  if (!actions.length) return null;
  const needsReviewer = actions.some((item) => item.needsReviewer);

  async function go(action: CardAction) {
    if (action.disabled) return;
    if (action.needsReviewer && (!reviewer.trim() || !credential.trim())) {
      setError("Revisor e credencial para assinar o gate.");
      return;
    }
    if (action.id === "run" || action.id === "publish" || action.id === "approve") {
      const dest = action.to ? ` → ${action.to}` : "";
      const loci =
        action.id === "approve" && (card.lociCount || 0) > 0
          ? `\nHá ${card.lociCount} apontamento(s) aberto(s).`
          : "";
      if (!window.confirm(`${action.label}${dest}\nPeça #${card.id}.${loci} Continuar?`)) return;
    }
    setBusy(action.id);
    setError("");
    setNote("");
    try {
      const res = await fetch("/api/esteira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: card.id,
          action: action.id,
          reviewer,
          credential,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!data.ok) {
        setError(data.error || "Não rolou.");
        return;
      }
      setNote(data.message || "Feito.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de rede.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="esteira-next">
      {needsReviewer ? (
        <div className="esteira-sign">
          <label>
            <span className="sr-only">Revisor</span>
            <input
              value={reviewer}
              onChange={(event) => setReviewer(event.target.value)}
              placeholder="Revisor (nome real)"
              autoComplete="name"
            />
          </label>
          <label>
            <span className="sr-only">Credencial</span>
            <input
              value={credential}
              onChange={(event) => setCredential(event.target.value)}
              placeholder="Credencial (CRM, redação…)"
            />
          </label>
        </div>
      ) : null}
      {actions.map((action) => (
        <button
          key={`${action.id}-${action.label}`}
          type="button"
          className={`esteira-next-btn${action.from ? " is-secondary" : ""}`}
          disabled={Boolean(action.disabled) || busy != null}
          onClick={() => go(action)}
        >
          {busy === action.id
            ? "Trabalhando…"
            : action.to
              ? `${action.label} → ${action.to}`
              : action.label}
        </button>
      ))}
      {error ? <p className="esteira-next-err">{error}</p> : null}
      {note ? <p className="esteira-next-note">{note}</p> : null}
    </div>
  );
}

function CardBody({
  card,
  active,
  onSelect,
  onDone,
}: {
  card: BoardCard;
  active: boolean;
  onSelect: () => void;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const command = agentCommand(card.id);

  return (
    <article
      id={`p${card.id}`}
      className={`esteira-card ${verdictClass(card.verdict)} ${active ? "is-active" : ""} ${card.running ? "is-running" : ""}`}
    >
      <button type="button" className="esteira-card-hit" onClick={onSelect}>
        <header>
          <span className="esteira-id">#{card.id}</span>
          {card.priority ? <span className="esteira-pri">{card.priority}</span> : null}
          <h3>{card.title}</h3>
        </header>
        <p className="esteira-meta">
          {[card.type, card.channel, card.origin].filter(Boolean).join(" · ") || card.slug}
        </p>
        <TickStrip ticks={card.ticks} />
        <ScoreRow scores={card.scores} />
        {card.verdict !== "pending" ? (
          <span className={`esteira-verdict ${verdictClass(card.verdict)}`}>{card.verdict}</span>
        ) : card.status === "seed-rewrite" ? (
          <span className="esteira-verdict">semente</span>
        ) : null}
        {(card.lociCount || 0) > 0 ? (
          <span className="esteira-verdict">{card.lociCount} apont.</span>
        ) : null}
      </button>
      {readLabel(card) ? (
        <a className="esteira-read" href={`/esteira/${card.id}`}>
          {readLabel(card)}
        </a>
      ) : null}
      <EsteiraActions card={card} onDone={onDone} />
      {active ? (
        <div className="esteira-card-detail">
          {card.takeaway ? <p>{card.takeaway}</p> : null}
          {card.keyword ? (
            <p>
              Keyword: <code>{card.keyword}</code> ({card.keyword_status || "none"})
            </p>
          ) : null}
          {card.reviewedBy ? <p>Revisor: {card.reviewedBy}</p> : null}
          {card.why ? <p>{card.why}</p> : null}
          {card.href ? (
            <p>
              <a href={card.href}>Abrir no site</a>
            </p>
          ) : null}
          {card.artifacts.length ? (
            <p className="esteira-files">{card.artifacts.join(" · ")}</p>
          ) : (
            <p className="esteira-files">Ainda sem run em content/runs/{card.slug}/</p>
          )}
          <p className="esteira-ops">
            <code>{command}</code>
            <button
              type="button"
              className="esteira-copy"
              onClick={async (event) => {
                event.stopPropagation();
                await navigator.clipboard.writeText(command);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              }}
            >
              {copied ? "Copiado" : "Copiar comando"}
            </button>
          </p>
          <p className="esteira-files">No chat: trabalha o #{card.id}</p>
        </div>
      ) : null}
    </article>
  );
}

export function EsteiraBoard({ board }: { board: Board }) {
  const router = useRouter();
  const [orphans, setOrphans] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const running = [...board.cards, ...board.orphans].some((card) => card.running);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [running, router]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const id = hash.replace(/^p/, "");
    if (!id) return;
    const card = [...board.cards, ...board.orphans].find((item) => String(item.id) === id);
    if (!card) return;
    if (!board.cards.some((item) => item.id === card.id)) setOrphans(true);
    setSelected(`${card.column}-${card.slug}`);
    window.requestAnimationFrame(() => {
      document.getElementById(`p${card.id}`)?.scrollIntoView({ block: "center" });
    });
  }, [board]);

  const lists = useMemo(() => {
    const pool = orphans ? [...board.cards, ...board.orphans] : board.cards;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? pool.filter((card) =>
          [`#${card.id}`, card.title, card.slug, card.keyword, card.type, card.origin, card.priority]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : pool;
    return Object.fromEntries(
      board.columns.map((col) => [col.id, filtered.filter((card) => card.column === col.id)]),
    ) as Record<string, BoardCard[]>;
  }, [board, orphans, query]);

  const visibleCounts = board.columns.map((col) => ({
    ...col,
    count: orphans
      ? board.cards.filter((c) => c.column === col.id).length +
        board.orphans.filter((c) => c.column === col.id).length
      : board.counts[col.id] || 0,
  }));

  return (
    <div className="esteira">
      <div className="esteira-stats">
        {visibleCounts.map((col) => (
          <div key={col.id} className="esteira-stat">
            <strong>{col.count}</strong>
            <span>{col.label}</span>
          </div>
        ))}
        <div className="esteira-stat">
          <strong>{orphans ? board.counts.total + board.counts.orphan : board.counts.total}</strong>
          <span>No quadro</span>
        </div>
      </div>

      <div className="esteira-toolbar">
        <label>
          <span className="sr-only">Filtrar peças</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar #, slug, type, origem…"
          />
        </label>
        <label className="esteira-toggle">
          <input type="checkbox" checked={orphans} onChange={(event) => setOrphans(event.target.checked)} />
          Órfãos de scrap ({board.counts.orphan})
        </label>
      </div>

      <div className="esteira-board">
        {board.columns.map((col) => (
          <section key={col.id} className="esteira-col" aria-label={col.label}>
            <header>
              <h2>
                {col.label} <em>{lists[col.id]?.length ?? 0}</em>
              </h2>
              <p>{col.description}</p>
            </header>
            <div className="esteira-col-body">
              {(lists[col.id] || []).map((card) => (
                <CardBody
                  key={`${col.id}-${card.slug}`}
                  card={card}
                  active={selected === `${col.id}-${card.slug}`}
                  onDone={() => router.refresh()}
                  onSelect={() => {
                    const key = `${col.id}-${card.slug}`;
                    const next = selected === key ? null : key;
                    setSelected(next);
                    history.replaceState(null, "", next ? `#${card.id}` : "/esteira");
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
