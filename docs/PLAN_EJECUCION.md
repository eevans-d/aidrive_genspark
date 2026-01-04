# PLAN DE EJECUCIÓN (4 semanas / 20 días hábiles)

**Proyecto:** Mini Market (Frontend `minimarket-system/` + Supabase Edge Functions `supabase/functions/`)

**Fecha de arranque sugerida:** 2026-01-05

## 0) Objetivo del plan
Ejecutar una modernización operativa y técnica del sistema para que sea:
- **Mantenible**: dividir funciones monolíticas >2000 líneas en módulos claros.
- **Confiable**: robustecer cron jobs, logs, alertas y manejo de errores.
- **Verificable**: aumentar cobertura de tests y crear una base de CI.
- **Consistente**: reducir duplicación (CORS, rate limiter, circuit breaker, helpers).

## 1) Alcance exacto

### En alcance (lo que se hace)
1. Crear librerías compartidas para Edge Functions (`supabase/functions/_shared/`) y migrar utilidades duplicadas.
2. **Migración SQL** para tablas de cron y tracking (faltantes) + documentación del esquema.
3. Implementar **mínimo CI** (lint + tests) y un flujo reproducible local.
4. Refactor en 3 fases de las Edge Functions críticas:
   - `api-proveedor` (~3744 líneas)
   - `scraper-maxiconsumo` (~3212 líneas)
   - `cron-jobs-maxiconsumo` (~2900 líneas)
5. Reducir `console.log` en producción, estandarizar logging y respuestas.
6. Incrementar test coverage en módulos core (helpers, validadores, parsing, routing, jobs).

### Fuera de alcance (NO se hace en este plan)
- Rediseño UX/UI, nuevas pantallas o funcionalidades de producto.
- Cambios de arquitectura mayor (microservicios externos, colas, etc.).
- Reemplazar Supabase por otra plataforma.

## 2) Reglas del juego (criterios de calidad)

### Estándares mínimos
- **CORS**: uniforme en todas las funciones (preflight OPTIONS + headers consistentemente).
- **Errores**: formato consistente de respuesta (código, mensaje, detalle opcional).
- **Logs**: sin `console.log` sueltos en producción; usar un wrapper con niveles.
- **Validación**: validar payloads/params antes de llamar a scraping/DB.
- **Tests**: cada módulo crítico nuevo debe tener al menos tests básicos.

### Definición de “hecho” (DoD) por entrega
- Compila / ejecuta local sin pasos manuales raros.
- Lint y tests pasan.
- No se rompen endpoints existentes (compatibilidad de ruta y schema).
- Se documenta lo suficiente para operar (docs + README/Runbook si aplica).

## 3) Preparación (Día 0 / hoy o mañana temprano)

### Checklist de preflight
1. Ver variables de entorno requeridas:
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Edge Functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
2. Validar que el repo está limpio y que el equipo puede ejecutar:
   - `pnpm -v`
   - `node -v`
   - `deno --version` (si se usa localmente)
3. Congelar baseline (para comparar):
   - Ejecutar linter/tests actuales y anotar estado (aunque fallen).

### Comandos base
- Frontend (desde `minimarket-system/`):
  - `pnpm install`
  - `pnpm dev`
  - `pnpm lint`
  - `pnpm build`
- Tests (según configuración actual):
  - `npm test` o `pnpm test` (si está configurado)

> Nota: si hoy no existe una rutina clara de tests/CI, se crea en Semana 1.

---

## 4) Entregables principales (resumen)

### Semana 1 (Fundaciones)
- `supabase/functions/_shared/` con:
  - CORS
  - respuesta estándar
  - logging
  - rate limiter / circuit breaker (consolidado)
  - helpers de validación
- Migración SQL para tablas cron + actualización de docs del esquema.
- CI mínimo (lint + tests) y scripts reproducibles.

### Semana 2 (Refactor `api-proveedor`)
- Router y handlers separados por endpoint.
- Contratos de request/response estabilizados.
- Tests unitarios para routing/validación.

### Semana 3 (Refactor `scraper-maxiconsumo`)
- Separación scraping/parsing/matching/cache/persistencia.
- Tests para parsing/matching.

### Semana 4 (Refactor `cron-jobs-maxiconsumo` + hardening final)
- Jobs separados y orquestación clara.
- Logging/metrics/alertas consistentes.
- Suite mínima de regresión + release checklist.

---

## 5) Plan detallado por semana y día

### SEMANA 1 — Fundaciones (Días 1–5)

#### Día 1 — Baseline + estructura shared
**Objetivo:** dejar base compartida para cortar duplicación y permitir refactor seguro.

**Tareas:**
1. Baseline (estado actual):
   - Ejecutar lint y tests actuales y guardar resultado.
