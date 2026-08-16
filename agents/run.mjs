#!/usr/bin/env node
/**
 * Editorial pipeline runner.
 * Usage:
 *   npm run agent -- --topic "CBD na epilepsia" --keyword "cbd epilepsia"
 *   npm run agent -- --topic "..." --keyword "..." --slug "cbd-epilepsia" --dry-run
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function nowIso() {
  return new Date().toISOString();
}

async function complete({ system, user }) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!anthropicKey && !openaiKey) return null;

  if (anthropicKey) {
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.map((b) => b.text).join("\n") ?? "";
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1";
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function stub(stage, topic, keyword) {
  return `# ${stage} — aguardando modelo

Tópico: ${topic}
Keyword: ${keyword}

Este arquivo é o contrato de entrada da etapa. Cole aqui a saída do agente (Cursor ou Replit) ou rode de novo com ANTHROPIC_API_KEY / OPENAI_API_KEY.

Lembrete: fontes só da allowlist em content/sources.json.
`;
}

async function main() {
  const topic = arg("topic");
  const keyword = arg("keyword");
  if (!topic || !keyword) {
    console.error("Uso: npm run agent -- --topic \"...\" --keyword \"...\"");
    process.exit(1);
  }
  const slug = arg("slug") || slugify(keyword);
  const dry = process.argv.includes("--dry-run");
  const runDir = path.join(root, "content", "runs", slug);
  await mkdir(runDir, { recursive: true });

  const pipeline = JSON.parse(await readFile(path.join(root, "agents", "pipeline.json"), "utf8"));
  const sources = await readFile(path.join(root, "content", "sources.json"), "utf8");
  const taxonomy = await readFile(path.join(root, "content", "taxonomy.json"), "utf8");
  const voice = await readFile(path.join(root, "docs", "EDITORIAL-VOICE.md"), "utf8");
  const seo = await readFile(path.join(root, "docs", "SEO.md"), "utf8");

  const stages = pipeline.stages.filter((s) => !s.humanRequired);
  let previous = "";

  for (const stage of stages) {
    const system = await readFile(path.join(root, stage.system), "utf8");
    const user = [
      `Tópico: ${topic}`,
      `Keyword: ${keyword}`,
      `Slug: ${slug}`,
      `Etapa: ${stage.id}`,
      "",
      stage.id === "researcher" ? `ALLOWLIST:\n${sources}\n\nTAXONOMIA:\n${taxonomy}` : "",
      stage.id === "writer" || stage.id === "humanizer" ? `VOZ:\n${voice}` : "",
      stage.id === "seo-editor" ? `SEO:\n${seo}\n\nTAXONOMIA:\n${taxonomy}` : "",
      previous ? `\n--- ARTEFATO ANTERIOR ---\n${previous}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const outPath = path.join(runDir, stage.writes);
    if (dry) {
      await writeFile(outPath, stub(stage.id, topic, keyword));
      previous = await readFile(outPath, "utf8");
      console.log(`dry-run: ${stage.writes}`);
      continue;
    }

    let text = null;
    let lastErr = null;
    for (let attempt = 0; attempt <= pipeline.maxRetriesPerStage; attempt++) {
      try {
        text = await complete({ system, user });
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`${stage.id} tentativa ${attempt + 1} falhou: ${err.message}`);
      }
    }

    if (text == null && lastErr) throw lastErr;
    const body = text ?? stub(stage.id, topic, keyword);
    await writeFile(outPath, body);
    previous = body;
    console.log(`${text ? "ok" : "stub"}: ${path.relative(root, outPath)}`);
  }

  const meta = {
    slug,
    topic,
    keyword,
    createdAt: nowIso(),
    next: "Preencha agents/gates/publish.md e só então copie 04-publish-candidate.md para content/published/",
  };
  await writeFile(path.join(runDir, "meta.json"), JSON.stringify(meta, null, 2));
  console.log(`\nPauta em content/runs/${slug}/`);
  console.log("Publish é humano. Ver agents/gates/publish.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
