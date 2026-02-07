# C2 — Subplan E2 Testing & QA (MPC v2.1)

**Etapa:** E2  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** ✅ Completado (gated por credenciales)  

---


## Nota de ejecucion (para ejecutores)
- Seguir plantilla obligatoria definida en `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`.
- No improvisar comandos ni flujos fuera del plan.
- Registrar evidencia y actualizar `docs/CHECKLIST_CIERRE.md` y `docs/DECISION_LOG.md`.

## 1) Estado actual

- Unit tests: ver `docs/ESTADO_ACTUAL.md` (conteo vigente).
- Integration tests: 38 definidos (gated por credenciales).
- E2E backend smoke: 4 definidos (gated por Supabase local).
- E2E frontend auth real: 10 definidos (2 skip; gated por credenciales).
- Performance baseline documentado.

---

## 2) Alcance

- **WS2.1** Runner de integración definido y documentado.
- **WS2.2** Smoke tests E2E mínimos (status, precios, alertas).
- **WS2.3** Evidencias en `test-reports/`.
- **WS2.4** Performance baseline (tests/performance).

---

## 3) Evidencias y referencias

- Config unit: `vitest.config.ts`.
- Config integration: `vitest.integration.config.ts`.
- Config E2E smoke: `vitest.e2e.config.ts`.
- Playwright auth real: `minimarket-system/e2e/auth.real.spec.ts`.
- Evidencia consolidada: `docs/CHECKLIST_CIERRE.md`.

---

## 4) Subtareas

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| E2-T1 | Validar runner integración en local | ✅ | `scripts/run-integration-tests.sh` |
| E2-T2 | Documentar prerequisitos y envs | ✅ | `docs/E2E_SETUP.md` |
| E2-T3 | Definir smoke tests E2E backend | ✅ | `tests/e2e/*.smoke.test.ts` |
| E2-T4 | Centralizar evidencias | ✅ | `test-reports/*` |
| E2-T5 | Baseline performance | ✅ | `tests/performance/load-testing.vitest.test.ts` |
| E2-T6 | E2E frontend auth real | ✅ | `minimarket-system/e2e/auth.real.spec.ts` |

---

## 5) Variables de entorno críticas

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 6) Comandos exactos

- `npm run test:unit` (root).
- `npm run test:integration` (gated; requiere `.env.test`).
- `npm run test:e2e` (backend smoke; requiere Supabase local).
- `cd minimarket-system && VITE_USE_MOCKS=false pnpm exec playwright test auth.real` (frontend auth real).

## 7) Plan de testing

- `npm run test:unit`
- `npm run test:integration` (gated)
- `npm run test:e2e` (backend smoke)
- `VITE_USE_MOCKS=false pnpm exec playwright test auth.real` (frontend)

---

## 8) Plan de rollback

1. Si fallan suites por envs, ejecutar `--dry-run` y documentar.
2. Revertir configs si afectan unit tests.

---

## 9) Checklist post-implementación

- [x] Unitarios ejecutan sin errores.
- [x] Integración y E2E con guards de env.
- [x] Performance baseline con evidencia.
