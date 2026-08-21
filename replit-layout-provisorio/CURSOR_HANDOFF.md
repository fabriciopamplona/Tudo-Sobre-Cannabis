# Como implementar este layout no Cursor

## Contexto

O app publicado neste repositório usa Next.js dentro da pasta `web/`. A referência de interface do Replit será publicada em `replit-layout-provisorio/`. Ela é uma fonte visual e de tokens; não deve substituir conteúdo, automações ou rotas existentes.

## Ordem recomendada

1. Leia `replit-layout-provisorio/DESIGN_SYSTEM.md`.
2. Compare a referência em `replit-layout-provisorio/src/App.tsx` e `replit-layout-provisorio/src/index.css`.
3. Crie os tokens de cor e fontes na camada global do Next.js (`web/src/app/globals.css`).
4. Atualize primeiro o chrome global e a home; mantenha o modelo e as fontes de conteúdo já existentes.
5. Em seguida, aplique os mesmos tokens ao template de artigo em `web/src/app/[pillar]/[slug]/page.tsx`.
6. Preserve as URLs, os slugs, o conteúdo em Markdown e as automações editoriais existentes.

## Prompt sugerido para o Cursor

```text
Use `replit-layout-provisorio/DESIGN_SYSTEM.md` como a fonte de verdade visual.
Refatore somente a camada de apresentação do app em `web/`, sem alterar conteúdo,
schema, pipelines editoriais, rotas existentes, geração de sitemap ou dados.

Implemente os tokens de cor e tipografia descritos no design system.
Atualize `web/src/components/SiteChrome.tsx`, a home e as páginas de artigo para
seguirem a hierarquia editorial: papel, verde-escuro, lima, terracota; Fraunces para
títulos, DM Sans para leitura e DM Mono para metadados.

Não crie uma faixa de métricas no hero. Preserve acessibilidade, responsividade e
comportamento existente. Ao terminar, liste arquivos modificados e explique como
validar a interface localmente.
```

## Mapeamento de referência para o Next.js

| Referência visual | Aplicação existente |
| --- | --- |
| `replit-layout-provisorio/src/App.tsx` | `web/src/app/page.tsx` e `web/src/components/SiteChrome.tsx` |
| `replit-layout-provisorio/src/index.css` | `web/src/app/globals.css` |
| Template de post no Canvas | `web/src/app/[pillar]/[slug]/page.tsx` |
| Dados demonstrativos do layout | Conteúdo em `content/published/` e helpers de `web/src/lib/` |

## Critérios de aceite

- A home mantém a arquitetura de conteúdo atual, mas adota a nova linguagem visual.
- Uma matéria longa continua legível em desktop e celular.
- Títulos, metadados, links e CTAs usam as três famílias tipográficas corretas.
- O projeto continua rodando pelo fluxo existente do repositório.
## Referência aprovada para artigos

Para páginas de matéria, use primeiro replit-layout-provisorio/post-template/ArticleExploded.tsx e seu CSS. Esta é a direção editorial aprovada: página dedicada em tela cheia, sem modal ou overlay, com o cabeçalho “Tudo Sobre Cannabis” completo, papel/off-white dominante, verde principal como acento estrutural, Fraunces para títulos, DM Sans para leitura e DM Mono para metadados.

O template anterior em replit-layout-provisorio/post-template/ArticleTemplate.tsx permanece disponível apenas para comparação. Preserve o conteúdo Markdown, slugs, rotas, dados e automações existentes ao integrar.
