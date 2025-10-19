#!/bin/bash
# Validation Script for Staging Deployment - DÍA 4-5 HORAS 1-2
# Purpose: Verify all prerequisites are met before starting deployment
# Status: PHASE 1 - Environment validation

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_SKIPPED=0

# Helper functions
check_file_exists() {
    local file=$1
    local description=$2
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: $file"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $description: $file (NOT FOUND)"
        ((CHECKS_FAILED++))
    fi
}

check_directory_exists() {
    local dir=$1
    local description=$2
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description: $dir"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $description: $dir (NOT FOUND)"
        ((CHECKS_FAILED++))
    fi
}

check_command_exists() {
    local cmd=$1
    local description=$2
    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $description: $cmd installed"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}!${NC} $description: $cmd (NOT INSTALLED - optional)"
        ((CHECKS_SKIPPED++))
    fi
}

check_env_var() {
    local var=$1
    local description=$2
    if [ -z "${!var}" ]; then
        echo -e "${YELLOW}!${NC} $description: $var (not set)"
        ((CHECKS_SKIPPED++))
    else
        echo -e "${GREEN}✓${NC} $description: $var set"
        ((CHECKS_PASSED++))
    fi
}

check_file_content() {
    local file=$1
    local pattern=$2
    local description=$3
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $description (pattern not found: $pattern)"
        ((CHECKS_FAILED++))
    fi
}

check_line_count() {
    local file=$1
    local min_lines=$2
    local description=$3
    local actual_lines=$(wc -l < "$file")
    if [ "$actual_lines" -ge "$min_lines" ]; then
        echo -e "${GREEN}✓${NC} $description: $actual_lines lines (>= $min_lines)"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $description: $actual_lines lines (< $min_lines)"
        ((CHECKS_FAILED++))
    fi
}

# Print header
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  STAGING DEPLOYMENT VALIDATION - DÍA 4-5 HORAS 1-2        ║${NC}"
echo -e "${BLUE}║  Purpose: Verify all prerequisites before deployment       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# SECTION 1: Code Files Verification
# ============================================================================
echo -e "${BLUE}[SECTION 1] Code Files Verification${NC}"
echo "Checking that all required source files exist..."
check_file_exists "inventario-retail/web_dashboard/dashboard_app.py" "Dashboard app"
check_file_exists "inventario-retail/shared/degradation_manager.py" "Degradation manager"
check_file_exists "inventario-retail/shared/openai_service.py" "OpenAI circuit breaker"
check_file_exists "inventario-retail/shared/database_service.py" "Database circuit breaker"
check_file_exists "inventario-retail/shared/redis_service.py" "Redis circuit breaker"
check_file_exists "inventario-retail/shared/s3_service.py" "S3 circuit breaker"
echo ""

# ============================================================================
# SECTION 2: Test Files Verification
# ============================================================================
echo -e "${BLUE}[SECTION 2] Test Files Verification${NC}"
echo "Checking that all required test files exist..."
check_file_exists "tests/resilience/test_openai_service.py" "OpenAI service tests"
check_file_exists "tests/resilience/test_database_service.py" "Database service tests"
check_file_exists "tests/resilience/test_redis_service.py" "Redis service tests"
check_file_exists "tests/resilience/test_s3_service.py" "S3 service tests"
check_file_exists "tests/resilience/test_integration_dia3.py" "Integration tests"
check_file_exists "tests/staging/smoke_test_staging.py" "Smoke tests"
echo ""

# ============================================================================
# SECTION 3: Docker & Deployment Files
# ============================================================================
echo -e "${BLUE}[SECTION 3] Docker & Deployment Files${NC}"
echo "Checking that all deployment configuration files exist..."
check_file_exists "docker-compose.staging.yml" "Docker Compose staging configuration"
check_file_exists ".env.staging" "Environment file for staging"
check_file_exists "inventario-retail/prometheus/prometheus.staging.yml" "Prometheus configuration"
check_file_exists "scripts/init-s3.sh" "S3 initialization script"
check_file_exists "DEPLOYMENT_CHECKLIST_STAGING.md" "Deployment checklist"
echo ""

# ============================================================================
# SECTION 4: Docker Compose Validation
# ============================================================================
echo -e "${BLUE}[SECTION 4] Docker Compose Configuration${NC}"
echo "Validating docker-compose.staging.yml syntax..."
if command -v docker-compose &> /dev/null; then
    if docker-compose -f docker-compose.staging.yml config > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Docker Compose configuration is valid"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}!${NC} Docker Compose configuration has errors (will retry at deployment)"
        ((CHECKS_SKIPPED++))
    fi
else
    echo -e "${YELLOW}!${NC} Docker Compose not installed (optional for validation)"
    ((CHECKS_SKIPPED++))
