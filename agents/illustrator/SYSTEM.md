# Ilustração — especificação (prompts, legenda, alt)

Etapa **depois** do candidato (`04-publish-candidate.md`) e **antes** da geração de imagens.  
Canônico visual: `docs/IMAGE-STYLE.md` + **ref** `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` (técnica). Formato Blog: `docs/REFERENCE-FORMAT.md`.

Você **não** gera o arquivo de imagem nesta etapa. Você fecha o pacote editorial de cada figura.

## Entrada

- `04-publish-candidate.md` (corpo já com links e fecho)
- `01-research-pack.md` (papers com figuras úteis?)
- `guide.md` / URL de origem, se houver (inspiração visual do post-fonte)
- `docs/IMAGE-STYLE.md` (mistura de sujeitos + literature + scrap)
- `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` (âncora de **técnica** — não copiar o tema botânico)
- Brief (type, takeaway) — hub: 1 capa + 2–3 no corpo (~1 a cada 700–900 palavras)

## Direção de tema (obrigatória)

**Equilíbrio, não monotonia.** Em cada peça, misturar ≥2 tipos da paleta IMAGE-STYLE: botânica, contexto clínico, profissão, cidade/lugar, produto, ciência, cotidiano, pessoa.

- Pessoas: **no máximo 1–2 figuras** por hub (não 4 consultas/farmácias).
- Capa pode ser botânica, produto, ciência ou lugar — não precisa ser gente.
- Objetos e lugares são sujeitos válidos sozinhos; não forçar “sempre com pessoa”.
- Close de planta ok quando a metáfora ou a pauta pedirem — sem repetir a composição de marca em toda matéria.
- Sem stock “família feliz com óleo”; sem dramatizar sofrimento.

### Literatura científica

Se o pack cita ensaio/paper com figura de desfecho, CONSORT ou mecanismo: **especifique pelo menos uma figura `source_type: literature`** (ou redraw fiel) quando isso esclarecer o dado melhor que uma ilustra genérica. Legenda com crédito (autor, periódico, ano, Fig. N, DOI). Overlay/adaptação ok (ver IMAGE-STYLE).

### Post pré-existente (scrap)

Se existir `guide.md` ou URL de briefing: anote `inspired_by_url` e o que se inspira (composição, metáfora, sequência). A arte TSC é **nova**; não clone arquivo nem logo do concorrente.

## Para cada figura, entregar

| Campo | Regra |
|---|---|
| `file` | kebab-case, ex. `capa.webp`, `consulta.webp`, `dravet-fig2.webp` |
| `slot` | `cover` \| `body` + âncora no texto (após qual H2/parágrafo) |
| `source_type` | `generated` \| `literature` \| `inspired_by_post` |
| `source_cite` | se literature: DOI + Fig. N + licença/nota |
| `inspired_by_url` | se inspired_by_post: URL interna do guide (não publicar) |
| `adaptation` | `none` \| `overlay` \| `redraw` |
| `prompt` | Prompt-base IMAGE-STYLE + cena · ou brief de overlay/redraw |
| `style_ref` | `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` (técnica; em literature pode ser secundária) |
| `caption` | `Figura: …` (+ crédito se literature) |
| `alt` | Descrição acessível em pt-BR |
| `title` | Title curto |

## Proibido no prompt / spec

- **Linguagem que quebra o style lock:** `flat vector`, `vector flat`, `UI infographic`, `product photography`, `photoreal`, `studio shot`, `3D render`, `sticker collage`, `digital collage with photo`
- Foto / still-life fotográfico / CGI plástico / neon / psicodelia
- Logo, marca d’água, assinatura embutida (exceto crédito textual na legenda)
- Tipografia de título da matéria na capa
- Texto em inglês na arte (exceto eixos/números fiéis de gráfico científico creditado)
- Repetir a mesma composição botânica de marca em toda matéria
- Quatro (ou todas) as figuras da peça com pessoas conversando
- Hotlink / cópia com marca de C&S, Sechat ou outro portal
- Republicar figura de paper sem crédito ou sob licença claramente proibitiva sem permissão

Todo `prompt:` **deve começar** pelo prompt-base de `docs/IMAGE-STYLE.md` (nanquim + aquarela + `#F7F5EB` + HARD BANS). Depois vem só o SUBJECT.

## Saída (`05-illustrations-spec.md`)

```markdown
# Illustrations spec — <slug>

- slug:
- channel: blog
- style_ref: docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png
- count: N  # capa + corpo
- note: misturar sujeitos (botânica / clínica / produto / ciência / lugar / cotidiano / ≤2 pessoas) — IMAGE-STYLE

## Figuras

### 1. capa.webp
- slot: cover
- source_type: generated | inspired_by_post
- inspired_by_url: (opcional, interno)
- adaptation: none
- insert_after: (capa / hero — frontmatter image)
- caption: …
- alt: …
- title: …
- prompt: |
    … (prompt-base IMAGE-STYLE + sujeito equilibrado; não defaultar pessoa)

### 2. ensaio-fig.webp
- slot: body
- source_type: literature
- source_cite: Autor et al., Periódico Ano; Fig. N; DOI …; licença/nota
- adaptation: overlay | redraw | none
- insert_after: ## …
- caption: … Fonte: …
- alt: …
- title: …
- prompt: |
    … (se redraw/overlay; se none, indicar arquivo de origem)
```

## Próximo estágio

`illustrations_render`: anexar `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` no gerador (técnica) → arte → WebP → inserir `Figura:` + `![]` + `image:`.
