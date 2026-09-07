import { google } from "googleapis";
import type { JWT } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

export function googleCredsConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  );
}

export function analyticsTargetsConfigured() {
  return Boolean(process.env.GA4_PROPERTY_ID?.trim() && process.env.GSC_SITE_URL?.trim());
}

export function canSyncGoogleAnalytics() {
  return googleCredsConfigured() && analyticsTargetsConfigured();
}

function loadCredentials(): object | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      return JSON.parse(raw) as object;
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON inválido (JSON).");
    }
  }
  return null;
}

async function getAuthClient(): Promise<JWT> {
  const credentials = loadCredentials();
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const auth = new google.auth.GoogleAuth({
    ...(credentials ? { credentials } : {}),
    ...(keyFile && !credentials ? { keyFile } : {}),
    scopes: SCOPES,
  });
  const client = (await auth.getClient()) as JWT;
  return client;
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export type GaSnapshot = {
  updatedAt: string;
  periodDays: number;
  source: string;
  propertyLabel: string;
  kpis: {
    sessions: number;
    users: number;
    pageviews: number;
    engagedSessions: number;
    avgEngagementSec: number;
    bounceRate: number;
  };
  channels: { channel: string; sessions: number; share: number }[];
  topPages: { path: string; pageviews: number; avgEngagementSec: number }[];
};

export type GscSnapshot = {
  updatedAt: string;
  periodDays: number;
  property: string;
  source: string;
  queries: {
    query: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    page: string;
  }[];
  pages: {
    page: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  }[];
};

export async function fetchGa4Snapshot(periodDays = 28): Promise<GaSnapshot> {
  const propertyId = process.env.GA4_PROPERTY_ID!.replace(/^properties\//, "").trim();
  const auth = await getAuthClient();
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const start = daysAgoIso(periodDays);
  const end = todayIso();
  const property = `properties/${propertyId}`;

  const [kpisRes, channelRes, pagesRes] = await Promise.all([
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "engagedSessions" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
      },
    }),
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "10",
      },
    }),
    analytics.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "userEngagementDuration" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "15",
      },
    }),
  ]);

  const kpiRow = kpisRes.data.rows?.[0]?.metricValues || [];
  const sessions = Number(kpiRow[0]?.value || 0);
  const users = Number(kpiRow[1]?.value || 0);
  const pageviews = Number(kpiRow[2]?.value || 0);
  const engagedSessions = Number(kpiRow[3]?.value || 0);
  const avgEngagementSec = Number(kpiRow[4]?.value || 0);
  const bounceRate = Number(kpiRow[5]?.value || 0);

  const channels = (channelRes.data.rows || []).map((row) => {
    const s = Number(row.metricValues?.[0]?.value || 0);
    return {
      channel: row.dimensionValues?.[0]?.value || "(not set)",
      sessions: s,
      share: sessions > 0 ? s / sessions : 0,
    };
  });

  const topPages = (pagesRes.data.rows || []).map((row) => {
    const pv = Number(row.metricValues?.[0]?.value || 0);
    const engagementTotal = Number(row.metricValues?.[1]?.value || 0);
    return {
      path: row.dimensionValues?.[0]?.value || "/",
      pageviews: pv,
      avgEngagementSec: pv > 0 ? engagementTotal / pv : 0,
    };
  });

  return {
    updatedAt: new Date().toISOString(),
    periodDays,
    source: "ga4-api",
    propertyLabel: `GA4 properties/${propertyId}`,
    kpis: {
      sessions,
      users,
      pageviews,
      engagedSessions,
      avgEngagementSec,
      bounceRate,
    },
    channels,
    topPages,
  };
}

export async function fetchGscSnapshot(periodDays = 28): Promise<GscSnapshot> {
  const siteUrl = process.env.GSC_SITE_URL!.trim();
  const auth = await getAuthClient();
  const searchconsole = google.searchconsole({ version: "v1", auth });
  const start = daysAgoIso(periodDays);
  const end = todayIso();

  const [queriesRes, pagesRes] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["query"],
        rowLimit: 25,
      },
    }),
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["page"],
        rowLimit: 20,
      },
    }),
  ]);

  const queries = (queriesRes.data.rows || []).map((row) => ({
    query: row.keys?.[0] || "",
    impressions: row.impressions || 0,
    clicks: row.clicks || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
    page: "",
  }));

  const pages = (pagesRes.data.rows || []).map((row) => {
    const full = row.keys?.[0] || "";
    let path = full;
    try {
      path = new URL(full).pathname;
    } catch {
      /* keep */
    }
    return {
      page: path,
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    };
  });

  return {
    updatedAt: new Date().toISOString(),
    periodDays,
    property: siteUrl,
    source: "gsc-api",
    queries,
    pages,
  };
}
