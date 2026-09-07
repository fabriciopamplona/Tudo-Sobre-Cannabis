#!/usr/bin/env node
/**
 * Ações do quadro: o botão do cartão chama isto.
 *
 *   node agents/actions.mjs --id 4 --action run
 *   node agents/actions.mjs --id 4 --action approve --reviewer "Dr. Fabricio Pamplona"
 *   node agents/actions.mjs --id 4 --action publish --reviewer "Dr. Fabricio Pamplona"
 */
import { spawn } from "node:child_process";
import { openSync, closeSync, appendFileSync } from "node:fs";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cardActions,
  findById,
  gateChecklistIncomplete,
  humanReviewedBy,
  nowIso,
  parseFields,
  parsePieceId,
  root,
  slugify,
  writeRunMeta,
} from "./board.mjs";

const CHANNEL_ROOTS = {
  blog: "content/published",
  medium: "content/medium",
  newsletter: "content/newsletter",
};

/** Defaults do OK humano — facilita o gate sem digitar a cada peça. */
const DEFAULT_REVIEWER = "Dr. Fabricio Pamplona";
const DEFAULT_CREDENTIAL = "Editor · Tudo Sobre Cannabis";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function resolveReviewer(reviewer) {
  return humanReviewedBy(reviewer) || DEFAULT_REVIEWER;
}

function resolveCredential(credential) {
  const v = String(credential || "").trim();
  return v || DEFAULT_CREDENTIAL;
}

async function exists(abs) {
  try {
    await access(abs);
    return true;
  } catch {
    return false;
  }
}

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function yamlLine(key, value) {
  return `${key}: ${JSON.stringify(String(value ?? ""))}`;
}

function setFrontmatter(raw, updates) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    const fm = Object.entries(updates).map(([k, v]) => yamlLine(k, v)).join("\n");
    return `---\n${fm}\n---\n\n${raw.trim()}\n`;
  }
  let fm = match[1];
  for (const [key, value] of Object.entries(updates)) {
    const line = yamlLine(key, value);
    const re = new RegExp(`^${key}\\s*:.*$`, "m");
    if (re.test(fm)) fm = fm.replace(re, line);
    else fm += `\n${line}`;
  }
  const body = match[2].startsWith("\n") ? match[2] : `\n${match[2]}`;
  return `---\n${fm}\n---${body}`;
}

function stripSeoComment(raw) {
  return raw.replace(/\n*<!--\s*seo[\s\S]*?-->\s*$/i, "\n");
}

function cell(value, fallback = "—") {
  const v = String(value ?? "")
    .replace(/\|/g, "/")
    .replace(/\s+/g, " ")
    .trim();
  return v || fallback;
}

function allowed(card, actionId) {
  return (card.actions || cardActions(card)).some((item) => item.id === actionId && !item.disabled);
}

function alreadyQueued(raw, card) {
  const hay = raw
    .split("\n")
    .filter((line) => /^\| P[0-3] \|/i.test(line))
    .join("\n")
    .toLowerCase();
  if (card.slug && hay.includes(card.slug.toLowerCase())) return true;
  if (card.keyword && card.keyword !== "(depois)" && hay.includes(card.keyword.toLowerCase())) return true;
  const topic = String(card.topic || card.title || "").toLowerCase();
  return Boolean(topic.length > 12 && hay.includes(topic));
}

function queueRowMatches(line, card) {
  const low = line.toLowerCase();
  if (card.slug && low.includes(String(card.slug).toLowerCase())) return true;
  if (card.keyword && card.keyword !== "(depois)" && low.includes(String(card.keyword).toLowerCase())) {
    return true;
  }
  return false;
}

