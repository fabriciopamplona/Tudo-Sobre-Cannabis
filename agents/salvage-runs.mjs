#!/usr/bin/env node
import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

function unwrapArtifact(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const fences = [...raw.matchAll(/```(?:markdown|md|yaml)?\n([\s\S]*?)```/gi)];
  if (fences.length) {
    const best = fences.map((m) => m[1].trim()).sort((a, b) => b.length - a.length)[0];
    if (best && best.length >= Math.min(400, Math.floor(raw.length * 0.4))) return best;
  }
  const starts = [];
  const fm = raw.search(/^---\s*$/m);
  if (fm >= 0) starts.push(fm);
  const research = raw.search(/^#\s+Research pack/im);
  if (research >= 0) starts.push(research);
  if (starts.length) {
    const start = Math.min(...starts);
    if (start > 0 && start < raw.length * 0.5) return raw.slice(start).trim();
  }
  return raw;
}

function stripFake(text) {
  return text.replace(
    /^reviewedBy:\s*["']?(Redação.*|modelo|AI|Claude|GPT).*["']?\s*$/gim,
    'reviewedBy: ""',
  );
}

function isNoise(text) {
  const body = text.trim();
  if (body.length < 400) return true;
  const head = body.slice(0, 1200).toLowerCase();
  const noise = /sem permissão|não tenho permissão|websearch|autorizar o|não posso gravar|write ainda/.test(
    head,
  );
  if (!noise) return false;
  return !/^---/m.test(body) && !/^#\s+research pack/im.test(body);
}

const slugs = [
  "cannabis-medicinal-ansiedade",
  "cannabis-medicinal-dor-cronica",
  "cannabis-medicinal-insonia",
  "cannabis-medicinal-autismo",
  "cannabis-medicinal-cancer-paliativo",
  "cannabis-medicinal-esclerose-multipla",
];
const files = ["01-research-pack.md", "02-draft.md", "03-humanized.md", "04-publish-candidate.md"];

const bad = [];
for (const slug of slugs) {
  for (const f of files) {
    const p = path.join("content/runs", slug, f);
    try {
      const raw = await readFile(p, "utf8");
      const cleaned = stripFake(unwrapArtifact(raw));
      if (isNoise(cleaned) || cleaned.length < 400) {
        await writeFile(`${p}.bad`, raw);
        await unlink(p);
        bad.push(`# ${slug}/${f}`);
        console.log(`BAD-REMOVED ${slug}/${f} (${cleaned.length}b)`);
      } else if (cleaned !== raw.trim()) {
        await writeFile(p, cleaned.endsWith("\n") ? cleaned : `${cleaned}\n`);
        console.log(`FIXED ${slug}/${f} ${raw.length}->${cleaned.length}`);
      } else {
        console.log(`OK ${slug}/${f} ${cleaned.length}`);
      }
    } catch {
      console.log(`MISS ${slug}/${f}`);
    }
  }
}
console.log(JSON.stringify({ badCount: bad.length, bad }, null, 2));
