# Tudo Sobre Cannabis

Portal editorial de cannabis no Brasil. O objetivo não é “ter um blog”: é ser a referência que o leigo informado, o prescritor e a família abrem primeiro — com a voz que o Tudo Sobre Cannabis já tem no Substack e no Medium.

Este repositório junta **conteúdo**, **agentes de produção** e **site**. A interface visual pode ser iterada no Replit; a fonte da verdade permanece aqui.

## Como o sistema funciona

```
GSC  +  inbox humano  +  radar (tendência / notícia quente)  +  recência
    → 0. Estrategista   (origem da pauta, registro, canal; keyword antes ou depois)
    → 1. Pesquisador    (fontes; se conteúdo-first, propõe query depois dos fatos)
    → 2. Redator
    → 3. Humanizador
    → 4. Editor de canal (trava keyword se ela veio depois)
    → gate humano
    → Blog / Medium / newsletter
```

Nenhum artigo entra no ar só porque o pipeline rodou. Cannabis medicinal é saúde regulada: o gate humano é parte do produto.

## Estrutura

| Pasta | Função |
|---|---|
| `docs/` | Estratégia, **guia de estilo**, voz, canais, pilares, SEO, jurídico, Replit |
| `agents/` | Prompt-mestre, papéis fechados, runner da esteira |
| `content/` | Publicados, Medium, newsletter, fontes, fila (`opportunities/`: GSC + inbox) |
| `web/` | Site Next.js (App Router) — SEO técnico e leitura |

## Começar

```bash
npm run pauta        # fila (GSC + inbox + recência)
npm run esteira      # quadro da esteira, com número de cada pauta
npm run esteira -- 12
npm run agent -- --id 12
npm run dev          # site em localhost:3000
npm run agent -- --topic "Anvisa publica nota..." --channel blog --type noticia --origin humano
npm run agent -- --topic "RDC 1015" --keyword "rdc 1015 cannabis" --channel blog --type informe --origin gsc
```

No Replit: importe este repositório. O arquivo `.replit` sobe o Next em `web/`. Guia em [`docs/REPLIT.md`](docs/REPLIT.md).

## Norte

Chegar a milhões de pageviews/mês no Brasil com conteúdo que um médico não se envergonha de indicar e uma mãe consegue ler. Tráfego sem confiança não vira paciente; confiança sem tráfego não vira portal.

Leia [`docs/STRATEGY.md`](docs/STRATEGY.md) e [`docs/STYLE-GUIDE.md`](docs/STYLE-GUIDE.md) antes de escrever qualquer peça.
