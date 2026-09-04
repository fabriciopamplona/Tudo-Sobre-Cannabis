#!/usr/bin/env node
/**
 * Quadro da esteira: deriva status, grava meta.json, agrega o kanban.
 *
 *   npm run esteira
 *   npm run esteira -- 12
 *   node agents/board.mjs --json
 */
import { mkdir, readdir, readFile, writeFile, access, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TICK_FILES = {
  scrap: "guide.md",
  briefed: "00-brief.md",
  researched: "01-research-pack.md",
  draft: "02-draft.md",
  humanized: "03-humanized.md",
  candidate: "04-publish-candidate.md",
};

const SCORE_FILES = ["06-scores.md", "06-claude-review.md"];

export function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function nowIso() {
  return new Date().toISOString();
}

function pidAlive(pid) {
  const n = Number(pid);
  if (!Number.isInteger(n) || n <= 0) return false;
  try {
    process.kill(n, 0);
    return true;
  } catch {
    return false;
  }
}

function stillRunning(prev) {
  if (!prev?.running) return false;
  if (pidAlive(prev.runPid)) return true;
  const started = Date.parse(prev.runStartedAt || "");
  return Number.isFinite(started) && Date.now() - started < 12000;
}

const LEDGER_REL = "content/opportunities/ledger.json";
const COLUMN_ASSIGN_ORDER = ["published", "approved", "gate", "in_pipeline", "queued", "inbox", "out"];

export function parsePieceId(raw) {
  const match = String(raw || "").trim().match(/^#?(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function agentCommand(id) {
  return `npm run agent -- --id ${id}`;
}

async function loadLedger(repoRoot) {
  try {
    const data = JSON.parse(await readFile(path.join(repoRoot, LEDGER_REL), "utf8"));
    if (!data.items) data.items = {};
    if (!Number.isFinite(data.next)) {
      const ids = Object.keys(data.items).map(Number).filter(Number.isFinite);
      data.next = ids.length ? Math.max(...ids) + 1 : 1;
    }
    return data;
  } catch {
    return { next: 1, items: {} };
  }
}

async function saveLedger(repoRoot, ledger) {
  const abs = path.join(repoRoot, LEDGER_REL);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, `${JSON.stringify(ledger, null, 2)}\n`);
}

function ledgerMatch(item, card) {
  if (item.slug && card.slug && item.slug === card.slug) return true;
  return keysOverlap(item.keys || [], card.keys || []);
}

function assignIds(cards, ledger) {
  for (const card of cards) {
    const hit = Object.values(ledger.items).find((item) => ledgerMatch(item, card));
    if (hit) {
      card.id = hit.id;
      hit.slug = card.slug || hit.slug;
      hit.title = card.title || hit.title;
      hit.keys = [...new Set([...(hit.keys || []), ...(card.keys || [])])];
      hit.column = card.column;
    } else {
      card.id = null;
    }
  }

  const fresh = cards
    .filter((card) => !card.id)
    .sort((a, b) => {
      const listed = Number(Boolean(b.listed)) - Number(Boolean(a.listed));
      if (listed) return listed;
      const col = COLUMN_ASSIGN_ORDER.indexOf(a.column) - COLUMN_ASSIGN_ORDER.indexOf(b.column);
      if (col) return col;
      const pri = String(a.priority || "P9").localeCompare(String(b.priority || "P9"));
      if (pri) return pri;
      return String(a.title || a.slug).localeCompare(String(b.title || b.slug), "pt-BR");
    });

  for (const card of fresh) {
    const id = ledger.next++;
    card.id = id;
    ledger.items[String(id)] = {
      id,
      slug: card.slug,
      title: card.title,
      keys: card.keys || [],
      column: card.column,
      assignedAt: nowIso(),
    };
  }
  return ledger;
}

export async function findById(id, repoRoot = root) {
  const n = parsePieceId(id);
  if (!n) return null;
  const board = await collectBoard(repoRoot, { write: false });
  return [...board.cards, ...board.orphans].find((card) => card.id === n) || null;
}

async function exists(abs) {
  try {
    await access(abs);
    return true;
  } catch {
    return false;
  }
}

async function readText(abs) {
  try {
    return await readFile(abs, "utf8");
  } catch {
    return "";
  }
}

function unquote(value) {
  const v = String(value ?? "").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

export function parseFields(raw) {
  const data = {};
  if (!raw) return data;
  const yamlBlocks = [];
  const fence = raw.match(/```ya?ml\s*([\s\S]*?)```/i);
  if (fence) yamlBlocks.push(fence[1]);
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (fm) yamlBlocks.push(fm[1]);
  const blob = yamlBlocks.length ? yamlBlocks.join("\n") : raw;
  for (const line of blob.split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    if (!/^[a-zA-Z_][\w-]*$/.test(key)) continue;
    let value = unquote(line.slice(idx + 1));
    if (!value || value === "[]") continue;
    data[key] = value;
  }
  return data;
}

function num(value) {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function parseScores(text) {
  if (!text) return { factual: null, editorial: null, seo: null, ranking: null };
  const pick = (patterns) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const n = num(match[1]);
        if (n != null) return n;
      }
    }
    return null;
  };
  return {
    factual: pick([
      /qualidade factual[\s\S]{0,600}?\*\*(\d+(?:[.,]\d+)?)\s*\/\s*10/i,
      /checagem factual[^\n]*(\d+(?:[.,]\d+)?)\s*\/\s*10/i,
      /\*\*(\d+(?:[.,]\d+)?)\s*\/\s*10\*\*[^\n]{0,40}factual/i,
    ]),
    editorial: pick([
      /(?:^|\n)##?\s*editorial[\s\S]{0,200}?\*\*(\d+(?:[.,]\d+)?)\s*\/\s*10/i,
      /\*\*(\d+(?:[.,]\d+)?)\s*\/\s*10\*\*[^\n]{0,60}editorial/i,
      /nota editorial[^\n]*(\d+(?:[.,]\d+)?)\s*\/\s*10/i,
    ]),
    seo: pick([
      /SEO on-page[\s\S]{0,200}?\*\*(\d+(?:[.,]\d+)?)\s*\/\s*10/i,
      /On-page t[eé]cnico:\s*\*?(\d+(?:[.,]\d+)?)\s*\/\s*10/i,
      /Score SEO geral[\s\S]{0,200}?On-page[^\n]*(\d+(?:[.,]\d+)?)\s*\/\s*10/i,
    ]),
    ranking: pick([
      /ranqueia:\s*(\d+(?:[.,]\d+)?)/i,
      /"Merece ranquear":\s*(\d+(?:[.,]\d+)?)\s*\/\s*10/,
      /[Mm]erece ranquear[\s\S]{0,200}?(\d+(?:[.,]\d+)?)\s*\/\s*10/,
      /[Mm]erece:\s*(\d+(?:[.,]\d+)?)\s*\/\s*10/,
    ]),
  };
}

