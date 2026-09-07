# Admin — audiência & Search (localhost + sync automático)

Painel: **`http://localhost:3000/admin`**. No domínio público → **404**.

## Sync automático (GA4 + GSC)

O código já busca sozinho quando as envs existem. **Você só precisa criar a service account no Google uma vez.**

### O que eu já fiz no repo
- Clientes GA4 Data API + Search Console API (`web/src/lib/analytics-google.ts`)
- Cache em `content/analytics/*-snapshot.json` (TTL 6h)
- Botão **Atualizar GA+GSC** no admin
- CLI: `cd web && npm run admin:sync -- --force`

### O que só você (ou Cowork) faz no Google — 1×

Prompt pronto abaixo. Resultado esperado no `.env.local`:

```bash
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
# ou: GOOGLE_APPLICATION_CREDENTIALS=/caminho/absoluto/tsc-analytics.json
GA4_PROPERTY_ID=123456789
GSC_SITE_URL=https://tudosobrecannabis.com/
ADMIN_ANALYTICS_TTL_HOURS=6
ADMIN_ANALYTICS_PERIOD_DAYS=28
```

`GA4_PROPERTY_ID` = ID **numérico** da propriedade (Admin GA → Configurações da propriedade), **não** o `G-36CZW66Q3C`.

### Prompt Claude Cowork (credenciais)

```
Preciso de uma service account Google para o admin local do Tudo Sobre Cannabis puxar GA4 + Search Console automaticamente.

Faça comigo (conta Google dona do GA "Tudo Sobre Cannabis" / G-36CZW66Q3C e do GSC https://tudosobrecannabis.com/):

1. Google Cloud Console → criar (ou usar) projeto "tudo-sobre-cannabis".
2. Ativar APIs: "Google Analytics Data API" e "Google Search Console API".
3. IAM → Service Accounts → criar `tsc-analytics@…` → chave JSON (baixar).
4. No GA4 (Admin → Property access management): adicionar o e-mail da service account como Viewer.
5. No Search Console → Configurações → Usuários: adicionar o mesmo e-mail com permissão de leitura na propriedade URL https://tudosobrecannabis.com/.
6. Me devolver:
   - caminho do JSON baixado (ou o JSON completo para eu colar no .env.local — avisar que é segredo)
   - GA4_PROPERTY_ID numérico (não o G-XXXX)
   - confirmação de que GSC_SITE_URL=https://tudosobrecannabis.com/ está acessível à SA
7. NÃO commitar o JSON no git.

Quando terminar, eu coloco no web/.env.local e rodo o sync.
```

### Uso depois das envs

```bash
cd web
npm run dev
# http://localhost:3000/admin → "Atualizar GA+GSC"
# ou: npm run admin:sync -- --force
```

Sem credenciais: o painel mostra seed (demo). Com credenciais: ao abrir o admin, sincroniza se o cache estiver velho.

## Outras envs locais

```bash
ADMIN_PASSWORD=tsc-local   # opcional
LOOKER_STUDIO_URL=…       # opcional
SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-36CZW66Q3C
```
