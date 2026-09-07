# Tudo Sobre Cannabis — style guide moderno
Versão 2.0 · direção aprovada em setembro de 2026

## 1. Conceito
Botânica contemporânea: desenho orgânico detalhado combinado com tipografia sem serifa, composição limpa e contraste forte. O site deve comunicar curiosidade, clareza e responsabilidade. O papel é levemente amarelado, uniforme, sem efeito envelhecido. Textura fica restrita à ilustração. Esta versão substitui a direção tipográfica do guia anterior.

## 2. Marca
Usar logo-verde.svg sobre marfim ou superfícies claras; logo-marfim.svg sobre verde escuro. logo-fundo-marfim.svg inclui fundo. PNG transparente serve a apresentações e ferramentas que não aceitam SVG. SVGs têm letras convertidas em curvas: não dependem de fonte instalada. A folha continua como símbolo da marca; flores também podem aparecer nas capas.
Manter proporção e cores. Não esticar, inclinar, acrescentar sombras ou redesenhar o lettering. Reserva recomendada: ao menos 1/4 da altura do símbolo em todos os lados. No cabeçalho: área de 200 × 70 px no desktop e 174 × 61 px no celular, com object-fit: contain. A imagem contém respiro próprio. Para dimensões muito pequenas usar favicon.svg simplificado; não reduzir a folha detalhada até perder leitura. Manter links da marca com nome acessível “Tudo Sobre Cannabis”.

## 3. Cores
Papel #F7F5EB: fundo principal. Superfície #FFFEF8: cartões e campos. Verde profundo #073F35: títulos, corpo de destaque e hero. Verde vivo #D4F08A: chamada principal, filtro ativo e acentos. Terracota #9E422D: categorias e rótulos em fundo claro. Argila #DD7556: acento ilustrativo, não texto pequeno. Texto secundário #53665B; sálvia #455F52; linhas #D6DCCF.
Usar texto verde profundo sobre verde vivo. Não usar verde vivo como texto sobre marfim. Sobre fundo escuro, usar marfim ou #DCE8D9. Linhas suaves são divisores decorativos, não o único indicador de interação. Seleção e estados precisam também de texto, borda ou semântica.

## 4. Tipografia
Manrope variável, incluída com licença OFL, hospedada localmente. Pesos: 400 para leitura, 700 para navegação e botões, 800 para títulos. Arial e sans-serif como fallback. Evitar serifas ornamentais e caixa alta em títulos longos.
Hero: clamp(3.4rem, 7.1vw, 7rem), peso 800, entrelinha 1.02, tracking -0.075em; no celular clamp(3rem, 11.8vw, 5.3rem). Seções: clamp(2.5rem, 4.4vw, 4.2rem), entrelinha 1.04, tracking -0.06em. Título de post: clamp(2.65rem, 6.5vw, 5.8rem), entrelinha 1.04, tracking -0.065em. Cards: 1.65rem, entrelinha 1.17; destaque até 2.75rem. Corpo: aproximadamente 17–20 px, entrelinha 1.65–1.85. Rótulos: 10–11 px, peso 700/800, tracking 0.08–0.13em. Rótulos devem ser curtos; informações essenciais têm tamanho de corpo.
Esses valores reproduzem a proposta. Para títulos novos, revisar quebras e reduzir tracking se prejudicar leitura. Não forçar quebras em todas as larguras.

## 5. Layout da home
Manter a ordem existente: faixa editorial → cabeçalho → hero → arquivo → carta da redação → newsletter → rodapé.
Container máximo 1320 px. Margens laterais de 20 px no celular e 32 px no desktop. Hero em duas colunas a partir de 960 px, proporção 1.12 / 0.88, gap 48 px, alinhadas ao centro. Coluna esquerda: rótulo, lema “Nem precisa perguntar.”, introdução, CTA e link para arquivo. Coluna direita: metadados e card com imagem acima do texto. No celular, empilhar conteúdo antes do destaque.
Seções: 88 px de padding vertical no desktop e 56 px no celular. Escala recomendada: 4, 8, 12, 16, 24, 32, 48, 64, 88 px. O arquivo mantém busca, chips e primeiro card horizontal em destaque. A partir de 720 px, grade de duas colunas, destaque abrangendo ambas; abaixo, uma coluna. Chips podem rolar horizontalmente sem gerar rolagem da página.
Cabeçalho fixo no topo, opaco em marfim. Navegação principal a partir de 960 px, menu no celular. Logo sempre legível e com respiro. Não cobrir âncoras com o cabeçalho: usar scroll-margin-top.

