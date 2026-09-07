#!/usr/bin/env node
/**
 * Orquestra até Gate: repara peças incompletas e produz a Fila em ordem P0→P2.
 *
 *   node agents/batch-ate-gate.mjs
 *   node agents/batch-ate-gate.mjs --skip-repair
 */
import { spawn } from "node:child_process";
import { access, readFile, unlink, writeFile, mkdir } from "node:fs/promises";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { collectBoard, nowIso, root } from "./board.mjs";

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2, P3: 3 };

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function exists(rel) {
  try {
    await access(path.join(root, rel));
    return true;
  } catch {
    return false;
  }
}

async function bodyChars(rel) {
  try {
    const raw = await readFile(path.join(root, rel), "utf8");
    if (/aguardando modelo/i.test(raw)) return 0;
    const m = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
    if (m) return m[1].replace(/\s+/g, " ").trim().length;
    if (/^#\s+Research pack/im.test(raw)) return raw.trim().length;
    return raw.replace(/\s+/g, " ").trim().length;
  } catch {
    return 0;
  }
}

function log(logPath, line) {
  const text = `[${nowIso()}] ${line}`;
  console.log(line);
  appendFileSync(logPath, `${text}\n`);
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

async function restoreHumanizedFromCandidate(slug) {
  const candRel = `content/runs/${slug}/04-publish-candidate.md`;
  const humRel = `content/runs/${slug}/03-humanized.md`;
  const cand = await readFile(path.join(root, candRel), "utf8");
  const m = cand.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m || m[2].trim().length < 400) return false;
  // Humanizado = corpo do candidato (sem campos só de SEO).
  const keep = ["title", "dek", "slug", "type", "channel", "author", "keyword", "audience", "takeaway", "opinion_level"];
  const fmLines = m[1]
    .split("\n")
    .filter((line) => keep.some((k) => line.startsWith(`${k}:`)));
  const out = `---\n${fmLines.join("\n")}\n---\n\n${m[2].trim()}\n`;
  await writeFile(path.join(root, humRel), out);
  return true;
}

async function dropThin(rel, min = 400) {
  const n = await bodyChars(rel);
  if (n > 0 && n < min && (await exists(rel))) {
    await unlink(path.join(root, rel));
    return true;
  }
  return false;
}

async function planRepair(board) {
  const jobs = [];
  for (const card of board.cards) {
    if (!["in_pipeline", "gate"].includes(card.column)) continue;
    if ([1, 2, 3, 4, 5].includes(card.id)) continue; // publicados / gates humanos antigos
    const slug = card.slug;
    if (!slug) continue;
    const research = await bodyChars(`content/runs/${slug}/01-research-pack.md`);
    const draft = await bodyChars(`content/runs/${slug}/02-draft.md`);
    const human = await bodyChars(`content/runs/${slug}/03-humanized.md`);
    const cand = await bodyChars(`content/runs/${slug}/04-publish-candidate.md`);

    // Candidato bom: restaura humanizado se fino e segue.
    if (cand >= 1500) {
      if (human < 800) await restoreHumanizedFromCandidate(slug);
      await dropThin(`content/runs/${slug}/02-draft.md`, 800);
      continue;
    }

    if (research < 800) {
      await dropThin(`content/runs/${slug}/01-research-pack.md`, 800);
      await dropThin(`content/runs/${slug}/02-draft.md`, 800);
      await dropThin(`content/runs/${slug}/03-humanized.md`, 800);
      await dropThin(`content/runs/${slug}/04-publish-candidate.md`, 800);
      jobs.push({ id: card.id, from: "researcher", title: card.title });
      continue;
    }
    if (draft < 800 || human < 800) {
      await dropThin(`content/runs/${slug}/02-draft.md`, 800);
      await dropThin(`content/runs/${slug}/03-humanized.md`, 800);
      await dropThin(`content/runs/${slug}/04-publish-candidate.md`, 800);
      jobs.push({ id: card.id, from: "writer", title: card.title });
      continue;
    }
    jobs.push({ id: card.id, from: "seo-editor", title: card.title });
  }
  return jobs.sort((a, b) => a.id - b.id);
}

async function main() {
  const logDir = path.join(root, "content/runs/_batch");
  await mkdir(logDir, { recursive: true });
  const stamp = nowIso().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `ate-gate-${stamp}.log`);

  log(logPath, "Batch até Gate — qualidade + Fila completa");
  const board = await collectBoard(root, { write: true });

  if (!hasFlag("skip-repair")) {
    const jobs = await planRepair(board);
    log(logPath, `Reparos: ${jobs.length}`);
    for (const job of jobs) {
      log(logPath, `\n>>> reparo #${job.id} from=${job.from} ${job.title}`);
      const args = [path.join(root, "agents/run.mjs"), "--id", String(job.id), "--from", job.from];
      const result = await runNode(args);
      log(logPath, result.ok ? `ok reparo #${job.id}` : `falha reparo #${job.id} exit=${result.code}`);
    }
  }

  // Fila: do estrategista ao candidato, P0→P2
  const queued = board.cards
    .filter((c) => c.column === "queued")
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || a.id - b.id);

  log(logPath, `\nFila: ${queued.length} peça(s)`);
  for (const card of queued) {
    log(logPath, `\n>>> fila #${card.id} ${card.title}`);
    const args = [path.join(root, "agents/run.mjs"), "--id", String(card.id)];
    const result = await runNode(args);
    log(logPath, result.ok ? `ok fila #${card.id}` : `falha fila #${card.id} exit=${result.code}`);
  }

  const finalBoard = await collectBoard(root, { write: true });
  log(
    logPath,
    `\nResumo colunas: fila=${finalBoard.counts.queued} esteira=${finalBoard.counts.in_pipeline} gate=${finalBoard.counts.gate}`,
  );
  log(logPath, `Log: ${path.relative(root, logPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
