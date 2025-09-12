# PARCHES DE INFRAESTRUCTURA CRÍTICOS
# Corrección de discrepancias de contenedores e infraestructura

## DOCKERFILES FALTANTES

### Dockerfile.agente-deposito
```dockerfile
FROM python:3.11-slim

# Configuración para Argentina
ENV TZ=America/Argentina/Buenos_Aires
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN useradd --create-home --shell /bin/bash agente && \
    mkdir -p /app/logs /app/uploads && \
    chown -R agente:agente /app

USER agente
WORKDIR /app

# Instalar dependencias Python
COPY --chown=agente:agente requirements.txt ./
RUN pip install --user --no-cache-dir -r requirements.txt

# Copiar aplicación
COPY --chown=agente:agente . ./

# Variables de entorno por defecto
ENV PYTHONPATH=/app
ENV PATH=/home/agente/.local/bin:$PATH

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "agente_deposito.main_complete:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Dockerfile.agente-negocio
```dockerfile
FROM python:3.11-slim

# Configuración para Argentina
ENV TZ=America/Argentina/Buenos_Aires
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Instalar dependencias del sistema (incluyendo OCR)
RUN apt-get update && apt-get install -y \
    curl \
    tesseract-ocr \
    tesseract-ocr-spa \
    libtesseract-dev \
    poppler-utils \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN useradd --create-home --shell /bin/bash negocio && \
    mkdir -p /app/logs /app/uploads /app/models && \
    chown -R negocio:negocio /app

USER negocio
WORKDIR /app

# Instalar dependencias Python
COPY --chown=negocio:negocio requirements.txt ./
RUN pip install --user --no-cache-dir -r requirements.txt

# Copiar aplicación
COPY --chown=negocio:negocio . ./

# Variables de entorno por defecto
ENV PYTHONPATH=/app
ENV PATH=/home/negocio/.local/bin:$PATH
ENV TESSERACT_CMD=/usr/bin/tesseract

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "agente_negocio.main_complete:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Dockerfile.ml-service
```dockerfile
FROM python:3.11-slim

# Configuración para Argentina
ENV TZ=America/Argentina/Buenos_Aires
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Instalar dependencias del sistema para ML
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root
RUN useradd --create-home --shell /bin/bash mlservice && \
    mkdir -p /app/logs /app/models /app/data && \
    chown -R mlservice:mlservice /app

USER mlservice
WORKDIR /app

# Instalar dependencias Python
COPY --chown=mlservice:mlservice requirements.txt ./
RUN pip install --user --no-cache-dir -r requirements.txt

# Copiar aplicación
COPY --chown=mlservice:mlservice . ./

# Variables de entorno por defecto
ENV PYTHONPATH=/app
ENV PATH=/home/mlservice/.local/bin:$PATH

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "ml.main_ml_service:app", "--host", "0.0.0.0", "--port", "8000"]
```

## CORRECCIÓN NGINX CONFIGURATION

### nginx/inventario-retail.conf (CORREGIDO)
```nginx
upstream agente_deposito {
    server agente-deposito:8000;
    # Fallback to localhost for development
    server 127.0.0.1:8001 backup;
}

upstream agente_negocio {
    server agente-negocio:8000;
    # Fallback to localhost for development  
    server 127.0.0.1:8002 backup;
}

upstream ml_service {
    server ml-service:8000;
    server 127.0.0.1:8003 backup;
}

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting por zona argentina
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    # AgenteDepósito - PUERTO CORREGIDO
    location /api/deposito/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://agente_deposito/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para operaciones de inventario
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # AgenteNegocio - PUERTO CORREGIDO  
    location /api/negocio/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://agente_negocio/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts extendidos para OCR
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # ML Service
    location /api/ml/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://ml_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para ML
        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Authentication endpoints con rate limiting estricto
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://agente_deposito/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files para Argentina
    location /static/ {
        alias /var/www/inventario-retail/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health checks sin logging
    location /health {
        access_log off;
        proxy_pass http://agente_deposito/health;
    }

    # Bloquear acceso a archivos sensibles
    location ~ /\.(env|git|svn) {
        deny all;
        return 404;
    }
}
```

