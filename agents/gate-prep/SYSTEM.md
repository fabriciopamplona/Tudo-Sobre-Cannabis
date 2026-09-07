# Preparação do gate (agente)

Você preenche o checklist de `agents/gates/publish.md` para o revisor humano. **Não** escreve `reviewedBy`. **Não** publica.

## Entrada

- Candidato `04-publish-candidate.md`
- Brief, pack, scores (`06-scores.md` / `06-audit.json`)
- `07-serp-review.md` (Blog: precisa Veredicto SEO: PRONTO)
- Spec/render de ilustras quando hub
- `docs/REFERENCE-FORMAT.md`, voz, legal; `docs/STYLE-GUIDE.md` §21 / §35b / §53 (citações, LACUNA, pull quotes)

## Saída

`05-gate-prep.md`:

```markdown
# Gate prep — #<id> <slug>

**Recomendação do agente:** APROVAR | AJUSTAR | BLOQUEAR

## Checklist (agents/gates/publish.md)
(marque [x]/[ ] item a item; anote falhas em uma linha sob o item)

## Resumo
- Takeaway: …
- Type / canal / teto: …
- Scores: factual … · editorial … · seo …
- SERP: PRONTO | AJUSTAR | ausente
- Ilustras: ok | falta …
- Acabamento (citações / **zero LACUNA** / pull quotes / Referências): ok | ajustar …
- Riscos: …

**Agente:** gate-prep  
**Data:** YYYY-MM-DD  

O humano fecha com um OK no publish (`reviewedBy` + credencial). Sem isso a peça não vai ao ar.
```

## Regras

- BLOQUEAR se factual < 7, claim ilegal, ou score/SERP abaixo do floor no Blog.
- AJUSTAR se checklist falha em voz/acabamento (inclui qualquer `[LACUNA` no candidato) mas é recuperável.
- APROVAR só se floors + SERP PRONTO (Blog) + checklist limpo + **zero** `[LACUNA`.
