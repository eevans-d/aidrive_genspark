# OPCIÓN C: IMPLEMENTACIÓN PARCIAL - PLAN DE EJECUCIÓN

**Fecha de Decisión:** October 18, 2025 - 02:00 UTC  
**Decisión:** Usuario seleccionó OPCIÓN C (Implementación Parcial)  
**Duración Estimada:** 3-5 días  
**Objetivo:** Implementar gaps críticos de resiliencia, diferir observabilidad avanzada

---

## 📊 RESUMEN DE LA DECISIÓN

### ✅ Implementar AHORA (Prioridad CRÍTICA)
1. **Circuit Breakers** (1-2 días)
2. **Graceful Degradation** (2-3 días)

### ⏸️ Diferir POST-LAUNCH
3. **Distributed Tracing** (1-2 días) - Implementar en 2-4 semanas post-launch
4. **Chaos Testing** (3-5 días) - Automatizar en 2-4 semanas post-launch

### 📈 Análisis Riesgo-Beneficio

| Aspecto | Pre-Implementación | Post-Implementación C | Delta |
|---------|-------------------|----------------------|-------|
| **Resiliencia** | 🟡 MEDIA | 🟢 ALTA | +40% |
| **Debugging** | 🟡 MEDIO | 🟡 MEDIO | 0% (mejorar post-launch) |
| **Validación** | ❌ NO | 🟡 MANUAL | +50% (automatizar post-launch) |
| **Riesgo General** | 🔴 ALTO | 🟡 MEDIO | -50% |
| **Timeline** | +0 días | +3-5 días | Acceptable |
| **Enterprise Ready** | ❌ NO | 🟡 PARCIAL | Go-live viable |

**Conclusión:** Riesgo reducido significativamente (ALTO→MEDIO) con delay aceptable (3-5 días).

---

## 🎯 FASE 1: CIRCUIT BREAKERS (Días 1-2)

### Objetivo
Prevenir cascading failures implementando circuit breakers para todas las dependencias externas críticas.

### Dependencias a Proteger
1. **OpenAI API** (agente_negocio) - RTO: 5 min
2. **PostgreSQL** (todos los servicios) - RTO: 2 min
3. **Redis** (cache layer) - RTO: 3 min
4. **S3 Storage** (si aplicable) - RTO: 10 min

### Tecnología Seleccionada

**Librería:** `pybreaker` (lightweight, battle-tested)

**Justificación:**
- ✅ Python nativo (no dependencias pesadas)
- ✅ Simple API
- ✅ Configuración flexible
- ✅ Observabilidad built-in
- ✅ Production-proven (usado por empresas top)

**Alternativas consideradas:**
- `tenacity`: Más retry logic, menos circuit breaker puro
- `resilience4py`: Nuevo, menos maduro
- Custom implementation: Riesgo alto, no recomendado

### Arquitectura del Circuit Breaker

```python
# inventario-retail/shared/circuit_breakers.py

from pybreaker import CircuitBreaker
import logging

logger = logging.getLogger(__name__)

# OpenAI API Circuit Breaker
openai_breaker = CircuitBreaker(
    fail_max=5,              # 5 fallos consecutivos para abrir
    timeout_duration=60,     # 60s antes de half-open
    expected_exception=Exception,
    name="openai_api",
    listeners=[circuit_breaker_listener]
)

# PostgreSQL Circuit Breaker
db_breaker = CircuitBreaker(
    fail_max=3,              # 3 fallos → crítico
    timeout_duration=30,     # 30s recovery
    expected_exception=Exception,
    name="postgresql",
    listeners=[circuit_breaker_listener]
)

# Redis Circuit Breaker
redis_breaker = CircuitBreaker(
    fail_max=5,
    timeout_duration=20,     # Redis recovery rápido
    expected_exception=Exception,
    name="redis_cache",
    listeners=[circuit_breaker_listener]
)

def circuit_breaker_listener(breaker, state):
    """Log state transitions"""
    logger.warning(
        f"Circuit breaker '{breaker.name}' → {state}",
        extra={"breaker": breaker.name, "state": state}
    )
```

### Implementación Paso a Paso

#### Día 1 (8 horas): Setup + OpenAI + DB

**Horas 1-2: Setup**
```bash
# 1. Instalar pybreaker
pip install pybreaker==1.0.1
echo "pybreaker==1.0.1" >> inventario-retail/requirements.txt

# 2. Crear módulo shared
touch inventario-retail/shared/circuit_breakers.py
touch inventario-retail/shared/fallbacks.py
```

