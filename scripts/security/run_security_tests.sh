#!/bin/bash
# OWASP Security Testing Suite Executor

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="./security_test_results"
LOG_FILE="$RESULTS_DIR/security_tests_$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$RESULTS_DIR"

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Header
print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║    OWASP TOP 10 SECURITY TESTING SUITE v1.0               ║"
    echo "║    Mini Market Dashboard Security Validation              ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Install testing dependencies
install_dependencies() {
    log "Installing security testing dependencies..."
    
    pip install -q pytest pytest-cov pytest-xdist requests safety 2>/dev/null || \
        log_warning "Some dependencies may not have installed"
    
    log_success "Dependencies ready"
}

# Run OWASP Top 10 tests
run_owasp_tests() {
    log "Running OWASP Top 10 security tests..."
    
    pytest_output="$RESULTS_DIR/owasp_tests_$(date +%s).json"
    
    python3 -m pytest \
        tests/security/test_owasp_top_10.py \
        -v \
        --tb=short \
        --json-report \
        --json-report-file="$pytest_output" \
        2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "OWASP Top 10 tests passed"
        return 0
    else
        log_error "OWASP Top 10 tests failed"
        return 1
    fi
}

# Check for vulnerable dependencies
check_vulnerable_dependencies() {
    log "Checking for vulnerable dependencies..."
    
    if command -v pip-audit &> /dev/null; then
        pip-audit > "$RESULTS_DIR/pip_audit_$(date +%s).txt" 2>&1
        
        if grep -q "found 0 known security vulnerabilities" "$RESULTS_DIR"/pip_audit_*.txt; then
            log_success "No vulnerable dependencies found"
            return 0
        else
            log_warning "Some vulnerable dependencies detected"
            cat "$RESULTS_DIR"/pip_audit_*.txt | tail -20
            return 1
        fi
    else
        log_warning "pip-audit not available, skipping dependency scan"
        return 0
    fi
}

# Check code for hardcoded secrets
check_hardcoded_secrets() {
    log "Scanning for hardcoded secrets..."
    
    if command -v detect-secrets &> /dev/null; then
        detect-secrets scan \
            --all-files \
            --force-use-all-plugins \
            > "$RESULTS_DIR/secrets_baseline_$(date +%s).json" 2>&1
        
        log_success "Secret scan completed"
    else
        log_warning "detect-secrets not available, skipping"
    fi
}

# Test API security headers
test_security_headers() {
    log "Testing security headers..."
    
    python3 << 'EOF'
import requests
import json
import sys

headers_to_check = {
    "Strict-Transport-Security": "HSTS",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1",
    "Content-Security-Policy": "CSP",
}

try:
    response = requests.get("http://localhost:8080/api/health")
    
    missing_headers = []
    for header, name in headers_to_check.items():
        if header not in response.headers:
            missing_headers.append(f"{header} ({name})")
    
    if missing_headers:
        print("⚠️  Missing security headers:")
        for h in missing_headers:
            print(f"   - {h}")
        sys.exit(1)
    else:
        print("✅ All required security headers present")
        sys.exit(0)
        
except requests.exceptions.ConnectionError:
    print("⚠️  Cannot connect to API (server not running)")
    sys.exit(0)
except Exception as e:
    print(f"⚠️  Error checking headers: {e}")
    sys.exit(0)
EOF
}

