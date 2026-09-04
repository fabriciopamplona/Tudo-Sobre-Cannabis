# Amostra SERP (passo 3) — 20 ago 2026

Sem Ahrefs/Semrush/SerpAPI. Amostra via busca web nas **queries-alvo** (não é o Google Ads). Quando houver `SERPAPI_API_KEY`, repetir em lote nas 45 queries de `kb/data/queries.txt`.

## O que apareceu no topo

| Query | Quem ocupou o topo da amostra | C&S / Sechat no recorte |
|---|---|---|
| cannabis medicinal epilepsia | Protocolos SES/SUS, CFM, paper | Não |
| o que é cbd | MSD, Panorama Farmacêutico, lojas (Vikura, Cannactiva) | Não |
| autorização anvisa cannabis | **gov.br / Anvisa**, SouCannabis | Não |
| rdc 327 | Texto oficial BVS/Anvisa, escritórios, Lexology (RDC 1015) | Não |
| cbd ansiedade | APEPI, WeCann, papers | Não |

## Leitura (resultado)

Nas **head queries** o espaço não é um duelo C&S vs Sechat. É gov.br + associação + clínica/loja + paper. O dump continua valioso como guia do que o *leitor de portal* já consome (hubs de condição). O tráfego orgânico de busca parece estar em:

1. Páginas oficiais (Anvisa, RDC) — TSC traduz, não compete com o PDF.
2. Glossário comercial de CBD — TSC pode ganhar com rigor + Brasil.
3. Condição × cannabis (epilepsia, ansiedade) — evidência calibrada, não milagre.

`impact_score` atual = cobertura no dump (volume/recência). SERP pago entra como multiplicador depois.

## Queries-alvo (45)

Ver `kb/data/queries.txt` (gitignored) e a lista gerada por `python3 kb/run.py queries`.
