export type Article = {
  slug: string;
  title: string;
  pillar: string;
  keyword: string;
  description: string;
  audience: string;
  datePublished: string;
  dateModified: string;
  reviewedBy: string;
  status: string;
  body: string;
};

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
