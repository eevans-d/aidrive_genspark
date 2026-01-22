# C2 — Subplan E1 Observabilidad & Logging (MPC v2.0)

**Etapa:** E1
**Fecha:** 2026-01-22
**Versión:** 1.0.0

---

## 1) Alcance

- **WS1.1** Adopción `_shared/logger` en handlers críticos.
- **WS1.2** Persistencia de ejecución de cron.
- **WS1.3** Métricas mínimas por job/handler.

---

## 2) Referencias exactas (archivo:líneas)

- `_shared/logger`:
  - `supabase/functions/_shared/logger.ts:1-67`
- API Proveedor (entrada + CORS + logging):
  - `supabase/functions/api-proveedor/index.ts:28-220`
- Scraper Maxiconsumo (logging + handlers):
  - `supabase/functions/scraper-maxiconsumo/index.ts:11-226`
- Cron Orchestrator:
  - `supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts:1-84`
- Persistencia ejecución cron:
  - `supabase/functions/cron-jobs-maxiconsumo/execution-log.ts:1-153`

---

## 3) Subtareas (estimación en horas)

| ID | Tarea | Estimación | Entregable |
|---|---|---:|---|
| E1-T1 | Auditar `console.log` en handlers críticos | 2h | Lista de archivos + plan de reemplazo |
| E1-T2 | Unificar `requestId/runId/jobId` en logs | 3h | Log fields estandarizados |
| E1-T3 | Integrar logger en handlers faltantes | 4h | Logs estructurados en paths críticos |
| E1-T4 | Verificar persistencia en `cron_jobs_execution_log` | 3h | Payload validado y guardado |
| E1-T5 | Métricas mínimas por job (duración/items/errores) | 3h | Campos consistentes en logs |

---

## 4) Variables de entorno críticas

- `LOG_LEVEL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`

---

## 5) Plan de testing

### Unitarios
- Ejecutar suite de unitarios con Vitest.

### Integración
- Ejecutar cron jobs en entorno local (Supabase local) y validar inserciones en `cron_jobs_execution_log`.

### E2E (smoke)
- Verificar endpoints `status/health` para confirmación de trazas.

---

## 6) Plan de rollback

1. Revertir cambios en handlers si el logging genera errores de runtime.
2. Deshabilitar métricas adicionales si impactan performance.
3. Re-ejecutar tests unitarios tras rollback.

---

## 7) Checklist pre-implementación

- [ ] Confirmar que `LOG_LEVEL` está definido en env local.
- [ ] Revisar ausencia de credenciales staging/prod (no bloquear local).
- [ ] Validar estructura esperada de logs (campos requeridos).

## 8) Checklist post-implementación

- [ ] 0 `console.log` en handlers críticos.
- [ ] Logs incluyen `requestId` o `runId`.
- [ ] Inserciones exitosas en `cron_jobs_execution_log`.
- [ ] Evidencia guardada en docs/evidencias.
