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

echo "Reiniciando base de datos local..."
supabase db reset

if supabase status -o env >/dev/null 2>&1; then
  eval "$(supabase status -o env)"
fi

echo "Ejecutando tests de integracion con Vitest..."
npx vitest run --config vitest.integration.config.ts
