#!/usr/bin/env node
/**
 * Ações do quadro: o botão do cartão chama isto.
 *
 *   node agents/actions.mjs --id 4 --action run
 *   node agents/actions.mjs --id 4 --action approve --reviewer "Nome" --credential "CRM/redação"
 *   node agents/actions.mjs --id 4 --action publish
 */
import { spawn } from "node:child_process";
import { openSync, closeSync, appendFileSync } from "node:fs";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cardActions,
  findById,
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

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
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

async function enqueue(card, repoRoot) {
  const queuePath = path.join(repoRoot, "content/opportunities/queue.md");
  let raw = "";
  try {
    raw = await readFile(queuePath, "utf8");
  } catch {
    raw = "# Fila — Tudo Sobre Cannabis\n\n";
  }
  if (alreadyQueued(raw, card)) {
    return { ok: true, message: `#${card.id} já está na fila.` };
  }
  const row = `| ${cell(card.priority, "P1")} | criar | ${cell(card.origin, "humano")} | ${cell(card.topic || card.title)} | ${cell(card.keyword, "(depois)")} | ${cell(card.type, "informe")} | ${cell(card.channel, "blog")} | via esteira #${card.id} |`;
  await writeFile(queuePath, insertQueueRow(raw, row));
  return { ok: true, message: `#${card.id} foi para a Fila.` };
}

async function approve(card, { reviewer, credential }, repoRoot) {
  const name = humanReviewedBy(reviewer);
  if (!name) {
    return { ok: false, error: "Assinatura humana: nome real, não Redação/modelo." };
  }
  if (!String(credential || "").trim()) {
    return { ok: false, error: "Credencial obrigatória (ex.: CRM, redação TSC, data da checagem)." };
  }
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  await mkdir(runDir, { recursive: true });
  const date = todayISO();
  const gate = `# Gate — #${card.id}

Um modelo não fecha este estágio. Assinar **não** marca os checkboxes de \`agents/gates/publish.md\`.

**Decisão: APROVAR**

**Revisor:** ${name}  
**Credencial:** ${String(credential).trim()}  
**Data:** ${date}

O revisor declara ter conferido o checklist. Publicar é o próximo botão.
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
  return { ok: true, message: `#${card.id} assinado. Foi para Aprovado. Publicar é o próximo botão.` };
}

async function publish(card, repoRoot) {
  if (card.verdict === "BLOQUEAR") {
    return { ok: false, error: "Peça BLOQUEAR não publica. Reabra a escrita ou assine depois de corrigir." };
  }
  if (!humanReviewedBy(card.reviewedBy)) {
    return { ok: false, error: "Sem reviewedBy humano não publica." };
  }
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
  raw = setFrontmatter(raw, {
    slug,
    status: "published",
    reviewedBy: humanReviewedBy(card.reviewedBy) || fields.reviewedBy,
    datePublished: date,
    dateModified: date,
    pillar: fields.pillar || card.pillar || "acesso",
  });
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
  if (action === "publish") return publish(card, repoRoot);
  if (action === "run") {
    const spec = card.actions.find((item) => item.id === "run") || { resume: false };
    return startRun(card, { resume: spec.resume, from: spec.from }, repoRoot);
  }
  return { ok: false, error: `Ação desconhecida: ${action}` };
}

async function main() {
  const id = arg("id");
  const action = arg("action");
  if (!id || !action) {
    console.error("Uso: node agents/actions.mjs --id 4 --action run|approve|publish|enqueue");
    process.exit(1);
  }
  const result = await performAction({
    id,
    action,
    reviewer: arg("reviewer"),
    credential: arg("credential"),
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
