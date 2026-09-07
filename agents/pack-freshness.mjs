#!/usr/bin/env node
/**
 * Detecta packs/briefs com normas defasadas conhecidas.
 *
 *   npm run esteira:pack-check
 *   npm run esteira:pack-check -- --fix-autorizacao   # só reporta; pack #1 já tem correção manual
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { root } from "./board.mjs";

const BAD_PATTERNS = [
  {
    id: "rdc-1015-wrong-year",
    re: /1015\/2025|1\.015\/2025|RDC 1015\/2025/i,
    // Ignora linhas que só documentam o erro / proíbem o uso
    allow: /erroneamente|nunca escrever|ano errado|use RDC 1\.015\/2026|supersedes|falso \(ano|pack anterior|corrigido após|não escrever/i,
    message: "Ano errado: use RDC 1.015/2026 (DOU 02/02/2026).",
  },
  {
    id: "1015-replaces-660",
    re: /1\.?015.{0,60}(?<!n[aã]o\s)(?<!sem\s)substitui.{0,40}660|1015.{0,60}(?<!n[aã]o\s)(?<!sem\s)substitui.{0,40}660/i,
    allow: /n[aã]o substitui|sem substituir|falso:|revoga 327|nunca dizer que/i,
    message: "Falso: 1.015/2026 revoga 327/2019; não substitui a 660/2022.",
  },
];

async function scanFile(rel) {
  const abs = path.join(root, rel);
  let text = "";
  try {
    text = await readFile(abs, "utf8");
  } catch {
    return [];
  }
  /** @type {{ file: string, id: string, message: string, line: number }[]} */
  const hits = [];
  const lines = text.split("\n");
  for (const rule of BAD_PATTERNS) {
    lines.forEach((line, i) => {
      if (!rule.re.test(line)) return;
      if (rule.allow && rule.allow.test(line)) return;
      hits.push({ file: rel, id: rule.id, message: rule.message, line: i + 1 });
    });
  }
  return hits;
}

async function main() {
  const runsDir = path.join(root, "content/runs");
  const slugs = (await readdir(runsDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name);

  /** @type {Awaited<ReturnType<typeof scanFile>>} */
  let all = [];
  for (const slug of slugs) {
    // Só artefatos vivos; drafts velhos (02/03) ficam no inventário histórico
    for (const name of ["00-brief.md", "01-research-pack.md", "04-publish-candidate.md"]) {
      all = all.concat(await scanFile(path.join("content/runs", slug, name)));
    }
  }
  for (const name of await readdir(path.join(root, "content/published"))) {
    if (name.endsWith(".md")) {
      all = all.concat(await scanFile(path.join("content/published", name)));
    }
  }

  const byFile = new Map();
  for (const hit of all) {
    if (!byFile.has(hit.file)) byFile.set(hit.file, []);
    byFile.get(hit.file).push(hit);
  }

  const report = [
    `# Pack freshness check`,
    "",
    `Gerado: ${new Date().toISOString()}`,
    `Arquivos com alerta: ${byFile.size}`,
    `Ocorrências: ${all.length}`,
    "",
    all.length === 0
      ? "Nenhum padrão conhecido (1015/2025 ou 1.015 substitui 660)."
      : [...byFile.entries()]
          .map(([file, hits]) => {
            const lines = hits.map((h) => `  - L${h.line} [${h.id}] ${h.message}`).join("\n");
            return `## ${file}\n${lines}`;
          })
          .join("\n\n"),
    "",
    "Inventário de rechecagem: `content/runs/_batch/PACK-STALE-INVENTORY.md`",
    "",
  ].join("\n");

  const out = path.join(root, "content/runs/_batch/pack-freshness-report.md");
  await writeFile(out, report);
  console.log(report);
  console.log(`\nWrote ${out}`);
  if (all.length) process.exitCode = 2;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