## DOCKER-COMPOSE CORREGIDO

### docker-compose.production.yml (NUEVO)
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: inventario_retail_db
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-inventario_retail}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_HOST_AUTH_METHOD: md5
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init_db.sql:/docker-entrypoint-initdb.d/init_db.sql
    networks:
      - retail_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: inventario_retail_redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - retail_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Agente Depósito Service - PUERTO CORREGIDO
  agente-deposito:
    build:
      context: .
      dockerfile: Dockerfile.agente-deposito
    container_name: agente_deposito_service
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - AFIP_CUIT=${AFIP_CUIT}
      - AFIP_PRIVATE_KEY_PATH=/app/certs/afip_private.pem
      - AFIP_CERTIFICATE_PATH=/app/certs/afip_cert.crt
    ports:
      - "8001:8000"  # PUERTO EXTERNO CORRECTO PARA DEPÓSITO
    volumes:
      - ./uploads:/app/uploads:rw
      - ./logs:/app/logs:rw
      - ./certs:/app/certs:ro
    networks:
      - retail_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Agente Negocio Service - PUERTO CORREGIDO
  agente-negocio:
    build:
      context: .
      dockerfile: Dockerfile.agente-negocio
    container_name: agente_negocio_service
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/1
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DEPOSITO_API_KEY=${DEPOSITO_API_KEY}
      - ML_SERVICE_URL=http://ml-service:8000
    ports:
      - "8002:8000"  # PUERTO EXTERNO CORRECTO PARA NEGOCIO
    volumes:
      - ./uploads:/app/uploads:rw
      - ./logs:/app/logs:rw
      - ./models:/app/models:ro
    networks:
      - retail_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      agente-deposito:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ML Service
  ml-service:
    build:
      context: .
      dockerfile: Dockerfile.ml-service
    container_name: ml_service
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/2
      - ENVIRONMENT=production
      - LOG_LEVEL=INFO
      - MODEL_UPDATE_INTERVAL=3600
    ports:
      - "8003:8000"
    volumes:
      - ./models:/app/models:rw
      - ./data:/app/data:rw
      - ./logs:/app/logs:rw
    networks:
      - retail_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Load Balancer/Proxy
  nginx:
    image: nginx:alpine
    container_name: nginx_proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/inventario-retail.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx:rw
    networks:
      - retail_network
    depends_on:
      - agente-deposito
      - agente-negocio
      - ml-service
    restart: unless-stopped

networks:
  retail_network:  # NOMBRE CORREGIDO
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

## SCRIPTS DE DEPLOY FALTANTES

