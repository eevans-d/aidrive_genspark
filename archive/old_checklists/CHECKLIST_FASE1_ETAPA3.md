# ✅ CHECKLIST FASE 1 - ETAPA 3: DEPLOY & OBSERVABILITY

**Fase:** 1 de 3  
**Duración:** 4 semanas (Mes 1)  
**Esfuerzo:** 40-48 horas  
**Prioridad:** 🔴 CRÍTICA  
**Fecha Inicio:** TBD  
**Owner:** DevOps + Ops Team

---

## 📋 OVERVIEW

Esta checklist cubre **Fase 1 de ETAPA 3**, el paso más crítico: llevar el sistema de código validado (ETAPA 2) a producción operacional con monitoring completo.

**3 Semanas Estructuradas:**
1. **Semana 1:** Staging Deployment Success (23h)
2. **Semana 2-3:** Observability Stack (28h)
3. **Semana 4:** Production Deployment (18.5h)

**Gate:** Sin staging success, **NO PROCEDER** a observability ni production.

---

## 🚦 SEMANA 1: STAGING DEPLOYMENT SUCCESS (23h)

**Objetivo:** Resolver bloqueadores de deployment y tener staging running stable 48h+

### Pre-requisitos
- [ ] ETAPA 2 completa (v0.10.0 código validado)
- [ ] 27 tests pasando localmente
- [ ] Docker y docker-compose instalados
- [ ] Acceso SSH al servidor staging
- [ ] `.env.staging` con JWT secrets generados

---

### T1.1.1: Implementar Solución Timeout en Dockerfiles (2h)

**Problema:** PyPI timeouts descargando ML packages (~2.8GB)

**Acciones:**
- [ ] Agregar `PIP_DEFAULT_TIMEOUT=600` en todos los Dockerfiles
  - [ ] `agente_deposito/Dockerfile`
  - [ ] `agente_negocio/Dockerfile`
  - [ ] `ml_service/Dockerfile`
  - [ ] `web_dashboard/Dockerfile`
- [ ] Agregar `PIP_RETRIES=5` como fallback adicional
- [ ] Commit: `fix(docker): increase pip timeout to 600s for ML packages`

**Validación:**
```bash
grep -r "PIP_DEFAULT_TIMEOUT" inventario-retail/*/Dockerfile
# Debe mostrar 4 matches
```

---

### T1.1.2: Configurar PyPI Mirror (Tsinghua/Aliyun) (3h)

**Opción A: Mirror Tsinghua (China, más rápido para Asia-Pac)**
- [ ] Crear `pip.conf` en cada Dockerfile:
```dockerfile
RUN mkdir -p /root/.pip && \
    echo "[global]" > /root/.pip/pip.conf && \
    echo "index-url = https://pypi.tuna.tsinghua.edu.cn/simple" >> /root/.pip/pip.conf
```

**Opción B: Mirror Aliyun (alternativa)**
- [ ] URL: `https://mirrors.aliyun.com/pypi/simple/`

**Opción C: Mirror Europeo (si staging en EU)**
- [ ] URL: `https://pypi.org/simple` (default pero con CDN)

**Implementar en 4 Dockerfiles:**
- [ ] `agente_deposito/Dockerfile` (pre-install dependencies)
- [ ] `agente_negocio/Dockerfile`
- [ ] `ml_service/Dockerfile` (crítico: torch, nvidia-cudnn)
- [ ] `web_dashboard/Dockerfile`

**Validación:**
```bash
docker build -t test-mirror inventario-retail/ml_service/ 2>&1 | grep "tsinghua\|aliyun"
# Debe mostrar requests al mirror configurado
```

---

### T1.1.3: Pre-download Wheels Localmente y COPY (4h)

**Estrategia:** Download packages una vez, reusar en builds

