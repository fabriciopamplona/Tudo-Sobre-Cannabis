import { statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type PipelineColumn = {
  id: string;
  label: string;
  description: string;
};

export type ScoreSet = {
  factual: number | null;
  editorial: number | null;
  seo: number | null;
  ranking: number | null;
};

export type Ticks = {
  scrap: boolean;
  briefed: boolean;
  researched: boolean;
  draft: boolean;
  humanized: boolean;
  candidate: boolean;
  illustrations_spec: boolean;
  illustrations_render: boolean;
  quality_audit: boolean;
  serp_locked: boolean;
  gate_prep: boolean;
  published: boolean;
};

export type CardAction = {
  id: string;
  label: string;
  to: string | null;
  disabled?: boolean;
  resume?: boolean;
  from?: string;
  needsReviewer?: boolean;
};

export type BoardCard = {
  id: number;
  slug: string;
  title: string;
  topic: string;
  keyword: string;
  keyword_status: string;
  type: string;
  channel: string;
  origin: string;
  priority: string;
  /** Score interno da KB (library-hubs). Não é volume GSC. */
  impactScore: number | null;
  action: string;
  pillar: string;
  takeaway: string;
  column: string;
  stage: string;
  ticks: Ticks;
  scores: ScoreSet;
  verdict: string;
  reviewedBy: string;
  status: string;
  listed: boolean;
  from: string[];
  artifacts: string[];
  why: string;
  pilotoKb: boolean;
  href: string;
  keys: string[];
  running?: boolean;
  runStartedAt?: string;
  actions?: CardAction[];
  lociCount?: number;
};

export type Locus = {
  id: string;
  kind: string;
  quote: string;
  note: string;
  block: number;
  createdAt: string;
};

export type Preview = {
  card: BoardCard;
  source: string;
  sourceLabel: string;
  sourceRel?: string;
  liveEdit?: boolean;
  editable?: boolean;
  fields: Record<string, string>;
  title: string;
  description: string;
  pillar: string;
  body: string;
  editBody?: string;
  loci: Locus[];
  liveHref: string;
  columnLabel: string;
};

export type Board = {
  columns: PipelineColumn[];
  cards: BoardCard[];
  orphans: BoardCard[];
  counts: Record<string, number>;
  scores: { id: string; label: string }[];
  ticks: { id: string; order: number; artifact: string; agent: string }[];
};

function repoRoot() {
  const cwd = process.cwd();
  return cwd.endsWith(`${path.sep}web`) || cwd.endsWith("/web") ? path.join(cwd, "..") : cwd;
}

async function loadBoardMod() {
  const root = repoRoot();
  const file = path.join(root, "agents", "board.mjs");
  const href = `${pathToFileURL(file).href}?v=${statSync(file).mtimeMs}`;
  return { root, mod: await import(/* webpackIgnore: true */ href) };
}

export async function getBoard(): Promise<Board> {
  const { root, mod } = await loadBoardMod();
  // Sempre recalcula o quadro a partir dos runs — o painel é a fonte de verdade visual.
  return JSON.parse(JSON.stringify(await mod.collectBoard(root, { write: true })));
}

export async function getPreview(id: string | number): Promise<Preview | null> {
  const { root, mod } = await loadBoardMod();
  const data = await mod.inspectPreview(id, root);
  return data ? JSON.parse(JSON.stringify(data)) : null;
}

export async function savePreview(id: number | string, body: string) {
  const { root, mod } = await loadBoardMod();
  return mod.savePreview(id, body, root);
}

export async function formatPreview(id: number | string, payload: { quote?: string; op?: string }) {
  const { root, mod } = await loadBoardMod();
  return mod.formatPreview(id, payload, root);
}

export async function mutateLoci(
  action: "locus" | "locus-remove" | "locus-clear",
  payload: {
    id: number | string;
    kind?: string;
    quote?: string;
    note?: string;
    block?: number;
    locusId?: string;
  },
) {
  const { root, mod } = await loadBoardMod();
  if (action === "locus") {
    return mod.addLocus(payload.id, payload, root);
  }
  if (action === "locus-remove") {
    return mod.removeLocus(payload.id, payload.locusId, root);
  }
  return mod.clearLoci(payload.id, root);
}
