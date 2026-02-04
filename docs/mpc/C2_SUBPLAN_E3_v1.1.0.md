# C2 — Subplan E3 DB & Migraciones (MPC v2.1)

**Etapa:** E3  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** ✅ Completado (rollback probado 2026-01-30)  

---


## Nota de ejecucion (para ejecutores)
- Seguir plantilla obligatoria definida en `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.
- No improvisar comandos ni flujos fuera del plan.
- Registrar evidencia y actualizar `docs/CHECKLIST_CIERRE.md` y `docs/DECISION_LOG.md`.

## 1) Estado actual

- Migraciones verificadas: conteo repo actual 12 archivos (aplicación en entornos requiere verificación).
- Rollback documentado en `docs/DEPLOYMENT_GUIDE.md`.
- **Completado:** rollback real en staging (OPS-SMART-1, 2026-01-30). Checklist: `docs/archive/ROLLBACK_DRILL_STAGING.md`. Evidencia: `docs/ROLLBACK_EVIDENCE_2026-01-29.md`.

---

## 2) Alcance

- **WS3.1** Validación de migraciones en staging/prod.
- **WS3.2** Rollback documentado y probado.

> Nota: Auditoría RLS se ejecuta en E4 Seguridad (WS7.1).

---

## 3) Evidencias y referencias

- Migraciones: `supabase/migrations/`.
- Rollback documentado: `docs/DEPLOYMENT_GUIDE.md`.
- Checklist cierre: `docs/CHECKLIST_CIERRE.md`.

---

## 4) Subtareas

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| E3-T1 | Validar migraciones recientes | ✅ | `docs/CHECKLIST_CIERRE.md` |
| E3-T2 | Documentar rollback | ✅ | `docs/DEPLOYMENT_GUIDE.md` |
| E3-T3 | Probar rollback en staging | ✅ | Ejecutado 2026-01-30 (SQL manual). Evidencia: `docs/ROLLBACK_EVIDENCE_2026-01-29.md` |

---

## 5) Variables de entorno críticas

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 6) Comandos exactos

- `./migrate.sh status staging` (verifica migraciones).
- `./migrate.sh up staging` (aplica migraciones).
- `./migrate.sh down staging` (rollback controlado; solo con backup).

## 7) Plan de testing

- Validar migraciones en staging/prod.
- Ejecutar rollback controlado y verificar schema.

---

## 8) Plan de rollback

1. Identificar migración a revertir (timestamp en `supabase/migrations/`).
2. Ejecutar rollback controlado.
3. Verificar que el schema vuelva al estado anterior.

---

## 9) Checklist post-implementación

- [x] Migraciones validadas por entorno.
- [x] Rollback probado en staging con evidencia (2026-01-30).
