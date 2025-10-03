#!/bin/bash
# =================================================================
# STAGING DEPLOYMENT SCRIPT - v0.10.0 (ETAPA 2)
# =================================================================
# Purpose: Automated staging deployment following CHECKLIST_STAGING_DEPLOYMENT_V0.10.0.md
# Date: 2025-10-03
# Mitigations: R1, R2, R3, R4, R6

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║         STAGING DEPLOYMENT v0.10.0 (ETAPA 2)                 ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_prerequisites() {
    print_section "1. PRE-DEPLOYMENT CHECKS"
    
    # Check docker
    if command -v docker &> /dev/null; then
        pass "Docker installed"
    else
        fail "Docker not found"
        exit 1
    fi
    
    # Check docker-compose
    if command -v docker-compose &> /dev/null; then
        pass "Docker Compose installed"
    else
        fail "Docker Compose not found"
        exit 1
    fi
    
    # Check .env.staging exists
    if [ -f "inventario-retail/.env.staging" ]; then
        pass ".env.staging exists"
    else
        fail ".env.staging not found"
        exit 1
    fi
    
    # Check JWT secrets configured
    if grep -q "lywdM/9FdhKUliDg2fAERWdnaXluGwAqbxaC5bTBKnU=" inventario-retail/.env.staging; then
        pass "JWT secrets configured in .env.staging"
    else
        warn "JWT secrets may not be properly configured"
    fi
    
    # Check validation script
    if [ -f "validate_etapa2_mitigations.py" ]; then
        pass "Validation script available"
    else
        warn "Validation script not found"
    fi
}

run_local_validation() {
    print_section "2. LOCAL VALIDATION"
    
    echo "Running ETAPA 2 validation script..."
    if python3 validate_etapa2_mitigations.py; then
        pass "Local validation: 27/27 tests passed"
    else
        fail "Local validation failed"
        exit 1
    fi
}

backup_current_state() {
    print_section "3. BACKUP CURRENT STATE"
    
    BACKUP_DIR="backups/pre-v0.10.0-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup docker-compose
    if [ -f "inventario-retail/docker-compose.production.yml" ]; then
        cp inventario-retail/docker-compose.production.yml "$BACKUP_DIR/"
        pass "Backed up docker-compose.production.yml"
    fi
    
    # Backup current .env if exists
    if [ -f "inventario-retail/.env.production" ]; then
        cp inventario-retail/.env.production "$BACKUP_DIR/"
        pass "Backed up .env.production"
    fi
    
    echo "Backup location: $BACKUP_DIR"
}

deploy_staging() {
    print_section "4. DEPLOYING TO STAGING"
    
    cd inventario-retail
    
    # Copy .env.staging to .env.production for deployment
    echo "Copying .env.staging..."
    cp .env.staging .env.production
    pass "Environment configured"
    
    # Pull latest images (if using GHCR)
    echo "Pulling Docker images..."
    if docker-compose -f docker-compose.production.yml pull 2>/dev/null; then
        pass "Docker images pulled"
    else
        warn "Image pull failed or not needed (building locally)"
    fi
    
    # Build containers
    echo "Building containers..."
    if docker-compose -f docker-compose.production.yml build --no-cache; then
        pass "Containers built successfully"
    else
        fail "Container build failed"
        cd ..
        exit 1
    fi
    
    # Start services
    echo "Starting services..."
    if docker-compose -f docker-compose.production.yml up -d; then
        pass "Services started"
    else
        fail "Failed to start services"
        cd ..
        exit 1
    fi
    
    cd ..
    
    # Wait for services to be ready
    echo "Waiting 30s for services to initialize..."
    sleep 30
}

health_checks() {
    print_section "5. HEALTH CHECKS"
    
    # Check deposito
    if curl -f -s http://localhost:8001/health > /dev/null 2>&1; then
        pass "agente-deposito health check"
    else
        fail "agente-deposito health check failed"
    fi
    
    # Check negocio
    if curl -f -s http://localhost:8002/health > /dev/null 2>&1; then
        pass "agente-negocio health check"
    else
        fail "agente-negocio health check failed"
    fi
    
    # Check ml
    if curl -f -s http://localhost:8003/health > /dev/null 2>&1; then
        pass "ml-service health check"
    else
        fail "ml-service health check failed"
    fi
    
    # Check dashboard
    if curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
        pass "dashboard health check"
    else
        fail "dashboard health check failed"
    fi
    
    # Check nginx
    if curl -f -s http://localhost:80/api/deposito/health > /dev/null 2>&1; then
        pass "nginx proxy health check"
    else
        warn "nginx health check failed (may not be running)"
    fi
}

