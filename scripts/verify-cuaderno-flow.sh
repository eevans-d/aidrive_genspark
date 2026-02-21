#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────
# verify-cuaderno-flow.sh
#
# Unified verification runner for the cuaderno/faltantes/backfill pipeline.
# Runs all checks in sequence and reports a single PASS/FAIL verdict.
#
# Steps:
#   1. Lint (frontend)
#   2. Unit tests (cuaderno parser + backfill)
#   3. Component tests (QuickNoteButton + Cuaderno page)
#   4. Full build (frontend)
#   5. Static integrity audit
#   6. Doc-link validation
#   7. Code pattern checks (rg for consistency)
#
# Usage:
#   bash scripts/verify-cuaderno-flow.sh
#
# Exit: 0 if all steps pass, 1 if any step fails.
# ──────────────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()

run_step() {
    local label="$1"
    shift
    echo -e "\n${CYAN}── Step: ${label} ──${NC}"
    if "$@" 2>&1; then
        echo -e "  ${GREEN}✓ PASS${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
        RESULTS+=("PASS: $label")
    else
        echo -e "  ${RED}✗ FAIL${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        RESULTS+=("FAIL: $label")
    fi
}

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Cuaderno/Faltantes Flow Verification Runner        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"

# 1. Lint
run_step "Frontend lint" pnpm -C minimarket-system lint

# 2. Unit tests (cuaderno + backfill)
run_step "Unit tests (parser + backfill)" npx vitest run tests/unit/cuadernoParser.test.ts tests/unit/backfill-faltantes.test.ts --reporter=verbose

# 3. Component tests
run_step "Component tests (QuickNoteButton + Cuaderno)" pnpm -C minimarket-system test:components

# 4. Build
run_step "Frontend build" pnpm -C minimarket-system build

# 5. Integrity audit
run_step "Cuaderno integrity audit" node scripts/audit-cuaderno-integrity.mjs --offline

# 6. Doc-link validation
run_step "Doc-link validation" node scripts/validate-doc-links.mjs

# 7. Code pattern checks
echo -e "\n${CYAN}── Step: Code pattern consistency ──${NC}"
PATTERN_ISSUES=0

# Check traceability in backfill
if grep -q "origen.*cuaderno" supabase/functions/backfill-faltantes-recordatorios/index.ts 2>/dev/null; then
    echo "  ✓ Backfill: origen traceability present"
else
    echo "  ✗ Backfill: origen traceability MISSING"
    PATTERN_ISSUES=$((PATTERN_ISSUES + 1))
fi

if grep -q "faltante_id" supabase/functions/backfill-faltantes-recordatorios/index.ts 2>/dev/null; then
    echo "  ✓ Backfill: faltante_id linkage present"
else
    echo "  ✗ Backfill: faltante_id linkage MISSING"
    PATTERN_ISSUES=$((PATTERN_ISSUES + 1))
fi

if grep -q "backfill_version" supabase/functions/backfill-faltantes-recordatorios/index.ts 2>/dev/null; then
    echo "  ✓ Backfill: version traceability present"
else
    echo "  ✗ Backfill: version traceability MISSING"
    PATTERN_ISSUES=$((PATTERN_ISSUES + 1))
fi

# Check no hardcoded secrets
if grep -rn "eyJ" supabase/functions/backfill-faltantes-recordatorios/ 2>/dev/null; then
    echo "  ✗ Backfill: hardcoded JWT/secret detected!"
    PATTERN_ISSUES=$((PATTERN_ISSUES + 1))
else
    echo "  ✓ Backfill: no hardcoded secrets"
fi

if [ "$PATTERN_ISSUES" -eq 0 ]; then
    echo -e "  ${GREEN}✓ PASS${NC}"
    PASS_COUNT=$((PASS_COUNT + 1))
    RESULTS+=("PASS: Code pattern consistency")
else
    echo -e "  ${RED}✗ FAIL ($PATTERN_ISSUES issues)${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RESULTS+=("FAIL: Code pattern consistency")
fi

# ── Summary ──────────────────────────────────────────────────────────────
echo -e "\n${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Verification Summary                                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"

for r in "${RESULTS[@]}"; do
    if [[ "$r" == PASS* ]]; then
        echo -e "  ${GREEN}✓${NC} ${r#PASS: }"
    else
        echo -e "  ${RED}✗${NC} ${r#FAIL: }"
    fi
done

TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo -e "\n  Total: ${PASS_COUNT}/${TOTAL} passed"

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "\n  ${RED}VERDICT: FAIL${NC} ($FAIL_COUNT step(s) failed)\n"
    exit 1
else
    echo -e "\n  ${GREEN}VERDICT: PASS${NC} (all steps passed)\n"
    exit 0
fi
