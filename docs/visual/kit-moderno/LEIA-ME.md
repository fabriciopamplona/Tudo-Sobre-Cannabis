# Kit para adaptar — Tudo Sobre Cannabis

Comece por **ABRIR-GUIA.html**: guia visual offline, sem instalação. A especificação completa está em **01-diretrizes/STYLE-GUIDE.md** e os prompts em **01-diretrizes/PROMPTS-CAPAS.md**.

- 01-diretrizes: direção atual, layout, componentes, estados, tipografia, tokens e prompts.
- 02-marca: logos SVG/PNG, símbolo e favicon.
- 03-ilustracoes: masters PNG e versões WebP.
- 04-fontes: Manrope variável e licença OFL.
- 05-exemplos-codigo: home, post, componentes, conteúdo publicado e patch da proposta.
- 06-historico: PDF do estudo anterior; não é a especificação atual.

Para executar o exemplo: entre em 05-exemplos-codigo/web, execute `npm ci` e depois `npm run dev -- --webpack --port 3001`. Requer Node compatível com Next 16 e instalação das dependências. O package.json reproduz macOS ARM; outras plataformas podem exigir ajuste das dependências nativas. Para incorporar ao blog existente, prefira os componentes e assets, revisando o patch em vez de substituir todo o projeto.

Abra / para a home ou /acesso/autorizacao-anvisa-cannabis para o post ilustrado. O guia HTML é uma referência visual estática; busca e filtros funcionais estão no exemplo Next.

Build de produção: há erro preexistente de tipagem em src/app/api/esteira/route.ts:50; veja o style guide. Conteúdo editorial reproduzido sem revisão factual nesta entrega. O pacote não inclui credenciais, node_modules nem caches.
