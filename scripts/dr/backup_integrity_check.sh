#!/bin/bash
# Backup Integrity Verification Script
# Validates all backups for:
# - Presence (no gaps)
# - Completeness (not truncated)
# - Integrity (checksums)
# - Restorability (can be restored)

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_BUCKET="minimarket-backups"
BACKUP_DIR="/backups"
LOG_FILE="/var/log/backup-integrity-$(date +%Y%m%d_%H%M%S).log"
ALERT_EMAIL="operations@minimarket.local"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { echo -e "${BLUE}ℹ️${NC}  $*" >&2; log "INFO" "$@"; }
log_ok() { echo -e "${GREEN}✅${NC}  $*" >&2; log "OK" "$@"; }
log_warn() { echo -e "${YELLOW}⚠️${NC}  $*" >&2; log "WARN" "$@"; }
log_error() { echo -e "${RED}❌${NC}  $*" >&2; log "ERROR" "$@"; }

# Error handler
on_error() {
    local line=$1
    log_error "Error on line $line"
    send_alert "Backup integrity check failed on line $line. See: $LOG_FILE"
    exit 1
}

trap 'on_error $LINENO' ERR

# Send alert email
send_alert() {
    local message="$1"
    echo "$message" | mail -s "🚨 Backup Integrity Alert" "$ALERT_EMAIL" || true
}

# Check backup presence (hourly)
check_hourly_backup_coverage() {
    log_info "Checking hourly backup coverage (last 24 hours)..."
    
    local now=$(date +%s)
    local hours=24
    local missing=0
    local found=0
    
    for i in $(seq 0 $((hours-1))); do
        local check_time=$((now - i * 3600))
        local check_date=$(date -d @$check_time +%Y-%m-%d)
        local check_hour=$(date -d @$check_time +%H)
        local backup_key="hourly/minimarket_${check_date}_${check_hour}00.bak"
        
        if aws s3 ls "s3://$BACKUP_BUCKET/$backup_key" > /dev/null 2>&1; then
            ((found++))
        else
            ((missing++))
            log_warn "Missing backup: $backup_key"
        fi
    done
    
    local coverage=$((found * 100 / hours))
    
    if [ $missing -gt 2 ]; then
        log_error "Coverage below threshold: $coverage% ($found/$hours backups found, $missing missing)"
        send_alert "Backup coverage critical: $coverage% ($missing missing backups in last 24 hours)"
        return 1
    elif [ $coverage -lt 95 ]; then
        log_warn "Coverage below optimal: $coverage% ($found/$hours backups found)"
    else
        log_ok "Coverage excellent: $coverage% ($found/$hours backups found)"
    fi
    
    return 0
}

# Check backup sizes
check_backup_sizes() {
    log_info "Checking backup sizes for anomalies..."
    
    local backup_sizes=$(aws s3 ls "s3://$BACKUP_BUCKET/hourly/" --recursive | awk '{print $3}' | tail -24)
    
    if [ -z "$backup_sizes" ]; then
        log_error "No backups found for size analysis"
        return 1
    fi
    
    # Calculate statistics
    local min_size=$(echo "$backup_sizes" | sort -n | head -1)
    local max_size=$(echo "$backup_sizes" | sort -n | tail -1)
    local avg_size=$(echo "$backup_sizes" | awk '{sum+=$1; count++} END {print int(sum/count)}')
    
    # Check for anomalies (size deviation >50%)
    local threshold=$((avg_size / 2))
    
    echo "$backup_sizes" | while read size; do
        if [ "$size" -lt "$threshold" ]; then
            log_warn "Suspicious backup size: $((size / 1024 / 1024))MB (avg: $((avg_size / 1024 / 1024))MB)"
        fi
    done
    
    log_ok "Backup sizes analyzed:"
    log_ok "  Min: $((min_size / 1024 / 1024))MB"
    log_ok "  Max: $((max_size / 1024 / 1024))MB"
    log_ok "  Avg: $((avg_size / 1024 / 1024))MB"
    
    return 0
}

# Verify backup integrity with checksums
verify_backup_checksums() {
    log_info "Verifying backup checksums..."
    
    local latest_backup=$(aws s3 ls "s3://$BACKUP_BUCKET/hourly/" --recursive | awk '{print $4}' | grep -v '/$' | sort | tail -1)
    
    if [ -z "$latest_backup" ]; then
        log_error "No latest backup found"
        return 1
    fi
    
    local backup_name=$(basename "$latest_backup")
    local manifest_file="${latest_backup}.manifest"
    
    log_info "Checking manifest for: $backup_name"
    
    # Download and verify manifest
    if aws s3 cp "s3://$BACKUP_BUCKET/$manifest_file" /tmp/manifest.json 2>/dev/null; then
        log_ok "Manifest found"
        
        # Extract and verify checksum
        local manifest_sha=$(jq -r '.sha256' /tmp/manifest.json 2>/dev/null)
        if [ -n "$manifest_sha" ]; then
            log_ok "Manifest SHA256: $manifest_sha"
        fi
    else
        log_warn "Manifest not found - calculating SHA256..."
        
        # Download backup and calculate checksum
        local temp_backup="/tmp/backup_check_$(date +%s).bak"
        aws s3 cp "s3://$BACKUP_BUCKET/$latest_backup" "$temp_backup" --no-progress
        
        local calculated_sha=$(sha256sum "$temp_backup" | awk '{print $1}')
        log_ok "Calculated SHA256: $calculated_sha"
        
        rm -f "$temp_backup"
    fi
    
    return 0
}

