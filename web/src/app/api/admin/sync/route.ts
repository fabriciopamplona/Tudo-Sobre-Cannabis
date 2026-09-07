import { NextResponse } from "next/server";
import { isAdminAuthenticated, adminPasswordConfigured } from "@/lib/admin-auth";
import { syncAnalyticsSnapshots } from "@/lib/analytics-sync";
import { canSyncGoogleAnalytics } from "@/lib/analytics-google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (adminPasswordConfigured() && !(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }
  if (!canSyncGoogleAnalytics()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Configure GOOGLE_SERVICE_ACCOUNT_JSON (ou GOOGLE_APPLICATION_CREDENTIALS), GA4_PROPERTY_ID e GSC_SITE_URL no .env.local",
      },
      { status: 503 },
    );
  }
  let force = true;
  try {
    const body = (await request.json()) as { force?: boolean };
    if (body.force === false) force = false;
  } catch {
    /* body opcional */
  }
  const result = await syncAnalyticsSnapshots({ force });
  return NextResponse.json(result);
}
