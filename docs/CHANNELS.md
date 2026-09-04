# Canais do ecossistema

Mesmo assunto, tratamentos diferentes. **Canal** (Blog / Medium / Newsletter) não é a mesma coisa que **registro** (informe / notícia / opinião). Um post no Blog pode ser informe; outro, opinião assinada. A newsletter pode ter um bloco-informe e um bloco de leitura pessoal — são peças distintas, não o mesmo tom no mesmo arquivo.

Não duplicar o Blog no Medium nem transformar a newsletter em portal. Newsletter **não é clipping**: o valor é a seleção (o que merece atenção agora, e por quê). Pode misturar bloco-informe + comentário; não precisa ser 100% pessoal.

| Canal | Função | O que cabe | O que não cabe |
|---|---|---|---|
| **Blog** | Referência factual, pesquisável | informe, notícia, ciência, regulação, mercado, análise, editorial, opinião assinada | misturar opinião de Fabricio numa notícia sem rótulo |
| **Medium** | Pensamento, shelf-life | construção crítica, ciência interpretada, opinião, ensaio | flash de 400 caracteres; informe puro (isso é Blog ou NL) |
| **Newsletter** | Proximidade, curadoria | informe da semana + comentário de leitura; às vezes opinião | clipping de links; parecer um portal; parecer um paper |

Dentro do Blog, a **pirâmide de interpretação** (guia, seção 19) manda no tom — não o fato de estar no domínio.

## Registros no Blog (o ponto que mais se confunde)

| Type | Tom | Interpretação | Assinatura |
|---|---|---|---|
| `informe` | objetivo, curto | mínima (o que muda) | Redação TSC |
| `noticia` | objetivo, contextual | baixa, só em fato | Redação TSC |
| `ciencia` `regulacao` `mercado` | relato rigoroso | baixa a média (limite do dado / da norma) | Redação TSC |
| `analise` | explicativo | média | Redação TSC |
| `editorial` | tese do veículo | alta | Redação TSC (não é o “eu” do Fabricio) |
| `opiniao` | pessoal, crítico | máxima | **Fabricio Pamplona** |

A fórmula “contradição → ciência → regra → incoerência → o que eu penso → desconforto” é da última linha (e, atenuada, do editorial). **Não usar em informe nem em notícia.**

## Um assunto, três peças

Ensaio clínico de CBD e ansiedade:

- **Blog / notícia ou ciência** — *Novo ensaio clínico avalia CBD para transtorno de ansiedade.* Desenho, N, dose, resultado, limitação. Sem “eu”. Sem ironia.
- **Blog / informe** — 500 palavras: o que o paper é, o número principal, a limitação óbvia, link para o estudo.
- **Medium / construção crítica** — *Por que ainda é tão difícil responder se CBD funciona para ansiedade?*
- **Opinião assinada** — se Fabricio quiser tomar posição sobre o hype. Primeira pessoa permitida.
- **Newsletter** — curadoria: “o estudo que vão compartilhar — o que ele realmente mostrou.” Aqui o comentário pessoal pode entrar **depois** do fato, separado.

## Categorias do Blog

informes · notícias · ciência · regulação · mercado · análises · editorial · opinião

Clusters de acesso/condição (`docs/CONTENT-PILLARS.md`) são arquitetura de URL. Informe de RDC não precisa virar ensaio.

## Destino de arquivo

| Peça | Pasta |
|---|---|
| Blog (qualquer registro) | `content/published/` com `type` e `author` no frontmatter |
| Medium | `content/medium/` |
| Newsletter | `content/newsletter/` |

`author: Fabricio Pamplona` só em `opiniao` (e construção crítica assinada). Informe e notícia: `author: Redação Tudo Sobre Cannabis`.

## Superfícies já vivas

- Newsletter: https://tudosobrecannabis.substack.com/
- Medium: https://medium.com/tudosobrecannabis
- Este repo: o Blog (e a esteira que alimenta os três)
