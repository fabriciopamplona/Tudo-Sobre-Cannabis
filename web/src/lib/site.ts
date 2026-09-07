export type Article = {
  slug: string;
  title: string;
  /** H1 visível; se vazio, usa title. Meta/OG usam title. */
  headline: string;
  pillar: string;
  keyword: string;
  description: string;
  /** Frase-síntese editorial (citação na home). */
  takeaway: string;
  audience: string;
  datePublished: string;
  dateModified: string;
  reviewedBy: string;
  status: string;
  /** Capa pública, ex. /illustrations/<slug>/capa.webp */
  image: string;
  body: string;
};

export type FaqItem = { question: string; answer: string };

const PILLARS: Record<string, { href: string; label: string }> = {
  acesso: { href: "/acesso", label: "Acesso e jornada" },
  condicoes: { href: "/condicoes", label: "Condições" },
  canabinoides: { href: "/canabinoides", label: "Canabinoides" },
  familia: { href: "/familia", label: "Família" },
  regulacao: { href: "/regulacao", label: "Regulação" },
};

export function pillarMeta(id: string) {
  return PILLARS[id] ?? { href: `/${id}`, label: id };
}

export function allPillars() {
  return Object.entries(PILLARS).map(([id, v]) => ({ id, ...v }));
}

export function formatDate(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function readingMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.round(words / 200));
}

export function headingId(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

export function articleHeadings(body: string) {
  return body
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const label = line.slice(3).trim();
      return { id: headingId(label), label };
    });
}

/** Extrai FAQ no formato `**Pergunta?**` + parágrafo seguinte (seção Perguntas frequentes). */
export function extractFaqs(body: string): FaqItem[] {
  const start = body.search(/^##\s+Perguntas frequentes\s*$/im);
  if (start < 0) return [];
  const rest = body.slice(start);
  const endMatch = rest.slice(1).search(/^##\s+/m);
  const section = endMatch >= 0 ? rest.slice(0, endMatch + 1) : rest;
  const items: FaqItem[] = [];
  const re = /\*\*([^*?]+\?)\*\*\s*\n+([\s\S]*?)(?=\n\*\*|\n##\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(section))) {
    const question = match[1].trim();
    const answer = match[2].replace(/\n+/g, " ").trim();
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

/**
 * Remove o bloco `## Sobre o blog` (+ nota) do corpo.
 * O site injeta o expediente canônico via `AuthorExpediente` (`web/src/lib/authors.ts`).
 * Preserva `<!-- seo … -->` e o que vier depois.
 */
export function stripAboutBlogSection(body: string) {
  const match = body.match(/^##\s+Sobre o blog\s*$/im);
  if (!match || match.index == null) return body;
  const before = body.slice(0, match.index).trimEnd();
  const after = body.slice(match.index);
  const seo = after.match(/\n<!--\s*seo[\s\S]*$/i);
  if (seo && seo.index != null) {
    return `${before}\n\n${after.slice(seo.index).trimStart()}`.trim();
  }
  return before.trim();
}
