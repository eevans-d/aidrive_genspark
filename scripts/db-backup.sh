#!/bin/bash

# =============================================================================
# DB BACKUP SCRIPT
# =============================================================================
# Usage: ./scripts/db-backup.sh [output_path]
# Requires: SUPABASE_DB_URL env var (or .env file)

set -e

# Load .env if present
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL is not set."
  echo "Please set it in .env or as an environment variable."
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE=${1:-"backup_${TIMESTAMP}.sql"}

echo "Starting backup to $OUTPUT_FILE..."

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "Error: pg_dump could not be found. Please install postgresql-client."
    exit 1
fi

pg_dump "$SUPABASE_DB_URL" \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  --file="$OUTPUT_FILE"

echo "Backup completed successfully: $OUTPUT_FILE"
