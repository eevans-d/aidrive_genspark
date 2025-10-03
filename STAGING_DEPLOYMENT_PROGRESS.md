# STAGING DEPLOYMENT v0.10.0 - INICIADO
**Fecha**: Octubre 3, 2025  
**Status**: 🚀 EN PROGRESO  
**Release**: v0.10.0 (ETAPA 2)

---

## 📋 PREPARACIÓN COMPLETADA

### 1. JWT Secrets Generados ✅

```bash
# Generados con: openssl rand -base64 32

JWT_SECRET_DEPOSITO:     lywdM/9FdhKUliDg2fAERWdnaXluGwAqbxaC5bTBKnU=
JWT_SECRET_NEGOCIO:      P3vcanTQaMxo8n9yP9zW9lhzW0dIZ7/w+6WD4iJWNSI=
JWT_SECRET_ML:           ScybwkS13LdYQg6yea0g7rdZ1PZTED0uZlqHTN4H1EE=
JWT_SECRET_DASHBOARD:    H1tJIatBnvQcSdhhY2dd2eVnqugrcOZrKhy8cfizs+U=
JWT_SECRET_KEY (fallback): zboATR9Qf9EBmPTc2o379OCJNcbomm7rVi+n1whGsWQ=
```

**Seguridad**: ✅ Secrets únicos por agente (R2 mitigation)

### 2. Archivo `.env.staging` Creado ✅

**Ubicación**: `inventario-retail/.env.staging`

**Configuraciones Clave**:
- Database: `inventario_retail_staging`
- Redis: `/1` (db separada)
- JWT: Per-agent secrets configurados
- OCR_TIMEOUT_SECONDS: `30` (R3)
- INFLATION_RATE_MONTHLY: `0.045` (4.5%, R4)
- DASHBOARD_API_KEY: `staging_dashboard_api_key_2025_secure`
- LOG_LEVEL: `DEBUG` (staging)
- ENVIRONMENT: `staging`

### 3. Script Deployment Automatizado Creado ✅

**Ubicación**: `scripts/deploy_staging_v0.10.0.sh`

**Capacidades**:
- ✅ Pre-deployment checks (docker, compose, .env)
- ✅ Local validation (27 tests)
- ✅ Automatic backup (pre-v0.10.0)
- ✅ Container build & deploy
- ✅ Health checks (5 services)
- ✅ Smoke tests R1, R3, R4
- ✅ Metrics validation
- ✅ Log inspection
- ✅ Summary report

**Ejecución**:
```bash
bash scripts/deploy_staging_v0.10.0.sh
```

---

## 🚀 DEPLOYMENT EN CURSO

### Fase 1: Pre-Deployment Checks
```
✓ Docker installed
✓ Docker Compose installed
✓ .env.staging exists
✓ JWT secrets configured
✓ Validation script available
```

### Fase 2: Local Validation
```
Ejecutando: validate_etapa2_mitigations.py
Expected: 27/27 tests passed
```

### Fase 3: Backup
```
Location: backups/pre-v0.10.0-YYYYMMDD-HHMMSS/
Files:
  - docker-compose.production.yml
  - .env.production (if exists)
```

### Fase 4: Deploy
```
1. Copy .env.staging → .env.production
2. Pull Docker images (GHCR or local build)
3. Build containers (--no-cache)
4. Start services (docker-compose up -d)
5. Wait 30s for initialization
```

### Fase 5: Health Checks
```
Expected:
  ✓ agente-deposito  (http://localhost:8001/health)
  ✓ agente-negocio   (http://localhost:8002/health)
  ✓ ml-service       (http://localhost:8003/health)
  ✓ dashboard        (http://localhost:8080/health)
  ✓ nginx            (http://localhost:80/api/deposito/health)
```

### Fase 6: Smoke Tests

**R1 - Container Security**:
```
✓ agente-deposito:  whoami → agente
✓ agente-negocio:   whoami → negocio
✓ ml-service:       whoami → mluser
✓ dashboard:        whoami → dashboarduser
```