**Acciones:**
- [ ] Crear directorio `inventario-retail/wheels/`
- [ ] Download packages críticos:
```bash
cd inventario-retail
mkdir -p wheels

# Download ML packages (los más pesados)
pip download torch==2.1.0 -d wheels/
pip download nvidia-cudnn-cu12==8.9.2.26 -d wheels/
pip download nvidia-cublas-cu12==12.1.3.1 -d wheels/

# Download common dependencies
pip download -r ml_service/requirements.txt -d wheels/
```

- [ ] Modificar `ml_service/Dockerfile`:
```dockerfile
# Copiar wheels pre-downloaded
COPY wheels/ /tmp/wheels/

# Instalar desde wheels locales
RUN pip install --no-index --find-links=/tmp/wheels/ -r /tmp/requirements.txt
```

- [ ] Agregar a `.gitignore`:
```
inventario-retail/wheels/
```

- [ ] Documentar en `README_DEPLOY_STAGING.md`:
```markdown
## Pre-downloaded Wheels Strategy

Para deployments offline o con network issues:
1. Download wheels: `make download-wheels`
2. Build with wheels: `docker-compose build --no-cache`
```

**Validación:**
```bash
ls -lh inventario-retail/wheels/
# Debe mostrar ~2.5-3GB en .whl files

docker build inventario-retail/ml_service/ 2>&1 | grep "Requirement already satisfied"
# Debe instalar desde wheels locales
```

---

### T1.1.4: Build Secuencial (Uno por Uno) (1h)

**Problema:** Builds paralelos saturan network

**Crear script:** `scripts/build_sequential.sh`
```bash
#!/bin/bash
set -e

cd inventario-retail

echo "Building services sequentially..."

services=("agente_deposito" "agente_negocio" "ml_service" "web_dashboard")

for service in "${services[@]}"; do
    echo "=========================================="
    echo "Building $service..."
    echo "=========================================="
    docker-compose build --no-cache $service
    if [ $? -eq 0 ]; then
        echo "✅ $service built successfully"
    else
        echo "❌ $service build failed"
        exit 1
    fi
    sleep 5  # Cooldown entre builds
done

echo "✅ All services built successfully!"
```

**Acciones:**
- [ ] Crear script
- [ ] `chmod +x scripts/build_sequential.sh`
- [ ] Commit: `feat(scripts): add sequential build script for staging`

**Validación:**
```bash
./scripts/build_sequential.sh
# Debe completar sin errores
```

---

### T1.1.5: Deploy Staging con Nueva Estrategia (3h)

**Pre-deploy:**
- [ ] Backup completo:
```bash
mkdir -p backups/pre-fase1-$(date +%Y%m%d)
cp -r inventario-retail/.env.staging backups/pre-fase1-$(date +%Y%m%d)/
docker-compose exec postgres pg_dump -U user inventario_retail_staging > backups/pre-fase1-$(date +%Y%m%d)/db.sql
```

**Deploy:**
- [ ] SSH al servidor staging
- [ ] Pull código: `git pull origin master`
- [ ] Generar JWT secrets (si no existen):
```bash
echo "JWT_SECRET_DEPOSITO=$(openssl rand -base64 32)" >> .env.staging
echo "JWT_SECRET_NEGOCIO=$(openssl rand -base64 32)" >> .env.staging
echo "JWT_SECRET_ML=$(openssl rand -base64 32)" >> .env.staging
echo "JWT_SECRET_DASHBOARD=$(openssl rand -base64 32)" >> .env.staging
echo "JWT_SECRET_SHARED=$(openssl rand -base64 32)" >> .env.staging
```
- [ ] Build con nueva estrategia:
```bash
./scripts/build_sequential.sh
```
- [ ] Deploy:
```bash
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --force-recreate
```

**Health checks:**
- [ ] Wait 60s for startup
- [ ] Check all services:
```bash
docker-compose ps
# Debe mostrar 7 servicios UP

curl -f http://localhost:8001/health  # agente_deposito
curl -f http://localhost:8002/health  # agente_negocio
curl -f http://localhost:8003/health  # ml_service
curl -f http://localhost:8080/health  # web_dashboard
```

