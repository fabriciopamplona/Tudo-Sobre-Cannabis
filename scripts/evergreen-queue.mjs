#!/usr/bin/env node
/**
 * Status / sync da fila evergreen (2/dia úteis 08h·13h BRT).
 *   node scripts/evergreen-queue.mjs
 *   node scripts/evergreen-queue.mjs --next
 *   node scripts/evergreen-queue.mjs --sync   # grava scheduled_for nos meta → coluna Agendado
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeRunMeta, collectBoard, root } from "../agents/board.mjs";

const QUEUE = path.join(root, "content/runs/_batch/evergreen-publish-queue.json");
const QUEUE_MD = path.join(root, "content/runs/_batch/EVERGREEN-PUBLISH-QUEUE.md");

function loadQueue() {
  return JSON.parse(readFileSync(QUEUE, "utf8"));
}

function rewriteMd(q) {
  const lines = [
    "# Fila de publicação evergreen",
    "",
    `Atualizada: ${new Date().toISOString()}`,
    `Fuso: ${q.timezone} · 2/dia úteis · 08:00 e 13:00 · processo: docs/EVERGREEN-PUBLISH.md`,
    `OK de estilo: **FAP-proxy** (agente) · assinatura publish: **${q.reviewer_signature}**`,
    "",
    "| Slot | Data | BRT | # | FAP | Status | Título |",
    "|---:|---|---|---:|---:|---|---|",
  ];
  for (const s of q.slots || []) {
    const flag = s.needs_fap_polish ? " ⚠" : "";
    lines.push(
      `| ${s.slot} | ${s.date} | ${s.time_brt} | ${s.id} | ${s.fap_score ?? "—"} | ${s.status}${flag} | ${String(s.title || "").replace(/\|/g, "/")} |`,
    );
  }
  lines.push("", "⚠ = `needs_fap_polish` (polir antes do slot).", "");
  writeFileSync(QUEUE_MD, `${lines.join("\n")}\n`);
}

async function syncToBoard() {
  const q = loadQueue();
  let n = 0;
  for (const slot of q.slots || []) {
    if (!["queued", "ready", "scheduled"].includes(slot.status)) continue;
    const runDir = path.join(root, "content/runs", slot.slug);
    if (!existsSync(runDir)) {
      console.warn(`#${slot.id} sem run ${slot.slug}`);
      continue;
    }
    await writeRunMeta(
      runDir,
      {
        slug: slot.slug,
        id: slot.id,
        scheduled_for: slot.scheduled_for,
      },
      root,
    );
    slot.status = "scheduled";
    n += 1;
  }
  q.updated_at = new Date().toISOString();
  writeFileSync(QUEUE, `${JSON.stringify(q, null, 2)}\n`);
  rewriteMd(q);
  const board = await collectBoard(root, { write: false });
  const scheduled = board.cards.filter((c) => c.column === "scheduled").length;
  console.log(`Sync: ${n} metas com scheduled_for · coluna Agendado no quadro: ${scheduled}`);
}

function printStatus(nextOnly) {
  const q = loadQueue();
  const now = Date.now();
  const pending = (q.slots || []).filter((s) =>
    ["queued", "ready", "scheduled"].includes(s.status),
  );
  const upcoming = pending
    .filter((s) => new Date(s.scheduled_for).getTime() >= now - 60 * 60 * 1000)
    .sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for));

  if (nextOnly) {
    const n = upcoming[0] || pending[0];
    if (!n) {
      console.log("Fila evergreen vazia.");
      return;
    }
    console.log(
      `Próximo: #${n.id} ${n.slug} · ${n.date} ${n.time_brt} BRT · FAP ${n.fap_score ?? "—"} · polish=${n.needs_fap_polish ? "sim" : "não"}`,
    );
    return;
  }

  console.log(`# Evergreen queue · ${q.timezone} · ${q.cadence.per_weekday}/dia · OK ${q.ok_mode}`);
  console.log(
    `Slots: ${q.slots.length} · pending: ${pending.length} · published: ${(q.slots || []).filter((s) => s.status === "published").length}`,
  );
  console.log("");
  for (const s of (upcoming.length ? upcoming : pending).slice(0, 14)) {
    const flag = s.needs_fap_polish ? " ⚠" : "";
    console.log(
      `${s.date} ${s.time_brt}  #${String(s.id).padStart(3)}  FAP ${String(s.fap_score ?? "—").padEnd(4)}  ${s.status}${flag}  ${String(s.title).slice(0, 56)}`,
    );
  }
  if (pending.length > 14) console.log(`… +${pending.length - 14} na fila`);
}

const nextOnly = process.argv.includes("--next");
const sync = process.argv.includes("--sync");
if (sync) {
  syncToBoard().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  printStatus(nextOnly);
}