**R3 - OCR Timeout**:
```
✓ OCR_TIMEOUT_SECONDS in logs
✓ Configured value: 30 seconds
```

**R4 - ML Inflation**:
```
✓ "Inflación mensual configurada" in logs
✓ Value: 4.5%
```

### Fase 7: Metrics & Logs
```
✓ Dashboard /metrics endpoint accessible
✓ Error count < 5 in last 50 log lines
```

---

## 📊 CRITERIOS DE ÉXITO

### Must Pass (Bloqueantes)
- [ ] All 5 health checks pass
- [ ] R1: 4/4 containers non-root
- [ ] No critical errors in logs
- [ ] Metrics endpoint accessible

### Should Pass (Warnings OK)
- [ ] R3: OCR timeout configured
- [ ] R4: ML inflation logged
- [ ] Error count < 5

### Success Threshold
- **0 failures** → ✅ Deployment SUCCESSFUL
- **1+ failures** → ❌ Rollback recommended

---

## 🔄 ROLLBACK PLAN

Si el deployment falla:

### Automatic Rollback
```bash
cd inventario-retail
docker-compose down

# Restore backup
cp backups/pre-v0.10.0-*/docker-compose.production.yml .
cp backups/pre-v0.10.0-*/.env.production .

# Restart old version
docker-compose up -d
```

### Manual Rollback
```bash
# Stop all services
docker-compose -f inventario-retail/docker-compose.production.yml down

# Restore from backup
BACKUP_DIR=$(ls -td backups/pre-v0.10.0-* | head -1)
cp $BACKUP_DIR/* inventario-retail/

# Restart
cd inventario-retail
docker-compose up -d
```

---

## 📝 PRÓXIMOS PASOS

### Si Deployment Exitoso ✅
1. **Monitoring Extended** (30 min)
   ```bash
   docker-compose -f inventario-retail/docker-compose.production.yml logs -f
   ```

2. **Extended Tests** (1 hora)
   - Test JWT rotation procedure
   - Test OCR timeout con imágenes grandes
   - Test ML inflation update (change value + restart)
   - Cross-agent JWT validation

3. **Metrics Review** (30 min)
   - http://localhost:8080/metrics
   - Verify `dashboard_requests_total`
   - Check error rates
   - Monitor p95 latency

4. **Documentation Update**
   - Mark staging as deployed in CHANGELOG
   - Update deployment log
   - Screenshot metrics

### Si Deployment Falla ❌
1. **Execute Rollback** (inmediato)
2. **Investigate Logs**
   ```bash
   docker-compose -f inventario-retail/docker-compose.production.yml logs --tail=200
   ```
3. **Fix Issues**
4. **Retry Deployment**

---

## 📖 Referencias

- **Checklist Completo**: `CHECKLIST_STAGING_DEPLOYMENT_V0.10.0.md`
- **Script**: `scripts/deploy_staging_v0.10.0.sh`
- **Environment**: `inventario-retail/.env.staging`
- **Validation**: `validate_etapa2_mitigations.py`

---

## 🔍 Monitoring Commands

```bash
# Health checks
curl http://localhost:8001/health  # deposito
curl http://localhost:8002/health  # negocio
curl http://localhost:8003/health  # ml
curl http://localhost:8080/health  # dashboard

# Metrics
curl -H "X-API-Key: staging_dashboard_api_key_2025_secure" \
  http://localhost:8080/metrics

# Logs
docker-compose -f inventario-retail/docker-compose.production.yml logs -f

# Container users (R1)
docker-compose -f inventario-retail/docker-compose.production.yml exec agente-deposito whoami
docker-compose -f inventario-retail/docker-compose.production.yml exec agente-negocio whoami
docker-compose -f inventario-retail/docker-compose.production.yml exec ml whoami
docker-compose -f inventario-retail/docker-compose.production.yml exec dashboard whoami

# Status
docker-compose -f inventario-retail/docker-compose.production.yml ps
```

---

**Status Actual**: 🚀 Script deployment ejecutándose...  
**Fecha Inicio**: Octubre 3, 2025  
**Expected Duration**: 5-10 minutos (build + deploy + tests)
