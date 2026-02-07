# C4 — HANDOFF TÉCNICO (MINI MARKET)

**Fecha:** 2026-02-06  
**Estado:** Vigente (handoff para ejecución por agente externo en Antigravity, modo Planning)

---

## 0) Start Here (para Antigravity / Planning)

Fuente de verdad y ruta de ejecución:
- `docs/ESTADO_ACTUAL.md` (estado real + checklist próximas 20 tareas).
- `docs/PLAN_EJECUCION_PREMORTEM.md` (workstreams, dependencias, riesgos).
- `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` (preflight + evidencias + bloqueos).
- `docs/closure/OPEN_ISSUES.md` (issues activos y severidad).

Runbook de ejecución (paso a paso por tarea):
- `docs/closure/ANTIGRAVITY_PLANNING_RUNBOOK.md`

---

## 1) Resumen del sistema
- Frontend: React + Vite + TS en `minimarket-system/`.
- Backend: Supabase Edge Functions en `supabase/functions/`.
- DB: Postgres (Supabase). Migraciones en `supabase/migrations/`.

## 2) Entrypoints críticos
- Gateway: `supabase/functions/api-minimarket/`.
- Proveedor: `supabase/functions/api-proveedor/`.
- Scraper: `supabase/functions/scraper-maxiconsumo/`.
- Cron jobs: `supabase/functions/cron-*/`.

## 3) Decisiones y riesgos vigentes (leer antes de tocar código)
- Breaking change: `POST /reservas` requiere header `Idempotency-Key` (ver `docs/API_README.md` y `supabase/functions/api-minimarket/handlers/reservas.ts`).
- `api-minimarket` está en `verify_jwt=false` en Supabase; la validación se hace en app (via `/auth/v1/user` + roles). Ver `docs/ESTADO_ACTUAL.md`.
- Preflight SQL puede quedar parcial: `psql` directo a `db.<ref>.supabase.co:5432` puede fallar por conectividad IPv6 desde algunos hosts (ver `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md`).

## 4) Operación básica (comandos exactos)

Backend (raíz):
```bash
npm run test:unit
npm run test:auxiliary
npm run test:integration
npm run test:e2e
npm run test:coverage
node scripts/smoke-notifications.mjs
```

Frontend:
```bash
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```

E2E auth real (frontend):
```bash
cd minimarket-system
VITE_USE_MOCKS=false pnpm exec playwright test auth.real
```

Evidencia esperada (local):
- `test-reports/junit.xml`
- `test-reports/junit.auxiliary.xml`
- `test-reports/junit.integration.xml`
- `test-reports/junit.e2e.xml`
- `coverage/`

Nota: `test-reports/` y `coverage/` están en `.gitignore`. Cada agente debe regenerar su evidencia.

## 5) Mecanismo de registro (qué actualizar al cerrar cada paso)
- Siempre actualizar `docs/ESTADO_ACTUAL.md` (checkbox + fecha + evidencia).
- Si hay decisión técnica: `docs/DECISION_LOG.md`.
- Si cambia el contrato API: `docs/API_README.md` y (si aplica) `docs/api-openapi-3.1.yaml`.
- Si cambia un riesgo operativo: `docs/closure/OPEN_ISSUES.md`.

## 6) Deploy / rollback / ops
- Deploy: `docs/DEPLOYMENT_GUIDE.md`.
- Operaciones: `docs/OPERATIONS_RUNBOOK.md`.
- Incidentes: `docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md`.
- SLA/SLO: `docs/C4_SLA_SLO_MINIMARKET_TEC.md`.

## 7) Contactos
- PO/Tech Lead/Ops: **TBD**.