**Validación:**
- [ ] Todos los health checks retornan 200 OK
- [ ] Logs limpios (sin errores críticos):
```bash
docker-compose logs --tail=50 | grep -i "error\|critical"
```

---

### T1.1.6: Smoke Tests Completos (R1-R6) (2h)

**Ejecutar suite de smoke tests:**

#### R1: Container Security
```bash
# Verificar todos los containers corren como non-root
docker-compose exec agente_deposito whoami  # Debe retornar: agente
docker-compose exec agente_negocio whoami   # Debe retornar: negocio
docker-compose exec ml_service whoami       # Debe retornar: mluser
docker-compose exec web_dashboard whoami    # Debe retornar: dashboarduser
```
- [ ] R1 validated ✅

#### R2: JWT Per-Service
```bash
# Verificar 5 secrets únicos en .env.staging
grep "JWT_SECRET" .env.staging | wc -l  # Debe retornar: 5

# Verificar no hay duplicados
grep "JWT_SECRET" .env.staging | cut -d'=' -f2 | sort | uniq -d | wc -l  # Debe retornar: 0
```
- [ ] R2 validated ✅

#### R3: OCR Timeout
```bash
# Test endpoint con imagen grande (debe timeout en 30s)
time curl -X POST http://localhost:8002/api/v1/process-invoice \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_huge_image_here..."}'

# Debe retornar 504 Gateway Timeout si imagen muy grande
# Tiempo de respuesta debe ser <= 30s (OCR_TIMEOUT_SECONDS)
```
- [ ] R3 validated ✅

#### R4: ML Inflation External
```bash
# Verificar INFLATION_RATE_MONTHLY en .env.staging
grep "INFLATION_RATE_MONTHLY" .env.staging  # Debe existir (e.g., 0.045)

# Validar no está hardcoded en código Python
grep -r "INFLATION_RATE" inventario-retail/ml_service/app/*.py | grep -v "os.getenv"  # Debe retornar: vacío
```
- [ ] R4 validated ✅

#### R6: Trivy Enforced
```bash
# Verificar CI/CD tiene trivy-scan-dependencies job
grep -A 10 "trivy-scan-dependencies" .github/workflows/ci.yml | grep "exit-code: 1"
```
- [ ] R6 validated ✅

**Reporte:**
- [ ] Crear `STAGING_SMOKE_TESTS_REPORT.md` con resultados
- [ ] Screenshot de health checks (Postman/curl)
- [ ] Commit: `test(staging): smoke tests R1-R6 passed`

---

### T1.1.7: Monitoring Inicial 48h (8h distribuidas)

**Setup monitoring básico temporal:**

- [ ] Configurar Uptime monitoring (UptimeRobot o similar):
  - [ ] `http://staging.aidrive.internal:8001/health` (deposito)
  - [ ] `http://staging.aidrive.internal:8002/health` (negocio)
  - [ ] `http://staging.aidrive.internal:8003/health` (ml)
  - [ ] `http://staging.aidrive.internal:8080/health` (dashboard)
  - [ ] Check interval: 5 min

- [ ] Logs monitoring manual:
```bash
# Tail logs cada 4-6 horas por 48h
docker-compose logs -f --tail=100 | tee logs/staging-$(date +%Y%m%d-%H%M).log
```

- [ ] Metrics básicos (sin Prometheus aún):
```bash
# Cada 6 horas capturar:
docker stats --no-stream > metrics/staging-$(date +%Y%m%d-%H%M).txt
```

**Checklist 48h:**
- [ ] **Hora 0:** Deploy exitoso
- [ ] **Hora 6:** Logs review (0 errores críticos)
- [ ] **Hora 12:** Health checks OK, memory stable
- [ ] **Hora 24:** Uptime 100%, no restarts
- [ ] **Hora 36:** Logs review (0 errores críticos)
- [ ] **Hora 48:** ✅ Staging considerado STABLE

