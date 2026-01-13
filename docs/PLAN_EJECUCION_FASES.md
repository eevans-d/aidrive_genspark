# PLAN DE EJECUCION FASE POR FASE (vigente)

**Fecha:** 2026-01-12 (actualizado con evidencia local)  
**Fuente:** codigo y comandos locales (sin credenciales Supabase reales)  
**Documento historico:** `docs/PLAN_TRES_PUNTOS.md`

---

## Metodologia
- Orden logico: DB -> Backend -> Scraper/Cron -> Frontend -> Tests -> Release.
- Cada fase incluye estado real, evidencia local y acciones separadas sin/con credenciales.
- Todo lo no verificable en Supabase real queda marcado como pendiente.

## Estados
- COMPLETA EN REPO: codigo + tests unitarios verificados localmente.
- PARCIAL: codigo existe, pero falta validacion en entorno real o tareas clave.
- PENDIENTE: requiere credenciales o desarrollo aun no implementado.

---

## Evidencia base verificada (local)
- Migraciones: 9 archivos en `supabase/migrations/` (incluye `20260109070000_create_core_tables.sql` y `20260109090000_update_sp_movimiento_inventario.sql`).
- Tests unitarios: 11 archivos, 147 tests (`npm test`).
- Shared libs: `supabase/functions/_shared/*` (cors, response, errors, logger, rate-limit, circuit-breaker).
- E2E/Integration: existen suites en `tests/integration/*` y `tests/e2e/*`, pero requieren `.env.test`.
- Performance/Seguridad/Contratos: suites legacy en `tests/performance`, `tests/security`, `tests/api-contracts`.

## Ejecucion sin credenciales (resultado)
- `npm test`: **147 tests unitarios OK** (11 archivos).
- `bash scripts/run-integration-tests.sh --dry-run`: prerequisitos OK (sin ejecutar Supabase).
- `bash scripts/run-e2e-tests.sh --dry-run`: prerequisitos OK (sin ejecutar Supabase).
- `pnpm lint` (frontend): OK (sin warnings).
- `pnpm build` (frontend): OK sin warning de chunk (>500 kB resuelto con code splitting).
- Contratos/mocks frontend-backend: definidos en `docs/CONTRATOS_FRONTEND_BACKEND.md`.

---

## FASES (re-analisis con evidencia)

### FASE 1: Base de datos - gaps y esquema
**Estado real:** PARCIAL  
**Evidencia:** `supabase/migrations/*`, `docs/DB_GAPS.md`.  
**Contraste:** migraciones existen, pero no hay evidencia de aplicacion en staging/prod.  
**Plan ajustado:**
- Sin credenciales: revisar gaps vs migraciones y actualizar `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` si aplica.
- Con credenciales: aplicar migraciones en staging/prod y guardar evidencia.
- Verificacion: checklist WS3.1 en `docs/CHECKLIST_CIERRE.md`.

### FASE 2: Base de datos - RLS y funciones criticas
**Estado real:** PARCIAL  
**Evidencia:** `supabase/migrations/20260104083000_add_rls_policies.sql`, `supabase/migrations/20260110100000_fix_rls_security_definer.sql`.  
**Contraste:** RLS y hardening existen en SQL, pero no validados con usuarios reales.  
**Plan ajustado:**
- Sin credenciales: auditar SQL (RLS + SECURITY DEFINER) y documentar riesgos.
- Con credenciales: validar politicas RLS con anon/JWT.
- Verificacion: pruebas de acceso y reporte en docs.

### FASE 3: Utilidades compartidas de Edge Functions
**Estado real:** PARCIAL  
**Evidencia:** `supabase/functions/_shared/*` y uso en `api-minimarket`/`api-proveedor`.  
**Contraste:** shared libs existen, adopcion parcial en funciones auxiliares.  
**Plan ajustado:**
- Sin credenciales: mapear adopcion de `_shared` en funciones criticas.
- Con credenciales: validar respuestas/errores en despliegue real.
- Verificacion: `rg -n "console\\.log" supabase/functions` solo en testing.

### FASE 4: INTEGRACION 1 - DB + Shared
**Estado real:** PENDIENTE  
**Evidencia:** `scripts/run-integration-tests.sh`, `tests/integration/*`.  
**Plan ajustado:**
- Sin credenciales: `bash scripts/run-integration-tests.sh --dry-run`.
- Con credenciales: `npm run test:integration`.
- Verificacion: reportes en `test-reports/`.
**Ejecucion sin credenciales:** dry-run ejecutado (prerequisitos OK).

