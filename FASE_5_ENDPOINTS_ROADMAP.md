# FASE 5: Integración de Endpoints Forensic - Roadmap

**Fecha**: Oct 24, 2025  
**Estado**: Próxima fase (FASE 4 ✅ COMPLETADA)  
**Duración Estimada**: 4-6 horas

---

## 📍 Punto de Partida

### FASE 0-4 Completadas ✅
- ✅ FASE 0: Staging repair + auditoría
- ✅ FASE 1: Dashboard FastAPI + Phase 1 forensic (2444 líneas)
- ✅ FASE 2: Phases 2-5 implementation (1256 líneas nuevas)
- ✅ FASE 3: Integration tests (87/87 PASS - 100%)
- ✅ FASE 4: CI/CD pipeline (GitHub Actions + Docker)

### Recursos Listos
- Forensic module: Completo con 5 phases operacionales
- Tests: 87 forensic tests + 217 dashboard tests
- CI/CD: GitHub Actions workflow con test-forensic job
- Docker: Dockerfile + docker-compose updated
- Documentation: VALIDACION_FASE_4_CI_CD.md + README

---

## 🎯 FASE 5 Objetivos

### Objetivo Principal
Integrar forensic module con Dashboard FastAPI mediante endpoints REST que expongan los análisis de phases 2-5.

### Resultados Esperados
1. **Endpoints REST** para invocar forensic analysis
2. **Integración** dashboard ↔ forensic_analysis
3. **Tests** para nuevos endpoints (401 auth + 200 success)
4. **Documentation** de API forensic

---

## 📋 Plan de Ejecución

### FASE 5.1: Endpoint Design (30 min)

**Endpoints a Implementar**:
```
POST /api/forensic/analyze
  Body: {data: {...}, phases: [2,3,4,5] }
  Return: {analysis_id, status, phases_completed}

GET /api/forensic/analysis/{id}
  Return: {phase_results, consolidated_findings, metrics}

GET /api/forensic/status/{id}
  Return: {status, progress, current_phase}

POST /api/forensic/export/{id}
  Query: ?format=json|csv|html
  Return: File download
```

**Security**:
- ✅ Require X-API-Key header (ya existe)
- ✅ Rate limiting (toggle DASHBOARD_RATELIMIT_ENABLED)
- ✅ Request validation + sanitization

### FASE 5.2: Endpoint Implementation (90 min)

**Archivo**: `inventario-retail/web_dashboard/api/forensic_endpoints.py` (NUEVO)

**Contenido Esperado**:
```python
from fastapi import APIRouter, Depends, HTTPException, Query
from inventario-retail.forensic_analysis.orchestrator import ForensicOrchestrator

router = APIRouter(prefix="/api/forensic", tags=["forensic"])

@router.post("/analyze")
async def start_forensic_analysis(
    data: dict,
    phases: List[int] = Query([2,3,4,5]),
    api_key: str = Header(...)
):
    """Inicia análisis forensic con fases especificadas"""
    # Validación de API key (ya existe middleware)
    # Invocar orchestrator
    # Retornar analysis_id
    
@router.get("/analysis/{analysis_id}")
async def get_analysis_results(analysis_id: str, api_key: str = Header(...)):
    """Retorna resultados del análisis"""
    # Recuperar resultados
    # Retornar phases results consolidados

# ... más endpoints
```

**Lineas Estimadas**: 200-250 líneas

**Dependencias**: 
- ForensicOrchestrator (ya existe)
- dashboard_app.py router registration
- Test fixtures para mock data

### FASE 5.3: Dashboard Integration (60 min)

**Archivo**: `inventario-retail/web_dashboard/dashboard_app.py` (UPDATE)

**Cambios**:
```python
# 1. Import nuevo router
from api.forensic_endpoints import router as forensic_router

# 2. Registrar router en app
app.include_router(forensic_router)

# 3. Agregar endpoint de listado
@app.get("/api/forensic/list")
async def list_analyses(api_key: str = Header(...)):
    """Lista análisis disponibles"""
    # Retornar lista de analysis_ids
```

**Integración con Auth**:
- ✅ X-API-Key middleware (ya existe)
- ✅ Rate limiting (toggle)
- ✅ Structured logging con request_id

### FASE 5.4: Testing (90 min)

**Archivo**: `tests/web_dashboard/test_forensic_endpoints.py` (NUEVO)