/** Garante linha na fila com action=criar (reativa nao-escrever). */
function upsertQueueCriar(raw, card) {
  const row = `| ${cell(card.priority, "P1")} | criar | ${cell(card.origin, "humano")} | ${cell(card.topic || card.title)} | ${cell(card.keyword, "(depois)")} | ${cell(card.type, "informe")} | ${cell(card.channel, "blog")} | via esteira #${card.id} |`;
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^\| P[0-3] \|/i.test(lines[i])) continue;
    if (!queueRowMatches(lines[i], card)) continue;
    const cells = lines[i].split("|").map((c) => c.trim());
    // ["", "P1", "action", "origin", ...]
    if (cells.length >= 8) {
      cells[2] = "criar";
      lines[i] = `| ${cells.slice(1, -1).join(" | ")} |`;
      return lines.join("\n");
    }
  }
  if (alreadyQueued(raw, card)) return raw;
  return insertQueueRow(raw, row);
}

function insertQueueRow(raw, row) {
  const lines = raw.split("\n");
  let lastP1 = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\| P1 \|/i.test(lines[i])) lastP1 = i;
  }
  if (lastP1 >= 0) {
    lines.splice(lastP1 + 1, 0, row);
    return lines.join("\n");
  }
  const marker = "\n## P2";
  if (raw.includes(marker)) return raw.replace(marker, `\n${row}\n${marker}`);
  return `${raw.trim()}\n\n${row}\n`;
}

async function clearBriefNaoEscrever(runDir) {
  const briefPath = path.join(runDir, "00-brief.md");
  if (!(await exists(briefPath))) return;
  let raw = await readFile(briefPath, "utf8");
  if (!/^action:\s*nao-escrever\b/im.test(raw)) return;
  raw = raw.replace(/^action:\s*nao-escrever\b/im, "action: criar");
  await writeFile(briefPath, raw);
}

async function enqueue(card, repoRoot) {
  const queuePath = path.join(repoRoot, "content/opportunities/queue.md");
  let raw = "";
  try {
    raw = await readFile(queuePath, "utf8");
  } catch {
    raw = "# Fila — Tudo Sobre Cannabis\n\n";
  }

  const wasParked = card.column === "out" || card.action === "nao-escrever";
  if (wasParked) {
    raw = upsertQueueCriar(raw, card);
    await writeFile(queuePath, raw);
    const runDir = path.join(repoRoot, "content/runs", card.slug);
    if (card.slug && (await exists(runDir))) {
      await clearBriefNaoEscrever(runDir);
      await writeRunMeta(
        runDir,
        { slug: card.slug, id: card.id, action: "criar", running: false },
        repoRoot,
      );
    }
    return {
      ok: true,
      message: `#${card.id} reativada (saiu de Fora). Com trabalho já feito, pode ir para Gate — não fica presa em Fora.`,
    };
  }

  if (alreadyQueued(raw, card)) {
    return { ok: true, message: `#${card.id} já está na fila.` };
  }
  const row = `| ${cell(card.priority, "P1")} | criar | ${cell(card.origin, "humano")} | ${cell(card.topic || card.title)} | ${cell(card.keyword, "(depois)")} | ${cell(card.type, "informe")} | ${cell(card.channel, "blog")} | via esteira #${card.id} |`;
  await writeFile(queuePath, insertQueueRow(raw, row));
  return { ok: true, message: `#${card.id} foi para a Fila.` };
}

async function assertBlogSerpReady(card, repoRoot) {
  const channel = (card.channel || "blog").toLowerCase();
  if (channel !== "blog") return { ok: true };
  const serpPath = path.join(repoRoot, "content/runs", card.slug, "07-serp-review.md");
  if (!(await exists(serpPath))) {
    return {
      ok: false,
      error: "Blog: falta 07-serp-review.md (serp-reviewer / esteira:audit --phase serp).",
    };
  }
  const serpRaw = await readFile(serpPath, "utf8");
  if (!/Veredicto SEO:[\s*]*PRONTO/i.test(serpRaw)) {
    return { ok: false, error: "Blog: 07-serp-review.md precisa de Veredicto SEO: PRONTO." };
  }
  return { ok: true };
}

