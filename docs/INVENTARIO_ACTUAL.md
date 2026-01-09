# INVENTARIO ACTUAL (v3 - 2026-01-09)

**Estado:** Plan histórico no completado ⚠️  
**Plan vigente:** ver `docs/ROADMAP.md`

---

## Directorios principales
- `minimarket-system/` frontend React + Vite + TypeScript
- `supabase/functions/` Edge Functions (Deno) - **MODULARIZADAS**
- `supabase/functions/_shared/` Utilidades compartidas (6 módulos)
- `supabase/migrations/` migraciones SQL (4)
- `supabase/cron_jobs/` scripts y JSON de scheduling
- `tests/unit/` Tests unitarios Vitest (5 archivos, 47 tests)
- `docs/` documentación técnica (20 archivos)
- `.github/workflows/` CI/CD (1 workflow)

---

## Edge Functions (estructura modular)

### Funciones principales (modularizadas)
- `api-proveedor/` → router.ts, schemas.ts, validators.ts, handlers/, utils/
- `scraper-maxiconsumo/` → 9 módulos (types, config, cache, anti-detection, parsing, matching, storage, scraping, index)
- `cron-jobs-maxiconsumo/` → jobs/ (4 jobs), orchestrator.ts, config.ts, types.ts

### Funciones auxiliares
- `api-minimarket/index.ts` - API Gateway principal
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

---

## Tests (Vitest 4.0.16)
- `tests/unit/api-proveedor-routing.test.ts` (17 tests)
- `tests/unit/scraper-parsing.test.ts` (10 tests)
- `tests/unit/scraper-matching.test.ts` (9 tests)
- `tests/unit/scraper-alertas.test.ts` (3 tests)
- `tests/unit/cron-jobs.test.ts` (8 tests)
- **Total: 47 tests pasando**

---

## CI/CD
- `.github/workflows/ci.yml` → lint, test, build, typecheck, edge-functions-check

---

## Docs (17 archivos)
- `PLAN_EJECUCION.md` - Plan técnico (histórico)
- `ROADMAP.md` - Plan vigente (rolling)
- `DECISION_LOG.md` - Decisiones vigentes
- `CHECKLIST_CIERRE.md` - Estado del proyecto
- `INVENTARIO_ACTUAL.md` - Este archivo
- `ESTADO_ACTUAL.md` - Estado aproximado hacia producción
- `OBJETIVOS_Y_KPIS.md`
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
- `test.sh` - Runner legacy (usar `npx vitest run`)
- `vitest.config.ts` - Configuración Vitest