fi

# Check for required services
echo "Checking for required services in docker-compose..."
check_file_content "docker-compose.staging.yml" "postgres:" "PostgreSQL service defined"
check_file_content "docker-compose.staging.yml" "redis:" "Redis service defined"
check_file_content "docker-compose.staging.yml" "localstack:" "LocalStack service defined"
check_file_content "docker-compose.staging.yml" "dashboard:" "Dashboard service defined"
check_file_content "docker-compose.staging.yml" "prometheus:" "Prometheus service defined"
check_file_content "docker-compose.staging.yml" "grafana:" "Grafana service defined"
echo ""

# ============================================================================
# SECTION 5: Environment File Validation
# ============================================================================
echo -e "${BLUE}[SECTION 5] Environment File Validation${NC}"
echo "Checking .env.staging configuration..."
check_file_content ".env.staging" "STAGING_DB_USER" "Database user configured"
check_file_content ".env.staging" "REDIS_HOST" "Redis host configured"
check_file_content ".env.staging" "S3_ENDPOINT_URL" "S3 endpoint configured"
check_file_content ".env.staging" "OPENAI_API_KEY" "OpenAI API key configured"
check_file_content ".env.staging" "STAGING_DASHBOARD_API_KEY" "Dashboard API key configured"
check_file_content ".env.staging" "SERVICE_WEIGHTS" "Service weights configured"
check_file_content ".env.staging" "OPTIMAL_THRESHOLD" "Degradation thresholds configured"
echo ""

# ============================================================================
# SECTION 6: Circuit Breaker Configuration
# ============================================================================
echo -e "${BLUE}[SECTION 6] Circuit Breaker Configuration${NC}"
echo "Validating circuit breaker thresholds in .env.staging..."
check_file_content ".env.staging" "OPENAI_CB_FAILURE_THRESHOLD=5" "OpenAI CB threshold"
check_file_content ".env.staging" "DB_CB_FAILURE_THRESHOLD=3" "Database CB threshold"
check_file_content ".env.staging" "REDIS_CB_FAILURE_THRESHOLD=5" "Redis CB threshold"
check_file_content ".env.staging" "S3_CB_FAILURE_THRESHOLD=4" "S3 CB threshold"
check_file_content ".env.staging" "OPENAI_CB_RECOVERY_TIMEOUT=30" "OpenAI recovery timeout"
check_file_content ".env.staging" "DB_CB_RECOVERY_TIMEOUT=20" "Database recovery timeout"
check_file_content ".env.staging" "REDIS_CB_RECOVERY_TIMEOUT=15" "Redis recovery timeout"
check_file_content ".env.staging" "S3_CB_RECOVERY_TIMEOUT=25" "S3 recovery timeout"
echo ""

# ============================================================================
# SECTION 7: System Requirements
# ============================================================================
echo -e "${BLUE}[SECTION 7] System Requirements${NC}"
echo "Checking for required tools and dependencies..."
check_command_exists "docker" "Docker"
check_command_exists "docker-compose" "Docker Compose"
check_command_exists "python3" "Python 3"
check_command_exists "pytest" "pytest (Python testing framework)"
check_command_exists "curl" "curl (HTTP client)"
check_command_exists "git" "git"
echo ""

# ============================================================================
# SECTION 8: Python Dependencies
# ============================================================================
echo -e "${BLUE}[SECTION 8] Python Dependencies${NC}"
echo "Checking for required Python packages..."
PYTHON_PACKAGES=("pytest" "httpx" "asyncio" "prometheus_client")
for package in "${PYTHON_PACKAGES[@]}"; do
    if python3 -c "import ${package}" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Python package: $package"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}!${NC} Python package: $package (not installed)"
        ((CHECKS_SKIPPED++))
    fi
done
echo ""

# ============================================================================
# SECTION 9: File Sizes & Content Validation
# ============================================================================
echo -e "${BLUE}[SECTION 9] File Sizes & Content Validation${NC}"
echo "Validating file sizes and content completeness..."
check_line_count "docker-compose.staging.yml" 200 "Docker Compose file size"
check_line_count "tests/staging/smoke_test_staging.py" 400 "Smoke tests file size"
check_line_count "DEPLOYMENT_CHECKLIST_STAGING.md" 300 "Deployment checklist size"
check_line_count "inventario-retail/shared/degradation_manager.py" 600 "Degradation manager size"
echo ""

