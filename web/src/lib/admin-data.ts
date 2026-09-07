import fs from "node:fs";
import path from "node:path";
import { getArticles, getPageviews } from "./content";
import { canSyncGoogleAnalytics } from "./analytics-google";
import { syncAnalyticsSnapshots } from "./analytics-sync";

function repoRoot() {
  const cwd = process.cwd();
  return cwd.endsWith(`${path.sep}web`) || cwd.endsWith("/web") ? path.join(cwd, "..") : cwd;
}

function readJson<T>(rel: string, fallback: T): T {
  const file = path.join(repoRoot(), rel);
  if (!fs.existsSync(/* turbopackIgnore: true */ file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

type GscQuery = {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  page?: string;
};

type GscPage = {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
};

type GaKpis = {
  sessions: number;
  users: number;
  pageviews: number;
  engagedSessions: number;
  avgEngagementSec: number;
  bounceRate: number;
};

type HubRow = {
  id: string;
  keyword: string;
  topic: string;
  pillar: string;
  impact_score: number;
};

function parseHubsFromYaml(limit = 40): HubRow[] {
  const file = path.join(repoRoot(), "content/opportunities/library-hubs.yaml");
  if (!fs.existsSync(/* turbopackIgnore: true */ file)) return [];
  const raw = fs.readFileSync(/* turbopackIgnore: true */ file, "utf8");
  const blocks = raw.split(/\n- id:/).slice(1);
  const rows: HubRow[] = [];
  for (const block of blocks) {
    if (rows.length >= limit) break;
    const id = block.match(/^\s*([^\s\n]+)/)?.[1]?.trim() || "";
    const keyword = block.match(/\n\s*keyword:\s*"([^"]+)"/)?.[1] || "";
    const topic = block.match(/\n\s*topic:\s*"([^"]+)"/)?.[1] || keyword;
    const pillar = block.match(/\n\s*pillar:\s*([^\s\n]+)/)?.[1] || "";
    const impact = Number(block.match(/\n\s*impact_score:\s*([0-9.]+)/)?.[1] || 0);
    if (!id || !keyword) continue;
    rows.push({ id, keyword, topic, pillar, impact_score: impact });
  }
  return rows.sort((a, b) => b.impact_score - a.impact_score);
}

function normalizeKw(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function buildAdminDashboard(opts?: { forceSync?: boolean }) {
  let syncMeta: {
    attempted: boolean;
    ok: boolean;
    skipped?: boolean;
    reason?: string;
    errors: string[];
  } = { attempted: false, ok: false, errors: [] };

  if (canSyncGoogleAnalytics()) {
    syncMeta.attempted = true;
    try {
      const result = await syncAnalyticsSnapshots({ force: opts?.forceSync });
      syncMeta = {
        attempted: true,
        ok: result.ok || Boolean(result.skipped),
        skipped: result.skipped,
        reason: result.reason,
        errors: result.errors,
      };
    } catch (err) {
      syncMeta.errors = [err instanceof Error ? err.message : String(err)];
    }
  }

  const articles = getArticles();
  const views = getPageviews();
  const gsc = readJson<{
    updatedAt?: string;
    periodDays?: number;
    source?: string;
    queries?: GscQuery[];
    pages?: GscPage[];
  }>("content/analytics/gsc-snapshot.json", {});
  const ga = readJson<{
    updatedAt?: string;
    periodDays?: number;
    source?: string;
    propertyLabel?: string;
    kpis?: GaKpis;
    channels?: { channel: string; sessions: number; share: number }[];
    topPages?: { path: string; pageviews: number; avgEngagementSec: number }[];
  }>("content/analytics/ga-snapshot.json", {});
  const competitorsFile = readJson<{
    competitors?: {
      id: string;
      name: string;
      url: string;
      role: string;
      watch: string[];
    }[];
  }>("content/analytics/competitors.json", { competitors: [] });

  const publishedKeywords = new Set(
    articles.map((a) => normalizeKw(a.keyword)).filter(Boolean),
  );
  const publishedSlugs = new Set(articles.map((a) => a.slug));

  const hubs = parseHubsFromYaml(50);
  const keywordGaps = hubs
    .filter((h) => !publishedSlugs.has(h.id) && !publishedKeywords.has(normalizeKw(h.keyword)))
    .slice(0, 12)
    .map((h) => ({
      keyword: h.keyword,
      topic: h.topic,
      pillar: h.pillar,
      impact: h.impact_score,
      reason: "Hub prioritário na biblioteca (KB) ainda sem URL no ar",
    }));

  const lowCtr = (gsc.queries || [])
    .filter((q) => q.impressions >= 80 && q.ctr < 0.04)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);

  const competitorIdeas = (competitorsFile.competitors || []).flatMap((c) =>
    (c.watch || []).map((kw) => {
      const covered =
        publishedKeywords.has(normalizeKw(kw)) ||
        articles.some((a) => normalizeKw(a.title).includes(normalizeKw(kw)));
      return {
        competitor: c.name,
        competitorUrl: c.url,
        role: c.role,
        keyword: kw,
        covered,
        suggestion: covered
          ? "Já há peça próxima no ar — monitorar SERP e atualizar"
          : "Oportunidade: concorrente/SERP vigia esta query e ainda não há hub TSC",
      };
    }),
  );

  const contentByPillar = articles.reduce<Record<string, number>>((acc, a) => {
    acc[a.pillar] = (acc[a.pillar] || 0) + 1;
    return acc;
  }, {});

  const topContent = [...articles]
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      pillar: a.pillar,
      keyword: a.keyword,
      href: `/${a.pillar}/${a.slug}`,
      views: views[a.slug] ?? 0,
      datePublished: a.datePublished,
    }))
    .sort((a, b) => b.views - a.views || b.datePublished.localeCompare(a.datePublished))
    .slice(0, 10);

  const live =
    (ga.source || "").includes("api") || (gsc.source || "").includes("api");

  return {
    generatedAt: new Date().toISOString(),
    lookerUrl: process.env.LOOKER_STUDIO_URL?.trim() || "",
    liveSite: process.env.SITE_URL || "https://tudosobrecannabis.com",
    sync: {
      ...syncMeta,
      canSync: canSyncGoogleAnalytics(),
    },
    dataNotes: {
      ga: ga.source || "seed",
      gsc: gsc.source || "seed",
      pageviews: "content/analytics/pageviews.json",
      live,
    },
    inventory: {
      published: articles.length,
      pillars: contentByPillar,
      withKeyword: articles.filter((a) => a.keyword).length,
    },
    ga: {
      updatedAt: ga.updatedAt || "",
      periodDays: ga.periodDays || 28,
      propertyLabel: ga.propertyLabel || "",
      kpis: ga.kpis || {
        sessions: 0,
        users: 0,
        pageviews: 0,
        engagedSessions: 0,
        avgEngagementSec: 0,
        bounceRate: 0,
      },
      channels: ga.channels || [],
      topPages: ga.topPages || [],
    },
    gsc: {
      updatedAt: gsc.updatedAt || "",
      periodDays: gsc.periodDays || 28,
      queries: (gsc.queries || []).slice(0, 20),
      pages: (gsc.pages || []).slice(0, 15),
      lowCtr,
    },
    topContent,
    keywordGaps,
    competitors: competitorsFile.competitors || [],
    competitorIdeas: competitorIdeas.sort((a, b) => Number(a.covered) - Number(b.covered)),
    esteiraNote:
      "Esteira (/esteira) e admin (/admin) são só localhost. Com service account Google, o painel sincroniza GA4+GSC sozinho.",
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof buildAdminDashboard>>;
