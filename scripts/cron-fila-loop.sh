#!/bin/zsh
# Cron-Fila loop (fase A horária + fase B no fim). Um processo só (pidfile).
# Uso: caffeinate -dims ./scripts/cron-fila-loop.sh
# Sentinel Cursor: AGENT_LOOP_TICK_cron_fila
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PIDFILE="$ROOT/content/runs/_batch/cron-fila-loop.pid"
STATE="$ROOT/content/runs/_batch/cron-fila-state.json"
MAX=5

if [[ -f "$PIDFILE" ]]; then
  old=$(cat "$PIDFILE" 2>/dev/null || true)
  if [[ -n "${old:-}" ]] && kill -0 "$old" 2>/dev/null; then
    echo "[cron-fila] já há loop (pid $old). Abortando segundo processo."
    exit 1
  fi
  rm -f "$PIDFILE"
fi
echo $$ > "$PIDFILE"
trap 'rm -f "$PIDFILE"' EXIT INT TERM

tick_count=$(python3 -c '
import json
from pathlib import Path
p = Path("'"$STATE"'")
s = json.loads(p.read_text()) if p.exists() else {}
print(int(s.get("ticksDone", 0)))
')

emit_tick() {
  local tick="$1"
  python3 -c '
import json, sys
tick = int(sys.argv[1])
prompt = (
  f"Cron-Fila tick {tick}/'"$MAX"' (fase A — só texto até seo-editor + audit). "
  "1) Leia content/runs/_batch/CRON-FILA.md e cron-fila-state.json. "
  "2) Rode: npm run esteira:cron-fila -- --finish (permissões all / rede se Claude CLI precisar). "
  "3) NÃO gere ilustras neste tick (ficam no finish_batch). "
  "4) NÃO assine reviewedBy e NÃO publique. "
  "5) Atualize o usuário com #id, slug, phase=partial. "
  "6) Se status=awaiting_finish, rode finish-pending em seguida."
)
print("AGENT_LOOP_TICK_cron_fila " + json.dumps({"prompt": prompt, "tick": tick, "max": '"$MAX"', "phase": "A"}, ensure_ascii=False))
' "$tick"
}

emit_finish() {
  python3 -c '
import json
prompt = (
  "Cron-Fila finish_batch (fase B — ilustras + SERP no final). "
  "1) npm run esteira:cron-fila -- --finish-pending "
  "2) Complete GenerateImage + cwebp + insert + WebSearch SERP PRONTO para todos os ids da fila. "
  "3) npm run esteira:cron-fila -- --sync "
  "4) NÃO assine reviewedBy. Publish só se o humano pedir: esteira:cron-fila:publish -- --reviewer \"…\""
)
print("AGENT_LOOP_TICK_cron_fila " + json.dumps({"action": "finish_batch", "prompt": prompt, "phase": "B"}, ensure_ascii=False))
'
}

while (( tick_count < MAX )); do
  # status já awaiting_finish / done?
  if python3 -c '
import json
from pathlib import Path
p = Path("'"$STATE"'")
s = json.loads(p.read_text()) if p.exists() else {}
st = s.get("status")
raise SystemExit(0 if st in ("done", "awaiting_finish", "empty") or int(s.get("ticksDone",0)) >= int(s.get("maxTicks",5)) else 1)
'
  then
    break
  fi

  SLEEP=$(python3 -c '
import datetime, time
now = time.time()
lt = datetime.datetime.now().astimezone()
nxt = lt.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
if lt.minute == 0 and lt.second < 90:
    nxt = nxt + datetime.timedelta(hours=1)
secs = max(60, int(nxt.timestamp() - now))
print(secs)
')
  echo "[cron-fila] sleeping ${SLEEP}s until next hour cheia (tick $((tick_count+1))/$MAX, fase A)..."
  sleep "$SLEEP"
  tick_count=$((tick_count + 1))
  emit_tick "$tick_count"
done

# Fase B: um único wake para todas as ilustras
if python3 -c '
import json
from pathlib import Path
p = Path("'"$STATE"'")
s = json.loads(p.read_text()) if p.exists() else {}
pending = s.get("pendingFinish") or []
raise SystemExit(0 if pending or s.get("status") == "awaiting_finish" else 1)
'
then
  echo "[cron-fila] fase B — finish_batch (ilustras no final)"
  emit_finish
else
  echo "[cron-fila] sem pendingFinish — loop ok"
fi

echo "[cron-fila] loop shell finished"
