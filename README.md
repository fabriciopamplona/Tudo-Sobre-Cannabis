# Tudo Sobre Cannabis

Portal editorial de cannabis medicinal no Brasil. O objetivo não é “ter um blog”: é ser a referência que paciente, familiar e prescritor abrem primeiro — e, com isso, o maior canal orgânico de atração do tema no país.

Este repositório junta **conteúdo**, **agentes de produção** e **site**. A interface visual pode ser iterada no Replit; a fonte da verdade permanece aqui.

## Como o sistema funciona

```
tópico da pauta
    → 1. Pesquisador   (fontes pré-determinadas)
    → 2. Redator       (voz autoral do portal)
    → 3. Humanizador   (remove digitais de IA)
    → 4. Editor SEO    (intenção, estrutura, GEO)
    → gate humano      (fato clínico + jurídico)
    → content/published/*.md
    → site Next.js
```

Nenhum artigo entra no ar só porque o pipeline rodou. Cannabis medicinal é saúde regulada: o gate humano é parte do produto.

## Estrutura

| Pasta | Função |
|---|---|
| `docs/` | Estratégia, pilares, voz, SEO, jurídico, roadmap, Replit |
| `agents/` | Prompts, contratos de handoff e runner da esteira |
| `content/` | Pautas, rascunhos, publicados e catálogo de fontes |
| `web/` | Site Next.js (App Router) — SEO técnico e leitura |

## Começar

```bash
npm run dev          # site em localhost:3000
npm run agent -- --topic "CBD na epilepsia" --keyword "cbd epilepsia"
```

No Replit: importe este repositório. O arquivo `.replit` sobe o Next em `web/`. Guia em [`docs/REPLIT.md`](docs/REPLIT.md).

## Norte

Chegar a milhões de pageviews/mês no Brasil com conteúdo que um médico não se envergonha de indicar e uma mãe consegue ler. Tráfego sem confiança não vira paciente; confiança sem tráfego não vira portal.

Leia [`docs/STRATEGY.md`](docs/STRATEGY.md) antes de escrever qualquer peça.
