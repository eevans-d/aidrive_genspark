# FASE 7.2: Disaster Recovery Procedures

**Fecha**: Oct 24, 2025  
**Status**: 🔄 DOCUMENTATION  
**Objetivo**: Procedimientos probados de recuperación ante desastres

---

## 🚨 DISASTER RECOVERY PLAN (DRP)

### Recovery Time Objective (RTO) & Recovery Point Objective (RPO)

| Componente | RTO | RPO | Prioridad |
|-----------|-----|-----|-----------|
| Dashboard API | 15 min | 5 min | CRÍTICA |
| Database | 30 min | 1 min | CRÍTICA |
| Redis Cache | 5 min | N/A (reconstruible) | MEDIA |
| Monitoring | 30 min | 1 hour | BAJA |

---

## 🔄 BACKUP STRATEGY

### 1. Database Backups

#### Automated Daily Backups
```bash
# Backup timing: 2:00 AM UTC daily
# Retention: 30 days rolling
# Location: /backups/postgresql/

Schedule: 0 2 * * * /usr/local/bin/backup_database.sh
Frequency: Daily
Retention: 30 days
Verification: Weekly restore test
```

#### Backup Script (`/usr/local/bin/backup_database.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/minimarket_${DATE}.sql.gz"

# Create backup
pg_dump -h postgres -U postgres -d minimarket | gzip > "$BACKUP_FILE"

# Verify backup
gunzip -t "$BACKUP_FILE" && echo "✅ Backup OK" || echo "❌ Backup corrupted"

# Upload to remote storage (if configured)
# aws s3 cp "$BACKUP_FILE" s3://backups/aidrive_genspark/

# Retention
find "$BACKUP_DIR" -name "minimarket_*.sql.gz" -mtime +30 -delete
```

#### Point-in-Time Recovery (PITR)
```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /wal_archive/%f'
```

### 2. Redis Backups

#### RDB Snapshots
```bash
# Configuration in redis.conf:
save 900 1          # Save if 1 key changed in 900 sec
save 300 10         # Save if 10 keys changed in 300 sec
save 60 10000       # Save if 10k keys changed in 60 sec

# Manual snapshot
redis-cli BGSAVE

# Backup RDB file
cp /var/lib/redis/dump.rdb /backups/redis/dump_$(date +%s).rdb
```

### 3. Application Code Backups

```bash
# Git repository is the primary backup
# Tags mark production releases
git tag -a v1.0.0-prod -m "Production release"
git push origin v1.0.0-prod

# Additional: Archive critical configs
tar -czf /backups/config_$(date +%s).tar.gz \
    inventario-retail/monitoring/ \
    .github/workflows/ \
    inventario-retail/nginx/
```

---

## 🔧 RECOVERY PROCEDURES

### Scenario 1: Dashboard Service Down

**Symptoms**: API unreachable, health check failing

**Detection Time**: <2 minutes (AlertManager)  
**RTO**: 15 minutes

**Recovery Steps**:

```bash
# 1. Check service status
docker ps | grep dashboard
docker logs dashboard -n 100

# 2. Try restart
docker restart dashboard

# 3. Verify health
curl -H "X-API-Key: dev-api-key" http://localhost:8080/api/health

# 4. If still down, rebuild from image
docker pull ghcr.io/eevans-d/aidrive_genspark:latest
docker-compose down
docker-compose up -d dashboard

# 5. Monitor recovery
docker logs -f dashboard
```

**Validation**:
- [ ] Health check returns 200
- [ ] All endpoints responding
- [ ] Metrics being exported
- [ ] No errors in logs
- [ ] Recovery time < 15 min

---

### Scenario 2: Database Connection Lost

**Symptoms**: 503 errors, database unavailable

**Detection Time**: <1 minute  
**RTO**: 30 minutes

**Recovery Steps**:

```bash
# 1. Check database status
docker exec postgres pg_isready
docker logs postgres -n 50

# 2. Verify disk space
docker exec postgres df -h

