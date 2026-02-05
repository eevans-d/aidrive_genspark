#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.test}"
SQL_FILE="$ROOT_DIR/scripts/security_advisor_check.sql"

if [ ! -f "$ENV_FILE" ]; then
  echo "ENV file not found: $ENV_FILE"
  exit 1
fi

# Load env without printing values
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL missing in $ENV_FILE"
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
