#!/bin/bash

# =============================================================================
# DB RESTORE DRILL SCRIPT
# =============================================================================
# Usage: ./scripts/db-restore-drill.sh <backup_file>
#
# WARNING: This script restores a backup into the connected database.
# It is intended for disaster recovery drills ONLY.
# In production, use with extreme caution - it will OVERWRITE existing data.
#
# For drill purposes, use a separate staging database URL:
#   SUPABASE_DB_URL=<staging_url> ./scripts/db-restore-drill.sh backup.sql.gz
#
# RTO Target: < 15 minutes (including download + restore)
# RPO Target: 24 hours (daily backups)

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Example: $0 ./backups/backup_20260212_030000.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load .env if present
if [ -f .env ]; then
  set -a
  . .env
  set +a
fi

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL is not set."
  echo "Please set it in .env or as an environment variable."
  echo ""
  echo "WARNING: For drill purposes, use a STAGING database URL."
  exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql could not be found. Please install postgresql-client."
    exit 1
fi

sanitize_db_target() {
  # Never print credentials. Emit host[:port]/db (best-effort) or [REDACTED].
  local url="${1:-}"
  if [ -z "$url" ]; then
    printf "%s" "[NOT_SET]"
    return 0
  fi

  # libpq keyword/value format: host=... user=... password=...
  if [[ "$url" == *"host="* || "$url" == *"password="* || "$url" == *"user="* ]]; then
    local host port dbname
    host="$(printf '%s' "$url" | sed -n 's/.*host=\([^ ]*\).*/\1/p')"
    port="$(printf '%s' "$url" | sed -n 's/.*port=\([^ ]*\).*/\1/p')"
    dbname="$(printf '%s' "$url" | sed -n 's/.*dbname=\([^ ]*\).*/\1/p')"
    if [[ -n "$host" ]]; then
      if [[ -n "$port" && -n "$dbname" ]]; then
        printf '%s:%s/%s' "$host" "$port" "$dbname"
        return 0
      fi
      if [[ -n "$port" ]]; then
        printf '%s:%s' "$host" "$port"
        return 0
      fi
      printf '%s' "$host"
      return 0
    fi
    printf "%s" "[REDACTED]"
    return 0
  fi

  # URL format: postgres://user:pass@host:port/db?params
  local stripped="${url#*://}"
  local after_at="${stripped#*@}"
  if [[ "$after_at" != "$stripped" ]]; then
    stripped="$after_at"
  fi
  stripped="${stripped%%\?*}"
  printf '%s' "$stripped"
}

echo "============================================"
echo "  DATABASE RESTORE DRILL"
echo "============================================"
echo ""
echo "Backup file: $BACKUP_FILE"
echo "Target DB:   $(sanitize_db_target "$SUPABASE_DB_URL")"
echo ""
echo "WARNING: This will overwrite the target database!"
echo ""

# Require explicit confirmation
if [ "${RESTORE_CONFIRMED:-}" != "yes" ]; then
  echo "Set RESTORE_CONFIRMED=yes to proceed."
  echo ""
  echo "Example:"
  echo "  RESTORE_CONFIRMED=yes $0 $BACKUP_FILE"
  exit 1
fi

echo "[$(date -Iseconds)] Starting restore drill..."
START_TIME=$(date +%s)

# Decompress and restore
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql "$SUPABASE_DB_URL" --quiet --no-psqlrc
else
  psql "$SUPABASE_DB_URL" --quiet --no-psqlrc < "$BACKUP_FILE"
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "[$(date -Iseconds)] Restore completed in ${DURATION}s"
echo ""
echo "============================================"
echo "  RESTORE DRILL RESULTS"
echo "============================================"
echo "  Duration:   ${DURATION}s"
echo "  RTO Target: < 900s (15 min)"
echo "  RTO Status: $([ $DURATION -lt 900 ] && echo 'PASS' || echo 'FAIL')"
echo "  Backup age: $(stat -c %Y "$BACKUP_FILE" 2>/dev/null | xargs -I{} bash -c 'echo $(( ($(date +%s) - {}) / 3600 ))h' 2>/dev/null || echo 'N/A')"
echo "  RPO Target: < 24h"
echo "============================================"
