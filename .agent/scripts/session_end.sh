#!/usr/bin/env bash
set -euo pipefail

# End and archive a Protocol Zero session.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

mkdir -p .agent/sessions/current .agent/sessions/archive

rm -f .agent/sessions/current/SESSION_ACTIVE
touch .agent/sessions/current/SESSION_COMPLETE
echo "Session completed: $(date -Is)" >> .agent/sessions/current/SESSION_LOG.md

ARCHIVE_DIR=".agent/sessions/archive/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

shopt -s nullglob
for f in .agent/sessions/current/*.md; do
  mv "$f" "$ARCHIVE_DIR/"
done
shopt -u nullglob

rm -f .agent/sessions/current/SESSION_COMPLETE

echo "OK: session archived to $ARCHIVE_DIR"

