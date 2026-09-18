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

## Review de slug (pré-publish, obrigatória)

Antes de gravar o arquivo, o publish faz **slug-review**:

1. **Canônico do arquivo** = `slug` do frontmatter em `04-publish-candidate.md`.
2. Sem slug no candidato → **bloqueia**.
3. Slug com formato inválido → **bloqueia**.
4. Se a pasta do run / fila diverge do candidato: registra `file_slug` + `run_slug` na fila; o markdown vai para `content/published/<file_slug>.md`.
5. `esteira:gate-preflight` avisa divergência (warn) antes do audit.

Commit pós-publish usa **file_slug** e também a pasta de ilustras do **run_slug** (quando existir).

## Commit automático (após cada postagem)

`npm run esteira:evergreen:publish` (e o tick 08h/13h) faz, **por peça**:

1. slug-review → publish → `content/published/<file_slug>.md`
2. `git add` do markdown (+ ilustras)
3. `git commit` + `git push origin HEAD` → Vercel

Helper: `scripts/evergreen-commit.mjs`. Dry-run: `--dry-run`. Sem git: `--no-commit`.

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

**Automático (Mac):** launchd `com.tsc.evergreen-publish` roda `scripts/evergreen-publish-tick.sh` seg–sex às **08:00 e 13:00**, com **retry 08:15 e 13:15** (se o Mac dormiu na hora cheia, o :15 pega slots due). Sáb/dom não dispara.

O Mac precisa estar **ligado e acordado** nesses minutos. `sleep` curto no Energy Saver / caffeinate no horário do slot evita furo.

```bash
npm run esteira:evergreen:install   # uma vez (copia plist + bootstrap)
# log: content/runs/_batch/evergreen-publish.log
```

**Na mão:**

```bash
npm run esteira:evergreen:due
npm run esteira:evergreen:tick      # = publish com commit/push
npm run esteira:evergreen:publish   # idem (use --no-commit só em debug)
```

Por id (se due) — **não** faz commit sozinho; preferir a fila evergreen:

```bash
npm run esteira:do -- --id N --action publish --reviewer "Dr. Fabricio Pamplona"
# depois, se publicou na mão:
node scripts/evergreen-commit.mjs --id N --file-slug <slug> --run-slug <run>
```

Exceção (antecipar arquivo; site ainda esconde até o dia):

```bash
npm run esteira:evergreen:publish -- --force-early
```

No quadro `/esteira`, peças com data ficam na coluna **Agendado** (`meta.scheduled_for`). Botões: **Publicar no horário** (só quando due) · **Voltar ao Gate**.

Atualizar a fila: `status: published`, `published_at`, `date_published`, `file_slug`, `run_slug`. O `publish` já marca a fila.

## Notícia vs evergreen

- **Evergreen** → esta fila; data = slot; ar = horário do slot.
- **Notícia / recência** → fora do ritmo 8h/13h; publish sob demanda; `datePublished` = dia do gesto.

## Feedback loop

Se um post publicado “não passa na mesa de bar”: abrir apontamento na peça + nota em `evergreen-publish-queue.json` (`feedback[]`) + ajustar `VOICE-FAP` / score / prompts se o padrão se repetir.
