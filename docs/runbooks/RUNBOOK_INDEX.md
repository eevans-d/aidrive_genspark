# Operational Runbooks - Index

**Sistema:** Inventario Retail Multi-Agente  
**Última actualización:** October 18, 2025  
**Owner:** Operations Team

---

## 📚 Available Runbooks

### 🔴 Critical Alerts
1. [**High Error Rate (>0.5%)**](RUNBOOK_01_HIGH_ERROR_RATE.md) - RTO: 30 min
2. [**High Latency (P95 >500ms)**](RUNBOOK_02_HIGH_LATENCY.md) - RTO: 20 min
3. [**Service Down**](RUNBOOK_03_SERVICE_DOWN.md) - RTO: 15 min

### 🟠 High Priority Alerts
4. [**Database Connection Pool Exhausted**](RUNBOOK_04_DB_POOL_EXHAUSTED.md) - RTO: 20 min
5. [**Redis Memory Full**](RUNBOOK_05_REDIS_MEMORY_FULL.md) - RTO: 15 min
6. [**Disk Space Critical (>90%)**](RUNBOOK_06_DISK_SPACE_CRITICAL.md) - RTO: 30 min

### 🟡 Medium Priority
7. [**SSL Certificate Expiring (<30 days)**](RUNBOOK_07_SSL_EXPIRING.md) - RTO: 7 days
8. [**Backup Failure**](RUNBOOK_08_BACKUP_FAILURE.md) - RTO: 2 hours

### 📋 Operational Procedures
9. [**Deployment Rollback**](RUNBOOK_09_DEPLOYMENT_ROLLBACK.md) - RTO: 10 min
10. [**Data Corruption Detected**](RUNBOOK_10_DATA_CORRUPTION.md) - RTO: 2 hours
11. [**DDoS Attack Suspected**](RUNBOOK_11_DDOS_ATTACK.md) - RTO: 15 min

---

## 🎯 Quick Reference

### Alert → Runbook Mapping

| Prometheus Alert | Severity | Runbook | Page |
|------------------|----------|---------|------|
| `ErrorRateHigh` | CRITICAL | RUNBOOK_01 | On-call +immediate |
| `LatencyHigh` | WARNING | RUNBOOK_02 | On-call +15min |
| `InstanceDown` | CRITICAL | RUNBOOK_03 | On-call +immediate |
| `DBPoolExhausted` | WARNING | RUNBOOK_04 | On-call +15min |
| `RedisMemoryHigh` | WARNING | RUNBOOK_05 | On-call +20min |
| `DiskSpaceCritical` | CRITICAL | RUNBOOK_06 | On-call +immediate |
| `SSLCertExpiring` | WARNING | RUNBOOK_07 | Email, no page |
| `BackupFailed` | WARNING | RUNBOOK_08 | Email, business hours |

### RTO (Recovery Time Objective) Summary

- **Tier 1 (15 min):** Service Down, Redis Memory, DDoS
- **Tier 2 (20-30 min):** Error Rate, Latency, DB Pool, Disk Space
- **Tier 3 (2 hours+):** Backup Failure, Data Corruption
- **Tier 4 (7 days):** SSL expiration

---

## 📖 How to Use These Runbooks

### During an Incident

1. **Identify** the alert in Grafana/AlertManager
2. **Open** corresponding runbook from this index
3. **Follow** the steps in order (Síntomas → Diagnóstico → Resolución)
4. **Document** actions taken in incident ticket
5. **Escalate** if not resolved within RTO
6. **Post-mortem** after resolution

### Key Sections in Each Runbook

- **Síntomas:** What you're seeing (alerts, logs, user reports)
- **Diagnóstico:** How to identify root cause
- **Resolución:** Step-by-step fix procedures
- **Escalation:** When and who to contact
- **Post-Incident:** Verification and documentation

### Best Practices

✅ **DO:**
- Read entire runbook before starting
- Document each step taken
- Check monitoring after each action
- Update runbook if steps outdated

❌ **DON'T:**
- Skip diagnostic steps
- Make changes without documenting
- Assume issue is fixed without verification
- Close incident before post-mortem

---

## 🔗 Related Documentation

- [Troubleshooting Guide](../TROUBLESHOOTING_GUIDE.md) - Common issues & quick fixes
- [Deployment Guide](../../inventario-retail/DEPLOYMENT_GUIDE.md) - Deployment procedures
- [Monitoring Documentation](../../DOCUMENTACION_OBSERVABILIDAD.md) - Grafana dashboards
- [DR Drills Report](../../DR_DRILLS_REPORT.md) - Disaster recovery procedures

---

## 📞 Escalation Contacts

### On-Call Rotation
- **Primary:** Check PagerDuty schedule
- **Secondary:** Check PagerDuty schedule
- **Manager:** [Contact info in PagerDuty]

### Specialized Contacts
- **Database Issues:** DBA Team (escalate after 30 min)
- **Network Issues:** Infrastructure Team (escalate after 20 min)
- **Security Issues:** Security Team (escalate immediately)
- **Application Bugs:** Development Team (escalate after diagnostics complete)

### External Vendors
- **OpenAI API:** [status.openai.com](https://status.openai.com)
- **Cloud Provider:** Support portal (SLA: 1 hour response)
- **Database Hosting:** Support email (SLA: 2 hours response)

---

## 🔄 Runbook Maintenance

### Review Schedule
- **Monthly:** Validate all runbooks still accurate
- **Post-Incident:** Update runbook if steps changed
- **Quarterly:** Full audit of all procedures

### Update Process
1. Create branch: `docs/update-runbook-XX`
2. Make changes to runbook
3. Test changes in staging
4. Create PR with review from ops team
5. Merge and announce in team channel

### Version History
- **v1.0** (2025-10-18): Initial creation (11 runbooks)
- **v1.1** (TBD): Updates post first real incident

---

*Mantenido por: Operations Team*  
*Última revisión: October 18, 2025*
