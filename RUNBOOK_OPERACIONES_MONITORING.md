# Runbook de Operaciones: Monitoring & Alerting

**Versión**: 1.0  
**Fecha**: Oct 24, 2025  
**Estado**: ✅ Production Ready (FASE 6)  
**Última Actualización**: Oct 24, 2025

---

## 📋 Tabla de Contenidos

1. [Quick Start](#quick-start)
2. [Stack de Monitoreo](#stack-de-monitoreo)
3. [Acceso & Dashboards](#acceso--dashboards)
4. [Alertas Implementadas](#alertas-implementadas)
5. [Troubleshooting](#troubleshooting)
6. [Procedimientos Operacionales](#procedimientos-operacionales)
7. [Escalación](#escalación)

---

## Quick Start

### Iniciar Stack de Monitoreo

```bash
# Staging
docker-compose -f docker-compose.staging.yml -f docker-compose.monitoring.yml up -d

# Producción
docker-compose -f inventario-retail/docker-compose.production.yml -f docker-compose.monitoring.yml up -d
```

### URLs de Acceso

| Componente | URL | Credenciales |
|-----------|-----|--------------|
| **Grafana** | http://localhost:3000 | admin/admin |
| **Prometheus** | http://localhost:9090 | - |
| **AlertManager** | http://localhost:9093 | - |

### Health Check Rápido

```bash
# Verificar que los servicios estén corriendo
docker ps | grep -E "prometheus|grafana|alertmanager"

# Verificar connectivity
curl -s http://localhost:9090/-/healthy
curl -s http://localhost:3000/api/health
curl -s http://localhost:9093/-/healthy
```

---

## Stack de Monitoreo

### Componentes Implementados

#### 1. **Prometheus (9090)**
- **Propósito**: Time-series database para métricas
- **Almacenamiento**: 15 días por defecto
- **Config**: `inventario-retail/monitoring/prometheus.yml`
- **Scrape Interval**: 15 segundos
- **Evaluation Interval**: 15 segundos

#### 2. **Grafana (3000)**
- **Propósito**: Visualización de métricas y alertas
- **Dashboards Incluidos**:
  - Forensic Analysis (queries, anomalies, health scores)
  - System Health (CPU, Memory, Disk, Network)
- **Data Source**: Prometheus (auto-configured)
- **Alerting**: Integrado con AlertManager

#### 3. **AlertManager (9093)**
- **Propósito**: Gestión y agrupación de alertas
- **Integraciones**: Email, Slack, PagerDuty (configurables)
- **Config**: `inventario-retail/monitoring/alertmanager.yml`

#### 4. **Node Exporter (9100)**
- **Propósito**: Métricas del host (CPU, memoria, disco)
- **Métricas Expuestas**: 100+ métricas de sistema

---

## Acceso & Dashboards

### Grafana - Login Inicial

```
URL: http://localhost:3000
Usuario: admin
Contraseña: admin

⚠️ IMPORTANTE: Cambiar contraseña en primera sesión
```

### Dashboards Disponibles

#### Dashboard 1: Forensic Analysis
**Ubicación**: Dashboards > Forensic > Analysis

**Paneles**:
- Total Analyses (gauge)
- Success Rate (%)
- Average Execution Time (ms)
- Analyses by Status (pie chart)
- Top Anomalies (table)
- Health Score Trend (line)
- Phase Duration Distribution (bar)

**Refresh**: Auto (10s)
**Time Range**: Last 1 hour (ajustable)

#### Dashboard 2: System Health
**Ubicación**: Dashboards > System > Health

**Paneles**:
- CPU Usage (%)
- Memory Usage (%)
- Disk I/O (IOPS)
- Network Traffic (Mbps)
- Process Count
- File Descriptors

**Refresh**: Auto (30s)
**Time Range**: Last 6 hours

### Crear Dashboard Personalizado

```
1. Home > New > Dashboard
2. Add Panel > Prometheus
3. Escribir query (ej: forensic_analyses_total)
4. Configurar opciones visualización
5. Save Dashboard
```

---

## Alertas Implementadas

### Categorías de Alertas

#### 1. **Dashboard Alerts**
| Alerta | Condición | Severidad | Acción |
|--------|-----------|-----------|--------|
| High Error Rate | errors > 5% | warning | Revisar logs |
| Requests Timeout | p95 latency > 5s | critical | Escalar a infraestructura |
| API Down | up == 0 for 2m | critical | Página de emergencia |

#### 2. **Forensic Analysis Alerts**
| Alerta | Condición | Severidad | Acción |
|--------|-----------|-----------|--------|
| Low Success Rate | success_rate < 85% | warning | Revisar últimos análisis |
| High Anomaly Count | anomalies > threshold | info | Monitoreo aumentado |
| Phase Timeout | execution_time > 30s | critical | Revisar datos de entrada |

#### 3. **Database Alerts**
| Alerta | Condición | Severidad | Acción |
|--------|-----------|-----------|--------|
| Connection Pool Low | available < 5 | warning | Revisar queries lentas |
| High Lock Wait | lock_wait_ms > 1000 | critical | Escalar a DBA |
| Disk Space Low | free < 10% | critical | Agregar almacenamiento |

#### 4. **Infrastructure Alerts**
| Alerta | Condición | Severidad | Acción |
|--------|-----------|-----------|--------|
| High CPU | cpu > 80% | warning | Revisar procesos |
| High Memory | memory > 85% | critical | Restart servicios |
| Disk Full | disk > 90% | critical | Limpieza/expansión |

### Silenciar Alertas (Mantenimiento)

```
AlertManager UI > Silences > New Silence

Configurar:
- Alertas a silenciar (regex)
- Duración
- Razón
```

---

## Troubleshooting

### Prometheus No Scrapeando Métricas

**Síntoma**: No hay datos en Prometheus

**Solución**:
```bash
# 1. Verificar que target está up
curl -s http://localhost:9090/api/v1/targets | jq .

# 2. Si target está down, revisar logs
docker logs prometheus

# 3. Verificar configuración
cat inventario-retail/monitoring/prometheus.yml

# 4. Reiniciar
docker restart prometheus
```

### Grafana No Conecta a Prometheus

**Síntoma**: "No data" en gráficos

**Solución**:
```bash
# 1. Verificar datasource
curl -s http://localhost:3000/api/datasources | jq .

# 2. Test connection
curl -s http://prometheus:9090/-/healthy

# 3. Si Prometheus está en host diferente:
# Editar datasource URL en Grafana UI
# Configuration > Data Sources > Prometheus
```

### AlertManager No Envía Notificaciones

**Síntoma**: Alertas se ven en Prometheus pero no llegan

**Solución**:
```bash
# 1. Verificar AlertManager está corriendo
docker ps | grep alertmanager

# 2. Revisar configuración
cat inventario-retail/monitoring/alertmanager.yml

# 3. Verificar alertas activas
curl -s http://localhost:9093/api/v1/alerts | jq .

# 4. Revisar logs
docker logs alertmanager
```

### Alto Uso de Almacenamiento de Prometheus

**Síntoma**: /prometheus usando >10GB

**Solución**:
```bash
# 1. Ver tamaño actual
du -sh /prometheus

# 2. Reducir retention en prometheus.yml:
# global:
#   retention: 7d  # (default: 15d)

# 3. Reiniciar Prometheus
docker restart prometheus

# 4. Alternativa: Exportar datos antes de borrar
promtool query instant 'metric_name' > metrics.json
```

---

## Procedimientos Operacionales

### Backup de Datos de Monitoreo

```bash
#!/bin/bash
# backup_monitoring.sh

BACKUP_DIR="/backups/monitoring"
mkdir -p $BACKUP_DIR

# Backup Prometheus data
docker exec prometheus tar czf - /prometheus | \
  gzip > $BACKUP_DIR/prometheus_$(date +%Y%m%d_%H%M%S).tar.gz

# Backup Grafana database
docker exec grafana tar czf - /var/lib/grafana | \
  gzip > $BACKUP_DIR/grafana_$(date +%Y%m%d_%H%M%S).tar.gz

# Backup AlertManager config
cp inventario-retail/monitoring/alertmanager.yml \
  $BACKUP_DIR/alertmanager_$(date +%Y%m%d_%H%M%S).yml

echo "Backup completado en $BACKUP_DIR"
```

### Restore de Monografana

```bash
#!/bin/bash
# restore_monitoring.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: $0 <backup_file>"
  exit 1
fi

# Stop services
docker-compose -f docker-compose.monitoring.yml down

# Restore
docker run --rm -v $(pwd)/prometheus:/prometheus \
  -v $BACKUP_FILE:/backup.tar.gz \
  ubuntu tar xzf /backup.tar.gz -C /prometheus

# Start services
docker-compose -f docker-compose.monitoring.yml up -d

echo "Restore completado"
```

### Upgradear Versión de Prometheus

```bash
# 1. Backup
./backup_monitoring.sh

# 2. Update docker-compose.monitoring.yml
# image: prom/prometheus:latest

# 3. Recrear servicio
docker-compose -f docker-compose.monitoring.yml up -d --force-recreate prometheus

# 4. Validar
curl -s http://localhost:9090/-/healthy
```

### Cambiar Alertas

**Agregar Nueva Alerta**:
```yaml
# En alert_rules.yml
- alert: MyNewAlert
  expr: some_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Descripción de la alerta"
```

**Recargar reglas** (sin restart):
```bash
# Prometheus auto-recarga cada 15s
# O forzar reload inmediato:
curl -X POST http://localhost:9090/-/reload
```

---

## Escalación

### Matriz de Escalación

| Severidad | Tiempo | Acción | Contacto |
|-----------|--------|--------|----------|
| **INFO** | N/A | Monitoreo pasivo | Logs |
| **WARNING** | 1 hora | Revisar logs, escalate si persiste | On-call Engineer |
| **CRITICAL** | 15 min | Página inmediata | On-call Lead + Tech Lead |
| **CRITICAL (Prod)** | 5 min | Página + Llamada telefónica | VP Engineering |

### Contacts (Configurar en AlertManager)

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default-receiver'

receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'ops@company.com'
        from: 'alerts@company.com'
    slack_configs:
      - api_url: 'https://hooks.slack.com/...'
        channel: '#alerts'
```

### Post-Incident Review

```
1. Incident Date: ___________
2. Alert: ___________
3. Root Cause: ___________
4. Resolution: ___________
5. Prevention: ___________
6. Owner: ___________
```

---

## Queries Útiles de Prometheus

### Forensic Analysis

```promql
# Total análisis
forensic_analyses_total

# Success rate (últimas 5m)
rate(forensic_analyses_success_total[5m]) / rate(forensic_analyses_total[5m]) * 100

# Average execution time
avg(forensic_analysis_duration_ms)

# Anomalías detectadas
sum(forensic_anomalies_detected)
```

### Dashboard

```promql
# Error rate
rate(dashboard_errors_total[5m])

# Latency P95
histogram_quantile(0.95, dashboard_request_duration_ms)

# Requests por segundo
rate(dashboard_requests_total[1m])

# Uptime
up{job="dashboard"}
```

### Infraestructura

```promql
# CPU Usage
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk Usage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

---

## Maintenance Windows

### Scheduled Maintenance

```bash
# 1. Silenciar todas las alertas (en AlertManager)
AlertManager > Silences > New Silence
- Matcher: alertname=~".*"
- Duration: 2 hours

# 2. Realizar mantenimiento
docker-compose down
# ... perform upgrades ...
docker-compose up -d

# 3. Verificar health
./scripts/validate_monitoring.sh

# 4. El silencio expira automáticamente
```

---

## Contact & Escalation

| Rol | Email | Slack | On-Call |
|-----|-------|-------|---------|
| On-Call Engineer | eng-oncall@company.com | @oncall | PagerDuty |
| Tech Lead | tech-lead@company.com | @tech-lead | Availability |
| VP Engineering | vp-eng@company.com | @vp-eng | Emergency |

---

## Documentos Relacionados

- [VALIDACION_FASE_6_MONITORING.md](VALIDACION_FASE_6_MONITORING.md) - Validation report
- [API_DOCUMENTATION_FORENSIC.md](API_DOCUMENTATION_FORENSIC.md) - API reference
- [DEPLOYMENT_CHECKLIST_PRODUCTION.md](DEPLOYMENT_CHECKLIST_PRODUCTION.md) - Prod checklist

---

**Creado por**: GitHub Copilot  
**Última revisión**: Oct 24, 2025  
**Próxima revisión**: Trimestral
