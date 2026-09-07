import { NextResponse } from "next/server";
import {
  expectedAdminToken,
  passwordMatches,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }
  if (!process.env.ADMIN_PASSWORD?.trim()) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD não configurada no servidor." },
      { status: 503 },
    );
  }
  if (!passwordMatches(body.password || "")) {
    return NextResponse.json({ ok: false, error: "Senha incorreta." }, { status: 401 });
  }
  const token = await expectedAdminToken();
  const res = NextResponse.json({ ok: true });
  const opts = sessionCookieOptions(token);
  res.cookies.set(opts.name, opts.value, opts);
  return res;
}
