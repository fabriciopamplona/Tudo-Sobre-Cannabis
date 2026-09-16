#!/usr/bin/env node
/**
 * Preflight local antes de esteira:audit — evita AJUSTAR por SEO on-page óbvio.
 * Usage: node scripts/gate-preflight.mjs --ids 50,51
 *        npm run esteira:gate-preflight -- --ids 50
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PILLARS = new Set(["acesso", "condicoes", "canabinoides", "familia", "regulacao"]);
const BAD_PILLARS = new Set(["ciencia", "informe", "ciencia"]);

function parseIds(argv) {
  const i = argv.indexOf("--ids");
  if (i < 0) return [];
  return String(argv[i + 1] || "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function loadBoardSlugs() {
  const runs = path.join(ROOT, "content/runs");
  const byId = new Map();
  for (const d of fs.readdirSync(runs)) {
    const metaPath = path.join(runs, d, "meta.json");
    if (!fs.existsSync(metaPath)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      if (j.id != null) byId.set(Number(j.id), { dir: d, meta: j });
    } catch {
      /* skip */
    }
  }
  return byId;
}

function fm(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fields: {}, body: raw };
  const fields = {};
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^(\w+):\s*(?:"([^"]*)"|'([^']*)'|(.+))\s*$/);
    if (mm) fields[mm[1]] = (mm[2] ?? mm[3] ?? mm[4] ?? "").trim();
  }
  return { fields, body: raw.slice(m[0].length) };
}

function checkPiece(id, entry) {
  const issues = [];
  const warn = [];
  const dir = path.join(ROOT, "content/runs", entry.dir);
  const candPath = path.join(dir, "04-publish-candidate.md");
  const serpPath = path.join(dir, "07-serp-review.md");
  if (!fs.existsSync(candPath)) {
    issues.push("falta 04-publish-candidate.md");
    return { id, slug: entry.dir, issues, warn };
  }
  const raw = fs.readFileSync(candPath, "utf8");
  const { fields, body } = fm(raw);
  const title = fields.title || entry.meta.title || "";
  const desc = fields.description || "";
  const image = fields.image || "";
  const keyword = (fields.keyword || entry.meta.keyword || "").toLowerCase();

  if (title.length > 60) issues.push(`title ${title.length}c > 60: "${title.slice(0, 50)}…"`);
  if (desc.length < 150 || desc.length > 160) {
    issues.push(`description ${desc.length}c (precisa 150–160)`);
  }
  if (/\[LACUNA/i.test(raw)) issues.push("contém [LACUNA");
  if (raw.includes("—")) issues.push("contém em-dash —");
  if (!image) issues.push("falta image: no frontmatter");
  else {
    const rel = image.replace(/^\//, "");
    const abs = path.join(ROOT, "web/public", rel);
    if (!fs.existsSync(abs)) issues.push(`image ausente em web/public: ${image}`);
  }
  if (!fs.existsSync(serpPath)) issues.push("falta 07-serp-review.md");
  else {
    const serp = fs.readFileSync(serpPath, "utf8");
    if (!/^##?\s*Veredicto SEO:\s*PRONTO\s*$/m.test(serp) && !/^Veredicto SEO:\s*PRONTO\s*$/m.test(serp)) {
      issues.push('07-serp-review.md sem linha "Veredicto SEO: PRONTO"');
    }
  }

  const lead = body.replace(/\s+/g, " ").trim().slice(0, 280).toLowerCase();
  if (keyword) {
    const rawKw = keyword.replace(/\s+/g, " ");
    // flag only if lead dumps keyword as unaccented SEO paste matching locked kw exactly as first hook
    if (new RegExp(`quem (digita|busca) ${rawKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(lead)) {
      warn.push("lead cola keyword crua (estilo 'quem digita <kw>'); prefira pt-BR natural");
    }
  }

  const linkRe = /\]\(\/(acesso|condicoes|canabinoides|familia|regulacao|ciencia|informe)\/[^)]+\)/g;
  let lm;
  while ((lm = linkRe.exec(body))) {
    const pillar = lm[1];
    if (!PILLARS.has(pillar) || BAD_PILLARS.has(pillar)) {
      issues.push(`link com pillar inválido: /${pillar}/…`);
    }
  }

  const imgRe = /!\[[^\]]*\]\((\/illustrations\/[^)\s]+)(?:\s+"[^"]*")?\)/g;
  let im;
  while ((im = imgRe.exec(body))) {
    const p = path.join(ROOT, "web/public", im[1].replace(/^\//, ""));
    if (!fs.existsSync(p)) issues.push(`ilustra no corpo ausente: ${im[1]}`);
  }

  // Review pré-publish: slug do candidato vs pasta do run / meta / fila.
  const fileSlug = String(fields.slug || "").trim();
  const runSlug = String(entry.dir || "").trim();
  const metaSlug = String(entry.meta.slug || "").trim();
  if (!fileSlug) {
    issues.push("pré-publish slug: candidate sem slug no frontmatter");
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fileSlug)) {
    issues.push(`pré-publish slug: formato inválido "${fileSlug}"`);
  } else {
    if (runSlug && fileSlug !== runSlug) {
      warn.push(
        `slug divergente: candidate=${fileSlug} · run=${runSlug} (no publish o arquivo usa o slug do candidato; commit cobre ambos)`,
      );
    }
    if (metaSlug && metaSlug !== fileSlug && metaSlug !== runSlug) {
      warn.push(`meta.slug=${metaSlug} ≠ candidate=${fileSlug}`);
    }
    const queuePath = path.join(ROOT, "content/runs/_batch/evergreen-publish-queue.json");
    if (fs.existsSync(queuePath)) {
      try {
        const q = JSON.parse(fs.readFileSync(queuePath, "utf8"));
        const slot = (q.slots || []).find((s) => Number(s.id) === Number(id));
        if (slot && slot.status !== "published") {
          const qSlug = String(slot.slug || "").trim();
          if (qSlug && qSlug !== fileSlug) {
            warn.push(
              `fila evergreen slug=${qSlug} ≠ candidate=${fileSlug} (publish grava file_slug e commit usa o do candidato)`,
            );
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  return { id, slug: fileSlug || entry.meta.slug || entry.dir, issues, warn };
}

const ids = parseIds(process.argv.slice(2));
if (!ids.length) {
  console.error("Usage: node scripts/gate-preflight.mjs --ids 50,51");
  process.exit(2);
}
const byId = loadBoardSlugs();
let failed = 0;
for (const id of ids) {
  const entry = byId.get(id);
  if (!entry) {
    console.log(`#${id} FAIL  meta.json não encontrado em content/runs/`);
    failed++;
    continue;
  }
  const r = checkPiece(id, entry);
  if (r.issues.length) {
    failed++;
    console.log(`#${id} ${r.slug} FAIL`);
    for (const i of r.issues) console.log(`  - ${i}`);
  } else {
    console.log(`#${id} ${r.slug} OK`);
  }
  for (const w of r.warn || []) console.log(`  ~ ${w}`);
}
if (failed) {
  console.error(`\npreflight: ${failed}/${ids.length} com bloqueio. Corrija antes do audit.`);
  process.exit(1);
}
console.log(`\npreflight: ${ids.length}/${ids.length} ok.`);
