# MISIÓN: ANÁLISIS TÉCNICO INTEGRAL DEL PROYECTO

- Fecha (UTC): `2026-02-28 12:07:03`
- Repo: `.`
- Branch: `main`
- Commit: `f0a9c7350d36092632cc13e4fbbf43a6cae9b450`
- Baseline log (safe): `docs/closure/BASELINE_LOG_2026-02-28_120548.md`

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

- Edge Functions en repo: 15
  - `alertas-stock`, `alertas-vencimientos`, `api-minimarket`, `api-proveedor`, `backfill-faltantes-recordatorios`, `cron-dashboard`, `cron-health-monitor`, `cron-jobs-maxiconsumo`, `cron-notifications`, `cron-testing-suite`, `facturas-ocr`, `notificaciones-tareas`, `reportes-automaticos`, `reposicion-sugerida`, `scraper-maxiconsumo`
- OpenAPI paths (api-minimarket spec): 49 (muestra hasta 49):
  - `/categorias`, `/categorias/{id}`, `/productos`, `/productos/{id}`, `/proveedores`, `/proveedores/{id}`, `/precios/aplicar`, `/precios/producto/{id}`, `/precios/redondear`, `/precios/margen-sugerido/{id}`, `/reportes/efectividad-tareas`, `/stock`, `/stock/minimo`, `/stock/producto/{id}`, `/deposito/movimiento`, `/deposito/movimientos`, `/deposito/ingreso`, `/compras/recepcion`, `/facturas/{id}/extraer`, `/facturas/items/{id}/validar`, `/facturas/{id}/aplicar`, `/health`, `/productos/dropdown`, `/proveedores/dropdown`, `/reservas` ...
- OpenAPI paths (api-proveedor spec): 9

## 2. ESTADO ACTUAL DEL CÓDIGO

### A. Análisis de Calidad (estático)

- TODO/FIXME/HACK (preview):

```text
docs/api-openapi-3.1.yaml:1507:        - Cuando TODOS los items están en estado final, factura transiciona a 'validada'
docs/PRODUCTION_GATE_REPORT.md:67:| TODO/FIXME en codigo | 0 |
```

- Archivos más grandes por líneas (aprox):

| Lines | File |
|---:|---|
| 2894 | `minimarket-system/src/types/database.types.ts` |
| 2593 | `supabase/functions/api-minimarket/index.ts` |
| 1922 | `minimarket-system/src/database.types.ts` |
| 1448 | `supabase/functions/cron-notifications/index.ts` |
| 1428 | `supabase/functions/cron-testing-suite/index.ts` |
| 1307 | `supabase/functions/cron-dashboard/index.ts` |
| 1045 | `minimarket-system/src/lib/apiClient.ts` |
| 970 | `supabase/functions/cron-health-monitor/index.ts` |
| 812 | `tests/unit/apiClient-branches.test.ts` |
| 804 | `supabase/functions/facturas-ocr/index.ts` |
| 777 | `minimarket-system/src/pages/Deposito.tsx` |
| 736 | `tests/contract/database.integration.test.ts` |
| 729 | `minimarket-system/src/pages/Pedidos.tsx` |
| 698 | `tests/unit/cron-jobs-handlers.test.ts` |
| 663 | `minimarket-system/src/components/GlobalSearch.tsx` |
| 657 | `minimarket-system/src/pages/Pos.tsx` |
| 637 | `minimarket-system/src/components/AlertsDrawer.tsx` |
| 635 | `minimarket-system/src/pages/Dashboard.tsx` |
| 602 | `minimarket-system/src/pages/Productos.tsx` |
| 602 | `tests/unit/strategic-high-value.test.ts` |

### B. Patrones prohibidos (seguridad/higiene)

- Posibles JWT hardcodeados (filenames only): ⚠️ FOUND (tests only)
  - Files:
    - `tests/unit/security-gaps.test.ts`
    - `tests/unit/gateway-auth.test.ts`
    - `tests/unit/shared-internal-auth.test.ts`
- console.log en backend (filenames only): ✅ none

## 3. TESTING Y CALIDAD

### A. Cobertura / Inventario de tests (aprox)

- Unit test files: `81`
- Integration test files: `0`
- E2E test files: `1`
- Frontend component test files: `40`

### B. Ejecución de tests / gates

- Quality gates: ❌ FAIL (exit 2)
- Log: `test-reports/quality-gates_20260228-120558.log`

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

- `OCR_MIN_SCORE_APPLY`

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
- `OCR_MIN_SCORE_APPLY`
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

- Migrations en repo: `52` (`supabase/migrations/`)
- Última migración: `supabase/migrations/20260224010000_harden_security_definer_search_path_global.sql`

## 🔥 Issues críticos que bloquean producción (autodetect)

- ❌ Quality gates fallan (ver `test-reports/quality-gates_20260228-120558.log`)
- ⚠️ JWT-like strings detectados solo en tests (probable fixture). Revisar para evitar leaks accidentales.
