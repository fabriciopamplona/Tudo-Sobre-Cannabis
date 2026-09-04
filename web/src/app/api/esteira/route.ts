import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { formatPreview, mutateLoci, savePreview } from "@/lib/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function repoRoot() {
  const cwd = process.cwd();
  return cwd.endsWith(`${path.sep}web`) || cwd.endsWith("/web") ? path.join(cwd, "..") : cwd;
}

function isLocal(request: Request) {
  const host = (request.headers.get("host") || "").split(":")[0].replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

type Body = {
  id?: number | string;
  action?: string;
  reviewer?: string;
  credential?: string;
  kind?: string;
  quote?: string;
  note?: string;
  block?: number;
  locusId?: string;
  body?: string;
  op?: string;
};

export async function POST(request: Request) {
  if (!isLocal(request)) {
    return NextResponse.json({ ok: false, error: "Só no localhost." }, { status: 403 });
  }
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  if (!body?.id || !body?.action) {
    return NextResponse.json({ ok: false, error: "id e action obrigatórios." }, { status: 400 });
  }
  if (body.action === "locus" || body.action === "locus-remove" || body.action === "locus-clear") {
    const result = await mutateLoci(body.action, body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }
  if (body.action === "save") {
    const result = await savePreview(body.id, body.body || "");
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }
  if (body.action === "format") {
    const result = await formatPreview(body.id, { quote: body.quote, op: body.op });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }
  const args = [
    path.join(repoRoot(), "agents", "actions.mjs"),
    "--json",
    "--id",
    String(body.id),
    "--action",
    String(body.action),
  ];
  if (body.reviewer) args.push("--reviewer", body.reviewer);
  if (body.credential) args.push("--credential", body.credential);
  try {
    const { stdout } = await execFileAsync(process.execPath, args, {
      cwd: repoRoot(),
      env: process.env,
      timeout: 60_000,
    });
    const result = JSON.parse(stdout.trim() || '{"ok":false,"error":"Sem resposta."}');
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    const fail = err as { stdout?: string; stderr?: string; message?: string };
    if (fail.stdout) {
      try {
        const result = JSON.parse(String(fail.stdout).trim());
        return NextResponse.json(result, { status: 400 });
      } catch {
        /* fall through */
      }
    }
    const error = String(fail.stderr || fail.message || "Falha ao executar a ação.").trim();
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
}
