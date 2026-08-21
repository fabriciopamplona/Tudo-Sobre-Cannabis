# Design system — Tudo Sobre Cannabis

## Princípios

1. **Editorial, não corporativo.** Priorize hierarquia de leitura, contexto e espaço em branco.
2. **Curioso, mas responsável.** Evite linguagem visual de promessa, euforia ou apelo medicinal simplista.
3. **Calmo, mas não neutro.** O verde escuro cria presença; o lima aponta ações e informações prioritárias.
4. **Imagens como linguagem editorial.** Use composições abstratas geométricas em vez de bancos de imagem genéricos.

## Tipografia

| Papel | Fonte | Uso |
| --- | --- | --- |
| Títulos | `Fraunces` | H1, H2, cards de matéria, chamadas e citações |
| Interface e corpo | `DM Sans` | Texto corrido, menus, botões, formulários |
| Metadados | `DM Mono` | Categoria, datas, edição, índices, legendas |

### Escala

- H1 desktop: `7.4rem`, line-height `0.88`, letter-spacing `-0.055em`
- H1 mobile: `3.85rem`, line-height `0.88`
- H2 desktop: entre `3.75rem` e `4.5rem`, line-height `0.95`
- Título de card em destaque: `2.65rem`
- Título de card: `1.55rem`
- Corpo: `1rem` a `1.125rem`, line-height `1.65–1.8`
- Metadados: `9–10px`, caixa alta, tracking `0.16–0.22em`

## Cores

| Token | Valor | Uso |
| --- | --- | --- |
| `--tsc-ink` | `#17352f` | Fundo escuro, títulos e texto principal |
| `--tsc-paper` | `#f1ede2` | Fundo principal e texto sobre o verde |
| `--tsc-card` | `#f8f4eb` | Cards e superfícies elevadas |
| `--tsc-lime` | `#d4e66a` | CTA primário, realces e informação prioritária |
| `--tsc-clay` | `#c77867` | Ênfase editorial, arte e detalhes |
| `--tsc-sage` | `#52635e` | Texto secundário |
| `--tsc-line` | `#d8d4c8` | Bordas e divisores |
| `--tsc-forest-mid` | `#2b5148` | Superfícies em fundo escuro |
| `--tsc-forest-line` | `#547068` | Bordas sobre fundo escuro |

## Espaço e ritmo

- Unidade-base: `4px`.
- Contêiner máximo: `1320px`.
- Margens laterais: `20px` no mobile e `32px` no desktop.
- Seções: `80px` vertical no mobile e `112px` no desktop.
- Cards: use `20–32px` de padding.
- Bordas: `1px` e quase sempre retas; raio padrão de `2–6px`, nunca “app genérico” excessivamente arredondado.

## Componentes

### Navegação

Topo em papel com borda inferior. Menu em DM Mono, caixa alta, sem peso excessivo. A busca é um botão circular discreto.

### Hero

Fundo `--tsc-ink`, título em Fraunces amplo, uma palavra-chave em lima. O card principal usa uma arte geométrica e não uma fotografia. Não reintroduzir a faixa de métricas removida do layout.

### Cards de artigo

Arte abstrata, categoria e ícone, título editorial, resumo, autoria/data e tempo de leitura. Elevação discreta somente em hover.

### CTA e newsletter

CTA primário: fundo lima e texto escuro. Newsletter: fundo verde escuro, grande título e campo sublinhado.

### Post longo

O template exploratório do post possui: categoria/data, título, dek, autoria/tempo, arte editorial, índice lateral, corpo de leitura e artigo relacionado. A mesma linguagem de título e metadados deve ser mantida.

## Acessibilidade

- Contraste alto entre texto e fundo.
- Botões e links precisam de `focus-visible`.
- Ícones de ação devem possuir rótulos acessíveis.
- Não usar cor como único indicador de estado.
- O conteúdo é educativo; preservar o aviso de que não substitui avaliação profissional quando aplicável.