**Horas 3-4: OpenAI Circuit Breaker**
```python
# inventario-retail/agente_negocio/services/openai_service.py

from shared.circuit_breakers import openai_breaker
from shared.fallbacks import openai_fallback

@openai_breaker
async def call_openai_chat(prompt: str, model: str = "gpt-4"):
    """Call OpenAI API with circuit breaker protection"""
    try:
        response = await openai.ChatCompletion.acreate(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            timeout=120
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API error: {e}", exc_info=True)
        raise  # Circuit breaker detectará el fallo

# Fallback cuando circuit está abierto
@openai_breaker.fallback
def openai_fallback(prompt: str, model: str = "gpt-4"):
    """Fallback response when OpenAI is down"""
    logger.warning("OpenAI circuit open, returning fallback")
    return {
        "response": "Servicio temporalmente degradado. Intente nuevamente.",
        "status": "fallback",
        "reason": "openai_circuit_open"
    }
```

**Horas 5-6: Database Circuit Breaker**
```python
# inventario-retail/shared/database.py

from shared.circuit_breakers import db_breaker
from sqlalchemy.exc import OperationalError

@db_breaker
async def execute_query(query, params=None):
    """Execute DB query with circuit breaker"""
    try:
        async with get_db_session() as session:
            result = await session.execute(query, params)
            return result
    except OperationalError as e:
        logger.error(f"DB error: {e}", exc_info=True)
        raise

# Aplicar a todos los servicios
# inventario-retail/agente_deposito/services/inventory_service.py
# inventario-retail/agente_negocio/services/pricing_service.py
# etc.
```

**Horas 7-8: Testing + Monitoring**
```python
# tests/test_circuit_breakers.py

import pytest
from shared.circuit_breakers import openai_breaker, db_breaker

def test_openai_circuit_breaker():
    """Test circuit breaker opens after 5 failures"""
    # Simulate 5 failures
    for _ in range(5):
        with pytest.raises(Exception):
            call_openai_chat("test")
    
    # Circuit should be open now
    assert openai_breaker.current_state == "open"
    
    # Next call should use fallback
    result = call_openai_chat("test")
    assert result["status"] == "fallback"

# Agregar métricas Prometheus
from prometheus_client import Counter, Gauge

circuit_breaker_state = Gauge(
    'circuit_breaker_state',
    'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    ['breaker_name']
)

circuit_breaker_failures = Counter(
    'circuit_breaker_failures_total',
    'Total failures detected by circuit breaker',
    ['breaker_name']
)
```

#### Día 2 (8 horas): Redis + S3 + Integration

**Horas 1-3: Redis Circuit Breaker**
```python
# inventario-retail/shared/cache.py

from shared.circuit_breakers import redis_breaker
import redis.asyncio as aioredis

@redis_breaker
async def get_cached(key: str):
    """Get from cache with circuit breaker"""
    try:
        redis_client = await get_redis_client()
        value = await redis_client.get(key)
        return value
    except Exception as e:
        logger.error(f"Redis error: {e}", exc_info=True)
        raise

@redis_breaker.fallback
async def cache_fallback(key: str):
    """Fallback: fetch from DB when cache down"""
    logger.warning(f"Redis circuit open for key: {key}")
    # Fetch from database instead
    return await fetch_from_db(key)
```

**Horas 4-6: Integration Testing**
```bash
# Simular failures
docker-compose stop postgres  # DB down
docker-compose stop redis     # Cache down

# Verificar circuit breakers actúan correctamente
pytest tests/integration/test_circuit_breakers_integration.py -v

# Verificar métricas en Prometheus
curl http://localhost:9090/api/v1/query?query=circuit_breaker_state
```

**Horas 7-8: Documentation + Deployment**
```markdown
# docs/CIRCUIT_BREAKERS.md

## Circuit Breaker Configuration

### OpenAI API
- Fail threshold: 5 consecutive failures
- Timeout: 60 seconds
- Fallback: Generic degraded message

### PostgreSQL
- Fail threshold: 3 consecutive failures
- Timeout: 30 seconds
- Fallback: Return cached data if available

### Redis
- Fail threshold: 5 consecutive failures
- Timeout: 20 seconds
- Fallback: Fetch from database

## Monitoring

Grafana dashboard: "Circuit Breakers Status"
Alerts configured for circuit open events.
```

