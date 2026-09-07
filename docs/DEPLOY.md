# Deploy — tudosobrecannabis.com

Site: Next.js em `web/`. Domínio na HostGator (DNS). App na **Vercel**.

**Estado ao vivo:** [`OPS-LIVE.md`](OPS-LIVE.md) · log curto: [`deploy/vercel-setup.md`](../deploy/vercel-setup.md)

## Status (2026-09-07)

| Item | Status |
|---|---|
| GitHub `main` | ok |
| Vercel (root `web`, Ready) | ✅ |
| DNS HostGator → Vercel | ✅ A legado `76.76.21.21` · CNAME `cname.vercel-dns.com` |
| HTTPS / Domains Valid | ✅ |
| GSC + sitemap | ✅ verificado DNS TXT |
| GA4 `G-36CZW66Q3C` | propriedade ok · tag no Next via `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| `/esteira` público | 404 (middleware) |

## Já estruturado neste repo

| Item | Onde |
|---|---|
| Remoto GitHub | `origin` → `https://github.com/fabriciopamplona/Tudo-Sobre-Cannabis.git` |
| CI build | `.github/workflows/ci.yml` |
| Config Vercel | `web/vercel.json` |
| Env de exemplo | `web/.env.example` |
| Tracing de `content/published` | `web/next.config.ts` |
| `/esteira` fora do ar público | `web/src/middleware.ts` |
| GA4 | `@next/third-parties/google` em `web/src/app/layout.tsx` |
| robots disallow esteira/api | `web/src/app/robots.ts` |

## DNS em produção (não inventar)

| Tipo | Host | Valor |
|---|---|---|
| A | `@` | **`76.76.21.21`** (legado — em uso) |
| CNAME | `www` | **`cname.vercel-dns.com`** (legado — em uso) |

Incidente: IP “expandido” `216.198.79.1` / CNAME `a71a1f9395608e07.vercel-dns-017.com` deu timeout em algumas redes; ver [`OPS-LIVE.md`](OPS-LIVE.md).

## Env Vercel

```
SITE_URL=https://tudosobrecannabis.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-36CZW66Q3C
```

Sem `ESTEIRA_BASIC_*` no ar público.

## Rotina editorial → ar

1. Esteira + OK humano no **localhost** (`npm run dev`)
2. Publish grava em `content/published/`
3. `git push` → Vercel rebuild → post no ar

## Verificação

```bash
curl -sI https://tudosobrecannabis.com | head -5
curl -sI https://tudosobrecannabis.com/esteira | head -5   # 404
curl -s https://tudosobrecannabis.com/sitemap.xml | head -20
```

## Pendências leves

- [ ] 2FA na conta Vercel
- [ ] Confirmar env `NEXT_PUBLIC_GA_MEASUREMENT_ID` na Vercel + redeploy após push da tag
- [ ] Opcional: unificar propriedade GA em conta Cafundó/org (hoje em Doutor Cogumelo — aceitável)
- [ ] Schema Article nos templates (conferir Rock 1)

## Prompts Claude Cowork (histórico do go-live)

Os prompts A/B/C já foram executados. Mantidos só como referência em git history se precisar recriar DNS/GSC noutro domínio.
