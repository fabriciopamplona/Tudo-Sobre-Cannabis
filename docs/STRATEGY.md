# Estratégia — Tudo Sobre Cannabis

## Tese

O Tudo Sobre Cannabis **já existe** como voz: newsletter no [Substack](https://tudosobrecannabis.substack.com/) e ensaios no [Medium](https://medium.com/tudosobrecannabis). Este repo é o Blog e a esteira que alimentam esse ecossistema — não um portal genérico de paciente e não o site da Brascann.

O diferencial não é explicar o que é CBD. É olhar para um paper, uma RDC, uma decisão da Anvisa ou um movimento de mercado e perguntar: **certo, mas o que isso significa de verdade?**

Clareza + rigor + interpretação. Informar é o ponto de partida. Construir entendimento é o produto.

O tráfego orgânico (milhões de views) é meta de mídia do **Blog**. Sem a voz, é só mais um site de cannabis. Sem o Blog pesquisável, a voz fica presa no Substack.

## Norte (3 anos)

Ser o maior veículo de conteúdo sobre cannabis do Brasil — ciência, regulação, mercado, cultura e acesso — medido em:

1. Pageviews orgânicos mensais do Blog
2. Páginas no top 10 para clusters de acesso, norma e condição (quando a URL for essa)
3. Citações em buscas de IA
4. Assinantes da newsletter (Substack) e leitores recorrentes do Medium

Milhões de views/mês é meta de mídia, não vanity. Sustenta-se com **biblioteca densa + autoridade + atualização + voz**. Volume vazio é penalidade.

## Para quem escrevemos

A **voz** fala com o leigo informado (~20–40 anos): cannabis, saúde, ciência, política de drogas, inovação, mercado. Densidade técnica vale; jargão se traduz.

| Persona | Onde aparece | O que não aguenta |
|---|---|---|
| Leigo informado | todos os canais | cartilha, release, militância |
| Familiar / paciente | Blog acesso; newsletter quando a pauta é jornada | milagre, golpe, moralismo |
| Prescritor / farmacêutico | ciência, regulação, análise | texto infantilizado **ou** paper sem tradução |
| Indústria / imprensa | mercado, regulação | Sechat disfarçado de TSC; propaganda |

ICP de SEO do Blog (familiar/paciente em URLs de acesso) e ICP da voz (ensaio) não são o mesmo conjunto. A URL pode mirar o primeiro; a prosa precisa do segundo.

## Ecossistema

```
Blog (o que aconteceu e o que significa)
  ⇄ Medium (como pensar sobre isso)
  ⇄ Newsletter (no que prestar atenção agora)
       ⇄ opinião assinada (o que eu penso — e por quê)
```

Um assunto vira até três tratamentos. Ver `docs/CHANNELS.md` e `docs/STYLE-GUIDE.md`.

Conversão, se houver, é efeito de quem voltou porque o texto fez pensar. Hard sell na primeira dobra mata o veículo.

## O que ganhamos no ranking (Blog)

**Ganhamos** se a URL responde uma intenção real, cita fonte primária, liga o cluster e se atualiza quando a norma ou o paper muda — **sem** virar listicle.

**Perdemos** se reescrevemos a Wikipedia, fazemos pSEO de cidade sem dado, ou competimos no ano 1 com “comprar óleo CBD”.

## Camadas do Blog

1. **Referência factual** — notícia, ciência, regulação, mercado (atualização)
2. **Clusters pesquisáveis** — acesso, condições, canabinoides, família, regulação (`docs/CONTENT-PILLARS.md`)
3. **Editorial / análise / opinião** — tese, não resumo

Os clusters de condição continuam válidos. O tom **não** é WebMD.

## Esteira

`agents/pipeline.json`: estrategista (chefe de redação: origem da pauta + registro) → pesquisador → redator → humanizador → editor de canal → gate humano.

O GSC não é o único drive. Fila semanal (`npm run pauta`) mistura Search Console, inbox humano (`content/opportunities/inbox.md`), radar do pesquisador e recência. Peça conteúdo-first: `npm run agent -- --topic "..." --origin humano` (keyword depois). Peça SEO-first: passe `--keyword` e `--origin gsc`.

Melhor 5 peças que reconhecem a voz do que 30 medianas.

## Scorecard semanal

| Métrica | Meta trimestre 1 | Dono |
|---|---|---|
| Peças com gate ok (todos os canais) | 8/semana após s5 | Editorial |
| Mix Blog / Medium / Newsletter | não deixar só hub de condição | Editorial |
| Indexação Search Console (Blog) | > 80% | SEO |
| Claims sem fonte / conclusão > dados | 0 | Gate |
| Voz: passa no corpus | 100% das publicadas | Humanizador + gate |
| CWV mobile | verde | Web |

## O que este repo deliberadamente não é

- Site da Brascann, release, ou texto setorial estilo Sechat
- Cartilha “dez coisas que você precisa saber sobre CBD”
- Tutorial de cultivo/extração (política de cultivo entra)
- Comparador de preços de óleo
- Máquina de pSEO para 5.570 municípios
