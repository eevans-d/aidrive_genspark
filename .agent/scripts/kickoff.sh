#!/usr/bin/env bash
set -euo pipefail

# Protocol Zero kickoff: start session + extract evidence + generate MEGA_PLAN template.
#
# Usage:
#   .agent/scripts/kickoff.sh "Objetivo" [extract_reports.py args...]
#
# Defaults:
# - If no extract args are provided, runs with `--with-supabase` (names-only compare).
# - To run full gates/perf: pass `--with-gates --with-perf --with-supabase`.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

OBJ_PARTS=()
EXTRACT_ARGS=()
IN_EXTRACT="false"
for arg in "$@"; do
  if [ "$IN_EXTRACT" = "false" ] && [[ "$arg" == --* ]]; then
    IN_EXTRACT="true"
  fi
  if [ "$IN_EXTRACT" = "false" ]; then
    OBJ_PARTS+=("$arg")
  else
    EXTRACT_ARGS+=("$arg")
  fi
done

OBJ="${OBJ_PARTS[*]:-}"
if [ -z "$OBJ" ]; then
  OBJ="(sin objetivo provisto)"
fi

echo "[kickoff] session-start..."
.agent/scripts/session_start.sh "$OBJ" >/dev/null || true

if [ "${#EXTRACT_ARGS[@]}" -eq 0 ]; then
  EXTRACT_ARGS=(--with-supabase)
fi

echo "[kickoff] extract reports..."
mapfile -t CREATED < <(.agent/scripts/extract_reports.py "${EXTRACT_ARGS[@]}")

TECH=""
INV=""
for p in "${CREATED[@]}"; do
  case "$p" in
    docs/closure/TECHNICAL_ANALYSIS_*) TECH="$p" ;;
    docs/closure/INVENTORY_REPORT_*) INV="$p" ;;
  esac
done

echo "[kickoff] mega plan template..."
MP_ARGS=(--objective "$OBJ")
if [ -n "$TECH" ]; then
  MP_ARGS+=(--from-tech "$TECH")
fi
if [ -n "$INV" ]; then
  MP_ARGS+=(--from-inventory "$INV")
fi

MEGA_PATH="$(.agent/scripts/mega_plan_template.py "${MP_ARGS[@]}")"
echo "Wrote: $MEGA_PATH"