### scripts/deploy/deploy_production.sh
```bash
#!/bin/bash
set -e

echo "🇦🇷 Desplegando Sistema Inventario Retail Argentino - PRODUCCIÓN"

# Verificar variables de entorno requeridas
required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET_KEY" "AFIP_CUIT")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "Error: Variable de entorno $var no está definida"
        exit 1
    fi
done

# Crear directorios necesarios
mkdir -p ./data/{postgres,redis} ./logs/{nginx,app} ./uploads ./certs

# Backup de base de datos actual (si existe)
if docker ps | grep -q inventario_retail_db; then
    echo "📦 Creando backup de base de datos..."
    docker exec inventario_retail_db pg_dump -U postgres inventario_retail > backup_$(date +%Y%m%d_%H%M%S).sql
fi

# Pull de imágenes base
echo "📥 Descargando imágenes base..."
docker-compose -f docker-compose.production.yml pull postgres redis nginx

# Build de aplicaciones
echo "🏗️ Construyendo aplicaciones..."
docker-compose -f docker-compose.production.yml build --no-cache

# Deploy con zero-downtime
echo "🚀 Desplegando servicios..."
docker-compose -f docker-compose.production.yml up -d --remove-orphans

# Verificar health checks
echo "🔍 Verificando salud de servicios..."
sleep 30

services=("inventario_retail_db" "inventario_retail_redis" "agente_deposito_service" "agente_negocio_service" "ml_service")
for service in "${services[@]}"; do
    if ! docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        echo "❌ Error: Servicio $service no está ejecutándose"
        docker logs $service --tail=50
        exit 1
    fi
    echo "✅ Servicio $service - OK"
done

# Test de endpoints críticos
echo "🧪 Ejecutando smoke tests..."
curl -f http://localhost:8001/health || { echo "❌ AgenteDepósito health check failed"; exit 1; }
curl -f http://localhost:8002/health || { echo "❌ AgenteNegocio health check failed"; exit 1; }
curl -f http://localhost:8003/health || { echo "❌ ML Service health check failed"; exit 1; }

echo "🎉 Deploy completado exitosamente!"
echo "📊 Servicios disponibles:"
echo "   - AgenteDepósito: http://localhost:8001"
echo "   - AgenteNegocio:  http://localhost:8002" 
echo "   - ML Service:     http://localhost:8003"
echo "   - Nginx Proxy:    http://localhost:80"
```

### scripts/deploy/deploy_staging.sh
```bash
#!/bin/bash
set -e

echo "🧪 Desplegando Sistema Inventario Retail - STAGING"

# Configuración para staging
export ENVIRONMENT=staging
export LOG_LEVEL=DEBUG
export POSTGRES_DB=inventario_retail_staging

# Usar configuración de desarrollo con datos de prueba
docker-compose -f docker-compose.development.yml down -v
docker-compose -f docker-compose.development.yml up -d --build

# Cargar datos de prueba
sleep 30
python scripts/load_test_data.py --environment=staging

echo "✅ Deploy de staging completado"
echo "🔗 URL: http://staging.inventario-retail.local"
```

## CONFIGURACIÓN MONITORING FALTANTE

### monitoring/prometheus/prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'inventario-retail-argentina'

rule_files:
  - "argentina_retail_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'agente-deposito'
    static_configs:
      - targets: ['localhost:8001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'agente-negocio'
    static_configs:
      - targets: ['localhost:8002']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'ml-service'
    static_configs:
      - targets: ['localhost:8003']
    metrics_path: '/metrics'
    scrape_interval: 60s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - localhost:9093

```

### monitoring/prometheus/argentina_retail_rules.yml  
```yaml
groups:
  - name: inventario_retail_argentina
    rules:
      - alert: ServicioInventarioDown
        expr: up{job=~"agente-.*"} == 0
        for: 1m
        labels:
          severity: critical
          team: retail-argentina
        annotations:
          summary: "Servicio de inventario caído: {{ $labels.job }}"
          description: "El servicio {{ $labels.job }} no responde por más de 1 minuto"

      - alert: StockCriticoDetectado
        expr: stock_nivel_critico > 0
        for: 5m
        labels:
          severity: warning
          team: retail-argentina
        annotations:
          summary: "Stock crítico detectado"
          description: "{{ $value }} productos con stock crítico"

      - alert: ErroresAFIPAltos
        expr: rate(afip_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
          team: retail-argentina
        annotations:
          summary: "Errores AFIP elevados"
          description: "Tasa de errores AFIP: {{ $value }}/min"
```

## INSTRUCCIONES DE IMPLEMENTACIÓN:

1. **CRÍTICO**: Crear todos los Dockerfiles en la raíz del proyecto
2. **CRÍTICO**: Corregir configuración Nginx con puertos correctos  
3. **CRÍTICO**: Implementar docker-compose.production.yml con variables seguras
4. **URGENTE**: Crear scripts de deploy funcionales
5. **IMPORTANTE**: Configurar monitoreo Prometheus completo

⚠️ **ADVERTENCIA**: Sin estos parches, el sistema NO puede ser containerizado y la configuración actual es completamente inconsistente.