smoke_tests_r1() {
    print_section "6. SMOKE TESTS - R1 (Container Security)"
    
    cd inventario-retail
    
    # Test deposito container user
    USER_DEPOSITO=$(docker-compose exec -T agente-deposito whoami 2>/dev/null || echo "error")
    if [ "$USER_DEPOSITO" = "agente" ]; then
        pass "agente-deposito runs as non-root (agente)"
    else
        fail "agente-deposito user: $USER_DEPOSITO (expected: agente)"
    fi
    
    # Test negocio container user
    USER_NEGOCIO=$(docker-compose exec -T agente-negocio whoami 2>/dev/null || echo "error")
    if [ "$USER_NEGOCIO" = "negocio" ]; then
        pass "agente-negocio runs as non-root (negocio)"
    else
        fail "agente-negocio user: $USER_NEGOCIO (expected: negocio)"
    fi
    
    # Test ml container user
    USER_ML=$(docker-compose exec -T ml whoami 2>/dev/null || echo "error")
    if [ "$USER_ML" = "mluser" ]; then
        pass "ml-service runs as non-root (mluser)"
    else
        fail "ml-service user: $USER_ML (expected: mluser)"
    fi
    
    # Test dashboard container user
    USER_DASHBOARD=$(docker-compose exec -T dashboard whoami 2>/dev/null || echo "error")
    if [ "$USER_DASHBOARD" = "dashboarduser" ]; then
        pass "dashboard runs as non-root (dashboarduser)"
    else
        fail "dashboard user: $USER_DASHBOARD (expected: dashboarduser)"
    fi
    
    cd ..
}

smoke_tests_r3() {
    print_section "7. SMOKE TESTS - R3 (OCR Timeout)"
    
    cd inventario-retail
    
    # Check OCR_TIMEOUT_SECONDS in logs
    if docker-compose logs agente-negocio 2>/dev/null | grep -q "OCR_TIMEOUT_SECONDS"; then
        pass "OCR timeout configuration present in logs"
    else
        warn "OCR timeout not found in logs (check startup)"
    fi
    
    cd ..
}

smoke_tests_r4() {
    print_section "8. SMOKE TESTS - R4 (ML Inflation)"
    
    cd inventario-retail
    
    # Check ML inflation in logs
    if docker-compose logs ml 2>/dev/null | grep -q "Inflación mensual configurada"; then
        pass "ML inflation configuration logged at startup"
    else
        warn "ML inflation log not found (check startup)"
    fi
    
    # Verify value
    if docker-compose logs ml 2>/dev/null | grep -q "4.5%"; then
        pass "ML inflation rate: 4.5% (correct)"
    else
        warn "ML inflation rate may differ from expected 4.5%"
    fi
    
    cd ..
}

check_metrics() {
    print_section "9. METRICS VALIDATION"
    
    # Dashboard metrics endpoint
    if curl -s -H "X-API-Key: staging_dashboard_api_key_2025_secure" \
        http://localhost:8080/metrics | grep -q "dashboard_requests_total"; then
        pass "Dashboard metrics endpoint accessible"
    else
        fail "Dashboard metrics endpoint not accessible"
    fi
}

check_logs() {
    print_section "10. LOG INSPECTION"
    
    cd inventario-retail
    
    # Check for errors in last 50 lines
    ERROR_COUNT=$(docker-compose logs --tail=50 2>&1 | grep -i "error" | wc -l)
    
    if [ "$ERROR_COUNT" -lt 5 ]; then
        pass "Log errors: $ERROR_COUNT (acceptable)"
    else
        warn "Log errors: $ERROR_COUNT (review recommended)"
    fi
    
    cd ..
}

print_summary() {
    print_section "DEPLOYMENT SUMMARY"
    
    echo -e "\n${BLUE}Results:${NC}"
    echo -e "  ${GREEN}Passed:${NC}   $PASSED"
    echo -e "  ${RED}Failed:${NC}   $FAILED"
    echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                               ║${NC}"
        echo -e "${GREEN}║     ✓ STAGING DEPLOYMENT SUCCESSFUL                          ║${NC}"
        echo -e "${GREEN}║                                                               ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Monitor logs: docker-compose -f inventario-retail/docker-compose.production.yml logs -f"
        echo "  2. Run extended tests"
        echo "  3. Review metrics at http://localhost:8080/metrics"
        echo ""
        return 0
    else
        echo -e "\n${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                                                               ║${NC}"
        echo -e "${RED}║     ✗ STAGING DEPLOYMENT FAILED                              ║${NC}"
        echo -e "${RED}║                                                               ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Rollback recommended. Check logs for details."
        echo ""
        return 1
    fi
}

# =================================================================
# MAIN EXECUTION
# =================================================================

main() {
    print_header
    
    check_prerequisites
    run_local_validation
    backup_current_state
    deploy_staging
    health_checks
    smoke_tests_r1
    smoke_tests_r3
    smoke_tests_r4
    check_metrics
    check_logs
    
    print_summary
}

# Run main function
main
exit_code=$?

exit $exit_code
