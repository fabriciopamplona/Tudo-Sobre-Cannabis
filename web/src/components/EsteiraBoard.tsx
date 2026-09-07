"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Board, BoardCard, CardAction, ScoreSet, Ticks } from "@/lib/board";
import { GATE_DEFAULTS, REVIEWERS } from "@/lib/authors";

/** Colunas do processo atual (Aprovado some no Gate). */
const BOARD_COLS: { id: string; label: string; hint: string }[] = [
  { id: "inbox", label: "Inbox", hint: "Ideia" },
  { id: "queued", label: "Fila", hint: "Pronta p/ rodar" },
  { id: "in_pipeline", label: "Esteira", hint: "IA / audit rodando" },
  { id: "gate", label: "Gate", hint: "OK humano" },
  { id: "published", label: "No ar", hint: "Publicado" },
  { id: "out", label: "Fora", hint: "Arquivo" },
];

const SCORE_KEYS: { id: keyof ScoreSet; label: string }[] = [
  { id: "factual", label: "Factual" },
  { id: "editorial", label: "Editorial" },
  { id: "seo", label: "SEO" },
];

/** Etapas do processo — espelha agents/board.mjs CHECKLIST_STEPS. */
const CHECKLIST: { id: keyof Ticks; label: string; optional?: boolean }[] = [
  { id: "scrap", label: "Scrap", optional: true },
  { id: "briefed", label: "Brief" },
  { id: "researched", label: "Pack" },
  { id: "draft", label: "Rascunho" },
  { id: "humanized", label: "Humanizado" },
  { id: "candidate", label: "Candidato" },
  { id: "illustrations_spec", label: "Spec ilustras" },
  { id: "illustrations_render", label: "Ilustras" },
  { id: "quality_audit", label: "Audit" },
  { id: "serp_locked", label: "SERP" },
  { id: "gate_prep", label: "Gate-prep" },
  { id: "published", label: "No ar" },
];

function displayColumn(card: BoardCard) {
  if (card.running && card.column !== "published" && card.column !== "out") {
    return "in_pipeline";
  }
  return card.column === "approved" ? "gate" : card.column;
}

function stageLabel(card: BoardCard) {
  if (card.running) return "rodando…";
  if (card.column === "published") return "no ar";
  if (card.column === "approved") return "assinado · falta publicar";
  if (card.column === "out") return "fora";
  if (card.column === "inbox") return "inbox";
  if (card.column === "queued") return "na fila";
  if (card.column === "gate") {
    if (card.verdict === "BLOQUEAR") return "BLOQUEAR";
    if (card.verdict === "AJUSTAR") return "AJUSTAR";
    if (card.verdict === "APROVAR") return "pronta · OK e publicar";
    return "audit / SERP";
  }
  if (card.ticks?.candidate) return "candidato · ilustras/audit";
  if (card.ticks?.humanized || card.ticks?.draft) return "texto";
  if (card.ticks?.researched) return "pack";
  if (card.ticks?.briefed) return "brief";
  return "iniciando";
}

function checklistItems(ticks: Ticks, column: string) {
  const published = Boolean(ticks.published) || column === "published";
  return CHECKLIST.filter((step) => !step.optional || ticks[step.id] || published).map((step) => ({
    ...step,
    on: step.id === "published" ? published : Boolean(ticks[step.id]),
  }));
}