export function parseVerdict(text) {
  if (!text) return "pending";
  if (/\bAPROVAR\b/.test(text) && !/\bBLOQUEAR\b/.test(text) && !/\bnão publicar\b/i.test(text)) {
    return "APROVAR";
  }
  if (/\bAJUSTAR\b/.test(text) && !/\bBLOQUEAR\b/.test(text)) return "AJUSTAR";
  if (/\bBLOQUEAR\b/.test(text) || /n[aã]o publicar/i.test(text) || /Decis[aã]o:\s*n[aã]o publicar/i.test(text)) {
    return "BLOQUEAR";
  }
  return "pending";
}

export function humanReviewedBy(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  if (/reda[cç][aã]o/i.test(v)) return "";
  if (/modelo|claude|deepseek|gpt/i.test(v)) return "";
  return v;
}

function identityKeys({ slug, keyword, topic }) {
  const keys = new Set();
  const add = (value) => {
    const s = slugify(value);
    if (s && s !== "depois") keys.add(s);
  };
  add(slug);
  add(keyword);
  add(topic);
  return [...keys];
}

function lastTick(ticks) {
  const order = ["candidate", "humanized", "draft", "researched", "briefed", "scrap"];
  return order.find((id) => ticks[id]) || "";
}

export function cardActions(card) {
  if (card.running) {
    return [{ id: "wait", label: "Esteira rodando…", to: null, disabled: true }];
  }
  switch (card.column) {
    case "inbox":
      return [{ id: "enqueue", label: "Mandar para a fila", to: "Fila" }];
    case "queued":
      return [{ id: "run", label: "Rodar esteira", to: "Esteira", resume: false }];
    case "in_pipeline":
      return [{ id: "run", label: "Continuar esteira", to: "Gate", resume: true }];
    case "gate": {
      const actions = [];
      if (card.verdict === "BLOQUEAR" || card.verdict === "AJUSTAR") {
        actions.push({ id: "run", label: "Reabrir escrita", to: "Esteira", resume: false, from: "writer" });
      }
      actions.push({ id: "approve", label: "Assinar gate", to: "Aprovado", needsReviewer: true });
      return actions;
    }
    case "approved":
      return [{ id: "publish", label: "Publicar", to: "No ar" }];
    case "published":
      if (card.status === "seed-rewrite" || card.status === "needs_update") {
        return [{ id: "run", label: "Reabrir para atualizar", to: "Esteira", resume: false, from: "strategist" }];
      }
      return [];
    case "out":
      return [{ id: "enqueue", label: "Devolver à fila", to: "Fila" }];
    default:
      return [];
  }
}

export function deriveColumn({ ticks, action, verdict, reviewedBy, publishedStatus, inDestination }) {
  if (publishedStatus === "withdrawn" || action === "nao-escrever") return "out";
  if (inDestination) return "published";
  if (humanReviewedBy(reviewedBy) && (verdict === "APROVAR" || verdict === "pending")) return "approved";
  if (verdict === "APROVAR") return "approved";
  if (ticks.candidate || verdict !== "pending") return "gate";
  if (ticks.briefed || ticks.researched || ticks.draft || ticks.humanized || ticks.scrap) {
    return "in_pipeline";
  }
  return "queued";
}

async function listMd(dir) {
  if (!(await exists(dir))) return [];
  const names = await readdir(dir);
  const out = [];
  for (const name of names) {
    if (!name.endsWith(".md")) continue;
    const abs = path.join(dir, name);
    const info = await stat(abs);
    if (!info.isFile()) continue;
    out.push({ name, abs, raw: await readText(abs) });
  }
  return out;
}