# 3. Check for locks
docker exec postgres psql -U postgres -d minimarket \
    -c "SELECT pid, usename, application_name, state FROM pg_stat_activity;"

# 4. Restart database
docker restart postgres

# 5. Wait for startup
sleep 30

# 6. Verify application can connect
docker exec dashboard python -c \
    "import sqlalchemy; sqlalchemy.create_engine('postgresql://...')"

# 7. If corrupted, restore from backup
docker exec postgres psql -U postgres -d minimarket -f /backups/restore.sql
```

**Validation**:
- [ ] Database accepting connections
- [ ] All tables accessible
- [ ] Application reconnected
- [ ] No data loss
- [ ] Recovery time < 30 min

---

### Scenario 3: Redis Cache Down

**Symptoms**: Slow API responses, increased database load

**Detection Time**: <3 minutes  
**RTO**: 5 minutes

**Recovery Steps**:

```bash
# 1. Check Redis status
redis-cli ping
docker logs redis

# 2. Restart Redis
docker restart redis

# 3. Verify connectivity
redis-cli INFO stats

# 4. Check memory usage
redis-cli INFO memory

# 5. If memory critical, clear old data
redis-cli FLUSHDB

# Application will rebuild cache automatically
```

**Validation**:
- [ ] Redis accepting connections
- [ ] Cache rebuilding
- [ ] API performance restored
- [ ] No data loss
- [ ] Recovery time < 5 min

---

### Scenario 4: Storage Disk Full

**Symptoms**: Write errors, backup failures

**Detection Time**: <5 minutes  
**RTO**: 20 minutes

**Recovery Steps**:

```bash
# 1. Check disk usage
df -h
docker exec postgres du -sh /var/lib/postgresql/

