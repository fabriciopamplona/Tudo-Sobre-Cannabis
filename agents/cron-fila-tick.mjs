#!/usr/bin/env node
/**
 * Um tick do desafio cron-Fila: pega o 1º item da Fila (P0→id) e roda a esteira
 * automática até illustrations_spec (+ audit/SERP/gate-prep se --finish).
 *
 *   npm run esteira:cron-fila
 *   npm run esteira:cron-fila -- --dry-run
 *   npm run esteira:cron-fila -- --finish          # + esteira:audit --phase finish
 *   npm run esteira:cron-fila -- --max-ticks 5
 *
 * Não assina reviewedBy nem publica.
 * illustrations_render é humanRequired — fica para o agente no wake do loop.
 */
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { collectBoard, nowIso, root } from "./board.mjs";

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2, P3: 3 };
const STATE_PATH = path.join(root, "content/runs/_batch/cron-fila-state.json");
const LOG_PATH = path.join(root, "content/runs/_batch/cron-fila.log");

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

function loadState() {
  const maxTicks = Number(arg("max-ticks", "5")) || 5;
  if (!existsSync(STATE_PATH)) {
    return {
      purpose: "cron-fila",
      maxTicks,
      ticksDone: 0,
      startedAt: nowIso(),
      history: [],
      status: "armed",
    };
  }
  const state = JSON.parse(readFileSync(STATE_PATH, "utf8"));
  if (Number(arg("max-ticks", "")) > 0) state.maxTicks = Number(arg("max-ticks"));
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

async function main() {
  const dry = hasFlag("dry-run");
  const finish = hasFlag("finish");
  const reset = hasFlag("reset");
  const state = reset
    ? {
        purpose: "cron-fila",
        maxTicks: Number(arg("max-ticks", "5")) || 5,
        ticksDone: 0,
        startedAt: nowIso(),
        history: [],
        status: "armed",
      }
    : loadState();

  if (reset) {
    saveState(state);
    log(`Cron-Fila reset: 0/${state.maxTicks} ticks.`);
  }

  if (state.ticksDone >= state.maxTicks) {
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
    state.status = "empty";
    saveState(state);
    log("Fila vazia — nada a processar neste tick.");
    process.exit(0);
  }

  const tick = state.ticksDone + 1;
  log(
    `Cron-Fila tick ${tick}/${state.maxTicks} → #${card.id} ${card.title} (${card.priority || "—"})`,
  );

  if (dry) {
    log(`dry-run: não executa agent/audit para #${card.id}`);
    process.exit(0);
  }

  state.lock = { pid: process.pid, id: card.id, at: nowIso() };
  state.status = "running";
  saveState(state);

  const agentArgs = [path.join(root, "agents/run.mjs"), "--id", String(card.id)];
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

  state.ticksDone = tick;
  state.lock = null;
  state.status = tick >= state.maxTicks ? "done" : "armed";
  state.history.push({
    tick,
    at: nowIso(),
    id: card.id,
    slug: card.slug,
    title: card.title,
    agentOk: agent.ok,
    auditOk: audit.ok,
    auditSkipped: Boolean(audit.skipped),
  });
  saveState(state);

  const summary = {
    tick,
    maxTicks: state.maxTicks,
    id: card.id,
    slug: card.slug,
    agentOk: agent.ok,
    auditOk: audit.ok,
    next: state.status === "done" ? null : "aguardar próxima hora cheia",
    note: "illustrations_render + SERP real com WebSearch: completar no wake do agente Cursor",
  };
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  await writeFile(
    path.join(root, "content/runs/_batch/cron-fila-last.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  log(
    `Tick ${tick}/${state.maxTicks} fechado · status=${state.status} · #${card.id} · agent=${agent.ok ? "ok" : "fail"}`,
  );

  if (!agent.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
