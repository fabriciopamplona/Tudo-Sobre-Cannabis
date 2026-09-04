"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/Icons";
import { EsteiraActions } from "@/components/EsteiraBoard";
import { Markdown } from "@/lib/markdown";
import { formatDate, pillarMeta } from "@/lib/site";
import type { Locus, Preview } from "@/lib/board";

const KINDS: { id: Locus["kind"]; label: string }[] = [
  { id: "fato", label: "Fato" },
  { id: "voz", label: "Voz" },
  { id: "norma", label: "Norma" },
  { id: "formato", label: "Formato" },
  { id: "canal", label: "Canal" },
  { id: "corte", label: "Corte" },
];

type Draft = {
  quote: string;
  block: number;
  top: number;
  left: number;
};

function kindLabel(kind: string) {
  return KINDS.find((item) => item.id === kind)?.label || kind;
}

export function ReviewDesk({ preview, startEditing = false }: { preview: Preview; startEditing?: boolean }) {
  const router = useRouter();
  const articleRef = useRef<HTMLElement>(null);
  const editingRef = useRef(false);
  const [loci, setLoci] = useState(preview.loci);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [kind, setKind] = useState("fato");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState<number | null>(null);
  const [editing, setEditing] = useState(startEditing);
  const [editor, setEditor] = useState(preview.editBody || preview.body || "");
  const [saving, setSaving] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const marked = useMemo(() => new Set(loci.map((item) => item.block)), [loci]);
  const dirty = editing && editor !== (preview.editBody || preview.body || "");
  editingRef.current = editing;

  useEffect(() => {
    setLoci(preview.loci);
    if (!editingRef.current) setEditor(preview.editBody || preview.body || "");
  }, [preview.loci, preview.editBody, preview.body]);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!editingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    root.querySelectorAll("[data-block]").forEach((el) => {
      const n = Number(el.getAttribute("data-block"));
      el.classList.toggle("is-marked", marked.has(n));
      el.classList.toggle("is-flash", flash === n);
    });
  }, [marked, flash]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const onUp = () => {
      if (editingRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const quote = sel.toString().replace(/\s+/g, " ").trim();
      if (quote.length < 8) return;
      const node = sel.anchorNode;
      const el = node instanceof Element ? node : node?.parentElement;
      const block = el?.closest("[data-block]");
      if (!block || !root.contains(block)) return;
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const ticketH = 340;
      const ticketW = 360;
      let top = rect.bottom + 8;
      if (top + ticketH > window.innerHeight) top = rect.top - ticketH;
      top = Math.min(Math.max(12, top), window.innerHeight - ticketH);
      setDraft({
        quote,
        block: Number(block.getAttribute("data-block")),
        top,
        left: Math.min(Math.max(16, rect.left), window.innerWidth - ticketW),
      });
      setKind("fato");
      setNote("");
      setError("");
    };
    root.addEventListener("mouseup", onUp);
    return () => root.removeEventListener("mouseup", onUp);
  }, []);

  async function save() {
    if (!draft) return;
    if (!note.trim()) {
      setError("Diga o que precisa mudar.");
      return;
    }
    const res = await fetch("/api/esteira", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: preview.card.id,
        action: "locus",
        kind,
        quote: draft.quote,
        note,
        block: draft.block,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; items?: Locus[] };
    if (!data.ok) {
      setError(data.error || "Não gravou.");
      return;
    }
    setLoci(data.items || []);
    setDraft(null);
    window.getSelection()?.removeAllRanges();
    router.refresh();
  }

  async function remove(locusId: string) {
    const res = await fetch("/api/esteira", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: preview.card.id, action: "locus-remove", locusId }),
    });
    const data = (await res.json()) as { ok?: boolean; items?: Locus[] };
    if (data.ok) setLoci(data.items || []);
    router.refresh();
  }

  function jump(block: number) {
    const el = articleRef.current?.querySelector(`[data-block="${block}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    setFlash(block);
    window.setTimeout(() => setFlash(null), 1200);
  }

  async function applyFormat(op: "unwrap-strong" | "unwrap-em" | "unwrap-heading") {
    if (!draft || formatting) return;
    if (preview.liveEdit && !window.confirm("Isso altera o texto no ar. Continuar?")) return;
    setFormatting(true);
    setError("");
    try {
      const res = await fetch("/api/esteira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: preview.card.id,
          action: "format",
          quote: draft.quote,
          op,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!data.ok) {
        setError(data.error || "Não aplicou o formato.");
        return;
      }
      setSaveNote(data.message || "Formato corrigido.");
      setDraft(null);
      window.getSelection()?.removeAllRanges();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de rede.");
    } finally {
      setFormatting(false);
    }
  }

  async function saveText() {
    if (preview.liveEdit && !window.confirm("Isso altera o texto no ar. Continuar?")) return;
    setSaving(true);
    setError("");
    setSaveNote("");
    try {
      const res = await fetch("/api/esteira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preview.card.id, action: "save", body: editor }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!data.ok) {
        setError(data.error || "Não salvou.");
        return;
      }
      setSaveNote(data.message || "Salvo.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de rede.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (dirty && !window.confirm("Descartar as alterações?")) return;
    setEditor(preview.editBody || preview.body || "");
    setEditing(false);
    setError("");
  }
  const card = { ...preview.card, lociCount: loci.length };
  const pillar = pillarMeta(preview.pillar);

  return (
    <div className="article-exploded review-desk">
      <header className="exploded-header review-bar">
        <Link href="/esteira" className="exploded-back">
          <ArrowLeftIcon /> voltar à esteira
        </Link>
        <p className="review-kicker">
          #{preview.card.id} · {preview.columnLabel}
          {preview.card.verdict !== "pending" ? ` · ${preview.card.verdict}` : ""}
        </p>
        <span className="review-source">{preview.sourceLabel || "Sem texto ainda"}</span>
        {preview.editable ? (
          editing ? (
            <div className="review-edit-ops">
              <button type="button" className="esteira-next-btn" onClick={saveText} disabled={saving}>
                {saving ? "Salvando…" : preview.liveEdit ? "Salvar no ar" : "Salvar"}
              </button>
              <button type="button" className="review-drop" onClick={cancelEdit} disabled={saving}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" className="review-edit-btn" onClick={() => setEditing(true)}>
              Editar texto
            </button>
          )
        ) : null}
      </header>

      <div className="review-split">
        <article ref={articleRef} className="review-page">
          <p className="article-mono exploded-meta">
            <span>{pillar.label}</span>
            {preview.fields.datePublished ? (
              <>
                <span>/</span>
                <span>{formatDate(preview.fields.datePublished)}</span>
              </>
            ) : null}
            {preview.card.keyword ? (
              <>
                <span>/</span>
                <span>{preview.card.keyword}</span>
              </>
            ) : null}
          </p>
          <h1 className="article-display exploded-title">{preview.title}</h1>
          {preview.description ? <p className="exploded-dek">{preview.description}</p> : null}
          {editing ? (
            <label className="review-editor">
              <span className="sr-only">Texto em markdown</span>
              <textarea
                value={editor}
                onChange={(event) => setEditor(event.target.value)}
                spellCheck
              />
            </label>
          ) : preview.body ? (
            <Markdown source={preview.body} className="exploded-prose" annotate />
          ) : (
            <p className="review-empty">Ainda não há texto para ler. Rode a esteira neste número.</p>
          )}
        </article>

        <aside className="review-rail">
          <p className="article-mono exploded-aside-label">Mesa de gate</p>
          <p className="review-help">
            {editing
              ? "Markdown direto no arquivo da peça. Título e metadados ficam; o corpo é o que você vê. Salvar não publica sozinho — salvo se esta já for a versão no ar."
              : "Leia como leitor. Selecione o trecho: aponte o erro, ou corrija negrito/itálico na hora."}
          </p>
          {saveNote ? <p className="esteira-next-note">{saveNote}</p> : null}
          {error && editing ? <p className="esteira-next-err">{error}</p> : null}
          {preview.liveHref ? (
            <p>
              <a href={preview.liveHref}>Versão no ar</a>
            </p>
          ) : null}

          <ol className="review-loci">
            {loci.length ? (
              loci.map((item) => (
                <li key={item.id}>
                  <button type="button" className="review-locus" onClick={() => jump(item.block)}>
                    <span className={`review-kind is-${item.kind}`}>{kindLabel(item.kind)}</span>
                    <q>{item.quote}</q>
                    <span>{item.note}</span>
                  </button>
                  <button type="button" className="review-drop" onClick={() => remove(item.id)}>
                    Tirar
                  </button>
                </li>
              ))
            ) : (
              <li className="review-loci-empty">Nenhum apontamento ainda.</li>
            )}
          </ol>

          {editing ? (
            <p className="review-loci-empty">Salve ou cancele a edição para assinar o gate.</p>
          ) : (
            <EsteiraActions card={card} onDone={() => router.refresh()} />
          )}
        </aside>
      </div>

      {draft && !editing
        ? createPortal(
            <div className="review-ticket" style={{ top: draft.top, left: Math.max(16, draft.left) }}>
          <p className="review-ticket-quote">“{draft.quote}”</p>
          <div className="review-kinds" role="group" aria-label="Tipo do apontamento">
            {KINDS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={kind === item.id ? "is-on" : ""}
                onClick={() => setKind(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="review-format-label">Corrigir agora</p>
          <div className="review-format" role="group" aria-label="Corrigir formatação">
            <button type="button" disabled={formatting} onClick={() => applyFormat("unwrap-strong")}>
              Tirar negrito
            </button>
            <button type="button" disabled={formatting} onClick={() => applyFormat("unwrap-em")}>
              Tirar itálico
            </button>
            <button type="button" disabled={formatting} onClick={() => applyFormat("unwrap-heading")}>
              Virar parágrafo
            </button>
          </div>
          <label>
            <span className="sr-only">O que precisa mudar</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={
                kind === "formato"
                  ? "Ou descreva: heading no lugar de parágrafo, lista que era prosa…"
                  : "O que está errado, e o que o texto deveria fazer."
              }
              rows={3}
              autoFocus
            />
          </label>
          {error ? <p className="esteira-next-err">{error}</p> : null}
          <div className="review-ticket-ops">
            <button type="button" className="esteira-next-btn" onClick={save}>
              Gravar apontamento
            </button>
            <button type="button" className="review-drop" onClick={() => setDraft(null)}>
              Cancelar
            </button>
          </div>
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}