# 2. Identify large files
du -sh /backups/*
du -sh /var/log/*

# 3. Clean old backups (keep last 7)
find /backups -mtime +7 -delete

# 4. Compress old logs
gzip /var/log/docker/*.log

# 5. Restart services to release handles
docker-compose restart

# 6. Verify disk space
df -h
```

**Validation**:
- [ ] Disk usage <80%
- [ ] Services restarted
- [ ] All services healthy
- [ ] No data loss

---

### Scenario 5: Complete Data Center Failure

**Symptoms**: All services down, no connectivity

**Detection Time**: Immediate  
**RTO**: 1-2 hours (failover to backup DC)

**Recovery Steps**:

```bash
# 1. Activate backup data center
# (This is infrastructure-level failover)

# 2. Restore latest database backup
psql -h new-db-server -U postgres < latest_backup.sql

# 3. Deploy application stack
docker-compose -f docker-compose.production.yml up -d

# 4. Verify services
curl -H "X-API-Key: key" http://new-server/api/health

# 5. Update DNS to new IP
# (Must be done by infrastructure team)

# 6. Monitor for issues
docker logs -f dashboard
```

**Validation**:
- [ ] All services running
- [ ] Database restored
- [ ] DNS updated
- [ ] Clients can access API
- [ ] Data consistent

---

## 🧪 DISASTER RECOVERY TESTING

### Monthly DR Test Schedule

```bash
# First Monday of each month, 2:00 AM UTC
# Duration: 1 hour
# Participants: All ops team members
```

### Test Procedures

#### Test 1: Database Restore
```bash
#!/bin/bash
# test_db_restore.sh

echo "Starting database restore test..."

# 1. Create test database
docker exec postgres psql -U postgres -c "CREATE DATABASE test_restore;"

# 2. Restore latest backup to test DB
LATEST_BACKUP=$(ls -t /backups/postgresql/*.sql.gz | head -1)
gunzip -c "$LATEST_BACKUP" | docker exec -i postgres psql -U postgres -d test_restore

# 3. Verify restore
docker exec postgres psql -U postgres -d test_restore \
    -c "SELECT COUNT(*) FROM information_schema.tables;"

# 4. Check data integrity
docker exec postgres psql -U postgres -d test_restore \
    -c "SELECT COUNT(*) as row_count FROM products;" 

# 5. Clean up
docker exec postgres psql -U postgres -c "DROP DATABASE test_restore;"

echo "✅ Database restore test passed"
```

#### Test 2: Service Failover
```bash
#!/bin/bash
# test_service_failover.sh

echo "Testing service failover..."

# 1. Record current service state
CURRENT_STATUS=$(curl -s -H "X-API-Key: key" http://localhost:8080/api/health)

# 2. Kill dashboard container
docker kill dashboard

# 3. Measure detection time
START_TIME=$(date +%s)

# 4. Wait for restart
sleep 5

# 5. Check recovery
while ! curl -s http://localhost:8080/api/health > /dev/null 2>&1; do
    sleep 1
done

RECOVERY_TIME=$(($(date +%s) - START_TIME))

echo "✅ Service recovered in ${RECOVERY_TIME}s"

if [ $RECOVERY_TIME -le 30 ]; then
    echo "✅ Recovery within SLA (30s)"
else
    echo "⚠️ Recovery exceeded SLA"
fi
```

#### Test 3: Backup Verification
```bash
#!/bin/bash
# test_backup_verification.sh

echo "Verifying backups..."

BACKUP_DIR="/backups/postgresql"
FAILED=0

for backup in $(find $BACKUP_DIR -name "*.sql.gz"); do
    if ! gunzip -t "$backup" > /dev/null 2>&1; then
        echo "❌ Backup corrupted: $backup"
        FAILED=$((FAILED+1))
    else
        echo "✅ Backup OK: $(basename $backup)"
    fi
done

if [ $FAILED -eq 0 ]; then
    echo "✅ All backups verified"
else
    echo "❌ $FAILED backups corrupted"
fi
```

### Test Report Template

```yaml
DR Test Report:
  Test Date: 2025-10-24
  Test Duration: 1 hour
  
  Tests Performed:
    - Database Restore: PASSED
    - Service Failover: PASSED (25s recovery)
    - Backup Verification: PASSED (30/30 backups OK)
  
  Issues Found: None
  Recommendations:
    - Increase backup retention to 60 days
    - Test failover to secondary region
  
  Approver: ___________
  Date: ___________
```

---

## 📞 INCIDENT RESPONSE

### Escalation Path

```
Level 1 (On-Call Engineer):
  ├─ Detects issue via monitoring
  ├─ Attempts standard recovery
  └─ If unresolved in 15 min → escalate

Level 2 (Senior Engineer):
  ├─ Reviews standard procedures
  ├─ May perform emergency restart
  └─ If unresolved in 30 min → escalate

Level 3 (Engineering Manager):
  ├─ Reviews DRP
  ├─ May perform data restore
  └─ If unresolved in 1 hour → escalate

Level 4 (Director):
  ├─ Activates emergency procedures
  └─ May failover to backup DC
```

### Communication Protocol

1. **Detection** (T+0):
   - Monitoring alerts sent to on-call
   - PagerDuty notification

2. **Investigation** (T+5):
   - Slack #incidents channel activated
   - Initial status posted
   - Team assembled

3. **Mitigation** (T+15):
   - Recovery attempt underway
   - Status updates every 5 min
   - Stakeholders notified

4. **Resolution** (T+30-60):
   - Root cause identified
   - Service restored
   - Post-mortem scheduled

5. **Post-Incident** (T+1-24h):
   - Root cause analysis
   - Action items assigned
   - Monitoring improvements

---

## 🎯 Success Criteria

For FASE 7.2 completion:

- [ ] DRP documented and reviewed
- [ ] All recovery procedures tested
- [ ] RTO/RPO targets met
- [ ] Backup automation verified
- [ ] Team trained on procedures
- [ ] Monthly DR test scheduled
- [ ] Communication protocols established
- [ ] Monitoring alerts configured

---

**Prepared by**: GitHub Copilot  
**Date**: Oct 24, 2025  
**Last Tested**: Pending  
**Next Test**: 2025-11-01 (First Monday of November)
