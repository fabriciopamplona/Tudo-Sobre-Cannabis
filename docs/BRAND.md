# Marca — Tudo Sobre Cannabis (kit 2.0)

Canônico completo: [`visual/kit-moderno/01-diretrizes/STYLE-GUIDE.md`](./visual/kit-moderno/01-diretrizes/STYLE-GUIDE.md).

## Logo

- **Clara:** `web/public/brand/logo-verde.svg` (sobre papel / marfim)
- **Escura:** `web/public/brand/logo-marfim.svg` (sobre verde profundo / ink)
- **Com fundo:** `logo-fundo-marfim.svg`
- **Símbolo:** `simbolo.svg` (compacto / favicon detalhado)
- **Favicon:** `web/src/app/icon.svg` (= `favicon.svg` simplificado)

Wordmark em caixa baixa, letras em curvas (SVG sem dependência de fonte). Não esticar, inclinar nem redesenhar.

Área no header: ~200×70 desktop, ~174×61 mobile (`object-fit: contain`). Reserva: ≥ 1/4 da altura do símbolo em cada lado.

Acessibilidade: o link da marca usa `aria-label="Tudo Sobre Cannabis"`; a `<img>` fica com `alt=""`.

## Tipografia

**Manrope** variável (pesos 400 leitura, 700 UI, 800 títulos). Hospedada em `web/src/app/fonts/Manrope.ttf` (OFL). Sem serifa ornamental; display = sans.

## Cores (tokens)

| Token | Hex | Uso |
|---|---|---|
| `--tsc-ink` | `#073F35` | Títulos, hero, texto forte |
| `--tsc-paper` | `#F7F5EB` | Fundo |
| `--tsc-card` | `#FFFEF8` | Cards / campos |
| `--tsc-lime` | `#D4F08A` | CTA, chip ativo |
| `--tsc-kicker` | `#9E422D` | Categorias / rótulos |
| `--tsc-clay` | `#DD7556` | Acento ilustrativo (não texto miúdo) |
| `--tsc-muted` / `--tsc-sage` | `#53665B` / `#455F52` | Secundário |
| `--tsc-line` | `#D6DCCF` | Bordas |

Texto sobre lima = ink. Não usar lima como texto sobre papel. Foco: contorno kicker 3px (lima em áreas escuras).

## Ilustração

Técnica: nanquim fino + aguada sálvia/oliva, papel `#F7F5EB`. Capas de matéria: tema da pauta (humano, botânico, cenário). Home pode misturar capas reais + botânica de marca como fallback. Preferir **zero texto** na arte; se inevitável, pt-BR mínimo. Ver `IMAGE-STYLE.md` + `PROMPTS-CAPAS.md`.
