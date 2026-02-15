> [DEPRECADO: 2026-02-13] Documento histórico de contexto/snapshot. Usar solo para trazabilidad. Fuente vigente: `docs/ESTADO_ACTUAL.md` + `docs/closure/README_CANONICO.md`.

# MISIÓN: ANÁLISIS TÉCNICO INTEGRAL DEL PROYECTO

- Fecha (UTC): `2026-02-09 11:40:13`
- Repo: `.`
- Branch: `main`
- Commit: `565df2d74f15d13a296736135acdd5e5e5efaf3c`
- Baseline log (safe): `docs/closure/BASELINE_LOG_2026-02-09_114001.md`

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
docs/SECRET_ROTATION_PLAN.md:83:- `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: son JWTs firmados por Supabase. Para rotarlos, hay que usar Dashboard > Settings > API > Regenerate. **Esto invalida TODOS los clientes y TODAS las funciones.** Solo hacerlo en caso de compromiso confirmado.
docs/INFORME_PREMORTEM_OPERATIVO.md:397:// TODO: Implementar lista blanca de orígenes internos
docs/INFORME_PREMORTEM_OPERATIVO.md:483:- Archivo(s): `minimarket-system/src/lib/observability.ts` — almacenamiento local, TODO Sentry.
docs/INFORME_PREMORTEM_OPERATIVO.md:486:// TODO: Integrar Sentry cuando haya credenciales
```

- Archivos más grandes por líneas (aprox):

| Lines | File |
|---:|---|
| 2184 | `supabase/functions/api-minimarket/index.ts` |
| 1922 | `minimarket-system/src/database.types.ts` |
| 1424 | `supabase/functions/cron-testing-suite/index.ts` |
| 1283 | `supabase/functions/cron-dashboard/index.ts` |
| 1282 | `supabase/functions/cron-notifications/index.ts` |
| 958 | `supabase/functions/cron-health-monitor/index.ts` |
| 899 | `minimarket-system/src/lib/apiClient.ts` |
| 736 | `tests/integration/database.integration.test.ts` |
| 708 | `minimarket-system/src/pages/Pedidos.tsx` |
| 698 | `tests/unit/cron-jobs-handlers.test.ts` |
| 649 | `tests/integration/api-scraper.integration.test.ts` |
| 637 | `minimarket-system/src/components/GlobalSearch.tsx` |
| 597 | `minimarket-system/src/pages/Pos.tsx` |
| 593 | `minimarket-system/src/components/AlertsDrawer.tsx` |
| 572 | `tests/unit/scraper-storage-auth.test.ts` |
| 567 | `minimarket-system/src/pages/Productos.tsx` |
| 566 | `minimarket-system/src/pages/Deposito.tsx` |
| 566 | `minimarket-system/src/pages/Pocket.tsx` |
| 551 | `minimarket-system/src/mocks/data.ts` |
| 494 | `minimarket-system/src/pages/Clientes.tsx` |

### B. Patrones prohibidos (seguridad/higiene)

- Posibles JWT hardcodeados (filenames only): ⚠️ FOUND (tests only)
  - Files:
    - `tests/security/security.vitest.test.ts`
    - `tests/unit/security-gaps.test.ts`
    - `tests/unit/strategic-high-value.test.ts`
    - `tests/unit/gateway-auth.test.ts`
- console.log en backend (filenames only): ✅ none

## 3. TESTING Y CALIDAD

### A. Cobertura / Inventario de tests (aprox)

- Unit test files: `46`
- Integration test files: `3`
- E2E test files: `2`
- Frontend component test files: `14`

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

## Present In .env.example But Not Used In Code

- `ACCESS_TOKEN`
- `DB_PASSWORD`
- `PROJECT_ID`
- `SENDGRID_API_KEY`

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

- Migrations en repo: `33` (`supabase/migrations/`)
- Última migración: `supabase/migrations/20260209000000_fix_sp_reservar_stock_on_conflict.sql`

## 🔥 Issues críticos que bloquean producción (autodetect)

- ⚠️ JWT-like strings detectados solo en tests (probable fixture). Revisar para evitar leaks accidentales.
