# MISIÓN: ANÁLISIS TÉCNICO INTEGRAL DEL PROYECTO

- Fecha (UTC): `2026-02-09 11:23:25`
- Repo: `.`
- Branch: `main`
- Commit: `565df2d74f15d13a296736135acdd5e5e5efaf3c`
- Baseline log (safe): `docs/closure/BASELINE_LOG_2026-02-09_112318.md`

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

- Edge Functions en repo: 16
  - `alertas-stock`, `alertas-vencimientos`, `api-minimarket`, `api-proveedor`, `cron-dashboard`, `cron-health-monitor`, `cron-jobs-maxiconsumo`, `cron-notifications`, `cron-testing-suite`, `CRON_AUXILIARES.md`, `deno.json`, `import_map.json`, `notificaciones-tareas`, `reportes-automaticos`, `reposicion-sugerida`, `scraper-maxiconsumo`
- OpenAPI paths (api-minimarket spec): 45 (muestra hasta 45):
  - `/categorias`, `/categorias/{id}`, `/productos`, `/productos/{id}`, `/proveedores`, `/proveedores/{id}`, `/precios/aplicar`, `/precios/producto/{id}`, `/precios/redondear`, `/precios/margen-sugerido/{id}`, `/reportes/efectividad-tareas`, `/stock`, `/stock/minimo`, `/stock/producto/{id}`, `/deposito/movimiento`, `/deposito/movimientos`, `/deposito/ingreso`, `/health`, `/productos/dropdown`, `/proveedores/dropdown`, `/reservas`, `/reservas/{id}/cancelar`, `/tareas`, `/tareas/{id}/completar`, `/tareas/{id}/cancelar` ...
- OpenAPI paths (api-proveedor spec): 11

## 2. ESTADO ACTUAL DEL CÓDIGO

### A. Análisis de Calidad (estático)

- TODO/FIXME/HACK (preview):

```text
./supabase/migrations/20260207020000_create_ofertas_stock.sql:310:    RAISE EXCEPTION 'METODO_PAGO_INVALIDO';
./supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:312:    RAISE EXCEPTION 'METODO_PAGO_INVALIDO';
./docs/closure/EXECUTION_LOG_2026-02-08_ROADMAP.md:167:- Implementada allowlist real de origenes internos (reemplaza TODO)
./docs/closure/CLAUDE_CODE_CONTEXT_PROMPTS_NEXT_STEPS_2026-02-09.md:34:4) Evidencia auditable: TODO comando relevante + resultado debe quedar en docs/closure/.
./docs/closure/CLAUDE_CODE_CONTEXT_PROMPT_EXECUTOR_2026-02-08.md:131:- Archivo: `supabase/functions/api-proveedor/utils/auth.ts` (hay TODO).
./docs/SECRET_ROTATION_PLAN.md:82:- `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: son JWTs firmados por Supabase. Para rotarlos, hay que usar Dashboard > Settings > API > Regenerate. **Esto invalida TODOS los clientes y TODAS las funciones.** Solo hacerlo en caso de compromiso confirmado.
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:35:- TODO/FIXME/HACK (preview):
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:38:./docs/closure/EXECUTION_LOG_2026-02-08_ROADMAP.md:167:- Implementada allowlist real de origenes internos (reemplaza TODO)
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:39:./docs/closure/CLAUDE_CODE_CONTEXT_PROMPTS_NEXT_STEPS_2026-02-09.md:34:4) Evidencia auditable: TODO comando relevante + resultado debe quedar en docs/closure/.
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:40:./docs/closure/CLAUDE_CODE_CONTEXT_PROMPT_EXECUTOR_2026-02-08.md:131:- Archivo: `supabase/functions/api-proveedor/utils/auth.ts` (hay TODO).
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:41:./docs/SECRET_ROTATION_PLAN.md:82:- `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: son JWTs firmados por Supabase. Para rotarlos, hay que usar Dashboard > Settings > API > Regenerate. **Esto invalida TODOS los clientes y TODAS las funciones.** Solo hacerlo en caso de compromiso confirmado.
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:42:./docs/INFORME_PREMORTEM_OPERATIVO.md:397:// TODO: Implementar lista blanca de orígenes internos
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:43:./docs/INFORME_PREMORTEM_OPERATIVO.md:483:- Archivo(s): `minimarket-system/src/lib/observability.ts` — almacenamiento local, TODO Sentry.
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:44:./docs/INFORME_PREMORTEM_OPERATIVO.md:486:// TODO: Integrar Sentry cuando haya credenciales
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:45:./supabase/migrations/20260207020000_create_ofertas_stock.sql:310:    RAISE EXCEPTION 'METODO_PAGO_INVALIDO';
./docs/closure/TECHNICAL_ANALYSIS_2026-02-09_112142.md:46:./supabase/migrations/20260207010000_create_pos_ventas_fiados_cc.sql:312:    RAISE EXCEPTION 'METODO_PAGO_INVALIDO';
./docs/INFORME_PREMORTEM_OPERATIVO.md:397:// TODO: Implementar lista blanca de orígenes internos
./docs/INFORME_PREMORTEM_OPERATIVO.md:483:- Archivo(s): `minimarket-system/src/lib/observability.ts` — almacenamiento local, TODO Sentry.
./docs/INFORME_PREMORTEM_OPERATIVO.md:486:// TODO: Integrar Sentry cuando haya credenciales
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

- Posibles JWT hardcodeados (filenames only): 🔥 FOUND
  - Files:
    - `./docs/closure/SECURITY_RECOMMENDATIONS.md`
    - `./docs/API_README.md`
    - `./package-lock.json`
    - `./tests/security/security.vitest.test.ts`
    - `./minimarket-system/package-lock.json`
    - `./tests/unit/security-gaps.test.ts`
    - `./tests/unit/strategic-high-value.test.ts`
    - `./tests/unit/gateway-auth.test.ts`
    - `./minimarket-system/pnpm-lock.yaml`
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
.agent/scripts/env_audit.py --format markdown
```

```text
# Env Audit (names only)

- Scan roots: supabase/functions, minimarket-system/src, scripts
- Env example: `.env.example`
- Supabase secrets: disabled

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

- Migrations en repo: `32` (`supabase/migrations/`)
- Última migración: `supabase/migrations/20260208030000_add_circuit_breaker_state.sql`

## 🔥 Issues críticos que bloquean producción (autodetect)

- 🔥 Posibles JWTs hardcodeados detectados (filenames list arriba) (CRÍTICO)