2. Crear estructura `supabase/functions/_shared/`:
   - `cors.ts`
   - `response.ts`
   - `logger.ts`
   - `errors.ts`
   - `rateLimit.ts`
   - `circuitBreaker.ts`
   - `validate.ts`
3. Migrar CORS duplicado a `cors.ts` y adoptar en 2–3 funciones pequeñas primero (p. ej. `alertas-stock`, `reportes-automaticos`, `notificaciones-tareas`).

**Entregables:**
- Shared libs creadas y usadas por al menos 2 funciones.

**Criterio de aceptación:**
- Las funciones migradas responden OPTIONS y requests igual que antes.

#### Día 2 — Respuesta estándar + errores + logging
**Tareas:**
1. Definir respuesta estándar (éxito/error):
   - `ok(data, status?)`
   - `fail(code, message, status, details?)`
2. Definir `AppError` / `HttpError` y un handler común.
3. Crear `logger.ts` con niveles (debug/info/warn/error) y gating por ENV.
4. Eliminar `console.log` en 2–3 funciones pequeñas y reemplazar por logger.

**Entregables:**
- `response.ts`, `errors.ts`, `logger.ts` aplicados en funciones pequeñas.

#### Día 3 — Consolidación rate limiter + circuit breaker
**Tareas:**
1. Consolidar implementaciones duplicadas en `_shared/rateLimit.ts` y `_shared/circuitBreaker.ts`.
2. Crear tests unitarios (si ya existe harness) o mínimo “smoke tests” en el entorno actual.
3. Adoptar en `api-proveedor` y/o `scraper-maxiconsumo` de forma controlada (sin refactor total aún).

**Entregables:**
- Un solo rate limiter y un solo circuit breaker.

#### Día 4 — Migración SQL de cron tables + documentación
**Objetivo:** alinear DB con tablas usadas por cron.

**Tareas:**
1. Crear migración SQL (nuevo archivo en `supabase/migrations/`) para:
   - `cron_jobs_execution_log`
   - `cron_jobs_alerts`
   - (si aplica por uso real) `cron_jobs_metrics`, `cron_jobs_notifications`, `cron_jobs_tracking`
2. Definir índices mínimos:
   - por `job_name`, `status`, `created_at`
3. Actualizar documentación:
   - `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`

**Entregables:**
- Migración lista y aplicada en entorno de dev.

#### Día 5 — CI mínimo + scripts reproducibles
**Objetivo:** que cada PR/commit valide lo básico.

**Tareas:**
1. Definir un flujo CI mínimo (GitHub Actions) con:
   - install deps
   - lint
   - tests
   - build (si corresponde)
2. Documentar comandos en README o docs operativas.
3. Ajustar scripts si hay roturas.

**Entregables:**
- CI inicial funcionando.

---

### SEMANA 2 — Refactor `api-proveedor` (Días 6–10)

**Meta:** pasar de archivo monolítico a módulos por endpoint sin romper contratos.

#### Día 6 — Inventario de endpoints + router
**Tareas:**
1. Enumerar rutas/handlers existentes y normalizar routing.
2. Crear estructura sugerida:
   - `api-proveedor/index.ts` (entrypoint + router)
   - `api-proveedor/routes/*.ts`
   - `api-proveedor/services/*.ts`
   - `api-proveedor/schemas/*.ts`
3. Mover lógica de routing/dispatch a módulos.

**Entregable:** router modular.

#### Día 7 — Validación y contratos
**Tareas:**
1. Centralizar parseo/validación de query/body.
2. Definir contratos de request/response por endpoint (sin cambiar semántica).
3. Tests para validadores.

#### Día 8 — Integración con scraper/cache
**Tareas:**
1. Extraer clientes/repositories para cache/DB.
2. Aislar integración con `scraper-maxiconsumo` detrás de un `service`.
3. Aplicar rate limiter/circuit breaker shared.

#### Día 9 — Logging + errores + reducción de logs
**Tareas:**
1. Reemplazar `console.log` por logger.
2. Unificar errores HTTP.
3. Agregar correlación mínima (requestId) si aplica.

#### Día 10 — End-to-end sanity + hardening
**Tareas:**
1. Smoke tests de endpoints críticos.
2. Revisar CORS, OPTIONS, headers y status codes.
3. Documentar endpoints relevantes (si la doc quedó desalineada).

**Criterio de aceptación semana 2:**
- `api-proveedor` queda dividido en módulos, con tests base y sin romper endpoints.

---

### SEMANA 3 — Refactor `scraper-maxiconsumo` (Días 11–15)

**Meta:** separar scraping/parsing/matching/cache; dejarlo testeable.