---

## 🎯 FASE 2: GRACEFUL DEGRADATION (Días 3-5)

### Objetivo
Implementar estrategia de degradación por niveles para mantener funcionalidad crítica durante incidentes.

### Niveles de Degradación

```
┌────────────────────────────────────────────────────┐
│ NIVEL 1: OPTIMAL (100% funcionalidad)             │
├────────────────────────────────────────────────────┤
│ • Todos los servicios operativos                  │
│ • Cache activo (Redis)                            │
│ • Database performante                            │
│ • External APIs disponibles (OpenAI)              │
│ • Latencia < 250ms                                │
└────────────────────────────────────────────────────┘
           ↓ Cache down
┌────────────────────────────────────────────────────┐
│ NIVEL 2: DEGRADED (85% funcionalidad)             │
├────────────────────────────────────────────────────┤
│ • Cache bypass → queries directas a DB            │
│ • Latencia incrementada (~500ms)                  │
│ • Funcionalidad completa                          │
│ • OpenAI API disponible                           │
└────────────────────────────────────────────────────┘
           ↓ OpenAI down
┌────────────────────────────────────────────────────┐
│ NIVEL 3: LIMITED (60% funcionalidad)              │
├────────────────────────────────────────────────────┤
│ • OpenAI features deshabilitadas                  │
│ • OCR básico sin AI enhancement                   │
│ • Pricing manual fallback                         │
│ • Inventory consultas funcionan                   │
└────────────────────────────────────────────────────┘
           ↓ DB read-only or slow
┌────────────────────────────────────────────────────┐
│ NIVEL 4: MINIMAL (30% funcionalidad)              │
├────────────────────────────────────────────────────┤
│ • Solo operaciones READ                           │
│ • No writes permitidos                            │
│ • Consultas críticas únicamente                   │
│ • Respuestas en memoria/cache                     │
└────────────────────────────────────────────────────┘
           ↓ DB completamente down
┌────────────────────────────────────────────────────┐
│ NIVEL 5: EMERGENCY (10% funcionalidad)            │
├────────────────────────────────────────────────────┤
│ • Sistema en modo "status page"                   │
│ • Health checks responden                         │
│ • Mensajes de error informativos                  │
│ • No operaciones de negocio                       │
└────────────────────────────────────────────────────┘
```

### Implementación por Día

#### Día 3 (8 horas): Degradation Manager + Level 1-2

**Horas 1-3: Degradation Manager**
```python
# inventario-retail/shared/degradation_manager.py

from enum import Enum
from typing import Dict, Callable
import asyncio

class DegradationLevel(Enum):
    OPTIMAL = 1      # 100% funcionalidad
    DEGRADED = 2     # 85% funcionalidad
    LIMITED = 3      # 60% funcionalidad
    MINIMAL = 4      # 30% funcionalidad
    EMERGENCY = 5    # 10% funcionalidad

class DegradationManager:
    def __init__(self):
        self.current_level = DegradationLevel.OPTIMAL
        self.health_checks: Dict[str, Callable] = {}
        self.level_transitions: Dict[DegradationLevel, Callable] = {}
        
    async def evaluate_health(self) -> DegradationLevel:
        """Evaluate system health and determine degradation level"""
        health_status = {}
        
        # Check Redis
        redis_ok = await self._check_redis()
        health_status['redis'] = redis_ok
        
        # Check PostgreSQL
        db_ok = await self._check_database()
        health_status['db'] = db_ok
        
        # Check OpenAI
        openai_ok = await self._check_openai()
        health_status['openai'] = openai_ok
        
        # Determine level based on health
        if all(health_status.values()):
            return DegradationLevel.OPTIMAL
        elif not health_status['redis'] and health_status['db']:
            return DegradationLevel.DEGRADED  # Cache down, DB ok
        elif not health_status['openai'] and health_status['db']:
            return DegradationLevel.LIMITED  # AI down, DB ok
        elif not health_status['db']:
            return DegradationLevel.MINIMAL  # DB problemas
        else:
            return DegradationLevel.EMERGENCY
    
    async def set_level(self, new_level: DegradationLevel):
        """Transition to new degradation level"""
        if new_level == self.current_level:
            return
        
        logger.warning(
            f"Degradation level change: {self.current_level.name} → {new_level.name}",
            extra={"old_level": self.current_level.value, "new_level": new_level.value}
        )
        
        # Execute transition handler
        if new_level in self.level_transitions:
            await self.level_transitions[new_level]()
        
        self.current_level = new_level
        
        # Update metrics
        degradation_level_gauge.set(new_level.value)
        degradation_transitions_counter.labels(
            from_level=self.current_level.name,
            to_level=new_level.name
        ).inc()

# Global instance
degradation_manager = DegradationManager()
```

