# PROMPT 4: ANÁLISIS FORENSE DE CONTENEDORES & INFRAESTRUCTURA

## 🚨 RESUMEN EJECUTIVO

**Fecha**: 12 Enero 2025  
**Estado**: CRÍTICO - Infraestructura de contenedores NO IMPLEMENTADA pero declarada  
**Nivel de Riesgo**: ALTO - Discrepancia entre configuración declarada y realidad  

## 🔍 HALLAZGOS CRÍTICOS DE INFRAESTRUCTURA

### 1. DOCKERFILES AUSENTES (CRÍTICO)

#### 🚨 Configuración Docker-Compose SIN Dockerfiles:
```yaml
# docker-compose.development.yml - LÍNEAS 37-67
agente-deposito:
  build:
    context: .
    dockerfile: Dockerfile.agente-deposito  # ❌ ARCHIVO NO EXISTE
  container_name: agente_deposito_service
  ports:
    - "8001:8000"  # Puerto mapeado incorrectamente

agente-negocio:
  build:
    context: .
    dockerfile: Dockerfile.agente-negocio  # ❌ ARCHIVO NO EXISTE
  ports:
    - "8002:8000"  # Puerto mapeado incorrectamente

ml-service:
  build:
    context: .
    dockerfile: Dockerfile.ml-service  # ❌ ARCHIVO NO EXISTE
  ports:
    - "8003:8000"
```

**Impacto**: Sistema NO puede ser containerizado a pesar de tener configuración completa

### 2. CONFIGURACIÓN NGINX INVERSIVA (CRÍTICO)

#### 🚨 Análisis del Proxy Inverso:
```nginx
# nginx/inventario-retail.conf
server {
    listen 80;
    # AgenteNegocio
    location /api/negocio/ {
        proxy_pass http://127.0.0.1:8001/;  # ❌ PUERTO INCORRECTO
    }
    
    # AgenteDepósito  
    location /api/deposito/ {
        proxy_pass http://127.0.0.1:8002/;  # ❌ PUERTO INCORRECTO
    }
}
```

**Vulnerabilidad Identificada**: Los puertos están **invertidos**
- AgenteNegocio debería estar en puerto 8002, pero proxy apunta a 8001
- AgenteDepósito debería estar en puerto 8001, pero proxy apunta a 8002

### 3. SYSTEMD VS DOCKER INCONSISTENCIES (ALTO RIESGO)

#### 📊 Análisis de Configuración de Servicios:

**SystemD Configuration**:
```ini
# systemd/agente-deposito.service
ExecStart=uvicorn agente_deposito.main:app --host 0.0.0.0 --port 8002

# systemd/agente-negocio.service  
ExecStart=uvicorn agente_negocio.main:app --host 0.0.0.0 --port 8001
```

**Docker-Compose Configuration**:
```yaml
agente-deposito:
  ports: ["8001:8000"]  # Mapea puerto externo 8001
agente-negocio:
  ports: ["8002:8000"]  # Mapea puerto externo 8002
```

**Resultado**: Configuración de puertos **completamente inconsistente** entre sistemas

### 4. CI/CD PIPELINE SIN IMPLEMENTACIÓN REAL (MEDIO RIESGO)

#### 🔍 Análisis del Pipeline GitHub Actions:
```yaml
# .github/workflows/ci-cd.yml
deploy-production:
  steps:
    - name: Deploy to Production
      run: ./scripts/deploy/deploy_production.sh  # ❌ SCRIPT NO EXISTE
    
    - name: Update Monitoring Dashboards
      run: python monitoring/grafana/update_dashboards.py  # ❌ SCRIPT NO EXISTE
```

**Scripts de Deploy Ausentes**:
- `scripts/deploy/deploy_staging.sh` - NO EXISTE
- `scripts/deploy/deploy_production.sh` - NO EXISTE
- `monitoring/grafana/update_dashboards.py` - NO EXISTE

### 5. MONITOREO PARCIALMENTE IMPLEMENTADO (MEDIO RIESGO)

#### 📊 Estado del Stack de Observabilidad:

**Presente**:
- ✅ `monitoring/setup_monitoring.sh` - Script de instalación completo
- ✅ Configuración para Prometheus, Grafana, Node Exporter
- ✅ Timezone configurado para Argentina

**Ausente**:
- ❌ Archivos de configuración Prometheus (`prometheus.yml`)
- ❌ Dashboard Grafana (`argentina_retail_dashboard.json`)
- ❌ Reglas de alertas (`argentina_retail_rules.yml`)

## 🔧 ANÁLISIS TÉCNICO DETALLADO

### Arquitectura de Contenedores Declarada vs Real

#### 🏗️ Arquitectura Docker-Compose (SOLO EN PAPEL):
```
┌─────────────────────────────────────────┐
│ NGINX Proxy (Puerto 80)                │
├─────────────────────────────────────────┤
│ agente-deposito:8001 ←→ container:8000  │
│ agente-negocio:8002  ←→ container:8000  │
│ ml-service:8003      ←→ container:8000  │
├─────────────────────────────────────────┤
│ PostgreSQL:5432 + Redis:6379            │
└─────────────────────────────────────────┘
```

#### ⚠️ Realidad Actual:
```
┌─────────────────────────────────────────┐
│ Servicios ejecutándose directamente     │
│ agente-deposito: Puerto 8002 (SystemD) │
│ agente-negocio:  Puerto 8001 (SystemD) │
│ ml-service:      Puerto 8003 (¿?)      │
└─────────────────────────────────────────┘
```

### Configuración de Red Docker

