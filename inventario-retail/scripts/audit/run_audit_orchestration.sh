#!/bin/bash
# Audit Trail Orchestration Script
# Ejecuta análisis de auditoría y genera reportes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="${SCRIPT_DIR}/../../audit_reports"
ALERTS_DIR="${SCRIPT_DIR}/../../audit_alerts"
LOG_FILE="${REPORTS_DIR}/audit_orchestration_$(date +%Y%m%d_%H%M%S).log"

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-minimarket}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Create directories
mkdir -p "$REPORTS_DIR" "$ALERTS_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
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

# Print header
print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         AUDIT TRAIL ORCHESTRATION SYSTEM v1.0              ║"
    echo "║  Mini Market Dashboard - Security & Compliance Monitoring  ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verify database connectivity
verify_db_connection() {
    log "Verifying database connectivity..."
    
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        log_success "Database connection verified"
        return 0
    else
        log_error "Cannot connect to database"
        return 1
    fi
}

# Check if required tables exist
check_audit_tables() {
    log "Checking audit tables..."
    
    if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt audit_log" | grep -q "audit_log"; then
        log_success "Audit tables exist"
        
        # Count events
        COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM audit_log;")
        log "  Total audit events in database: $COUNT"
        return 0
    else
        log_error "Audit tables not found. Run database migrations first."
        return 1
    fi
}

# Generate summary statistics
generate_summary() {
    log "Generating summary statistics..."
    
    SUMMARY_FILE="$REPORTS_DIR/summary_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$SUMMARY_FILE" << 'EOF'
═══════════════════════════════════════════════════════════════
AUDIT SUMMARY STATISTICS
═══════════════════════════════════════════════════════════════
EOF
    
    {
        echo ""
        echo "Generated: $(date)"
        echo ""
        
        echo "📊 OVERALL STATISTICS"
        echo "─────────────────────"
        PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQLEOF'
        SELECT 
            'Total Events' as metric,
            COUNT(*) as value
        FROM audit_log
        UNION ALL
        SELECT 'Last 24h Events', COUNT(*) FROM audit_log WHERE event_timestamp > NOW() - INTERVAL '24 hours'
        UNION ALL
        SELECT 'Failed Events', COUNT(*) FROM audit_log WHERE status = 'FAILED'
        UNION ALL
        SELECT 'Unique Users', COUNT(DISTINCT user_id) FROM audit_log
        UNION ALL
        SELECT 'Unique IPs', COUNT(DISTINCT ip_address) FROM audit_log;
SQLEOF
        
        echo ""
        echo "🔝 TOP 5 EVENT TYPES"
        echo "────────────────────"
        PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQLEOF'
        SELECT 
            event_type,
            COUNT(*) as count
        FROM audit_log
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 5;
SQLEOF
        
        echo ""
        echo "👥 TOP 5 ACTIVE USERS"
        echo "─────────────────────"
        PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQLEOF'
        SELECT 
            user_id,
            COUNT(*) as activity_count
        FROM audit_log
        GROUP BY user_id
        ORDER BY activity_count DESC
        LIMIT 5;
SQLEOF
        
    } >> "$SUMMARY_FILE"
    
    log_success "Summary saved to: $SUMMARY_FILE"
}

# Generate JSON report
generate_json_report() {
    local period=$1
    log "Generating JSON report (period: $period)..."
    
    if command -v python3 &> /dev/null; then
        export DATABASE_URL="$DATABASE_URL"
        python3 "$SCRIPT_DIR/generate_audit_report.py" \
            --period "$period" \
            --format json \
            --output "audit_report_${period}.json"
        log_success "JSON report generated"
    else
        log_warning "Python3 not found, skipping JSON report"
    fi
}

# Generate HTML report
generate_html_report() {
    local period=$1
    log "Generating HTML report (period: $period)..."
    
    if command -v python3 &> /dev/null; then
        export DATABASE_URL="$DATABASE_URL"
        python3 "$SCRIPT_DIR/generate_audit_report.py" \
            --period "$period" \
            --format html \
            --output "audit_report_${period}.html"
        log_success "HTML report generated"
    else
        log_warning "Python3 not found, skipping HTML report"
    fi
}

# Run anomaly detection
run_anomaly_detection() {
    local sensitivity=$1
    log "Running anomaly detection (sensitivity: $sensitivity)..."
    
    if command -v python3 &> /dev/null; then
        export DATABASE_URL="$DATABASE_URL"
        python3 "$SCRIPT_DIR/detect_anomalies.py" \
            --sensitivity "$sensitivity" \
            --output "anomalies_${sensitivity}.json"
        log_success "Anomaly detection completed"
    else
        log_warning "Python3 not found, skipping anomaly detection"
    fi
}

