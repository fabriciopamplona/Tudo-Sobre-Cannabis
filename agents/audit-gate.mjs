#!/usr/bin/env node
/**
 * Auditoria + melhoria das peças no Gate.
 *
 *   npm run esteira:audit
 *   npm run esteira:audit -- --ids 6,7,8
 *   npm run esteira:audit -- --phase audit|improve|reaudit|all|serp|gate-prep|finish
 *
 * Gera:
 *   content/runs/<slug>/06-scores.md
 *   content/runs/<slug>/06-audit.json
 *   content/runs/<slug>/07-serp-review.md   (phase serp|finish)
 *   content/runs/<slug>/05-gate-prep.md     (phase gate-prep|finish)
 *   content/runs/_batch/audit-report.md
 */
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectBoard, nowIso, parsePieceId, root, writeRunMeta } from "./board.mjs";

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

async function exists(abs) {
  try {
    await access(abs);
    return true;
  } catch {
    return false;
  }
}

async function loadOptional(rel) {
  try {
    return await readFile(path.join(root, rel), "utf8");
  } catch {
    return "";
  }
}

function log(logPath, line) {
  const text = `[${nowIso()}] ${line}`;
  console.log(line);
  appendFileSync(logPath, `${text}\n`);
}

function spawnClaude(args, stdinPayload) {
  const bin = process.env.CLAUDE_CLI || "claude";
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: root, env: { ...process.env } });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d.toString();
    });
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude exit ${code}: ${(err || out).slice(0, 800)}`));
        return;
      }
      resolve(out.trim());
    });
    child.stdin.write(stdinPayload);
    child.stdin.end();
  });
}

async function completeClaude(system, user) {
  const model = process.env.CLAUDE_CLI_MODEL || "sonnet";
  const stamp = `${Date.now()}-${process.pid}`;
  const sysFile = path.join(os.tmpdir(), `tsc-audit-sys-${stamp}.md`);
  const contract = `CONTRATO:
- Sem ferramentas. Sem pedir Write/WebSearch.
- Sua resposta É o artefato pedido.
- Sem preâmbulo, sem \`\`\`markdown wrapper.
- Não invente fato. Não invente DOI. Use só o que está nos artefatos.
- Nunca preencha reviewedBy com Redação/modelo.`;
  await writeFile(sysFile, `${contract}\n\n---\n\n${system}`);
  try {
    return await spawnClaude(
      ["-p", "--tools", "", "--model", model, "--output-format", "text", "--system-prompt-file", sysFile],
      user,
    );
  } finally {
    await writeFile(sysFile, "").catch(() => {});
  }
}

function unwrapJson(text) {
  const raw = String(text || "").trim();
  const fence = raw.match(/```(?:json)?\n([\s\S]*?)```/);
  const body = fence ? fence[1].trim() : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("JSON não encontrado na saída");
  return JSON.parse(body.slice(start, end + 1));
}

function unwrapMarkdown(text) {
  const raw = String(text || "").trim();
  const fence = raw.match(/```(?:markdown|md)\n([\s\S]*?)```/i);
  if (fence?.[1]) return fence[1].trim();
  const fm = raw.search(/^---\s*$/m);
  if (fm > 0) return raw.slice(fm).trim();
  return raw;
}

function scoresMd(audit, phase) {
  const s = audit.scores || {};
  return `# Scores — ${phase}

- factual: ${s.factual ?? "—"}
- editorial: ${s.editorial ?? "—"}
- seo: ${s.seo ?? "—"}
- ranking: ${s.ranking ?? "—"}

## Veredicto sugerido
${audit.verdict || "pending"}

## Diagnóstico
${audit.diagnosis || "—"}

## Melhorias propostas
${(audit.improvements || []).map((item, i) => `${i + 1}. ${item}`).join("\n") || "—"}

## SEO
${audit.seo_notes || "—"}

## Riscos factuais
${(audit.factual_risks || []).map((item) => `- ${item}`).join("\n") || "- nenhum listado"}
`;
}

