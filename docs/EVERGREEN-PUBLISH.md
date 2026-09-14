# Publicação evergreen (fila FAP)

**Canônico operacional.** Differencia **conteúdo evergreen** (hubs/informes/ciência atemporal) de **notícia** (recência).

Fuso: **America/Sao_Paulo**. Ritmo: **2 artigos/dia úteis** · **08:00** e **13:00** · **seg–sex** (10/semana). Sem sábado/domingo.

Fila viva: `content/runs/_batch/evergreen-publish-queue.json` · espelho legível: `EVERGREEN-PUBLISH-QUEUE.md`.

## O que é FAP-voice neste fluxo

Última passagem de estilo: **“Fabricio Pamplona assinaria?”**

| Artefato | Papel |
|---|---|
| `docs/VOICE-FAP.md` §21 | 4 perguntas de autenticidade |
| `docs/FAP-SCORE.md` + `npm run esteira:fap-score` | Score ≥ piso do registro; `fap.pass` |
| `.cursor/rules/fap-review.mdc` | Procedimento de revisão/polimento |

Não substitui factual/SEO. Substitui a **revisão humana de estilo** no ritmo evergreen, com feedback posterior se algo ruim passar.

## Papéis (evergreen)

| Quem | Faz | Não faz |
|---|---|---|
| **Agente FAP (fila)** | Revisão §21 + score; ordena/agenda; no slot, `publish` com `reviewedBy: Dr. Fabricio Pamplona` sob este processo | Inventar fato; pular seo&lt;8,5 / SERP não PRONTO / `fap.pass` false |
| **Humano** | Feedback pós-publish; pause/reordenar fila; notícia fora desta fila | Obrigatório reler cada evergreen antes do slot (opcional) |

Assinatura `reviewedBy` continua **Dr. Fabricio Pamplona** (voz editorial do veículo). O gesto de estilo no evergreen é o **OK FAP-proxy** documentado na fila (`fap_review: ok` + data ISO), não um segundo humano no botão.

## Pré-requisitos por peça (antes do slot)

1. Candidato + ilustras + `image:`
2. `esteira:gate-preflight` limpo
3. Audit APROVAR · seo ≥ 8,5
4. `07-serp-review.md` com linha exata `Veredicto SEO: PRONTO`
5. `esteira:fap-score --write` → `fap.pass`
6. Revisão FAP (`fap-review.mdc`) · §21 ok · anotado na fila
7. Gate-prep atualizado

Se `fap.score` no piso (≈6,5–6,7) ou `needs_fap_polish: true`: **polir voz no dia anterior ao slot**.

## No horário do slot

```bash
npm run esteira:evergreen:sync   # garante coluna Agendado + datas no quadro
# dry-run
npm run esteira:cron-fila:publish -- --dry-run --reviewer "Dr. Fabricio Pamplona" --ids N
# publish (evergreen OK FAP-proxy)
npm run esteira:cron-fila:publish -- --reviewer "Dr. Fabricio Pamplona" --ids N
git add content/published/<slug>.md && git commit -m "…" && git push
```

No quadro `/esteira`, peças com data ficam na coluna **Agendado** (campo `meta.scheduled_for`). Botões: **Publicar agora** · **Voltar ao Gate**.

Atualizar a fila: `status: published`, `published_at`, commit SHA.  
`datePublished` / `dateModified` = data civil do slot (YYYY-MM-DD).

## Notícia vs evergreen

- **Evergreen** → esta fila.
- **Notícia / recência** → fora do ritmo 8h/13h; publish sob demanda (humano ou agente com brief `recencia`).

## Feedback loop

Se um post publicado “não passa na mesa de bar”: abrir apontamento na peça + nota em `evergreen-publish-queue.json` (`feedback[]`) + ajustar `VOICE-FAP` / score / prompts se o padrão se repetir.
