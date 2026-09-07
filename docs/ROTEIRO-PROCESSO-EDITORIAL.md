# Roteiro do processo editorial — Tudo Sobre Cannabis

**Documento de arquivo** · pt-BR · consolidado em 2026-09-06  
**Canônico no repo:** `AGENTS.md`, `agents/pipeline.json`, `docs/REFERENCE-FORMAT.md`, `docs/IMAGE-STYLE.md`, `agents/illustrator/`, `agents/gates/`

Lema: *Nem precisa perguntar, a gente explica.*

---

## Visão geral

**Inbox → Fila → Esteira → Gate → (Aprovado opcional) → No ar** (ou **Fora**).

Cada pauta tem `#` estável. Identidade: `agents/PROMPT-MESTRE.md`.

| Papel | Quem |
|---|---|
| Scrap (opcional) | DeepSeek |
| Brief → candidato + spec de ilustras | Claude CLI |
| Render de imagens | Humano + gerador |
| Audit + SERP + prep do gate | Claude (IA) |
| OK único (reviewedBy + publicar) | Humano |

DeepSeek **não** escreve brief, pack nem artigo.

### Fecho consolidado (humano fino)

```
ilustras → Audit IA (loop) → SERP IA → Gate-prep IA → [OK humano = gate + publish]
```

Bloqueio automático se BLOQUEAR, seo < 8,5 (Blog) ou SERP ≠ PRONTO.

---

## Roteiro etapa a etapa

### 0. Origem da pauta
**Quem:** humano e/ou Estrategista (Claude)  
**Onde:** inbox, GSC, radar, tese  
**Faz:** origem `gsc` | `recencia` | `radar` | `humano` | `tese`; keyword antes ou depois

### 1. Scrap (opcional)
**Agente:** Scraper · **DeepSeek** · `guide.md`  
Claims de concorrente; não vai C&S/Sechat ao HTML.

### 2. Brief
**Estrategista · Claude · `00-brief.md`**  
Takeaway, type, canal, autor, teto de opinião. Para se `nao-escrever`. Norma sem DOU = não inventar ano.

### 3. Research pack
**Pesquisador · Claude · `01-research-pack.md`**  
Fontes, `[LACUNA]` no pack se faltar primária, keyword candidata. `pack_status: synced` quando corrigido.

### 4. Rascunho
**Redator · Claude · `02-draft.md`**  
Registro do brief; hub = `REFERENCE-FORMAT`. Pode herdar/marcar `[LACUNA: …]` — nunca inventar.

### 5. Humanização
**Humanizador · Claude · `03-humanized.md`**  
Mata IA / em-dash; sem fato novo; não inventa para fechar LACUNA.

### 6. Editor de canal (candidato)
**SEO-editor · Claude · `04-publish-candidate.md`**  
Title/slug/description; links no corpo; keyword; fecho Leituras + Sobre o blog.  
**Zera `[LACUNA`:** fecha com fonte verificável ou reescreve o trecho (ver `STYLE-GUIDE` §21).  
**Não** gera WebP — só handoff para ilustras.

### 7. Spec de ilustras (prompt + legenda + alt)
**Illustrator-spec · Claude + humano · `05-illustrations-spec.md`**  
Guia: `docs/IMAGE-STYLE.md` + **ref** `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` + `agents/illustrator/SYSTEM.md`

Para **cada** figura (capa + 2–3 no hub):

| Campo | Conteúdo |
|---|---|
| Prompt | Prompt-base IMAGE-STYLE (técnica + sujeito equilibrado: botânica/clínica/produto/ciência/lugar/cotidiano/pessoa) **ou** figura de paper / inspiração de post-fonte (ver IMAGE-STYLE) |
| Style ref | `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` (técnica); literature: crédito na `Figura:` |
| Legenda | Linha `Figura: …` |
| Alt | `![alt]` acessível em pt-BR |
| Title | Tooltip curto |
| file / slot | `capa.webp` etc.; cover ou body + ponto de inserção |

**Não** gera o arquivo de imagem nesta etapa.

### 8. Geração e inserção de imagens
**Illustrator-render · humano + gerador · WebPs + markdown**  
Guia: `agents/illustrator/RENDER.md` — anexar `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` no gerador.

1. Gerar arte a partir do prompt do spec  
2. Exportar WebP → `web/public/illustrations/<slug>/`  
3. Inserir no candidato:

```markdown
Figura: <legenda>
![<alt>](/illustrations/<slug>/<arquivo>.webp "<title>")
```

4. `image: "/illustrations/<slug>/capa.webp"` no frontmatter  

### 9. Auditoria de qualidade (IA)
**Auditor · Claude · `06-scores.md`**  
`npm run esteira:audit` → improve → reaudit  

Floors: factual ≥ 8 · editorial ≥ 7 · **seo ≥ 8,5** (meta ≥ 9).

### 10. Keyword / SERP (IA)
**serp-reviewer · Claude · `07-serp-review.md`**  
`npm run esteira:audit -- --phase serp` (preferir com busca web real)  
Veredicto **PRONTO** obrigatório no Blog antes do OK humano.

### 11. Prep do gate (IA)
**gate-prep · Claude · `05-gate-prep.md`**  
`npm run esteira:audit -- --phase gate-prep` ou `--phase finish` (serp + prep)  
Preenche `agents/gates/publish.md` (citações, **zero LACUNA**, pull quotes, Referências). **Não** assina `reviewedBy`.

### 12. OK humano único
**Humano · botão OK e publicar** (ou `esteira:do … publish --reviewer "Dr. Fabricio Pamplona"`)  
Assina `05-gate.md` (**Revisado por** + **Data**) **e** copia ao destino do canal. Staging opcional: só assinar → coluna Aprovado → Publicar.  
No Blog: candidato sem `[LACUNA`; citação abreviada + Referências + pull quotes (`docs/STYLE-GUIDE.md` §21 / §35b).

→ `content/published/` (Blog) / medium / newsletter.

---

## Tabela-resumo

| # | Etapa | Agente | Quem | Artefato |
|---:|---|---|---|---|
| 0 | Pauta | Humano + Estrategista | Claude | inbox / queue |
| 1 | Scrap | Scraper | DeepSeek | `guide.md` |
| 2 | Brief | Estrategista | Claude | `00-brief.md` |
| 3 | Pack | Pesquisador | Claude | `01-research-pack.md` |
| 4 | Draft | Redator | Claude | `02-draft.md` |
| 5 | Humanizar | Humanizador | Claude | `03-humanized.md` |
| 6 | Candidato | Editor de canal | Claude | `04-publish-candidate.md` |
| 7 | Spec ilustras | Illustrator-spec | Claude + humano | `05-illustrations-spec.md` |
| 8 | Render ilustras | Illustrator-render | Humano + imagegen | WebP + markdown |
| 9 | Audit | Auditor | Claude | `06-scores.md` |
| 10 | SERP | serp-reviewer | Claude | `07-serp-review.md` |
| 11 | Gate prep | gate-prep | Claude | `05-gate-prep.md` |
| 12 | OK + publish | — | Humano | `05-gate.md` + destino |

---

## Comandos

```bash
npm run esteira
npm run esteira -- 12
npm run esteira:do -- --id 12 --action run
npm run esteira:audit
npm run esteira:audit -- --phase finish   # SERP + gate-prep
npm run esteira:pack-check
# OK único (gate + no ar):
npm run esteira:do -- --id 12 --action publish --reviewer "Dr. Fabricio Pamplona"
```

---

*Tudo Sobre Cannabis — roteiro editorial consolidado (arquivo).*