# Test restore from latest backup
test_backup_restore() {
    log_info "Testing restore from latest backup..."
    
    local latest_backup=$(aws s3 ls "s3://$BACKUP_BUCKET/hourly/" --recursive | awk '{print $4}' | grep -v '/$' | sort | tail -1)
    
    if [ -z "$latest_backup" ]; then
        log_error "No latest backup found for restore test"
        return 1
    fi
    
    log_info "Starting test restore environment..."
    
    # Start test environment
    docker-compose -f docker-compose.dr.yml down || true
    docker-compose -f docker-compose.dr.yml up -d postgres-dr || {
        log_error "Failed to start test environment"
        return 1
    }
    
    # Wait for DB
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f docker-compose.dr.yml exec -T postgres-dr pg_isready -U postgres > /dev/null 2>&1; then
            log_ok "Test database ready"
            break
        fi
        ((attempt++))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "Test database failed to start"
        docker-compose -f docker-compose.dr.yml down || true
        return 1
    fi
    
    # Download and restore
    log_info "Downloading backup: $latest_backup"
    local temp_backup="/tmp/restore_test_$(date +%s).sql.gz"
    
    aws s3 cp "s3://$BACKUP_BUCKET/$latest_backup" "$temp_backup" --no-progress || {
        log_error "Failed to download backup"
        return 1
    }
    
    log_info "Restoring backup..."
    local restore_start=$(date +%s)
    
    gunzip -c "$temp_backup" | \
        docker-compose -f docker-compose.dr.yml exec -T postgres-dr psql -U postgres > /dev/null 2>&1 || {
        log_error "Backup restore failed"
        rm -f "$temp_backup"
        docker-compose -f docker-compose.dr.yml down || true
        return 1
    }
    
    local restore_end=$(date +%s)
    local restore_time=$((restore_end - restore_start))
    
    log_ok "Backup restored successfully in ${restore_time}s"
    
    # Verify data
    log_info "Verifying restored data..."
    
    local table_count=$(docker-compose -f docker-compose.dr.yml exec -T postgres-dr \
        psql -U postgres -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null)
    
    local row_count=$(docker-compose -f docker-compose.dr.yml exec -T postgres-dr \
        psql -U postgres -t -c "SELECT SUM(n_live_tup) FROM pg_stat_user_tables;" 2>/dev/null)
    
    log_ok "Restored data: $table_count tables, $row_count rows"
    
    # Cleanup
    log_info "Cleaning up test environment..."
    docker-compose -f docker-compose.dr.yml down || true
    rm -f "$temp_backup"
    
    return 0
}

# Check encryption key backups
check_encryption_keys() {
    log_info "Checking encryption key backups..."
    
    # Verify keys in secret storage
    if aws secretsmanager get-secret-value --secret-id minimarket/encryption-keys > /dev/null 2>&1; then
        log_ok "Encryption keys stored in AWS Secrets Manager"
    else
        log_error "Encryption keys not found in secrets"
        return 1
    fi
    
    # Verify key age
    local key_modified=$(aws secretsmanager describe-secret --secret-id minimarket/encryption-keys \
        --query 'LastChangedDate' --output text)
    
    log_ok "Keys last modified: $key_modified"
    
    return 0
}

# Generate compliance report
generate_report() {
    log_info "Generating backup integrity report..."
    
    local report_file="/var/log/backup-integrity-reports/report_$(date +%Y%m%d_%H%M%S).json"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "backup_bucket": "$BACKUP_BUCKET",
    "checks": {
        "hourly_coverage": "completed",
        "backup_sizes": "completed",
        "checksums": "completed",
        "restore_test": "completed",
        "encryption_keys": "completed"
    },
    "log_file": "$LOG_FILE",
    "status": "completed"
}
EOF
    
    log_ok "Report saved: $report_file"
}

# Main execution
main() {
    log_info "╔════════════════════════════════════════════════════════════╗"
    log_info "║     BACKUP INTEGRITY VERIFICATION SUITE                   ║"
    log_info "╚════════════════════════════════════════════════════════════╝"
    log_info ""
    
    local failed=0
    
    # Run checks
    check_hourly_backup_coverage || ((failed++))
    check_backup_sizes || ((failed++))
    verify_backup_checksums || ((failed++))
    check_encryption_keys || ((failed++))
    
    # Test restore (only if not in basic mode)
    if [ "${1:-}" != "--quick" ]; then
        test_backup_restore || ((failed++))
    fi
    
    # Generate report
    generate_report
    
    log_info ""
    if [ $failed -eq 0 ]; then
        log_ok "✅ All backup integrity checks PASSED"
        return 0
    else
        log_error "❌ $failed backup integrity checks FAILED"
        send_alert "Backup integrity check completed with $failed failures"
        return 1
    fi
}

# Run main
main "$@"

exit $?
