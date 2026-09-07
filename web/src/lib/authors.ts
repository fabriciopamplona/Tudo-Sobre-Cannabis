/** Expediente editorial — minibios canônicas do TSC. */

export const SITE_TAGLINE = "Nem precisa perguntar, a gente explica.";

export const LINKS = {
  instagram: "https://www.instagram.com/fpamplona/",
  substack: "https://tudosobrecannabis.substack.com/",
  medium: "https://medium.com/tudosobrecannabis",
  editorSite: "https://fabriciopamplona.com.br/",
} as const;

export const EDITOR = {
  name: "Dr. Fabricio Pamplona",
  role: "Editor",
  handle: "@fpamplona",
  oneLiner:
    "Farmacêutico, doutor em Farmacologia e editor do Tudo Sobre Cannabis.",
  /** Credencial padrão no OK e publicar (gate). */
  credential: "Editor · Tudo Sobre Cannabis",
} as const;

/** Nomes canônicos para o dropdown "Revisado por" no OK e publicar. */
export const REVIEWERS = [EDITOR.name] as const;

/** Defaults do formulário de gate — um clique publica. */
export const GATE_DEFAULTS = {
  reviewer: EDITOR.name,
  credential: EDITOR.credential,
} as const;

/**
 * Bloco único "Sobre o blog" (fecho de toda peça Blog + /sobre).
 * Canônico editorial: docs/REFERENCE-FORMAT.md · docs/STYLE-GUIDE.md §58.
 */
export const ABOUT_BLOG = {
  leadBeforeHandle:
    "O Tudo Sobre Cannabis é um veículo editorial sobre cannabis: ciência, regulação, mercado, política e cultura, editado por ",
  leadAfterHandle:
    ". Dr. Fabricio Pamplona é farmacêutico, doutor em Farmacologia pela UFSC e trabalha com canabinoides há mais de duas décadas, entre pesquisa científica, educação e liderança de empresas da área. Assina o editorial do Tudo Sobre Cannabis e a ",
  newsletterAnchor: "newsletter homônima no Substack",
  leadAfterNewsletter: ".",
  note:
    "Este texto é informativo e não substitui consulta médica nem orientação jurídica. A autorização da Anvisa é uma etapa do processo de acesso, não o processo completo.",
  footer: "Conteúdo educativo · não substitui avaliação profissional",
} as const;

/** Markdown canônico para inserir no candidato / published (antes do `<!-- seo`). */
export const ABOUT_BLOG_MARKDOWN = `## Sobre o blog

${ABOUT_BLOG.leadBeforeHandle}[${EDITOR.handle}](${LINKS.instagram})${ABOUT_BLOG.leadAfterHandle}[${ABOUT_BLOG.newsletterAnchor}](${LINKS.substack})${ABOUT_BLOG.leadAfterNewsletter}

---

*${ABOUT_BLOG.note}*`;

/** @deprecated use ABOUT_BLOG — mantido para imports antigos. */
export const ABOUT_BLOG_PARTS = {
  beforeHandle: ABOUT_BLOG.leadBeforeHandle,
  afterHandle: ABOUT_BLOG.leadAfterHandle,
  newsletterLabel: ABOUT_BLOG.newsletterAnchor,
  afterNewsletter: ABOUT_BLOG.leadAfterNewsletter,
} as const;
