#!/usr/bin/env node
/**
 * Rotina de lote: produz peças até o candidato (gate humano).
 *
 *   npm run esteira:batch
 *   npm run esteira:batch -- --column queued
 *   npm run esteira:batch -- --column in_pipeline,queued
 *   npm run esteira:batch -- --dry-run
 *   npm run esteira:batch -- --ids 13,14,15
 *   npm run esteira:batch -- --continue-on-error
 *   npm run esteira:batch -- --no-resume   # Fila: do estrategista
 *   npm run esteira:batch -- --resume     # Esteira: continua ticks
 *
 * Usa o runner existente (`agents/run.mjs`): Claude CLI → ANTHROPIC_API_KEY → OpenAI.
 * Scrap (DeepSeek) só entra se a peça tiver --url.
 * Não assina gate nem publica.
 */
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectBoard, nowIso, parsePieceId, root } from "./board.mjs";

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2, P3: 3 };

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function parseIds(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,\s]+/)
    .map((part) => parsePieceId(part))
    .filter((n) => Number.isFinite(n));
}

function sortCards(a, b) {
  const pa = PRIORITY_RANK[a.priority] ?? 9;
  const pb = PRIORITY_RANK[b.priority] ?? 9;
  if (pa !== pb) return pa - pb;
  return a.id - b.id;
}

function logLine(logPath, line) {
  const text = `[${nowIso()}] ${line}`;
  console.log(line);
  appendFileSync(logPath, `${text}\n`);
}

function runAgent(id, { dry, resume, from }) {
  const args = [path.join(root, "agents/run.mjs"), "--id", String(id)];
  if (resume) args.push("--resume");
  if (from) args.push("--from", from);
  if (dry) args.push("--dry-run");
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => {
      const s = chunk.toString();
      out += s;
      process.stdout.write(s);
    });
    child.stderr.on("data", (chunk) => {
      const s = chunk.toString();
      err += s;
      process.stderr.write(s);
    });
    child.on("error", (error) => {
      resolve({ ok: false, code: 1, out, err: String(error) });
    });
    child.on("close", (code) => {
      resolve({ ok: code === 0, code: code ?? 1, out, err });
    });
  });
}

function defaultResume(columns) {
  // Fila = do estrategista; Esteira = continua ticks. --resume / --no-resume vencem.
  if (hasFlag("resume")) return true;
  if (hasFlag("no-resume")) return false;
  if (columns.length === 1 && columns[0] === "queued") return false;
  if (columns.every((col) => col === "in_pipeline" || col === "gate")) return true;
  return false;
}

function resumeForCard(card, batchResume) {
  if (hasFlag("resume")) return true;
  if (hasFlag("no-resume")) return false;
  if (card.column === "queued") return false;
  if (card.column === "in_pipeline" || card.column === "gate") return true;
  return batchResume;
}

async function main() {
  const dry = hasFlag("dry-run");
  const continueOnError = hasFlag("continue-on-error");
  const from = arg("from");
  const columns = String(arg("column", "in_pipeline"))
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const resume = defaultResume(columns);
  const ids = parseIds(arg("ids"));

  const board = await collectBoard(root, { write: true });
  let cards = board.cards.filter((card) => columns.includes(card.column));
  if (ids.length) {
    const wanted = new Set(ids);
    cards = board.cards.filter((card) => wanted.has(card.id));
    const missing = ids.filter((id) => !cards.some((card) => card.id === id));
    if (missing.length) {
      console.error(`Não achei: ${missing.map((id) => `#${id}`).join(", ")}`);
      process.exit(1);
    }
  }

  cards = [...cards].sort(sortCards);
  if (!cards.length) {
    console.log(`Nenhuma peça em "${columns.join(",")}".`);
    return;
  }

  const logDir = path.join(root, "content/runs/_batch");
  await mkdir(logDir, { recursive: true });
  const stamp = nowIso().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `esteira-${stamp}.log`);
  mkdirSync(logDir, { recursive: true });

  logLine(
    logPath,
    `Batch esteira — ${cards.length} peça(s) · coluna=${columns.join(",")} · resume=${resume} · dry=${dry}`,
  );
  for (const card of cards) {
    const ticks = Object.entries(card.ticks || {})
      .filter(([, ok]) => ok)
      .map(([name]) => name)
      .join("→");
    logLine(
      logPath,
      `  #${card.id}  ${(card.priority || "—").padEnd(2)}  ${card.slug || card.title}  [${ticks || "sem ticks"}]`,
    );
  }

  const results = [];
  for (const card of cards) {
    logLine(logPath, `\n>>> #${card.id} ${card.title}`);
    if (card.running) {
      logLine(logPath, `pula: #${card.id} já está rodando`);
      results.push({ id: card.id, ok: false, skipped: true, reason: "running" });
      if (!continueOnError) break;
      continue;
    }
    const cardResume = resumeForCard(card, resume);
    const result = await runAgent(card.id, { dry, resume: cardResume, from });
    results.push({ id: card.id, ok: result.ok, code: result.code, resume: cardResume });
    logLine(logPath, result.ok ? `ok: #${card.id}` : `falha: #${card.id} (exit ${result.code})`);
    if (!result.ok && !continueOnError) {
      logLine(logPath, "Parando (--continue-on-error para seguir).");
      break;
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const summary = {
    startedAt: stamp,
    columns,
    dry,
    resume,
    total: cards.length,
    ran: results.length,
    ok,
    fail,
    skipped,
    results,
    log: path.relative(root, logPath),
  };
  const summaryPath = path.join(logDir, `esteira-${stamp}.json`);
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  logLine(
    logPath,
    `\nResumo: ${ok} ok · ${fail} falha · ${skipped} pulada · log ${path.relative(root, logPath)}`,
  );
  logLine(logPath, "Gate humano continua manual: /esteira ou npm run esteira:do -- --id N --action approve");

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
