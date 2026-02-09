# Prompt de Contexto para Proxima Sesion

**Generado:** 2026-02-09 (sesion 2)
**HEAD:** pendiente commit final (post-session2)
**Branch:** `main`

---

## Contexto Rapido

Este es el repo `aidrive_genspark` — sistema Mini Market con React/Vite/TS (frontend) + Supabase Edge Functions/Deno (backend) + PostgreSQL.

**Ref Supabase:** `dqaygmjpzoqjjrywdsxi`

## Documentos de Referencia (leer primero)

| Que | Donde |
|-----|-------|
| Estado actual completo | `docs/ESTADO_ACTUAL.md` |
| Open issues (pendientes/resueltos) | `docs/closure/OPEN_ISSUES.md` |
| Baseline de sesion 2 | `docs/closure/BASELINE_LOG_2026-02-09_SESSION2.md` |
| Perf baseline | `docs/closure/PERF_BASELINE_2026-02-09_SESSION2.md` |
| SendGrid verificacion | `docs/SENDGRID_VERIFICATION.md` |
| Plan rotacion secretos | `docs/SECRET_ROTATION_PLAN.md` |
| Plan Sentry | `docs/SENTRY_INTEGRATION_PLAN.md` |
| Hoja de ruta | `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md` |
| Schema BD | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| API endpoints | `docs/API_README.md` |

## Estado del Proyecto

- **Operativo:** CI verde, 6/6 quality gates PASS
- **Tests:** 922 total (812 unit + 110 component) + 38 integration + 5 e2e
- **Migraciones:** 33, todas sincronizadas local=remoto
- **Edge Functions:** 13 activas, `api-minimarket` v20 (`verify_jwt=false`), `cron-notifications` v12
- **Secrets:** 13 confirmados en remoto
- **DB staging:** tiene 1 producto de prueba (SEED-CC-225 Coca Cola 2.25L, stock 50)

## Dependencias Actuales (post bumps sesion 2)

| Paquete | Version |
|---------|---------|
| vitest | 4.0.18 |
| @vitest/coverage-v8 | 4.0.18 |
| msw | 2.12.9 |
| @supabase/supabase-js | 2.95.3 |
| typescript (frontend) | 5.9.3 |
| autoprefixer | 10.4.23 |
| cmdk | 1.1.1 |
| react | 18.3.1 (NO actualizar sin migracion dedicada) |
| react-router-dom | 6.30.3 (NO actualizar sin migracion dedicada) |

## Pendientes Activos (por prioridad)

### P0 — Bloqueantes para produccion
- **Leaked Password Protection:** requiere plan Pro de Supabase. Decisión: diferir.

### P1 — Importantes
- **Verificar sender en SendGrid Dashboard:** Fix de codigo + redeploy HECHO. Falta verificar que `noreply@minimarket-system.com` es sender verificado en SendGrid.
- **Rotacion de secretos:** Plan documentado en `docs/SECRET_ROTATION_PLAN.md`. Requiere ejecucion manual: generar nuevos `API_PROVEEDOR_SECRET` y `SENDGRID_API_KEY`, actualizar secrets, redeployar funciones.

### P2 — Mejoras
- **Sentry:** BLOQUEADO sin DSN real. Plan en `docs/SENTRY_INTEGRATION_PLAN.md`.
- **Major version bumps:** React 18→19, react-router-dom 6→7, recharts 2→3, react-resizable-panels 2→4. Requiere sesion de migracion dedicada.
- **Coverage:** 69.39% (meta 80%). Subir coverage de unit tests.
- **Tests integracion reales para `/reservas`:** con credenciales/seed en `tests/integration/`.

### P3 — Nice to have
- Propagacion de `x-request-id` entre Edge Functions (cron/scraper)
- Cache coherente multi-instancia para scraper y api-proveedor
- Prueba de carga real y baseline de pooling/performance DB en PROD

## Reglas

- NO imprimir secretos/JWTs (solo nombres)
- NO usar comandos destructivos
- `api-minimarket` debe permanecer con `verify_jwt=false`
- Si se redeploya usar `--no-verify-jwt`

## Quality Gates (antes de mergear)

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```
