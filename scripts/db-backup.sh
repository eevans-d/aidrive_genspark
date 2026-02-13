#!/bin/bash

# =============================================================================
# DB BACKUP SCRIPT - with rotation and retention
# =============================================================================
# Usage: ./scripts/db-backup.sh [output_dir]
# Requires: SUPABASE_DB_URL env var (or .env file)
#
# Retention policy:
#   - Keep last 7 daily backups
#   - Older backups are automatically deleted
#
# Recommended cron (daily at 03:00 UTC):
#   0 3 * * * cd /path/to/repo && ./scripts/db-backup.sh ./backups 2>&1 >> ./backups/backup.log

set -e

# Load .env if present
if [ -f .env ]; then
  set -a
  . .env
  set +a
fi

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL is not set."
  echo "Please set it in .env or as an environment variable."
  exit 1
fi

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "Error: pg_dump could not be found. Please install postgresql-client."
    exit 1
fi

# Configuration
BACKUP_DIR="${1:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup..."
START_TIME=$(date +%s)

# Dump and compress in one pipeline
pg_dump "$SUPABASE_DB_URL" \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  | gzip > "$OUTPUT_FILE"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo "[$(date -Iseconds)] Backup completed: $OUTPUT_FILE ($FILE_SIZE, ${DURATION}s)"

# Retention: remove backups older than RETENTION_DAYS
DELETED=0
if [ "$RETENTION_DAYS" -gt 0 ]; then
  while IFS= read -r old_file; do
    rm -f "$old_file"
    DELETED=$((DELETED + 1))
  done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -type f 2>/dev/null)
fi

if [ "$DELETED" -gt 0 ]; then
  echo "[$(date -Iseconds)] Retention: removed $DELETED backup(s) older than ${RETENTION_DAYS} days"
fi

# Summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f 2>/dev/null | wc -l)
echo "[$(date -Iseconds)] Total backups in ${BACKUP_DIR}: ${TOTAL_BACKUPS}"
echo "[$(date -Iseconds)] Retention policy: ${RETENTION_DAYS} days"
