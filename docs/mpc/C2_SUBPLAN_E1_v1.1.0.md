# C2 — Subplan E1 Observabilidad & Logging (MPC v2.1)

**Etapa:** E1  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** ✅ Completado (2026-01-23)  

---

## 1) Estado actual

- Logging estructurado con `requestId/jobId/runId` en handlers críticos.
- `console.*` fuera de `_shared/logger.ts` eliminado en `supabase/functions`.
- Persistencia de ejecución en `cron_jobs_execution_log` activa.

---

## 2) Alcance

- **WS1.1** Adopción `_shared/logger` en handlers críticos.
- **WS1.2** Persistencia de ejecución de cron.
- **WS1.3** Métricas mínimas por job/handler.

---

## 3) Evidencias y referencias

- Logger compartido: `supabase/functions/_shared/logger.ts`.
- Persistencia cron: `supabase/functions/cron-jobs-maxiconsumo/execution-log.ts`.
- Evidencia doc: `docs/CHECKLIST_CIERRE.md` (F5).

---

## 4) Subtareas

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| E1-T1 | Auditar `console.*` en handlers críticos | ✅ | `rg -n "console\." supabase/functions` |
| E1-T2 | Unificar `requestId/runId/jobId` | ✅ | `_shared/logger.ts` |
| E1-T3 | Integrar logger en handlers faltantes | ✅ | api-proveedor/scraper/cron | 
| E1-T4 | Verificar persistencia `cron_jobs_execution_log` | ✅ | `execution-log.ts` |
| E1-T5 | Métricas mínimas por job | ✅ | `cron_jobs_execution_log` |

---

## 5) Variables de entorno críticas

- `LOG_LEVEL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`

---

## 6) Plan de testing

- Unit tests con Vitest.
- Smoke de cron y lectura de `cron_jobs_execution_log`.

---

## 7) Plan de rollback

1. Revertir cambios en handlers si el logging genera errores de runtime.
2. Deshabilitar métricas adicionales si impactan performance.

---

## 8) Checklist post-implementación

- [x] 0 `console.*` en `supabase/functions` fuera de `_shared/logger.ts`.
- [x] Logs incluyen `requestId` o `runId`.
- [x] Inserciones exitosas en `cron_jobs_execution_log`.