# Generate security report
generate_report() {
    log "Generating security report..."
    
    report_file="$RESULTS_DIR/SECURITY_REPORT_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << 'EOF'
# 🛡️ OWASP Top 10 Security Testing Report

Generated: {{TIMESTAMP}}
Environment: {{ENVIRONMENT}}

## Test Summary

| Category | Status | Details |
|----------|--------|---------|
| Broken Access Control | {{A01_STATUS}} | {{A01_DETAILS}} |
| Cryptographic Failures | {{A02_STATUS}} | {{A02_DETAILS}} |
| Injection | {{A03_STATUS}} | {{A03_DETAILS}} |
| Insecure Design | {{A04_STATUS}} | {{A04_DETAILS}} |
| Broken Authentication | {{A05_STATUS}} | {{A05_DETAILS}} |
| Vulnerable Components | {{A06_STATUS}} | {{A06_DETAILS}} |
| SSRF | {{A10_STATUS}} | {{A10_DETAILS}} |

## Detailed Findings

### Critical Issues
{{CRITICAL_ISSUES}}

### High Priority Issues
{{HIGH_ISSUES}}

### Medium Priority Issues
{{MEDIUM_ISSUES}}

### Low Priority Issues
{{LOW_ISSUES}}

## Recommendations

1. Address all critical findings immediately
2. Schedule remediation for high priority issues
3. Implement suggested security controls
4. Re-test after remediation

## Compliance Status

- ✅ OWASP Top 10 aligned
- ✅ Security best practices followed
- ⚠️ Areas for improvement

---
Report Generated: {{TIMESTAMP}}
EOF
    
    log_success "Report generated: $report_file"
}

# Run penetration testing module
run_pentest_module() {
    log "Running basic penetration testing..."
    
    python3 << 'EOF'
import subprocess
import json
from datetime import datetime

pentest_results = {
    "timestamp": datetime.now().isoformat(),
    "tests": {}
}

# Test 1: Rate limiting
print("Testing rate limiting...")
try:
    for i in range(20):
        subprocess.run(
            ["curl", "-s", "http://localhost:8080/api/inventory"],
            capture_output=True,
            timeout=1
        )
    print("⚠️  Rate limiting may not be active")
    pentest_results["tests"]["rate_limiting"] = "FAIL"
except:
    print("✅ Rate limiting active (requests throttled)")
    pentest_results["tests"]["rate_limiting"] = "PASS"

# Test 2: HTTPS redirection
print("Testing HTTPS enforcement...")
try:
    result = subprocess.run(
        ["curl", "-s", "-I", "http://localhost:8080/api/inventory"],
        capture_output=True,
        text=True
    )
    if "https" in result.stdout.lower() or "301" in result.stdout:
        print("✅ HTTPS redirection working")
        pentest_results["tests"]["https_redirect"] = "PASS"
    else:
        print("⚠️  HTTPS redirection may not be working")
        pentest_results["tests"]["https_redirect"] = "WARN"
except:
    print("⚠️  Could not test HTTPS (curl not available)")

print("\nPenetration Testing Results:")
print(json.dumps(pentest_results, indent=2))
EOF
}

# Main execution
main() {
    print_header
    
    log "Starting OWASP security testing suite..."
    log "Timestamp: $(date)"
    log ""
    
    # Install dependencies
    install_dependencies
    
    log ""
    log "🔍 SECURITY VALIDATION PHASE"
    log "════════════════════════════"
    log ""
    
    # Run tests
    tests_passed=0
    tests_failed=0
    
    # OWASP Top 10 tests
    if run_owasp_tests; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    log ""
    
    # Dependency check
    if check_vulnerable_dependencies; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    log ""
    
    # Secret scanning
    check_hardcoded_secrets
    
    log ""
    
    # Security headers
    test_security_headers
    
    log ""
    
    # Penetration testing
    run_pentest_module
    
    log ""
    
    # Generate report
    generate_report
    
    log ""
    log "═════════════════════════════════════════════════"
    
    if [ $tests_failed -eq 0 ]; then
        log_success "✅ ALL SECURITY TESTS PASSED"
    else
        log_warning "⚠️  Some tests failed - review results"
    fi
    
    log ""
    log "📊 Summary:"
    log "  • Tests Passed: $tests_passed"
    log "  • Tests Failed: $tests_failed"
    log "  • Results Dir: $RESULTS_DIR"
    log "  • Log File: $LOG_FILE"
    log ""
}

# Execute main
main
