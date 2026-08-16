# Esteira editorial

Quatro especialistas em sequência, com contrato de handoff e um gate humano no fim. Padrão: **pipeline + evaluator** (o SEO e o gate recusam, não “melhoram em silêncio” fatos).

```bash
npm run agent -- --topic "Autorização ANVISA para cannabis" --keyword "autorização anvisa cannabis"
```

Sem `ANTHROPIC_API_KEY` ou `OPENAI_API_KEY`, o comando só abre a pasta da pauta e grava os prompts — útil para rodar no Cursor etapa a etapa.

Com chave, cada estágio chama o modelo, valida o artefato mínimo e passa adiante. Falha = retry (máx. 2) e para.

Artefatos: `content/runs/<slug>/01-research-pack.md` … `04-publish-candidate.md`.

Publicação: humana, ver `gates/publish.md`.
