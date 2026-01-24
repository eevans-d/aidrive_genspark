# C2 — Subplan E8 Cron & Automatizaciones (MPC v2.1)

**Etapa:** E8  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** ✅ Completado (mantenimiento)  

---


## Nota de ejecucion (para ejecutores)
- Seguir plantilla obligatoria definida en `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.
- No improvisar comandos ni flujos fuera del plan.
- Registrar evidencia y actualizar `docs/CHECKLIST_CIERRE.md` y `docs/DECISION_LOG.md`.

## 1) Estado actual

- Validación runtime activa en jobs críticos.
- Logging estructurado en cron auxiliares.
- Métricas persistidas en `cron_jobs_execution_log`.

---

## 2) Alcance

- **WS4.1** Validación runtime de alertas/comparaciones.
- **WS4.2** Consistencia en uso de `_shared` en cron auxiliares.

---

## 3) Evidencias y referencias

- Validadores: `supabase/functions/cron-jobs-maxiconsumo/validators.ts`.
- Job realtime alerts: `supabase/functions/cron-jobs-maxiconsumo/jobs/realtime-alerts.ts`.
- Cron auxiliares: `supabase/functions/cron-dashboard`, `cron-health-monitor`, `cron-notifications`.

---

## 4) Subtareas

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| E8-T1 | Validación runtime en alertas/comparaciones | ✅ | `validators.ts` |
| E8-T2 | Unificar logging en cron auxiliares | ✅ | `_shared/logger.ts` |
| E8-T3 | Revisar métricas por job | ✅ | `cron_jobs_execution_log` |

---

## 5) Variables de entorno críticas

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOG_LEVEL`

---

## 6) Comandos exactos

- `npx vitest run tests/unit/cron-validators.test.ts` (validadores).
- `npx vitest run tests/unit/cron-jobs.test.ts` (jobs).

## 7) Plan de testing

- Ejecutar cron jobs en local con Supabase local.
- Validar inserciones en `cron_jobs_execution_log`.

---

## 8) Plan de rollback

1. Revertir cambios en cron auxiliares.
2. Re-ejecutar smoke de cron.

---

## 9) Checklist post-implementación

- [x] Logs estructurados en cron auxiliares.
- [x] Validaciones runtime activas.