async function approve(card, { reviewer, credential }, repoRoot) {
  const name = resolveReviewer(reviewer);
  const cred = resolveCredential(credential);
  const serpOk = await assertBlogSerpReady(card, repoRoot);
  if (!serpOk.ok) return serpOk;
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  await mkdir(runDir, { recursive: true });
  const date = todayISO();
  const prepNote = (await exists(path.join(runDir, "05-gate-prep.md")))
    ? "Checklist pré-preenchido em `05-gate-prep.md` (agente). Este OK humano fecha o gate."
    : "Checklist em `agents/gates/publish.md` + prep do agente quando houver.";
  const gate = `# Gate — #${card.id}

**Decisão: APROVAR** (OK humano único; checklist IA em gate-prep / audit / SERP)

**Revisado por:** ${name}  
**Credencial:** ${cred}  
**Data de publicação:** ${date}

${prepNote}

SERP/keyword: \`07-serp-review.md\` PRONTO (Blog).

Publicar pode ser o mesmo gesto (\`publish\` com revisor) ou o botão seguinte se só assinou.
`;
  await writeFile(path.join(runDir, "05-gate.md"), gate);
  const candidatePath = path.join(runDir, "04-publish-candidate.md");
  if (await exists(candidatePath)) {
    const raw = await readFile(candidatePath, "utf8");
    await writeFile(
      candidatePath,
      setFrontmatter(raw, {
        reviewedBy: name,
        status: "draft",
        // Data de aprovação = data de publicação (não a de escrita do batch).
        datePublished: date,
        dateModified: date,
      }),
    );
  }
  await writeRunMeta(
    runDir,
    {
      slug: card.slug,
      id: card.id,
      verdict: "APROVAR",
      reviewedBy: name,
      running: false,
    },
    repoRoot,
  );
  return { ok: true, message: `#${card.id} assinado (reviewedBy). Pode publicar.` };
}

async function publish(card, repoRoot, { reviewer, credential } = {}) {
  if (card.verdict === "BLOQUEAR") {
    return { ok: false, error: "Peça BLOQUEAR não publica. Reabra a escrita ou assine depois de corrigir." };
  }
  const name = resolveReviewer(reviewer);
  const cred = resolveCredential(credential);
  // OK único: se ainda não há reviewedBy, assina o gate neste mesmo gesto
  if (!humanReviewedBy(card.reviewedBy)) {
    const signed = await approve(card, { reviewer: name, credential: cred }, repoRoot);
    if (!signed.ok) return signed;
    card = { ...card, reviewedBy: name, verdict: "APROVAR" };
  }
  const serpOk = await assertBlogSerpReady(card, repoRoot);
  if (!serpOk.ok) return serpOk;
  const candidatePath = path.join(repoRoot, "content/runs", card.slug, "04-publish-candidate.md");
  if (!(await exists(candidatePath))) {
    return { ok: false, error: "Não achei 04-publish-candidate.md." };
  }
  let raw = await readFile(candidatePath, "utf8");
  if (/aguardando modelo/i.test(raw)) {
    return { ok: false, error: "Candidato ainda é stub." };
  }
  const fields = parseFields(raw);
  const channel = fields.channel || card.channel || "blog";
  const destRel = CHANNEL_ROOTS[channel] || CHANNEL_ROOTS.blog;
  const destDir = path.join(repoRoot, destRel);
  await mkdir(destDir, { recursive: true });
  const slug = fields.slug || card.slug;
  const dest = path.join(destDir, `${slug}.md`);
  if (await exists(dest)) {
    return { ok: false, error: `Já existe ${destRel}/${slug}.md. Reabra para atualizar.` };
  }
  const date = todayISO();
  raw = stripSeoComment(raw);
  // Preferir a data gravada no OK (approve). Evita data de escrita do batch.
  const datePublished =
    humanReviewedBy(fields.reviewedBy) && fields.datePublished
      ? fields.datePublished
      : date;
  const fmUpdates = {
    slug,
    status: "published",
    reviewedBy: humanReviewedBy(card.reviewedBy) || name,
    datePublished,
    dateModified: date,
    pillar: fields.pillar || card.pillar || "acesso",
  };
  if (fields.keyword && fields.keyword_status !== "none") {
    fmUpdates.keyword_status = "locked";
  }
  raw = setFrontmatter(raw, fmUpdates);
  await writeFile(dest, raw);
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  if (await exists(runDir)) {
    await writeRunMeta(runDir, { slug, id: card.id, status: "published", running: false }, repoRoot);
  }
  const publicPath =
    channel === "blog" ? `/${fields.pillar || card.pillar || "acesso"}/${slug}` : `${destRel}/${slug}.md`;
  return { ok: true, message: `#${card.id} no ar em ${destRel}/${slug}.md`, href: publicPath };
}

