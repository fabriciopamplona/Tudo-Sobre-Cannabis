# Produção ao vivo — tudosobrecannabis.com

Registro operacional (go-live). Detalhe de procedimento: [`DEPLOY.md`](DEPLOY.md).

**Atualizado:** 2026-09-07 (DNS legado Vercel)

## Stack

| Camada | Valor |
|---|---|
| Site | Next.js (`web/`) na **Vercel** — Root Directory `web`, build Ready |
| Domínio | `tudosobrecannabis.com` + `www` — HostGator (DNS) → Vercel |
| Alias Vercel | `tudo-sobre-cannabis.vercel.app` (sempre reachable; útil se DNS falhar) |
| HTTPS | SSL emitido pela Vercel (Valid Configuration) |
| Canônico | `SITE_URL=https://tudosobrecannabis.com` |
| Repo | https://github.com/fabriciopamplona/Tudo-Sobre-Cannabis |

## DNS (HostGator → Vercel) — em uso

| Tipo | Host | Valor |
|---|---|---|
| A | `@` (ou `tudosobrecannabis.com`) | **`76.76.21.21`** (legado Vercel) |
| CNAME | `www` | **`cname.vercel-dns.com`** (legado Vercel) |

### Histórico / incidente (2026-09-07)

A Vercel sugeriu primeiro a faixa “expandida”:
- A `@` → `216.198.79.1`
- CNAME `www` → `a71a1f9395608e07.vercel-dns-017.com`

Nessa rede (Mac/provedor) o apex dava `ERR_CONNECTION_TIMED_OUT` no IP novo; o alias `*.vercel.app` carregava 100%. Troca para os **records legados** acima restabeleceu `https://tudosobrecannabis.com`.

Notas:
- Preferir **legado** neste domínio até a rota do IP novo estabilizar no ISP.
- `www` pode levar até ~TTL (ex. 4h) para limpar cache do CNAME antigo.
- Cache local macOS: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
- MX de e-mail: não mexer sem necessidade.
- Substituir A antigo no apex (não somar dois A).

## Google Search Console

- Propriedade: `https://tudosobrecannabis.com/`
- Verificação: **DNS TXT** na HostGator (confirmação instantânea)
- Sitemap enviado: `https://tudosobrecannabis.com/sitemap.xml` ✅

## Google Analytics 4

| Campo | Valor |
|---|---|
| Propriedade | Tudo Sobre Cannabis |
| Conta GA | Doutor Cogumelo *(ok por ora — mesmo dono; opcional mover para Cafundó/org depois)* |
| Conta alternativa | Cafundó (Mind the Graph) — só se quiser unificar contas |
| Fuso / moeda | GMT-3 São Paulo · BRL · categoria News |
| Data stream | Web → `https://tudosobrecannabis.com` |
| **Measurement ID atual** | **`G-36CZW66Q3C`** (enquanto a propriedade viver em Doutor Cogumelo) |

### Conta GA (opcional reorganizar)

Hoje em Doutor Cogumelo está **aceitável** (mesmo dono). Se quiser unificar com Cafundó:

1. Criar propriedade na conta desejada + stream Web do domínio.
2. Trocar Measurement ID na Vercel / `.env.example` / este doc; redeploy.
3. Arquivar a propriedade antiga; não rodar dois IDs no ar.

**Measurement ID atual:** `G-36CZW66Q3C`  
Código: `NEXT_PUBLIC_GA_MEASUREMENT_ID` + `GoogleAnalytics` no layout.

## Admin de métricas (localhost)

| Item | Valor |
|---|---|
| URL | `http://localhost:3000/admin` (só local) |
| Produção | **404** em `tudosobrecannabis.com/admin` |
| Auth local | opcional `ADMIN_PASSWORD` no `.env.local` |
| Dados | `content/analytics/*` + hubs KB |
| Looker | nuvem Google; link opcional `LOOKER_STUDIO_URL` no local |
| Esteira | também **localhost** (`/esteira` → 404 no domínio) |

Não configurar `ADMIN_PASSWORD` na Vercel.

## Env Vercel (checklist)

| Nome | Valor |
|---|---|
| `SITE_URL` | `https://tudosobrecannabis.com` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-36CZW66Q3C` |
| `ESTEIRA_BASIC_USER` / `PASS` | vazio (esteira 404) |
| `ADMIN_*` | **não** na Vercel — `/admin` é localhost |

## Verificação

```bash
curl -sI https://tudosobrecannabis.com | head -5
curl -sI https://tudosobrecannabis.com/esteira | head -5   # 404
curl -s https://tudosobrecannabis.com/sitemap.xml | head -15
```

GA: Realtime no painel após deploy com a env do Measurement ID.
