import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * /esteira é painel interno (localhost). Em produção:
 * - sem ESTEIRA_BASIC_USER/PASS → 404 (não listar a esteira no domínio público)
 * - com user/pass → Basic Auth (acesso raro / staging)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isEsteira =
    pathname === "/esteira" ||
    pathname.startsWith("/esteira/") ||
    pathname === "/api/esteira" ||
    pathname.startsWith("/api/esteira/");

  if (!isEsteira) return NextResponse.next();

  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].replace(/^\[|\]$/g, "");
  const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  if (local) return NextResponse.next();

  const user = process.env.ESTEIRA_BASIC_USER || "";
  const pass = process.env.ESTEIRA_BASIC_PASS || "";
  if (!user || !pass) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const i = decoded.indexOf(":");
      const u = i >= 0 ? decoded.slice(0, i) : decoded;
      const p = i >= 0 ? decoded.slice(i + 1) : "";
      if (u === user && p === pass) return NextResponse.next();
    } catch {
      /* fall through */
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Esteira TSC"' },
  });
}

export const config = {
  matcher: ["/esteira", "/esteira/:path*", "/api/esteira", "/api/esteira/:path*"],
};
