# MISIÓN: ANÁLISIS TÉCNICO INTEGRAL DEL PROYECTO

> [SNAPSHOT_INTERMEDIO: 2026-02-16] Reporte generado antes del cierre final en `main` (`17b00f7`).
> Puede contener métricas transitorias de rama/sesión (por ejemplo quality-gates o conteos parciales).
> Estado canónico vigente: `docs/ESTADO_ACTUAL.md` + `docs/closure/OPEN_ISSUES.md`.

- Fecha (UTC): `2026-02-16 03:46:09`
- Repo: `.`
- Branch: `integrate/p0-sync-2026-02-15`
- Commit: `7be6d5c27d7ef0c47316c53198f950c68ab6498e`
- Baseline log (safe): `docs/closure/BASELINE_LOG_2026-02-16_034546.md`

## 1. ARQUITECTURA Y ESTRUCTURA DEL PROYECTO

### A. Información General

- Nombre (package.json): `workspace`
- Tipo: fullstack (React/Vite frontend + Supabase Edge Functions backend + Postgres/Supabase)
- Stack (alto nivel):
  - Node: `v20.20.0` | npm: `11.8.0` | pnpm: `9.15.9`
  - Supabase CLI: `2.72.7
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli`
- Root package deps (high-signal): `vitest`, `@supabase/supabase-js`, `@tanstack/react-query`
- Frontend deps (high-signal): `react_repo` (ver `minimarket-system/package.json`)

### B. Componentes Principales

- Edge Functions en repo: 13
  - `alertas-stock`, `alertas-vencimientos`, `api-minimarket`, `api-proveedor`, `cron-dashboard`, `cron-health-monitor`, `cron-jobs-maxiconsumo`, `cron-notifications`, `cron-testing-suite`, `notificaciones-tareas`, `reportes-automaticos`, `reposicion-sugerida`, `scraper-maxiconsumo`
- OpenAPI paths (api-minimarket spec): 45 (muestra hasta 45):
  - `/categorias`, `/categorias/{id}`, `/productos`, `/productos/{id}`, `/proveedores`, `/proveedores/{id}`, `/precios/aplicar`, `/precios/producto/{id}`, `/precios/redondear`, `/precios/margen-sugerido/{id}`, `/reportes/efectividad-tareas`, `/stock`, `/stock/minimo`, `/stock/producto/{id}`, `/deposito/movimiento`, `/deposito/movimientos`, `/deposito/ingreso`, `/health`, `/productos/dropdown`, `/proveedores/dropdown`, `/reservas`, `/reservas/{id}/cancelar`, `/tareas`, `/tareas/{id}/completar`, `/tareas/{id}/cancelar` ...
- OpenAPI paths (api-proveedor spec): 11

## 2. ESTADO ACTUAL DEL CÓDIGO

### A. Análisis de Calidad (estático)

- TODO/FIXME/HACK (preview):

