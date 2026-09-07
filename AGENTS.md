# Instruções para agentes neste repositório

Você produz o **Tudo Sobre Cannabis**. Idioma: **pt-BR**. Lema: *Nem precisa perguntar, a gente explica.*

Isto **não** é Brascann, **não** é Sechat, **não** é cartilha de paciente, **não** é SEO genérico de CBD.

Identidade comum a todos os estágios: `agents/PROMPT-MESTRE.md`. Os papéis abaixo estão **fechados**.

## Antes de qualquer peça

1. Leia `agents/PROMPT-MESTRE.md`, `docs/STYLE-GUIDE.md`, `docs/EDITORIAL-VOICE.md`, `docs/CHANNELS.md`, `docs/LEGAL-GUARDRAILS.md`. Formato Blog âncora: `docs/REFERENCE-FORMAT.md` (peça #4).
2. O **estrategista** fecha origem da pauta (`gsc` | `recencia` | `radar` | `humano` | `tese`), type, canal, takeaway e autor. Keyword pode vir **antes** (SEO-first) ou **depois** (conteúdo-first). Não existe classificador separado.
3. Fontes só em `content/sources.json`.
4. Esteira: scrap (DeepSeek, opcional `--url`) → estrategista → pesquisador → redator → humanizador → editor de canal → **spec de ilustras** → **geração/inserção de imagens** → `esteira:audit` até seo ≥ 8,5 → **SERP IA** (`07-serp-review.md` PRONTO) → **gate-prep IA** → **OK humano único** (publish com `reviewedBy`). Escritura = Claude CLI autenticado (`claude auth login --claudeai`). DeepSeek **não** escreve brief, pack nem artigo.
5. Corpus por registro: `content/examples/VOICE-CORPUS.md`. Sementes antigas em `content/published/` não são modelo de voz; a peça #4 é modelo de **formato**.
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
| OK humano | Um gesto: assina + publica (`publish` + revisor) | Modelo no `reviewedBy` |

## Regras que não negociam

- Informe/notícia não herdam a fórmula de opinião assinada.
- Não prescreva. Não ensine cultivo ilegal.
- Claim terapêutico com estudo nomeado. Conclusão ≤ dados.
- Release é fonte, não matéria.
- SEO não manda na voz. Gap de SERP não se inventa. GSC não é o único drive. Blog: seo ≥ 8,5 antes do OK (meta ≥ 9). SERP IA PRONTO + OK humano no publish.
- Newsletter não é clipping.
- Formato Blog âncora: `docs/REFERENCE-FORMAT.md`. Ilustras: `docs/IMAGE-STYLE.md` + kit `docs/visual/kit-moderno/` (técnica; **misturar** botânica/clínica/produto/ciência/lugar/cotidiano/pessoa — sem set só de gente; **figuras de paper com crédito**; inspiração em post-fonte sem clonar marca; spec → render; preferir zero texto na arte, senão pt-BR). Marca/UI: `docs/BRAND.md`.

## Comandos

O quadro em `/esteira` é o painel. Cada pauta tem um **número estável** (`#12`). Não precisa passar slug no chat.

```bash
npm run esteira         # lista o quadro com os números
npm run esteira -- 12   # ficha da peça #12
npm run esteira:do -- --id 12 --action run
npm run esteira:audit   # scores + improve até floors (seo ≥ 8,5 no Blog)
npm run esteira:audit -- --phase finish  # SERP + gate-prep
npm run esteira:pack-check  # caça 1015/2025 e '1.015 substitui 660' em packs
npm run agent -- --id 12
npm run pauta
npm run kb
```

O botão do cartão em `/esteira` é o que avança o status. `esteira:do` é o mesmo no terminal. No Gate: **OK e publicar** = assina + no ar (staging opcional: só assinar). Sem `reviewedBy` humano não vai ao ar. Sem seo ≥ 8,5 ou sem SERP PRONTO no Blog, não publica. Pack defasado não pode derrubar texto com URL DOU (ver `agents/audit-gate.mjs` + `content/runs/_batch/PACK-STALE-INVENTORY.md`). Leitura formatada e apontamentos: `/esteira/12`.

Scrap (concorrente → `guide.md`) usa `DEEPSEEK_API_KEY` e `--url`. A escritura usa o Claude CLI (`claude auth login --claudeai`, modelo `sonnet`). `ANTHROPIC_API_KEY` é opcional (Console). Sem CLI autenticado, a run falha ou fica em stub. Dump C&S/Sechat nunca entra no HTML. Imprensa nacional (G1, Folha, etc.) pode ser linkada quando o brief tiver `cite: true`.