### FASE 5: API Gateway principal (api-minimarket)
**Estado real:** COMPLETA EN REPO  
**Evidencia:** `supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-minimarket/helpers/*`, `tests/unit/api-minimarket-gateway.test.ts`.  
**Contraste:** no se detecta uso de service role en gateway.  
**Plan ajustado:**
- Sin credenciales: mantener tests unitarios como guardia.
- Con credenciales: smoke real de endpoints con JWT.
- Verificacion: `npm test`.

### FASE 6: API Proveedor - routing y validaciones
**Estado real:** COMPLETA EN REPO  
**Evidencia:** `supabase/functions/api-proveedor/{index,router,validators,schemas,utils}`, `tests/unit/api-proveedor-routing.test.ts`.  
**Plan ajustado:**
- Sin credenciales: mantener cobertura de validators.
- Con credenciales: smoke real con `x-api-secret`.
- Verificacion: tests unitarios de routing.

### FASE 7: API Proveedor - handlers y logica de negocio
**Estado real:** PARCIAL  
**Evidencia:** handlers en `supabase/functions/api-proveedor/handlers/*`, read mode en `API_PROVEEDOR_READ_MODE`, `tests/unit/api-proveedor-auth.test.ts`.  
**Contraste:** lecturas por anon/JWT implementadas, pero RLS no validado en staging/prod.  
**Plan ajustado:**
- Sin credenciales: revisar handlers y cache.
- Con credenciales: validar RLS y cache persistente.
- Verificacion: unit tests + smoke con datos reales.

### FASE 8: INTEGRACION 2 - Gateway + API Proveedor
**Estado real:** PENDIENTE  
**Evidencia:** `tests/e2e/api-proveedor.smoke.test.ts`, `scripts/run-e2e-tests.sh`.  
**Plan ajustado:**
- Sin credenciales: documentar headers esperados (x-api-secret, request-id).
- Con credenciales: ejecutar E2E proveedor.
- Verificacion: reporte E2E.

### FASE 9: Scraper - scraping y anti-detection
**Estado real:** PARCIAL  
**Evidencia:** `supabase/functions/scraper-maxiconsumo/*`.  
**Plan ajustado:**
- Sin credenciales: revisar config, timeouts y anti-detection.
- Con credenciales: validar `/scrape` y `/compare`.
- Verificacion: `tests/unit/scraper-config.test.ts`.

### FASE 10: Scraper - parsing, matching y persistencia
**Estado real:** PARCIAL  
**Evidencia:** `parsing.ts`, `matching.ts`, `storage.ts`, `tests/unit/scraper-parsing.test.ts`, `tests/unit/scraper-matching.test.ts`.  
**Plan ajustado:**
- Sin credenciales: ampliar casos borde en parsing/matching.
- Con credenciales: validar inserciones reales en DB.
- Verificacion: tests unit + integration scraper.

### FASE 11: Cron jobs - ejecucion y orquestacion
**Estado real:** PARCIAL  
**Evidencia:** `supabase/functions/cron-jobs-maxiconsumo/*`, `tests/unit/cron-jobs.test.ts`.  
**Plan ajustado:**
- Sin credenciales: revisar orquestador y payloads.
- Con credenciales: ejecutar cron y validar `cron_jobs_execution_log`.
- Verificacion: tests unit + logs reales.

### FASE 12: INTEGRACION 3 - Scraper + Cron
**Estado real:** PENDIENTE  
**Evidencia:** `tests/integration/api-scraper.integration.test.ts`.  
**Plan ajustado:**
- Sin credenciales: `--dry-run` de integration.
- Con credenciales: ejecutar integration + revisar logs.
- Verificacion: reporte integration.

### FASE 13: Alertas y notificaciones
**Estado real:** PARCIAL  
**Evidencia:** `supabase/functions/alertas-stock/index.ts`, `supabase/functions/notificaciones-tareas/index.ts`.  
**Plan ajustado:**
- Sin credenciales: revisar flujo de alertas y dependencias.
- Con credenciales: smoke de alertas y persistencia.
- Verificacion: logs + tablas de alertas.

### FASE 14: Reportes y dashboard cron
**Estado real:** PARCIAL  
**Evidencia:** `supabase/functions/reportes-automaticos/index.ts`, `supabase/functions/cron-dashboard/index.ts`.  
**Plan ajustado:**
- Sin credenciales: revisar payloads y formato de reportes.
- Con credenciales: validar ejecucion en cron real.
- Verificacion: logs + tablas destino.

