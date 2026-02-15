> [DEPRECADO: 2026-02-13] Documento historico. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/MEGA_PLAN_2026-02-13_042956.md`, `docs/closure/OPEN_ISSUES.md`.

# C2 — Subplan E6 CI/CD & Release (MPC v2.1)

**Etapa:** E6  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** ✅ Completado (jobs gated)  

---


## Nota de ejecucion (para ejecutores)
- Seguir plantilla obligatoria definida en `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.
- No improvisar comandos ni flujos fuera del plan.
- Registrar evidencia y actualizar `docs/CHECKLIST_CIERRE.md` y `docs/DECISION_LOG.md`.

## 1) Estado actual

- Pipeline CI activo con jobs de lint/test/build/typecheck.
- Integration y E2E gated por env/dispatch.
- Documentación de ejecución manual disponible.

---

## 2) Alcance

- **WS6.1** Integrar pruebas de integración en pipeline con guards.
- **WS6.2** Validación de envs requeridas antes de build/deploy.
- **WS6.3** E2E frontend en CI (manual).

---

## 3) Evidencias y referencias

- Workflow: `.github/workflows/ci.yml`.
- Scripts: `scripts/run-e2e-tests.sh`, `scripts/run-integration-tests.sh`.
- Runbook: `docs/OPERATIONS_RUNBOOK.md`.

---

## 4) Subtareas

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| E6-T1 | Verificar guards de env en CI | ✅ | `ci.yml` |
| E6-T2 | Validar job de integración gated | ✅ | `ci.yml` |
| E6-T3 | Documentar ejecución manual E2E | ✅ | Runbook |

---

## 5) Variables de entorno críticas

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ALLOWED_ORIGINS`

---

## 6) Comandos exactos

- `gh workflow run ci.yml -R eevans-d/aidrive_genspark` (pipeline base).
- `gh workflow view ci.yml -R eevans-d/aidrive_genspark` (ver estado).

## 7) Plan de testing

- Ejecutar pipeline con envs válidas.
- Verificar que jobs gated se omiten sin env.

---

## 8) Plan de rollback

1. Revertir cambios en workflow si fallan jobs obligatorios.
2. Re-ejecutar pipeline estable.

---

## 9) Checklist post-implementación

- [x] Jobs gated pasan con env válidas.
- [x] E2E frontend documentado.