const AUDIT_SYSTEM = `Você é o auditor editorial do Tudo Sobre Cannabis (pt-BR).
Avalie o candidato a publicação. Não reescreva a peça nesta etapa.

## Hierarquia de verdade (obrigatória)

1. Fonte primária **com URL** citada no candidato (DOU, gov.br/Anvisa, Planalto, DOI) prevalece.
2. Research pack só manda se estiver \`pack_status: synced\` **ou** se a claim do candidato **não** tiver URL primária.
3. Se brief/pack e candidato **divergirem** em número/ano de norma / revogação:
   - e o candidato aponta URL DOU/gov.br coerente → trate como **PACK STALE** (pecado do pack, não do texto). Não derrube factual por isso.
   - e o candidato afirma sem URL e o pack marca [LACUNA] → aí sim risco factual no candidato.
4. Pack com [LACUNA] **não** prova que o dado é inventado se o candidato cite a fonte primária que fecha a lacuna. Anote: "fechar lacuna no pack" como melhoria de processo, sem BLOQUEAR só por isso.
5. Nunca use o brief como oráculo normativo se o pack synced ou a URL do candidato corrigirem o brief.

## Critérios (0–10)
- factual: claims com fonte/nível de evidência; conclusão ≤ dados; sem cultivo ilegal; norma/estudo nomeados **com URL quando regulação**
- editorial: voz TSC (não portal de paciente, não Brascann/Sechat); type respeitado (informe hub pode ser longo se REFERENCE-FORMAT); sem IA óbvia; abertura/fecho limpos
- seo: title≤60 se possível; description 150–160; slug; keyword honesta; **links internos no corpo**; sem stuffing; FAQ só se o texto responde; imagem/capa quando hub; fecho Leituras + Sobre o blog; title≠H1 quando houver headline
- ranking: 0 se factual < 7; senão combinação de factual+editorial+seo on-page

Veredicto sugerido: APROVAR | AJUSTAR | BLOQUEAR
- BLOQUEAR: factual < 7 ou risco legal/claim terapêutico inventado (não por pack stale)
- AJUSTAR: dá para publicar depois de correções listadas (inclui "atualizar pack")
- APROVAR: floors: factual≥8, editorial≥7, seo≥8.5 (meta≥9 no Blog)

Responda SOMENTE JSON:
{
  "scores": { "factual": 0, "editorial": 0, "seo": 0, "ranking": 0 },
  "verdict": "AJUSTAR",
  "diagnosis": "2-4 frases",
  "improvements": ["..."],
  "seo_notes": "...",
  "factual_risks": ["..."],
  "pack_stale": false,
  "must_fix_body": true,
  "must_fix_seo": true
}`;

const IMPROVE_SYSTEM = `Você é editor de qualidade + canal do Tudo Sobre Cannabis.
Recebe candidato + auditoria. Devolve o 04-publish-candidate.md Melhorado.

Regras:
- Preserve a voz TSC. Não vire portal de paciente.
- Não invente fato, DOI, dose, norma ou percentual.
- Se must_fix_body: corrija prosa (clareza, hedges, remova IA, alinhe conclusão aos dados do research pack). Sem inventar evidência.
- Se must_fix_seo: title, dek, description (150–160), slug, keyword/keyword_status, **links internos no corpo** (3–7) + comentário <!-- seo -->, FAQ só se o texto responde; meta seo ≥ 8.5.
- Blog hub: manter ## Leituras relacionadas + ## Sobre o blog; sem em-dash na prosa.
- Ilustras: se já houver paths WebP, preserve Figura:/![]; senão deixe <!-- illustrations --> com prompts (texto na arte = pt-BR).
- reviewedBy: deixe vazio "".
- datePublished: deixe vazio "" (só o OK humano grava = data de aprovação/publicação).
- dateModified: use a data de hoje America/Sao_Paulo (YYYY-MM-DD).
- Mantém type/channel/origin/takeaway fiéis ao brief.
- Resposta = arquivo markdown completo (frontmatter + corpo + comentário seo se blog).`;

