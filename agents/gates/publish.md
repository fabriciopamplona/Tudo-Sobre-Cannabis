# Gate de publicação

Checklist preenchido pelo agente (`gate-prep` → `05-gate-prep.md`).  
**Evergreen:** OK de estilo = agente FAP-proxy (`docs/EVERGREEN-PUBLISH.md` + §21); publish com `reviewedBy: Dr. Fabricio Pamplona` no slot da fila.  
**Notícia / exceção:** OK humano no botão. Modelo **não** inventa outro nome em `reviewedBy`.

## Recorte

- [ ] `takeaway` em uma frase, fiel ao brief
- [ ] Brief do estrategista seguido (`origin`, type, canal; keyword locked ou candidata conforme `seo_timing`)
- [ ] `type` correto: informe/notícia não saíram com voz de opinião assinada
- [ ] `author: Fabricio Pamplona` só se `type: opiniao`
- [ ] Teto de opinião respeitado
- [ ] Blog hub: alinhado a `docs/REFERENCE-FORMAT.md` (#4) quando o brief pediu âncora

## Voz

- [ ] Abertura sem preâmbulo milenar / “mercado em crescimento”
- [ ] Fecho sem “futuro promissor” / “em conclusão”
- [ ] Passa no corpus (`content/examples/VOICE-CORPUS.md`) — parece TSC, não portal de paciente
- [ ] Alinhado a `docs/VOICE-FAP.md` (cientista sem jaleco; ciência para pensar)
- [ ] `esteira:fap-score` ≥ piso do registro (`docs/FAP-SCORE.md`); `fap.pass` true
- [ ] Revisão FAP pré-publish (`.cursor/rules/fap-review.mdc`) — voz assinável
- [ ] Teste autenticidade §21 (4 perguntas) — evergreen: agente FAP-proxy; notícia: humano no OK
- [ ] Não poderia estar no site da empresa citada / Anvisa genérica
- [ ] Primeira pessoa só se o brief permitiu
- [ ] Ironia, se houver, seca — não aponta para paciente ou sofrimento
- [ ] Sem em-dash `—` na prosa; sem “vale ressaltar” / “estudos comprovam”

## Fato e ciência

- [ ] Claim terapêutico com fonte nomeada (autor, ano, desenho)
- [ ] Linguagem no nível da evidência (“sugere” / “os dados não permitem concluir”)
- [ ] Inferência não está disfarçada de texto da norma ou do paper
- [ ] Ciência: dose, N, endpoints, limitações; COI/financiamento como contexto, não prova de má ciência
- [ ] Fontes divergentes representadas sem falsa equivalência
- [ ] Norma conferida no texto oficial (data da consulta: ____)
- [ ] Número de mercado com ano, metodologia, e se é nominal/real, receita/volume/valuation/projeção
- [ ] Checklist factual: nomes, datas, unidades, doses, jurisdição, pioneirismo — sem inventar; gaps do draft já fechados ou reescritos no candidato
- [ ] Nenhuma instrução de cultivo/extração ilegal
- [ ] Conclusão ≤ dados; previsão, se houver, rotulada
- [ ] Um especialista consideraria a interpretação justa

## Acabamento: citações, lacunas, pull quotes (Blog)

Consistência com `docs/STYLE-GUIDE.md` §21 / §35b / §53 e `docs/REFERENCE-FORMAT.md`:

- [ ] Citações no corpo: `Autor et al., ANO` com link (DOI/PubMed) — sem ficha completa no parágrafo
- [ ] `## Referências` com forma completa + o mesmo link (quando a peça cita estudo)
- [ ] **Zero** `[LACUNA` no candidato (fechou com fonte ou reescreveu; limão = falha se aparecer)
- [ ] Afirmações fortes/polêmicas relevantes têm `>` de divisória (frase também no corpo)
- [ ] Fecho: Referências (se couber) → `## Leituras relacionadas` → `## Sobre o blog` canônico (`authors.ts`)

## Independência

- [ ] Nenhum ator é herói ou vilão automático
- [ ] Sem moralismo (“natural = seguro”, “cannabis é boa/ruim”)
- [ ] Fecho sem forçar solução, esperança ou “futuro promissor”

## Canal e acabamento (Blog)

- [ ] Title/slug/canibalização ok; FAQ só se o texto responde; keyword travada no texto que já existia se conteúdo-first
- [ ] 3–7 internos no corpo; externos só allowlist/jornada
- [ ] Parceiro comercial (Fito): banners lateral + meio do post no template do Blog (não colar no markdown); rótulo “Parceiro Comercial”
- [ ] Ilustras: existe `05-illustrations-spec.md` (prompt + legenda + alt) **e** WebPs inseridos no corpo (`Figura:` + `![]`); texto na arte em pt-BR; `image` no frontmatter
- [ ] Scores em `06-scores.md`: factual ≥ 8, editorial ≥ 7, **seo ≥ 8,5** (meta ≥ 9) — senão devolver ao audit/improve
- [ ] `07-serp-review.md` com **Veredicto SEO: PRONTO** (agente serp-reviewer)
- [ ] Medium / newsletter: destino certo, sem stuffing

## OK de publish

**Revisado por:** Dr. Fabricio Pamplona (assinatura editorial)  
**Data:** automática no gesto / data civil do slot evergreen

| Modo | Quando | Quem confirma §21 |
|---|---|---|
| **FAP-proxy (evergreen)** | Fila 08h/13h seg–sex | Agente (`fap-review.mdc` + score) |
| **Humano** | Notícia, exceção, ou pedido explícito | Fabricio no `/esteira` |

Comando: `npm run esteira:do -- --id N --action publish --reviewer "Dr. Fabricio Pamplona"`  
Lote evergreen: `npm run esteira:cron-fila:publish -- --reviewer "Dr. Fabricio Pamplona" --ids N` + commit/push.
