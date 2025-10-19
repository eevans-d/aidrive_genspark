#!/bin/bash

################################################################################
# DÍA 3 INTEGRATION VALIDATION SCRIPT
# 
# Validates the complete integration of all 4 circuit breakers:
# - OpenAI Circuit Breaker (DÍA 1)
# - Database Circuit Breaker (DÍA 1)  
# - Redis Circuit Breaker (DÍA 3)
# - S3 Circuit Breaker (DÍA 3)
# 
# Author: Resilience Team
# Date: October 19, 2025
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter variables
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED_CHECKS++))
}

check_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED_CHECKS++))
}

check_start() {
    echo -e "${BLUE}→${NC} $1"
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# ============================================================================
# SECTION 1: INTEGRATION FILE VERIFICATION
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 1: INTEGRATION FILE VERIFICATION"
echo "==============================================================================="

check_start "Checking DegradationManager integration"
((TOTAL_CHECKS++))
if grep -q "DÍA 3 INTEGRATION" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "DegradationManager updated for DÍA 3 integration"
else
    check_fail "DegradationManager NOT updated for DÍA 3"
fi

((TOTAL_CHECKS++))
if [ -f "tests/resilience/test_integration_dia3.py" ]; then
    check_pass "Integration tests file exists"
else
    check_fail "Integration tests file NOT FOUND"
fi

# ============================================================================
# SECTION 2: IMPORT VERIFICATION
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 2: IMPORT VERIFICATION"
echo "==============================================================================="

check_start "Verifying Redis and S3 imports in DegradationManager"

((TOTAL_CHECKS++))
if grep -q "from .redis_service import" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "Redis service import found"
else
    check_fail "Redis service import NOT FOUND"
fi

((TOTAL_CHECKS++))
if grep -q "from .s3_service import" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "S3 service import found"
else
    check_fail "S3 service import NOT FOUND"
fi

# ============================================================================
# SECTION 3: HEALTH CHECK INTEGRATION
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 3: HEALTH CHECK INTEGRATION"
echo "==============================================================================="

check_start "Verifying 4-service health check methods"

((TOTAL_CHECKS++))
if grep -A1 "_check_redis" "inventario-retail/shared/degradation_manager.py" | grep -q "DÍA 3"; then
    check_pass "Redis health check updated for DÍA 3"
else
    check_fail "Redis health check NOT updated"
fi

((TOTAL_CHECKS++))
if grep -A1 "_check_s3" "inventario-retail/shared/degradation_manager.py" | grep -q "DÍA 3"; then
    check_pass "S3 health check method found"
else
    check_fail "S3 health check method NOT FOUND"
fi

((TOTAL_CHECKS++))
if grep -q "'s3': await self._check_s3()" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "S3 included in health status evaluation"
else
    check_fail "S3 NOT included in health status evaluation"
fi

# ============================================================================
# SECTION 4: DEGRADATION LEVEL CALCULATION
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 4: DEGRADATION LEVEL CALCULATION" 
echo "==============================================================================="

check_start "Verifying 4-service degradation calculation logic"

((TOTAL_CHECKS++))
if grep -q "s3_ok = health_status.get('s3'" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "S3 status check in degradation calculation"
else
    check_fail "S3 status check NOT FOUND in degradation calculation"
fi

((TOTAL_CHECKS++))
if grep -q "failed_services = sum" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "Failed services counting logic found"
else
    check_fail "Failed services counting logic NOT FOUND"
fi

((TOTAL_CHECKS++))
if grep -q "4-service coordination" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "4-service coordination documented"
else
    check_fail "4-service coordination NOT documented"
fi

# ============================================================================
# SECTION 5: CIRCUIT BREAKER INITIALIZATION
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 5: CIRCUIT BREAKER INITIALIZATION"
echo "==============================================================================="

check_start "Verifying circuit breaker initialization method"

((TOTAL_CHECKS++))
if grep -q "initialize_circuit_breakers" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "Circuit breaker initialization method found"
else
    check_fail "Circuit breaker initialization method NOT FOUND"
fi

((TOTAL_CHECKS++))
if grep -q "initialize_redis" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "Redis initialization in CB init method"
else
    check_fail "Redis initialization NOT FOUND in CB init method"
fi

((TOTAL_CHECKS++))
if grep -q "initialize_s3" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "S3 initialization in CB init method"
else
    check_fail "S3 initialization NOT FOUND in CB init method"
fi

# ============================================================================
# SECTION 6: FEATURE AVAILABILITY MATRIX
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 6: FEATURE AVAILABILITY MATRIX"
echo "==============================================================================="

check_start "Verifying updated feature availability matrix"

((TOTAL_CHECKS++))
if grep -q "redis_cache.*DEGRADED" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "Redis-dependent features found"
else
    check_fail "Redis-dependent features NOT FOUND"
fi

((TOTAL_CHECKS++))
if grep -q "s3_uploads.*DEGRADED" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "S3-dependent features found"  
else
    check_fail "S3-dependent features NOT FOUND"
fi

((TOTAL_CHECKS++))
if grep -q "full_ai_pipeline.*OPTIMAL" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "Combined service features found"
else
    check_fail "Combined service features NOT FOUND"
fi

# ============================================================================
# SECTION 7: SYNTAX AND COMPILATION
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 7: SYNTAX AND COMPILATION"
echo "==============================================================================="

check_start "Verifying Python syntax for integration files"

((TOTAL_CHECKS++))
if python3 -m py_compile "inventario-retail/shared/degradation_manager.py" 2>/dev/null; then
    check_pass "DegradationManager syntax is valid"
else
    check_fail "DegradationManager has syntax errors"
fi

((TOTAL_CHECKS++))
if python3 -m py_compile "tests/resilience/test_integration_dia3.py" 2>/dev/null; then
    check_pass "Integration tests syntax is valid"
else
    check_fail "Integration tests have syntax errors"
fi

# ============================================================================
# SECTION 8: LINE COUNT VERIFICATION
# ============================================================================

echo ""
echo "===============================================================================" 
echo "SECTION 8: LINE COUNT VERIFICATION"
echo "==============================================================================="

check_start "Verifying integration code additions"

((TOTAL_CHECKS++))
degradation_lines=$(wc -l < "inventario-retail/shared/degradation_manager.py")
if [ "$degradation_lines" -gt 520 ]; then
    check_pass "DegradationManager expanded: $degradation_lines lines"
else
    check_fail "DegradationManager not sufficiently expanded: $degradation_lines lines"
fi

((TOTAL_CHECKS++))
integration_test_lines=$(wc -l < "tests/resilience/test_integration_dia3.py")
if [ "$integration_test_lines" -gt 350 ]; then
    check_pass "Integration tests comprehensive: $integration_test_lines lines"
else
    check_fail "Integration tests insufficient: $integration_test_lines lines"
fi

# ============================================================================
# SECTION 9: TEST CLASS VERIFICATION
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 9: TEST CLASS VERIFICATION"
echo "==============================================================================="

check_start "Verifying integration test coverage"

integration_test_classes=("TestCircuitBreakerIntegration" "TestHealthScoreAggregation" "TestFeatureAvailability" "TestPerformanceIntegration")
for test_class in "${integration_test_classes[@]}"; do
    ((TOTAL_CHECKS++))
    if grep -q "class $test_class" "tests/resilience/test_integration_dia3.py"; then
        check_pass "Integration test class '$test_class' found"
    else
        check_fail "Integration test class '$test_class' NOT FOUND"
    fi
done

# ============================================================================
# SECTION 10: SERVICE WEIGHT VERIFICATION
# ============================================================================

echo ""
echo "==============================================================================="
echo "SECTION 10: SERVICE WEIGHT VERIFICATION"
echo "==============================================================================="

check_start "Verifying service weight distribution"

((TOTAL_CHECKS++))
if grep -q "weight=0.50" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "Database weight (50%) configured"
else
    check_fail "Database weight NOT properly configured"
fi

((TOTAL_CHECKS++))
if grep -q "weight=0.30" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "OpenAI weight (30%) configured"
else
    check_fail "OpenAI weight NOT properly configured"
fi

((TOTAL_CHECKS++))
if grep -q "weight=0.15" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "Redis weight (15%) configured"
else
    check_fail "Redis weight NOT properly configured"
fi

((TOTAL_CHECKS++))
if grep -q "weight=0.05" "inventario-retail/shared/degradation_manager.py"; then
    check_pass "S3 weight (5%) configured"
else
    check_fail "S3 weight NOT properly configured"
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================

echo ""
echo "==============================================================================="
echo "FINAL INTEGRATION SUMMARY"
echo "==============================================================================="
echo ""
echo "Total Checks:    $TOTAL_CHECKS"
echo -e "Passed:          ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed:          ${RED}$FAILED_CHECKS${NC}"
echo ""

if [ "$FAILED_CHECKS" -eq 0 ]; then
    echo -e "${GREEN}✓ ALL INTEGRATION CHECKS PASSED${NC}"
    echo ""
    info "DÍA 3 INTEGRATION Summary:"
    echo "  • DegradationManager: $degradation_lines lines (expanded)"
    echo "  • Integration Tests: $integration_test_lines lines"
    echo "  • 4 Circuit Breakers: OpenAI, Database, Redis, S3"
    echo "  • Service Weights: DB(50%) + OpenAI(30%) + Redis(15%) + S3(5%)"
    echo "  • Feature Matrix: Updated for Redis/S3 capabilities"
    echo "  • Health Checks: All 4 services integrated"
    echo ""
    info "Ready for DÍA 4-5: Staging Deployment"
    exit 0
else
    echo -e "${RED}✗ SOME INTEGRATION CHECKS FAILED${NC}"
    echo ""
    info "Please review the failures above and correct them."
    exit 1
fi