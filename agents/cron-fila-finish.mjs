#!/usr/bin/env node
/**
 * Cron-Fila — fase B: lote final (ilustras + SERP real).
 * Usado por cron-fila-tick.mjs (--finish-pending / --sync) e pelo loop.
 *
 * Exporta helpers; também: node agents/cron-fila-finish.mjs --write-queue
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { collectBoard, nowIso, root } from "./board.mjs";

const STATE_PATH = path.join(root, "content/runs/_batch/cron-fila-state.json");
const QUEUE_PATH = path.join(root, "content/runs/_batch/cron-fila-finish-queue.md");

export function pieceGateReady(card) {
  if (!card) return false;
  const t = card.ticks || {};
  return Boolean(
    t.illustrations_render &&
      t.serp_locked &&
      t.gate_prep &&
      card.verdict === "APROVAR",
  );
}

export function pieceNeedsFinish(card) {
  if (!card) return true;
  return !pieceGateReady(card);
}

/**
 * Atualiza history[].phase e pendingFinish a partir do quadro real.
 */
export function syncPhasesFromBoard(state, board) {
  const byId = new Map(board.cards.map((c) => [c.id, c]));
  const pending = [];
  for (const h of state.history || []) {
    const card = byId.get(h.id);
    if (pieceGateReady(card)) {
      h.phase = "gate_ready";
      h.syncedAt = nowIso();
    } else if (h.agentOk !== false) {
      h.phase = "partial";
      pending.push(h.id);
    }
  }
  // ids em pendingFinish que ainda não estão no history (legado)
  for (const id of state.pendingFinish || []) {
    if (!pending.includes(id) && !pieceGateReady(byId.get(id))) pending.push(id);
  }
  state.pendingFinish = [...new Set(pending)];
  if (state.ticksDone >= state.maxTicks) {
    state.status = state.pendingFinish.length ? "awaiting_finish" : "done";
    state.finishBatch = {
      status: state.pendingFinish.length ? "pending" : "done",
      updatedAt: nowIso(),
    };
  }
  return state;
}

export async function buildFinishQueue(state, board, repoRoot = root) {
  const byId = new Map(board.cards.map((c) => [c.id, c]));
  const ids = [...new Set(state.pendingFinish || [])];
  const rows = [];
  for (const id of ids) {
    const card = byId.get(id);
    const hist = (state.history || []).find((h) => h.id === id);
    const t = card?.ticks || {};
    rows.push({
      id,
      slug: card?.slug || hist?.slug || "?",
      title: card?.title || hist?.title || "",
      verdict: card?.verdict || "pending",
      illustrations_spec: Boolean(t.illustrations_spec),
      illustrations_render: Boolean(t.illustrations_render),
      serp_locked: Boolean(t.serp_locked),
      seo: card?.scores?.seo,
      needs: [
        !t.illustrations_spec ? "illustrations_spec" : null,
        !t.illustrations_render ? "illustrations_render" : null,
        !t.serp_locked ? "serp_real_PRONTO" : null,
        card?.verdict !== "APROVAR" ? "scores/gate APROVAR" : null,
      ].filter(Boolean),
    });
  }

  const md = `# Cron-Fila — fila de acabamento (fase B)

Gerado: ${nowIso()}

Ilustras e SERP real rodam **aqui**, depois de todos os ticks de texto.
Não assine \`reviewedBy\` / não publique neste passo.

## Peças

${
  rows.length
    ? rows
        .map(
          (r) =>
            `### #${r.id} \`${r.slug}\`
- veredicto: ${r.verdict} · seo: ${r.seo ?? "—"}
- spec: ${r.illustrations_spec ? "ok" : "falta"} · render: ${r.illustrations_render ? "ok" : "falta"} · SERP: ${r.serp_locked ? "PRONTO" : "falta"}
- fazer: ${r.needs.length ? r.needs.join(", ") : "nada (já gate_ready)"}
`,
        )
        .join("\n")
    : "_Nenhuma peça pendente._\n"
}

## Protocolo do agente (Cursor, Mac acordado)

Para cada #id acima, nesta ordem:

1. Se falta spec: \`npm run agent -- --id N --from illustrator-spec\` (para no render humanRequired).
2. GenerateImage + QC IMAGE-STYLE + \`cwebp\` → \`web/public/illustrations/<slug>/\` + inserir Figura/!\[] + \`image:\` no candidato.
3. WebSearch real da keyword → reescrever \`07-serp-review.md\` com **Veredicto SEO: PRONTO**; remover links \`pending\` do corpo.
4. \`npm run esteira:audit -- --ids N --phase finish\` (ou all se seo < 8,5).
5. Ao terminar o lote: \`npm run esteira:cron-fila -- --sync\`

## Depois (publicação)

Só com revisor humano explícito:

\`\`\`bash
npm run esteira:cron-fila:publish -- --reviewer "Dr. Fabricio Pamplona"
\`\`\`
`;

  mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
  writeFileSync(QUEUE_PATH, md);
  return { ids, rows, path: QUEUE_PATH, md };
}

export function printFinishWake(queue) {
  const prompt = [
    "Cron-Fila finish_batch (fase B — ilustras no final).",
    "1) Leia content/runs/_batch/cron-fila-finish-queue.md e CRON-FILA.md.",
    `2) Complete ilustras + SERP real para: ${queue.ids.map((id) => `#${id}`).join(", ") || "(vazio)"}.`,
    "3) Rode npm run esteira:cron-fila -- --sync.",
    "4) NÃO assine reviewedBy e NÃO publique (publish só com --reviewer).",
    "5) Atualize o usuário com status de cada #id.",
  ].join(" ");
  console.log(
    "AGENT_LOOP_TICK_cron_fila " +
      JSON.stringify({
        action: "finish_batch",
        prompt,
        ids: queue.ids,
        queue: path.relative(root, QUEUE_PATH),
      }),
  );
  console.log(`\nFila escrita em ${path.relative(root, QUEUE_PATH)}`);
}

async function cli() {
  const state = JSON.parse(readFileSync(STATE_PATH, "utf8"));
  const board = await collectBoard(root, { write: false });
  const synced = syncPhasesFromBoard(state, board);
  writeFileSync(STATE_PATH, `${JSON.stringify(synced, null, 2)}\n`);
  const queue = await buildFinishQueue(synced, board);
  printFinishWake(queue);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  cli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
