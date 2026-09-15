#!/bin/zsh
# Instala o launchd do evergreen (08h·13h seg–sex).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/scripts/evergreen-publish.plist"
DST="$HOME/Library/LaunchAgents/com.tsc.evergreen-publish.plist"
LABEL="gui/$(id -u)/com.tsc.evergreen-publish"

chmod +x "$ROOT/scripts/evergreen-publish-tick.sh"
mkdir -p "$HOME/Library/LaunchAgents"
cp "$SRC" "$DST"

# macOS moderno: bootout/bootstrap; fallback unload/load
launchctl bootout "$LABEL" 2>/dev/null || launchctl unload "$DST" 2>/dev/null || true
if launchctl bootstrap "gui/$(id -u)" "$DST" 2>/dev/null; then
  :
elif launchctl load "$DST" 2>/dev/null; then
  :
else
  echo "Falha ao carregar launchd. Tente: launchctl load $DST" >&2
  exit 1
fi

echo "OK: $LABEL"
echo "  plist: $DST"
echo "  tick:  $ROOT/scripts/evergreen-publish-tick.sh"
echo "  log:   $ROOT/content/runs/_batch/evergreen-publish.log"
echo "Próximos: seg–sex 08:00 e 13:00 (hora local do Mac)."
launchctl print "$LABEL" 2>/dev/null | head -20 || true
