# Ilustrações editoriais — Tudo Sobre Cannabis

Vale para capas e figuras no corpo. Processo: `agents/illustrator/` (spec → render).

UI / marca / tipografia: [`docs/BRAND.md`](BRAND.md) · kit completo: [`docs/visual/kit-moderno/`](visual/kit-moderno/) · prompts de capa: [`visual/kit-moderno/01-diretrizes/PROMPTS-CAPAS.md`](visual/kit-moderno/01-diretrizes/PROMPTS-CAPAS.md).

## Referência visual canônica (obrigatória)

**Direção:** kit 2.0 — botânica contemporânea (set/2026).

**Refs de técnica (style lock):**

| Arquivo | Uso |
|---|---|
| [`docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png`](visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png) | Linha, aguada, papel `#F7F5EB` |
| [`docs/visual/kit-moderno/03-ilustracoes/ilustracao-flores.png`](visual/kit-moderno/03-ilustracoes/ilustracao-flores.png) | Variação (inflorescência) |
| Runtime WebP | `web/public/brand/ilustracao-*.webp` (fallback de cards sem capa) |

Âncora de **técnica** (não de tema): nanquim fino + aquarela controlada, fundo marfim uniforme `#F7F5EB`, composição limpa. A ref mostra planta; isso calibra ofício — **não** obriga repetir folha em toda matéria.

| Usa a ref para | Não usa a ref para |
|---|---|
| **Técnica** (linha, lavagem, paleta, papel) | Repetir a mesma planta em toda matéria |
| Calibrar o gerador (image reference) | Substituir o **tema** conceitual da pauta |
| Manter o “cheiro” editorial TSC | Limitar a arte a naturezas-mortas **ou** a só gente |

Histórico (não canônico): `docs/visual/historico/ref-botanica.png`.

## Tema da capa / figuras (aprovado)

Técnica do kit + **tema da pauta**. Em cada peça, **misturar tipos de sujeito** — não encher o post de gente.

### Paleta de sujeitos (usar ≥2 tipos por hub)

| Tipo | Exemplos |
|---|---|
| **Botânica** | Folha, tricoma, planta em vaso, herbário (quando fizer sentido — não a mesma folha de marca em toda capa) |
| **Clínica / contexto** | Consultório vazio, maca, estetoscópio, prontuário, luz de janela — presença humana opcional |
| **Profissão** | Bata, balcão de farmácia, mão com receita — pode ser detalhe, não retrato de stock |
| **Cidade / lugar** | Rua, farmácia de esquina, prédio público, corredor — atmosfera, não skyline genérico |
| **Produto** | Frasco, caixa neutra, conta-gotas (sem marca legível) |
| **Ciência** | Vidraria, microscópio, esquema de molécula/mecanismo, paper aberto (sem DOI inventado na arte) |
| **Cotidiano** | Mesa, xícara, celular com formulário, pasta de documentos, ônibus/espera |
| **Pessoa** | Consulta, farmácia, cuidador — **no máximo 1–2 por peça** (capa ou corpo), não 4/4 |

**Regra anti-monotonia:** numa peça com 4 figuras, proibido 4 cenas de pessoas conversando. Alterne. Capa pode ser botânica, produto ou ciência mesmo em pauta de paciente.

**Incentivado**

- Ritmo visual: humano → objeto → lugar → ciência (ou outra ordem)
- Figuras de literature quando o pack tiver paper útil
- Alternar recortes (close de produto vs. sala vs. planta)

**Evitar como padrão**

- Quatro consultas/farmácias humanas na mesma matéria
- A mesma folha/flor de marca em todas as capas
- Papel envelhecido, carimbos/caligrafia falsa, molduras vintage, psicodelia, 3D plástico
- Dor espetacularizada; criança em sofrimento
- Stock “família feliz com óleo”
- **Texto na arte:** preferir **zero**. Se inevitável (Rx, selo mínimo), **pt-BR** só. Título e categoria ficam no HTML.

**Home:** cards usam `image:` (`capa.webp`). Diversidade entre peças importa. Sem capa: fallback botânico de marca.

## Fontes de imagem além do gerador

### A. Figuras de literatura científica

