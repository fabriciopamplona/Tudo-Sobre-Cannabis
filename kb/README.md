# Base de conhecimento (privada)

Dumps C&S e Sechat **não** vão para o site. Texto fica em `kb/data/kb.sqlite` (gitignored).

Dump de **imprensa nacional** (G1, Folha, Estadão…): ingerir com `ingest-midia`. A fila `library-midia.yaml` **pode e deve** linkar a URL original. C&S/Sechat continuam sem republicar URL.

```bash
npm run kb              # ingestão C&S/Sechat + classificação + 200 hubs + 800 nós + piloto 20
python3 kb/run.py ingest-midia   # dump de portais; +250 com cite
python3 kb/run.py queries
```

Variáveis: `KB_CES_DIR`, `KB_SECHAT_DIR`, `KB_MIDIA_DIR` (padrão `/tmp/tsc-dumps/...`).

Esteira: scrap DeepSeek (`--url`) → escrita Claude CLI (`claude auth login --claudeai`). Cada item de `content/opportunities/pilot-20.md` já tem `content/runs/<slug>/00-brief.md` e `guide.md`.

```bash
npm run agent -- --topic "Cannabis medicinal na epilepsia" --slug cannabis-medicinal-epilepsia --channel blog --type ciencia --origin radar
```

Postgres+pgvector: `kb/schema.sql` no VPS, quando o Hostinger estiver no ar.
