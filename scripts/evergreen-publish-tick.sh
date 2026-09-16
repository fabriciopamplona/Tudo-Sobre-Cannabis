#!/bin/zsh
# Evergreen publish tick — 08:00 e 13:00 BRT, seg–sex.
# Publica slots due (slug-review + commit/push por peça).
# launchd: com.tsc.evergreen-publish
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

BATCH="$ROOT/content/runs/_batch"
LOG="$BATCH/evergreen-publish.log"
mkdir -p "$BATCH"

log() { echo "[$(date '+%Y-%m-%dT%H:%M:%S%z')] $*" | tee -a "$LOG"; }

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
if [[ -f "$LAST" ]]; then
  node -e "
const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
const n=(j.published||[]).length;
const fail=(j.failed||[]).length;
console.log('published='+n+' failed='+fail);
for (const p of j.published||[]) {
  console.log('#'+p.id+' file='+(p.fileSlug||p.slug)+' git='+(p.git||'—'));
}
" "$LAST" | while IFS= read -r line; do log "$line"; done
fi

log "=== evergreen tick done ==="
