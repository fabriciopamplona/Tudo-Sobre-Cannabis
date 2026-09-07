# Ilustrações editoriais — Tudo Sobre Cannabis

Vale para capas e figuras no corpo. Processo: `agents/illustrator/` (spec → render).

UI / marca / tipografia: [`docs/BRAND.md`](BRAND.md) · kit completo: [`docs/visual/kit-moderno/`](visual/kit-moderno/) · prompts de capa: [`visual/kit-moderno/01-diretrizes/PROMPTS-CAPAS.md`](visual/kit-moderno/01-diretrizes/PROMPTS-CAPAS.md).

## Direção consolidada (obrigatória)

**Ofício:** pintura digital editorial com **aguada aquarela** + nanquim fino.  
**Se errar, erre para o lado da aquarela / pintura** — nunca para flat vector, ícone de app ou “cor chapada”.

A botânica do kit calibra a **técnica**. As capas publicadas **#1–#5** calibram o **ofício aplicado** (objeto, ciência, lugar, pessoa).

## Referência visual canônica

### A. Style lock de técnica (sempre anexar)

| Arquivo | Uso |
|---|---|
| [`docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png`](visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png) | Nanquim + aguada, papel `#F7F5EB` |
| [`docs/visual/kit-moderno/03-ilustracoes/ilustracao-flores.png`](visual/kit-moderno/03-ilustracoes/ilustracao-flores.png) | Variação (inflorescência) |
| Runtime WebP | `web/public/brand/ilustracao-*.webp` (fallback de cards sem capa) |

### B. Style lock de ofício publicado (#1–#5)

PNGs de QC em [`docs/visual/kit-moderno/03-ilustracoes/refs-publicadas/`](visual/kit-moderno/03-ilustracoes/refs-publicadas/) (espelho das capas no ar):

| Peça | O que aprender |
|---|---|
| **#1** Autorização Anvisa | Still-life de documentos + frasco + carimbo; aguada suave; sombra difusa |
| **#2** Como começar | Objetos do trâmite (receita, carimbo, produto); pintura com volume |
| **#3** Epilepsia | Mesa de pesquisa (caderno, EEG, frasco, botânica); muita textura de papel |
| **#4** O que é CBD | Ciência + produto; traço fino; aguada; tipografia na arte só se inevitável e **pt-BR** |
| **#5** SUS | Pessoa ok **no corpo ou ocasionalmente**; mesma aguada — **não** vira padrão de capa |

Anexar no gerador: **folhas.png** + **pelo menos 1** das refs `#1–#4` (preferir `#1` ou `#3` para still-life; `#4` para ciência/produto). `#5` só quando a figura for mesmo cena humana.

| Usa a ref para | Não usa a ref para |
|---|---|
| **Técnica** (linha, lavagem, paleta, papel, volume) | Copiar a mesma composição em toda matéria |
| Calibrar o gerador (image reference) | Substituir o **tema** conceitual da pauta |
| Preferir aquarela se o modelo oscilar | Limitar a arte a naturezas-mortas **ou** a só gente |
| Variar sujeito com o mesmo ofício | Repetir folha de cannabis como “logo” em toda capa |

Histórico (não canônico): `docs/visual/historico/ref-botanica.png`.

## Tema da capa / figuras

Técnica do kit + **tema da pauta**. Em cada peça, **misturar tipos de sujeito**.

### Capa: regra anti-consultório

**Capa default = objetos, ciência, botânica, lugar ou produto** — não médico/paciente no balcão.

Consulta / farmácia / balcão com gente: **no máximo 1 figura no corpo**, e só se a pauta pedir. Evitar várias capas seguidas no quadro com a mesma cena de consultório.

### Paleta de sujeitos (usar ≥2 tipos por hub)

| Tipo | Exemplos criativos (preferir metáfora, não clichê) |
|---|---|
| **Botânica** | Tricoma, flor resinosa, ramo em vaso, herbário — **não** a mesma folha de marca em toda capa |
| **Clínica / contexto** | Prontuário vazio, estetoscópio sozinho, luz de janela, maca vazia — presença humana **opcional** |
| **Profissão** | Mão com receita, bata no cabide, carimbo de farmácia — detalhe, não stock de “doutor sorrindo” |
| **Cidade / lugar** | Farmácia de esquina, corredor de prédio público, mesa de cartório — atmosfera |
| **Produto** | Frasco, conta-gotas, caixa neutra, cristal de isolado (sem marca legível) |
| **Ciência** | Vidraria, microscópio, esquema molecular em nanquim, paper aberto, EEG estilizado |
| **Cotidiano** | Mesa com formulário, pasta, envelope de importação, xícara ao lado do laudo |
| **Regulação / papel** | Carimbo, pasta, selo em contorno, DOU estilizado **sem** número inventado |
| **Pessoa** | Consulta, farmácia, cuidador — **≤1–2 por peça**; preferir no corpo, raramente na capa |

