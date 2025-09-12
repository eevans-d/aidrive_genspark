# DIVERGENCIAS DE CONFIGURACIÓN: COMPOSE vs K8S vs NGINX
## Análisis de Alineación y Inconsistencias Críticas

### 🔄 MATRIZ DE PUERTOS Y SERVICIOS

| Servicio | Docker Compose | Kubernetes | Nginx Proxy | Estado |
|----------|---------------|------------|-------------|---------|
| **PostgreSQL** | 5432:5432 | 5432 | N/A | ✅ Alineado |
| **Redis** | 6379:6379 | 6379 | N/A | ✅ Alineado |
| **Agente Depósito** | 8001:8000 | 8000 (containerPort) | ❌ proxy_pass → 8002 | 🔴 CRÍTICO |
| **Agente Negocio** | 8002:8000 | 8000 (containerPort) | ❌ proxy_pass → 8001 | 🔴 CRÍTICO |
| **ML Service** | 8003:8000 | ❌ NO DEFINIDO | ❌ NO PROXY | 🔴 FALTANTE |
| **Scheduler Reports** | No expuesto | ❌ NO DEFINIDO | N/A | ⚠️ OK |
| **Scheduler Maintenance** | No expuesto | ❌ NO DEFINIDO | N/A | ⚠️ OK |

### 🚨 PROBLEMA CRÍTICO: NGINX PROXY INVERSO INCORRECTO

#### **Configuración Actual en `nginx/inventario-retail.conf`:**
```nginx
# ❌ INCORRECTO - Rutas invertidas
location /api/negocio/ {
    proxy_pass http://127.0.0.1:8001/;    # Debería ser 8002
}

location /api/deposito/ {
    proxy_pass http://127.0.0.1:8002/;    # Debería ser 8001
}
```

#### **Impacto en Producción:**
- **❌ Requests a `/api/negocio/` llegan a AgenteDepósito**
- **❌ Requests a `/api/deposito/` llegan a AgenteNegocio**
- **❌ Fallas de ruteo en producción garantizadas**

---

### 🏗️ ANÁLISIS DETALLADO KUBERNETES vs DOCKER COMPOSE

#### **Variables de Entorno - Comparativa:**

| Variable | Docker Compose | Kubernetes | Observaciones |
|----------|---------------|------------|---------------|
| **DATABASE_URL** | Hardcoded string | Interpolación `$(POSTGRES_USER)` | K8s más seguro |
| **Database Name** | `sistema_bancario` | `$(POSTGRES_DB)` desde ConfigMap | Inconsistente |
| **Redis Password** | Sin password | `$(REDIS_PASSWORD)` | K8s más seguro |
| **Service Discovery** | Container names | K8s Service names | Diferentes namespaces |

#### **Recursos - Kubernetes vs Docker Compose:**

```yaml
# Kubernetes (más restrictivo)
resources:
  requests:
    memory: "256Mi"    # Mínimo garantizado
    cpu: "250m"        # 0.25 CPU cores
  limits:
    memory: "512Mi"    # Máximo permitido
    cpu: "500m"        # 0.5 CPU cores

# Docker Compose (sin límites definidos)
# Puede consumir todos los recursos del host
```

#### **Health Checks - Diferencias:**

| Servicio | Docker Compose | Kubernetes | Consistency |
|----------|---------------|------------|-------------|
| **Agente Depósito** | `curl -f /health` | `httpGet: /health` | ✅ Alineado |
| **Agente Negocio** | `curl -f /health` | `httpGet: /health` | ✅ Alineado |
| **ML Service** | `curl -f /health` | ❌ NO DEFINIDO | 🔴 Faltante |

---

### 📊 CONFIGURACIÓN DE NETWORKING

#### **Docker Compose Networking:**
```yaml
networks:
  banking_network:
    driver: bridge    # Red local simple
```

#### **Kubernetes Networking:**
```yaml
# Servicios expuestos vía ClusterIP
# Sin NetworkPolicies definidas
# Sin Ingress Controller configurado
```

#### **Implicaciones de Seguridad:**
- **Docker Compose:** Red plana, todos los servicios se ven entre sí
- **Kubernetes:** Aislamiento por namespace, pero sin políticas restrictivas

---

### 🔧 CONFIGURACIONES FALTANTES EN KUBERNETES

#### **1. ML Service Deployment (CRÍTICO)**
```yaml
# FALTA AGREGAR A k8s/04-microservices.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-service
  namespace: retail-argentina
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ml-service
  template:
    metadata:
      labels:
        app: ml-service
    spec:
      containers:
      - name: ml-service
        image: retail-argentina/ml-service:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: ml-service
  namespace: retail-argentina
spec:
  selector:
    app: ml-service
  ports:
  - port: 8000
    targetPort: 8000
```

#### **2. Scheduler Services (RECOMENDADO)**
```yaml
# Schedulers como CronJobs en lugar de Deployments
apiVersion: batch/v1
kind: CronJob
metadata:
  name: scheduler-reports
  namespace: retail-argentina
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: scheduler-reports
            image: retail-argentina/scheduler:latest
            env:
            - name: SCHEDULER_TYPE
              value: "reports"
          restartPolicy: OnFailure
```

---

### 🔒 ANÁLISIS DE SEGURIDAD Y SECRETS

#### **Docker Compose (Menos Seguro):**
```yaml
environment:
  - DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/sistema_bancario
  # ❌ Passwords en texto plano en archivos
```

#### **Kubernetes (Más Seguro):**
```yaml
envFrom:
- configMapRef:
    name: retail-config
- secretRef:
    name: retail-secrets  # ✅ Secrets encriptados
```

#### **Recomendación de Mejora:**
```yaml
# Docker Compose mejorado
environment:
  - DATABASE_URL=${DATABASE_URL}
  - REDIS_URL=${REDIS_URL}
# Con .env file para secrets
```

---

### 📋 PLAN DE ALINEACIÓN PRIORITIZADO

#### **🔴 PRIORIDAD CRÍTICA (INMEDIATA):**
1. **Corregir Nginx proxy_pass** - 5 minutos
   ```bash
   # Editar nginx/inventario-retail.conf
   sed -i 's|/api/negocio/.*proxy_pass.*8001|/api/negocio/ { proxy_pass http://127.0.0.1:8002/|' nginx/inventario-retail.conf
   sed -i 's|/api/deposito/.*proxy_pass.*8002|/api/deposito/ { proxy_pass http://127.0.0.1:8001/|' nginx/inventario-retail.conf
   ```

#### **🟡 PRIORIDAD ALTA (1-2 días):**
2. **Agregar ML Service a Kubernetes** - 30 minutos
3. **Secrets management en Docker Compose** - 1 hora
4. **Alinear nombres de BD** - 15 minutos

#### **🟢 PRIORIDAD MEDIA (1 semana):**
5. **NetworkPolicies en Kubernetes** - 2 horas
6. **Resource limits en Docker Compose** - 30 minutos
7. **Schedulers como CronJobs** - 1 hora

---

### ✅ COMANDOS DE VALIDACIÓN POST-CORRECCIÓN

```bash
# Validar rutas Nginx
curl -v http://localhost/api/deposito/health
curl -v http://localhost/api/negocio/health

# Verificar K8s services
kubectl get services -n retail-argentina
kubectl get deployments -n retail-argentina

# Test de conectividad inter-servicios
kubectl exec -it agente-negocio-xxx -- curl http://agente-deposito:8000/health
```

---
**🎯 RESULTADO ESPERADO:** Configuración consistente entre entornos, eliminando discrepancias que causan fallas en producción.