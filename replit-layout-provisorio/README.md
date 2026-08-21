# Layout provisório — Tudo Sobre Cannabis

Esta pasta é a referência visual desenvolvida no Replit para a nova capa do portal. Ela não substitui a aplicação editorial em `web/` deste repositório: é um handoff de interface para ser incorporado ao projeto Next.js já existente.

## O que está incluído

- `src/App.tsx` — implementação de referência da home em React.
- `src/index.css` — tokens de cor, tipografia, animações e estilos da referência.
- `post-template/` — exemplo de estrutura visual para uma matéria longa.
- post-template/ArticleExploded.tsx e post-template/ArticleExploded.css — versão aprovada de artigo em página inteira, sem modal, com marca completa “Tudo Sobre Cannabis”.
- `DESIGN_SYSTEM.md` — decisões de design que devem permanecer ao levar o layout para produção.
- `CURSOR_HANDOFF.md` — instruções práticas para o Cursor implementar a interface no app Next.js.

## Objetivo do handoff

O portal deve transmitir leitura calma, apuração e independência editorial. O layout privilegia títulos amplos, blocos de texto respiráveis, uma paleta de papel/verde e ilustrações abstratas no lugar de fotos genéricas.

## Importante

O conteúdo no código de referência é demonstrativo. Ao integrar, mantenha os dados e rotas de publicação que já existem no projeto e aplique somente a camada de apresentação.