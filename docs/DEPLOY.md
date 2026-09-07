# Deploy — tudosobrecannabis.com

Site: Next.js em `web/`. Domínio na HostGator. Hospedagem do app: **Vercel** (recomendado).

## Já estruturado neste repo

| Item | Onde |
|---|---|
| Remoto GitHub | `origin` → `https://github.com/fabriciopamplona/Tudo-Sobre-Cannabis.git` |
| CI build | `.github/workflows/ci.yml` |
| Config Vercel (pasta web) | `web/vercel.json` |
| Env de exemplo | `web/.env.example` |
| Tracing de `content/published` | `web/next.config.ts` |
| `/esteira` fora do ar público | `web/src/middleware.ts` (+ API já bloqueia POST fora de localhost) |
| robots disallow esteira/api | `web/src/app/robots.ts` |

## O que só você (ou Cowork) faz na UI

1. Confirmar push de `main` no GitHub (código de deploy precisa estar remoto)
2. Criar projeto na Vercel → Root Directory = `web`
3. Env `SITE_URL=https://tudosobrecannabis.com`
4. DNS na HostGator → records da Vercel
5. Search Console + GA4 no dia do DNS

Prompts prontos: seção [Prompts Claude Cowork](#prompts-claude-cowork) abaixo.

## Passo a passo

### 1. GitHub

```bash
git status
git push origin main   # se houver commits locais de deploy
```

Repo: https://github.com/fabriciopamplona/Tudo-Sobre-Cannabis

### 2. Vercel

1. [vercel.com](https://vercel.com) → Add New Project → importar o repo
2. **Root Directory:** `web` (Edit → web)
3. Framework: Next.js (auto)
4. Environment Variables (Production + Preview):
   - `SITE_URL` = `https://tudosobrecannabis.com`
5. Deploy
6. Anotar a URL `*.vercel.app` e os **DNS records** que a Vercel mostrar para o domínio custom

Não precisa setar `ESTEIRA_BASIC_*` no ar público (esteira fica 404). Use só em staging se quiser ver o painel.

### 3. DNS HostGator

No cPanel / Zone Editor do domínio `tudosobrecannabis.com`:

- Em geral a Vercel pede:
  - **A** `@` → IP que eles indicam (ex. `76.76.21.21` — **confirme no painel Vercel**)
  - **CNAME** `www` → `cname.vercel-dns.com` (ou o valor exato do painel)

Remova A/CNAME antigos que apontem para a hospedagem compartilhada do site, se conflitar.

Propagação: minutos a 48h. HTTPS: automático na Vercel após DNS ok.

### 4. Pós-DNS

- [Google Search Console](https://search.google.com/search-console) → propriedade `https://tudosobrecannabis.com` → sitemap `https://tudosobrecannabis.com/sitemap.xml`
- GA4 → stream Web com essa URL
- Testar: home, um post publicado, `/esteira` deve dar **404**

### 5. Rotina editorial → ar

1. Esteira + OK humano no **localhost** (`npm run dev`)
2. Publish grava em `content/published/`
3. `git push` → Vercel rebuild → post no ar

A esteira **não** publica sozinha na Vercel (API só localhost; FS serverless é read-only para mutações).

## Verificação rápida

```bash
curl -sI https://tudosobrecannabis.com | head -5
curl -sI https://tudosobrecannabis.com/esteira | head -5   # esperar 404
curl -s https://tudosobrecannabis.com/sitemap.xml | head -20
```

## Prompts Claude Cowork

Copie um bloco por vez no Cowork (precisa de browser + suas contas).

### Prompt A — Vercel

```
Contexto: repo GitHub fabriciopamplona/Tudo-Sobre-Cannabis — app Next.js na pasta web/.
Domínio final: https://tudosobrecannabis.com (DNS ainda na HostGator).

Faça comigo na UI da Vercel:
1. Login na minha conta Vercel.
2. Importar o repositório Tudo-Sobre-Cannabis.
3. Root Directory = web (obrigatório).
4. Adicionar env Production e Preview: SITE_URL=https://tudosobrecannabis.com
5. NÃO definir ESTEIRA_BASIC_USER/PASS (esteira deve 404 em produção).
6. Disparar o primeiro deploy e esperar ficar Ready.
7. Em Settings → Domains, adicionar tudosobrecannabis.com e www.tudosobrecannabis.com.
8. Me mostre EXATAMENTE os records DNS (tipo, host, valor) que a Vercel pedir — vou colar na HostGator no próximo passo.
9. Se o build falhar, copie o log do erro e sugira o fix (não invente records DNS).
```

### Prompt B — DNS HostGator

```
Contexto: domínio tudosobrecannabis.com hospedado na HostGator (cPanel).
Já tenho os records que a Vercel pediu (vou colar abaixo).

Records da Vercel:
[COLE AQUI o que o Prompt A devolveu]

Faça comigo no painel HostGator/cPanel:
1. Abrir Zone Editor / DNS do domínio tudosobrecannabis.com.
2. Ajustar/criar os records exatamente como a Vercel pediu (A/@ e CNAME/www).
3. Remover ou atualizar records antigos do site que conflitem (me avise antes de apagar MX de e-mail).
4. NÃO mexer em registros de e-mail (MX) sem eu confirmar.
5. No fim, liste o que ficou na zona DNS e o que ainda falta propagar.
```

### Prompt C — GSC + GA4

```
Contexto: site https://tudosobrecannabis.com no ar (Vercel + DNS ok).
Preciso indexação e analytics no dia 1.

Faça comigo:
1. Google Search Console: adicionar propriedade URL prefix https://tudosobrecannabis.com
2. Verificar (DNS TXT ou meta — prefira o método que a Vercel/HostGator facilitar; se for TXT na HostGator, me guie).
3. Enviar sitemap: https://tudosobrecannabis.com/sitemap.xml
4. GA4: criar propriedade "Tudo Sobre Cannabis" + data stream Web com essa URL.
5. Me devolver o Measurement ID (G-XXXX) e onde colar no código/Next se ainda não houver tag — se o repo ainda não tiver GA, diga só o ID e pare (não invente snippet desatualizado).
```

## Limitações honestas

- Deploy **não** está automatizado até o projeto Vercel existir (Cowork/Prompt A).
- GA4 **não** está plugado no código ainda — só o processo (Prompt C + depois um PR no Next).
- E-mail @tudosobrecannabis.com continua na HostGator se MX estiver lá; não misturar com DNS do site sem cuidado.
