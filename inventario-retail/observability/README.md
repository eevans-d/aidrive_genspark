# Observability Stack - Mini Market Multi-Agent System

Stack completo de observabilidad para monitoreo, logging, tracing y alerting del sistema multi-agente.

## 📋 Stack Overview

| Componente | Puerto | Propósito | Status |
|------------|--------|-----------|--------|
| **Prometheus** | 9090 | Metrics collection & storage | ⏳ Preparado |
| **Grafana** | 3000 | Dashboards & visualization | ⏳ Preparado |
| **Loki** | 3100 | Centralized logging | ⏳ Preparado |
| **Promtail** | 9080 | Log shipper to Loki | ⏳ Preparado |
| **Alertmanager** | 9093 | Alert routing & notifications | ⏳ Preparado |
| **Jaeger** | 16686 | Distributed tracing (APM) | 🔮 Future (Phase 1 Week 2-3) |

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY STACK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │  Prometheus  │─────▶│   Grafana    │◀─────│     Loki     │  │
│  │    :9090     │      │    :3000     │      │    :3100     │  │
│  └──────┬───────┘      └──────────────┘      └───────▲──────┘  │
│         │                                              │         │
│         │ scrape /metrics                     push logs│         │
│         │                                              │         │
│  ┌──────▼──────────────────────────────────────┐      │         │
│  │         Agent Services (FastAPI)            │      │         │
│  │  - agente_deposito:8001/metrics            │      │         │
│  │  - agente_negocio:8002/metrics             │      │         │
│  │  - ml_service:8003/metrics                 │      │         │
│  │  - dashboard:8080/metrics                  │──────┘         │
│  └─────────────────────────────────────────────┘                │
│                                                                   │
│  ┌──────────────┐                                               │
│  │ Alertmanager │◀─── Alerts from Prometheus                    │
│  │    :9093     │───▶ Slack notifications                       │
│  └──────────────┘                                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Dashboards Planificados (4 dashboards)

### 1. **System Overview** (dashboard-system-overview.json)
- Health status de los 7 servicios
- Request rate (req/min) por servicio
- Error rate (%) últimas 24h
- P95 latency por endpoint
- Uptime % últimos 7 días

**Métricas clave:**
- `up{job="agente_deposito"}` - Service health
- `http_requests_total` - Request counter
- `http_request_duration_seconds` - Latency histogram
- `http_errors_total` - Error counter