**Criterios de éxito Semana 1:**
- [ ] Staging deployed successfully
- [ ] 48h uptime sin critical issues
- [ ] Smoke tests R1-R6 passed
- [ ] Logs limpios (0 errores críticos)

**Gate Decision:**
- [ ] ✅ PASS → Proceder a Semana 2 (Observability Stack)
- [ ] ❌ FAIL → Rollback + troubleshoot + retry

---

## 📊 SEMANA 2-3: OBSERVABILITY STACK (28h)

**Objetivo:** Implementar monitoring, logging, alerting completo

### T1.2.1: Setup Prometheus + Exporters (4h)

**Crear `docker-compose.monitoring.yml`:**

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.47.0
    container_name: prometheus
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    ports:
      - "9090:9090"
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:v1.6.1
    container_name: node-exporter
    ports:
      - "9100:9100"
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.14.0
    container_name: postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://user:password@postgres:5432/inventario_retail_staging?sslmode=disable"
    ports:
      - "9187:9187"
    restart: unless-stopped

  redis-exporter:
    image: oliver006/redis_exporter:v1.55.0
    container_name: redis-exporter
    environment:
      REDIS_ADDR: "redis:6379"
    ports:
      - "9121:9121"
    restart: unless-stopped

volumes:
  prometheus_data:
```

**Crear `monitoring/prometheus/prometheus.yml`:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'agente_deposito'
    static_configs:
      - targets: ['agente_deposito:8001']
    metrics_path: '/metrics'

  - job_name: 'agente_negocio'
    static_configs:
      - targets: ['agente_negocio:8002']
    metrics_path: '/metrics'

  - job_name: 'ml_service'
    static_configs:
      - targets: ['ml_service:8003']
    metrics_path: '/metrics'

  - job_name: 'web_dashboard'
    static_configs:
      - targets: ['web_dashboard:8080']
    metrics_path: '/metrics'
```

**Acciones:**
- [ ] Crear estructura de archivos
- [ ] Deploy monitoring stack:
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```
- [ ] Validar Prometheus UI: `http://localhost:9090`
- [ ] Verificar targets UP: Status → Targets (debe mostrar 8 jobs UP)
- [ ] Commit: `feat(monitoring): add prometheus stack with 4 exporters`

---

### T1.2.2: Grafana Dashboards (4 dashboards) (8h)

**Setup Grafana:**

```yaml
# Agregar a docker-compose.monitoring.yml
  grafana:
    image: grafana/grafana:10.1.5
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin_change_me
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    ports:
      - "3000:3000"
    restart: unless-stopped
```

**Crear datasource:** `monitoring/grafana/datasources/prometheus.yml`
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

**Crear 4 dashboards:**

#### Dashboard 1: System Metrics (2h)
- [ ] CPU usage por servicio (7 containers)
- [ ] Memory usage por servicio
- [ ] Disk I/O
- [ ] Network I/O
- [ ] Container restart count
- [ ] Export JSON: `monitoring/grafana/dashboards/system_dashboard.json`

#### Dashboard 2: Security Metrics (2h)
- [ ] JWT validation failures (R2)
- [ ] OCR timeout events (R3)
- [ ] Trivy scan results timeline (R6)
- [ ] Non-root container violations (R1)
- [ ] ML inflation drift (R4)
- [ ] Export JSON: `monitoring/grafana/dashboards/security_dashboard.json`

#### Dashboard 3: Business Metrics (2h)
- [ ] API requests/min por endpoint
- [ ] P50/P95/P99 latencies
- [ ] Error rate breakdown (4xx vs 5xx)
- [ ] Top 10 errores frecuentes
- [ ] Invoice processing rate (invoices/hour)
- [ ] Export JSON: `monitoring/grafana/dashboards/business_dashboard.json`

#### Dashboard 4: ML Metrics (2h)
- [ ] OCR processing time histogram
- [ ] ML model accuracy trends
- [ ] Inflation rate updates timeline
- [ ] Stock prediction errors
- [ ] ML service uptime
- [ ] Export JSON: `monitoring/grafana/dashboards/ml_dashboard.json`

