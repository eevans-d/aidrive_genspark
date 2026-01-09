# PLAN DETALLADO POR WORKSTREAMS (WS1-WS8)

**Ultima actualizacion:** 2026-01-09  
**Estado:** vigente  
**Relacion:** `docs/ROADMAP.md`, `docs/DECISION_LOG.md`, `docs/CHECKLIST_CIERRE.md`

---

## Proposito
Describir un plan **detallado, verificable y sin ambiguedades** para ejecutar los workstreams del roadmap. Este documento es el nivel operativo (tareas, evidencias, responsables).

## Convenciones
- **ID de tarea:** WSx.y.z
- **Owner:** rol responsable (Backend/DB/QA/Ops/Frontend)
- **Evidencia:** comando, log o doc donde se verifica el cumplimiento
- Si una tarea cambia alcance, registrar decision en `docs/DECISION_LOG.md`.

---

## WS1 - Observabilidad y Logging (P0)
**Objetivo:** logging estructurado y trazabilidad minima en funciones criticas.

### WS1.0 Preparacion
- **WS1.0.1 Inventario de logs actuales** (Owner: Backend)  
  Pasos: `rg -n "console\\.log|console\\.error" supabase/functions` y clasificar por modulo.  
  Aceptacion: lista de puntos a migrar registrada en `docs/CHECKLIST_CIERRE.md` (seccion WS1).

- **WS1.0.2 Esquema de logging base** (Owner: Backend)  
  Definir campos minimos:
  `level`, `event`, `message`, `request_id`, `job_id`, `run_id`, `duration_ms`, `items_total`, `items_ok`, `items_fail`, `error`.  
  Aceptacion: esquema acordado y usado en WS1.1/WS1.2/WS1.3.

### WS1.1 API Proveedor
- **WS1.1.1 Contexto y request_id** (Owner: Backend)  
  Pasos: generar `request_id` en entrypoint (`api-proveedor/index.ts`) desde header `x-request-id` o UUID.  
  Aceptacion: cada handler loguea con `request_id`.

- **WS1.1.2 Migrar logs en handlers** (Owner: Backend)  
  Scope: `supabase/functions/api-proveedor/handlers/*`.  
  Aceptacion: `rg -n "console\\.log" supabase/functions/api-proveedor` devuelve 0.

### WS1.2 Scraper Maxiconsumo
- **WS1.2.1 Contexto de ejecucion** (Owner: Backend)  
  Pasos: propagar `run_id` desde `scraper-maxiconsumo/index.ts` hacia modulos.  
  Aceptacion: logs de parsing/matching incluyen `run_id`.

- **WS1.2.2 Migrar logs en modulos** (Owner: Backend)  
  Scope: `parsing.ts`, `matching.ts`, `scraping.ts`, `storage.ts`.  
  Aceptacion: `rg -n "console\\.log" supabase/functions/scraper-maxiconsumo` devuelve 0.

### WS1.3 Cron Jobs Maxiconsumo
- **WS1.3.1 Contexto job_id/execution_id** (Owner: Backend)  
  Pasos: asegurar `job_id` y `execution_id` por job en `jobs/*`.  
  Aceptacion: logs incluyen `job_id` y `execution_id`.

- **WS1.3.2 Migrar logs en jobs** (Owner: Backend)  
  Scope: `jobs/daily-price-update.ts`, `jobs/realtime-alerts.ts`, `jobs/weekly-analysis.ts`, `jobs/maintenance.ts`.  
  Aceptacion: `rg -n "console\\.log" supabase/functions/cron-jobs-maxiconsumo/jobs` devuelve 0.

### WS1.4 Persistencia de ejecucion (cron_jobs_execution_log)
- **WS1.4.1 Alinear payload con schema DB** (Owner: Backend/DB)  
  Schema en `supabase/migrations/20260104020000_create_missing_objects.sql`.  
  Campos obligatorios: `job_id`, `start_time`, `estado`.  
  Aceptacion: insert incluye `job_id`, `execution_id`, `start_time`, `end_time`, `duracion_ms`, `estado`.

- **WS1.4.2 Validacion runtime del payload** (Owner: Backend)  
  Pasos: validar `estado` y tipos antes de insertar; fallas registran `status=failed`.  
  Aceptacion: errores de validacion quedan en `error_message` y log estructurado.

### WS1.5 Metricas basicas
- **WS1.5.1 Metricas por job** (Owner: Backend)  
  Campos: `productos_procesados`, `productos_exitosos`, `productos_fallidos`, `alertas_generadas`.  
  Aceptacion: `cron-dashboard` puede leer valores sin nulls en ejecuciones exitosas.

- **WS1.6 Logging en entrypoints y auxiliares** (Owner: Backend)  
  Scope: `api-minimarket/index.ts`, `notificaciones-tareas/index.ts`, y utils de cache (`api-proveedor/utils/cache.ts`).  
  Aceptacion: `console.*` eliminado o redirigido a `_shared/logger`; `rg -n "console\\." supabase/functions` solo muestra `_shared/logger.ts` y suites de testing.

### Evidencia WS1
- `rg -n "console\\.log" supabase/functions/api-proveedor` => 0  
- `rg -n "console\\.log" supabase/functions/scraper-maxiconsumo` => 0  
- `rg -n "console\\.log" supabase/functions/cron-jobs-maxiconsumo/jobs` => 0  
- Query ejemplo: `select job_id, estado, duracion_ms from cron_jobs_execution_log order by start_time desc limit 5;`