1. Pode usar a figura do paper no corpo (WebP em `web/public/illustrations/<slug>/`).
2. Pode adaptar: overlay editorial (moldura papel `#F7F5EB`, seta/legenda pt-BR), recorte, recoloração leve, ou redraw nanquim+aquarela.
3. **Crédito obrigatório** na `Figura:` (autor, periódico/ano, Fig. N, DOI/URL).
4. Licença restritiva sem permissão → não republicar bitmap; refaça no estilo TSC.
5. Spec: `source_type: literature` + `source_cite` + `adaptation: none|overlay|redraw`.

### B. Inspiração em post pré-existente (scrap)

Brief de direção de arte, não cópia. Arte TSC nova. Sem hotlink/logo de concorrente. Spec: `inspired_by_url` + nota de 1 linha.

## Idioma

Preferir **nenhuma** palavra na imagem. Se houver rótulo inevitável: **só pt-BR** (nunca inglês). `Rx` ok.

## Estilo (resumo)

- Nanquim fino + aguada sálvia/oliva; terracota pontual (~10%)
- Fundo `#F7F5EB` limpo (sem envelhecer papel)
- Sem logo/marca d’água/assinatura; sem título de matéria na capa
- Matriz ~3:2 (ideal futuro 2400×1600; masters atuais 1536×1024 ok)

## Prompt-base (colar em todo spec)

Preferir o texto em `PROMPTS-CAPAS.md` para capas botânicas. Para qualquer tema da pauta — **copiar o bloco inteiro**; não substituir por “flat vector”, “product photo” ou “collage”:

```
Hand-drawn editorial illustration matching Tudo Sobre Cannabis kit 2.0
style lock (ilustracao-folhas.png): fine dark nanquim ink linework + soft
sage/olive watercolor washes on clean ivory paper (#F7F5EB), translucent
washes that may bleed slightly outside lines, optional light watercolor
splatters, subtle peach/terracotta accents (~10%), generous negative space,
paper grain visible. Same craft as a contemporary botanical plate — not a logo.
SUBJECT: [BOTÂNICA / CLÍNICA / PRODUTO / CIÊNCIA / CIDADE / COTIDIANO / PROFISSÃO / PESSOA —
mix types across the article; ≤2 people figures per hub].
Prefer ZERO text in the image. If a tiny label is unavoidable, Brazilian Portuguese only (Rx ok).
HARD BANS: photography, photoreal product shot, CGI/3D render, glossy studio lighting,
flat vector UI/infographic, digital sticker collage, neon, psychedelia, aged parchment,
vintage stamps, logos, watermarks, signatures, article headline typography.
Aspect ~3:2, clean contemporary botanical-editorial craft.
```

Anexar **sempre** `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` como image reference.

### QC visual (obrigatório antes de `cwebp`)

Recusar e regenerar se a arte parecer: foto de produto, still-life fotográfico, vetor chapado tipo app, colagem foto+desenho, neurônio/atlas médico hiperdetalhado sem aguada, ou fundo branco puro sem papel `#F7F5EB`.

## Formato de arquivo

- Export WebP ~1100–1600 px de largura quando possível; manter PNG mestre se houver
- Pasta: `web/public/illustrations/<slug>/` (`capa.webp` + 2–3 no corpo)
- Frontmatter: `image: "/illustrations/<slug>/capa.webp"` (obrigatório para card/hero)

## Inserção no markdown

```markdown
Figura: legenda editorial (o que o leitor deve entender).
![alt descritivo em pt-BR](/illustrations/<slug>/<arquivo>.webp "title curto")
```

| Campo | Onde | Função |
|---|---|---|
| **Prompt** | `05-illustrations-spec.md` | Técnica kit + tema + preferir zero texto |
| **Legenda** | linha `Figura:` | Leitura + crédito se literature |
| **Alt** | `![alt](…)` | Acessibilidade / SEO |
| **Title** | `![…](… "title")` | Tooltip |
| **source_type** | spec | `generated` \| `literature` \| `inspired_by_post` |

## Etapas na esteira (Blog)

### A. Spec — `agents/illustrator/SYSTEM.md` → `05-illustrations-spec.md`

### B. Render — `agents/illustrator/RENDER.md`

### C. Depois

`esteira:audit` → SERP IA → gate-prep → OK humano.