## 6. Componentes e estados
Botão primário: fundo verde vivo, texto verde profundo em 800, raio 8 px, altura mínima 48 px. Hover: superfície marfim. Secundário: texto ou contorno conforme fundo, mesma área clicável. Ícones interativos: pelo menos 44 × 44 px e nome acessível.
Cards: superfície clara, borda suave, raio 12 px; destaque do hero 16 px. Hover com deslocamento de -3 px e borda mais forte, sem sombra pesada. Conteúdo: categoria → título → resumo → autoria/data/tempo → link de leitura.
Busca: fundo claro, borda, raio 8 px, padding 12 × 16 px e rótulo acessível. Foco perceptível também no conjunto do campo. Chips: altura mínima 44 px, selecionado verde vivo e aria-pressed. Estado vazio: explicar ausência de resultados e oferecer “Ver todas as leituras”.
Foco visível: contorno terracota de 3 px com afastamento de 4 px; nas áreas escuras, contorno verde vivo. Erros de formulário devem ter mensagem textual associada ao campo; sucesso só após confirmação real. Não simular inscrição ou envio. A newsletter do exemplo mantém o destino Substack existente.

## 7. Post e leitura
Manter cabeçalho de leitura com voltar ao arquivo, marca e ações; categoria/data; título; resumo; autoria/revisão/tempo; conteúdo com ilustrações; índice lateral; relacionados; rodapé. Títulos sem serifa em 800, texto longo com linha confortável e coluna aproximadamente 42–43 rem. Índice lateral vira fluxo vertical em telas pequenas. Usar h1 único e hierarquia h2/h3 coerente.
As imagens informativas levam legenda, crédito e texto alternativo adequado; imagens puramente decorativas têm alt vazio. Preservar tabela e diagrama como conteúdo acessível sempre que possível. As figuras internas e o texto do post Anvisa foram mantidos conforme o projeto recebido; esta entrega não representa revisão factual nem autorização de publicação editorial.

## 8. Ilustrações e capas
Desenho botânico em nanquim fino e aguadas controladas. Folhas e flores em escala maior, recortes ousados e áreas de cor planas. Uma figura principal com no máximo dois apoios. Alternar ramo, folha, inflorescência e detalhe; não repetir a mesma capa em toda a produção.
Fundo marfim limpo; sálvia e verde-oliva com terracota pontual. Não envelhecer papel, adicionar carimbos, caligrafia falsa, acessórios vintage, molduras ornamentais ou psicodelia. Composição permite área de respiro e recortes. Não gerar palavras dentro da imagem: título e categorias são HTML ou composição editorial posterior.
Matriz futura: 2400 × 1600 px (3:2). Masters atuais: 1536 × 1024 px. Exportar WebP/AVIF conforme tamanho efetivo; manter PNG mestre. Revisar recortes 1:1 e 1200 × 630 para redes. Os assets WebP do exemplo têm largura 1100 px. Não esticar; usar object-fit: cover, object-position ajustado por imagem. Texto e detalhes científicos precisam de revisão humana.

## 9. Movimento e acessibilidade
Transições curtas, aproximadamente 150–200 ms para botões e destaques. Evitar animações contínuas e movimento ornamental. Respeitar prefers-reduced-motion e assegurar que conteúdo permaneça visível. Navegação por teclado, nomes acessíveis em ícones, rótulos reais em inputs e foco visível são obrigatórios. Conferir zoom, títulos longos, ausência de imagem e telas estreitas antes da adoção.

## 10. Adaptação técnica
A proposta usa Next.js/React e CSS, mas os tokens e assets podem ser aplicados em WordPress ou outro CMS. globals.css mantém a base existente; modern.css é carregado depois para aplicar a direção nova. Não copiar somente modern.css sem mapear suas classes e variáveis. layout.tsx configura Manrope por next/font/local. SiteChrome aplica marca; EditorialArt aplica imagens; page.tsx mantém a estrutura da home; HomeArchive mantém filtros; [pillar]/[slug]/page.tsx é o modelo de post.
O patch contém apenas alterações de texto e precisa de fonte e imagens junto. Revisar contra a versão atual do seu repositório antes de aplicar. O código exportado reproduz o estado da prévia, não inclui node_modules, caches ou variáveis de ambiente. Inclui rotas da esteira por fidelidade ao projeto, mas o pacote traz apenas conteúdo publicado; o funcionamento administrativo depende dos demais arquivos do projeto original.

## 11. Validação e limites
Home e post renderizados, desktop e viewport de 390 px inspecionados; filtro e menu móvel conferidos. ESLint passou nos componentes alterados. Webpack compilou. O build completo foi interrompido por erro de TypeScript preexistente em src/app/api/esteira/route.ts:50: id opcional usado onde id é obrigatório. Corrigir esse ponto no projeto antes de produção. O ambiente de origem usa macOS ARM e contém dependências de plataforma; ajustar as dependências nativas ao usar outro sistema.
