/**
 * Substitui o bloco "## Sobre o blog" pelo canônico de web/src/lib/authors.ts
 * em content/published e em cada content/runs/<slug>/04-publish-candidate.md
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const ABOUT = `## Sobre o blog

O Tudo Sobre Cannabis é um veículo editorial sobre cannabis: ciência, regulação, mercado, política e cultura, editado por [@fpamplona](https://www.instagram.com/fpamplona/). Dr. Fabricio Pamplona é farmacêutico, doutor em Farmacologia pela UFSC e trabalha com canabinoides há mais de duas décadas, entre pesquisa científica, educação e liderança de empresas da área. Assina o editorial do Tudo Sobre Cannabis e a [newsletter homônima no Substack](https://tudosobrecannabis.substack.com/).

---

*Este texto é informativo e não substitui consulta médica nem orientação jurídica. A autorização da Anvisa é uma etapa do processo de acesso, não o processo completo.*`;

function replaceAbout(raw) {
  const match = raw.match(/^##\s+Sobre o blog\s*$/im);
  if (!match || match.index == null) {
    // Se não há bloco, tenta inserir antes de <!-- seo ou no fim (antes do último HTML comment)
    const seo = raw.match(/\n<!--\s*seo[\s\S]*$/i);
    if (seo && seo.index != null) {
      return `${raw.slice(0, seo.index).trimEnd()}\n\n${ABOUT}\n${raw.slice(seo.index)}`;
    }
    return `${raw.trimEnd()}\n\n${ABOUT}\n`;
  }
  const before = raw.slice(0, match.index).trimEnd();
  const after = raw.slice(match.index);
  const seo = after.match(/\n<!--\s*seo[\s\S]*$/i);
  if (seo && seo.index != null) {
    return `${before}\n\n${ABOUT}\n${after.slice(seo.index)}`;
  }
  return `${before}\n\n${ABOUT}\n`;
}

const files = [];
const publishedDir = path.join(root, "content/published");
for (const name of readdirSync(publishedDir)) {
  if (name.endsWith(".md")) files.push(path.join(publishedDir, name));
}
const runsDir = path.join(root, "content/runs");
for (const slug of readdirSync(runsDir)) {
  const candidate = path.join(runsDir, slug, "04-publish-candidate.md");
  if (existsSync(candidate)) files.push(candidate);
}

let changed = 0;
for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const next = replaceAbout(raw);
  if (next !== raw) {
    writeFileSync(file, next);
    changed += 1;
    console.log("ok", path.relative(root, file));
  }
}
console.log(`Atualizados: ${changed}/${files.length}`);
