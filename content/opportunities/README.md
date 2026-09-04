# Fila de pautas

O portal tem **duas entradas**. O GSC não é o único drive.

1. **SEO-first** — query, gap ou página caindo no Search Console. Keyword antes.
2. **Conteúdo-first** — inbox humano, radar (tendência / notícia quente) ou recência. A história primeiro; keyword e GSC depois, se o destino for o Blog.

O estrategista (`npm run pauta`) mistura as duas e escreve `queue.md`. O humano prioriza; a esteira executa uma de cada vez.

```bash
# conteúdo-first (sem keyword): a query entra depois da pesquisa
npm run agent -- --topic "Anvisa publica nota sobre..." --channel blog --type noticia --origin humano

# SEO-first
npm run agent -- --topic "..." --keyword "..." --channel blog --type informe --origin gsc
```

Coloque pautas manuais e sinais de radar em `inbox.md`. Search Console: cole o export em `search-console.json` (ver `search-console.example.json`). Sem export, a fila **não** para — usa inbox, recência e calendário. Rotule `origin` em cada item.