**Regra anti-monotonia:** numa peça com 4 figuras, proibido 4 cenas de pessoas. Alterne. Capa pode ser botânica, produto, ciência ou papel mesmo em pauta de paciente.

**Incentivado (criatividade no prompt)**

- Metáfora visual da pauta (dois caminhos = dois objetos; pureza = cristal vs óleo âmbar; norma pendente = carimbo vazio)
- Ritmo: objeto → ciência → lugar → (pessoa opcional)
- Figuras de literature quando o pack tiver paper útil
- Close inesperado (tricoma, gota, selo, envelope) em vez de “mais uma consulta”

**Evitar como padrão**

- Consultório / balcão com gente **na capa**
- Quatro consultas/farmácias humanas na mesma matéria
- A mesma folha/flor de marca em todas as capas
- Linguagem de prompt: `flat vector`, `vetorial plano`, `cor chapada`, `UI infographic`, `sticker`
- Papel envelhecido demais, psicodelia, 3D plástico, foto de produto
- Dor espetacularizada; criança em sofrimento; stock “família feliz com óleo”
- **Texto na arte:** preferir **zero**. Se inevitável (Rx, selo mínimo), **pt-BR** só. Título e categoria ficam no HTML. (As refs #2/#4 têm rótulos pontuais — não expandir isso.)

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

- Nanquim fino + **aguada** sálvia/oliva com sangramento leve fora da linha; terracota pontual (~10%)
- Volume e sombra **suaves** (pintura), não blocos flat
- Fundo `#F7F5EB` limpo com grão de papel; respingos leves de aquarela ok
- Sem logo/marca d’água/assinatura; sem título de matéria na capa
- Matriz ~3:2 (ideal futuro 2400×1600; masters atuais 1536×1024 ok)
- **QC:** se parecer ícone de app / vetor chapado → regenerar puxando mais aguada

## Prompt-base (colar em todo spec)

Copiar o bloco inteiro. **Nunca** trocar por “flat vector”, “vetorial plano”, “cor chapada”, “product photo” ou “collage”:

```
Hand-painted editorial illustration for Tudo Sobre Cannabis — digital watercolor
+ fine nanquim ink (kit 2.0 + published covers #1–#5 craft). Soft sage/olive washes
on clean ivory paper (#F7F5EB), translucent color that may bleed slightly outside
lines, light watercolor splatters, subtle peach/terracotta accents (~10%), visible
paper grain, gentle painted volume/shadows (NOT flat vector, NOT solid color blocks,
NOT UI icons). Same craft as a contemporary botanical-editorial plate and the
published still-life covers (documents, vials, research desk).
SUBJECT: [tema criativo da pauta — BOTÂNICA / CIÊNCIA / PRODUTO / PAPEL-REGULAÇÃO /
LUGAR / COTIDIANO / PROFISSÃO-DETALHE / PESSOA rara]. Prefer objects/science over
clinic scenes on COVER. Mix subject types across the article; ≤2 people figures per
hub; cover usually has ZERO people.
Prefer ZERO text in the image. If a tiny label is unavoidable, Brazilian Portuguese only (Rx ok).
HARD BANS: photography, photoreal product shot, CGI/3D render, glossy studio lighting,
flat vector, flat design, solid color blocking, UI/infographic, digital sticker collage,
neon, psychedelia, aged parchment, vintage stamps as clutter, logos, watermarks,
signatures, article headline typography, English UI text, repeating cannabis leaf as logo.
Aspect ~3:2.
```

Anexar **sempre**:

1. `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png`
2. Uma ref de ofício: `refs-publicadas/01-autorizacao-capa.png` ou `03-epilepsia-capa.png` (ou `04-cbd-capa.png` se ciência/produto)

### QC visual (obrigatório antes de `cwebp`)

Recusar e regenerar se a arte parecer: foto de produto, still-life fotográfico, **vetor chapado / flat / ícone**, colagem foto+desenho, neurônio/atlas médico hiperdetalhado sem aguada, fundo branco puro sem papel `#F7F5EB`, ou capa com consultório genérico quando o spec pediu objeto/ciência.

Comparar lado a lado com `#1` ou `#3`: mesma “molhadura” de tinta? Se a peça nova for mais seca/chapada → regenerar.

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
| **Prompt** | `05-illustrations-spec.md` | Técnica kit + tema criativo + preferir zero texto |
| **Legenda** | linha `Figura:` | Leitura + crédito se literature |
| **Alt** | `![alt](…)` | Acessibilidade / SEO |
| **Title** | `![…](… "title")` | Tooltip |
| **source_type** | spec | `generated` \| `literature` \| `inspired_by_post` |

## Etapas na esteira (Blog)

### A. Spec — `agents/illustrator/SYSTEM.md` → `05-illustrations-spec.md`

### B. Render — `agents/illustrator/RENDER.md`

### C. Depois

`esteira:audit` → SERP IA → gate-prep → OK humano.