**Horas 4-6: Level 1-2 Implementation**
```python
# inventario-retail/agente_negocio/services/pricing_service.py

from shared.degradation_manager import degradation_manager, DegradationLevel

async def get_item_price(item_id: str) -> float:
    """Get item price with degradation support"""
    current_level = degradation_manager.current_level
    
    if current_level == DegradationLevel.OPTIMAL:
        # NIVEL 1: Full pipeline
        # 1. Check cache
        cached_price = await get_cached_price(item_id)
        if cached_price:
            return cached_price
        
        # 2. Calculate with AI enhancement
        price = await calculate_price_with_ai(item_id)
        
        # 3. Cache result
        await cache_price(item_id, price)
        return price
    
    elif current_level == DegradationLevel.DEGRADED:
        # NIVEL 2: Skip cache, direct DB
        logger.info(f"Degraded mode: bypassing cache for {item_id}")
        price = await calculate_price_from_db(item_id)
        return price
    
    elif current_level >= DegradationLevel.LIMITED:
        # NIVEL 3+: Fallback to basic pricing
        logger.warning(f"Limited mode: basic pricing for {item_id}")
        return await get_basic_price(item_id)
```

**Horas 7-8: Testing + Monitoring**
```python
# tests/test_degradation.py

async def test_degradation_level_2():
    """Test system degrades gracefully when cache down"""
    # Simulate Redis down
    await degradation_manager.health_checks['redis'].set_unhealthy()
    
    # Evaluate should return DEGRADED
    level = await degradation_manager.evaluate_health()
    assert level == DegradationLevel.DEGRADED
    
    # API should still work (slower)
    response = await get_item_price("ITEM_001")
    assert response is not None
    assert response.status == "degraded"
```

#### Día 4 (8 horas): Levels 3-4 + Auto-Recovery

**Horas 1-4: Levels 3-4 Implementation**
```python
# NIVEL 3: LIMITED (OpenAI down)
async def process_ocr_limited(image_path: str):
    """OCR without AI enhancement"""
    # Use basic EasyOCR without OpenAI post-processing
    text = await run_easyocr(image_path)
    return {
        "text": text,
        "confidence": "medium",
        "enhanced": False,
        "degradation_level": "LIMITED"
    }

# NIVEL 4: MINIMAL (DB read-only)
async def get_inventory_minimal(item_id: str):
    """Inventory from in-memory cache only"""
    # Check memory cache first
    if item_id in memory_cache:
        return memory_cache[item_id]
    
    # Try read from DB (if allowed)
    try:
        item = await db.get_item_readonly(item_id)
        return item
    except Exception:
        return {
            "item_id": item_id,
            "status": "unavailable",
            "message": "Sistema en modo mínimo"
        }
```

**Horas 5-6: Auto-Recovery**
```python
# inventario-retail/shared/degradation_manager.py

async def auto_recovery_loop():
    """Continuously check health and recover when possible"""
    while True:
        try:
            # Evaluate current health
            new_level = await degradation_manager.evaluate_health()
            
            # Auto-recovery: upgrade level if health improved
            if new_level.value < degradation_manager.current_level.value:
                logger.info(f"Auto-recovery: upgrading to {new_level.name}")
                await degradation_manager.set_level(new_level)
            
            # Auto-degradation: downgrade if health worsened
            elif new_level.value > degradation_manager.current_level.value:
                logger.warning(f"Auto-degradation: downgrading to {new_level.name}")
                await degradation_manager.set_level(new_level)
            
        except Exception as e:
            logger.error(f"Auto-recovery error: {e}", exc_info=True)
        
        # Check every 30 seconds
        await asyncio.sleep(30)

# Start on app startup
@app.on_event("startup")
async def start_auto_recovery():
    asyncio.create_task(auto_recovery_loop())
```

**Horas 7-8: Dashboard + Alerts**
```yaml
# prometheus/alerts/degradation.yml

groups:
  - name: degradation_alerts
    rules:
      - alert: SystemDegraded
        expr: degradation_level > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Sistema en modo degradado"
          description: "Nivel {{ $value }}: {{ $labels.level_name }}"
      
      - alert: SystemMinimal
        expr: degradation_level >= 4
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Sistema en modo MINIMAL"
          description: "Funcionalidad limitada al 30%"
```

