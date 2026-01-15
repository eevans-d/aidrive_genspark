# INVENTARIO ACTUAL (v5 - 2026-01-15)

**Estado:** Plan histórico no completado ⚠️  
**Plan vigente:** ver `docs/ROADMAP.md`

---

## Directorios principales
- `minimarket-system/` frontend React + Vite + TypeScript
- `supabase/functions/` Edge Functions (Deno) - **MODULARIZADAS**
- `supabase/functions/_shared/` Utilidades compartidas (6 módulos)
- `supabase/migrations/` migraciones SQL (9)
- `supabase/cron_jobs/` scripts y JSON de scheduling
- `tests/unit/` Tests unitarios Vitest (**13 archivos, 193 tests** ✅)
- `tests/integration/` Tests integración Vitest (2 archivos, 31 tests - gated)
- `tests/e2e/` Smoke tests E2E Vitest (2 archivos, 4 tests - gated)
- `tests/performance/` Performance tests (**legacy/Jest - desactivado**)
- `tests/security/` Security tests (**legacy/Jest - desactivado**)
- `tests/api-contracts/` API contracts (**legacy/Jest - desactivado**)
- `docs/` documentación técnica (21 archivos)
- `.github/workflows/` CI/CD (1 workflow - **con jobs gated**)

---

## Edge Functions (estructura modular)

### Funciones principales (modularizadas)
- `api-proveedor/` → router.ts, schemas.ts, validators.ts, handlers/, utils/
- `scraper-maxiconsumo/` → 9 módulos (types, config, cache, anti-detection, parsing, matching, storage, scraping, index)
- `cron-jobs-maxiconsumo/` → jobs/ (4 jobs), orchestrator.ts, config.ts, types.ts
- **Auth/CORS:** `api-proveedor` y `scraper-maxiconsumo` requieren `x-api-secret` y bloquean requests sin `Origin` permitido (`ALLOWED_ORIGINS`). Lecturas de `api-proveedor` usan anon/JWT por defecto (configurable con `API_PROVEEDOR_READ_MODE=service`).

### Funciones auxiliares
- `api-minimarket/index.ts` - API Gateway principal (**hardened: JWT auth, CORS, rate limit 60/min, circuit breaker**)
- `api-minimarket/helpers/` - **NUEVO** Helpers modularizados:
  - `auth.ts` (163 líneas) - extractBearerToken, verifyJwt, requireRole
  - `validation.ts` (130 líneas) - isUuid, isValidDate, validateRequiredFields
  - `pagination.ts` (96 líneas) - parsePagination, buildRangeHeader
  - `supabase.ts` (205 líneas) - createClient, queryTable, callFunction
  - `index.ts` - barrel export
- `cron-testing-suite/index.ts` - Testing e2e cron
- `cron-notifications/index.ts` - Notificaciones
- `cron-dashboard/index.ts` - Dashboard API
- `cron-health-monitor/index.ts` - Health monitor
- `alertas-stock/index.ts` - Alertas inventario
- `reportes-automaticos/index.ts` - Reportes
- `notificaciones-tareas/index.ts` - Notificaciones tareas

### Shared libs (`_shared/`)
- `cors.ts` - Headers CORS unificados
- `response.ts` - Respuestas ok/fail
- `errors.ts` - Tipos AppError/HttpError
- `logger.ts` - Logging estructurado
- `rate-limit.ts` - Rate limiting
- `circuit-breaker.ts` - Circuit breaker

---

## Migraciones SQL
- `20250101000000_version_sp_aplicar_precio.sql`
- `20251103_create_cache_proveedor.sql`
- `20260104020000_create_missing_objects.sql`
- `20260104083000_add_rls_policies.sql`
- `20260109060000_create_precios_proveedor.sql`
- `20260109070000_create_core_tables.sql`
- `20260109090000_update_sp_movimiento_inventario.sql`
- `20260110000000_fix_constraints_and_indexes.sql`
- `20260110100000_fix_rls_security_definer.sql`

---

