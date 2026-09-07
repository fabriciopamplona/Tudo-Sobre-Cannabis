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

type ViewMode = "board" | "list";
type SortKey = "id" | "priority" | "column" | "seo";
type BulkAction = "run" | "enqueue";

const VIEW_STORAGE_KEY = "esteira.view";
const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
const COLUMN_RANK = BOARD_COLS.map((c) => c.id);

function matchesQuery(card: BoardCard, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [`#${card.id}`, card.priority, card.title, card.slug, card.keyword]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function columnLabel(id: string) {
  return BOARD_COLS.find((c) => c.id === id)?.label || id;
}

function sortCards(cards: BoardCard[], sortKey: SortKey, sortDir: "asc" | "desc") {
  const dir = sortDir === "asc" ? 1 : -1;
  return [...cards].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "id") cmp = a.id - b.id;
    else if (sortKey === "priority") {
      cmp = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    } else if (sortKey === "column") {
      cmp = COLUMN_RANK.indexOf(displayColumn(a)) - COLUMN_RANK.indexOf(displayColumn(b));
    } else if (sortKey === "seo") {
      cmp = (a.scores?.seo ?? -1) - (b.scores?.seo ?? -1);
    }
    if (cmp === 0) cmp = a.id - b.id;
    return cmp * dir;
  });
}

function bulkableAction(card: BoardCard, action: BulkAction) {
  return (card.actions || []).find((item) => item.id === action && !item.disabled) || null;
}

