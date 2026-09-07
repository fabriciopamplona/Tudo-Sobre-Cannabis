#!/usr/bin/env node
/**
 * Continua peça no Gate: audit/improve e/ou SERP + gate-prep.
 * Um único processo (pid estável) para o cartão mostrar "rodando" na Esteira.
 *
 *   node agents/continue-gate.mjs --id 30
 *   node agents/continue-gate.mjs --id 30 --phases all,finish
 */
import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findById, nowIso, parsePieceId, root, writeRunMeta } from "./board.mjs";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function scoresBelowFloor(card) {
  const s = card.scores || {};
  return (s.factual ?? 0) < 8 || (s.editorial ?? 0) < 7 || (s.seo ?? 0) < 8.5;
}

function defaultPhases(card) {
  const t = card.ticks || {};
  const phases = [];
  if (!t.quality_audit || scoresBelowFloor(card)) phases.push("all");
  if (!t.serp_locked || !t.gate_prep || phases.includes("all")) phases.push("finish");
  return phases.length ? phases : ["finish"];
}

function runPhase(id, phase) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(root, "agents/audit-gate.mjs"), "--ids", String(id), "--phase", phase],
      { cwd: root, env: { ...process.env }, stdio: "inherit" },
    );
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`phase ${phase} saiu com código ${code}`));
    });
  });
}

async function main() {
  const id = parsePieceId(arg("id"));
  if (!id) {
    console.error("Uso: node agents/continue-gate.mjs --id 30 [--phases all,finish]");
    process.exit(1);
  }
  const card = await findById(id, root);
  if (!card?.slug) {
    console.error(`Não achei a peça #${id}.`);
    process.exit(1);
  }
  const rawPhases = arg("phases");
  const phases = rawPhases
    ? rawPhases.split(/[,\s]+/).filter(Boolean)
    : defaultPhases(card);

  const runDir = path.join(root, "content/runs", card.slug);
  await mkdir(runDir, { recursive: true });
  const logPath = path.join(runDir, "esteira.log");
  appendFileSync(
    logPath,
    `\n--- ${nowIso()} continue-gate #${id} phases=${phases.join(",")} pid=${process.pid} ---\n`,
  );

  await writeRunMeta(
    runDir,
    {
      slug: card.slug,
      id,
      running: true,
      runPid: process.pid,
      runStartedAt: nowIso(),
    },
    root,
  );

  let failed = null;
  try {
    for (const phase of phases) {
      console.log(`#${id} → esteira:audit --phase ${phase}`);
      await runPhase(id, phase);
    }
  } catch (err) {
    failed = err;
    console.error(err.message || err);
  } finally {
    await writeRunMeta(runDir, { slug: card.slug, id, running: false, runPid: 0 }, root);
  }
  if (failed) process.exit(1);
  console.log(`#${id} continue-gate ok (${phases.join(" → ")}).`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