**Acciones:**
- [ ] Crear 4 dashboards en Grafana UI
- [ ] Exportar JSON de cada dashboard
- [ ] Commit JSONs al repo
- [ ] Screenshot de cada dashboard
- [ ] Commit: `feat(monitoring): add 4 grafana dashboards`

---

### T1.2.3: Loki para Centralized Logging (3h)

**Agregar a docker-compose.monitoring.yml:**

```yaml
  loki:
    image: grafana/loki:2.9.2
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki/loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped

  promtail:
    image: grafana/promtail:2.9.2
    container_name: promtail
    volumes:
      - /var/log:/var/log
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./monitoring/promtail/promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
```

**Crear `monitoring/loki/loki-config.yml`:**
```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
  filesystem:
    directory: /loki/chunks

limits_config:
  retention_period: 30d
```

**Acciones:**
- [ ] Deploy Loki + Promtail
- [ ] Configurar Loki datasource en Grafana
- [ ] Validar logs aggregation: Grafana → Explore → Loki
- [ ] Query de prueba: `{container_name="agente_deposito"}`
- [ ] Commit: `feat(monitoring): add loki for centralized logging`

---

### T1.2.4: Alertmanager Configuration (4h)

**Agregar a docker-compose.monitoring.yml:**

```yaml
  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    restart: unless-stopped
```

**Crear 15 alerting rules:** `monitoring/prometheus/alerts.yml`

```yaml
groups:
  - name: critical_alerts
    interval: 30s
    rules:
      # 1. Service Down
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"

      # 2. High Error Rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate (>5%) on {{ $labels.job }}"

      # 3. High Latency P95
      - alert: HighLatencyP95
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency >1s on {{ $labels.job }}"

      # 4. Container Restarts
      - alert: ContainerRestarting
        expr: rate(container_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container {{ $labels.container_name }} restarting"

      # 5. High Memory Usage
      - alert: HighMemoryUsage
        expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container {{ $labels.container_name }} using >90% memory"

      # 6-15: Agregar 10 alertas más (disk, CPU, DB connections, etc.)
```

**Acciones:**
- [ ] Crear 15 alerting rules
- [ ] Update prometheus.yml con rule_files
- [ ] Configurar Alertmanager (Slack/email)
- [ ] Test alerts: `curl -X POST http://localhost:9093/-/reload`
- [ ] Commit: `feat(monitoring): add 15 alerting rules`

---

### T1.2.5-T1.2.7: Slack + APM + Sentry (7h)

**Completar stack:**
- [ ] T1.2.5: Slack notifications (2h)
- [ ] T1.2.6: Jaeger tracing (4h)
- [ ] T1.2.7: Sentry error tracking (3h - opcional)

**Criterios de éxito Semana 2-3:**
- [ ] 4 dashboards Grafana operacionales
- [ ] 15 alerting rules configuradas
- [ ] Logs centralizados (7 servicios)
- [ ] Tracing distribuido habilitado
- [ ] Runbook actualizado

---

## 🚀 SEMANA 4: PRODUCTION DEPLOYMENT (18.5h)

**Prerequisitos para production:**
- [ ] Staging stable 7+ días
- [ ] Zero critical issues en staging
- [ ] Monitoring stack validado
- [ ] Runbook completo

### T1.3.1: Generar Secrets Producción (1h)

```bash
# Generar 5 JWT únicos para producción
openssl rand -base64 32  # JWT_SECRET_DEPOSITO
openssl rand -base64 32  # JWT_SECRET_NEGOCIO
openssl rand -base64 32  # JWT_SECRET_ML
openssl rand -base64 32  # JWT_SECRET_DASHBOARD
openssl rand -base64 32  # JWT_SECRET_SHARED

# Crear .env.production (NO commitear)
# Almacenar en secret manager (AWS Secrets Manager, Vault, etc.)
```

- [ ] Secrets generados
- [ ] `.env.production` creado (git-ignored)
- [ ] Secrets backed up securely