function EsteiraListView({
  cards,
  query,
  onDone,
}: {
  cards: BoardCard[];
  query: string;
  onDone: () => void;
}) {
  const [statusTab, setStatusTab] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>("run");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNote, setBulkNote] = useState("");

  const searched = useMemo(() => cards.filter((c) => matchesQuery(c, query)), [cards, query]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: searched.length };
    for (const col of BOARD_COLS) counts[col.id] = 0;
    for (const card of searched) {
      const col = displayColumn(card);
      counts[col] = (counts[col] || 0) + 1;
    }
    return counts;
  }, [searched]);

  const rows = useMemo(() => {
    const filtered =
      statusTab === "all" ? searched : searched.filter((c) => displayColumn(c) === statusTab);
    return sortCards(filtered, sortKey, sortDir);
  }, [searched, statusTab, sortKey, sortDir]);

  useEffect(() => {
    setPicked((prev) => {
      const ids = new Set(rows.map((r) => r.id));
      const next = new Set<number>();
      for (const id of prev) if (ids.has(id)) next.add(id);
      return next;
    });
  }, [rows]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "id" || key === "priority" ? "asc" : "desc");
    }
  }

  function toggleAll(checked: boolean) {
    setPicked(checked ? new Set(rows.map((r) => r.id)) : new Set());
  }

  function toggleOne(id: number, checked: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function applyBulk() {
    const selected = rows.filter((c) => picked.has(c.id));
    if (!selected.length) return;
    const eligible = selected.filter((c) => bulkableAction(c, bulkAction));
    if (!eligible.length) {
      setBulkNote(`Nenhuma das ${selected.length} peças aceita essa ação agora.`);
      return;
    }
    if (
      !window.confirm(
        `Aplicar “${bulkAction === "run" ? "Continuar/Rodar esteira" : "Devolver/Mandar à fila"}” em ${eligible.length} peça(s)?`,
      )
    ) {
      return;
    }
    setBulkBusy(true);
    setBulkNote("");
    let ok = 0;
    const errors: string[] = [];
    for (const card of eligible) {
      try {
        const res = await fetch("/api/esteira", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: card.id,
            action: bulkAction,
            reviewer: GATE_DEFAULTS.reviewer,
            credential: GATE_DEFAULTS.credential,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (data.ok) ok += 1;
        else errors.push(`#${card.id}: ${data.error || "falhou"}`);
      } catch (err) {
        errors.push(`#${card.id}: ${err instanceof Error ? err.message : "rede"}`);
      }
    }
    setBulkBusy(false);
    setBulkNote(
      errors.length
        ? `${ok} ok · ${errors.length} erro(s): ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "…" : ""}`
        : `${ok} peça(s) ok.`,
    );
    setPicked(new Set());
    onDone();
  }

  const allChecked = rows.length > 0 && rows.every((r) => picked.has(r.id));
  const someChecked = picked.size > 0 && !allChecked;

  return (
    <div className="esteira-list">
      <div className="esteira-list-tabs" role="tablist" aria-label="Filtrar por coluna">
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === "all"}
          className={statusTab === "all" ? "is-active" : ""}
          onClick={() => setStatusTab("all")}
        >
          Todos <em>{tabCounts.all}</em>
        </button>
        {BOARD_COLS.map((col) => (
          <button
            key={col.id}
            type="button"
            role="tab"
            aria-selected={statusTab === col.id}
            className={statusTab === col.id ? "is-active" : ""}
            onClick={() => setStatusTab(col.id)}
          >
            {col.label} <em>{tabCounts[col.id] || 0}</em>
          </button>
        ))}
      </div>

      {picked.size > 0 ? (
        <div className="esteira-list-bulk">
          <span>
            <strong>{picked.size}</strong> selecionado{picked.size === 1 ? "" : "s"}
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as BulkAction)}
            aria-label="Ação em massa"
            disabled={bulkBusy}
          >
            <option value="run">Continuar / Rodar esteira</option>
            <option value="enqueue">Devolver / Mandar à fila</option>
          </select>
          <button type="button" className="esteira-refresh" disabled={bulkBusy} onClick={applyBulk}>
            {bulkBusy ? "Aplicando…" : "Aplicar"}
          </button>
          <button
            type="button"
            className="esteira-list-bulk-clear"
            disabled={bulkBusy}
            onClick={() => setPicked(new Set())}
          >
            Limpar
          </button>
          {bulkNote ? <p className="esteira-list-bulk-note">{bulkNote}</p> : null}
        </div>
      ) : bulkNote ? (
        <p className="esteira-list-bulk-note is-solo">{bulkNote}</p>
      ) : null}

      <div className="esteira-list-scroll">
        <table className="esteira-list-table">
          <thead>
            <tr>
              <th className="esteira-list-check">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="Selecionar todas as linhas visíveis"
                />
              </th>
              <th>
                <button type="button" className="esteira-list-sort" onClick={() => toggleSort("id")}>
                  # {sortKey === "id" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th>Título</th>
              <th>
                <button type="button" className="esteira-list-sort" onClick={() => toggleSort("column")}>
                  Coluna {sortKey === "column" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th>
                <button type="button" className="esteira-list-sort" onClick={() => toggleSort("priority")}>
                  P {sortKey === "priority" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th>Keyword</th>
              <th>
                <button type="button" className="esteira-list-sort" onClick={() => toggleSort("seo")}>
                  Scores {sortKey === "seo" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th>Veredicto</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="esteira-list-empty">
                  Nenhuma peça neste filtro.
                </td>
              </tr>
            ) : (
              rows.map((card) => {
                const col = displayColumn(card);
                const canRead = Boolean(
                  card.ticks?.draft ||
                    card.ticks?.humanized ||
                    card.ticks?.candidate ||
                    card.column === "published",
                );
                return (
                  <tr
                    key={card.id}
                    id={`list-p${card.id}`}
                    className={`${card.running ? "is-running" : ""} ${card.verdict === "BLOQUEAR" ? "is-block" : ""} ${card.verdict === "APROVAR" ? "is-ok" : ""}`}
                  >
                    <td className="esteira-list-check">
                      <input
                        type="checkbox"
                        checked={picked.has(card.id)}
                        onChange={(e) => toggleOne(card.id, e.target.checked)}
                        aria-label={`Selecionar #${card.id}`}
                      />
                    </td>
                    <td className="esteira-list-id">#{card.id}</td>
                    <td className="esteira-list-title">
                      {canRead ? (
                        <a href={`/esteira/${card.id}`}>{card.title}</a>
                      ) : (
                        <span>{card.title}</span>
                      )}
                      <span className="esteira-list-slug">{card.slug}</span>
                    </td>
                    <td>
                      <span className="esteira-list-col">{columnLabel(col)}</span>
                      {card.running ? <span className="esteira-list-running">rodando…</span> : null}
                    </td>
                    <td>
                      {card.priority ? (
                        <span className={`esteira-pri is-${card.priority.toLowerCase()}`}>{card.priority}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="esteira-list-kw">
                      {card.keyword && card.keyword !== "(depois)" ? card.keyword : "—"}
                    </td>
                    <td className="esteira-list-scores">
                      <span title="Factual">F{card.scores?.factual ?? "—"}</span>
                      <span title="Editorial">E{card.scores?.editorial ?? "—"}</span>
                      <span title="SEO">S{card.scores?.seo ?? "—"}</span>
                    </td>
                    <td className="esteira-list-verdict">{card.verdict && card.verdict !== "pending" ? card.verdict : "—"}</td>
                    <td className="esteira-list-actions">
                      <EsteiraActions card={card} onDone={onDone} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EsteiraBoard({ board }: { board: Board }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("board");
  const running = board.cards.some((card) => card.running);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === "board" || saved === "list") setView(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function setViewPersist(next: ViewMode) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

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
      document.getElementById(view === "list" ? `list-p${card.id}` : `p${card.id}`)?.scrollIntoView({
        block: "center",
      });
    });
  }, [board, view]);

  const lists = useMemo(() => {
    const filtered = board.cards.filter((card) => matchesQuery(card, query));
    return Object.fromEntries(
      BOARD_COLS.map((col) => [
        col.id,
        filtered
          .filter((card) => displayColumn(card) === col.id)
          .sort((a, b) => a.id - b.id),
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
        <div className="esteira-view-toggle" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            className={view === "board" ? "is-active" : ""}
            aria-pressed={view === "board"}
            onClick={() => setViewPersist("board")}
          >
            Quadro
          </button>
          <button
            type="button"
            className={view === "list" ? "is-active" : ""}
            aria-pressed={view === "list"}
            onClick={() => setViewPersist("list")}
          >
            Lista
          </button>
        </div>
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

      {view === "list" ? (
        <EsteiraListView cards={board.cards} query={query} onDone={() => router.refresh()} />
      ) : (
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
      )}
    </div>
  );
}
