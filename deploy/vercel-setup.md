# Vercel setup (log go-live)

Espelho curto do que foi feito na UI. Canônico: [`docs/OPS-LIVE.md`](../docs/OPS-LIVE.md) + [`docs/DEPLOY.md`](../docs/DEPLOY.md).

- Projeto: Tudo-Sobre-Cannabis · Root Directory `web` · Ready
- Domínios: `tudosobrecannabis.com`, `www.tudosobrecannabis.com` · Valid · SSL ok
- Alias: `tudo-sobre-cannabis.vercel.app`
- Env: `SITE_URL=https://tudosobrecannabis.com`
- **DNS HostGator (em uso):** A `@` → `76.76.21.21` · CNAME `www` → `cname.vercel-dns.com` (legado Vercel)
- DNS tentado e revertido: A `216.198.79.1` / CNAME `a71a1f9395608e07.vercel-dns-017.com` (timeout em algumas redes)
- Lembrete: 2FA Vercel; local `git pull` + `npm install` em `web/`
