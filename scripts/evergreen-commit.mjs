#!/usr/bin/env node
/**
 * Commit + push de uma peça evergreen recém-publicada.
 * Usado por esteira:evergreen:publish (após cada post) e pelo tick.
 *
 *   node scripts/evergreen-commit.mjs --id 10 --file-slug cannabis-medicinal-sus-plano-saude --run-slug cannabis-medicinal-sus --date 2026-09-16
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function git(args, opts = {}) {
  return spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    ...opts,
  });
}

/** Paths a incluir no commit de um post publicado. */
export function publishedPaths(fileSlug, runSlug = "") {
  const paths = [];
  const file = String(fileSlug || "").trim();
  const run = String(runSlug || file).trim();
  for (const slug of [...new Set([file, run].filter(Boolean))]) {
    const md = path.join("content/published", `${slug}.md`);
    if (existsSync(path.join(root, md))) paths.push(md);
    const illus = path.join("web/public/illustrations", slug);
    if (existsSync(path.join(root, illus))) paths.push(illus);
  }
  return paths;
}

/**
 * @param {{ id: number|string, fileSlug: string, runSlug?: string, datePublished?: string, dry?: boolean }} opts
 */
export function commitAndPushPublished(opts) {
  const id = opts.id;
  const fileSlug = String(opts.fileSlug || "").trim();
  const runSlug = String(opts.runSlug || fileSlug).trim();
  const datePublished = String(opts.datePublished || "").trim();
  if (!fileSlug) return { ok: false, error: "fileSlug obrigatório para commit" };

  const paths = publishedPaths(fileSlug, runSlug);
  if (!paths.length) {
    return { ok: false, error: `Sem arquivos para commit (${fileSlug}).` };
  }

  if (opts.dry) {
    return { ok: true, dry: true, paths, message: `dry-run commit #${id} ${fileSlug}` };
  }

  const add = git(["add", "--", ...paths]);
  if (add.status !== 0) {
    return { ok: false, error: add.stderr || add.stdout || "git add falhou" };
  }

  const staged = git(["diff", "--cached", "--quiet"]);
  if (staged.status === 0) {
    return { ok: true, skipped: true, message: `#${id} nada novo no index (já commitado?)`, paths };
  }

  const when = datePublished ? ` (${datePublished})` : "";
  const msg = `Publish evergreen #${id}${when}.\n\nSlot 08h/13h BRT · datePublished = data do agendamento · fileSlug ${fileSlug}.`;
  const commit = git(["commit", "-m", msg]);
  if (commit.status !== 0) {
    return { ok: false, error: commit.stderr || commit.stdout || "git commit falhou" };
  }

  const push = git(["push", "origin", "HEAD"]);
  if (push.status !== 0) {
    return { ok: false, error: push.stderr || push.stdout || "git push falhou" };
  }

  return {
    ok: true,
    message: `#${id} commit+push ok · ${fileSlug}`,
    paths,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = commitAndPushPublished({
    id: arg("id"),
    fileSlug: arg("file-slug") || arg("fileSlug"),
    runSlug: arg("run-slug") || arg("runSlug"),
    datePublished: arg("date") || arg("datePublished"),
    dry: process.argv.includes("--dry-run"),
  });
  if (!out.ok) {
    console.error(out.error);
    process.exit(1);
  }
  console.log(out.message);
}
