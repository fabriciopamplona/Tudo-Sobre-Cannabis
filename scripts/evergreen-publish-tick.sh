#!/bin/zsh
# Evergreen publish tick — 08:00 e 13:00 BRT, seg–sex.
# Publica slots due, commit + push para o ar.
# launchd: com.tsc.evergreen-publish
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

BATCH="$ROOT/content/runs/_batch"
LOG="$BATCH/evergreen-publish.log"
mkdir -p "$BATCH"

log() { echo "[$(date '+%Y-%m-%dT%H:%M:%S%z')] $*" | tee -a "$LOG"; }

# Só dias úteis (1=seg … 5=sex). launchd já filtra, mas reforça.
dow="$(date '+%u')"
if [[ "$dow" -gt 5 ]]; then
  log "skip: fim de semana (dow=$dow)"
  exit 0
fi

log "=== evergreen tick start ==="
if ! npm run esteira:evergreen:publish >>"$LOG" 2>&1; then
  log "FAIL: esteira:evergreen:publish"
  exit 1
fi

LAST="$BATCH/evergreen-last-publish.json"
if [[ ! -f "$LAST" ]]; then
  log "sem evergreen-last-publish.json — nada a commit"
  exit 0
fi

# Extrai slugs publicados neste tick
slugs=()
while IFS= read -r slug; do
  [[ -n "$slug" ]] && slugs+=("$slug")
done < <(node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
for (const p of j.published||[]) if (p.slug) console.log(p.slug);
" "$LAST")

if [[ ${#slugs[@]} -eq 0 ]]; then
  log "nenhum slot publicado neste tick"
  exit 0
fi

log "publicados: ${slugs[*]}"

paths=()
for slug in "${slugs[@]}"; do
  [[ -f "content/published/${slug}.md" ]] && paths+=("content/published/${slug}.md")
  if [[ -d "web/public/illustrations/${slug}" ]]; then
    paths+=("web/public/illustrations/${slug}")
  fi
done

if [[ ${#paths[@]} -eq 0 ]]; then
  log "FAIL: slugs sem arquivos em content/published"
  exit 1
fi

git add -- "${paths[@]}"
if git diff --cached --quiet; then
  log "nada novo no index (já commitado?)"
  exit 0
fi

ids="$(node -e "
const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
console.log((j.published||[]).map(p=>'#'+p.id).join(' '));
" "$LAST")"
dates="$(node -e "
const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
const d=[...new Set((j.published||[]).map(p=>p.datePublished).filter(Boolean))];
console.log(d.join(', ')||'');
" "$LAST")"

msg="Publish evergreen ${ids} (${dates})."
git commit -m "$(cat <<EOF
${msg}

Slot 08h/13h BRT · datePublished = data do agendamento.
EOF
)"
log "commit ok: $msg"

git push origin HEAD
log "push ok"
log "=== evergreen tick done ==="
