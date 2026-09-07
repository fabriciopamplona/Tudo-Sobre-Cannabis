# Ilustração — geração e inserção

Etapa **depois** de `05-illustrations-spec.md` e **antes** de `esteira:audit`.

## Entrada

- Spec completo
- `docs/IMAGE-STYLE.md`
- **Style lock técnica:** `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png`
- **Style lock ofício:** 1 arquivo em `docs/visual/kit-moderno/03-ilustracoes/refs-publicadas/` (#1–#4)
- Pack / DOI quando `literature`
- `guide.md` só como inspiração interna quando `inspired_by_post`

## Ordem de trabalho

### Se `generated` ou `inspired_by_post`

1. **Gerar** com prompt do spec + refs de técnica e ofício anexadas.
2. **QC visual obrigatório** (arte ao lado de `ilustracao-folhas.png` e de `#1` ou `#3`):
   - Nanquim + **aguada** no mesmo papel? → ok
   - Parece flat / vetor chapado / ícone / cor sólida sem lavagem? → **recusar** e regenerar puxando aquarela
   - Foto, CGI, colagem? → recusar
   - Capa = consultório genérico quando o spec pediu objeto/ciência? → recusar
   - Fundo branco puro sem `#F7F5EB`? → regenerar
3. Conferir: sujeito do spec, zero texto preferível / pt-BR se inevitável, sem folha-logo.
4. Se o lote ficou todo gente: refazer extras com botânica / produto / ciência / papel.
5. Nunca `cwebp` em arte que falhou o QC.

### Se `literature`

1. Obter figura só se licença permitir; senão redraw no estilo TSC.
2. Overlay opcional; crédito na `Figura:`.
3. WebP local — sem hotlink de journal.

### Comum a todos

4. Salvar em `web/public/illustrations/<slug>/<file>.webp`
5. Inserir `Figura:` + `![…](…)` no markdown
6. Frontmatter: `image: "/illustrations/<slug>/capa.webp"`
7. Crédito: *Ilustração editorial* ou texto completo na `Figura:` (literature)

## Não fazer

- Inventar figura sem spec
- Gerar sem refs canônicas
- Usar prompts com “vetorial plano” / “flat vector”
- Transformar todo o set em consultório
- Hotlink / cópia de concorrente
- Pular inserção e mandar ao audit “com arte só na pasta”

## Done when

Todas as figuras do spec existem em disco **e** no corpo; capa no `image:`; QC aquarela ok; aí `esteira:audit`.