### FASE 15: Operacion, configuracion y monitoreo
**Estado real:** PARCIAL  
**Evidencia:** `docs/OPERATIONS_RUNBOOK.md`, endpoints `health` en `api-proveedor` y `scraper-maxiconsumo`.  
**Plan ajustado:**
- Sin credenciales: alinear runbook con estado real.
- Con credenciales: validar health checks y tiempos.
- Verificacion: checklist operativo actualizado.

### FASE 16: INTEGRACION 4 - Operacion + alertas + reportes
**Estado real:** PENDIENTE  
**Plan ajustado:**
- Sin credenciales: definir escenarios de verificacion.
- Con credenciales: smoke end-to-end.
- Verificacion: runbook + logs.

### FASE 17: Frontend core (app, auth, layout)
**Estado real:** PARCIAL  
**Evidencia:** `minimarket-system/src/App.tsx`, `AuthContext.tsx`, `Layout.tsx`, `Login.tsx`.  
**Plan ajustado:**
- Sin credenciales: revisar rutas y protecciones UI.
- Con credenciales: validar login real contra Supabase.
- Verificacion: `pnpm lint` y `pnpm build`.
**Ejecucion sin credenciales:** `pnpm lint` OK; rutas lazy en `App.tsx` para code splitting.

### FASE 18: Frontend pages A (login, dashboard, stock, deposito)
**Estado real:** PARCIAL  
**Evidencia:** `Dashboard.tsx` usa `count=exact`, `Deposito.tsx` usa `sp_movimiento_inventario`.  
**Contraste:** correccion de count y RPC ya implementadas en codigo.  
**Plan ajustado:**
- Sin credenciales: revisar validaciones UI y errores.
- Con credenciales: validar stock atomico y RLS.
- Verificacion: smoke manual UI.
**Ejecucion sin credenciales:** `pnpm build` OK sin warning de chunk.

### FASE 19: Frontend pages B (productos, proveedores, tareas)
**Estado real:** PARCIAL  
**Evidencia:** `Productos.tsx`, `Proveedores.tsx`, `Tareas.tsx`.  
**Plan ajustado:**
- Sin credenciales: revisar filtros y estado UI.
- Con credenciales: validar paginado y acciones reales.
- Verificacion: smoke manual UI.
**Ejecucion sin credenciales:** errores TypeScript corregidos en `Productos.tsx` y `Proveedores.tsx`.

### FASE 20: INTEGRACION 5 - Frontend + Backend
**Estado real:** PENDIENTE  
**Contraste:** E2E frontend disponible con mocks; falta integracion real frontend + backend.  
**Plan ajustado:**
- Sin credenciales: definir contratos y mocks.
- Con credenciales: pruebas E2E reales.
- Verificacion: nueva suite E2E frontend (pendiente).
**Ejecucion sin credenciales:** contratos definidos en `docs/CONTRATOS_FRONTEND_BACKEND.md`, mock Supabase en `minimarket-system/src/lib/supabase.ts` + `minimarket-system/src/mocks/*` (flag `VITE_USE_MOCKS`), scaffolding E2E frontend en `minimarket-system/playwright.config.ts` + `minimarket-system/e2e/*` y `npx playwright test` / `pnpm test:e2e:frontend` OK (6 tests).

### FASE 21: Tests unitarios
**Estado real:** COMPLETA EN REPO  
**Evidencia:** `tests/unit/*` y `npm test` (147).  
**Plan ajustado:** mantener como guardia base.
**Ejecucion sin credenciales:** `npm test` OK (147).

### FASE 22: Tests de integracion y E2E
**Estado real:** PENDIENTE  
**Evidencia:** `tests/integration/*`, `tests/e2e/*` (incluye `edge-functions.test.js`).  
**Plan ajustado:**
- Sin credenciales: `--dry-run`.
- Con credenciales: ejecutar integration/E2E y registrar reportes.
**Ejecucion sin credenciales:** dry-run integration/E2E ejecutado; E2E frontend con mocks ejecutado (Playwright, 6 tests OK).

### FASE 23: Performance, seguridad y contratos API
**Estado real:** PENDIENTE  
**Evidencia:** `tests/performance/*`, `tests/security/*`, `tests/api-contracts/*` (legacy Jest).  
**Plan ajustado:**
- Sin credenciales: migrar a Vitest o documentar runner separado.
- Con credenciales: ejecutar suites con fixtures reales.

### FASE 24: INTEGRACION 6 - Release candidate y regresion
**Estado real:** PENDIENTE  
**Plan ajustado:**
- Sin credenciales: checklist de release y scripts `--dry-run`.
- Con credenciales: suite completa + build frontend.
- Verificacion: `docs/CHECKLIST_CIERRE.md` completo.