# Generate security alerts for Grafana
generate_grafana_alerts() {
    log "Generating Grafana alert rules..."
    
    ALERTS_FILE="$ALERTS_DIR/grafana_alerts_$(date +%Y%m%d_%H%M%S).yml"
    
    cat > "$ALERTS_FILE" << 'EOF'
# Grafana Alert Rules for Audit Trail
# Automatically generated - do not edit manually

groups:
  - name: audit_trail_alerts
    folder: Security
    interval: 5m
    rules:
      - uid: audit_001
        title: High Failed Authentication Attempts
        condition: A
        data:
          - refId: A
            queryType: logs
            expression: "{job=\"audit_logs\"} | json | status=\"FAILED\" | status_code=~\"401|403\""
        noDataState: NoData
        execErrState: Alerting
        for: 5m
        annotations:
          runbook_url: "https://wiki.internal/runbook/failed_auth"
          description: "Multiple failed authentication attempts detected"
        labels:
          severity: warning
          category: security

      - uid: audit_002
        title: Sensitive Data Exfiltration Risk
        condition: A
        data:
          - refId: A
            queryType: metrics
            expression: rate(audit_sensitive_data_read[5m])
        noDataState: NoData
        execErrState: Alerting
        for: 10m
        annotations:
          description: "Unusual amount of sensitive data read in short time"
        labels:
          severity: critical
          category: data_protection

      - uid: audit_003
        title: Encryption Operation Failures
        condition: A
        data:
          - refId: A
            queryType: logs
            expression: "{job=\"audit_logs\"} | json | event_type=\"ENCRYPTION_FAILURE\""
        noDataState: NoData
        execErrState: Alerting
        for: 1m
        annotations:
          description: "Encryption operation failed"
        labels:
          severity: critical
          category: encryption

      - uid: audit_004
        title: Off-Hours Access to Sensitive Data
        condition: A
        data:
          - refId: A
            queryType: logs
            expression: "{job=\"audit_logs\"} | json | hour<9 or hour>17 | sensitive=true"
        noDataState: NoData
        execErrState: Alerting
        for: 15m
        annotations:
          description: "Sensitive data accessed outside business hours"
        labels:
          severity: medium
          category: access_control
EOF
    
    log_success "Grafana alerts generated: $ALERTS_FILE"
}

# Generate email report
generate_email_report() {
    log "Preparing email report..."
    
    EMAIL_FILE="$REPORTS_DIR/email_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$EMAIL_FILE" << EOF
Subject: Daily Audit Trail Report - $(date +%Y-%m-%d)

To: security-team@minimarket.local

═══════════════════════════════════════════════════════════════
DAILY AUDIT TRAIL REPORT
Generated: $(date)
═══════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────
EOF
    
    # Add statistics
    {
        echo "Period: Last 24 hours"
        echo ""
        
        TOTAL_EVENTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM audit_log WHERE event_timestamp > NOW() - INTERVAL '24 hours';")
        FAILED_EVENTS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM audit_log WHERE status = 'FAILED' AND event_timestamp > NOW() - INTERVAL '24 hours';")
        UNIQUE_USERS=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(DISTINCT user_id) FROM audit_log WHERE event_timestamp > NOW() - INTERVAL '24 hours';")
        
        echo "Total Events: $TOTAL_EVENTS"
        echo "Failed Events: $FAILED_EVENTS"
        echo "Unique Users: $UNIQUE_USERS"
        echo ""
        
        echo "RECOMMENDATIONS"
        echo "───────────────"
        if [ "$FAILED_EVENTS" -gt 10 ]; then
            echo "⚠️  High number of failed authentication attempts detected"
        fi
        
        echo ""
        echo "Report Details:"
        echo "• Full JSON report: $REPORTS_DIR/audit_report_24h.json"
        echo "• Full HTML report: $REPORTS_DIR/audit_report_24h.html"
        echo ""
        
        echo "Regards,"
        echo "Security & Audit Team"
        
    } >> "$EMAIL_FILE"
    
    log_success "Email report prepared: $EMAIL_FILE"
}

# Cleanup old reports (keep last 30 days)
cleanup_old_reports() {
    log "Cleaning up reports older than 30 days..."
    
    find "$REPORTS_DIR" -type f -mtime +30 -delete
    find "$ALERTS_DIR" -type f -mtime +30 -delete
    
    log_success "Cleanup completed"
}

# Main execution
main() {
    print_header
    
    log "Starting audit trail orchestration..."
    log "Database: $DB_HOST:$DB_PORT/$DB_NAME"
    log ""
    
    # Verify prerequisites
    if ! verify_db_connection; then
        log_error "Cannot proceed without database connection"
        exit 1
    fi
    
    if ! check_audit_tables; then
        log_error "Cannot proceed without audit tables"
        exit 1
    fi
    
    log ""
    log "🚀 EXECUTION PHASE"
    log "═════════════════"
    
    # Generate reports
    generate_summary
    generate_json_report "24h"
    generate_html_report "24h"
    
    # Run anomaly detection
    run_anomaly_detection "medium"
    
    # Generate alerts
    generate_grafana_alerts
    
    # Generate email report
    generate_email_report
    
    # Cleanup
    cleanup_old_reports
    
    log ""
    log_success "╔═══════════════════════════════════════════════════════╗"
    log "║  AUDIT TRAIL ORCHESTRATION COMPLETED SUCCESSFULLY  ║"
    log_success "╚═══════════════════════════════════════════════════════╝"
    
    log ""
    log "📁 Output Files:"
    log "  • Reports: $REPORTS_DIR"
    log "  • Alerts: $ALERTS_DIR"
    log "  • Logs: $LOG_FILE"
    
    log ""
    log "📧 Next Steps:"
    log "  1. Review HTML report in browser"
    log "  2. Check for any CRITICAL anomalies"
    log "  3. Forward email report to security team"
    log "  4. Update Grafana dashboards with new data"
}

# Parse arguments
case "${1:-run}" in
    run)
        main
        ;;
    summary)
        verify_db_connection && check_audit_tables && generate_summary
        ;;
    report:json)
        verify_db_connection && check_audit_tables && generate_json_report "24h"
        ;;
    report:html)
        verify_db_connection && check_audit_tables && generate_html_report "24h"
        ;;
    anomalies)
        verify_db_connection && check_audit_tables && run_anomaly_detection "medium"
        ;;
    alerts)
        generate_grafana_alerts
        ;;
    cleanup)
        cleanup_old_reports
        ;;
    *)
        echo "Usage: $0 {run|summary|report:json|report:html|anomalies|alerts|cleanup}"
        exit 1
        ;;
esac
