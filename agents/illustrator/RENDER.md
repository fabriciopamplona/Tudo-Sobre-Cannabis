# Ilustração — geração e inserção

Etapa **depois** de `05-illustrations-spec.md` e **antes** de `esteira:audit`.

## Entrada

- Spec completo (`source_type`, prompt/cite, caption, alt, title, file, slot)
- `docs/IMAGE-STYLE.md` (técnica + mistura de sujeitos + literature + scrap)
- **Style lock (arte gerada):** `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png`
- Pack / DOI / URL do paper quando `source_type: literature`
- `guide.md` só como inspiração interna quando `inspired_by_post`

## Ordem de trabalho

### Se `generated` ou `inspired_by_post`

1. **Gerar** a partir do `prompt`, com `ilustracao-folhas.png (kit 2.0)` como referência de **técnica**. Se `inspired_by_post`, use a nota do spec (composição/metáfora) — **não** o arquivo do concorrente.
2. **QC visual obrigatório** (abrir a arte ao lado de `ilustracao-folhas.png`):
   - Parece nanquim + aguada no mesmo papel? → ok
   - Parece foto de produto, CGI, vetor chapado ou colagem foto+desenho? → **recusar e regenerar**
   - Fundo branco puro / sem grão de papel `#F7F5EB`? → regenerar
3. Conferir: sujeito do spec (não “humanizar” tudo), zero texto preferível / pt-BR se inevitável, sem título de matéria na capa, sem logo alheio.
4. Se o spec pediu mistura e o lote ficou todo gente: **refazer** as figuras extras com botânica / produto / ciência / lugar.
5. Nunca rodar `cwebp` em arte que falhou o QC.

### Se `literature`

1. Obter a figura do paper (PDF/HTML publisher) **só** se licença/uso editorial permitir; senão `adaptation: redraw` no estilo TSC.
2. Opcional: overlay (moldura papel creme, setas/rótulos pt-BR, crédito já na legenda).
3. Exportar WebP local — **nunca** hotlink para CDN do journal como única fonte em produção.

### Comum a todos

4. Salvar em `web/public/illustrations/<slug>/<file>.webp`
5. Inserir no markdown:

```markdown
Figura: <caption do spec — incluir crédito se literature>
![<alt>](/illustrations/<slug>/<file>.webp "<title>")
```

6. Frontmatter: `image: "/illustrations/<slug>/capa.webp"` (capa).
7. Crédito HTML: *Ilustração editorial* (gerada) ou o texto completo já na `Figura:` (literature).

## Não fazer

- Inventar figura sem spec
- Gerar sem ref canônica quando for arte TSC gerada
- Copiar composição botânica da ref em pauta não-botânica
- Transformar todo o set em cenas de pessoas (monotonia) ou, no inverso, forçar still-life quando o spec pediu pessoa
- Hotlink / cópia com marca de portal concorrente
- Republicar figura de paper sem crédito ou sob licença proibitiva sem permissão
- Alt em inglês ou keyword stuffing
- Pular inserção e mandar ao audit “com arte só na pasta”

## Done when

Todas as figuras do spec existem em disco **e** no corpo (com crédito quando literature); capa no `image:`; aí sim `esteira:audit`.
