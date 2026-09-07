# SEO e GEO

Objetivo duplo no **Blog**: ranquear no Google.br e ser citado em IA. Medium e newsletter não se escrevem para keyword.

**A voz manda.** Title, slug e links internos sim; stuffing, listicle e FAQ inventado não. Se o checklist de SEO brigar com `docs/STYLE-GUIDE.md`, vale o guia.

**Floor de publicação (Blog):** score SEO on-page **≥ 8,5** (meta ≥ 9). Peça-referência de formato: `docs/REFERENCE-FORMAT.md`. Auditoria: `npm run esteira:audit` → corrigir → reauditar até o floor.

**Antes do OK humano (Blog):** agente `serp-reviewer` fecha keyword/SERP (`agents/gates/seo-serp.md` → `07-serp-review.md` **PRONTO**). Sem isso, `publish` bloqueia. Inclui title ≠ H1 (`headline`), description 150–160, secundárias sem canibalizar, expectativa vs gov.br. Humano só confirma no **OK e publicar**.

O GSC **não** é o único drive do Blog. Há duas entradas:

| Entrada | Quando | Keyword |
|---|---|---|
| SEO-first | query, gap ou URL caindo no Search Console | antes da redação |
| Conteúdo-first | inbox humano, radar (tendência / notícia quente), recência, tese | **depois** — a query tem de caber no texto que já existe |

Não recuse peça editorial porque a query ainda tem pouca impressão. Não force uma head maior distorcendo o ângulo. Medium e newsletter continuam sem obrigação de keyword.

## Arquitetura

Subpastas, nunca subdomínio de conteúdo:

- `/acesso/[slug]`
- `/condicoes/[slug]`
- `/canabinoides/[slug]`
- `/familia/[slug]`
- `/regulacao/[slug]`
- `/glossario/[termo]`
- `/artigos/[slug]` — alias interno; o canônico é o do pilar

Um H1 por página. Title ≠ H1 (title mais curto, keyword à esquerda). Slug curto, sem stopword.

Interno: hub ↔ spoke, 3–7 links por peça **já no corpo** (não só no comentário `<!-- seo -->`), âncora descritiva. Zero órfã. **Parceiro comercial (Fito):** banners lateral + meio do post vêm do **template** em toda peça Blog (arte → WhatsApp; legenda → site). Links Fito no corpo só quando agregarem fluxo — não dump de afiliado.

## On-page (gate do editor SEO + loop de audit)

- Keyword no title (< 60 caracteres), no H1 (natural), nos primeiros 100 palavras
- Meta description 150–160, com intenção + recorte Brasil
- FAQ schema só com perguntas que o texto realmente responde
- Article + Person/Organization schema
- Imagem: alt em português, não keyword stuffing
- Texto **dentro** da ilustração também em pt-BR (ver `docs/IMAGE-STYLE.md`); nunca inglês na arte
- Data `datePublished` e `dateModified` no frontmatter — conteúdo de saúde envelhece

## Intenção

Se o SERP é “passo a passo ANVISA”, não escreva ensaio histórico. Se é “o que é CBD”, definição no parágrafo 1, não no 14.

Canibalização: um slug por keyword head. Antes de nova pauta, grep em `content/published` e `content/taxonomy.json`.

## Programático — o que pode e o que não

Pode: glossário; `cannabis medicinal para [condição]` com research pack exclusivo; comparações (`CBD vs THC`, `importação vs manipulação`).

Não pode: `[condição] em [cidade]` sem dado local (serviço, associação, fila do SUS daquela praça). Thin content é a forma mais barata de perder o domínio.

## GEO (busca de IA)

Deixe blocos extraíveis:

- Definição em 2 frases
- Lista numerada de passos
- Tabela comparativa
- “O que a evidência não mostra”
- FAQ no final

Citar fonte primária no mesmo bloco da afirmação. IA puxa o chunk; se o chunk não tem atribuição, a citação vai para outro.

`robots.txt` deve permitir GPTBot, PerplexityBot, ClaudeBot, Google-Extended. Não bloquear o que queremos que nos cite.

## Técnico (site)

Next.js App Router, HTML no servidor (nada de artigo só no client). `sitemap.ts`, canonical, `lang="pt-BR"`, Open Graph, hreflang só se um dia houver outro idioma.

Core Web Vitals no mobile: tipografia de leitura, imagens leves, sem carrossel pesado.

Search Console + GA4 no ar no dia do domínio. Sem isso a meta de milhões é fé.

**Go-live:** propriedade GSC + GA4 `G-36CZW66Q3C` — ver [`OPS-LIVE.md`](OPS-LIVE.md).

## Off-page (trimestre 1–2)

Não dá para fingir link building depois. Plano mínimo:

- Páginas que prescritor queira citar (tabelas de RDC, hubs de evidência)
- Relação com sociedades e associações (não PBN)
- Dados originais quando possível (enquete de jornada, compilado de normas) — dado proprietário vence scrap de Wikipedia

## Monitoramento

Por URL: impressões, posição média, indexação, CTR, tempo na página, scroll, conversão do guia. Alerta se posição cai após update de RDC — a peça ficou desatualizada.