```text
docs/AUDIT_SKILLS_REPORT_2026-02-12.md:180:| Sistema como TODO es COHERENTE | ✅ |
docs/audit/EVIDENCIA_SP-A.md:92:Scan de `TODO|FIXME|HACK|XXX|PENDIENTE` en TypeScript: **ZERO markers encontrados**. Código limpio.
docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md:183:### 3.1 HALLAZGOS CRÍTICOS ORIGINALES — TODOS RESUELTOS ✅
docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md:631:## 11. NOTAS METODOLÓGICAS
docs/VERIFICACION_AUDITORIA_FORENSE_2026-02-15.md:725:## SECCIÓN G — NOTAS METODOLÓGICAS DE ESTA VERIFICACIÓN
docs/SECRET_ROTATION_PLAN.md:104:- `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: son JWTs firmados por Supabase. Para rotarlos, hay que usar Dashboard > Settings > API > Regenerate. **Esto invalida TODOS los clientes y TODAS las funciones.** Solo hacerlo en caso de compromiso confirmado.
```

- Archivos más grandes por líneas (aprox):

| Lines | File |
|---:|---|
| 2229 | `supabase/functions/api-minimarket/index.ts` |
| 1922 | `minimarket-system/src/database.types.ts` |
| 1440 | `supabase/functions/cron-notifications/index.ts` |
| 1428 | `supabase/functions/cron-testing-suite/index.ts` |
| 1294 | `supabase/functions/cron-dashboard/index.ts` |
| 970 | `supabase/functions/cron-health-monitor/index.ts` |
| 931 | `minimarket-system/src/lib/apiClient.ts` |
| 751 | `tests/performance/load-testing.vitest.test.ts` |
| 736 | `tests/contract/database.integration.test.ts` |
| 717 | `minimarket-system/src/pages/Pedidos.tsx` |
| 698 | `tests/unit/cron-jobs-handlers.test.ts` |
| 649 | `tests/contract/api-scraper.integration.test.ts` |
| 647 | `minimarket-system/src/components/GlobalSearch.tsx` |
| 622 | `minimarket-system/src/pages/Pos.tsx` |
| 603 | `minimarket-system/src/pages/Productos.tsx` |
| 597 | `minimarket-system/src/pages/Deposito.tsx` |
| 595 | `minimarket-system/src/components/AlertsDrawer.tsx` |
| 595 | `minimarket-system/src/pages/Pocket.tsx` |
| 572 | `tests/unit/scraper-storage-auth.test.ts` |
| 551 | `minimarket-system/src/mocks/data.ts` |

### B. Patrones prohibidos (seguridad/higiene)

- Posibles JWT hardcodeados (filenames only): ⚠️ FOUND (tests only)
  - Files:
    - `tests/unit/strategic-high-value.test.ts`
    - `tests/unit/gateway-auth.test.ts`
    - `tests/unit/security-gaps.test.ts`
- console.log en backend (filenames only): ✅ none

## 3. TESTING Y CALIDAD

### A. Cobertura / Inventario de tests (aprox)

- Unit test files: `47`
- Integration test files: `0`
- E2E test files: `2`
- Frontend component test files: `27`

### B. Ejecución de tests / gates

- Quality gates: ❌ FAIL (exit 1)
- Log: `test-reports/quality-gates_20260216-034554.log`

## 5. CONFIGURACIÓN Y ENTORNO

### A. Variables de entorno (names only)

```bash
.agent/scripts/env_audit.py --format markdown --with-supabase --supabase-scope backend-only
```

```text
# Env Audit (names only)

- Scan roots: supabase/functions, minimarket-system/src, scripts
- Env example: `.env.example`
- Supabase secrets: enabled (project_ref `dqaygmjpzoqjjrywdsxi`)
- Supabase compare scope: `backend-only`

## Used In Code But Missing In .env.example

- `API_PROVEEDOR_READ_MODE`
- `ENVIRONMENT`
- `INTERNAL_ORIGINS_ALLOWLIST`
- `LOG_LEVEL`
- `SCRAPER_READ_MODE`
- `SLACK_WEBHOOK_URL`
- `TEST_ENVIRONMENT`
- `TEST_PASSWORD`
- `TEST_USER_ADMIN`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `VITE_BUILD_ID`
- `WEBHOOK_URL`

## Present In .env.example But Not Used In Code

- `ACCESS_TOKEN`
- `DB_PASSWORD`
- `PROJECT_ID`

## Used In Code But Missing In Supabase Secrets (names)

- `API_PROVEEDOR_READ_MODE`
- `EMAIL_FROM`
- `ENVIRONMENT`
- `INTERNAL_ORIGINS_ALLOWLIST`
- `LOG_LEVEL`
- `REQUIRE_ORIGIN`
- `SCRAPER_READ_MODE`
- `SLACK_WEBHOOK_URL`
- `TEST_ENVIRONMENT`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `WEBHOOK_URL`

## Notes

- This report never prints values. Review each missing variable and decide whether it belongs in `.env.example` or Supabase secrets.
```

## 6. DOCUMENTACIÓN ACTUAL

- Fuente de verdad: `docs/ESTADO_ACTUAL.md`
- Plan vigente: `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`
- OpenAPI: `docs/api-openapi-3.1.yaml`, `docs/api-proveedor-openapi-3.1.yaml`

## 7. SEGURIDAD Y BUENAS PRÁCTICAS (resumen)

- RLS/Advisor: ver `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` + `docs/SECURITY_AUDIT_REPORT.md`
- Enforced guardrails: no secrets in logs, no destructive git, api-minimarket verify_jwt=false

## 8. BASE DE DATOS Y DATOS

- Migrations en repo: `40` (`supabase/migrations/`)
- Última migración: `supabase/migrations/20260215100000_p0_rls_internal_tables_and_search_path.sql`

## 🔥 Issues críticos que bloquean producción (autodetect)

- ❌ Quality gates fallan (ver `test-reports/quality-gates_20260216-034554.log`)
- ⚠️ JWT-like strings detectados solo en tests (probable fixture). Revisar para evitar leaks accidentales.
