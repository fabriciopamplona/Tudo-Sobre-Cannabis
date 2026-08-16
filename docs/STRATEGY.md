# Estratégia — Tudo Sobre Cannabis

## Tese

O Brasil já tem centenas de milhares de pessoas em tratamento com cannabis medicinal e um mar de conteúdo ruim: copy de loja, medo moral, jargão médico intraduzível. Quem ocupar o meio — **preciso o suficiente para o prescritor, claro o suficiente para a família** — leva a busca orgânica do tema.

Este portal não é o site da marca. É um veículo. A conversão (paciente, familiar, prescritor) acontece porque a pessoa voltou três vezes e confiou. Hard sell na primeira dobra mata isso.

## Norte (3 anos)

Ser o maior portal de conteúdo de cannabis medicinal do Brasil, medido em:

1. Pageviews orgânicos mensais
2. Páginas no top 10 para o cluster de condições + acesso
3. Citações em buscas de IA (Google AI Overviews, ChatGPT, Perplexity)
4. Cadastros de jornada (newsletter / guia de acesso) — não “leads de anúncio”

Milhões de views/mês é meta de mídia, não de vanity. Só se sustenta com **biblioteca densa + autoridade de domínio + atualização**. Volume vazio (10 mil páginas iguais) é o caminho mais rápido para penalidade.

## Para quem escrevemos

| Persona | Trabalho a fazer | O que ela busca | O que não aguenta |
|---|---|---|---|
| Familiar (mãe, filho, cônjuge) | Entender se “isso é real” e como começar sem cair em golpe | “como importar”, “receita”, “epilepsia CBD”, “é legal?” | Marketing de óleo milagroso |
| Paciente adulto | Dor, sono, ansiedade, Parkinson, cuidados paliativos | evidência, efeitos, como falar com o médico | Moralismo e “maconha recreativa” no H1 |
| Prescritor / farmacêutico | Atualizar-se sem ler 40 papers | RDC, evidência por condição, vias | Texto infantilizado |
| Gestor / imprensa / jurídico | Números e marco regulatório | Kaya Mind, ANVISA, STJ | Opinião sem fonte |

ICP de aquisição: **familiar + paciente**. Prescritor é autoridade e backlink, não o centro do funil.

## O que ganhamos no ranking (e o que não)

**Ganhamos** se cada URL:

- Responde uma intenção de busca real em pt-BR
- Cita fonte primária (ANVISA, CFM, paper, tribunal)
- Liga para 3–7 peças do cluster (hub → spoke)
- É atualizada quando a RDC ou a evidência muda

**Perdemos** se:

- Reescrevemos a Wikipedia com sinônimos
- Fazemos pSEO de cidade sem dado local (“cannabis em Jundiaí” idêntico a “em Bauru”)
- Competimos com site de clínica em query transacional (“comprar óleo CBD”) no ano 1 — autoridade de domínio ainda não existe

Ano 1 é **informacional e navegacional de acesso**. Transacional vem quando o domínio já é citado.

## Pilares (resumo)

Detalhe em `docs/CONTENT-PILLARS.md`.

1. **Acesso e jornada** — receita, ANVISA, importação, associação, SUS
2. **Condições** — um hub por indicação com evidência própria
3. **Canabinoides e produtos** — CBD, THC, espectro, vias (educação, não vitrine)
4. **Família e cuidado** — linguagem, escola, estigma, o que perguntar ao médico
5. **Regulação e direito** — RDCs, CFM, judicialização, números do mercado

## Esteira editorial

Pipeline sequencial com gate. Ver `agents/pipeline.json`.

Custo e qualidade: melhor 5 peças excelentes/semana do que 30 medianas. No trimestre 1 a meta é **biblioteca-semente** (hubs), não cadência de revista.

## Concorrência (hipótese de trabalho)

No Brasil o SERP de cannabis medicinal é dividido entre clínicas (querem lead), e-commerces, veículos generalistas (UOL, G1) e ONGs. Quase ninguém faz **cluster de condição com paper + jornada de acesso no mesmo domínio**. Essa é a lacuna.

Não tentamos ganhar “cannabis” genérico no mês 1. Ganhamos “como tirar autorização ANVISA cannabis”, “CBD para epilepsia refratária”, “RDC 327 o que mudou”.

## Funil (sem fingir que somos só jornalismo)

```
busca / IA cita o artigo
  → lê 1 hub + 2 spokes
    → guia “Como começar” / newsletter
      → encaminhamento ético a prescritor / associação / farmácia de manipulação
```

O produto de conversão (clínica, marca, marketplace) **não vive neste repo no dia 1**. O portal precisa parecer — e ser — editorialmente independente. Parcerias entram como diretório auditado, nunca como copy paga disfarçada.

## Scorecard semanal

| Métrica | Meta trimestre 1 | Dono |
|---|---|---|
| Artigos publicados (gate humano ok) | 8/semana a partir da semana 5 | Editorial |
| Indexados no Search Console | > 80% dos publicados | SEO técnico |
| Hub de condição no ar | 12 | Editorial |
| Imp. médicas / claim sem fonte | 0 | Gate |
| Core Web Vitals (mobile) | todos verdes | Web |
| Cadastros guia de acesso | definir no mês 2 | Crescimento |

## O que este repo deliberadamente não é

- Fórum de cultivo recreativo
- Comparador de preços de óleo
- Site da Brascann (ou de qualquer indústria) com URL de conteúdo
- Máquina de pSEO fino para “cannabis + 5.570 municípios”
