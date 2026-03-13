# MISIÓN: ANÁLISIS TÉCNICO INTEGRAL DEL PROYECTO

- Fecha (UTC): `2026-03-12 03:38:59`
- Repo: `.`
- Branch: `codex/parallel-operability-hardening-20260312`
- Commit: `d5713f863306e1f5f37cc0af6dc6975181332e4b`
- Baseline log (safe): `docs/closure/archive/historical/BASELINE_LOG_2026-03-12_033328.md`

## 1. ARQUITECTURA Y ESTRUCTURA DEL PROYECTO

### A. Información General

- Nombre (package.json): `minimarket-system-workspace`
- Tipo: fullstack (React/Vite frontend + Supabase Edge Functions backend + Postgres/Supabase)
- Stack (alto nivel):
  - Node: `v20.20.0` | npm: `11.8.0` | pnpm: `10.32.1`
  - Supabase CLI: `2.72.7
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.72.7)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli`
- Root package deps (high-signal): `vitest`, `@supabase/supabase-js`, `@tanstack/react-query`
- Frontend deps (high-signal): `minimarket-frontend` (ver `minimarket-system/package.json`)

### B. Componentes Principales

- Edge Functions en repo: 16
  - `alertas-stock`, `alertas-vencimientos`, `api-assistant`, `api-minimarket`, `api-proveedor`, `backfill-faltantes-recordatorios`, `cron-dashboard`, `cron-health-monitor`, `cron-jobs-maxiconsumo`, `cron-notifications`, `cron-testing-suite`, `facturas-ocr`, `notificaciones-tareas`, `reportes-automaticos`, `reposicion-sugerida`, `scraper-maxiconsumo`
- OpenAPI paths (api-minimarket spec): 49 (muestra hasta 49):
  - `/categorias`, `/categorias/{id}`, `/productos`, `/productos/{id}`, `/proveedores`, `/proveedores/{id}`, `/precios/aplicar`, `/precios/producto/{id}`, `/precios/redondear`, `/precios/margen-sugerido/{id}`, `/reportes/efectividad-tareas`, `/stock`, `/stock/minimo`, `/stock/producto/{id}`, `/deposito/movimiento`, `/deposito/movimientos`, `/deposito/ingreso`, `/compras/recepcion`, `/facturas/{id}/extraer`, `/facturas/items/{id}/validar`, `/facturas/{id}/aplicar`, `/health`, `/productos/dropdown`, `/proveedores/dropdown`, `/reservas` ...
- OpenAPI paths (api-proveedor spec): 9

## 2. ESTADO ACTUAL DEL CÓDIGO

### A. Análisis de Calidad (estático)

- TODO/FIXME/HACK (preview):

```text
docs/ESTADO_ACTUAL.md:25:- **Tier 1 (6 criticos) — TODOS RESUELTOS:** guard anti-mocks produccion, normalizacion errores de red, limites en queries, CSP+HSTS headers, idempotencia deposito (3 endpoints), FK CASCADE→RESTRICT (2 constraints).
docs/api-openapi-3.1.yaml:1512:        - Cuando TODOS los items están en estado final, factura transiciona a 'validada'
supabase/migrations/20260217100000_hardening_concurrency_fixes.sql:117:    RAISE EXCEPTION 'METODO_PAGO_INVALIDO';
supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:312:    RAISE EXCEPTION 'METODO_PAGO_INVALIDO';
supabase/migrations/20260207020000_create_ofertas_stock.sql:310:    RAISE EXCEPTION 'METODO_PAGO_INVALIDO';
```

- Archivos más grandes por líneas (aprox):

| Lines | File |
|---:|---|
| 2894 | `minimarket-system/src/types/database.types.ts` |
| 2843 | `supabase/functions/api-minimarket/index.ts` |
| 1922 | `minimarket-system/src/database.types.ts` |
| 1448 | `supabase/functions/cron-notifications/index.ts` |
| 1428 | `supabase/functions/cron-testing-suite/index.ts` |
| 1308 | `supabase/functions/cron-dashboard/index.ts` |
| 1242 | `supabase/functions/api-assistant/index.ts` |
| 1076 | `minimarket-system/src/lib/apiClient.ts` |
| 971 | `supabase/functions/cron-health-monitor/index.ts` |
| 921 | `supabase/functions/facturas-ocr/index.ts` |
| 821 | `tests/unit/apiClient-branches.test.ts` |
| 792 | `minimarket-system/src/pages/Dashboard.tsx` |
| 786 | `minimarket-system/src/pages/Pos.tsx` |
| 740 | `minimarket-system/src/pages/Pedidos.tsx` |
| 736 | `tests/contract/database.integration.test.ts` |
| 698 | `tests/unit/cron-jobs-handlers.test.ts` |
| 668 | `minimarket-system/src/pages/Deposito.tsx` |
| 664 | `minimarket-system/src/components/GlobalSearch.tsx` |
| 649 | `minimarket-system/src/pages/Productos.tsx` |
| 637 | `minimarket-system/src/components/AlertsDrawer.tsx` |

### B. Patrones prohibidos (seguridad/higiene)

- Posibles JWT hardcodeados (filenames only): ⚠️ FOUND (tests only)
  - Files:
    - `tests/unit/security-gaps.test.ts`
    - `tests/unit/gateway-auth.test.ts`
    - `tests/unit/shared-internal-auth.test.ts`
- console.log en backend (filenames only): ✅ none

## 3. TESTING Y CALIDAD

### A. Cobertura / Inventario de tests (aprox)

- Unit test files: `88`
- Integration test files: `0`
- E2E test files: `1`
- Frontend component test files: `42`

### B. Ejecución de tests / gates

- Quality gates: (skipped) re-run with `--with-gates`.

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

(none)

## Present In .env.example But Not Used In Code

- `ACCESS_TOKEN`
- `DB_PASSWORD`
- `OPS_SMOKE_RETRIES`
- `OPS_SMOKE_RETRY_DELAY_MS`
- `OPS_SMOKE_TIMEOUT_MS`
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

- Migrations en repo: `57` (`supabase/migrations/`)
- Última migración: `supabase/migrations/20260304010000_create_asistente_audit_log.sql`

## 🔥 Issues críticos que bloquean producción (autodetect)

- ⚠️ JWT-like strings detectados solo en tests (probable fixture). Revisar para evitar leaks accidentales.
