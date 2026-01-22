# C2 — Subplan E6 CI/CD & Release (MPC v2.0)

**Etapa:** E6
**Fecha:** 2026-01-22
**Versión:** 1.0.0

---

## 1) Alcance

- **WS6.1** Integrar pruebas de integración en pipeline con guards.
- **WS6.2** Validación de envs requeridas antes de build/deploy.
- **WS6.3** E2E frontend en CI (manual).

---

## 2) Referencias exactas (archivo:líneas)

- Pipeline:
  - `.github/workflows/ci.yml`
- Scripts de tests:
  - `test.sh`
  - `scripts/run-e2e-tests.sh`
  - `scripts/run-integration-tests.sh`

---

## 3) Subtareas (estimación en horas)

| ID | Tarea | Estimación | Entregable |
|---|---|---:|---|
| E6-T1 | Verificar guards de env en CI | 1h | Evidencia en workflow |
| E6-T2 | Validar job de integración gated | 2h | CI pasando |
| E6-T3 | Documentar ejecución manual E2E frontend | 1h | Runbook actualizado |

---

## 4) Variables de entorno críticas

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ALLOWED_ORIGINS`

---

## 5) Plan de testing

- Ejecutar pipeline en branch con envs válidas.
- Verificar que jobs gated se omiten sin env.

---

## 6) Plan de rollback

1. Revertir cambios en workflow.
2. Re-ejecutar pipeline estable.

---

## 7) Checklist pre-implementación

- [ ] Workflow de CI accesible.
- [ ] Variables de entorno definidas.

## 8) Checklist post-implementación

- [ ] Jobs gated pasan con env válidas.
- [ ] E2E frontend documentado.
