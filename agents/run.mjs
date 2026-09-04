#!/usr/bin/env node
/**
 *   npm run pauta
 *   npm run agent -- --id 12
 *   npm run agent -- --topic "RDC 1015" --keyword "rdc 1015 cannabis" --channel blog --type informe --origin gsc
 *   npm run agent -- --topic "Anvisa publica nota..." --channel blog --type noticia --origin humano
 *   npm run agent -- --topic "..." --url "https://..." --channel blog --origin radar
 *
 * DeepSeek só no scrap (--url → guide.md).
 * Escritura (estrategista → editor) = Claude CLI autenticado (`claude auth login`),
 * depois ANTHROPIC_API_KEY, depois OpenAI. Nunca DeepSeek.
 */
import { mkdir, readFile, writeFile, access, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findById, parsePieceId, writeRunMeta } from "./board.mjs";

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

async function load(rel) {
  return readFile(path.join(root, rel), "utf8");
}

async function loadOptional(rel) {
  try {
    await access(path.join(root, rel));
    return await load(rel);
  } catch {
    return "";
  }
}

async function loadDotenv() {
  try {
    const raw = await readFile(path.join(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    /* sem .env local */
  }
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24000);
}

async function completeDeepseek({ system, user }) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function claudeBin() {
  return process.env.CLAUDE_CLI || "claude";
}

function spawnClaude(args, stdinPayload) {
  const bin = claudeBin();
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      env: { ...process.env },
      cwd: root,
    });
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
      const blob = `${err}\n${out}`;
      if (code !== 0) {
        if (/401|revoked|not logged in|unauthorized/i.test(blob)) {
          reject(
            new Error(
              "Claude CLI: sessão inválida ou token revogado. No terminal: claude auth login --claudeai",
            ),
          );
          return;
        }
        reject(new Error(`claude CLI exit ${code}: ${(err || out).slice(0, 800)}`));
        return;
      }
      resolve(out.trim());
    });
    child.stdin.write(stdinPayload);
    child.stdin.end();
  });
}

async function completeClaudeCli({ system, user }) {
  const model = process.env.CLAUDE_CLI_MODEL || "sonnet";
  const stamp = `${Date.now()}-${process.pid}`;
  const sysFile = path.join(os.tmpdir(), `tsc-claude-sys-${stamp}.md`);
  await writeFile(sysFile, system);
  const base = ["-p", "--model", model, "--output-format", "text"];
  try {
    try {
      return await spawnClaude([...base, "--system-prompt-file", sysFile], user);
    } catch (err) {
      if (!/unknown option|system-prompt-file/i.test(err.message)) throw err;
      return await spawnClaude(base, `SYSTEM:\n${system}\n\nUSER:\n${user}`);
    }
  } finally {
    await unlink(sysFile).catch(() => {});
  }
}

async function completeClaude({ system, user }) {
  try {
    return await completeClaudeCli({ system, user });
  } catch (err) {
    if (err.code === "ENOENT") {
      /* CLI ausente — cai para API */
    } else if (/sessão inválida|token revogado/i.test(err.message)) {
      throw err;
    } else {
      console.warn(`claude CLI: ${err.message}`);
    }
  }

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

async function complete({ system, user, provider }) {
  if (provider === "deepseek") return completeDeepseek({ system, user });
  return completeClaude({ system, user });
}

function stub(stage, ctx) {
  const keyHint =
    stage === "scraper"
      ? "Cole a saída ou rode com DEEPSEEK_API_KEY e --url."
      : "Cole a saída ou rode com Claude CLI autenticado (`claude auth login --claudeai`). Alternativa: ANTHROPIC_API_KEY.";
  return `# ${stage} — aguardando modelo

Tópico: ${ctx.topic || "(fila)"}
Keyword: ${ctx.keyword || "(conteúdo-first — definir depois)"}
Canal: ${ctx.channel || "(definir)"}
Tipo: ${ctx.type || "(definir)"}
Origem: ${ctx.origin || "(definir)"}

${keyHint}
`;
}

function stageProvider(stage) {
  if (stage.provider === "deepseek" || stage.id === "scraper") return "deepseek";
  return "claude";
}

async function runStage(stage, user, ctx, dry) {
  const role = await load(stage.system);
  const system = ctx.identity ? `${ctx.identity}\n\n---\n\n${role}` : role;
  const provider = stageProvider(stage);
  if (dry) return stub(stage.id, ctx);
  let text = null;
  let lastErr = null;
  const pipeline = ctx.pipeline;
  for (let attempt = 0; attempt <= pipeline.maxRetriesPerStage; attempt++) {
    try {
      text = await complete({ system, user, provider });
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`${stage.id} tentativa ${attempt + 1} falhou: ${err.message}`);
    }
  }
  if (text == null && lastErr) throw lastErr;
  return text ?? stub(stage.id, ctx);
}

