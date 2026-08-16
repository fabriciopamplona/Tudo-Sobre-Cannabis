# SEO e GEO

Objetivo duplo: **ranquear** no Google.br e **ser citado** em respostas de IA. Os dois pedem clareza estrutural; só o primeiro pede autoridade de domínio e links.

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

Interno: hub ↔ spoke, 3–7 links por peça, âncora descritiva. Zero órfã.

## On-page (gate do editor SEO)

- Keyword no title (< 60 caracteres), no H1 (natural), nos primeiros 100 palavras
- Meta description 150–160, com intenção + recorte Brasil
- FAQ schema só com perguntas que o texto realmente responde
- Article + Person/Organization schema
- Imagem: alt em português, não keyword stuffing
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

## Off-page (trimestre 1–2)

Não dá para fingir link building depois. Plano mínimo:

- Páginas que prescritor queira citar (tabelas de RDC, hubs de evidência)
- Relação com sociedades e associações (não PBN)
- Dados originais quando possível (enquete de jornada, compilado de normas) — dado proprietário vence scrap de Wikipedia

## Monitoramento

Por URL: impressões, posição média, indexação, CTR, tempo na página, scroll, conversão do guia. Alerta se posição cai após update de RDC — a peça ficou desatualizada.
