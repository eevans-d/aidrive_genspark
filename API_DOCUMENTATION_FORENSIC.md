# API Documentation: Forensic Analysis Endpoints

**Versión**: 1.0  
**Estado**: ✅ Production Ready (FASE 5)  
**Base URL**: `/api/forensic`  
**Autenticación**: X-API-Key header (required)

---

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Endpoints](#endpoints)
3. [Modelos de Datos](#modelos-de-datos)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Códigos de Error](#códigos-de-error)
6. [Rate Limiting](#rate-limiting)

---

## Autenticación

Todos los endpoints requieren el header **X-API-Key** con un API key válido.

### Header Requerido
```
X-API-Key: your-api-key-here
```

### Ejemplo de Request
```bash
curl -X POST http://localhost:8080/api/forensic/analyze \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Respuesta de Error (sin API key)
```json
{
  "detail": "X-API-Key header required"
}
```

---

## Endpoints

### 1. POST `/api/forensic/analyze`

**Descripción**: Inicia un análisis forensic asincrónico

**Status Code**: `202 Accepted` (análisis en cola)

**Request Body**:
```json
{
  "data": {
    "providers": [
      {"id": 1, "name": "Supplier A"},
      {"id": 2, "name": "Supplier B"}
    ],
    "transactions": [
      {"id": 1, "amount": 100.0, "provider_id": 1},
      {"id": 2, "amount": 200.0, "provider_id": 2}
    ],
    "inventory": [
      {"sku": "SKU001", "quantity": 50, "provider_id": 1}
    ]
  },
  "phases": [2, 3, 4, 5],
  "name": "Daily Forensic Check"
}
```

**Response (202)**:
```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "created_at": "2025-10-24T10:00:00",
  "message": "Analysis started, check status with GET /api/forensic/status/{analysis_id}"
}
```

**Parámetros**:
- `data` (required): Datos a analizar con estructura definida
- `phases` (optional): Array de fases [2, 3, 4, 5] (default: all)
  - 2 = Consistency Check
  - 3 = Pattern Analysis
  - 4 = Performance Metrics
  - 5 = Reporting
- `name` (optional): Nombre descriptivo del análisis

---

### 2. GET `/api/forensic/status/{analysis_id}`

**Descripción**: Obtiene el estado actual de un análisis

**Status Code**: `200 OK`

**Response**:
```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "progress": 45,
  "current_phase": 3,
  "created_at": "2025-10-24T10:00:00",
  "updated_at": "2025-10-24T10:01:30",
  "error": null
}
```

**Estados Posibles**:
- `pending`: Análisis en cola, no iniciado
- `running`: Análisis en ejecución
- `completed`: Análisis completado exitosamente
- `failed`: Análisis falló, revisar campo `error`

**Parámetros**:
- `analysis_id` (path, required): ID del análisis

---

### 3. GET `/api/forensic/analysis/{analysis_id}`

**Descripción**: Obtiene el resultado completo de un análisis

**Status Code**: `200 OK` (completado), `202 Accepted` (en progreso), `400 Bad Request` (falló)

**Response (200 - Completado)**:
```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Daily Forensic Check",
  "status": "completed",
  "phases_completed": [2, 3, 4, 5],
  "phases_results": [
    {
      "phase": 2,
      "phase_name": "Phase 2",
      "status": "success",
      "summary": {
        "integrity_score": 95,
        "issues_found": 2,
        "critical_issues": 0
      },
      "metrics": {
        "provider_consistency": 98,
        "orphaned_transactions": 0
      },
      "recommendations": [
        "Review provider SKU mapping",
        "Update inventory timestamp"
      ],
      "execution_time_ms": 125.5
    },
    {
      "phase": 3,
      "phase_name": "Phase 3",
      "status": "success",
      "summary": {
        "anomalies_detected": 3,
        "risk_level": "LOW"
      },
      "execution_time_ms": 85.3
    }
  ],
  "consolidated_findings": {
    "summary": "Analysis completed successfully",
    "overall_health": "GOOD"
  },
  "health_score": 92,
  "recommendations": [
    "Implement automated consistency checks",
    "Review pattern analysis results monthly"
  ],
  "created_at": "2025-10-24T10:00:00",
  "completed_at": "2025-10-24T10:02:15",
  "execution_time_ms": 135.8
}
```

---

### 4. GET `/api/forensic/list`

**Descripción**: Lista todos los análisis disponibles

**Status Code**: `200 OK`

**Response**:
```json
{
  "analyses": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660f9511-f30c-52e5-b827-557766551111"
  ],
  "count": 2,
  "statuses": {
    "completed": 1,
    "running": 1
  }
}
```

---

### 5. POST `/api/forensic/export/{analysis_id}`

**Descripción**: Exporta un análisis en formato especificado

**Status Code**: `200 OK` (éxito), `400 Bad Request` (análisis no completado), `404 Not Found` (no existe)

**Query Parameters**:
- `format` (required): `json`, `csv`, `html`

**Response**:
```json
{
  "success": true,
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "format": "csv",
  "message": "Análisis exportado en formato csv",
  "file_size_kb": 45.2,
  "exported_at": "2025-10-24T10:05:00"
}
```

**Ejemplo**:
```bash
curl -X POST "http://localhost:8080/api/forensic/export/550e8400-e29b-41d4-a716-446655440000?format=csv" \
  -H "X-API-Key: your-api-key-here"