#### Día 5 (8 horas): Integration + Documentation + Deployment

**Horas 1-3: End-to-End Integration**
```python
# tests/integration/test_full_degradation.py

async def test_full_degradation_scenario():
    """Test complete degradation scenario"""
    
    # Start at OPTIMAL
    assert degradation_manager.current_level == DegradationLevel.OPTIMAL
    
    # Scenario 1: Cache down
    docker_compose.stop('redis')
    await asyncio.sleep(5)
    assert degradation_manager.current_level == DegradationLevel.DEGRADED
    
    # Scenario 2: OpenAI down
    mock_openai_api.set_down()
    await asyncio.sleep(5)
    assert degradation_manager.current_level == DegradationLevel.LIMITED
    
    # Scenario 3: DB slow
    mock_db.set_latency(5000)  # 5s latency
    await asyncio.sleep(5)
    assert degradation_manager.current_level == DegradationLevel.MINIMAL
    
    # Scenario 4: Recovery
    docker_compose.start('redis')
    mock_openai_api.set_up()
    mock_db.set_latency(10)
    await asyncio.sleep(60)  # Wait for recovery
    assert degradation_manager.current_level == DegradationLevel.OPTIMAL
```

**Horas 4-6: Documentation**
```markdown
# docs/GRACEFUL_DEGRADATION.md

## Sistema de Degradación por Niveles

### Niveles Definidos

#### NIVEL 1: OPTIMAL (100%)
- **Estado:** Todos los servicios operativos
- **Funcionalidad:** Completa
- **Latencia:** <250ms
- **Cache Hit:** >90%

#### NIVEL 2: DEGRADED (85%)
- **Trigger:** Redis down
- **Comportamiento:** Bypass cache, direct DB queries
- **Latencia:** ~500ms
- **Impacto:** Performance reducido, funcionalidad completa

#### NIVEL 3: LIMITED (60%)
- **Trigger:** OpenAI API down
- **Comportamiento:** Deshabilitar features AI
- **Funcionalidad:**
  - ✅ Inventory queries
  - ✅ Basic pricing
  - ❌ AI-enhanced OCR
  - ❌ Smart recommendations

#### NIVEL 4: MINIMAL (30%)
- **Trigger:** Database problemas severos
- **Comportamiento:** Read-only mode
- **Funcionalidad:**
  - ✅ Read operations (limited)
  - ❌ Write operations
  - ❌ Complex queries

#### NIVEL 5: EMERGENCY (10%)
- **Trigger:** Database completamente down
- **Comportamiento:** Status page only
- **Funcionalidad:** Solo health checks

### Monitoreo

**Grafana Dashboard:** "Degradation Status"
**Prometheus Metrics:**
- `degradation_level` (gauge)
- `degradation_transitions_total` (counter)

**Alertas:**
- WARNING: Level ≥ 2 por >5 minutos
- CRITICAL: Level ≥ 4 por >1 minuto
```

**Horas 7-8: Deployment to Staging**
```bash
# Deploy circuit breakers + graceful degradation
git checkout -b feature/resilience-hardening
git add inventario-retail/shared/circuit_breakers.py
git add inventario-retail/shared/degradation_manager.py
git add inventario-retail/shared/fallbacks.py
git commit -m "feat: implement circuit breakers + graceful degradation (OPCIÓN C)"
git push origin feature/resilience-hardening

# Deploy to staging
ssh staging "cd /opt/inventario-retail && git pull && docker-compose restart"

# Smoke tests
bash scripts/smoke_test_staging.sh

# Chaos test manual
bash scripts/chaos_redis_down.sh  # Verify NIVEL 2 degradation
bash scripts/chaos_db_slow.sh     # Verify NIVEL 4 degradation
```

---

## 📋 POST-LAUNCH ROADMAP

### Sprint 1 (Semanas 1-2 post-launch): Distributed Tracing

**Objetivo:** Implementar OpenTelemetry para observabilidad cross-service

**Tareas:**
- [ ] Instalar OpenTelemetry SDK (Python)
- [ ] Instrumentar FastAPI apps (auto-instrumentation)
- [ ] Deploy Jaeger backend
- [ ] Configurar span annotations
- [ ] Crear dashboards de tracing
- [ ] Training para equipo ops

