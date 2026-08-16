# Instruções para agentes neste repositório

Você está produzindo o portal **Tudo Sobre Cannabis**, referência em cannabis medicinal no Brasil. Idioma: **pt-BR**. Audiência: pacientes, familiares, cuidadores e profissionais de saúde.

## Antes de qualquer artigo

1. Leia `docs/STRATEGY.md`, `docs/EDITORIAL-VOICE.md` e `docs/LEGAL-GUARDRAILS.md`.
2. Confirme o pilar e a keyword em `content/taxonomy.json`.
3. Use **somente** fontes de `content/sources.json`. Se a fonte não está na lista, não cite. Proponha inclusão no catálogo em vez de improvisar.
4. Rode a esteira na ordem: pesquisador → redator → humanizador → editor SEO. Não pule etapa.
5. Grave artefatos em `content/runs/<slug>/`. Só copie para `content/published/` depois do gate humano.

## Regras que não negociam

- Não é aconselhamento médico. Não prescreva dose, produto ou via como se fosse receita.
- Não ensine cultivo, extração ou acesso ilegal.
- Não faça claim terapêutico sem estudo nomeado (autores, ano, desenho). “Estudos mostram” é recusa.
- Não soe como IA: leia `agents/humanizer/SYSTEM.md` mesmo se você for o redator.
- Não publique thin content programático. Cada URL precisa de evidência específica daquele tema.
- CTAs levam a entendimento e acesso legal (médico, ANVISA, associação), não a hard sell.

## Onde mexer

- Texto publicado: `content/published/*.md` (frontmatter + Markdown).
- Site: `web/src/`. Leia `web/AGENTS.md` (regras do Next.js 16) antes de alterar o App Router.
- Prompts da esteira: `agents/*/SYSTEM.md`. O contrato de handoff está em `agents/contracts/handoff.schema.json`.

## Comando

```bash
npm run agent -- --topic "..." --keyword "..." [--slug "..."]
```
