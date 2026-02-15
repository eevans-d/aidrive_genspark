#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail=0

check_no_match() {
  local pattern="$1"
  local file="$2"
  if rg -n "$pattern" "$file" >/dev/null 2>&1; then
    echo "FAIL: pattern '$pattern' still found in $file"
    fail=1
  else
    echo "PASS: pattern '$pattern' not found in $file"
  fi
}

check_match() {
  local pattern="$1"
  local file="$2"
  if rg -n "$pattern" "$file" >/dev/null 2>&1; then
    echo "PASS: pattern '$pattern' found in $file"
  else
    echo "FAIL: pattern '$pattern' not found in $file"
    fail=1
  fi
}

check_no_match "htvlwhisjpdagqkqnpxg" "supabase/functions/cron-testing-suite/index.ts"
check_no_match "password123|admin@minimarket.com" "minimarket-system/src/pages/Login.tsx"
# Validate only canonical target docs for broken-link fix.
# Historical closure evidence can mention legacy strings as part of audit narrative.
check_no_match "PLAN_TRES_PUNTOS\.md" "docs/AUDITORIA_RLS_CHECKLIST.md"
check_no_match "file:///mpc/SUB_PLAN" "docs/mpc/MEGA_PLAN_CONSOLIDADO.md"
check_match "api-minimarket\s*\|\s*v[0-9]+\s*\|\s*false" "docs/ESTADO_ACTUAL.md"
check_match "EVIDENCIA_PLAN_OPTIMIZACION_PRECIOS_2026-02-13\.md" "docs/ESTADO_ACTUAL.md"

if [[ $fail -ne 0 ]]; then
  echo "\nverify_5steps: FAIL"
  exit 1
fi

echo "\nverify_5steps: PASS"