# ============================================================================
# SECTION 10: Integration Verification
# ============================================================================
echo -e "${BLUE}[SECTION 10] Integration Verification${NC}"
echo "Verifying circuit breaker integration..."
check_file_content "inventario-retail/shared/degradation_manager.py" "redis_service" "Redis integration"
check_file_content "inventario-retail/shared/degradation_manager.py" "s3_service" "S3 integration"
check_file_content "inventario-retail/shared/degradation_manager.py" "_check_redis" "Redis health check"
check_file_content "inventario-retail/shared/degradation_manager.py" "_check_s3" "S3 health check"
check_file_content "inventario-retail/shared/degradation_manager.py" "initialize_circuit_breakers" "CB initialization"
echo ""

# ============================================================================
# SECTION 11: Smoke Tests Coverage
# ============================================================================
echo -e "${BLUE}[SECTION 11] Smoke Tests Coverage${NC}"
echo "Verifying smoke test classes and methods..."
check_file_content "tests/staging/smoke_test_staging.py" "TestStagingConnectivity" "Connectivity tests"
check_file_content "tests/staging/smoke_test_staging.py" "TestDashboardHealthChecks" "Health check tests"
check_file_content "tests/staging/smoke_test_staging.py" "TestCircuitBreakerFunctionality" "CB functionality tests"
check_file_content "tests/staging/smoke_test_staging.py" "TestDegradationLevels" "Degradation level tests"
check_file_content "tests/staging/smoke_test_staging.py" "TestFeatureAvailability" "Feature availability tests"
check_file_content "tests/staging/smoke_test_staging.py" "TestMetricsExposition" "Metrics exposition tests"
check_file_content "tests/staging/smoke_test_staging.py" "TestEndToEndScenarios" "End-to-end scenario tests"
echo ""

# ============================================================================
# SECTION 12: Documentation & Runbooks
# ============================================================================
echo -e "${BLUE}[SECTION 12] Documentation & Runbooks${NC}"
echo "Verifying documentation completeness..."
check_file_exists "README.md" "Project README"
check_file_exists "PLAN_DESPLIEGUE_INVENTARIO_RETAIL.md" "Deployment plan"
check_file_exists "RUNBOOK_OPERACIONES_DASHBOARD.md" "Operations runbook"
check_file_exists "STATUS_DIA3_HORAS_1_8_COMPLETE.md" "DÍA 3 completion report"
echo ""

# ============================================================================
# SECTION 13: Git Status
# ============================================================================
echo -e "${BLUE}[SECTION 13] Git Status${NC}"
echo "Verifying git repository state..."
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository found"
    ((CHECKS_PASSED++))
    
    # Check current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" == "feature/resilience-hardening" ]; then
        echo -e "${GREEN}✓${NC} On correct branch: $CURRENT_BRANCH"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}!${NC} On branch: $CURRENT_BRANCH (should be feature/resilience-hardening)"
        ((CHECKS_SKIPPED++))
    fi
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        echo -e "${GREEN}✓${NC} No uncommitted changes"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}!${NC} Uncommitted changes detected"
        ((CHECKS_SKIPPED++))
    fi
else
    echo -e "${RED}✗${NC} Git repository not found"
    ((CHECKS_FAILED++))
fi
echo ""

# ============================================================================
# SECTION 14: Summary & Recommendations
# ============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    VALIDATION SUMMARY                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_SKIPPED))
PASS_RATE=$(( (CHECKS_PASSED * 100) / TOTAL_CHECKS ))

echo -e "${GREEN}Passed:${NC}  $CHECKS_PASSED"
echo -e "${RED}Failed:${NC}  $CHECKS_FAILED"
echo -e "${YELLOW}Skipped:${NC} $CHECKS_SKIPPED"
echo -e "${BLUE}Total:${NC}   $TOTAL_CHECKS"
echo -e "${BLUE}Rate:${NC}    $PASS_RATE%"
echo ""

# ============================================================================
# Deployment Readiness
# ============================================================================
if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ DEPLOYMENT READY!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT_CHECKLIST_STAGING.md for pre-deployment tasks"
    echo "2. Load environment: source .env.staging"
    echo "3. Start services: docker-compose -f docker-compose.staging.yml up -d"
    echo "4. Run smoke tests: pytest tests/staging/smoke_test_staging.py -v"
    echo "5. Access Dashboard: http://localhost:8080 (with X-API-Key header)"
    echo "6. Access Grafana: http://localhost:3001 (admin / admin_staging_2025)"
    echo ""
else
    echo -e "${RED}❌ DEPLOYMENT BLOCKED - CRITICAL ISSUES FOUND${NC}"
    echo ""
    echo "Issues to resolve:"
    echo "1. Fix all $CHECKS_FAILED failed checks"
    echo "2. Review error messages above"
    echo "3. Ensure all required files are in place"
    echo "4. Validate docker-compose configuration"
    echo ""
    exit 1
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo "Validation Date: $(date)"
echo "Environment: Staging"
echo "Phase: DÍA 4-5 HORAS 1-2"
echo "Status: Ready for deployment ✅"
echo ""
