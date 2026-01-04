# INVENTARIO ACTUAL (v1)

**Estado:** snapshot del repo

---

## Directorios principales
- `minimarket-system/` frontend React + Vite
- `supabase/functions/` Edge Functions (Deno)
- `supabase/migrations/` migraciones SQL (3)
- `supabase/cron_jobs/` scripts y JSON de scheduling
- `supabase/config.toml` configuracion local de Supabase
- `tests/` suite principal (Jest + scripts)
- `docs/` documentacion tecnica

---

## Edge Functions (lineas)
- `api-proveedor/index.ts` 3744
- `scraper-maxiconsumo/index.ts` 3212
- `cron-jobs-maxiconsumo/index.ts` 2900
- `cron-testing-suite/index.ts` 1413
- `cron-notifications/index.ts` 1184
- `cron-dashboard/index.ts` 1130
- `api-minimarket/index.ts` 1050
- `cron-health-monitor/index.ts` 898
- `reportes-automaticos/index.ts` 177
- `alertas-stock/index.ts` 160
- `notificaciones-tareas/index.ts` 155

---

## Migraciones SQL
- `supabase/migrations/20250101000000_version_sp_aplicar_precio.sql`
- `supabase/migrations/20251103_create_cache_proveedor.sql`
- `supabase/migrations/20260104020000_create_missing_objects.sql`

---

## Docs (carpeta docs/)
- `ANALISIS_EXHAUSTIVO_PROYECTO.md`
- `OBJETIVOS_Y_KPIS.md`
- `INVENTARIO_ACTUAL.md`
- `BASELINE_TECNICO.md`
- `DB_GAPS.md`
- `PLAN_EJECUCION.md`
- `PLAN_LIMPIEZA_CONTEXTO.md`
- `PROMPTS_CODEX_MINIMARKET.md`
- `API_README.md`
- `ARCHITECTURE_DOCUMENTATION.md`
- `CRON_JOBS_COMPLETOS.md`
- `DEPLOYMENT_GUIDE.md`
- `DOCUMENTACION_TECNICA_ACTUALIZADA.md`
- `ESQUEMA_BASE_DATOS_ACTUAL.md`
- `OPERATIONS_RUNBOOK.md`
- `api-openapi-3.1.yaml`
- `api-proveedor-openapi-3.1.yaml`
- `postman-collection.json`
- `postman-collection-proveedor.json`

---

## Tests
- `tests/unit/` (2 archivos)
- `tests/integration/` (2 archivos)
- `tests/security/` (1 archivo)
- `tests/performance/` (1 archivo)
- `tests/api-contracts/` (1 archivo)
- `tests/e2e/edge-functions.test.js` (gitignored)
- `tests/datos_reales/` (suite con scripts y results/)

---

## Scripts relevantes
- `test.sh` (runner principal)
- `test_cron_system.js` (verificacion cron/edge)
- `deploy.sh`, `migrate.sh`, `setup.sh`
