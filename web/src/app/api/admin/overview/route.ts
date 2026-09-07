import { NextResponse } from "next/server";
import { isAdminAuthenticated, adminPasswordConfigured } from "@/lib/admin-auth";
import { buildAdminDashboard } from "@/lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (adminPasswordConfigured() && !(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, data: await buildAdminDashboard() });
}
