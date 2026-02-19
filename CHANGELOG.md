# Changelog

Todos los cambios notables de este proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-02-19

### Changed
- **`docs/ESQUEMA_BASE_DATOS_ACTUAL.md` reescrito completo** (D-142): documentadas 38 tablas con columnas exactas, tipos, constraints, FKs, índices, RLS policies, 11 vistas, 3 vistas materializadas, 30+ funciones/SPs, 3 triggers.
- Versiones corregidas en ARCHITECTURE_DOCUMENTATION.md: Vite 4.x→6.x, Cypress→Playwright, Deno 1.x→2.x, PostgreSQL 15+→17.
- `.github/copilot-instructions.md` reescrito para alinear con estado actual (13 Edge Functions, 44 migraciones, 1561 tests, 38 tablas, Cloudflare Pages).
- `README.md` actualizado con métricas D-142 (1561 tests, 76 archivos, 11/11 gates, Cloudflare Pages).

### Removed
- **Dead code eliminado** (D-142): directorio `supabase/functions/api-minimarket/routers/` (6 archivos: deposito.ts, index.ts, productos.ts, stock.ts, tareas.ts, types.ts). Zero imports, lógica duplicada con gateway principal.

### Fixed
- 3 drift defects documentados en schema: `precios_historicos.fecha` residual, `cache_proveedor` sin RLS explícito, roles legacy inconsistentes en policies.
- Conteo de archivos de test corregido en ESTADO_ACTUAL (113→117, sumando 4 Playwright e2e).
- Referencias a `routers/` eliminadas de CHECKLIST_CIERRE, OBJETIVO_FINAL_PRODUCCION.

## [2.0.0] - 2026-02-19

### Added
- **Deploy frontend a Cloudflare Pages** (D-141): workflow `.github/workflows/deploy-cloudflare-pages.yml` creado.
- 313 tests unitarios nuevos (17 archivos), total 1561/1561 PASS (76 archivos).
- Documentación de deploy: `docs/closure/GUIA_DEPLOY_CLOUDFLARE_PAGES_2026-02-19.md`.

### Changed
- Frontend en producción en Cloudflare Pages: https://aidrive-genspark.pages.dev
- CORS fix: `ALLOWED_ORIGINS` actualizado en Supabase + `api-minimarket` redesplegado (v29).
- Context prompt next session actualizado para Cloudflare Pages.

### Fixed
- `api-proveedor/utils/params.ts`: fix de sanitización de parámetros.
- `vitest.integration.config.ts`: fix de include pattern.
- `tests/contract/api-scraper.integration.test.ts`: fix de método GET.

## [1.9.0] - 2026-02-16

### Added
- **11 test files nuevos para coverage real de módulos críticos** (D-116):
  - `tests/unit/auth-fetchuser.test.ts` — `fetchUserInfo` cache, breaker, role normalization
  - `tests/unit/helpers-supabase.test.ts` — PostgREST helpers (`queryTable`, `insertTable`, `callFunction`, etc.)
  - `tests/unit/cb-rpc-coverage.test.ts` — `CircuitBreaker` class + RPC functions
  - `tests/unit/errors-coverage.test.ts` — `AppError`, PGRST/SQLSTATE mapping, `getErrorStatus`
  - `tests/unit/rate-limit-coverage.test.ts` — `FixedWindowRateLimiter`, `AdaptiveRateLimiter`, RPC
  - `tests/unit/scraper-anti-detection-coverage.test.ts` — headers, delays, retry, captcha detection
  - `tests/unit/scraper-storage-coverage.test.ts` — bulk DB operations
  - `tests/unit/scraper-types-coverage.test.ts` — URL validation, slug sanitization
  - `tests/unit/handlers-ventas-coverage.test.ts` — POS sales handler branches
  - `tests/unit/handlers-ofertas-coverage.test.ts` — anti-waste offers handler
  - `tests/unit/api-proveedor-auth-coverage.test.ts` — shared secret validation, origin allowlist
- 274 tests nuevos (891→1165 unit tests, 58 archivos).

### Changed
- Coverage global subida de 64.37% stmts / 56.87% branch a **89.20% stmts / 80.91% branch / 93.29% funcs / 90.66% lines** (threshold 80% cumplido en las 4 métricas).
- `vitest.config.ts`: excluido `minimarket-system/src/mocks/**` de coverage (infraestructura de test, no código de producción).