## Tests (Vitest 4.0.16)
- `tests/unit/api-proveedor-routing.test.ts` (17 tests)
- `tests/unit/api-proveedor-auth.test.ts` (6 tests)
- `tests/unit/api-proveedor-read-mode.test.ts` (**34 tests** - READ_MODE, auth headers, endpoint contracts) **NUEVO**
- `tests/unit/scraper-parsing.test.ts` (10 tests)
- `tests/unit/scraper-matching.test.ts` (9 tests)
- `tests/unit/scraper-alertas.test.ts` (3 tests)
- `tests/unit/scraper-cache.test.ts` (4 tests)
- `tests/unit/scraper-config.test.ts` (22 tests)
- `tests/unit/scraper-cookie-jar.test.ts` (20 tests)
- `tests/unit/scraper-storage-auth.test.ts` (**12 tests** - alertas builder, service role contracts) **NUEVO**
- `tests/unit/cron-jobs.test.ts` (8 tests)
- `tests/unit/response-fail-signature.test.ts` (2 tests)
- `tests/unit/api-minimarket-gateway.test.ts` (**46 tests** - auth, validation, pagination, supabase, CORS, rate limit)
- `tests/integration/api-scraper.integration.test.ts` (integration - gated)
- `tests/integration/database.integration.test.ts` (integration - gated)
- `tests/e2e/api-proveedor.smoke.test.ts` (smoke - gated)
- `tests/e2e/cron.smoke.test.ts` (smoke - gated)
- **Total: 193 tests unitarios pasando** ✅ (13 archivos)

### Tests E2E Frontend (Playwright)
- `minimarket-system/e2e/app.smoke.spec.ts` (**6 tests** - dashboard, productos, stock, deposito)
- `minimarket-system/e2e/tareas.proveedores.spec.ts` (**2 tests** - tareas, proveedores) **NUEVO**
- **Total: 8 E2E frontend pasando** ✅ (`pnpm test:e2e:frontend`)

Suites legacy (desactivadas de CI - ver README en cada carpeta):
- `tests/performance/load-testing.vitest.test.ts` → migrado (mock)
- `tests/security/security.vitest.test.ts` → migrado (mock)
- `tests/api-contracts/openapi-compliance.vitest.test.ts` → migrado (mock)
- Legacy de referencia: `tests/security/security-tests.legacy.js`, `tests/api-contracts/openapi-compliance.legacy.js`, `tests/api-contracts/openapi-compliance.test.js`, `tests/security/security-tests.test.js`

---

## CI/CD
- `.github/workflows/ci.yml`:
  - Jobs obligatorios: lint, test (unit), build, typecheck, edge-functions-check
  - Jobs gated: integration (requiere `vars.RUN_INTEGRATION_TESTS` o `workflow_dispatch`)
  - Jobs manuales: e2e (solo via `workflow_dispatch` con `run_e2e=true`)
- Variables de entorno requeridas para producción:
  - `ALLOWED_ORIGINS` - lista de orígenes permitidos para CORS
  - `API_PROVEEDOR_SECRET` - secret para API proveedor
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Docs (22 archivos)
- `PLAN_EJECUCION.md` - Plan técnico (histórico)
- `ROADMAP.md` - Plan vigente (rolling)
- `DECISION_LOG.md` - Decisiones vigentes
- `CHECKLIST_CIERRE.md` - Estado del proyecto
- `INVENTARIO_ACTUAL.md` - Este archivo
- `ESTADO_ACTUAL.md` - Estado aproximado hacia producción
- `AUDITORIA_RLS_CHECKLIST.md` - Checklist auditoría RLS (pendiente credenciales) **NUEVO**
- `OBJETIVOS_Y_KPIS.md`
- `PLAN_WS_DETALLADO.md` - Plan operativo por workstreams
- `BASELINE_TECNICO.md`
- `DB_GAPS.md`
- `API_README.md`
- `ARCHITECTURE_DOCUMENTATION.md`
- `CRON_JOBS_COMPLETOS.md`
- `DEPLOYMENT_GUIDE.md`
- `DOCUMENTACION_TECNICA_ACTUALIZADA.md`
- `ESQUEMA_BASE_DATOS_ACTUAL.md`
- `OPERATIONS_RUNBOOK.md`
- `api-openapi-3.1.yaml`
- `api-proveedor-openapi-3.1.yaml`
- `postman-collection.json` / `postman-collection-proveedor.json`

---

## Scripts
- `deploy.sh`, `migrate.sh`, `setup.sh` - Operaciones
- `scripts/run-integration-tests.sh` - Supabase local + integration
- `scripts/run-e2e-tests.sh` - Supabase local + E2E smoke
- `scripts/rls_audit.sql` - Auditoría RLS (136 líneas, pendiente credenciales) **NUEVO**
- `test.sh` - Runner legacy (usar `npx vitest run`)
- `vitest.config.ts` - Configuración Vitest (unit)
- `vitest.integration.config.ts` - Configuración Vitest (integration)
- `vitest.e2e.config.ts` - Configuración Vitest (e2e)