#### Día 11 — Separación por capas
**Estructura sugerida:**
- `scraper-maxiconsumo/index.ts` (entrypoint)
- `scraper-maxiconsumo/scraping/` (navegación/requests)
- `scraper-maxiconsumo/parsing/` (parse HTML/JSON)
- `scraper-maxiconsumo/matching/` (matching avanzado)
- `scraper-maxiconsumo/storage/` (cache/persistencia)
- `scraper-maxiconsumo/contracts/` (tipos)

#### Día 12 — Parsing testeable
**Tareas:**
1. Extraer parsers puros (sin I/O).
2. Crear fixtures mínimas (HTML/JSON recortados) y tests.

#### Día 13 — Matching y normalización
**Tareas:**
1. Extraer matching a módulo dedicado.
2. Tests de matching con casos borde.

#### Día 14 — Cache/persistencia
**Tareas:**
1. Encapsular acceso a cache/DB.
2. Asegurar timeouts y circuit breaker.

#### Día 15 — Smoke tests y rendimiento básico
**Tareas:**
1. Pruebas de “scrape completo” en entorno controlado.
2. Ajustes de rate limit/timeout.

**Criterio de aceptación semana 3:**
- Scraper modular con tests de parsing/matching y sin regresiones funcionales.

---

### SEMANA 4 — Refactor `cron-jobs-maxiconsumo` + cierre (Días 16–20)

**Meta:** orquestación clara por job, logs/alertas/metrics consistentes.

#### Día 16 — Extraer jobs a módulos
**Tareas:**
1. Dividir en:
   - `cron-jobs-maxiconsumo/jobs/daily_price_update.ts`
   - `cron-jobs-maxiconsumo/jobs/weekly_trend_analysis.ts`
   - `cron-jobs-maxiconsumo/jobs/realtime_change_alerts.ts`
   - `cron-jobs-maxiconsumo/jobs/maintenance_cleanup.ts`
2. `index.ts` como router/orquestador.

#### Día 17 — Persistencia de ejecución + alertas
**Tareas:**
1. Insert/update en `cron_jobs_execution_log`.
2. Generación de alertas en `cron_jobs_alerts`.
3. Manejo de retry y fallos.

#### Día 18 — Observabilidad mínima
**Tareas:**
1. Unificar logs por job con contexto (jobName, runId).
2. Agregar métricas mínimas (duración, items procesados, errores).

#### Día 19 — Tests y regresión
**Tareas:**
1. Tests unitarios de jobs (mock de servicios).
2. Tests de integración livianos si el stack lo permite.

#### Día 20 — Release checklist y estabilización
**Tareas:**
1. Revisión final de docs (API + esquema + runbook).
2. Verificar que lint/tests/build y CI pasan.
3. Lista de verificación de despliegue.

**Criterio de aceptación semana 4:**
- Cron modular, trazable, con logs/alertas persistidos y suite mínima de regresión.

---

## 6) Checklist ejecutable para “mañana” (Día 1)

### A. Preparar entorno
- Confirmar variables de entorno.
- Instalar dependencias frontend (`pnpm install`).
- Confirmar herramientas (node/pnpm/deno si aplica).

### B. Baseline
- Ejecutar `pnpm lint` y guardar salida.
- Ejecutar tests existentes y guardar salida.

### C. Crear shared libs (primera versión)
- Crear `_shared/cors.ts` (CORS + OPTIONS)
- Crear `_shared/response.ts` (ok/fail)
- Migrar 2 funciones pequeñas a usar shared.

### D. Validación rápida
- Probar manualmente una función migrada (OPTIONS + request normal).

---

## 7) Riesgos y mitigaciones

1. **Refactor rompe endpoints sin querer**
   - Mitigación: router/contract tests; refactor por endpoint, no “big bang”.
2. **Scraping frágil por cambios de sitio**
   - Mitigación: aislar parsing/matching + fixtures; timeouts; circuit breaker.
3. **Tablas de cron en prod no alineadas**
   - Mitigación: migración con compat; validar en staging antes.
4. **Falta de CI/estándares hoy**
   - Mitigación: CI mínimo en Semana 1; DoD estricto.

---

## 8) Métricas de éxito
- Reducción de duplicación (CORS/rate limit/circuit breaker) a **1 implementación**.
- `api-proveedor`, `scraper-maxiconsumo`, `cron-jobs-maxiconsumo` divididas en módulos razonables (sin archivos monstruo).
- Aumento de cobertura en módulos core (parsing/matching/routing/jobs).
- CI mínimo corriendo consistentemente.

---

## 9) Notas de ejecución (prácticas recomendadas)
- Refactor siempre con pasos cortos y comprobables.
- No mezclar refactor con cambios funcionales.
- Mantener “compatibilidad hacia atrás” en endpoints.
- Preferir funciones puras para parsing/matching (fáciles de testear).