async function startRun(card, action, repoRoot) {
  if (card.running) {
    return { ok: false, error: `Esteira de #${card.id} já está rodando.` };
  }
  const slug = card.slug || slugify(card.title);
  const runDir = path.join(repoRoot, "content/runs", slug);
  await mkdir(runDir, { recursive: true });
  const args = [path.join(repoRoot, "agents/run.mjs"), "--id", String(card.id)];
  if (action.resume) args.push("--resume");
  if (action.from) args.push("--from", action.from);
  const logPath = path.join(runDir, "esteira.log");
  await writeRunMeta(
    runDir,
    {
      slug,
      id: card.id,
      topic: card.topic || card.title,
      keyword: card.keyword,
      channel: card.channel,
      type: card.type,
      origin: card.origin,
      running: true,
      runStartedAt: nowIso(),
    },
    repoRoot,
  );
  appendFileSync(logPath, `\n--- ${nowIso()} ${args.join(" ")} ---\n`);
  const fd = openSync(logPath, "a");
  const child = spawn(process.execPath, args, {
    cwd: repoRoot,
    env: { ...process.env },
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  closeSync(fd);
  if (!child.pid) {
    await writeRunMeta(runDir, { slug, id: card.id, running: false, runPid: 0 }, repoRoot);
    return { ok: false, error: `Não consegui disparar a esteira de #${card.id}.` };
  }
  await writeRunMeta(
    runDir,
    { slug, id: card.id, running: true, runPid: child.pid, runStartedAt: nowIso() },
    repoRoot,
  );
  child.unref();
  return {
    ok: true,
    message: `#${card.id} na esteira (pid ${child.pid}). O cartão muda de coluna quando o estágio terminar.`,
    pid: child.pid,
  };
}

function writingIncomplete(card) {
  const t = card.ticks || {};
  return !t.candidate || !t.illustrations_spec;
}

function scoresBelowFloor(card) {
  const s = card.scores || {};
  return (s.factual ?? 0) < 8 || (s.editorial ?? 0) < 7 || (s.seo ?? 0) < 8.5;
}

function needsAuditLoop(card) {
  const t = card.ticks || {};
  return !t.quality_audit || scoresBelowFloor(card);
}

function needsSerpOrPrep(card) {
  const t = card.ticks || {};
  return !t.serp_locked || !t.gate_prep;
}

/**
 * Gate com texto pronto: run.mjs --resume não faz nada (pula artefatos).
 * Dispara continue-gate.mjs (audit/SERP/gate-prep) com pid estável.
 */
async function continueFromGate(card, repoRoot) {
  if (card.running) {
    return { ok: false, error: `Esteira de #${card.id} já está rodando.` };
  }
  if (writingIncomplete(card)) {
    return startRun(card, { resume: true }, repoRoot);
  }
  if (!gateChecklistIncomplete(card) && !scoresBelowFloor(card)) {
    return {
      ok: true,
      message: `#${card.id}: checklist fechado. Use OK e publicar (ou Reabrir escrita se o veredicto for AJUSTAR/BLOQUEAR).`,
    };
  }

  const phases = [];
  if (needsAuditLoop(card)) phases.push("all");
  if (needsSerpOrPrep(card) || needsAuditLoop(card)) phases.push("finish");

  if (!phases.length) {
    if (!card.ticks?.illustrations_render) {
      return {
        ok: false,
        error: `#${card.id}: falta só render de ilustras (humano/imagegen). Spec já existe — isso não roda no Continuar esteira.`,
      };
    }
    return {
      ok: true,
      message: `#${card.id}: nada pendente no audit/SERP. Atualize o quadro.`,
    };
  }

  const slug = card.slug || slugify(card.title);
  const runDir = path.join(repoRoot, "content/runs", slug);
  await mkdir(runDir, { recursive: true });
  const logPath = path.join(runDir, "esteira.log");
  const args = [
    path.join(repoRoot, "agents/continue-gate.mjs"),
    "--id",
    String(card.id),
    "--phases",
    phases.join(","),
  ];

  await writeRunMeta(
    runDir,
    {
      slug,
      id: card.id,
      topic: card.topic || card.title,
      keyword: card.keyword,
      channel: card.channel,
      type: card.type,
      origin: card.origin,
      running: true,
      runStartedAt: nowIso(),
    },
    repoRoot,
  );
  appendFileSync(logPath, `\n--- ${nowIso()} ${args.join(" ")} ---\n`);
  const fd = openSync(logPath, "a");
  const child = spawn(process.execPath, args, {
    cwd: repoRoot,
    env: { ...process.env },
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  closeSync(fd);
  if (!child.pid) {
    await writeRunMeta(runDir, { slug, id: card.id, running: false, runPid: 0 }, repoRoot);
    return { ok: false, error: `Não consegui disparar audit/SERP de #${card.id}.` };
  }
  await writeRunMeta(
    runDir,
    { slug, id: card.id, running: true, runPid: child.pid, runStartedAt: nowIso() },
    repoRoot,
  );
  child.unref();

  const noteRender = !card.ticks?.illustrations_render
    ? " Ilustras WebP ainda são etapa humana/imagegen."
    : "";
  return {
    ok: true,
    message: `#${card.id} foi para a Esteira (audit/SERP: ${phases.join(" → ")}, pid ${child.pid}).${noteRender} Atualize o quadro quando terminar.`,
    pid: child.pid,
    phases,
  };
}

export async function performAction({ id, action, reviewer, credential }, repoRoot = root) {
  const n = parsePieceId(id);
  if (!n) return { ok: false, error: "id inválido" };
  const card = await findById(n, repoRoot);
  if (!card) return { ok: false, error: `Não achei a peça #${n}.` };
  card.actions = cardActions(card);
  if (action === "wait") return { ok: false, error: `Esteira de #${n} já está rodando.` };
  if (!allowed(card, action)) {
    return { ok: false, error: `Ação ${action} não cabe em #${n} (${card.column}).` };
  }
  if (action === "enqueue") return enqueue(card, repoRoot);
  if (action === "approve") return approve(card, { reviewer, credential }, repoRoot);
  if (action === "publish") return publish(card, repoRoot, { reviewer, credential });
  if (action === "reopen") {
    return startRun(card, { resume: false, from: "writer" }, repoRoot);
  }
  if (action === "run") {
    const spec = card.actions.find((item) => item.id === "run") || {
      resume: card.column === "in_pipeline" || card.column === "gate",
    };
    // No Gate, texto pronto → audit/SERP; senão run.mjs clássico.
    if (card.column === "gate" && !writingIncomplete(card)) {
      return continueFromGate(card, repoRoot);
    }
    return startRun(card, { resume: Boolean(spec.resume), from: spec.from }, repoRoot);
  }
  return { ok: false, error: `Ação desconhecida: ${action}` };
}

async function main() {
  const id = arg("id");
  const action = arg("action");
  if (!id || !action) {
    console.error(
      "Uso: node agents/actions.mjs --id 4 --action run|reopen|approve|publish|enqueue\n" +
        "  publish/approve: --reviewer e --credential têm default (Dr. Fabricio Pamplona)",
    );
    process.exit(1);
  }
  const result = await performAction({
    id,
    action,
    reviewer: arg("reviewer") || DEFAULT_REVIEWER,
    credential: arg("credential") || DEFAULT_CREDENTIAL,
  });
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result));
    process.exit(result.ok ? 0 : 1);
  }
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(result.message);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