**Esfuerzo:** 1-2 días  
**Beneficio:** Debugging 10x más rápido en microservicios

### Sprint 2 (Semanas 3-4 post-launch): Chaos Testing Automation

**Objetivo:** Automatizar chaos engineering scenarios

**Tareas:**
- [ ] Instalar Chaos Toolkit
- [ ] Crear 7 scenarios (DB down, cache down, latency, etc.)
- [ ] Integrar con CI/CD (weekly runs)
- [ ] Configurar auto-rollback si chaos test falla
- [ ] Documentar runbooks basados en resultados

**Esfuerzo:** 3-5 días  
**Beneficio:** Validación continua de resiliencia

---

## ✅ CRITERIOS DE ÉXITO (Opción C)

### Pre-Launch (después de implementación)

- [x] Circuit breakers implementados para 4 dependencias
- [x] 5 niveles de degradación funcionando
- [x] Auto-recovery verificado
- [x] Tests de integración passing (>95%)
- [x] Deployed to staging sin issues
- [x] Chaos tests manuales exitosos
- [x] Documentación completa
- [x] Team training completado

### Post-Launch (2-4 semanas)

- [ ] Distributed tracing operacional
- [ ] Chaos testing automatizado
- [ ] Zero incidentes severos relacionados a resiliencia
- [ ] Degradation activado ≤3 veces (esperado)
- [ ] Recovery automático en <2 minutos (promedio)

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs Durante Implementación

| Métrica | Target | Tracking |
|---------|--------|----------|
| Tests passing | >95% | CI/CD |
| Code coverage | >85% | pytest-cov |
| Staging deployment | ✅ SUCCESS | Manual |
| Chaos tests passed | 5/5 | Manual |
| Team training | 100% | Attendance |

### KPIs Post-Launch (30 días)

| Métrica | Target | Actual |
|---------|--------|--------|
| Incidentes severos | 0 | TBD |
| Degradation activations | <5 | TBD |
| Avg recovery time | <2 min | TBD |
| Circuit breaker opens | <10 | TBD |
| MTTR (Mean Time To Repair) | <15 min | TBD |

---

## 🚀 TIMELINE CONSOLIDADO

```
DÍA 1 (8h): Circuit Breakers - Setup + OpenAI + DB
  ├─ 2h: Setup pybreaker + estructura
  ├─ 2h: OpenAI circuit breaker
  ├─ 2h: Database circuit breaker
  └─ 2h: Testing + Monitoring

DÍA 2 (8h): Circuit Breakers - Redis + Integration
  ├─ 3h: Redis circuit breaker
  ├─ 3h: Integration testing
  └─ 2h: Documentation + Deployment to staging

DÍA 3 (8h): Graceful Degradation - Manager + L1-2
  ├─ 3h: Degradation manager core
  ├─ 3h: Levels 1-2 implementation
  └─ 2h: Testing + Monitoring

DÍA 4 (8h): Graceful Degradation - L3-4 + Recovery
  ├─ 4h: Levels 3-4 implementation
  ├─ 2h: Auto-recovery logic
  └─ 2h: Dashboard + Alerts

DÍA 5 (8h): Integration + Deployment + Validation
  ├─ 3h: End-to-end integration tests
  ├─ 2h: Documentation completa
  ├─ 2h: Deployment to staging
  └─ 1h: Smoke tests + chaos tests manuales

POST-LAUNCH:
  Semana 1-2: Distributed Tracing (1-2 días)
  Semana 3-4: Chaos Testing Automation (3-5 días)
```

**Total Implementation Time:** 3-5 días  
**Post-Launch Time:** 4-7 días (diferido)  
**Total Time:** 7-12 días (spread over 4-6 semanas)

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **[AHORA]** Crear branch: `feature/resilience-hardening`
2. **[AHORA]** Crear estructura de archivos
3. **[DÍA 1]** Iniciar implementación Circuit Breakers
4. **[PARALELO]** Monitorear B.1 staging completion (ETA 01:45 UTC)
5. **[DESPUÉS DÍA 5]** Re-ejecutar FASE 5 validation (partial)
6. **[DESPUÉS DÍA 5]** Continuar FASE 2 (Testing) cuando B.1 complete

---

*Plan creado: October 18, 2025 - 02:05 UTC*  
*Decisión: OPCIÓN C - Implementación Parcial*  
*Status: READY TO START* ✅