#### 🌐 Red Planificada:
```yaml
networks:
  banking_network:  # ❌ Nombre incorrecto (debería ser retail_network)
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

#### 📦 Volúmenes Configurados:
```yaml
volumes:
  postgres_data:
    driver_opts:
      device: ./data/postgres  # ❌ Directorio no existe
  redis_data:
    driver_opts: 
      device: ./data/redis     # ❌ Directorio no existe
```

### Health Checks y Dependencias

#### ✅ Health Checks Bien Configurados:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

#### 🔗 Dependencias de Servicios:
- Correcta configuración de `depends_on` con condiciones de salud
- Orden de inicio apropiado: PostgreSQL → Redis → Aplicaciones

### Configuración de Environment Variables

#### 🔍 Variables de Entorno Hardcodeadas:
```yaml
environment:
  - DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/sistema_bancario
  - REDIS_URL=redis://redis:6379
  - LOG_LEVEL=DEBUG  # ❌ DEBUG en production
```

**Problemas Identificados**:
- Credenciales hardcodeadas en docker-compose
- Nombres de base de datos incorrectos (`sistema_bancario` vs `inventario_retail`)
- LOG_LEVEL=DEBUG expone información sensible

## 🎯 VECTORES DE ATAQUE Y VULNERABILIDADES

### 1. Ausencia de Contenedores
- **Impacto**: No hay aislamiento de procesos ni recursos
- **Riesgo**: Compromiso del sistema host completo
- **Explotación**: Acceso directo al filesystem del servidor

### 2. Configuración de Puertos Inversa
- **Impacto**: Tráfico mal dirigido entre servicios
- **Riesgo**: Funcionalidad quebrada o bypass de seguridad
- **Explotación**: Acceso a APIs incorrectas

### 3. Credenciales en Texto Plano
- **Impacto**: Exposición de credenciales de base de datos
- **Riesgo**: Compromiso total de datos
- **Explotación**: Acceso directo a PostgreSQL

### 4. Logging Debug en Producción
- **Impacto**: Exposición de información sensible en logs
- **Riesgo**: Filtración de datos de negocio
- **Explotación**: Análisis de logs para extracción de datos

## 📊 MATRIZ DE DISCREPANCIAS

| Componente | Declarado | Real | Estado | Criticidad |
|---|---|---|---|---|
| Dockerfiles | ✅ Presente | ❌ Ausente | **CRÍTICO** | 🔴 |
| Puerto AgenteDepósito | 8001 | 8002 | **CRÍTICO** | 🔴 |
| Puerto AgenteNegocio | 8002 | 8001 | **CRÍTICO** | 🔴 |
| Scripts Deploy | ✅ Presente | ❌ Ausente | **ALTO** | 🟠 |
| Config Prometheus | ✅ Presente | ❌ Ausente | **MEDIO** | 🟡 |
| Dashboard Grafana | ✅ Presente | ❌ Ausente | **MEDIO** | 🟡 |
| Directorios Data | ✅ Presente | ❌ Ausente | **BAJO** | 🟢 |

## 🚨 RECOMENDACIONES DE INFRAESTRUCTURA

### PRIORIDAD 1 (CRÍTICO - Implementar YA):

#### 1.1 Crear Dockerfiles Faltantes:
```dockerfile
# Dockerfile.agente-deposito
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "agente_deposito.main_complete:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 1.2 Corregir Configuración de Puertos:
```nginx
# nginx/inventario-retail.conf - CORRECCIÓN
location /api/negocio/ {
    proxy_pass http://127.0.0.1:8002/;  # ✅ CORRECTO
}

location /api/deposito/ {
    proxy_pass http://127.0.0.1:8001/;  # ✅ CORRECTO
}
```

#### 1.3 Implementar Variables de Entorno Seguras:
```yaml
# docker-compose.production.yml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - REDIS_URL=${REDIS_URL}
  - LOG_LEVEL=INFO  # ✅ Apropiado para producción
```

### PRIORIDAD 2 (ALTO - Implementar esta semana):

#### 2.1 Scripts de Deploy:
```bash
#!/bin/bash
# scripts/deploy/deploy_production.sh
docker-compose -f docker-compose.production.yml up -d
docker-compose exec agente-deposito python scripts/health_check.py
```

#### 2.2 Configuración Monitoring:
```yaml
# monitoring/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  
scrape_configs:
  - job_name: 'agente-deposito'
    static_configs:
      - targets: ['localhost:8001']
```

### PRIORIDAD 3 (MEDIO - Implementar este mes):

#### 3.1 Dashboard Grafana Argentina:
- Métricas específicas para retail argentino
- Monitoreo de transacciones AFIP
- Alertas por stock crítico

#### 3.2 Backup Automatizado:
- Backup incremental de PostgreSQL
- Sincronización con storage externo
- Retención de 30 días

## 💾 EVIDENCIAS FORENSES

### Archivos de Configuración Inconsistentes:
- `docker-compose.development.yml` - Referencias a Dockerfiles inexistentes
- `nginx/inventario-retail.conf` - Puertos invertidos
- `systemd/*.service` - Configuración de puertos inconsistente

### Scripts de Deploy Fantasma:
- `.github/workflows/ci-cd.yml` - Referencias a scripts inexistentes
- `monitoring/setup_monitoring.sh` - Referencias a archivos de configuración faltantes

### Configuración de Red:
- Subnet planificada: `172.20.0.0/16`
- Nombres de red incorrectos (`banking_network` vs `retail_network`)

---

**CONCLUSIÓN**: La infraestructura de contenedores existe SOLO en configuración pero NO en implementación real. Las discrepancias de puertos y la ausencia de Dockerfiles representan un riesgo operacional crítico.

**SIGUIENTE FASE**: Análisis de ingeniería reversa ML/OCR (Prompt 5)