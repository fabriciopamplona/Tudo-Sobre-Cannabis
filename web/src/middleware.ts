import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, tokenMatches } from "@/lib/admin-auth";

function isLocalHost(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].replace(/^\[|\]$/g, "");
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function basicAuthOk(request: NextRequest, user: string, pass: string) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const i = decoded.indexOf(":");
    const u = i >= 0 ? decoded.slice(0, i) : decoded;
    const p = i >= 0 ? decoded.slice(i + 1) : "";
    return u === user && p === pass;
  } catch {
    return false;
  }
}

/**
 * /esteira e /admin — ferramentas internas só em localhost.
 * Em produção: 404 (opcional Basic Auth raro via ESTEIRA_BASIC_* / ADMIN_BASIC_*).
 * Em localhost: /admin pode ainda pedir ADMIN_PASSWORD (cookie) se estiver definida.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const local = isLocalHost(request);

  const isEsteira =
    pathname === "/esteira" ||
    pathname.startsWith("/esteira/") ||
    pathname === "/api/esteira" ||
    pathname.startsWith("/api/esteira/");

  const isAdminApiLogin = pathname === "/api/admin/login";
  const isAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");

  if (isEsteira) {
    if (local) return NextResponse.next();
    const user = process.env.ESTEIRA_BASIC_USER || "";
    const pass = process.env.ESTEIRA_BASIC_PASS || "";
    if (!user || !pass) return new NextResponse("Not Found", { status: 404 });
    if (basicAuthOk(request, user, pass)) return NextResponse.next();
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Esteira TSC"' },
    });
  }

  if (!isAdmin) return NextResponse.next();

  if (!local) {
    const user = process.env.ADMIN_BASIC_USER || "";
    const pass = process.env.ADMIN_BASIC_PASS || "";
    if (!user || !pass) return new NextResponse("Not Found", { status: 404 });
    if (basicAuthOk(request, user, pass)) return NextResponse.next();
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin TSC"' },
    });
  }

  // localhost: formulário de senha opcional
  if (isAdminApiLogin) return NextResponse.next();
  const password = process.env.ADMIN_PASSWORD?.trim() || "";
  if (!password) return NextResponse.next();

  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  if (await tokenMatches(cookie)) return NextResponse.next();
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/esteira",
    "/esteira/:path*",
    "/api/esteira",
    "/api/esteira/:path*",
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
  ],
};
