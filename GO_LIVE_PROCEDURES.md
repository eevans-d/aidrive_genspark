# GO_LIVE_PROCEDURES.md

# Production Go-Live Procedures

**Version**: 1.0  
**Target Date**: October 21, 2025  
**Status**: Ready for Execution

---

## Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [Go-Live Schedule](#go-live-schedule)
3. [Deployment Strategy](#deployment-strategy)
4. [Team Assignments](#team-assignments)
5. [Health Monitoring](#health-monitoring)
6. [Rollback Decision Tree](#rollback-decision-tree)
7. [Post-Launch Activities](#post-launch-activities)

---

## Pre-Launch Checklist

### 72 Hours Before Go-Live

- [ ] **Security Audit**
  - [ ] API keys rotated and secured
  - [ ] SSL certificates valid and installed
  - [ ] Database credentials secured in vault
  - [ ] Redis auth enabled and strong password
  - [ ] Security headers configured
  - [ ] Rate limiting enabled
  - [ ] DDoS protection active

- [ ] **Infrastructure**
  - [ ] Production servers provisioned
  - [ ] Database backups verified (test restore)
  - [ ] Backup systems operational
  - [ ] Disaster recovery plan documented
  - [ ] Network connectivity tested
  - [ ] Firewall rules configured
  - [ ] Load balancer configured

- [ ] **Monitoring & Alerting**
  - [ ] Prometheus metrics configured
  - [ ] Grafana dashboards created and tested
  - [ ] Alert rules configured
  - [ ] Escalation contacts updated
  - [ ] Status page template prepared
  - [ ] Logging aggregation working
  - [ ] Log retention policies set

- [ ] **Documentation**
  - [ ] Runbooks reviewed and updated
  - [ ] Incident playbook shared with team
  - [ ] Deployment procedures documented
  - [ ] Rollback procedures tested
  - [ ] Team trained on procedures
  - [ ] Customer documentation ready

- [ ] **Stakeholder Sign-Off**
  - [ ] Product manager approval
  - [ ] VP Engineering approval
  - [ ] CTO approval
  - [ ] Infrastructure manager approval
  - [ ] Security team approval
  - [ ] Communications team ready

### 24 Hours Before Go-Live

- [ ] **Final Testing**
  - [ ] Smoke tests passed (prod-like environment)
  - [ ] Load test successful (≥ 1000 RPS)
  - [ ] Chaos test passed (all services recovered)
  - [ ] Database backup tested and verified
  - [ ] Rollback procedure tested on staging
  - [ ] Health checks operational

- [ ] **Configuration**
  - [ ] All environment variables set
  - [ ] API keys rotated
  - [ ] Database connections verified
  - [ ] Redis connectivity confirmed
  - [ ] Feature flags set appropriately
  - [ ] Rate limits configured
  - [ ] Monitoring thresholds set

- [ ] **Team Readiness**
  - [ ] All team members briefed
  - [ ] War room setup verified
  - [ ] On-call rotations confirmed
  - [ ] Communication channels tested
  - [ ] Escalation contacts verified
  - [ ] Incident commander designated

- [ ] **Customer Communication**
  - [ ] Maintenance window announced
  - [ ] Expected duration communicated
  - [ ] Rollback communication prepared
  - [ ] Customer support briefed
  - [ ] FAQ prepared and published
  - [ ] Known issues documented

### 1 Hour Before Go-Live

- [ ] **Final Verification**
  - [ ] All services healthy on staging
  - [ ] Backups current and verified
  - [ ] Team present and accounted for
  - [ ] War room active
  - [ ] Monitoring dashboards open
  - [ ] Communications team ready
  - [ ] No critical issues on staging
  - [ ] Database clean and optimized

- [ ] **Preparation**
  - [ ] Feature flags prepared
  - [ ] Feature flags tested
  - [ ] Gradual rollout strategy confirmed
  - [ ] Rollback commands ready
  - [ ] Team members at their stations
  - [ ] Phone lines open

---

## Go-Live Schedule

### Phase 1: Preparation (T-30 minutes)

**11:30 AM UTC**

- [ ] Incident Commander opens war room (Zoom)
- [ ] Team joins and does roll call
- [ ] Confirm all systems ready on staging
- [ ] Final backups initiated
- [ ] Monitoring dashboards opened
- [ ] Slack war room created and shared
- [ ] Status page template prepared

**Timeline**:
```
11:30 - War room opened
11:35 - All team members present
11:40 - Final verification complete
11:45 - Ready for deployment
11:55 - Team briefed on procedures
12:00 - DEPLOYMENT BEGINS
```

### Phase 2: Deployment (T+0 to T+30 min)

**12:00 PM UTC**

#### Step 1: Enable Maintenance Mode (5 min)
```bash
# Step 1: Set feature flag (feature_flag:maintenance_mode=true)
# This redirects users to maintenance page
curl -X POST http://prod.api.com/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "maintenance_mode", "enabled": true}'

# Step 2: Update status page
curl -X POST https://status.company.com/api/incidents \
  -H "Authorization: Bearer $STATUS_API_KEY" \
  -d '{"status": "MAINTENANCE", "message": "Upgrading to v2.0"}'

# Step 3: Log in Slack
echo "✅ Maintenance mode enabled at $(date)"
```

**Target**: 12:00 - 12:05 PM UTC

#### Step 2: Deploy New Code (10 min)
```bash
# Step 1: Pull latest code
cd /prod/aidrive-genspark
git fetch origin production
git checkout origin/production

# Step 2: Build containers
docker-compose -f docker-compose.production.yml build dashboard

# Step 3: Stop current service (blue/green)
docker-compose -f docker-compose.production.yml -f docker-compose.production.green.yml up -d

# Step 4: Verify health
sleep 30
curl -H "X-API-Key: $API_KEY" http://localhost:9001/health

# Step 5: Check metrics endpoint
curl -H "X-API-Key: $API_KEY" http://localhost:9001/metrics | head -20

# Step 6: Log success
echo "✅ New code deployed and verified at $(date)"
```

**Target**: 12:05 - 12:15 PM UTC

#### Step 3: Database Migrations (5 min)
```bash
# Step 1: Check migration status
docker exec prod-postgres psql -U inventory -d retail \
  -c "SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 5"

# Step 2: Run migrations (if needed)
docker exec prod-postgres psql -U inventory -d retail \
  -c "\i /docker-entrypoint-initdb.d/migrations.sql"

# Step 3: Verify schema
docker exec prod-postgres psql -U inventory -d retail \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"

# Step 4: Log success
echo "✅ Database migrations complete at $(date)"
```

**Target**: 12:15 - 12:20 PM UTC

#### Step 4: Health Check (5 min)
```bash
# Step 1: Check all services
docker-compose -f docker-compose.production.yml ps

# Step 2: Check API endpoints
curl -I http://prod.api.com/api/health
curl -I http://prod.api.com/api/metrics

# Step 3: Check database connectivity
curl -H "X-API-Key: $API_KEY" http://prod.api.com/api/inventory/stats

# Step 4: Check caching (Redis)
redis-cli -h prod-redis ping

# Step 5: Verify circuit breaker status
curl -H "X-API-Key: $API_KEY" http://prod.api.com/api/circuit-breaker/status

# Step 6: Log success
echo "✅ All health checks passed at $(date)"
```

**Target**: 12:20 - 12:25 PM UTC

### Phase 3: Gradual Rollout (T+30 to T+60 min)

**12:30 PM UTC - 1:00 PM UTC**

#### Canary: 5% of Traffic (12:30 PM)
```bash
# Enable feature flag: canary_5_percent=true
curl -X POST http://prod.api.com/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "canary_5_percent", "enabled": true, "percentage": 5}'

# Monitor metrics for 5 minutes
# Success Criteria:
# - Error rate < 1%
# - p95 latency < 500ms
# - No unusual logs

echo "⏱️  Monitoring 5% canary traffic from 12:30-12:35 PM"
```

**Monitoring Points**:
- Error rate: `dashboard_errors_total`
- Latency: `dashboard_request_duration_ms_p95`
- Throughput: `dashboard_requests_total`

**Go/No-Go Decision**: 12:35 PM
- **GO**: Proceed to 25% if metrics green
- **NO-GO**: Rollback immediately if issues detected

#### Canary: 25% of Traffic (12:40 PM)
```bash
# If 5% canary successful, increase to 25%
curl -X POST http://prod.api.com/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "canary_25_percent", "enabled": true, "percentage": 25}'

echo "⏱️  Monitoring 25% canary traffic from 12:40-12:45 PM"
```

**Go/No-Go Decision**: 12:45 PM

#### Full Rollout: 100% of Traffic (12:50 PM)
```bash
# If 25% canary successful, enable full rollout
curl -X POST http://prod.api.com/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "production_release", "enabled": true, "percentage": 100}'

# Disable maintenance mode
curl -X POST http://prod.api.com/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "maintenance_mode", "enabled": false}'

# Update status page
curl -X POST https://status.company.com/api/incidents \
  -H "Authorization: Bearer $STATUS_API_KEY" \
  -d '{"status": "OPERATIONAL", "message": "Upgrade complete"}'

echo "✅ Full rollout complete at $(date)"
```

### Phase 4: Monitoring (T+60 to T+180 min)

**1:00 PM - 3:00 PM UTC**

**Critical Monitoring Period**: 30 minutes after full rollout

```
1:00 PM - 1:30 PM (CRITICAL MONITORING)
- Check error rates every 2 minutes
- Monitor latency every 2 minutes
- Monitor CPU/memory every 5 minutes
- Watch logs for anomalies

1:30 PM - 2:00 PM (ENHANCED MONITORING)
- Check metrics every 5 minutes
- Monitor resources every 10 minutes
- Watch logs for warnings

2:00 PM - 3:00 PM (NORMAL MONITORING)
- Hourly checks
- Watch for delayed issues
```

**Escalation Criteria**:
- Error rate > 5% → Immediate escalation
- p95 latency > 1000ms → Escalation
- p99 latency > 2000ms → Escalation
- Memory usage > 90% → Escalation
- CPU usage > 85% sustained → Escalation

---

## Deployment Strategy

### Blue/Green Deployment

**Before Go-Live**:
```
Blue (Current):  v1.0 running on ports 9000
Green (New):     v2.0 running on ports 9001
Load Balancer:   Pointed at Blue
```

**During Go-Live**:
```
Step 1: Deploy Green with new code (doesn't affect users)
Step 2: Run all health checks on Green
Step 3: Switch load balancer Blue → Green
Step 4: Keep Blue running for quick rollback
Step 5: After 24 hours, remove Blue
```

**Rollback Path**:
```
If issues detected:
Step 1: Switch load balancer Green → Blue
Step 2: New code stops serving traffic
Step 3: v1.0 back online (30 seconds)
```

### Traffic Shaping with Feature Flags

```python
# Feature flag for gradual rollout
if feature_flag('canary_5_percent'):
    # Route 5% of traffic to new version
    if hash(user_id) % 100 < 5:
        use_new_version()
    else:
        use_current_version()

# For 25%:
if feature_flag('canary_25_percent'):
    if hash(user_id) % 100 < 25:
        use_new_version()

# For 100%:
if feature_flag('production_release'):
    use_new_version()  # All traffic
```

---

## Team Assignments

### War Room Roles

| Role | Name | Phone | Slack | Responsibility |
|------|------|-------|-------|-----------------|
| Incident Commander | TBD | +1-XXX-XXXX | @ic | Overall coordination |
| Technical Lead | TBD | +1-XXX-XXXX | @tech-lead | Deployment & troubleshooting |
| Database Admin | TBD | +1-XXX-XXXX | @dba | Database migration & verification |
| DevOps Engineer | TBD | +1-XXX-XXXX | @devops | Infrastructure & deployment |
| Monitoring Lead | TBD | +1-XXX-XXXX | @monitoring | Metrics & alerts |
| Communications | TBD | +1-XXX-XXXX | @comms | Customer & team updates |
| Product Manager | TBD | +1-XXX-XXXX | @product | Business context & decisions |

### Pre-Launch Responsibilities

**Technical Lead**:
- [ ] All pre-launch tests passed
- [ ] Code reviewed and tested on staging
- [ ] Rollback procedure verified
- [ ] Team briefing prepared

**Database Admin**:
- [ ] Migrations tested
- [ ] Backups verified
- [ ] Restore procedures tested
- [ ] Performance optimized

**DevOps Engineer**:
- [ ] Infrastructure ready
- [ ] Containers built and tested
- [ ] Monitoring configured
- [ ] Feature flags tested

**Communications**:
- [ ] Customer notification ready
- [ ] Status page prepared
- [ ] FAQ published
- [ ] Support team briefed

---

## Health Monitoring

### Real-Time Dashboard

During go-live, monitor these metrics every 2 minutes:

```
Dashboard URL: http://prod.monitoring.com/go-live
Metrics:
- Total requests/sec: ⬚ (target: 100-500)
- Error rate %: ⬚ (target: <1%)
- p95 latency ms: ⬚ (target: <500ms)
- p99 latency ms: ⬚ (target: <1000ms)
- Active DB connections: ⬚ (target: <100)
- Redis memory MB: ⬚ (target: <500MB)
- CPU usage %: ⬚ (target: <70%)
- Memory usage %: ⬚ (target: <80%)
```

### Critical Alerts

**Automatic Actions**:
- Error rate > 10% → Page on-call engineer
- p95 latency > 2000ms → Page technical lead
- Service down → Page incident commander
- Database connection failure → Page DBA

### Health Check Sequence

```bash
#!/bin/bash
# Run every 2 minutes during critical period

# 1. Application health
curl -f http://prod.api.com/api/health || alert "Health check failed"

# 2. API responsiveness
LATENCY=$(curl -o /dev/null -s -w '%{time_total}' http://prod.api.com/api/inventory/stats)
if (( $(echo "$LATENCY > 2" | bc -l) )); then
  alert "High latency detected: ${LATENCY}s"
fi

# 3. Database connectivity
curl -H "X-API-Key: $API_KEY" \
  http://prod.api.com/api/database-health || alert "Database health check failed"

# 4. Cache connectivity
curl -H "X-API-Key: $API_KEY" \
  http://prod.api.com/api/cache-health || alert "Cache health check failed"

# 5. Error rate check
ERRORS=$(curl -s -H "X-API-Key: $API_KEY" http://prod.api.com/metrics | \
  grep dashboard_errors_total | tail -1 | awk '{print $2}')
if (( ERRORS > 1000 )); then
  alert "High error rate detected: $ERRORS"
fi
```

---

## Rollback Decision Tree

### Level 1: Minor Issues (Don't Rollback)

**Symptoms**:
- Error rate 1-3%
- p95 latency 500-1000ms
- Isolated component failing
- Can be fixed with feature flag

**Action**:
- Disable problematic feature flag
- Monitor for resolution
- Create ticket for investigation
- Do NOT rollback

**Example**:
```bash
# If inventory service is slow
curl -X POST http://prod.api.com/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "inventory_v2", "enabled": false}'
# Falls back to inventory v1
```

### Level 2: Major Issues (Prepare Rollback)

**Symptoms**:
- Error rate 3-10%
- p95 latency > 1000ms
- Core functionality degraded
- Multiple components affected

**Action**:
- Engage incident commander
- Prepare rollback (don't execute yet)
- Try to fix with feature flags
- Monitor for 10 minutes
- Rollback if no improvement

**Rollback Command**:
```bash
# Execute if issue not resolved in 10 minutes
./scripts/rollback_to_v1.sh

# Verify rollback success
curl http://prod.api.com/api/health

# Monitor for stability
# Wait 5 minutes for all caches to clear
```

### Level 3: Critical Issues (Immediate Rollback)

**Symptoms**:
- Error rate > 10%
- Service completely down
- Data corruption detected
- Security issue detected

**Action**:
- Incident commander declares emergency
- Execute rollback immediately
- Page all team members
- Begin root cause analysis

**Rollback Procedure**:
```bash
# EMERGENCY ROLLBACK
# This takes about 60-90 seconds

# 1. Switch load balancer immediately
./scripts/emergency_failover_blue.sh

# 2. Verify old version is running
curl -v http://prod.api.com/api/health

# 3. Monitor for stability (5 minutes)
./scripts/monitor_stability.sh

# 4. If stable, begin post-incident review
# If not stable, escalate to CTO immediately
```

---

## Post-Launch Activities

### First 24 Hours

- [ ] Monitor metrics every 1 hour
- [ ] Check logs for anomalies
- [ ] Verify database integrity
- [ ] Check backup status
- [ ] Monitor customer reports
- [ ] Log all issues in JIRA
- [ ] Team available for escalation

### First Week

- [ ] Daily status review
- [ ] Weekly performance report
- [ ] Customer feedback review
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Team retrospective (Day 3)

### Milestone: 48 Hours Post-Launch

- [ ] Incident commander signs off on stability
- [ ] All critical issues resolved
- [ ] Performance baseline confirmed
- [ ] Team rotated to normal schedule
- [ ] War room deactivated

### Milestone: 1 Week Post-Launch

- [ ] Team retrospective held
- [ ] Root causes documented
- [ ] Runbooks updated
- [ ] Alerts tuned
- [ ] Lessons learned shared
- [ ] Next optimization sprint planned

---

## Emergency Contacts

```
Incident Commander: <Phone> <Email> <Slack>
CTO: <Phone> <Email> <Slack>
VP Engineering: <Phone> <Email> <Slack>

War Room Zoom: https://zoom.us/j/XXXXXXXXX
Slack Channel: #go-live-war-room
Status Page: https://status.company.com

Emergency Escalation: +1-XXX-EMERGENCY
```

---

**Document Version**: 1.0  
**Created**: October 19, 2025  
**Status**: ✅ Ready for Production Go-Live  
**Target Launch**: October 21, 2025
