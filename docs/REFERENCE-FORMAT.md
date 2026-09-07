# Peça-referência de formato — Blog

**Canônica:** [`content/published/autorizacao-anvisa-cannabis.md`](../content/published/autorizacao-anvisa-cannabis.md)  
**URL:** `/acesso/autorizacao-anvisa-cannabis` · peça `#4`  
**Type:** `informe` (hub de acesso) · **reviewedBy:** Dr. Fabricio Pamplona  
**Ilustrações:** `web/public/illustrations/autorizacao-anvisa-cannabis/`

Esta peça é o **modelo operacional** de formato, escrita, links, ilustras, SEO e fecho editorial para o Blog. Corpus de *voz* continua em `content/examples/VOICE-CORPUS.md`; sementes antigas em `content/published/` **não** são modelo de voz — **esta** peça é modelo de *estrutura e acabamento*.

## O que copiar desta peça

| Elemento | Padrão |
|---|---|
| Extensão hub/informe âncora | ~2.200–3.500 palavras (notícia rápida: 600–1.000) |
| Abertura | Definição / fato nos primeiros ~120 caracteres |
| Estrutura | H1 → seções H2 → vias/detalhes em H3 quando couber |
| Em-dash `—` | Evitar na prosa; em rótulos de lista, preferir ` - ` ou dois pontos |
| Tabela | Markdown GFM + opcional `Tabela: legenda` no mesmo bloco |
| FAQ | Só perguntas que o corpo já responde |
| Ilustras | 1 capa + 2–3 no corpo (~1 a cada 700–900 palavras); estilo `docs/IMAGE-STYLE.md` (técnica do kit + **mistura** botânica/clínica/produto/ciência/lugar/cotidiano; ≤2 cenas com pessoas) |
| Parceiro comercial (Fito) | **Template do site**, não do markdown: banner lateral + banner horizontal no meio do post em **toda** peça Blog publicada. Arte → WhatsApp; legenda → [fitocanabica.com.br](https://fitocanabica.com.br/). Rótulo: “Parceiro Comercial”. Ver `web/src/components/FitoCanabicaBanner.tsx` |
| Links | 3–7 internos locked; externos só allowlist / jornada explícita; âncora descritiva |
| Citações científicas | No corpo: `Autor et al., ANO` com link (DOI/PubMed); referência completa em `## Referências` |
| Afirmações fortes | Repetir como `> pull quote` (divisória tipográfica); frase também fica no parágrafo |
| Lacunas | `[LACUNA: …]` só em pack/draft/humanizado; **zero** no candidato (fecha com fonte ou reescreve). Limão = alerta se escapar |
| Fecho | `## Referências` (quando houver estudo) → `## Leituras relacionadas` → `## Sobre o blog` + disclaimer |
| Frontmatter | title≤60, description 150–160, `image`, `reviewedBy` humano, keyword locked no publish |

## Loop de qualidade (obrigatório no Blog)

1. Redação + humanização  
2. Editor de canal: links no corpo + fecho (Leituras + Sobre o blog)  
3. **Spec de ilustras** (`05-illustrations-spec.md`): prompt + legenda (`Figura:`) + alt + title — `docs/IMAGE-STYLE.md` / `agents/illustrator/SYSTEM.md`  
4. **Geração de imagens**: arte → WebP → inserção no markdown + `image:` — `agents/illustrator/RENDER.md`  
5. Auditoria (`06-scores.md` / `esteira:audit`)  
6. Correção SEO/editorial se necessário  
7. Reauditoria até floors: **factual ≥ 8**, **editorial ≥ 7**, **seo ≥ 8,5** (meta ≥ 9)  
8. **Keyword / SERP** (`agents/gates/seo-serp.md` → `07-serp-review.md`, veredicto PRONTO) — **último passo de aprovação**  
9. Gate humano (`reviewedBy`) → Publicar  

Sem ilustras (hub), sem `seo ≥ 8,5` ou sem SERP PRONTO no Blog, **não** assinar APROVAR.

## Citações, lacunas e pull quotes (Blog)

Canônico de **escrita**: `docs/STYLE-GUIDE.md` §21 (Fontes) e §35b (teste de acabamento). Checklist de **revisão**: `agents/gates/publish.md` + STYLE-GUIDE §53.

### Lacunas (`[LACUNA: …]`)

Dado ausente = marcar no **pack / draft / humanizado**, nunca inventar.

No **candidato** (`04-publish-candidate.md`): **zero** `[LACUNA`. Ou fecha com fonte verificável (DOI, DOU, página oficial), ou reescreve o trecho para o texto não depender do dado (padrão das peças publicadas). Qualquer marcador restante no gate = AJUSTAR.

O render em verde limão é rede de segurança, não estado editorial aceitável no OK. Detalhe: `docs/STYLE-GUIDE.md` §21.

### Citações científicas

No corpo, forma abreviada com link para o artigo original:

```markdown
([Mücke et al., 2018](https://doi.org/10.1002/14651858.CD012182.pub2))
```

Não colar DOI solto, título longo nem referência Vancouver no meio do parágrafo. A forma completa vai em `## Referências` (antes de Leituras relacionadas), com o mesmo link:

```markdown
## Referências

1. [Mücke et al., 2018](https://doi.org/10.1002/14651858.CD012182.pub2) - Mücke M et al. Título. *Periódico*. Ano;vol:páginas.
```

Sem URL de DOI/PubMed no draft = `[LACUNA]`. No candidato: achar o link ou reescrever sem o identificador inventado.

### Pull quotes (afirmações fortes)

Frases polêmicas ou afirmações fortes (ex.: “Não é.”, “efeito real, mas pequeno…”) podem ser **repetidas** como bloco de citação markdown, como divisória tipográfica entre seções. A frase continua no parágrafo normal; o `>` não substitui o corpo.

```markdown
Não é. A dor crônica não é uma categoria homogênea…

> Não é.
```

O CSS editorial (`blockquote`) já trata isso como destaque tipográfico, não como citação de terceiro.

## Sobre o blog (bloco canônico)

Texto e links: `web/src/lib/authors.ts` (`ABOUT_BLOG` / `ABOUT_BLOG_MARKDOWN`).  
No site, o componente `AuthorExpediente` injeta o bloco (o markdown do arquivo é removido na renderização para não duplicar).

Inserir no final de toda peça Blog (antes do `<!-- seo` / disclaimer tipográfico do site):

```markdown
## Sobre o blog

O Tudo Sobre Cannabis é um veículo editorial sobre cannabis: ciência, regulação, mercado, política e cultura, editado por [@fpamplona](https://www.instagram.com/fpamplona/). Dr. Fabricio Pamplona é farmacêutico, doutor em Farmacologia pela UFSC e trabalha com canabinoides há mais de duas décadas, entre pesquisa científica, educação e liderança de empresas da área. Assina o editorial do Tudo Sobre Cannabis e a [newsletter homônima no Substack](https://tudosobrecannabis.substack.com/).

---

*Este texto é informativo e não substitui consulta médica nem orientação jurídica. A autorização da Anvisa é uma etapa do processo de acesso, não o processo completo.*
```

O rodapé tipográfico do site (“Conteúdo educativo · não substitui avaliação profissional”) fica no layout, não no markdown.

Para re-sincronizar arquivos: `node agents/sync-about-blog.mjs`.