## [1.8.0] - 2026-02-16

### Changed
- **Tests: 7 archivos reescritos de FAKE/SHALLOW a REAL** (D-114). Tests que verificaban mocks contra mocks reemplazados por imports y ejecución de código real del proyecto:
  - `tests/unit/strategic-high-value.test.ts` — auth, pagination, validation, scraper parsing, response builders, error classification.
  - `tests/unit/resilience-gaps.test.ts` — CircuitBreaker state machine, error wrapping, auth breaker, exponential backoff, CORS validation.
  - `tests/unit/integration-contracts.test.ts` — cross-module contracts (scraper→storage, gateway→supabase, pagination→response, error pipeline, UUID).
  - `tests/contract/api-scraper.integration.test.ts` — api-proveedor validators, schemas, router, alertas pipeline, constants.
  - `tests/performance/load-testing.vitest.test.ts` — benchmarks reales a escala 40k productos.
  - `tests/api-contracts/openapi-compliance.vitest.test.ts` — OpenAPI spec ↔ código.
  - `tests/contract/msw-integration.test.ts` — MSW infrastructure + mock data shapes.

### Fixed
- 8 bugs de aserción descubiertos durante rewrite: `fail()` default status (400 no 500), `extraerMarcaDelNombre` first-match ordering, CircuitBreaker half_open→open threshold reset, `getStats()` property names, `calculateExponentialBackoff` positional args, `validateOrigin` Request object, OpenAPI health endpoint exclusion, performance `fail()` valid statuses.
- `getRandomDelay` lower bound corregido: `Math.max(min, ...)` garantiza mínimo `min`, no `min - jitter` (D-115).

### Added
- 62 tests nuevos (829→891 unit tests) con cobertura real de módulos críticos.
- Tests de case-insensitive role matching (`hasRole`, `hasAnyRole`).
- Tests de `getErrorStatus` message-based inference (keywords → HTTP status).
- Tests de `getStats()` shape completa (timing properties `openedAt`, `lastFailure`).
- Test de `createRequestHeaders` null token fallback a anon key.

## [1.7.0] - 2026-02-09

### Added
- Migraciones de febrero: reservas idempotentes (`20260204100000_add_idempotency_stock_reservado.sql`), locks para cron jobs (`20260204110000_add_cron_job_locks.sql`), SP `sp_reservar_stock` (`20260204120000_add_sp_reservar_stock.sql`), sistema de pedidos (`20260206000000_create_clientes.sql`, `20260206010000_create_pedidos.sql`, `20260206020000_create_detalle_pedidos.sql`), materialized views de alertas (`20260206235900_create_stock_materialized_views_for_alertas.sql`), vistas/flows de arbitraje, POS/CC, ofertas anti-mermas y bitácora (`20260207000000`–`20260207030000`), extensiones CC y refresh RPC/cron de MVs (`20260208000000`, `20260208010000`), rate limit + circuit breaker compartidos (`20260208020000`, `20260208030000`) y fix de idempotencia en SP (`20260209000000_fix_sp_reservar_stock_on_conflict.sql`).
- Endpoints en `api-minimarket`: `/reservas`, `/pedidos/*`, `/clientes/*` y `/ofertas/*` ya enrutados en `supabase/functions/api-minimarket/index.ts`.
- Tests nuevos para `/reservas` (integración + concurrencia) y `/health` de `api-proveedor` en `tests/unit/`.
- Scripts operativos: baseline de performance (`scripts/perf-baseline.mjs`), smoke test de reservas (`scripts/smoke-reservas.mjs`) y runner de integración (`scripts/run-integration-tests.sh`).

### Fixed
- Hardening en `sp_reservar_stock` para `ON CONFLICT` con índice parcial (`20260209000000_fix_sp_reservar_stock_on_conflict.sql`).

## [1.6.0] - 2026-01-31

### Added
- Migraciones de enero: reconciliación de objetos faltantes (`20260104020000_create_missing_objects.sql`), RLS base (`20260104083000_add_rls_policies.sql`), tablas core y precios proveedor (`20260109060000_create_precios_proveedor.sql`, `20260109070000_create_core_tables.sql`), ajustes de constraints/RLS (`20260110000000_fix_constraints_and_indexes.sql`, `20260110100000_fix_rls_security_definer.sql`), agregaciones de stock (`20260116000000_create_stock_aggregations.sql`), políticas RLS role-based v2 (`20260131000000_rls_role_based_policies_v2.sql`) y mitigaciones Security Advisor (`20260131020000_security_advisor_mitigations.sql`).
- Scripts de seguridad y operaciones (E2E + advisor) incorporados en `scripts/` y flujos de despliegue/validación en `deploy.sh`/`migrate.sh`.

