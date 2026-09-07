# Instruções para novas capas — direção moderna

## Style lock (obrigatório)

Anexar sempre: `docs/visual/kit-moderno/03-ilustracoes/ilustracao-folhas.png`  
Técnica: **nanquim fino + aquarela** em papel marfim `#F7F5EB`. Não é foto. Não é vetor flat.

## Prompt-base (capas e figuras)

```
Hand-drawn editorial illustration matching Tudo Sobre Cannabis kit 2.0
style lock (ilustracao-folhas.png): fine dark nanquim ink linework + soft
sage/olive watercolor washes on clean ivory paper (#F7F5EB), translucent
washes that may bleed slightly outside lines, optional light watercolor
splatters, subtle peach/terracotta accents (~10%), generous negative space,
visible paper grain. Contemporary botanical-editorial plate craft.
Tema: [TEMA / SUJEITO CONCRETO DA PAUTA].
Prefer ZERO text. If a tiny label is unavoidable: Brazilian Portuguese only (Rx ok).
HARD BANS: photography, photoreal product shot, CGI/3D, glossy studio lighting,
flat vector UI/infographic, sticker collage, neon, psychedelia, aged parchment,
vintage stamps, logos, watermarks, signatures, article title typography.
Aspect ~3:2.
```

Variações de sujeito (misturar no hub; capa não precisa ser gente):

1. Introdução à planta: folha palmada em primeiro plano; nervuras legíveis; respiro à esquerda.
2. Produto clínico: frasco conta-gotas **desenhado** (não foto), prancheta, mesa — traço + aguada.
3. Ciência: vidraria, esquema molecular simplificado, paper aberto — sem DOI inventado na arte.
4. Lugar / cotidiano: farmácia de esquina, corredor, mesa com documentos — atmosfera, não skyline.
5. Pessoa (≤1–2 por peça): consulta sóbria, sem sofrimento, sem “família feliz com óleo”.

## Fluxo

1. Spec com prompt-base completo (não condensar para “flat vector”).
2. Gerar com style lock anexado.
3. **QC visual** contra `ilustracao-folhas.png` (mesma técnica?).
4. Se falhar QC → regenerar (não “melhorar no Photoshop” virando foto).
5. Master ~3:2 → `cwebp` → `web/public/illustrations/<slug>/`.
6. Inserir `Figura:` + `![]` + `image:` no candidato.
7. Só então `esteira:audit`.

As cores pedidas à geração são aproximadas; o QC confere se o ofício (linha + aguada + papel) bate com o kit.