---

### T1.3.2-T1.3.7: Production Deploy Pipeline (17.5h)

**Ejecutar deployment completo:**
- [ ] T1.3.2: Backup pre-deploy (1h)
- [ ] T1.3.3: Deploy production blue-green (4h)
- [ ] T1.3.4: Smoke tests producción (2h)
- [ ] T1.3.5: Monitoring 24h (8h distribuidas)
- [ ] T1.3.6: Tag release v0.10.0 (0.5h)
- [ ] T1.3.7: Post-deployment review (2h)

**Criterios de éxito Semana 4:**
- [ ] Production deployed (v0.10.0)
- [ ] Zero downtime deployment
- [ ] 24h monitoring clean
- [ ] GitHub release notes publicadas
- [ ] Postmortem documentado

---

## ✅ FASE 1 COMPLETE - GATES

### Gate 1: Staging Success (Post Semana 1)
- [ ] Staging deployed successfully
- [ ] 48h uptime sin critical issues
- [ ] Smoke tests R1-R6 passed
- [ ] **Decision:** PASS → Continue | FAIL → Retry

### Gate 2: Observability Ready (Post Semana 3)
- [ ] 4 dashboards operacionales
- [ ] 15 alerts configuradas
- [ ] Logs centralizados
- [ ] **Decision:** PASS → Production | FAIL → Fix monitoring

### Gate 3: Production Live (Post Semana 4)
- [ ] Production running stable
- [ ] Uptime ≥99.9% (24h)
- [ ] Zero critical incidents
- [ ] **Decision:** PASS → Fase 2 | FAIL → Rollback + debug

---

## 📋 ENTREGABLES FASE 1

### Código y Configuración
- [ ] `docker-compose.monitoring.yml` (Prometheus, Grafana, Loki, Alertmanager)
- [ ] `monitoring/prometheus/prometheus.yml`
- [ ] `monitoring/prometheus/alerts.yml` (15 rules)
- [ ] `monitoring/grafana/dashboards/*.json` (4 dashboards)
- [ ] `scripts/build_sequential.sh`
- [ ] `inventario-retail/wheels/` (pre-downloaded packages)

### Documentación
- [ ] `STAGING_SMOKE_TESTS_REPORT.md`
- [ ] `STAGING_DEPLOYMENT_POSTMORTEM.md`
- [ ] `PRODUCTION_DEPLOY_POSTMORTEM.md`
- [ ] `RUNBOOK_MONITORING_ETAPA3.md`
- [ ] Update `README_DEPLOY_STAGING.md`

### GitHub
- [ ] Release v0.10.0 publicada
- [ ] Release notes completas
- [ ] Tag `v0.10.0` en master

---

## 🚨 ROLLBACK PLAN

Si cualquier gate falla:

### Rollback Staging:
```bash
cd inventario-retail
docker-compose down
git checkout <previous_commit>
docker-compose up -d
# Restore DB from backup
```

### Rollback Production:
```bash
cd inventario-retail
docker-compose -f docker-compose.production.yml down
git checkout v0.9.0  # Previous stable version
docker-compose -f docker-compose.production.yml up -d
# Restore DB from backup
# Notify stakeholders
```

**MTTR Target:** <30 min

---

## 📞 CONTACTO Y SOPORTE

- **Responsable Fase 1:** DevOps Lead
- **Backup:** Ops Team
- **Escalation:** CTO
- **Slack:** #aidrive-deployment
- **Incident Response:** On-call rotation (post-production)

---

## 🎯 SIGUIENTE PASO

**Post Fase 1 Complete:**
→ Proceder a **FASE 2: Automation & Features** (Mes 2-3)

Checklist: `CHECKLIST_FASE2_ETAPA3.md` (por crear)

---

**Documento creado:** Octubre 3, 2025  
**Última actualización:** TBD (durante ejecución)  
**Status:** 📋 READY TO EXECUTE

---

**🚀 Let's deploy to production! 🚀**
