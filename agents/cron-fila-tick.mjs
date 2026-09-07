#!/usr/bin/env node
/**
 * Cron-Fila — fase A (headless): 1º item da Fila → texto até seo-editor + audit/finish.
 * Ilustras + SERP real ficam para o lote final (`--finish-pending`).
 *
 *   npm run esteira:cron-fila
 *   npm run esteira:cron-fila -- --finish
 *   npm run esteira:cron-fila -- --status
 *   npm run esteira:cron-fila -- --sync
 *   npm run esteira:cron-fila -- --finish-pending
 *   npm run esteira:cron-fila -- --dry-run
 *   npm run esteira:cron-fila -- --reset --max-ticks 5
 *
 * Nunca assina reviewedBy. Publish: esteira:cron-fila:publish -- --reviewer "…"
 */
import { spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectBoard, nowIso, root } from "./board.mjs";
import {
  buildFinishQueue,
  printFinishWake,
  syncPhasesFromBoard,
} from "./cron-fila-finish.mjs";

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2, P3: 3 };
const STATE_PATH = path.join(root, "content/runs/_batch/cron-fila-state.json");
const LOG_PATH = path.join(root, "content/runs/_batch/cron-fila.log");
const LOOP_PID_PATH = path.join(root, "content/runs/_batch/cron-fila-loop.pid");
const TICK_PID_PATH = path.join(root, "content/runs/_batch/cron-fila-tick.pid");

function acquireTickPid() {
  mkdirSync(path.dirname(TICK_PID_PATH), { recursive: true });
  if (existsSync(TICK_PID_PATH)) {
    const old = Number(readFileSync(TICK_PID_PATH, "utf8").trim());
    if (old) {
      try {
        process.kill(old, 0);
        return { ok: false, pid: old };
      } catch {
        /* stale */
      }
    }
  }
  writeFileSync(TICK_PID_PATH, `${process.pid}\n`);
  return { ok: true };
}

function releaseTickPid() {
  try {
    if (!existsSync(TICK_PID_PATH)) return;
    const cur = Number(readFileSync(TICK_PID_PATH, "utf8").trim());
    if (cur === process.pid) unlinkSync(TICK_PID_PATH);
  } catch {
    /* ignore */
  }
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function log(line) {
  const text = `[${nowIso()}] ${line}`;
  console.log(line);
  mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  appendFileSync(LOG_PATH, `${text}\n`);
}

function emptyState(maxTicks) {
  return {
    purpose: "cron-fila",
    version: 2,
    maxTicks,
    ticksDone: 0,
    startedAt: nowIso(),
    history: [],
    pendingFinish: [],
    finishBatch: { status: "idle", updatedAt: null },
    status: "armed",
    lock: null,
  };
}

function loadState() {
  const maxTicks = Number(arg("max-ticks", "5")) || 5;
  if (!existsSync(STATE_PATH)) return emptyState(maxTicks);
  const state = JSON.parse(readFileSync(STATE_PATH, "utf8"));
  if (Number(arg("max-ticks", "")) > 0) state.maxTicks = Number(arg("max-ticks"));
  if (!Array.isArray(state.pendingFinish)) state.pendingFinish = [];
  if (!state.finishBatch) state.finishBatch = { status: "idle", updatedAt: null };
  if (!state.version) state.version = 2;
  for (const h of state.history || []) {
    if (!h.phase) h.phase = "partial";
  }
  return state;
}

function saveState(state) {
  mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function runNode(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (c) => {
      const s = c.toString();
      out += s;
      process.stdout.write(s);
    });
    child.stderr.on("data", (c) => {
      const s = c.toString();
      out += s;
      process.stderr.write(s);
    });
    child.on("close", (code) => resolve({ ok: code === 0, code: code ?? 1, out }));
    child.on("error", (err) => resolve({ ok: false, code: 1, out: String(err) }));
  });
}

function firstQueued(board) {
  return [...board.cards]
    .filter((c) => c.column === "queued")
    .sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || a.id - b.id,
    )[0];
}

