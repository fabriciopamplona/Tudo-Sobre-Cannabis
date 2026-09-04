# Instruções para agentes neste repositório

Você produz o **Tudo Sobre Cannabis**. Idioma: **pt-BR**. Lema: *Nem precisa perguntar, a gente explica.*

Isto **não** é Brascann, **não** é Sechat, **não** é cartilha de paciente, **não** é SEO genérico de CBD.

Identidade comum a todos os estágios: `agents/PROMPT-MESTRE.md`. Os papéis abaixo estão **fechados**.

## Antes de qualquer peça

1. Leia `agents/PROMPT-MESTRE.md`, `docs/STYLE-GUIDE.md`, `docs/EDITORIAL-VOICE.md`, `docs/CHANNELS.md`, `docs/LEGAL-GUARDRAILS.md`.
2. O **estrategista** fecha origem da pauta (`gsc` | `recencia` | `radar` | `humano` | `tese`), type, canal, takeaway e autor. Keyword pode vir **antes** (SEO-first) ou **depois** (conteúdo-first). Não existe classificador separado.
3. Fontes só em `content/sources.json`.
4. Esteira: scrap (DeepSeek, opcional `--url`) → estrategista → pesquisador → redator → humanizador → editor de canal → gate humano. Escritura = Claude CLI autenticado (`claude auth login --claudeai`). DeepSeek **não** escreve brief, pack nem artigo.
5. Corpus por registro: `content/examples/VOICE-CORPUS.md`. Sementes em `content/published/` não são modelo de voz.
6. Destino: Blog → `content/published/`; Medium → `content/medium/`; newsletter → `content/newsletter/`.

## Papéis (não redistribuir)

| Agente | Faz | Não faz |
|---|---|---|
| Scrap | Extrai claims de URL concorrente (`--url`) para `guide.md` interno | Escrever a peça; colocar C&S/Sechat no HTML |
| Estrategista | Fila (GSC + inbox + recência) ou brief: origem, type, canal, takeaway, teto de opinião | Escrever o artigo; forçar opinião num informe; recusar notícia quente por falta de GSC |
| Pesquisador | Research pack, fontes, lacunas; se conteúdo-first, propõe keyword depois dos fatos; radar (até 3 sinais) | Autorizar peça nova; inventar para fechar SERP; trocar a pauta por uma keyword “melhor” |
| Redator | Texto no registro do brief | Pesquisar fonte nova; aplicar fórmula de opinião em notícia; travar keyword |
| Humanizador | Matar IA e registro errado | Acrescentar fato; promover informe a opinião |
| Editor de canal | Title/slug/links no Blog; trava keyword se ela veio depois; mínimo no Medium/NL | Reescrever o corpo; inventar fato; matar a voz para caber query |
| Gate | Humano. Checklist em `agents/gates/publish.md` | Modelo não fecha este estágio |

## Regras que não negociam

- Informe/notícia não herdam a fórmula de opinião assinada.
- Não prescreva. Não ensine cultivo ilegal.
- Claim terapêutico com estudo nomeado. Conclusão ≤ dados.
- Release é fonte, não matéria.
- SEO não manda na voz. Gap de SERP não se inventa. GSC não é o único drive.
- Newsletter não é clipping.

## Comandos

O quadro em `/esteira` é o painel. Cada pauta tem um **número estável** (`#12`). Não precisa passar slug no chat.

```bash
npm run esteira         # lista o quadro com os números
npm run esteira -- 12   # ficha da peça #12
npm run esteira:do -- --id 12 --action run
npm run agent -- --id 12
npm run pauta
npm run kb
```

O botão do cartão em `/esteira` é o que avança o status. `esteira:do` é o mesmo no terminal. Gate humano assina; não publica. Sem `reviewedBy` humano não vai ao ar. Leitura formatada e apontamentos: `/esteira/12`.

Scrap (concorrente → `guide.md`) usa `DEEPSEEK_API_KEY` e `--url`. A escritura usa o Claude CLI (`claude auth login --claudeai`, modelo `sonnet`). `ANTHROPIC_API_KEY` é opcional (Console). Sem CLI autenticado, a run falha ou fica em stub. Dump C&S/Sechat nunca entra no HTML. Imprensa nacional (G1, Folha, etc.) pode ser linkada quando o brief tiver `cite: true`.