function isStub(text) {
  if (!text || !text.trim()) return true;
  return /aguardando modelo/i.test(text);
}

async function realFile(runDir, file) {
  const text = await readText(path.join(runDir, file));
  return { text, ok: !isStub(text) };
}

function keysOverlap(a, b) {
  for (const x of a) {
    for (const y of b) {
      if (!x || !y) continue;
      if (x === y) return true;
      if (x.length >= 8 && y.length >= 8 && (x.startsWith(y) || y.startsWith(x))) return true;
    }
  }
  return false;
}

export async function inspectRun(runDir, slug = path.basename(runDir), repoRoot = root) {
  const files = (await exists(runDir)) ? await readdir(runDir) : [];
  const ticks = {};
  const bodies = {};
  for (const [id, file] of Object.entries(TICK_FILES)) {
    if (!files.includes(file)) {
      ticks[id] = false;
      bodies[id] = "";
      continue;
    }
    const { text, ok } = await realFile(runDir, file);
    ticks[id] = ok;
    bodies[id] = text;
  }
  const brief = bodies.briefed || "";
  const candidate = bodies.candidate || "";
  const gate = files.includes("05-gate.md") ? await readText(path.join(runDir, "05-gate.md")) : "";
  let scoreText = "";
  for (const file of SCORE_FILES) {
    if (files.includes(file)) scoreText += `\n${await readText(path.join(runDir, file))}`;
  }
  const fields = { ...parseFields(brief), ...parseFields(candidate) };
  const prev = await readJson(path.join(runDir, "meta.json"));
  const scores = parseScores(scoreText);
  const gateVerdict = parseVerdict(gate);
  const scoreVerdict = parseVerdict(scoreText);
  const verdict =
    gateVerdict !== "pending" ? gateVerdict : scoreVerdict !== "pending" ? scoreVerdict : prev.verdict || "pending";
  const reviewedBy = humanReviewedBy(fields.reviewedBy || prev.reviewedBy);
  const action = fields.action || prev.action || "";
  const pilotoKb = /piloto KB/i.test(brief);
  const destCandidates = [
    path.join(repoRoot, "content/published", `${slug}.md`),
    path.join(repoRoot, "content/medium", `${slug}.md`),
    path.join(repoRoot, "content/newsletter", `${slug}.md`),
  ];
  let destRaw = "";
  for (const dest of destCandidates) {
    if (await exists(dest)) {
      destRaw = await readText(dest);
      break;
    }
  }
  const destFields = parseFields(destRaw);
  const inDestination = Boolean(destRaw);
  const artifacts = files.filter((name) => name !== "meta.json").sort();
  const lociFile = await readJson(path.join(runDir, "07-loci.json"));
  const lociCount = Array.isArray(lociFile.items) ? lociFile.items.length : 0;
  const meta = {
    slug,
    topic: prev.topic || fields.topic || slug,
    title: fields.title || prev.title || prev.topic || slug,
    keyword: fields.keyword || prev.keyword || "",
    keyword_status: fields.keyword_status || prev.keyword_status || "none",
    channel: fields.channel || prev.channel || "blog",
    type: fields.type || prev.type || "",
    origin: fields.origin || prev.origin || "",
    author: fields.author || prev.author || "",
    takeaway: fields.takeaway || prev.takeaway || "",
    action,
    priority: prev.priority || "",
    seo_timing: fields.seo_timing || prev.seo_timing || "",
    pillar: fields.pillar || prev.pillar || "",
    sourceUrl: prev.sourceUrl || prev.competitorNorth || "",
    ticks,
    stage: lastTick(ticks),
    artifacts,
    lociCount,
    scores,
    verdict,
    reviewedBy,
    pilotoKb,
    status: destFields.status || fields.status || prev.status || (inDestination ? "published" : "draft"),
    running: stillRunning(prev),
    runPid: stillRunning(prev) ? prev.runPid || 0 : 0,
    runStartedAt: stillRunning(prev) ? prev.runStartedAt || "" : "",
    createdAt: prev.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
  meta.column = deriveColumn({
    ticks,
    action,
    verdict,
    publishedStatus: meta.status,
    reviewedBy,
    inDestination,
  });
  return meta;
}

async function readJson(abs) {
  try {
    return JSON.parse(await readFile(abs, "utf8"));
  } catch {
    return {};
  }
}

export async function writeRunMeta(runDir, patch = {}, repoRoot = root) {
  await mkdir(runDir, { recursive: true });
  const slug = patch.slug || path.basename(runDir);
  const derived = await inspectRun(runDir, slug, repoRoot);
  const prev = await readJson(path.join(runDir, "meta.json"));
  const meta = {
    ...prev,
    ...derived,
    ...patch,
    ticks: derived.ticks,
    stage: derived.stage,
    artifacts: derived.artifacts,
    scores: derived.scores,
    verdict: patch.verdict || derived.verdict,
    column: patch.column || derived.column,
    topic: patch.topic || prev.topic || derived.topic,
    keyword: patch.keyword || derived.keyword || prev.keyword || "",
    type: patch.type || derived.type || prev.type || "",
    origin: patch.origin || derived.origin || prev.origin || "",
    channel: patch.channel || derived.channel || prev.channel || "blog",
    createdAt: prev.createdAt || derived.createdAt || nowIso(),
    updatedAt: nowIso(),
    running: Object.hasOwn(patch, "running") ? Boolean(patch.running) : Boolean(derived.running),
  };
  if (patch.action === "nao-escrever") {
    meta.action = "nao-escrever";
    meta.column = "out";
  }
  await writeFile(path.join(runDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
  return meta;
}

const LOCUS_KINDS = {
  fato: "Fato",
  voz: "Voz",
  norma: "Norma",
  formato: "Formato",
  canal: "Canal",
  corte: "Corte",
};

const PREVIEW_SOURCES = [
  ["candidate", "04-publish-candidate.md", "Candidato de publicação"],
  ["humanized", "03-humanized.md", "Texto humanizado"],
  ["draft", "02-draft.md", "Rascunho do redator"],
];

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function splitMarkdown(raw) {
  const text = String(raw || "");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { fields: parseFields(text), body: text.trim() };
  return { fields: parseFields(text), body: match[2].replace(/^\s+/, "").trim() };
}

function stripLeadingTitle(body, title) {
  if (!body || !title) return body;
  const lines = body.split("\n");
  if (lines[0]?.startsWith("# ") && slugify(lines[0].slice(2)) === slugify(title)) {
    return lines.slice(1).join("\n").trim();
  }
  return body;
}

function replaceMarkdownBody(raw, body, date) {
  const match = String(raw || "").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  let fm = match ? match[1] : `title: ""\nstatus: "draft"`;
  const line = `dateModified: ${JSON.stringify(date)}`;
  if (/^dateModified\s*:/m.test(fm)) fm = fm.replace(/^dateModified\s*:.*$/m, line);
  else fm += `\n${line}`;
  return `---\n${fm}\n---\n\n${String(body || "").trim()}\n`;
}

function assertContentPath(abs, repoRoot) {
  const rel = path.relative(repoRoot, abs).replaceAll("\\", "/");
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Caminho fora do repo.");
  }
  if (!/^(content\/(runs|published|medium|newsletter))\//.test(rel)) {
    throw new Error("Só edita arquivo de conteúdo.");
  }
  return rel;
}

async function resolvePreviewFile(card, repoRoot) {
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  for (const [key, file, label] of PREVIEW_SOURCES) {
    const abs = path.join(runDir, file);
    const raw = await readText(abs);
    if (raw && !isStub(raw)) {
      return { key, label, abs, rel: path.relative(repoRoot, abs).replaceAll("\\", "/"), raw };
    }
  }
  const dests = [
    path.join(repoRoot, "content/published", `${card.slug}.md`),
    path.join(repoRoot, "content/medium", `${card.slug}.md`),
    path.join(repoRoot, "content/newsletter", `${card.slug}.md`),
  ];
  for (const abs of dests) {
    const raw = await readText(abs);
    if (raw) {
      return {
        key: "published",
        label: "Versão no ar",
        abs,
        rel: path.relative(repoRoot, abs).replaceAll("\\", "/"),
        raw,
      };
    }
  }
  const abs = path.join(runDir, "04-publish-candidate.md");
  return {
    key: "candidate",
    label: "Candidato de publicação",
    abs,
    rel: path.relative(repoRoot, abs).replaceAll("\\", "/"),
    raw: "",
  };
}

function renderLociMarkdown(id, items) {
  if (!items.length) return "";
  const lines = [
    `# Apontamentos do gate — #${id}`,
    "",
    "Corrigir cada trecho citado. Não inventar fato para fechar o apontamento. Não promover informe a opinião.",
    "",
  ];
  for (const item of items) {
    lines.push(`## ${LOCUS_KINDS[item.kind] || item.kind}`);
    lines.push(`> ${String(item.quote || "").replace(/\s+/g, " ")}`);
    lines.push("");
    lines.push(item.note);
    lines.push("");
  }
  return lines.join("\n");
}

async function lociState(runDir) {
  const data = await readJson(path.join(runDir, "07-loci.json"));
  return Array.isArray(data.items) ? data.items : [];
}

async function persistLoci(runDir, id, items, repoRoot) {
  await mkdir(runDir, { recursive: true });
  await writeFile(path.join(runDir, "07-loci.json"), `${JSON.stringify({ items }, null, 2)}\n`);
  const md = renderLociMarkdown(id, items);
  const mdPath = path.join(runDir, "07-loci.md");
  if (md) await writeFile(mdPath, md);
  else {
    try {
      await writeFile(mdPath, "");
    } catch {
      /* ignore */
    }
  }
  await writeRunMeta(runDir, { slug: path.basename(runDir), id, lociCount: items.length }, repoRoot);
  return items;
}

export async function inspectPreview(id, repoRoot = root) {
  const card = await findById(id, repoRoot);
  if (!card) return null;
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  const file = await resolvePreviewFile(card, repoRoot);
  const { fields, body } = splitMarkdown(file.raw);
  const title = fields.title || card.title;
  const loci = card.slug ? await lociState(runDir) : [];
  const columnLabel =
    { inbox: "Inbox", queued: "Fila", in_pipeline: "Esteira", gate: "Gate", approved: "Aprovado", published: "No ar", out: "Fora" }[
      card.column
    ] || card.column;
  const cleaned = stripLeadingTitle(body, title)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n---\s*$/g, "")
    .trim();
  return {
    card: { ...card, actions: cardActions(card), lociCount: loci.length },
    source: file.key,
    sourceLabel: file.raw ? file.label : "Sem texto ainda",
    sourceRel: file.rel,
    liveEdit: file.key === "published",
    editable: Boolean(card.slug),
    fields,
    title,
    description: fields.description || fields.dek || card.takeaway || "",
    pillar: fields.pillar || card.pillar || "acesso",
    body: cleaned,
    editBody: body,
    loci,
    liveHref: card.href || "",
    columnLabel,
  };
}

export async function savePreview(id, body, repoRoot = root) {
  const card = await findById(id, repoRoot);
  if (!card) return { ok: false, error: `Não achei a peça #${id}.` };
  if (card.running) return { ok: false, error: "Esteira rodando; espera terminar para editar." };
  const text = String(body ?? "");
  if (!text.trim()) return { ok: false, error: "Não salva texto vazio." };
  if (text.length > 400000) return { ok: false, error: "Texto grande demais." };
  const file = await resolvePreviewFile(card, repoRoot);
  const rel = assertContentPath(file.abs, repoRoot);
  await mkdir(path.dirname(file.abs), { recursive: true });
  const date = todayISO();
  let raw = file.raw;
  if (!raw) {
    raw = `---\ntitle: ${JSON.stringify(card.title || card.topic || card.slug)}\nslug: ${JSON.stringify(card.slug)}\npillar: ${JSON.stringify(card.pillar || "acesso")}\nchannel: ${JSON.stringify(card.channel || "blog")}\nstatus: "draft"\n---\n\n`;
  }
  await writeFile(file.abs, replaceMarkdownBody(raw, text, date));
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  if (file.key !== "published") {
    await writeRunMeta(runDir, { slug: card.slug, id: card.id }, repoRoot);
  }
  return {
    ok: true,
    message: file.key === "published" ? `Salvo no ar (${rel}).` : `Salvo em ${rel}.`,
    liveEdit: file.key === "published",
  };
}

function plainBlock(text) {
  return String(text || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function unwrapStrong(block, q) {
  const whole = block.match(/^\*\*([\s\S]*)\*\*$/);
  if (whole) return whole[1];
  return block.replace(/\*\*([^*]+)\*\*/g, (all, inner) => {
    const plain = plainBlock(inner);
    return plain === q || plain.includes(q) ? inner : all;
  });
}

function unwrapEm(block, q) {
  return block.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, (all, prefix, inner) => {
    const plain = plainBlock(inner);
    return plain === q || plain.includes(q) ? `${prefix}${inner}` : all;
  });
}

function stripFormatInBlock(source, quote, op) {
  const q = String(quote || "").replace(/\s+/g, " ").trim();
  if (q.length < 8) return { next: source, changed: false };
  const blocks = String(source || "").split(/\n{2,}/);
  let changed = false;
  const next = blocks.map((block) => {
    if (!plainBlock(block).includes(q)) return block;
    let out = block;
    if (op === "unwrap-strong") out = unwrapStrong(block, q);
    if (op === "unwrap-em") out = unwrapEm(out, q);
    if (op === "unwrap-heading") out = out.replace(/^#{1,6}\s+/, "");
    if (out !== block) changed = true;
    return out;
  });
  return { next: next.join("\n\n"), changed };
}

export async function formatPreview(id, { quote, op }, repoRoot = root) {
  const allowed = new Set(["unwrap-strong", "unwrap-em", "unwrap-heading"]);
  if (!allowed.has(op)) return { ok: false, error: "Operação de formato inválida." };
  const preview = await inspectPreview(id, repoRoot);
  if (!preview) return { ok: false, error: `Não achei a peça #${id}.` };
  const { next, changed } = stripFormatInBlock(preview.editBody || preview.body, quote, op);
  if (!changed) {
    return {
      ok: false,
      error:
        op === "unwrap-strong"
          ? "Neste markdown o trecho já está sem negrito. Se a tela ainda pesa, era a abertura da mesa — recarregue."
          : "Neste markdown o trecho já está sem essa marca.",
    };
  }
  return savePreview(id, next, repoRoot);
}

export async function addLocus(id, { kind, quote, note, block }, repoRoot = root) {
  const card = await findById(id, repoRoot);
  if (!card) return { ok: false, error: `Não achei a peça #${id}.` };
  const k = String(kind || "").toLowerCase();
  if (!LOCUS_KINDS[k]) return { ok: false, error: "Tipo de apontamento inválido." };
  const q = String(quote || "").replace(/\s+/g, " ").trim();
  const n = String(note || "").trim();
  if (q.length < 8) return { ok: false, error: "Selecione um trecho maior." };
  if (!n) return { ok: false, error: "Diga o que precisa mudar." };
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  const items = await lociState(runDir);
  items.push({
    id: `l${Date.now().toString(36)}`,
    kind: k,
    quote: q.slice(0, 500),
    note: n.slice(0, 2000),
    block: Number.isFinite(Number(block)) ? Number(block) : -1,
    createdAt: nowIso(),
  });
  await persistLoci(runDir, card.id, items, repoRoot);
  return { ok: true, message: "Apontamento gravado.", items };
}

export async function removeLocus(id, locusId, repoRoot = root) {
  const card = await findById(id, repoRoot);
  if (!card) return { ok: false, error: `Não achei a peça #${id}.` };
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  const items = (await lociState(runDir)).filter((item) => item.id !== locusId);
  await persistLoci(runDir, card.id, items, repoRoot);
  return { ok: true, message: "Apontamento removido.", items };
}

export async function clearLoci(id, repoRoot = root) {
  const card = await findById(id, repoRoot);
  if (!card) return { ok: false, error: `Não achei a peça #${id}.` };
  const runDir = path.join(repoRoot, "content/runs", card.slug);
  await persistLoci(runDir, card.id, [], repoRoot);
  return { ok: true, message: "Apontamentos limpos.", items: [] };
}

function parseQueueTables(raw) {
  const items = [];
  if (!raw) return items;
  const lines = raw.split("\n");
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 7) continue;
    if (/^-{2,}/.test(cells[0]) || /prioridade/i.test(cells[0])) continue;
    const [priority, action, origin, topic, keyword, type, channel, why] = cells;
    if (!/^P[0-3]$/i.test(priority)) continue;
    if (keyword !== "(depois)" && (/^\(/.test(keyword) || /^\(/.test(topic))) continue;
    if (/^demais\s+\d+/i.test(topic)) continue;
    items.push({
      priority: priority.toUpperCase(),
      action,
      origin,
      topic,
      keyword: keyword === "(depois)" ? "" : keyword,
      type,
      channel,
      why: why || "",
    });
  }
  return items;
}

function parseInbox(raw) {
  const items = [];
  if (!raw) return items;
  const blocks = raw.split(/\n(?=-\s)/);
  for (const block of blocks) {
    if (!/^\s*-\s+(topic|id):/m.test(block) && !block.includes("topic:")) continue;
    if (block.trim().startsWith("#")) continue;
    const fields = parseFields(block.replace(/^\s*#\s?/gm, ""));
    if (!fields.topic) continue;
    items.push({
      topic: fields.topic,
      origin: fields.origin || "humano",
      type: fields.type || "",
      channel: fields.channel || "",
      note: fields.note || "",
    });
  }
  return items;
}

function emptyTicks() {
  return {
    scrap: false,
    briefed: false,
    researched: false,
    draft: false,
    humanized: false,
    candidate: false,
  };
}

function makeCard(partial) {
  const ticks = partial.ticks || emptyTicks();
  const keyword = partial.keyword || "";
  const topic = partial.topic || partial.title || partial.slug || "";
  const slug = partial.slug || slugify(keyword || topic);
  return {
    slug,
    title: partial.title || topic || slug,
    topic,
    keyword,
    keyword_status: partial.keyword_status || "none",
    type: partial.type || "",
    channel: partial.channel || "blog",
    origin: partial.origin || "",
    priority: partial.priority || "",
    action: partial.action || "",
    pillar: partial.pillar || "",
    takeaway: partial.takeaway || "",
    column: partial.column || "inbox",
    stage: partial.stage || lastTick(ticks),
    ticks,
    scores: partial.scores || { factual: null, editorial: null, seo: null, ranking: null },
    verdict: partial.verdict || "pending",
    reviewedBy: partial.reviewedBy || "",
    status: partial.status || "",
    listed: partial.listed !== false,
    from: partial.from || [],
    artifacts: partial.artifacts || [],
    why: partial.why || "",
    pilotoKb: Boolean(partial.pilotoKb),
    href: partial.href || "",
    keys: identityKeys({ slug, keyword, topic }),
    id: partial.id || null,
    running: Boolean(partial.running),
    runStartedAt: partial.runStartedAt || "",
    lociCount: Number(partial.lociCount) || 0,
  };
}

function mergeCard(base, extra) {
  const prefer = (a, b) => (a && String(a).trim() ? a : b);
  const extraTicks = extra.ticks || {};
  const ticks = { ...emptyTicks(), ...base.ticks };
  for (const [id, on] of Object.entries(extraTicks)) {
    if (on) ticks[id] = true;
  }
  const scores = { ...base.scores };
  for (const key of ["factual", "editorial", "seo", "ranking"]) {
    if (extra.scores?.[key] != null) scores[key] = extra.scores[key];
  }
  const from = [...new Set([...(base.from || []), ...(extra.from || [])])];
  const keys = [...new Set([...(base.keys || []), ...(extra.keys || [])])];
  const columnRank = ["inbox", "queued", "in_pipeline", "gate", "approved", "published", "out"];
  const column =
    columnRank.indexOf(extra.column) > columnRank.indexOf(base.column) ? extra.column : base.column;
  const verdict =
    extra.verdict && extra.verdict !== "pending"
      ? extra.verdict
      : base.verdict && base.verdict !== "pending"
        ? base.verdict
        : extra.verdict || base.verdict || "pending";
  return {
    ...base,
    slug: base.from?.includes("run") ? base.slug : extra.from?.includes("run") ? extra.slug : prefer(base.slug, extra.slug),
    title: prefer(base.title, extra.title),
    topic: prefer(base.topic, extra.topic),
    keyword: prefer(base.keyword, extra.keyword),
    type: prefer(base.type, extra.type),
    origin: prefer(base.origin, extra.origin),
    priority: prefer(base.priority, extra.priority),
    takeaway: prefer(base.takeaway, extra.takeaway),
    reviewedBy: prefer(base.reviewedBy, extra.reviewedBy),
    href: prefer(base.href, extra.href),
    channel: prefer(base.channel, extra.channel),
    action: prefer(base.action, extra.action),
    why: prefer(base.why, extra.why),
    status: prefer(base.status, extra.status),
    ticks,
    scores,
    from,
    keys,
    column,
    verdict,
    stage: lastTick(ticks) || extra.stage || base.stage,
    listed: Boolean(base.listed || extra.listed),
    pilotoKb: Boolean(base.pilotoKb && extra.pilotoKb),
    artifacts: [...new Set([...(base.artifacts || []), ...(extra.artifacts || [])])],
    id: base.id || extra.id || null,
    running: Boolean(base.running || extra.running),
    runStartedAt: prefer(base.runStartedAt, extra.runStartedAt),
    lociCount: Math.max(Number(base.lociCount) || 0, Number(extra.lociCount) || 0),
  };
}

function findByKeys(cards, keys) {
  if (!keys.length) return -1;
  return cards.findIndex((card) => keysOverlap(card.keys, keys));
}

export async function loadPipeline(repoRoot = root) {
  return JSON.parse(await readFile(path.join(repoRoot, "agents", "pipeline.json"), "utf8"));
}

export async function collectBoard(repoRoot = root, { write = true } = {}) {
  const pipeline = await loadPipeline(repoRoot);
  const columns = pipeline.workflow.columns;
  const cards = [];

  const add = (partial) => {
    const card = makeCard(partial);
    const idx = findByKeys(cards, card.keys);
    if (idx >= 0) cards[idx] = mergeCard(cards[idx], card);
    else cards.push(card);
  };

  for (const [channel, rel] of Object.entries(pipeline.channelRoots || { blog: pipeline.publishRoot })) {
    const dir = path.join(repoRoot, rel);
    for (const file of await listMd(dir)) {
      const fields = parseFields(file.raw);
      const slug = fields.slug || file.name.replace(/\.md$/, "");
      const status = fields.status || "published";
      add({
        slug,
        title: fields.title || slug,
        topic: fields.title || slug,
        keyword: fields.keyword || "",
        keyword_status: "locked",
        type: fields.type || "",
        channel,
        origin: fields.origin || "",
        pillar: fields.pillar || "",
        status,
        reviewedBy: humanReviewedBy(fields.reviewedBy),
        column: status === "withdrawn" ? "out" : "published",
        listed: true,
        from: ["published"],
        href: fields.pillar ? `/${fields.pillar}/${slug}` : "",
        ticks: { ...emptyTicks(), candidate: true, humanized: true, draft: true, briefed: true },
      });
    }
  }

  const runsDir = path.join(repoRoot, pipeline.artifactRoot || "content/runs");
  if (await exists(runsDir)) {
    for (const name of await readdir(runsDir)) {
      if (name.startsWith(".")) continue;
      const runDir = path.join(runsDir, name);
      const info = await stat(runDir);
      if (!info.isDirectory()) continue;
      const meta = write
        ? await writeRunMeta(runDir, { slug: name }, repoRoot)
        : await inspectRun(runDir, name, repoRoot);
      const tickCount = Object.values(meta.ticks || {}).filter(Boolean).length;
      const listed =
        tickCount > 0 &&
        (!meta.pilotoKb || meta.ticks.researched || meta.ticks.draft || meta.verdict !== "pending");
      add({
        ...meta,
        title: meta.title || meta.topic || name,
        listed,
        from: ["run"],
        column: meta.column === "queued" && tickCount > 0 ? "in_pipeline" : meta.column,
      });
    }
  }

  const queueRaw = await readText(path.join(repoRoot, "content/opportunities/queue.md"));
  for (const item of parseQueueTables(queueRaw)) {
    add({
      slug: slugify(item.keyword || item.topic),
      title: item.topic,
      topic: item.topic,
      keyword: item.keyword,
      type: item.type,
      channel: item.channel,
      origin: item.origin,
      priority: item.priority,
      action: item.action,
      why: item.why,
      column: item.action === "nao-escrever" ? "out" : "queued",
      listed: true,
      from: ["queue"],
    });
  }

  const inboxRaw = await readText(path.join(repoRoot, "content/opportunities/inbox.md"));
  for (const item of parseInbox(inboxRaw)) {
    add({
      slug: slugify(item.topic),
      title: item.topic,
      topic: item.topic,
      type: item.type,
      channel: item.channel,
      origin: item.origin,
      why: item.note,
      column: "inbox",
      listed: true,
      from: ["inbox"],
    });
  }

  for (const card of cards) {
    if (card.from.includes("queue") && card.from.includes("run") && card.column === "queued") {
      card.column = deriveColumn({
        ticks: card.ticks,
        action: card.action,
        verdict: card.verdict,
        reviewedBy: card.reviewedBy,
        publishedStatus: card.status,
        inDestination: card.from.includes("published"),
      });
    }
    if (card.from.includes("published")) card.column = card.status === "withdrawn" ? "out" : "published";
    if (card.from.includes("run") && !card.from.includes("queue") && !card.from.includes("published") && card.pilotoKb && !card.ticks.researched && card.verdict === "pending") {
      card.listed = false;
    }
    if (card.from.includes("queue") || card.from.includes("published") || card.from.includes("inbox")) {
      card.listed = true;
    }
    if (write && card.from.includes("run") && card.priority) {
      const runDir = path.join(runsDir, card.slug);
      if (await exists(runDir)) {
        await writeRunMeta(runDir, { slug: card.slug, priority: card.priority }, repoRoot);
      }
    }
  }

  const ledger = assignIds(cards, await loadLedger(repoRoot));
  await saveLedger(repoRoot, ledger);

  if (write) {
    for (const card of cards) {
      if (!card.from.includes("run") || !card.id) continue;
      const runDir = path.join(runsDir, card.slug);
      if (await exists(runDir)) {
        await writeRunMeta(runDir, { slug: card.slug, id: card.id }, repoRoot);
      }
    }
  }

  const visible = cards.filter((card) => card.listed);
  const hidden = cards.filter((card) => !card.listed);
  const counts = Object.fromEntries(columns.map((col) => [col.id, visible.filter((c) => c.column === col.id).length]));
  counts.orphan = hidden.length;
  counts.total = visible.length;

  visible.sort((a, b) => {
    const p = String(a.priority || "P9").localeCompare(String(b.priority || "P9"));
    if (p) return p;
    return a.title.localeCompare(b.title, "pt-BR");
  });

  for (const card of [...visible, ...hidden]) {
    card.actions = cardActions(card);
  }

  return { columns, cards: visible, orphans: hidden, counts, scores: pipeline.workflow.scores, ticks: pipeline.workflow.ticks };
}

function argvValue(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : "";
}

function printCard(card) {
  console.log(`#${card.id}  ${card.title}`);
  console.log(`coluna ${card.column}  ${card.priority || "sem P"}  ${card.type || "—"}  ${card.origin || "—"}`);
  console.log(`slug   ${card.slug}`);
  if (card.keyword) console.log(`query  ${card.keyword} (${card.keyword_status || "none"})`);
  if (card.verdict && card.verdict !== "pending") console.log(`gate   ${card.verdict}`);
  const ticks = Object.entries(card.ticks || {})
    .filter(([, on]) => on)
    .map(([id]) => id);
  console.log(`ticks  ${ticks.join(" → ") || "—"}`);
  const next = (card.actions || []).filter((item) => !item.disabled);
  if (next.length) {
    console.log(`Botão:    ${next.map((item) => (item.to ? `${item.label} → ${item.to}` : item.label)).join(" · ")}`);
  }
  console.log(`\nRodar:     ${agentCommand(card.id)}`);
  console.log(`No chat:   trabalha o #${card.id}`);
  console.log(`Quadro:    /esteira#${card.id}`);
  console.log(`Leitura:   /esteira/${card.id}`);
}

async function main() {
  const wanted = parsePieceId(argvValue("id")) || parsePieceId(process.argv.slice(2).find((a) => parsePieceId(a)));
  const board = await collectBoard(root);
  const snapshot = {
    generatedAt: nowIso(),
    counts: board.counts,
    cards: board.cards.map((card) => ({
      id: card.id,
      slug: card.slug,
      column: card.column,
      title: card.title,
      type: card.type,
      origin: card.origin,
      priority: card.priority,
      verdict: card.verdict,
      scores: card.scores,
      stage: card.stage,
    })),
  };
  const out = path.join(root, "content/opportunities/board.json");
  await writeFile(out, `${JSON.stringify(snapshot, null, 2)}\n`);
  if (process.argv.includes("--json")) {
    const payload = wanted
      ? [...board.cards, ...board.orphans].find((card) => card.id === wanted) || null
      : board.counts;
    console.log(JSON.stringify(payload));
    return;
  }
  if (wanted) {
    const card = [...board.cards, ...board.orphans].find((item) => item.id === wanted);
    if (!card) {
      console.error(`Não achei a peça #${wanted}. Rode npm run esteira para listar.`);
      process.exit(1);
    }
    printCard(card);
    return;
  }
  console.log("Esteira — peças visíveis por coluna\n");
  for (const col of board.columns) {
    console.log(`  ${col.label.padEnd(10)} ${String(board.counts[col.id]).padStart(3)}  ${col.id}`);
  }
  console.log(`  ${"Órfãos".padEnd(10)} ${String(board.counts.orphan).padStart(3)}  scrap/piloto KB sem fila`);
  console.log(`\nTotal no quadro: ${board.counts.total}\n`);
  console.log("  #   Coluna      Pri  Título");
  for (const card of [...board.cards].sort((a, b) => a.id - b.id)) {
    const col = (board.columns.find((item) => item.id === card.column)?.label || card.column).padEnd(10);
    console.log(`  ${String(card.id).padStart(3)}  ${col}  ${(card.priority || "—").padEnd(3)}  ${card.title}`);
  }
  console.log(`\nDetalhe:  npm run esteira -- 12`);
  console.log(`Rodar:    npm run agent -- --id 12`);
  console.log("Kanban:   /esteira  (npm run dev)");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