function printStatus(state) {
  const pending = state.pendingFinish || [];
  const ready = (state.history || []).filter((h) => h.phase === "gate_ready");
  const partial = (state.history || []).filter((h) => h.phase === "partial");
  console.log(`Cron-Fila status=${state.status} · ticks ${state.ticksDone}/${state.maxTicks}`);
  console.log(`  finishBatch: ${state.finishBatch?.status || "idle"}`);
  console.log(`  partial: ${partial.map((h) => `#${h.id}`).join(", ") || "—"}`);
  console.log(`  gate_ready: ${ready.map((h) => `#${h.id}`).join(", ") || "—"}`);
  console.log(`  pendingFinish ids: ${pending.length ? pending.join(", ") : "—"}`);
  if (existsSync(LOOP_PID_PATH)) {
    const pid = Number(readFileSync(LOOP_PID_PATH, "utf8").trim());
    let alive = false;
    try {
      process.kill(pid, 0);
      alive = true;
    } catch {
      /* stale */
    }
    console.log(`  loop pidfile: ${pid} (${alive ? "alive" : "stale"})`);
  } else {
    console.log("  loop pidfile: —");
  }
}

async function main() {
  const dry = hasFlag("dry-run");
  const finish = hasFlag("finish");
  const reset = hasFlag("reset");
  const statusOnly = hasFlag("status");
  const syncOnly = hasFlag("sync");
  const finishPending = hasFlag("finish-pending");

  let state = reset ? emptyState(Number(arg("max-ticks", "5")) || 5) : loadState();

  if (reset) {
    saveState(state);
    log(`Cron-Fila reset: 0/${state.maxTicks} ticks (v2: imagens no lote final).`);
  }

  if (statusOnly) {
    printStatus(state);
    process.exit(0);
  }

  if (syncOnly || finishPending) {
    const board = await collectBoard(root, { write: false });
    state = syncPhasesFromBoard(state, board);
    if (finishPending) {
      state.finishBatch = { status: "in_progress", updatedAt: nowIso() };
      saveState(state);
      const queue = await buildFinishQueue(state, board, root);
      printFinishWake(queue);
      if (!queue.ids.length) {
        state.finishBatch = { status: "done", updatedAt: nowIso() };
        state.status = state.ticksDone >= state.maxTicks ? "done" : "armed";
        saveState(state);
        log("finish-pending: nada na fila de acabamento.");
      } else {
        saveState(state);
        log(
          `finish-pending: ${queue.ids.length} peça(s) — #${queue.ids.join(", #")} (ilustras + SERP real)`,
        );
      }
    } else {
      saveState(state);
      printStatus(state);
      log("sync: fases atualizadas a partir do quadro.");
    }
    process.exit(0);
  }

  if (state.ticksDone >= state.maxTicks) {
    if ((state.pendingFinish || []).length > 0) {
      state.status = "awaiting_finish";
      saveState(state);
      log(
        `Ticks de texto esgotados (${state.ticksDone}/${state.maxTicks}). Rode: npm run esteira:cron-fila -- --finish-pending`,
      );
      printFinishWake(await buildFinishQueue(state, await collectBoard(root, { write: false }), root));
      process.exit(0);
    }
    state.status = "done";
    saveState(state);
    log(`Cron-Fila encerrado: ${state.ticksDone}/${state.maxTicks} ticks. Sem novo disparo.`);
    process.exit(0);
  }

  if (state.lock && state.lock.pid) {
    try {
      process.kill(state.lock.pid, 0);
      log(`pula: tick anterior ainda rodando (pid ${state.lock.pid}, #${state.lock.id})`);
      process.exit(0);
    } catch {
      /* lock stale */
    }
  }

  const board = await collectBoard(root, { write: !dry });
  const card = firstQueued(board);
  if (!card) {
    state.status = (state.pendingFinish || []).length ? "awaiting_finish" : "empty";
    saveState(state);
    log(
      state.status === "awaiting_finish"
        ? "Fila vazia — falta acabamento. npm run esteira:cron-fila -- --finish-pending"
        : "Fila vazia — nada a processar neste tick.",
    );
    process.exit(0);
  }

  const tick = state.ticksDone + 1;
  log(
    `Cron-Fila tick ${tick}/${state.maxTicks} → #${card.id} ${card.title} (${card.priority || "—"}) [até seo-editor; ilustras no lote final]`,
  );

  if (dry) {
    log(`dry-run: não executa agent/audit para #${card.id}`);
    process.exit(0);
  }

  const pidLock = acquireTickPid();
  if (!pidLock.ok) {
    log(`pula: outro tick headless ativo (pid ${pidLock.pid})`);
    process.exit(0);
  }

  state.lock = { pid: process.pid, id: card.id, at: nowIso() };
  state.status = "running";
  saveState(state);

  try {
  // Fase A: texto só — ilustras (spec+render) no finish-pending
  const agentArgs = [
    path.join(root, "agents/run.mjs"),
    "--id",
    String(card.id),
    "--until",
    "seo-editor",
  ];
  const agent = await runNode(agentArgs);
  log(agent.ok ? `ok agent #${card.id}` : `falha agent #${card.id} exit=${agent.code}`);

  let audit = { ok: true, code: 0, skipped: true };
  if (agent.ok && finish) {
    audit = await runNode([
      path.join(root, "agents/audit-gate.mjs"),
      "--ids",
      String(card.id),
      "--phase",
      "all",
    ]);
    log(audit.ok ? `ok audit-all #${card.id}` : `falha audit-all #${card.id} exit=${audit.code}`);
    if (audit.ok) {
      const fin = await runNode([
        path.join(root, "agents/audit-gate.mjs"),
        "--ids",
        String(card.id),
        "--phase",
        "finish",
      ]);
      log(fin.ok ? `ok audit-finish #${card.id}` : `falha audit-finish #${card.id} exit=${fin.code}`);
      audit = fin;
    }
  }

  state.lock = null;

  if (!agent.ok) {
    state.status = "armed";
    saveState(state);
    log(`Tick ${tick} NÃO contado (agent fail). Próximo disparo pode retentar.`);
    process.exit(1);
  }

  state.ticksDone = tick;
  const entry = {
    tick,
    at: nowIso(),
    id: card.id,
    slug: card.slug,
    title: card.title,
    phase: "partial",
    agentOk: true,
    auditOk: audit.ok,
    auditSkipped: Boolean(audit.skipped),
  };
  state.history.push(entry);
  if (!state.pendingFinish.includes(card.id)) state.pendingFinish.push(card.id);

  if (tick >= state.maxTicks) {
    state.status = "awaiting_finish";
    state.finishBatch = { status: "pending", updatedAt: nowIso() };
  } else {
    state.status = "armed";
  }
  saveState(state);

  const summary = {
    tick,
    maxTicks: state.maxTicks,
    id: card.id,
    slug: card.slug,
    phase: "partial",
    agentOk: true,
    auditOk: audit.ok,
    next:
      state.status === "awaiting_finish"
        ? "npm run esteira:cron-fila -- --finish-pending"
        : "aguardar próxima hora cheia (só texto; sem ilustras)",
    note: "Ilustras + SERP real no lote final (--finish-pending). Sem reviewedBy.",
  };
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  await writeFile(
    path.join(root, "content/runs/_batch/cron-fila-last.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  log(
    `Tick ${tick}/${state.maxTicks} → phase=partial · status=${state.status} · #${card.id}`,
  );

  if (state.status === "awaiting_finish") {
    console.log(
      "\nAGENT_LOOP_TICK_cron_fila " +
        JSON.stringify({
          action: "finish_batch",
          prompt:
            "Cron-Fila: ticks de texto esgotados. Rode `npm run esteira:cron-fila -- --finish-pending` e complete ilustras + SERP real de TODAS as peças partial. Depois `npm run esteira:cron-fila -- --sync`. NÃO assine reviewedBy.",
          ids: state.pendingFinish,
        }),
    );
  }
  } finally {
    releaseTickPid();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
