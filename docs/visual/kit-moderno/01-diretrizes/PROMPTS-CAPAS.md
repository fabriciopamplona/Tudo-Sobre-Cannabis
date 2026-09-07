# Instruções para novas capas — direção aquarela / pintura digital

## Style lock (obrigatório)

Anexar sempre:

1. `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png` (técnica)
2. Uma capa publicada `#1–#4` em `docs/visual/kit-moderno/03-ilustracoes/refs-publicadas/` (ofício)

**Direção:** pintura digital editorial com **aguada aquarela** + nanquim.  
Se o modelo oscilar entre flat e aquarela → **escolher aquarela**.

Não é foto. Não é vetor flat. Não é “cor chapada”.

## Prompt-base (capas e figuras)

```
Hand-painted editorial illustration for Tudo Sobre Cannabis — digital watercolor
+ fine nanquim ink (kit 2.0 + published covers #1–#5 craft). Soft sage/olive washes
on clean ivory paper (#F7F5EB), translucent color that may bleed slightly outside
lines, light watercolor splatters, subtle peach/terracotta accents (~10%), visible
paper grain, gentle painted volume/shadows (NOT flat vector, NOT solid color blocks).
Tema: [SUJEITO CONCRETO E CRIATIVO DA PAUTA — preferir objeto/ciência/botânica/papel
na CAPA; evitar consultório com gente na capa].
Prefer ZERO text. If a tiny label is unavoidable: Brazilian Portuguese only (Rx ok).
HARD BANS: photography, photoreal product shot, CGI/3D, glossy studio lighting,
flat vector, flat design, UI infographic, sticker collage, neon, psychedelia,
aged parchment, logos, watermarks, signatures, article title typography,
cannabis leaf used as repeating logo mark.
Aspect ~3:2.
```

## Ideias de sujeito (variar; não defaultar consulta)

1. **Papel / regulação:** receita, carimbo (vazio se norma pendente), pasta, selo — como #1/#2.
2. **Produto clínico:** frasco conta-gotas **pintado**, gota, caixa neutra — volume + aguada.
3. **Ciência:** vidraria, molécula em nanquim, paper, EEG — como #3/#4.
4. **Botânica com intenção:** tricoma, flor resinosa, ramo — não a folha-logo genérica.
5. **Lugar / cotidiano:** envelope de importação, mesa de pesquisa, farmácia de esquina **sem** gente.
6. **Pessoa (raro na capa):** só quando o brief pedir; no hub, ≤1–2 no total.

## Fluxo

1. Spec com prompt-base completo (proibido condensar para “flat vector” / “vetorial”).
2. Gerar com style locks anexados (folhas + ref publicada).
3. **QC** contra `ilustracao-folhas.png` **e** `#1` ou `#3`: mesma molhadura?
4. Se falhar QC → regenerar puxando mais aguada (não “corrigir” virando foto).
5. Master ~3:2 → `cwebp` → `web/public/illustrations/<slug>/`.
6. Inserir `Figura:` + `![]` + `image:` no candidato.
7. Só então `esteira:audit`.