async function auditCard(card, docs) {
  const slug = card.slug;
  let candidate = await loadOptional(`content/runs/${slug}/04-publish-candidate.md`);
  const published = await loadOptional(`content/published/${slug}.md`);
  // Peça já no ar: auditar o publicado completo, não um draft truncado/sync parcial
  if (card.column === "published" && published && published.trim().length > 400) {
    candidate = published;
  }
  const brief = await loadOptional(`content/runs/${slug}/00-brief.md`);
  const research = await loadOptional(`content/runs/${slug}/01-research-pack.md`);
  if (!candidate || /aguardando modelo/i.test(candidate) || candidate.trim().length < 400) {
    return {
      scores: { factual: 0, editorial: 0, seo: 0, ranking: 0 },
      verdict: "BLOQUEAR",
      diagnosis: "Candidato ausente ou stub.",
      improvements: ["Reabrir esteira do researcher/writer."],
      seo_notes: "n/a",
      factual_risks: ["sem texto"],
      must_fix_body: true,
      must_fix_seo: true,
    };
  }
  // Cabeça + cauda: hubs longos perdem FAQ/Leituras se cortar só o início
  const maxBody = 36000;
  let candidateForAudit = candidate;
  if (candidate.length > maxBody) {
    const head = candidate.slice(0, 24000);
    const tail = candidate.slice(-12000);
    candidateForAudit = `${head}\n\n<!-- […] meio omitido só no prompt de auditoria; arquivo completo no disco […] -->\n\n${tail}`;
  }
  const user = [
    `Peça #${card.id}`,
    `Coluna: ${card.column}`,
    `Bytes do texto auditado: ${candidate.length}`,
    "",
    "## REGRA ANTI-FALSO-NEGATIVO",
    "Se o pack/brief disser 1015/2025 ou '1.015 substitui 660' e o candidato disser 1.015/2026 + 660 vigente com links DOU/gov.br, o pack é que está errado (PACK STALE). Não BLOQUEAR o candidato por isso.",
    "Canônico: RDC 1.015/2026 (AS produto; revoga 327/2019; vigor 4/5/2026). RDC 660/2022 (importação PF) permanece no serviço gov.br.",
    "Se o prompt mostrar marcador de meio omitido, NÃO conclua que o texto está truncado no disco — confira se a cauda traz FAQ, Leituras relacionadas e Sobre o blog.",
    "",
    `## BRIEF\n${brief.slice(0, 8000)}`,
    "",
    `## RESEARCH (trecho)\n${research.slice(0, 14000)}`,
    "",
    `## CANDIDATO\n${candidateForAudit}`,
    "",
    `## VOZ (trecho)\n${docs.voice.slice(0, 4000)}`,
    "",
    `## SEO (trecho)\n${docs.seo.slice(0, 3000)}`,
  ].join("\n");
  const raw = await completeClaude(AUDIT_SYSTEM, user);
  const audit = unwrapJson(raw);
  if (audit.scores?.factual != null && audit.scores.factual < 7) {
    audit.scores.ranking = 0;
  }
  return audit;
}