### Riesgos y mitigacion
- **Riesgo:** romper logs existentes en cron auxiliares.  
  **Mitigacion:** limitar scope a modulos criticos y dejar auxiliares para WS4.

---

## WS2 - Testing & QA (P0/P1)
**Objetivo:** tests reproducibles mas alla de unitarios y sin runners ambiguos.

### WS2.0 Inventario y normalizacion
- **WS2.0.1 Inventario de suites** (Owner: QA)  
  Scope: `tests/integration`, `tests/e2e`, `tests/performance`, `tests/security`, `tests/api-contracts`.  
  Aceptacion: lista de suites y dependencias en `docs/CHECKLIST_CIERRE.md`.

- **WS2.0.2 Consolidar runner** (Owner: QA/Backend)  
  Decision: D-004 (Vitest + Supabase local).  
  Aceptacion: `package.json` expone `test:integration`, `test:e2e`, `test:performance`, `test:security`.

### WS2.1 Runner de integracion (Supabase local)
- **WS2.1.1 Script de entorno** (Owner: Ops)  
  Pasos: crear script que haga `supabase start` y `supabase db reset` antes de tests.  
  Aceptacion: un comando unico ejecuta la suite (sin pasos manuales).

- **WS2.1.2 Config Vitest integration** (Owner: QA)  
  Pasos: config separada para integration; timeouts y envs.  
  Aceptacion: `npx vitest run tests/integration` funciona con Supabase local.

### WS2.2 Smoke tests E2E minimos
- **WS2.2.1 Endpoints criticos** (Owner: QA)  
  Scope: `/status`, `/precios`, `/alertas` en `api-proveedor`.  
  Aceptacion: smoke tests pasan; fallan con mensaje claro si falta env.

- **WS2.2.2 Cron smoke** (Owner: QA/Backend)  
  Scope: ejecutar un job controlado y validar insert en `cron_jobs_execution_log`.  
  Aceptacion: registro visible y estado `success`.

### WS2.3 Performance baseline
- **WS2.3.1 Definir dataset/fixture** (Owner: QA)  
  Aceptacion: dataset reproducible para performance (sin datos reales).

- **WS2.3.2 Migrar tests a Vitest** (Owner: QA)  
  Scope: `tests/performance/load-testing.test.js` (actualmente Jest).  
  Aceptacion: `npx vitest run tests/performance` ejecuta sin Jest.

### WS2.4 Seguridad y contratos
- **WS2.4.1 API contracts** (Owner: QA)  
  Scope: `tests/api-contracts`.  
  Aceptacion: validacion OpenAPI con errores legibles.

- **WS2.4.2 Security tests** (Owner: QA/Sec)  
  Scope: `tests/security`.  
  Aceptacion: tests ejecutables con runner definido (Vitest o script dedicado).

### Evidencia WS2
- Comandos en README o `docs/OPERATIONS_RUNBOOK.md` con resultados reproducibles.  
- `npx vitest run tests/integration` pasa local con Supabase.
- `npm run test:e2e` pasa local con Supabase.

---

## WS3 - Base de Datos y Migraciones (P0)
**Objetivo:** migraciones validadas en entornos reales y rollback claro.

### WS3.0 Validacion local
- **WS3.0.1 Reset local** (Owner: DB/Ops)  
  Pasos: `supabase db reset` y smoke test.  
  Aceptacion: migraciones aplican sin errores.

- **WS3.0.2 Lista de migraciones** (Owner: DB)  
  Aceptacion: inventario coincide con `docs/INVENTARIO_ACTUAL.md`.

### WS3.1 Staging/Prod
- **WS3.1.1 Pre-check** (Owner: DB/Ops)  
  Pasos: backup/logs previos, ventana de mantenimiento.  
  Aceptacion: pre-check documentado.

- **WS3.1.2 Apply migrations** (Owner: DB/Ops)  
  Aceptacion: migraciones aplicadas; evidencia en `docs/CHECKLIST_CIERRE.md`.

### WS3.2 Rollback
- **WS3.2.1 Procedimiento documentado** (Owner: DB/Ops)  
  Aceptacion: pasos y comandos en `docs/DEPLOYMENT_GUIDE.md`.

### Evidencia WS3
- Checklist de ejecucion por entorno en `docs/CHECKLIST_CIERRE.md`.  
- Logs de ejecucion y timestamps registrados.

---

## WS4 - Cron y Automatizaciones (P1)
- **WS4.1** Validacion runtime de alertas/comparaciones (depende WS1).  
- **WS4.2** Consistencia `_shared` en cron auxiliares.

## WS5 - Frontend (P1)
- **WS5.1** Reducir warning chunk >500k o documentar excepcion.  
- **WS5.2** Error boundaries en rutas criticas.

## WS6 - CI/CD (P1)
- **WS6.1** Integrar pruebas de integracion en pipeline.  
- **WS6.2** Validacion de envs requeridas.

## WS7 - Seguridad (P1)
- **WS7.1** Auditoria RLS.  
- **WS7.2** Escaneo dependencias (npm audit + Snyk).

## WS8 - Documentacion y Gobernanza (P0)
- **WS8.1** Actualizar `docs/ARCHITECTURE_DOCUMENTATION.md` a estado real.  
- **WS8.2** Handoff: verificar que ROADMAP/DECISION_LOG estan referenciados.