### 2. **Business KPIs** (dashboard-business-kpis.json)
- Productos depositados/h (agente_deposito)
- Órdenes de compra generadas (agente_negocio)
- Inflación calculada (%/día - ml_service)
- Stock crítico alerts (#)
- Revenue proyectado vs real

**Métricas clave:**
- `deposito_productos_procesados_total`
- `negocio_ordenes_generadas_total`
- `ml_inflacion_calculada_percent`
- `negocio_stock_critico_productos`

### 3. **Performance Deep Dive** (dashboard-performance.json)
- CPU usage por container (%)
- Memory usage por container (MB)
- Disk I/O (read/write MB/s)
- Network I/O (TX/RX MB/s)
- Database connections (active/idle)
- Redis cache hit rate (%)

**Métricas clave:**
- `container_cpu_usage_seconds_total`
- `container_memory_usage_bytes`
- `postgres_connections_active`
- `redis_cache_hit_rate`

### 4. **ML Service Monitor** (dashboard-ml-service.json)
- OCR processing time (P50, P95, P99)
- OCR timeout events (#/h)
- Price prediction accuracy (%)
- Inflation model drift (baseline vs actual)
- GPU/CPU usage (si aplica)

**Métricas clave:**
- `ocr_processing_duration_seconds`
- `ocr_timeout_events_total`
- `ml_prediction_accuracy_percent`
- `ml_model_drift_score`

## 🔔 Alertas Planificadas (15 rules)

### Critical (4 rules)
1. **ServiceDown**: `up == 0` durante 2 minutos
2. **HighErrorRate**: Error rate > 5% durante 5 minutos
3. **DatabaseDown**: `postgres_up == 0` durante 1 minuto
4. **DiskSpaceCritical**: Disk usage > 90%

### High (6 rules)
5. **HighLatency**: P95 > 500ms durante 10 minutos
6. **MemoryPressure**: Memory usage > 85% durante 5 minutos
7. **CPUHigh**: CPU > 80% durante 10 minutos
8. **StockCritico**: Productos con stock < umbral
9. **OCRTimeoutSpike**: OCR timeouts > 10/hora
10. **CacheHitRateLow**: Redis hit rate < 70%

### Medium (5 rules)
11. **SlowRequests**: Requests > 2s durante 15 min
12. **InflationAnomaly**: Inflación calculada fuera de rango esperado
13. **MLModelDrift**: Model drift score > threshold
14. **LogVolumeSpike**: Log volume 3x normal
15. **DeploymentIssue**: Pod restarts > 5 en 10 min

## 🚀 Quick Start (cuando esté deployado)

### 1. Acceder a Grafana
```bash
# URL: http://localhost:3000
# User: admin
# Pass: (definir en .env)
```

### 2. Acceder a Prometheus
```bash
# URL: http://localhost:9090
# Query example: rate(http_requests_total[5m])
```

### 3. Acceder a Loki (via Grafana)
```bash
# En Grafana → Explore → Select Loki
# Query example: {job="agente_deposito"} |= "error"
```

### 4. Test Alertmanager
```bash
# URL: http://localhost:9093
curl -X POST http://localhost:9093/api/v1/alerts
```

## 📁 Estructura de Archivos

```
observability/
├── README.md                          # Este archivo
├── docker-compose.observability.yml   # Stack de observability
├── prometheus/
│   ├── prometheus.yml                # Config principal
│   ├── alerts.yml                    # Alert rules (15 rules)
│   └── exporters/
│       └── postgres_exporter.yml     # PostgreSQL metrics
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   ├── prometheus.yml       # Prometheus datasource
│   │   │   └── loki.yml             # Loki datasource
│   │   └── dashboards/
│   │       └── dashboards.yml       # Auto-load dashboards
│   └── dashboards/
│       ├── dashboard-system-overview.json
│       ├── dashboard-business-kpis.json
│       ├── dashboard-performance.json
│       └── dashboard-ml-service.json
├── loki/
│   └── loki-config.yml              # Loki server config
├── promtail/
│   └── promtail-config.yml          # Log collection config
└── alertmanager/
    └── alertmanager.yml             # Alert routing (Slack)
```

## 🎯 Checklist de Implementación (Phase 1 Week 2-3)

### Week 2: Observability Stack Setup (28h)
- [ ] **T1.2.1** (4h): Setup Prometheus + exporters
  - [ ] Create `prometheus/prometheus.yml` (scrape configs for 4 agents)
  - [ ] Create `prometheus/alerts.yml` (15 alert rules)
  - [ ] Add postgres_exporter for DB metrics
  - [ ] Add node_exporter for system metrics
  - [ ] Test scraping: `curl http://localhost:9090/targets`
  
- [ ] **T1.2.2** (8h): Create 4 Grafana dashboards
  - [ ] Dashboard 1: System Overview
  - [ ] Dashboard 2: Business KPIs
  - [ ] Dashboard 3: Performance Deep Dive
  - [ ] Dashboard 4: ML Service Monitor
  - [ ] Configure auto-provisioning
  - [ ] Test dashboard queries
  
- [ ] **T1.2.3** (3h): Setup Loki + Promtail
  - [ ] Create `loki/loki-config.yml`
  - [ ] Create `promtail/promtail-config.yml`
  - [ ] Configure log scraping from containers
  - [ ] Test log ingestion: query in Grafana Explore
  
- [ ] **T1.2.4** (4h): Configure Alertmanager
  - [ ] Create `alertmanager/alertmanager.yml`
  - [ ] Setup Slack webhook integration
  - [ ] Test alert routing (fire test alert)
  - [ ] Validate Slack notifications
  
- [ ] **T1.2.5** (2h): Add /metrics endpoints to agents
  - [ ] agente_deposito: Prometheus metrics
  - [ ] agente_negocio: Prometheus metrics
  - [ ] ml_service: Prometheus metrics
  - [ ] dashboard: Already has /metrics ✅
  
- [ ] **T1.2.6** (3h): Integration testing
  - [ ] Verify all 4 agents scraped successfully
  - [ ] Verify logs flowing to Loki
  - [ ] Fire test alerts and validate Slack
  - [ ] Load test and verify dashboard updates
  
- [ ] **T1.2.7** (4h): Documentation & handoff
  - [ ] Write runbook: "Responding to Alerts"
  - [ ] Write runbook: "Dashboard Troubleshooting"
  - [ ] Update DEPLOYMENT_GUIDE.md with observability section
  - [ ] Create VIDEO: "Observability Stack Tour" (optional)

### Week 3: Advanced Monitoring (Opcional - 12h)
- [ ] **T1.3.1** (4h): Jaeger APM tracing
- [ ] **T1.3.2** (4h): Custom business metrics
- [ ] **T1.3.3** (4h): SLO/SLI definition & dashboards

## 📚 Referencias

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboard Guide](https://grafana.com/docs/grafana/latest/dashboards/)
- [Loki Configuration](https://grafana.com/docs/loki/latest/configuration/)
- [Alertmanager Routing](https://prometheus.io/docs/alerting/latest/configuration/)

## 🔐 Seguridad

- Todos los endpoints de observability detrás de nginx con auth básico
- Prometheus y Grafana NO expuestos públicamente sin VPN
- Alertmanager webhook secrets en `.env` (no hardcoded)
- Logs sanitizados (no passwords, no tokens)

---

**Status**: ⏳ Preparado - Estructura lista, implementación en Week 2
**Owner**: DevOps / SRE
**Timeline**: Phase 1 Week 2-3 (28h base + 12h advanced)
