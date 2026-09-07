# Esteira editorial

O estrategista é o chefe de redação. Ele classifica o registro **e** decide se a pauta é SEO-first (GSC) ou conteúdo-first (inbox, radar, recência). Não há agente classificador. Identidade comum: `PROMPT-MESTRE.md` (injetada em todo estágio pelo runner).

```
npm run esteira        # quadro + números (#12)
npm run esteira -- 12  # ficha da peça
npm run esteira:do -- --id 12 --action run
npm run esteira:batch  # Esteira (resume → candidato)
npm run esteira:batch -- --column queued  # Fila do zero até candidato
npm run esteira:audit  # scores + improve + reaudit (seo ≥ 8,5)
npm run esteira:audit -- --phase finish  # SERP + gate-prep
npm run agent -- --id 12
npm run pauta          # fila → content/opportunities/queue.md (lê também inbox.md)
npm run agent -- --topic "Anvisa publica nota..." --channel blog --type noticia --origin humano
npm run agent -- --topic "RDC 1015" --keyword "rdc 1015 cannabis" --channel blog --type informe --origin gsc
npm run agent -- --topic "..." --url "https://..." --channel blog --origin radar
```

Cada pauta tem um número em `content/opportunities/ledger.json`. O kanban em `/esteira` (noindex) mostra esse número no cartão. **Ler e apontar:** `/esteira/12`. O botão do cartão avança o status (não arrasta). `npm run agent -- --id 12` puxa topic/slug/canal da ficha. No chat, `trabalha o #12` basta.

Peça: scrap opcional (`--url`, DeepSeek) → estrategista → pesquisador → redator → humanizador → editor de canal → **spec de ilustras** → **geração/inserção** → audit até seo ≥ 8,5 → **SERP IA** → **gate-prep IA** → **OK humano único** (publish).

Formato Blog âncora: `docs/REFERENCE-FORMAT.md`. Ilustras: `docs/IMAGE-STYLE.md` + `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` + `agents/illustrator/`.

DeepSeek **não** escreve. Brief, pack e artigo usam o Claude CLI autenticado (`claude auth login --claudeai`).

O editor de canal trava keyword, insere links no corpo e deixa prompts de ilustra; não mata a voz para caber query.

Se o brief vier `action: nao-escrever` (canibalização da *história* ou da head, conforme a origem), a esteira para.

Pautas manuais e sinais de radar: `content/opportunities/inbox.md`. GSC: colar export em `content/opportunities/search-console.json`. Sem GSC a fila **não** para.