**Test Cases** (25-30 tests):
```
Authentication Tests:
  - POST /api/forensic/analyze sin API key → 401
  - GET /api/forensic/analysis/{id} sin API key → 401
  - Con API key inválida → 401

Analysis Invocation:
  - POST /api/forensic/analyze con data válida → 202 (async)
  - Verificar analysis_id retornado
  - Verificar phases ejecutadas

Analysis Retrieval:
  - GET /api/forensic/analysis/{id} → 200
  - Verificar estructura de response
  - Verificar todas las phases presentes

Export:
  - POST /api/forensic/export/{id}?format=json → 200 + JSON file
  - POST /api/forensic/export/{id}?format=csv → 200 + CSV file
  - POST /api/forensic/export/{id}?format=html → 200 + HTML file

Rate Limiting:
  - Si DASHBOARD_RATELIMIT_ENABLED=true → Rate limit enforced
  - Exceder límite → 429

Error Handling:
  - Invalid analysis_id → 404
  - Malformed data → 400
  - Server error → 500
```

**Coverage**: Target 85%+

### FASE 5.5: Documentation (30 min)

**Archivo**: `API_DOCUMENTATION_FORENSIC.md` (NUEVO)

**Contenido**:
- Endpoint descriptions
- Request/Response examples
- Error codes
- Rate limiting info
- Authentication

---

## 🛠 Dependencias Internas

### Ya Disponibles
- ✅ ForensicOrchestrator (orchestrator.py)
- ✅ Phase implementations (phases/phase_*.py)
- ✅ API key middleware (dashboard_app.py)
- ✅ Rate limiting (dashboard_app.py)
- ✅ Structured logging (dashboard_app.py)

### A Crear
- ⚠️ forensic_endpoints.py (router)
- ⚠️ test_forensic_endpoints.py (tests)
- ⚠️ API_DOCUMENTATION_FORENSIC.md

---

## 📊 Estimación de Ejecución

| Subtarea | Tiempo | Archivos | Tests |
|----------|--------|----------|-------|
| 5.1: Design | 30 min | - | - |
| 5.2: Implementation | 90 min | 1 nuevo | 0 |
| 5.3: Dashboard Integration | 60 min | 1 modify | 0 |
| 5.4: Testing | 90 min | 1 nuevo | 25-30 |
| 5.5: Documentation | 30 min | 1 nuevo | 0 |
| **TOTAL** | **300 min (5h)** | **3 new + 1 modify** | **25-30** |

---

## ✨ Deliverables FASE 5

### Code
1. `inventario-retail/web_dashboard/api/forensic_endpoints.py` (250 líneas)
2. `tests/web_dashboard/test_forensic_endpoints.py` (300 líneas)
3. `inventario-retail/web_dashboard/dashboard_app.py` (actualizado, +10 líneas)
4. `API_DOCUMENTATION_FORENSIC.md` (150 líneas)

### Tests
- 25-30 nuevos tests
- Coverage: 85%+
- All tests PASS: ✅

### Git Commits
- Commit 1: "FASE 5.1-5.2: Forensic endpoints implementation"
- Commit 2: "FASE 5.3-5.4: Dashboard integration + tests"
- Commit 3: "FASE 5.5: Documentation"

---

## 🚀 Continuación Automática

**Después de FASE 5**:

### FASE 6: Monitoring & Alerting
- Prometheus endpoint configuration
- Grafana dashboards
- Alert rules

### FASE 7: Production Validation
- Load testing
- Security audit
- Deployment runbook

### FASE 8: Go-Live
- Staging verification
- Production deployment
- Monitoring verification

---

## 📌 Notas Importantes

### Bloqueos Conocidos
- ❌ Ninguno - todas las dependencias disponibles

### Tech Debt
- TD-003: datetime.utcnow() deprecation (52 warnings)
  - **Acción FASE 6**: Migrar a datetime.now(UTC)
- TD-004: Dashboard coverage gaps (9 tests)
  - **Acción FASE 5**: Nueva cobertura desde forensic endpoints

### Performance
- Forensic analysis es **CPU-intensive**
- Considerar **async processing** para analyses largas
- Queue mechanism (Celery/RQ) para futuro

---

## ✅ Checklist para Iniciar FASE 5

- ✅ FASE 4 completada (CI/CD pipeline)
- ✅ Tests forensic: 87/87 PASS
- ✅ ForensicOrchestrator operacional
- ✅ Dashboard FastAPI ready
- ✅ API key middleware funcional
- ✅ Docker build passing

**Listo para FASE 5**: ✅ SÍ

---

**Documento preparado por**: GitHub Copilot  
**Para iniciar FASE 5**: Ejecutar "CONTINUA.." nuevamente
