# Replit em paralelo

O GitHub é a fonte da verdade (conteúdo, agentes, Next). O Replit é a mesa de UI: tipografia, home, componentes, ritmo visual.

## Importar

1. New Replit → Import from GitHub → `fabriciopamplona/Tudo-Sobre-Cannabis`
2. Secrets: cole o que estiver em `.env.example` (chaves de modelo só se for rodar a esteira lá)
3. Run. O `.replit` executa `npm run dev --prefix web` na porta 3000

Se o Replit perguntar o root: é a raiz do repo, não `web/` isolado. Os artigos vivem em `content/published` e o Next lê um nível acima.

## Divisão de trabalho

| Fazer no Replit | Fazer neste repo (Cursor) |
|---|---|
| Home, layout, CSS, motion | Esteira, prompts, fontes, SEO técnico |
| Componentes visuais | Frontmatter, schema, sitemap |
| Testar leitura mobile | Pauta, research pack, gate |

Commits voltam para o mesmo GitHub. Evite dois históricos. Pull antes de uma sessão longa no Replit.

## Produção

Replit serve para iterar. Milhões de pageviews pedem edge (Vercel, Cloudflare Pages ou similar) perto do Brasil, cache de HTML estático e observabilidade. Quando o visual estabilizar, o `web/` deste repo é o que sobe para produção — não um fork eterno no Replit.

## Agentes no Replit

`npm run agent -- --topic "..." --keyword "..."` também roda lá, se houver chave no Secrets. Artefatos caem em `content/runs/`. Publicar continua sendo copiar para `content/published` depois do gate.
