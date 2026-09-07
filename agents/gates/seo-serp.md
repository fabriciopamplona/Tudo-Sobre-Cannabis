# Gate SEO / SERP (agente)

**Agente:** `serp-reviewer` (`agents/serp-reviewer/SYSTEM.md`).  
Comando: `npm run esteira:audit -- --phase serp` (ou `finish`).

Roda **depois** de `esteira:audit` (seo ≥ 8,5) e **antes** do OK humano no publish.  
Artefato: `content/runs/<slug>/07-serp-review.md`

Humano **não** reexecuta este checklist. Só confirma no **OK e publicar**.

## Checklist

### Keyword

- [ ] Head candidata vs locked: a query descreve o texto que já existe (conteúdo-first) ou o brief SEO-first foi honesto
- [ ] Busca web/SERP real (não só feeling): top 5 URLs e intenção dominante (gov.br / tutorial / hub / B2B)
- [ ] Head não canibaliza outro slug locked em `content/taxonomy.json` / `content/published/`
- [ ] Secundárias listadas (CBD, importação, norma) **sem** virar a head se a peça for hub
- [ ] `keyword_status: locked` no candidato quando a head estiver fechada

### On-page (fecho para 9–10)

- [ ] Title ≤ 60; **title ≠ H1** (`headline` no frontmatter quando distinto)
- [ ] Description 150–160; intenção + Brasil quando couber
- [ ] Keyword no lead (~100 primeiras palavras) sem stuffing
- [ ] 3–7 internos **únicos locked** no corpo (teto = inventário publicado; spokes `pending` no comentário)
- [ ] FAQ só com respostas no corpo; bloco GEO extraível quando a SERP for “como / documentos / prazo”
- [ ] Ilustras + `image`; texto na arte em pt-BR
- [ ] Scores: factual ≥ 8, editorial ≥ 7, **seo ≥ 8,5** (meta ≥ 9; 10 quando SERP + on-page fecharem)

### Off-page (nota, não bloqueia sozinho)

- [ ] Expectativa realista vs gov.br no topo da SERP
- [ ] Spokes / hub↔spoke planejados para não deixar a URL órfã

## Assinatura do agente

**Keyword final:**  
**Intenção SERP:**  
**Veredicto SEO:** PRONTO | AJUSTAR  
**Agente:** serp-reviewer  
**Data:**  

Se **AJUSTAR**: voltar ao candidato / `esteira:audit --phase improve`. Não pedir OK humano.