```

---

### 6. GET `/api/forensic/health`

**Descripción**: Health check del módulo forensic

**Status Code**: `200 OK`

**Response**:
```json
{
  "status": "healthy",
  "active_analyses": 2,
  "completed_analyses": 15,
  "total_analyses": 17,
  "timestamp": "2025-10-24T10:05:30"
}
```

---

### 7. GET `/api/forensic/metrics`

**Descripción**: Métricas de rendimiento del módulo forensic

**Status Code**: `200 OK`

**Response**:
```json
{
  "total_analyses": 17,
  "completed": 15,
  "failed": 2,
  "success_rate": 88.2,
  "avg_execution_time_ms": 250.5,
  "by_phase": {
    "2": {
      "name": "consistency_check",
      "count": 15
    },
    "3": {
      "name": "pattern_analysis",
      "count": 15
    },
    "4": {
      "name": "performance_metrics",
      "count": 15
    },
    "5": {
      "name": "reporting",
      "count": 15
    }
  }
}
```

---

## Modelos de Datos

### AnalysisRequest

```python
{
  "data": {
    "providers": List[{"id": int, "name": str, ...}],
    "transactions": List[{"id": int, "amount": float, ...}],
    "inventory": List[{"sku": str, "quantity": int, ...}]
  },
  "phases": List[int] = [2, 3, 4, 5],
  "name": Optional[str] = None
}
```

### AnalysisStatus

```python
{
  "analysis_id": str,
  "status": str,  # pending | running | completed | failed
  "progress": int,  # 0-100
  "current_phase": Optional[int],
  "created_at": datetime,
  "updated_at": datetime,
  "error": Optional[str]
}
```

### AnalysisResult

```python
{
  "analysis_id": str,
  "name": Optional[str],
  "status": str,  # completed
  "phases_completed": List[int],
  "phases_results": List[PhaseResult],
  "consolidated_findings": dict,
  "health_score": int,  # 0-100
  "recommendations": List[str],
  "created_at": datetime,
  "completed_at": Optional[datetime],
  "execution_time_ms": float
}
```

### PhaseResult

```python
{
  "phase": int,
  "phase_name": str,
  "status": str,  # success | failed | skipped
  "summary": dict,
  "metrics": Optional[dict],
  "recommendations": Optional[List[str]],
  "execution_time_ms": float
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Flujo Completo

```bash
# 1. Iniciar análisis
RESPONSE=$(curl -s -X POST http://localhost:8080/api/forensic/analyze \
  -H "X-API-Key: my-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "providers": [{"id": 1, "name": "Supplier A"}],
      "transactions": [{"id": 1, "amount": 100.0}],
      "inventory": [{"sku": "SKU1", "quantity": 50}]
    },
    "phases": [2, 3, 4, 5]
  }')

ANALYSIS_ID=$(echo $RESPONSE | jq -r '.analysis_id')
echo "Análisis iniciado: $ANALYSIS_ID"

# 2. Verificar status
curl -s -X GET http://localhost:8080/api/forensic/status/$ANALYSIS_ID \
  -H "X-API-Key: my-api-key" | jq .

# 3. Obtener resultado (cuando esté completado)
curl -s -X GET http://localhost:8080/api/forensic/analysis/$ANALYSIS_ID \
  -H "X-API-Key: my-api-key" | jq .

# 4. Exportar resultado
curl -s -X POST "http://localhost:8080/api/forensic/export/$ANALYSIS_ID?format=json" \
  -H "X-API-Key: my-api-key" | jq .
```

### Ejemplo 2: Python Client

```python
import requests
from time import sleep

API_KEY = "your-api-key"
BASE_URL = "http://localhost:8080/api/forensic"
HEADERS = {"X-API-Key": API_KEY}

# 1. Iniciar análisis
data = {
    "data": {
        "providers": [{"id": 1, "name": "Supplier"}],
        "transactions": [{"id": 1, "amount": 100}],
        "inventory": [{"sku": "SKU1", "quantity": 50}]
    },
    "phases": [2, 3, 4, 5],
    "name": "Python Test"
}

response = requests.post(f"{BASE_URL}/analyze", json=data, headers=HEADERS)
analysis_id = response.json()["analysis_id"]
print(f"Analysis ID: {analysis_id}")

# 2. Esperar completación
while True:
    status = requests.get(f"{BASE_URL}/status/{analysis_id}", headers=HEADERS).json()
    print(f"Progress: {status['progress']}% - Status: {status['status']}")
    
    if status['status'] in ['completed', 'failed']:
        break
    sleep(0.5)

# 3. Obtener resultado
result = requests.get(f"{BASE_URL}/analysis/{analysis_id}", headers=HEADERS).json()
print(f"Health Score: {result['health_score']}")
```

---

## Códigos de Error

| Código | Significado | Ejemplo |
|--------|------------|---------|
| 200 | OK | Endpoint completado exitosamente |
| 202 | Accepted | Análisis iniciado, en progreso |
| 400 | Bad Request | Datos inválidos o análisis falló |
| 401 | Unauthorized | API key inválida o ausente |
| 404 | Not Found | Análisis no existe |
| 422 | Unprocessable Entity | Validación de request falló |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error del servidor |

### Respuesta de Error

```json
{
  "detail": "Descripción del error"
}
```

---

## Rate Limiting

El rate limiting está controlado por la variable `DASHBOARD_RATELIMIT_ENABLED`.

**Si habilitado**:
- Límite por defecto: 100 requests por 60 segundos
- Response 429 si se excede el límite

**Headers de Rate Limiting** (cuando está habilitado):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1729772460
```

---

## FAQ

### ¿Cuánto tiempo toma un análisis?
Típicamente 1-5 segundos dependiendo del volumen de datos. Usa `GET /status/{id}` para trackear progreso.

### ¿Qué fases debo usar?
- **Phases 2-3**: Análisis rápido (consistency + patterns)
- **Phases 2-5**: Análisis completo (incluye performance + reporting)

### ¿Puedo cancelar un análisis?
Actualmente no hay endpoint para cancelar. Los análisis se ejecutan siempre hasta completarse o fallar.

### ¿Dónde se almacenan los resultados?
En v1.0, se almacenan en memoria. Para producción, migrar a base de datos (ver FASE 6).

---

## Support & Changelog

**Versión 1.0 (Oct 24, 2025)**
- Initial release
- 6 endpoints implementados
- 30 tests de cobertura
- Autenticación con X-API-Key
- Rate limiting support

**Planeado FASE 6**
- Persistencia en database
- Real-time websocket updates
- Scheduled analyses
- Advanced filtering & pagination

---

**Documentación preparada por**: GitHub Copilot  
**Último update**: Oct 24, 2025
