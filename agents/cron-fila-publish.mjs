#!/usr/bin/env node
/**
 * Publica em lote peças Cron-Fila com phase=gate_ready.
 * Exige --reviewer (OK humano). Nunca inventa reviewedBy.
 *
 *   npm run esteira:cron-fila:publish -- --reviewer "Dr. Fabricio Pamplona"
 *   npm run esteira:cron-fila:publish -- --reviewer "…" --ids 61,62
 *   npm run esteira:cron-fila:publish -- --dry-run --reviewer "…"
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performAction } from "./actions.mjs";
import { collectBoard, nowIso, root } from "./board.mjs";
import { pieceGateReady, syncPhasesFromBoard } from "./cron-fila-finish.mjs";

const STATE_PATH = path.join(root, "content/runs/_batch/cron-fila-state.json");

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

/** Aceita `--reviewer Dr. Nome Sobrenome` mesmo se o shell/npm quebrar as aspas. */
function argRest(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return "";
  const parts = [];
  for (let j = i + 1; j < process.argv.length; j++) {
    if (String(process.argv[j]).startsWith("--")) break;
    parts.push(process.argv[j]);
  }
  return parts.join(" ").trim();
}

async function main() {
  const reviewer = argRest("reviewer") || arg("reviewer").trim();
  const dry = hasFlag("dry-run");
  const idsArg = arg("ids");
  if (!reviewer) {
    console.error(
      'Obrigatório: --reviewer "Nome do humano". Modelos não assinam reviewedBy.',
    );
    process.exit(1);
  }
  if (!existsSync(STATE_PATH)) {
    console.error("Sem cron-fila-state.json");
    process.exit(1);
  }

  let state = JSON.parse(readFileSync(STATE_PATH, "utf8"));
  const board = await collectBoard(root, { write: false });
  state = syncPhasesFromBoard(state, board);
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);

  const byId = new Map(board.cards.map((c) => [c.id, c]));
  let ids = idsArg
    ? idsArg.split(",").map((s) => Number(s.trim())).filter(Boolean)
    : (state.history || []).filter((h) => h.phase === "gate_ready").map((h) => h.id);

  ids = [...new Set(ids)];
  if (!ids.length) {
    console.log("Nenhuma peça gate_ready para publicar.");
    process.exit(0);
  }

  const results = [];
  for (const id of ids) {
    const card = byId.get(id);
    if (!pieceGateReady(card)) {
      results.push({ id, ok: false, error: "ainda não gate_ready (ilustras/SERP/APROVAR)" });
      continue;
    }
    if (card.column === "published") {
      results.push({ id, ok: true, skipped: true, message: "já published" });
      continue;
    }
    if (dry) {
      results.push({ id, ok: true, dry: true, slug: card.slug });
      continue;
    }
    const out = await performAction(
      { id, action: "publish", reviewer, credential: arg("credential") || undefined },
      root,
    );
    results.push({ id, slug: card.slug, ...out });
  }

  console.log(`\n# Cron-Fila publish (${dry ? "dry-run" : "live"}) · ${nowIso()}`);
  for (const r of results) {
    const mark = r.ok ? "ok" : "fail";
    console.log(
      `#${r.id} ${mark}${r.skipped ? " (skip)" : ""}${r.dry ? " (dry)" : ""} — ${r.message || r.error || r.slug || ""}`,
    );
  }
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