async function existingBody(runDir, file) {
  try {
    const text = await readFile(path.join(runDir, file), "utf8");
    if (!text.trim() || /aguardando modelo/i.test(text)) return "";
    return text;
  } catch {
    return "";
  }
}

function writeLabel(dry, provider) {
  if (dry) return "dry-run";
  if (provider === "deepseek") {
    return process.env.DEEPSEEK_API_KEY ? "scrap" : "stub";
  }
  return "claude";
}

async function main() {
  await loadDotenv();
  const queueMode = process.argv.includes("--queue");
  const pieceId = parsePieceId(arg("id")) || parsePieceId(process.argv.find((a) => parsePieceId(a) && /^\d+$/.test(a)));
  let topic = arg("topic");
  const sourceUrl = arg("url");
  let keyword = arg("keyword");
  let channel = arg("channel");
  let type = arg("type");
  let origin = arg("origin");
  let slugArg = arg("slug");

  if (!queueMode && pieceId) {
    const card = await findById(pieceId);
    if (!card) {
      console.error(`Não achei a peça #${pieceId}. Rode npm run esteira para listar os números.`);
      process.exit(1);
    }
    topic = topic || card.topic || card.title;
    keyword = keyword || card.keyword;
    channel = channel || card.channel;
    type = type || card.type;
    origin = origin || card.origin;
    slugArg = slugArg || card.slug;
    console.log(`Peça #${pieceId}: ${card.title}`);
  }

  if (!queueMode && !topic) {
    console.error(
      'Uso:\n  npm run pauta\n  npm run agent -- --id 12\n  npm run agent -- --topic "..." [--url "https://..."] [--keyword "..."] [--origin gsc|humano|radar|recencia|tese] [--channel blog|medium|newsletter] [--type informe|noticia|...]',
    );
    process.exit(1);
  }
  const dry = process.argv.includes("--dry-run");
  const resume = process.argv.includes("--resume");
  const fromStage = arg("from");
  const pipeline = JSON.parse(await load("agents/pipeline.json"));
  const taxonomy = await load("content/taxonomy.json");
  const voice = await load("docs/EDITORIAL-VOICE.md");
  const channels = await load("docs/CHANNELS.md");
  const seo = await load("docs/SEO.md");
  const gsc =
    (await loadOptional("content/opportunities/search-console.json")) ||
    (await load("content/opportunities/search-console.example.json"));
  const queue = await loadOptional("content/opportunities/queue.md");
  const inbox = await loadOptional("content/opportunities/inbox.md");
  const sources = await load("content/sources.json");
  const corpus = await load("content/examples/VOICE-CORPUS.md");
  const identity = await load("agents/PROMPT-MESTRE.md");

  const ctx = { topic, keyword, channel, type, origin, pipeline, identity };
  const strategist = pipeline.stages.find((s) => s.id === "strategist");

  if (queueMode) {
    const user = [
      "MODO: fila (portfólio / chefe de redação)",
      `Data: ${nowIso()}`,
      "",
      `TAXONOMIA:\n${taxonomy}`,
      "",
      `SEARCH CONSOLE:\n${gsc}`,
      "",
      `FILA ATUAL:\n${queue || "(vazia)"}`,
      "",
      `INBOX (humano / radar):\n${inbox || "(vazio)"}`,
      "",
      `CANAIS:\n${channels}`,
      "",
      `SEO:\n${seo}`,
      "",
      `VOZ (registros):\n${voice}`,
    ].join("\n");
    const body = await runStage(strategist, user, ctx, dry);
    const out = path.join(root, "content", "opportunities", "queue.md");
    await writeFile(out, body);
    console.log(`${dry ? "dry-run" : writeLabel(false, "claude")}: content/opportunities/queue.md`);
    return;
  }

  const slug = slugArg || arg("slug") || slugify(keyword || topic);
  const runDir = path.join(root, "content", "runs", slug);
  await mkdir(runDir, { recursive: true });
  await writeRunMeta(runDir, {
    slug,
    id: pieceId || undefined,
    topic,
    keyword,
    channel,
    type,
    origin,
    sourceUrl: sourceUrl || undefined,
    running: true,
    runPid: process.pid,
    runStartedAt: nowIso(),
  });

  try {

  const stages = pipeline.stages.filter((s) => {
    if (s.humanRequired) return false;
    if (s.optional && s.id === "scraper" && !sourceUrl) return false;
    return true;
  });
  let previous = "";
  let brief = "";
  let research = "";
  let seenFrom = !fromStage;
  const lociNotes = await loadOptional(`content/runs/${slug}/07-loci.md`);

  for (const stage of stages) {
    if (fromStage && !seenFrom) {
      if (stage.id === fromStage) {
        seenFrom = true;
      } else {
        const skipped = await existingBody(runDir, stage.writes);
        if (skipped) {
          if (stage.id !== "scraper") previous = skipped;
          if (stage.id === "strategist") brief = skipped;
          if (stage.id === "researcher") research = skipped;
        }
        console.log(`pula (--from ${fromStage}): ${stage.id}`);
        continue;
      }
    }

    const already = await existingBody(runDir, stage.writes);
    if (resume && !fromStage && already) {
      if (stage.id !== "scraper") previous = already;
      if (stage.id === "strategist") brief = already;
      if (stage.id === "researcher") research = already;
      console.log(`pula (--resume): ${path.relative(root, path.join(runDir, stage.writes))}`);
      continue;
    }
    let scrapeSource = "";
    if (stage.id === "scraper" && sourceUrl) {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`scrap HTTP ${res.status} em ${sourceUrl}`);
      scrapeSource = htmlToText(await res.text());
    }

    const user = [
      "MODO: peça",
      `Tópico: ${topic}`,
      keyword
        ? `Keyword: ${keyword}`
        : "Keyword: vazia — pauta conteúdo-first; query depois da pesquisa (não recusar a peça)",
      `Slug: ${slug}`,
      channel ? `Canal (humano): ${channel}` : "Canal: o estrategista define",
      type ? `Tipo (humano): ${type}` : "Tipo: o estrategista define",
      origin
        ? `Origem (humano): ${origin}`
        : keyword
          ? "Origem: se não disser o contrário, gsc (keyword veio pronta)"
          : "Origem: humano (topic sem keyword)",
      `Etapa: ${stage.id}`,
      "",
      stage.id === "scraper"
        ? `URL do concorrente (NÃO repetir no HTML público):\n${sourceUrl}\n\nTEXTO EXTRAÍDO:\n${scrapeSource}`
        : "",
      stage.id === "strategist"
        ? `TAXONOMIA:\n${taxonomy}\n\nSEARCH CONSOLE:\n${gsc}\n\nINBOX:\n${inbox || "(vazio)"}\n\nCANAIS:\n${channels}\n\nSEO:\n${seo}\n\nVOZ:\n${voice}`
        : "",
      stage.id === "researcher"
        ? `ALLOWLIST:\n${sources}\n\nTAXONOMIA:\n${taxonomy}\n\nSEARCH CONSOLE (usar só depois dos fatos, para candidatar query):\n${gsc}${
            (await loadOptional(`content/runs/${slug}/guide.md`))
              ? `\n\nGUIA DE COBERTURA (concorrente = norte, não fonte):\n${await loadOptional(`content/runs/${slug}/guide.md`)}`
              : ""
          }`
        : "",
      stage.id === "writer" ? `VOZ:\n${voice}\n\nCANAIS:\n${channels}\n\nCORPUS:\n${corpus}` : "",
      stage.id === "humanizer" ? `VOZ:\n${voice}\n\nCORPUS:\n${corpus}` : "",
      stage.id === "seo-editor"
        ? `CANAIS:\n${channels}\n\nSEO:\n${seo}\n\nTAXONOMIA:\n${taxonomy}\n\nSEARCH CONSOLE:\n${gsc}`
        : "",
      brief && stage.id !== "strategist" && stage.id !== "scraper"
        ? `\n--- BRIEF DO CHEFE DE REDAÇÃO ---\n${brief}`
        : "",
      research && stage.id === "seo-editor" ? `\n--- RESEARCH PACK ---\n${research}` : "",
      previous && stage.id !== "scraper" ? `\n--- ARTEFATO ANTERIOR ---\n${previous}` : "",
      lociNotes && (stage.id === "writer" || stage.id === "humanizer" || stage.id === "seo-editor")
        ? `\n--- APONTAMENTOS DO GATE ---\n${lociNotes}\nCada trecho citado precisa ser resolvido. Não inventar fato para fechar apontamento.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const body = await runStage(stage, user, ctx, dry);
    if (stage.id === "strategist" && /action:\s*nao-escrever/.test(body)) {
      await writeFile(path.join(runDir, stage.writes), body);
      await writeRunMeta(runDir, { slug, topic, keyword, channel, type, origin, action: "nao-escrever" });
      console.log(`parada: estrategista marcou nao-escrever — ${path.relative(root, runDir)}`);
      return;
    }
    await writeFile(path.join(runDir, stage.writes), body);
    await writeRunMeta(runDir, { slug, topic, keyword, channel, type, origin, lastStage: stage.id });
    if (stage.id !== "scraper") previous = body;
    if (stage.id === "strategist") brief = body;
    if (stage.id === "researcher") research = body;
    const provider = stageProvider(stage);
    console.log(
      `${writeLabel(dry, provider)}: ${path.relative(root, path.join(runDir, stage.writes))}`,
    );
  }

    await writeRunMeta(runDir, {
      slug,
      topic,
      keyword,
      channel,
      type,
      origin,
      sourceUrl: sourceUrl || undefined,
      running: false,
      runPid: 0,
    });
    console.log(`\nPauta em content/runs/${slug}/`);
  } finally {
    await writeRunMeta(runDir, { slug, running: false, runPid: 0 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