async function improveCard(card, audit, docs) {
  if (audit.verdict === "APROVAR" && !audit.must_fix_body && !audit.must_fix_seo) {
    return { changed: false, reason: "já APROVAR" };
  }
  const slug = card.slug;
  const candidate = await loadOptional(`content/runs/${slug}/04-publish-candidate.md`);
  const brief = await loadOptional(`content/runs/${slug}/00-brief.md`);
  const research = await loadOptional(`content/runs/${slug}/01-research-pack.md`);
  const humanized = await loadOptional(`content/runs/${slug}/03-humanized.md`);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const user = [
    `Peça #${card.id} — melhore o candidato.`,
    `Data de hoje (dateModified): ${today}`,
    `must_fix_body: ${Boolean(audit.must_fix_body)}`,
    `must_fix_seo: ${Boolean(audit.must_fix_seo)}`,
    "",
    `## AUDITORIA\n${JSON.stringify(audit, null, 2)}`,
    "",
    `## BRIEF\n${brief.slice(0, 10000)}`,
    "",
    `## RESEARCH\n${research.slice(0, 12000)}`,
    "",
    `## HUMANIZADO (referência de voz/corpo)\n${(humanized || candidate).slice(0, 16000)}`,
    "",
    `## CANDIDATO ATUAL\n${candidate.slice(0, 18000)}`,
    "",
    `## SEO DOC\n${docs.seo.slice(0, 2500)}`,
  ].join("\n");
  const raw = await completeClaude(IMPROVE_SYSTEM, user);
  let md = unwrapMarkdown(raw);
  if (!/^---\s*$/m.test(md) || md.length < 500) {
    throw new Error("melhoria não trouxe markdown válido");
  }
  md = md.replace(/^reviewedBy:\s*["']?(Redação.*|modelo|AI|Claude|GPT).*["']?\s*$/gim, 'reviewedBy: ""');
  const runDir = path.join(root, "content/runs", slug);
  const candPath = path.join(runDir, "04-publish-candidate.md");
  if (await exists(candPath)) {
    await writeFile(path.join(runDir, "04-publish-candidate.before-audit.md"), candidate);
  }
  await writeFile(candPath, md.endsWith("\n") ? md : `${md}\n`);
  await writeRunMeta(runDir, { slug, id: card.id, lastStage: "seo-editor", auditImproved: true });
  return { changed: true };
}

function avg(nums) {
  const xs = nums.filter((n) => typeof n === "number" && Number.isFinite(n));
  if (!xs.length) return null;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

function reportMd(rows) {
  const before = rows.map((r) => r.before).filter(Boolean);
  const after = rows.map((r) => r.after).filter(Boolean);
  const metric = (key) => {
    const b = avg(before.map((a) => a.scores?.[key]));
    const a = avg(after.map((x) => x.scores?.[key]));
    const delta = b != null && a != null ? Math.round((a - b) * 10) / 10 : null;
    return { b, a, delta };
  };
  const lines = [
    "# Report de auditoria — Gate",
    "",
    `Gerado: ${nowIso()}`,
    `Peças: ${rows.length}`,
    "",
    "## Ganho médio",
    "",
    "| Métrica | Antes | Depois | Δ |",
    "|---|---:|---:|---:|",
  ];
  for (const key of ["factual", "editorial", "seo", "ranking"]) {
    const m = metric(key);
    lines.push(`| ${key} | ${m.b ?? "—"} | ${m.a ?? "—"} | ${m.delta == null ? "—" : (m.delta >= 0 ? "+" : "") + m.delta} |`);
  }
  const vb = Object.fromEntries(
    ["APROVAR", "AJUSTAR", "BLOQUEAR", "pending"].map((v) => [
      v,
      before.filter((a) => (a.verdict || "pending") === v).length,
    ]),
  );
  const va = Object.fromEntries(
    ["APROVAR", "AJUSTAR", "BLOQUEAR", "pending"].map((v) => [
      v,
      after.filter((a) => (a.verdict || "pending") === v).length,
    ]),
  );
  lines.push("", "## Veredictos", "", `| | Antes | Depois |`, `|---|---:|---:|`);
  for (const v of ["APROVAR", "AJUSTAR", "BLOQUEAR", "pending"]) {
    lines.push(`| ${v} | ${vb[v]} | ${va[v]} |`);
  }
  lines.push("", "## Por peça", "", "| # | Título | Fato Δ | Edit Δ | SEO Δ | Antes → Depois |", "|---:|---|---:|---:|---:|---|");
  for (const row of rows.sort((a, b) => a.id - b.id)) {
    const b = row.before?.scores || {};
    const a = row.after?.scores || {};
    const d = (k) =>
      b[k] != null && a[k] != null ? ((a[k] - b[k] >= 0 ? "+" : "") + (Math.round((a[k] - b[k]) * 10) / 10)) : "—";
    lines.push(
      `| ${row.id} | ${(row.title || "").slice(0, 48)} | ${d("factual")} | ${d("editorial")} | ${d("seo")} | ${row.before?.verdict || "—"} → ${row.after?.verdict || "—"} |`,
    );
  }
  lines.push("", "## Notas", "");
  for (const row of rows) {
    if (!row.after?.diagnosis && !row.before?.diagnosis) continue;
    lines.push(`### #${row.id} ${row.title}`);
    lines.push(`- Antes: ${row.before?.diagnosis || "—"}`);
    lines.push(`- Depois: ${row.after?.diagnosis || "—"}`);
    if (row.improved) lines.push(`- Melhoria aplicada: sim`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function serpCard(card, docs) {
  const system = await loadOptional("agents/serp-reviewer/SYSTEM.md");
  const slug = card.slug;
  const candidate = await loadOptional(`content/runs/${slug}/04-publish-candidate.md`);
  const scores = await loadOptional(`content/runs/${slug}/06-scores.md`);
  const brief = await loadOptional(`content/runs/${slug}/00-brief.md`);
  const research = await loadOptional(`content/runs/${slug}/01-research-pack.md`);
  const gate = await loadOptional("agents/gates/seo-serp.md");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const user = [
    `Peça #${card.id} · slug ${slug}`,
    `Data: ${today}`,
    "",
    "Neste modo CLI não há WebSearch. Se não puder afirmar top 5 com evidência nos artefatos (GSC/taxonomia/pack), Veredicto SEO: AJUSTAR e diga que falta busca real (Cursor/agent com tools).",
    "Não invente URLs de SERP.",
    "",
    `## CHECKLIST\n${gate}`,
    "",
    `## SCORES\n${scores.slice(0, 4000)}`,
    "",
    `## BRIEF\n${brief.slice(0, 6000)}`,
    "",
    `## RESEARCH (keyword)\n${research.slice(0, 10000)}`,
    "",
    `## TAXONOMIA\n${docs.taxonomy.slice(0, 8000)}`,
    "",
    `## GSC\n${docs.gsc.slice(0, 6000)}`,
    "",
    `## CANDIDATO\n${candidate.slice(0, 28000)}`,
    "",
    `## SEO\n${docs.seo.slice(0, 4000)}`,
    "",
    "Resposta = arquivo 07-serp-review.md completo.",
  ].join("\n");
  const raw = await completeClaude(system || "Você é o serp-reviewer.", user);
  return raw.replace(/^```(?:markdown|md)?\n?/i, "").replace(/\n?```$/i, "").trim();
}

async function gatePrepCard(card) {
  const system = await loadOptional("agents/gate-prep/SYSTEM.md");
  const slug = card.slug;
  const candidate = await loadOptional(`content/runs/${slug}/04-publish-candidate.md`);
  const scores = await loadOptional(`content/runs/${slug}/06-scores.md`);
  const serp = await loadOptional(`content/runs/${slug}/07-serp-review.md`);
  const brief = await loadOptional(`content/runs/${slug}/00-brief.md`);
  const illus = await loadOptional(`content/runs/${slug}/05-illustrations-spec.md`);
  const checklist = await loadOptional("agents/gates/publish.md");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const user = [
    `Peça #${card.id} · slug ${slug}`,
    `Data: ${today}`,
    "Não preencha reviewedBy. Não publique.",
    "",
    `## CHECKLIST\n${checklist}`,
    "",
    `## SCORES\n${scores.slice(0, 4000)}`,
    "",
    `## SERP\n${serp.slice(0, 6000) || "(ausente)"}`,
    "",
    `## BRIEF\n${brief.slice(0, 5000)}`,
    "",
    `## ILLUSTRATIONS SPEC\n${illus.slice(0, 4000) || "(ausente)"}`,
    "",
    `## CANDIDATO\n${candidate.slice(0, 24000)}`,
    "",
    "Resposta = arquivo 05-gate-prep.md completo.",
  ].join("\n");
  const raw = await completeClaude(system || "Você prepara o gate.", user);
  return raw.replace(/^```(?:markdown|md)?\n?/i, "").replace(/\n?```$/i, "").trim();
}

async function main() {
  const phase = arg("phase", "all"); // audit | improve | reaudit | all | serp | gate-prep | finish
  const ids = parseIds(arg("ids"));
  const logDir = path.join(root, "content/runs/_batch");
  await mkdir(logDir, { recursive: true });
  const stamp = nowIso().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `audit-${stamp}.log`);
  mkdirSync(logDir, { recursive: true });

  const board = await collectBoard(root, { write: true });
  let cards = board.cards.filter((c) => c.column === "gate");
  if (ids.length) {
    const wanted = new Set(ids);
    cards = board.cards.filter((c) => wanted.has(c.id));
  }
  cards = [...cards].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || a.id - b.id,
  );

  log(logPath, `Auditoria Gate — ${cards.length} peça(s) · phase=${phase}`);

  const docs = {
    voice: await loadOptional("docs/EDITORIAL-VOICE.md"),
    seo: await loadOptional("docs/SEO.md"),
    identity: await loadOptional("agents/PROMPT-MESTRE.md"),
    taxonomy: await loadOptional("content/taxonomy.json"),
    gsc: await loadOptional("content/opportunities/search-console.json"),
  };

  const resultsPath = path.join(logDir, `audit-results-${stamp}.json`);
  /** @type {any[]} */
  let rows = [];
  if (phase === "improve" || phase === "reaudit") {
    // tenta carregar último results se --from-results
    const from = arg("from-results");
    if (from) rows = JSON.parse(await readFile(path.join(root, from), "utf8"));
  }

  async function saveAudit(card, audit, label) {
    const runDir = path.join(root, "content/runs", card.slug);
    await mkdir(runDir, { recursive: true });
    await writeFile(path.join(runDir, "06-scores.md"), scoresMd(audit, label));
    await writeFile(path.join(runDir, "06-audit.json"), `${JSON.stringify({ ...audit, phase: label, at: nowIso() }, null, 2)}\n`);
    await writeRunMeta(runDir, {
      slug: card.slug,
      id: card.id,
      verdict: audit.verdict || "pending",
      scores: audit.scores || {},
    });
  }

  if (phase === "audit" || phase === "all") {
    rows = [];
    for (const card of cards) {
      log(logPath, `\n>>> audit #${card.id} ${card.title}`);
      try {
        const audit = await auditCard(card, docs);
        await saveAudit(card, audit, "baseline");
        rows.push({ id: card.id, title: card.title, slug: card.slug, before: audit, after: null, improved: false });
        log(
          logPath,
          `ok audit #${card.id} F${audit.scores?.factual} E${audit.scores?.editorial} S${audit.scores?.seo} → ${audit.verdict}`,
        );
      } catch (err) {
        log(logPath, `falha audit #${card.id}: ${err.message}`);
        rows.push({
          id: card.id,
          title: card.title,
          slug: card.slug,
          before: {
            scores: { factual: 0, editorial: 0, seo: 0, ranking: 0 },
            verdict: "BLOQUEAR",
            diagnosis: err.message,
          },
          after: null,
          improved: false,
          error: String(err.message),
        });
      }
      await writeFile(resultsPath, `${JSON.stringify(rows, null, 2)}\n`);
    }
  }

  if (phase === "improve" || phase === "all") {
    for (const row of rows) {
      if (!row.before) continue;
      const card = cards.find((c) => c.id === row.id) || { id: row.id, title: row.title, slug: row.slug };
      log(logPath, `\n>>> improve #${row.id}`);
      try {
        const result = await improveCard(card, row.before, docs);
        row.improved = Boolean(result.changed);
        log(logPath, result.changed ? `ok improve #${row.id}` : `skip improve #${row.id} (${result.reason})`);
      } catch (err) {
        log(logPath, `falha improve #${row.id}: ${err.message}`);
        row.improveError = err.message;
      }
      await writeFile(resultsPath, `${JSON.stringify(rows, null, 2)}\n`);
    }
  }

  if (phase === "reaudit" || phase === "all") {
    for (const row of rows) {
      const card = cards.find((c) => c.id === row.id) || { id: row.id, title: row.title, slug: row.slug };
      log(logPath, `\n>>> reaudit #${row.id}`);
      try {
        const audit = await auditCard(card, docs);
        await saveAudit(card, audit, "after-improve");
        row.after = audit;
        log(
          logPath,
          `ok reaudit #${row.id} F${audit.scores?.factual} E${audit.scores?.editorial} S${audit.scores?.seo} → ${audit.verdict}`,
        );
      } catch (err) {
        log(logPath, `falha reaudit #${row.id}: ${err.message}`);
        row.after = {
          scores: { factual: 0, editorial: 0, seo: 0, ranking: 0 },
          verdict: "BLOQUEAR",
          diagnosis: err.message,
        };
      }
      await writeFile(resultsPath, `${JSON.stringify(rows, null, 2)}\n`);
    }
  }

  if (phase === "serp" || phase === "finish") {
    for (const card of cards) {
      log(logPath, `\n>>> serp #${card.id} ${card.title}`);
      try {
        const md = await serpCard(card, docs);
        const runDir = path.join(root, "content/runs", card.slug);
        await mkdir(runDir, { recursive: true });
        await writeFile(path.join(runDir, "07-serp-review.md"), `${md.trim()}\n`);
        log(logPath, `ok serp #${card.id} → 07-serp-review.md`);
      } catch (err) {
        log(logPath, `falha serp #${card.id}: ${err.message}`);
      }
    }
  }

  if (phase === "gate-prep" || phase === "finish") {
    for (const card of cards) {
      log(logPath, `\n>>> gate-prep #${card.id} ${card.title}`);
      try {
        const md = await gatePrepCard(card);
        const runDir = path.join(root, "content/runs", card.slug);
        await mkdir(runDir, { recursive: true });
        await writeFile(path.join(runDir, "05-gate-prep.md"), `${md.trim()}\n`);
        log(logPath, `ok gate-prep #${card.id} → 05-gate-prep.md`);
      } catch (err) {
        log(logPath, `falha gate-prep #${card.id}: ${err.message}`);
      }
    }
  }

  if (phase === "serp" || phase === "gate-prep" || phase === "finish") {
    if (!rows.length) {
      console.log(`Fase ${phase} concluída para ${cards.length} peça(s).`);
      return;
    }
  }

  const report = reportMd(rows);
  const reportPath = path.join(logDir, "audit-report.md");
  await writeFile(reportPath, report);
  await writeFile(path.join(logDir, `audit-report-${stamp}.md`), report);
  log(logPath, `\nReport: ${path.relative(root, reportPath)}`);
  console.log(`\n${report}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
