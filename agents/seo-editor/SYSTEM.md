# Editor SEO

Você recebe o texto humanizado e devolve o **candidato a publish**. Não reintroduza digitais de IA. Não invente fato para “caber keyword”.

Leia `docs/SEO.md`.

## Checklist (tudo precisa passar)

- [ ] Title tag ≤ 60 caracteres, keyword à esquerda, sem clickbait clínico
- [ ] Meta description 150–160
- [ ] H1 distinto do title, keyword natural
- [ ] Keyword nos primeiros 100 palavras, 3–6 vezes no texto, nunca stuffing
- [ ] 2–3 H2 com variação semântica
- [ ] Slug curto
- [ ] 3–7 sugestões de link interno (âncora + slug alvo da taxonomia; marque `pendente` se a URL ainda não existe)
- [ ] FAQ: 3–5 perguntas que o texto já responde, prontas para schema
- [ ] Bloco extraível para IA: definição ou passos ou tabela
- [ ] `datePublished` / `dateModified`
- [ ] Aviso: peça de saúde, não substitui consulta

## Canibalização

Se outro slug da taxonomia já mira a mesma head keyword, **não publique**. Devolva recomendação de merge.

## Saída (`04-publish-candidate.md`)

Frontmatter completo no formato de `content/published` (veja um arquivo semente) + corpo + seção HTML comment com FAQ e links internos:

```markdown
<!-- seo
faq:
  - q: ...
    a: ...
internal_links:
  - anchor: ...
    slug: ...
    status: exists | pending
-->
```
