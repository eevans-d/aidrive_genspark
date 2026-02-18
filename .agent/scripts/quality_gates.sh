#!/usr/bin/env bash
set -euo pipefail

# Single entrypoint for the repo's quality gates (used by multiple skills).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

mkdir -p test-reports
TS="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${QUALITY_GATES_LOG:-test-reports/quality-gates_${TS}.log}"

exec > >(tee -a "$LOG_FILE") 2>&1
echo "Logging: $LOG_FILE"

SCOPE="${1:-all}"

run() {
  local name="$1"
  shift
  echo
  echo "==> $name"
  echo "+ $*"
  "$@"
}

# Integration tests require .env.test + Supabase; skip gracefully when unavailable
run_integration_or_skip() {
  echo
  echo "==> integration"
  if [ ! -f "$ROOT_DIR/.env.test" ]; then
    echo "SKIP: .env.test not found — integration tests require Supabase credentials"
    echo "      Run 'npm run test:integration' manually with .env.test configured"
    return 0
  fi
  echo "+ npm run test:integration"
  npm run test:integration
}

case "$SCOPE" in
  all)
    run "unit" npm run test:unit
    run_integration_or_skip
    run "e2e" npm run test:e2e
    run "frontend:lint" pnpm -C minimarket-system lint
    run "frontend:build" pnpm -C minimarket-system build
    run "frontend:test:components" pnpm -C minimarket-system test:components
    ;;
  backend)
    run "unit" npm run test:unit
    run_integration_or_skip
    run "e2e" npm run test:e2e
    ;;
  frontend)
    run "frontend:lint" pnpm -C minimarket-system lint
    run "frontend:build" pnpm -C minimarket-system build
    run "frontend:test:components" pnpm -C minimarket-system test:components
    ;;
  *)
    echo "Usage: $0 [all|backend|frontend]" >&2
    exit 2
    ;;
esac

echo
echo "Quality gates: PASS"
