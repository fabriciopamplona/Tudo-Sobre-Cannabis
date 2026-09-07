import fs from "node:fs";
import path from "node:path";
import {
  canSyncGoogleAnalytics,
  fetchGa4Snapshot,
  fetchGscSnapshot,
  type GaSnapshot,
  type GscSnapshot,
} from "./analytics-google";

function repoRoot() {
  const cwd = process.cwd();
  return cwd.endsWith(`${path.sep}web`) || cwd.endsWith("/web") ? path.join(cwd, "..") : cwd;
}

function analyticsDir() {
  return path.join(repoRoot(), "content", "analytics");
}

function ttlMs() {
  const hours = Number(process.env.ADMIN_ANALYTICS_TTL_HOURS || "6");
  return Math.max(0.25, hours) * 60 * 60 * 1000;
}

function readJson<T>(file: string): T | null {
  if (!fs.existsSync(/* turbopackIgnore: true */ file)) return null;
  try {
    return JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")) as T;
  } catch {
    return null;
  }
}

function isFresh(updatedAt: string | undefined) {
  if (!updatedAt) return false;
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < ttlMs();
}

export type SyncResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  ga?: string;
  gsc?: string;
  errors: string[];
};

export async function syncAnalyticsSnapshots(opts?: {
  force?: boolean;
}): Promise<SyncResult> {
  const errors: string[] = [];
  if (!canSyncGoogleAnalytics()) {
    return {
      ok: false,
      skipped: true,
      reason:
        "Faltam credenciais: GOOGLE_SERVICE_ACCOUNT_JSON (ou GOOGLE_APPLICATION_CREDENTIALS) + GA4_PROPERTY_ID + GSC_SITE_URL",
      errors: [],
    };
  }

  const dir = analyticsDir();
  fs.mkdirSync(/* turbopackIgnore: true */ dir, { recursive: true });
  const gaPath = path.join(dir, "ga-snapshot.json");
  const gscPath = path.join(dir, "gsc-snapshot.json");
  const existingGa = readJson<GaSnapshot>(gaPath);
  const existingGsc = readJson<GscSnapshot>(gscPath);

  const gaLive = existingGa?.source === "ga4-api" && isFresh(existingGa.updatedAt);
  const gscLive = existingGsc?.source === "gsc-api" && isFresh(existingGsc.updatedAt);
  if (!opts?.force && gaLive && gscLive) {
    return {
      ok: true,
      skipped: true,
      reason: `Cache fresco (< ${process.env.ADMIN_ANALYTICS_TTL_HOURS || 6}h)`,
      ga: existingGa?.updatedAt,
      gsc: existingGsc?.updatedAt,
      errors: [],
    };
  }

  const periodDays = Number(process.env.ADMIN_ANALYTICS_PERIOD_DAYS || "28");
  let gaUpdated = existingGa?.updatedAt;
  let gscUpdated = existingGsc?.updatedAt;

  if (opts?.force || !gaLive) {
    try {
      const ga = await fetchGa4Snapshot(periodDays);
      fs.writeFileSync(/* turbopackIgnore: true */ gaPath, `${JSON.stringify(ga, null, 2)}\n`);
      gaUpdated = ga.updatedAt;
    } catch (err) {
      errors.push(`GA4: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (opts?.force || !gscLive) {
    try {
      const gsc = await fetchGscSnapshot(periodDays);
      fs.writeFileSync(/* turbopackIgnore: true */ gscPath, `${JSON.stringify(gsc, null, 2)}\n`);
      gscUpdated = gsc.updatedAt;
    } catch (err) {
      errors.push(`GSC: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Atualiza pageviews a partir do top pages GA (slug = último segmento)
  try {
    const ga = readJson<GaSnapshot>(gaPath);
    if (ga?.source === "ga4-api") {
      const views: Record<string, number> = {};
      for (const p of ga.topPages || []) {
        const parts = p.path.split("/").filter(Boolean);
        const slug = parts[parts.length - 1];
        if (slug) views[slug] = Math.round(p.pageviews);
      }
      const pvPath = path.join(dir, "pageviews.json");
      fs.writeFileSync(
        /* turbopackIgnore: true */ pvPath,
        `${JSON.stringify(
          {
            updatedAt: new Date().toISOString().slice(0, 10),
            source: "ga4-api-top-pages",
            note:
              Object.keys(views).length === 0
                ? "GA4 respondeu sem top pages no período (tráfego ainda baixo ou property nova)."
                : "Derivado de top pages GA4 (path → slug).",
            views,
          },
          null,
          2,
        )}\n`,
      );
    }
  } catch (err) {
    errors.push(`pageviews: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    ok: errors.length === 0,
    ga: gaUpdated,
    gsc: gscUpdated,
    errors,
  };
}
