# C2 — Subplan E2 Testing & QA (MPC v2.0)

**Etapa:** E2
**Fecha:** 2026-01-22
**Versión:** 1.0.0

---

## 1) Alcance

- **WS2.1** Runner de integración definido y documentado.
- **WS2.2** Smoke tests E2E mínimos (status, precios, alertas).
- **WS2.3** Evidencias en `test-reports/`.
- **WS2.4** Performance baseline (tests/performance) con evidencia.

---

## 2) Referencias exactas (archivo:líneas)

- Config unit tests:
  - `vitest.config.ts:1-106`
- Config integration tests:
  - `vitest.integration.config.ts:1-39`
- Config E2E smoke:
  - `vitest.e2e.config.ts:1-20`
- Setup tests:
  - `tests/setup.ts:1-3`
- Script de testing:
  - `test.sh:1-200`

---

## 3) Subtareas (estimación en horas)

| ID | Tarea | Estimación | Entregable |
|---|---|---:|---|
| E2-T1 | Validar runner integración en local | 2h | Evidencia de ejecución |
| E2-T2 | Documentar prerequisitos y envs | 2h | Checklist en docs/evidencias |
| E2-T3 | Definir smoke tests mínimos E2E | 3h | Tests `tests/e2e/**/*.smoke.test.ts` |
| E2-T4 | Centralizar evidencias en `test-reports/` | 1h | JUnit actualizado |
| E2-T5 | Validar baseline de performance | 1h | Evidencia en `tests/performance/load-testing.vitest.test.ts` |

---

## 4) Variables de entorno críticas

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `TEST_DATABASE_URL` (si aplica)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 5) Plan de testing

### Unitarios
- Vitest (jsdom) con configuración en `vitest.config.ts`.

### Integración
- Vitest (node) con `vitest.integration.config.ts`.

### E2E Smoke
- Vitest (node) con `vitest.e2e.config.ts` apuntando a tests `tests/e2e/**/*.smoke.test.ts`.
- Nota: solo corre archivos con sufijo `.smoke.test.ts` definidos en `vitest.e2e.config.ts`.

---

## 6) Plan de rollback

1. Si los smoke tests fallan por envs, aislar con guards y documentar.
2. Revertir cambios en configs si rompen unit/integration.
3. Mantener una versión previa del runner en CI.

---

## 7) Checklist pre-implementación

- [ ] Verificar disponibilidad de Vitest.
- [ ] Confirmar rutas de tests (`tests/unit`, `tests/integration`, `tests/e2e`).
- [ ] Confirmar variables de entorno mínimas.

## 8) Checklist post-implementación

- [ ] Unitarios ejecutan sin errores.
- [ ] Integración ejecuta con runner definido.
- [ ] Smoke E2E mínimo pasa o falla con mensaje claro por env.
- [ ] Baseline de performance con evidencia local.
- [ ] Evidencia generada en `test-reports/`.
