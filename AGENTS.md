# Instruções para agentes neste repositório

Você produz o **Tudo Sobre Cannabis**. Idioma: **pt-BR**. Lema: *Nem precisa perguntar, a gente explica.*

Isto **não** é Brascann, **não** é Sechat, **não** é cartilha de paciente, **não** é SEO genérico de CBD.

Identidade comum a todos os estágios: `agents/PROMPT-MESTRE.md`. Os papéis abaixo estão **fechados**.

## Antes de qualquer peça

1. Leia `agents/PROMPT-MESTRE.md`, `docs/STYLE-GUIDE.md`, `docs/VOICE-FAP.md`, `docs/EDITORIAL-VOICE.md`, `docs/CHANNELS.md`, `docs/LEGAL-GUARDRAILS.md`. Formato Blog âncora: `docs/REFERENCE-FORMAT.md` (peça #4).
2. O **estrategista** fecha origem da pauta (`gsc` | `recencia` | `radar` | `humano` | `tese`), type, canal, takeaway e autor. Keyword pode vir **antes** (SEO-first) ou **depois** (conteúdo-first). Não existe classificador separado.
3. Fontes só em `content/sources.json`.
4. Esteira: scrap (DeepSeek, opcional `--url`) → estrategista → pesquisador → redator → humanizador → editor de canal → **spec de ilustras** → **geração/inserção de imagens** → `esteira:gate-preflight` → `esteira:audit` até seo ≥ 8,5 → **SERP IA** (`07-serp-review.md` PRONTO) → **`esteira:fap-score`** (piso do registro) → **revisão FAP** (`.cursor/rules/fap-review.mdc` — “Fabricio assinaria?”) → **gate-prep IA** → **publish**. **Evergreen:** OK de estilo = agente FAP-proxy + fila `docs/EVERGREEN-PUBLISH.md` (2/dia úteis 08h/13h); `reviewedBy: Dr. Fabricio Pamplona`. **Notícia/recência:** OK humano opcional. Feedback pós-publish melhora o crivo. Escritura = Claude CLI autenticado (`claude auth login --claudeai`). DeepSeek **não** escreve brief, pack nem artigo.
5. Corpus por registro: `content/examples/VOICE-CORPUS.md`. Voz autoral: `docs/VOICE-FAP.md`. Sementes antigas em `content/published/` não são modelo de voz; a peça #4 é modelo de **formato**.
6. Destino: Blog → `content/published/`; Medium → `content/medium/`; newsletter → `content/newsletter/`.

## Papéis (não redistribuir)

| Agente | Faz | Não faz |
|---|---|---|
| Scrap | Extrai claims de URL concorrente (`--url`) para `guide.md` interno | Escrever a peça; colocar C&S/Sechat no HTML |
| Estrategista | Fila (GSC + inbox + recência) ou brief: origem, type, canal, takeaway, teto de opinião | Escrever o artigo; forçar opinião num informe; recusar notícia quente por falta de GSC |
| Pesquisador | Research pack, fontes, lacunas no pack; se conteúdo-first, propõe keyword depois dos fatos; radar (até 3 sinais) | Autorizar peça nova; inventar para fechar SERP; trocar a pauta por uma keyword “melhor” |
| Redator | Texto no registro do brief (flash ou hub); `[LACUNA]` no draft se faltar fato | Pesquisar fonte nova; aplicar fórmula de opinião em notícia; travar keyword |
| Humanizador | Matar IA e registro errado; sem em-dash; não inventa para fechar LACUNA | Acrescentar fato; promover informe a opinião |
| Editor de canal | Title/slug; links **no corpo**; trava keyword; fecho hub; **zera LACUNA** no candidato (fonte ou reescrita); handoff para ilustras | Inventar fato; matar a voz para caber query; gerar WebP |
| Spec de ilustras | Prompt + `Figura:` + alt; literature com crédito; inspiração de scrap | Gerar o arquivo; hotlink de concorrente |
| Render de ilustras | Gerar/adaptar → WebP → inserir markdown + `image:` | Inventar figura sem spec; copiar marca alheia |
| Auditoria | `esteira:audit` / improve até seo ≥ 8,5 | Pular score e mandar ao OK humano |
| SEO/SERP | Agente: keyword + SERP reais; `07-serp-review.md` PRONTO | Inventar volume; trocar hub por tutorial se a peça for mapa |
| Gate-prep | Preenche checklist (`05-gate-prep.md`) | Assinar `reviewedBy`; publicar |
| OK humano / FAP-proxy | Evergreen: agente revisa §21 + publica no slot da fila (`docs/EVERGREEN-PUBLISH.md`) com `reviewedBy: Dr. Fabricio Pamplona`. Notícia: humano pode OK direto | Inventar fato; publicar sem `fap.pass` / SERP PRONTO / seo ≥ 8,5 |

## Regras que não negociam

- Informe/notícia não herdam a fórmula de opinião assinada.
- Não prescreva. Não ensine cultivo ilegal.
- Claim terapêutico com estudo nomeado. Conclusão ≤ dados.
- Release é fonte, não matéria.
- SEO não manda na voz. Gap de SERP não se inventa. GSC não é o único drive. Blog: seo ≥ 8,5 antes do publish (meta ≥ 9). SERP IA PRONTO + FAP ≥ piso + §21 (evergreen: FAP-proxy; notícia: humano opcional).
- Newsletter não é clipping.
- Formato Blog âncora: `docs/REFERENCE-FORMAT.md`. Ilustras: `docs/IMAGE-STYLE.md` + kit `docs/visual/kit-moderno/` (aquarela/pintura digital; refs #1–#5; capa sem consultório; **misturar** botânica/produto/ciência/papel/lugar/cotidiano/pessoa — sem set só de gente; **figuras de paper com crédito**; inspiração em post-fonte sem clonar marca; spec → render; preferir zero texto na arte, senão pt-BR). Marca/UI: `docs/BRAND.md`. **Parceiro comercial (Fito):** banners lateral + meio do post no template de toda peça Blog (arte → WhatsApp; legenda → site; rótulo “Parceiro Comercial”) — não colar no markdown.

## Comandos

O quadro em `/esteira` é o painel. Cada pauta tem um **número estável** (`#12`). Não precisa passar slug no chat.

```bash
npm run esteira         # lista o quadro com os números
npm run esteira -- 12   # ficha da peça #12
npm run esteira:do -- --id 12 --action run
npm run esteira:gate-preflight -- --ids N  # checklist local antes do audit (GATE-OPS)
npm run esteira:fap-score -- --ids N [--write]  # score FAP (VOICE-FAP); piso por registro
npm run esteira:evergreen       # fila evergreen (próximos slots)
npm run esteira:evergreen:next  # próximo slot
npm run esteira:evergreen:due   # slots vencidos (hora de publicar)
npm run esteira:evergreen:sync  # meta.scheduled_for → coluna Agendado
npm run esteira:evergreen:publish  # publish dos due; datePublished = data do slot
npm run esteira:evergreen:tick     # publish + commit + push (o que o launchd chama)
npm run esteira:evergreen:install  # arma launchd 08h·13h seg–sex
npm run esteira:audit   # scores + improve até floors (seo ≥ 8,5 no Blog)
npm run esteira:audit -- --phase finish  # SERP + gate-prep
npm run esteira:pack-check  # caça 1015/2025 e '1.015 substitui 660' em packs
npm run esteira:cron-fila -- --finish          # hora cheia: texto (sem ilustras)
npm run esteira:cron-fila:finish               # lote final: fila de ilustras+SERP
npm run esteira:cron-fila:nightly              # arma lote 22:00 (10×1/hora); launchd com.tsc.cron-fila-nightly
npm run esteira:cron-fila:publish -- --reviewer "Dr. Fabricio Pamplona"  # gate_ready (evergreen: FAP-proxy)
npm run agent -- --id 12
npm run pauta
npm run kb
```

Ops Gate: `content/runs/_batch/GATE-OPS.md`. Evergreen: `docs/EVERGREEN-PUBLISH.md` + `content/runs/_batch/EVERGREEN-PUBLISH-QUEUE.md` (2/dia 08h·13h seg–sex; OK FAP-proxy; **datePublished = data do slot**; ar só no horário). Cron-Fila nightly: `content/runs/_batch/CRON-FILA.md` (22:00 × 10 × 1/hora; `partial` ≠ `gate_ready`).
O botão do cartão em `/esteira` avança o status. Publish evergreen: agente **no horário do slot** com `reviewedBy: Dr. Fabricio Pamplona`. Notícia: OK humano opcional. Sem seo ≥ 8,5, sem SERP PRONTO ou sem `fap.pass`, não publica. Pack defasado não derruba texto com URL DOU. Leitura: `/esteira/12`.

Scrap (concorrente → `guide.md`) usa `DEEPSEEK_API_KEY` e `--url`. A escritura usa o Claude CLI (`claude auth login --claudeai`, modelo `sonnet`). `ANTHROPIC_API_KEY` é opcional (Console). Sem CLI autenticado, a run falha ou fica em stub. Dump C&S/Sechat nunca entra no HTML. Imprensa nacional (G1, Folha, etc.) pode ser linkada quando o brief tiver `cite: true`.
