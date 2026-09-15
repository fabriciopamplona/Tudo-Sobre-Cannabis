# Publicação evergreen (fila FAP)

**Canônico operacional.** Differencia **conteúdo evergreen** (hubs/informes/ciência atemporal) de **notícia** (recência).

Fuso: **America/Sao_Paulo**. Ritmo: **2 artigos/dia úteis** · **08:00** e **13:00** · **seg–sex** (10/semana). Sem sábado/domingo.

Fila viva: `content/runs/_batch/evergreen-publish-queue.json` · espelho legível: `EVERGREEN-PUBLISH-QUEUE.md`.

## Regra de data (obrigatória)

1. **`datePublished` = data civil do slot** (`scheduled_for` → `YYYY-MM-DD` BRT), nunca o dia do clique se for diferente do slot.
2. **`dateModified`** na primeira publicação = a mesma data do slot.
3. A peça **só entra no ar no horário do slot** (`now ≥ scheduled_for`). Antes disso o botão fica desabilitado; CLI sem `--force-early` recusa.
4. Rede de segurança no site: `getArticles()` só lista posts com `status: published` **e** `datePublished ≤ hoje BRT` — commit antecipado (exceção) não aparece antes do dia.
5. Notícia / publish sem `scheduled_for`: `datePublished` = hoje BRT (comportamento sob demanda).

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
| **Agente FAP (fila)** | Revisão §21 + score; ordena/agenda; **no horário do slot**, `publish` com `reviewedBy: Dr. Fabricio Pamplona` | Inventar fato; publicar antes do slot; pular seo&lt;8,5 / SERP não PRONTO / `fap.pass` false |
| **Humano** | Feedback pós-publish; pause/reordenar fila; notícia fora desta fila; `--force-early` só em exceção explícita | Obrigatório reler cada evergreen antes do slot (opcional) |

Assinatura `reviewedBy` continua **Dr. Fabricio Pamplona** (voz editorial do veículo). O gesto de estilo no evergreen é o **OK FAP-proxy** documentado na fila (`fap_review: ok` + data ISO), não um segundo humano no botão.

## Pré-requisitos por peça (antes do slot)

1. Candidato + ilustras + `image:`
2. `esteira:gate-preflight` limpo
3. Audit APROVAR · seo ≥ 8,5
4. `07-serp-review.md` com linha exata `Veredicto SEO: PRONTO`
5. `esteira:fap-score --write` → `fap.pass`
6. Revisão FAP (`fap-review.mdc`) · §21 ok · anotado na fila
7. Gate-prep atualizado
8. `npm run esteira:evergreen:sync` → coluna **Agendado** + data no card

Se `fap.score` no piso (≈6,5–6,7) ou `needs_fap_polish: true`: **polir voz no dia anterior ao slot**.

## No horário do slot (08:00 ou 13:00 BRT)

**Automático (Mac):** launchd `com.tsc.evergreen-publish` roda `scripts/evergreen-publish-tick.sh` seg–sex às 08:00 e 13:00 — publica due, commit e push.

```bash
npm run esteira:evergreen:install   # uma vez (copia plist + bootstrap)
# log: content/runs/_batch/evergreen-publish.log
```

**Na mão:**

```bash
npm run esteira:evergreen:due
npm run esteira:evergreen:tick      # publish + commit + push dos due
# ou só publish local:
npm run esteira:evergreen:publish
```

Por id (se due):

```bash
npm run esteira:do -- --id N --action publish --reviewer "Dr. Fabricio Pamplona"
```

Exceção (antecipar arquivo; site ainda esconde até o dia):

```bash
npm run esteira:do -- --id N --action publish --reviewer "Dr. Fabricio Pamplona" --force-early
```

No quadro `/esteira`, peças com data ficam na coluna **Agendado** (`meta.scheduled_for`). Botões: **Publicar no horário** (só quando due) · **Voltar ao Gate**.

Atualizar a fila: `status: published`, `published_at`, `date_published` (= slot). O `publish` já marca a fila.

## Notícia vs evergreen

- **Evergreen** → esta fila; data = slot; ar = horário do slot.
- **Notícia / recência** → fora do ritmo 8h/13h; publish sob demanda; `datePublished` = dia do gesto.

## Feedback loop

Se um post publicado “não passa na mesa de bar”: abrir apontamento na peça + nota em `evergreen-publish-queue.json` (`feedback[]`) + ajustar `VOICE-FAP` / score / prompts se o padrão se repetir.
