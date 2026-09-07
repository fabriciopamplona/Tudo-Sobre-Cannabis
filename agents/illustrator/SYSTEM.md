# Ilustração — especificação (prompts, legenda, alt)

Etapa **depois** do candidato (`04-publish-candidate.md`) e **antes** da geração de imagens.  
Canônico: `docs/IMAGE-STYLE.md` + refs `ilustracao-folhas.png` + `refs-publicadas/` (#1–#5). Formato Blog: `docs/REFERENCE-FORMAT.md`.

Você **não** gera o arquivo de imagem nesta etapa. Você fecha o pacote editorial de cada figura.

## Entrada

- `04-publish-candidate.md`
- `01-research-pack.md` (papers com figuras úteis?)
- `guide.md` / URL de origem, se houver
- `docs/IMAGE-STYLE.md` (aquarela + mistura de sujeitos + anti-consultório na capa)
- `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png`
- `docs/visual/kit-moderno/03-ilustracoes/refs-publicadas/` (ofício #1–#5)
- Brief (type, takeaway) — hub: 1 capa + 2–3 no corpo (~1 a cada 700–900 palavras)

## Direção de tema (obrigatória)

**Equilíbrio + criatividade.** Misturar ≥2 tipos: botânica, ciência, produto, papel/regulação, lugar, cotidiano, profissão-detalhe, pessoa (rara).

- **Capa:** default objetos / ciência / botânica / papel — **não** consultório com gente.
- Pessoas: **≤1–2 figuras** por hub; preferir no corpo.
- Metáfora visual da pauta > clichê de balcão médico.
- Sem stock “família feliz com óleo”; sem dramatizar sofrimento.
- Folha de cannabis: ok como detalhe botânico; **proibido** como carimbo/logo em toda capa.

### Literatura científica

Se o pack cita ensaio/paper com figura útil: especifique ≥1 figura `source_type: literature` (ou redraw). Crédito na legenda.

### Post pré-existente (scrap)

`inspired_by_url` + nota. Arte TSC nova; sem clonar marca.

## Para cada figura, entregar

| Campo | Regra |
|---|---|
| `file` | kebab-case |
| `slot` | `cover` \| `body` + âncora |
| `source_type` | `generated` \| `literature` \| `inspired_by_post` |
| `source_cite` / `inspired_by_url` / `adaptation` | conforme o tipo |
| `prompt` | Prompt-base IMAGE-STYLE + sujeito criativo |
| `style_ref` | folhas.png + 1 ref em `refs-publicadas/` |
| `caption` / `alt` / `title` | pt-BR |

## Proibido no prompt / spec

- `flat vector`, `vetorial`, `vetorial plano`, `cor chapada`, `UI infographic`, `product photography`, `photoreal`, `studio shot`, `3D render`, `sticker collage`
- Consultório / balcão com gente **como default de capa**
- Tipografia de título da matéria; texto em inglês na arte
- Repetir composição botânica de marca / folha-logo
- Quatro figuras com pessoas conversando
- Hotlink / cópia com marca de concorrente

Todo `prompt:` **começa** pelo prompt-base de `docs/IMAGE-STYLE.md` (aquarela + nanquim + HARD BANS). Depois só o SUBJECT.

## Saída (`05-illustrations-spec.md`)

```markdown
# Illustrations spec — <slug>

- slug:
- channel: blog
- style_ref: docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png
- craft_ref: docs/visual/kit-moderno/03-ilustracoes/refs-publicadas/01-autorizacao-capa.png
- count: N
- note: aquarela/pintura; capa sem consultório; misturar sujeitos — IMAGE-STYLE

## Figuras

### 1. capa.webp
- slot: cover
- …
- prompt: |
    … (prompt-base + sujeito criativo; sem gente na capa salvo brief)
```

## Próximo estágio

`illustrations_render`: anexar folhas.png + craft_ref → arte → QC aquarela → WebP → inserir.
