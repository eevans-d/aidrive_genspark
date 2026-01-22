# C2 — Subplan E8 Cron & Automatizaciones (MPC v2.0)

**Etapa:** E8
**Fecha:** 2026-01-22
**Versión:** 1.0.0

---

## 1) Alcance

- **WS4.1** Validación runtime de alertas/comparaciones.
- **WS4.2** Consistencia en uso de `_shared` en cron auxiliares.

---

## 2) Referencias exactas (archivo:líneas)

- Orquestador cron principal:
  - `supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts`
- Jobs:
  - `supabase/functions/cron-jobs-maxiconsumo/jobs/*`
- Cron auxiliares:
  - `supabase/functions/cron-notifications/*`
  - `supabase/functions/cron-dashboard/*`
  - `supabase/functions/cron-health-monitor/*`

---

## 3) Subtareas (estimación en horas)

| ID | Tarea | Estimación | Entregable |
|---|---|---:|---|
| E8-T1 | Validar runtime en alertas/comparaciones | 2h | Validadores activos |
| E8-T2 | Unificar logging en cron auxiliares | 3h | Logs estructurados |
| E8-T3 | Revisar métricas por job | 2h | Métricas consistentes |

---

## 4) Variables de entorno críticas

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOG_LEVEL`

---

## 5) Plan de testing

- Ejecutar cron jobs en local con Supabase local.
- Validar inserciones en `cron_jobs_execution_log`.

---

## 6) Plan de rollback

1. Revertir cambios en cron auxiliares.
2. Re-ejecutar smoke de cron.

---

## 7) Checklist pre-implementación

- [ ] Cron auxiliares identificados.
- [ ] Logger `_shared` disponible.

## 8) Checklist post-implementación

- [ ] Logs estructurados en cron auxiliares.
- [ ] Validaciones runtime activas.