### Changed
- Consolidación de RLS y hardening de search_path en funciones con `SECURITY DEFINER` (ver migraciones 20260110xx y 20260131xx).

## [1.5.0] - 2025-11-03

### Added - PRs Mergeados desde Codex

#### PR #14: Métricas de Tareas (SHA: 75f5cdd)
- Vista materializada `tareas_metricas` versionada en `supabase/migrations/20260104020000_create_missing_objects.sql` (antes en `supabase/sql/`)
- Endpoint `/reportes/efectividad-tareas` para reportes de eficiencia
- Calcula métricas como tiempo promedio de resolución y tasa de éxito

#### PR #15: Cache de Proveedor con Fallback (SHA: 426fb2c)
- Nueva tabla `cache_proveedor` con migración `20251103_create_cache_proveedor.sql`
- Fallback persistente cuando circuit breaker está en estado OPEN
- Mejora resiliencia del sistema ante fallas de proveedores externos

#### PR #17: Validación de Precio Mínimo (SHA: 28d3688)
- Validación `precio_compra > 0` obligatoria en stored procedure
- Verificación de margen mínimo configurable (default: 5%)
- Migración `20260202000000_version_sp_aplicar_precio.sql`

#### PR #18: Stock en Tránsito (SHA: b069148)
- Nuevas tablas `stock_reservado` y `ordenes_compra`
- Función `calcular_stock_disponible()` que considera reservas
- RPC endpoint para tracking de stock en tránsito

### Removed

#### PR #16: Módulo External API (SHA: db3d1ec)
- Eliminado directorio completo `supabase/functions/external_api/`
- 17 archivos removidos (pertencían a proyecto Matrix Agent, no a Mini Market)
- Limpieza de código no relacionado con el dominio

### Changed - Limpieza de Repositorio
- Eliminada carpeta `archive/` completa (contenido obsoleto)
- Eliminados reportes de sesión temporales de raíz
- Eliminados archivos de test temporales y capturas de browser
- Actualizado `.gitignore` con reglas específicas del proyecto
- Eliminado JWT token expuesto en `shell_output_save/` (issue de seguridad)

## [1.4.0] - 2025-10-24

### Added
- Dashboard web con KPIs en tiempo real
- Sistema de notificaciones integrado
- OCR preview para facturas de proveedores
- Tests de seguridad de headers HTTP

### Changed
- Migración completa a Supabase Edge Functions
- Consolidación de documentación en estructura limpia

## [1.3.0] - 2025-10-20

### Added
- Sistema de agentes (negocio + depósito)
- Integración con base de datos PostgreSQL
- Scripts de deployment para staging/production

### Security
- Implementación de headers CSP
- Rotación de API keys automatizada
- Validación de inputs en todos los endpoints

---

## Estructura del Proyecto

```
minimarket-system/          # Frontend React + Vite + TypeScript
├── src/                    # Código fuente React

supabase/                   # Edge Functions + migraciones + cron jobs
├── functions/              # Edge Functions (Deno)
├── migrations/             # Migraciones SQL versionadas
├── cron_jobs/              # Configuración de jobs

docs/                       # Documentación técnica
tests/                      # Tests (unit/integration/e2e/performance)
.github/workflows/          # CI/CD
deploy.sh                   # Script de deployment
setup.sh                    # Script de configuración
migrate.sh                  # Script de migraciones
test.sh                     # Runner legacy de tests
```

## Convenciones

- Todas las migraciones SQL en `supabase/migrations/`
- Edge Functions en TypeScript bajo `supabase/functions/`
- Tests deben pasar antes de merge a main
- Documentación actualizada en cada PR

## Flujo de actualización para evitar gaps

1) **Commits convencionales** (mínimo): `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `perf:`, `refactor:`.
2) **Changelog por release mensual**: cerrar el mes con sección nueva (YYYY-MM) y listar cambios reales por categoría (migraciones, endpoints, tests, scripts).
3) **Release tooling**: usar `standard-version` o `release-please` para tag + bump automático, y exigir changelog actualizado en PR antes de merge.
