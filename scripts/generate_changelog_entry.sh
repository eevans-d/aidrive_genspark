#!/usr/bin/env bash
set -euo pipefail
# generate_changelog_entry.sh
# Inserta una sección nueva en CHANGELOG.md para una versión dada usando fecha actual.
# Uso:
#   ./scripts/generate_changelog_entry.sh v1.0.0 "Added: X; Fixed: Y"
# El segundo argumento acepta líneas separadas por ';' que se distribuirán en bloques heurísticos.

VERSION="${1:-}"
RAW_ITEMS="${2:-}"
[ -z "$VERSION" ] && { echo "Falta versión (ej: v1.0.0)" >&2; exit 2; }
DATE=$(date +%Y-%m-%d)

FILE="CHANGELOG.md"
[ -f "$FILE" ] || { echo "No existe $FILE" >&2; exit 3; }

parse_items(){
  IFS=';' read -ra PARTS <<< "$RAW_ITEMS"
  for p in "${PARTS[@]}"; do
    p_trim=$(echo "$p" | sed 's/^ *//;s/ *$//')
    [ -n "$p_trim" ] && echo "- $p_trim"
  done
}

TMP=$(mktemp)
awk -v ver="$VERSION" -v date="$DATE" 'NR==1{print; print "\n## ["ver"] - "date"\n### Added\n"} NR>1{print}' "$FILE" > "$TMP"
cat "$TMP" > "$FILE"
rm "$TMP"

if [ -n "$RAW_ITEMS" ]; then
  echo "### Misc" >> "$FILE"
  parse_items >> "$FILE"
fi

echo "Entrada añadida a $FILE"