function StageChecklist({ ticks, column }: { ticks: Ticks; column: string }) {
  const items = checklistItems(ticks, column);
  const done = items.filter((i) => i.on).length;
  return (
    <ul className="esteira-checklist" aria-label={`Etapas ${done}/${items.length}`}>
      {items.map((item) => (
        <li key={item.id} className={item.on ? "is-done" : ""}>
          <span className="esteira-check" aria-hidden="true">
            {item.on ? "✓" : "○"}
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ScoreStrip({ scores }: { scores: ScoreSet }) {
  const has = SCORE_KEYS.some((k) => scores[k.id] != null);
  if (!has) return null;
  return (
    <p className="esteira-scoreline" aria-label="Scores">
      {SCORE_KEYS.map((item) => (
        <span key={item.id}>
          {item.label} {scores[item.id] ?? "—"}
        </span>
      ))}
    </p>
  );
}

function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function EsteiraActions({ card, onDone }: { card: BoardCard; onDone: () => void }) {
  const [reviewer, setReviewer] = useState<string>(GATE_DEFAULTS.reviewer);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const actions = card.actions || [];
  if (!actions.length) return null;
  const needsReviewer = actions.some((item) => item.needsReviewer);
  // Só o botão principal + reabrir se houver; esconder "Só assinar" se houver OK e publicar
  const primary = actions.filter(
    (a) => a.id === "publish" || a.id === "run" || a.id === "reopen" || a.id === "enqueue",
  );
  const secondary = actions.filter((a) => !primary.includes(a) && a.id !== "approve");
  const staging = actions.find((a) => a.id === "approve");
  const shown = [
    ...primary,
    ...secondary,
    ...(primary.some((a) => a.id === "publish" && a.needsReviewer) ? [] : staging ? [staging] : []),
  ];

  async function go(action: CardAction) {
    if (action.disabled) return;
    const signedBy = reviewer.trim() || GATE_DEFAULTS.reviewer;
    if (action.id === "run" || action.id === "reopen" || action.id === "publish" || action.id === "approve") {
      const ok =
        action.id === "publish" && action.needsReviewer
          ? "Assina e publica. Continuar?"
          : `${action.label}. Continuar?`;
      if (!window.confirm(`#${card.id} — ${ok}`)) return;
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
          reviewer: signedBy,
          credential: GATE_DEFAULTS.credential,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!data.ok) {
        setError(data.error || "Não rolou.");
        return;
      }
      if (data.message) setNote(data.message);
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
          <label className="esteira-sign-field">
            <span>Revisado por</span>
            <select
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              aria-label="Revisado por"
            >
              {REVIEWERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <p className="esteira-sign-date">
            {GATE_DEFAULTS.credential} · Publicação: {todayLabel()}
          </p>
        </div>
      ) : null}
      {shown.map((action) => (
        <button
          key={`${action.id}-${action.label}`}
          type="button"
          className={`esteira-next-btn${action.from ? " is-secondary" : ""}`}
          disabled={Boolean(action.disabled) || busy != null}
          onClick={() => go(action)}
        >
          {busy === action.id ? "…" : action.label}
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
  const canRead = Boolean(
    card.ticks?.draft || card.ticks?.humanized || card.ticks?.candidate || card.column === "published",
  );

  return (
    <article
      id={`p${card.id}`}
      className={`esteira-card ${card.verdict === "BLOQUEAR" ? "is-block" : ""} ${card.verdict === "APROVAR" ? "is-ok" : ""} ${active ? "is-active" : ""} ${card.running ? "is-running" : ""}`}
    >
      <button type="button" className="esteira-card-hit" onClick={onSelect}>
        <header>
          <span className="esteira-id">#{card.id}</span>
          {card.priority ? (
            <span
              className={`esteira-pri is-${card.priority.toLowerCase()}`}
              title="Prioridade editorial: audiência BR × gap de SERP × diferencial TSC"
            >
              {card.priority}
            </span>
          ) : null}
          <h3>{card.title}</h3>
        </header>
        <p className="esteira-seo-line">
          {card.keyword && card.keyword !== "(depois)" ? (
            <span className="esteira-kw" title="Focus keyword">
              {card.keyword}
            </span>
          ) : (
            <span className="esteira-kw is-empty">sem keyword</span>
          )}
          {card.impactScore != null ? (
            <span
              className="esteira-demand"
              title="Potencial KB (impact_score da library). Não é volume de busca GSC — o SERP não inventa impressões."
            >
              KB {Math.round(card.impactScore)}
            </span>
          ) : (
            <span
              className="esteira-demand is-empty"
              title="Sem impact_score na library-hubs. Use P0/P1/P2 como proxy de potencial até plugar GSC."
            >
              KB —
            </span>
          )}
        </p>
        <p className="esteira-stage">{stageLabel(card)}</p>
        <StageChecklist ticks={card.ticks} column={card.column} />
        <ScoreStrip scores={card.scores} />
      </button>
      {canRead ? (
        <a className="esteira-read" href={`/esteira/${card.id}`}>
          Ler
        </a>
      ) : null}
      <EsteiraActions card={card} onDone={onDone} />
      {active ? (
        <div className="esteira-card-detail">
          {card.href ? (
            <p>
              <a href={card.href}>No site</a>
            </p>
          ) : null}
          <p className="esteira-files">
            <code>npm run esteira -- {card.id}</code>
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function EsteiraBoard({ board }: { board: Board }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const running = board.cards.some((card) => card.running);

  // Só enquanto roda: atualiza ticks/checklist ao fim de cada etapa. Idle = só botão Atualizar.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => router.refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [running, router]);

  useEffect(() => {
    const id = window.location.hash.replace(/^#p?/, "");
    if (!id) return;
    const card = board.cards.find((item) => String(item.id) === id);
    if (!card) return;
    const col = displayColumn(card);
    setSelected(`${col}-${card.slug}`);
    window.requestAnimationFrame(() => {
      document.getElementById(`p${card.id}`)?.scrollIntoView({ block: "center" });
    });
  }, [board]);

  const lists = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? board.cards.filter((card) =>
          [`#${card.id}`, card.priority, card.title, card.slug, card.keyword]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : board.cards;
    return Object.fromEntries(
      BOARD_COLS.map((col) => [
        col.id,
        filtered.filter((card) => displayColumn(card) === col.id),
      ]),
    ) as Record<string, BoardCard[]>;
  }, [board.cards, query]);

  const stats = BOARD_COLS.filter((c) => c.id !== "out" && c.id !== "inbox").map((col) => ({
    ...col,
    count: board.cards.filter((c) => displayColumn(c) === col.id).length,
  }));

  const priorityStats = (["P0", "P1", "P2"] as const).map((pri) => ({
    id: pri,
    count: board.cards.filter((c) => c.priority === pri).length,
  }));

  return (
    <div className="esteira">
      <div className="esteira-stats">
        {stats.map((col) => (
          <div key={col.id} className="esteira-stat">
            <strong>{col.count}</strong>
            <span>{col.label}</span>
          </div>
        ))}
      </div>
      <p className="esteira-priority-line" title="Critério: audiência BR × gap de SERP × diferencial TSC">
        Prioridade:{" "}
        {priorityStats.map((item, i) => (
          <span key={item.id}>
            {i > 0 ? " · " : null}
            <strong>{item.count}</strong> {item.id}
          </span>
        ))}
      </p>

      <div className="esteira-toolbar">
        <label>
          <span className="sr-only">Filtrar</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar # ou slug…"
          />
        </label>
        <button type="button" className="esteira-refresh" onClick={() => router.refresh()}>
          Atualizar
        </button>
      </div>

      <div className="esteira-board">
        {BOARD_COLS.map((col) => (
          <section key={col.id} className="esteira-col" aria-label={col.label}>
            <header>
              <h2>
                {col.label} <em>{lists[col.id]?.length ?? 0}</em>
              </h2>
              <p>{col.hint}</p>
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
