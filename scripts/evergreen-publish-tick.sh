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

# Extrai fileSlug (frontmatter/href) + slug da fila (ilustras/run)
entries=()
while IFS=$'\t' read -r fileSlug runSlug; do
  [[ -n "$fileSlug" ]] && entries+=("${fileSlug}|${runSlug}")
done < <(node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
for (const p of j.published||[]) {
  const href = p.href || '';
  const file = p.fileSlug || (href.split('/').filter(Boolean).pop()) || p.slug;
  const run = p.slug || file;
  if (file) console.log(file + '\t' + run);
}
" "$LAST")

if [[ ${#entries[@]} -eq 0 ]]; then
  log "nenhum slot publicado neste tick"
  exit 0
fi

log "publicados: ${entries[*]}"

paths=()
for entry in "${entries[@]}"; do
  fileSlug="${entry%%|*}"
  runSlug="${entry##*|}"
  [[ -f "content/published/${fileSlug}.md" ]] && paths+=("content/published/${fileSlug}.md")
  [[ -f "content/published/${runSlug}.md" ]] && paths+=("content/published/${runSlug}.md")
  if [[ -d "web/public/illustrations/${fileSlug}" ]]; then
    paths+=("web/public/illustrations/${fileSlug}")
  fi
  if [[ -d "web/public/illustrations/${runSlug}" ]]; then
    paths+=("web/public/illustrations/${runSlug}")
  fi
done

# dedupe
typeset -A seen
uniq_paths=()
for p in "${paths[@]}"; do
  if [[ -z "${seen[$p]:-}" ]]; then
    seen[$p]=1
    uniq_paths+=("$p")
  fi
done
paths=("${uniq_paths[@]}")

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
