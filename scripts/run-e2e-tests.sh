#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI no encontrado. Instala supabase y reintenta." >&2
  exit 1
fi

echo "Iniciando Supabase local..."
supabase start

if supabase status -o env >/dev/null 2>&1; then
  eval "$(supabase status -o env)"
  export SUPABASE_URL="${SUPABASE_URL:-${API_URL:-}}"
  export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${ANON_KEY:-}}"
  export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${SERVICE_ROLE_KEY:-}}"
fi

echo "Ejecutando smoke tests E2E con Vitest..."
npx vitest run --config vitest.e2e.config.ts
