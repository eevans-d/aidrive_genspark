# Checklist de Cierre - Plan de Ejecución

**Fecha:** 2026-01-12  
**Estado:** ⚠️ Plan NO completado (verificado)
**Plan vigente:** ver `docs/ROADMAP.md` y `docs/DECISION_LOG.md`

---

## Resumen Ejecutivo

El plan de ejecución de 6 semanas está avanzado, pero NO está cerrado. Se logró:
- Modularización base de las 3 funciones críticas (con pendientes técnicos)
- **Gateway api-minimarket hardened** (auth JWT, CORS restrictivo, rate limit 60/min, circuit breaker) ✅
- **193 tests unitarios pasando** (subió de 147) ✅
- Migraciones versionadas en local
- Tests reales con Vitest y runner alineado (unit + integration + e2e)
- **CI con jobs gated** para integration/E2E ✅

Pendientes críticos detectados:
- Validación runtime de alertas/comparaciones pendiente (WS4.1)
- Observabilidad incompleta (métricas y trazabilidad parcial)
- Suites performance/seguridad pendientes (runner y fixtures)
- Verificación de migraciones en staging/prod sin evidencia (WS3.1)

---

## Estado por fase (verificado)

### F0: Gobierno y Baseline
- [x] Objetivos y KPIs definidos (`docs/OBJETIVOS_Y_KPIS.md`)
- [x] Inventario actualizado (`docs/INVENTARIO_ACTUAL.md`)
- [x] Baseline técnico documentado (`docs/BASELINE_TECNICO.md`)

### F1: Data/DB Alignment
- [x] Migraciones versionadas aplicadas
- [x] SQL suelto consolidado en migraciones
- [x] RLS mínima configurada
- [ ] **Auditoría RLS completa** → ⚠️ PENDIENTE POR CREDENCIALES
  - Checklist preparado: [`docs/AUDITORIA_RLS_CHECKLIST.md`](AUDITORIA_RLS_CHECKLIST.md)
  - Script de validación: [`scripts/rls_audit.sql`](../scripts/rls_audit.sql)
  - Tablas P0 sin verificar: `productos`, `stock_deposito`, `movimientos_deposito`, `precios_historicos`, `proveedores`, `personal`

#### Checklist RLS (pendiente por credenciales)
> No ejecutar hasta contar con `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y acceso a la instancia.

- **Alcance**: tablas P0 (`productos`, `stock_deposito`, `movimientos_deposito`, `precios_historicos`, `proveedores`, `personal`).
- **Prepaso**: conectar con `psql` o `supabase` CLI apuntando a la DB remota (solo lectura de políticas).
- **SQL de inspección** (ver `scripts/rls_audit.sql`):
  - Listar políticas: `SELECT table_name, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND table_name IN (...);`
  - Validar RLS activo: `SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname IN (...);`
  - Revisar grants: `SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name IN (...);`
- **Comandos sugeridos (no ejecutar aún)**:
  - `supabase db remote commit` / `supabase db diff` solo para leer estado, nunca para aplicar.
  - `psql "$SUPABASE_DB_URL" -f scripts/rls_audit.sql` (capturar salida en txt).
- **Evidencia a capturar**:
  - Dump de `pg_policies` para tablas P0.
  - Captura de `relrowsecurity=true` y `relforcerowsecurity=true` en tablas sensibles.
  - Grants efectivos por rol (`anon`, `authenticated`, roles app).
  - Resultado de consultas de ejemplo: SELECT sobre tabla P0 con/ sin RLS (esperar 0 filas para `anon`).

### F2: Shared Libs
- [x] `_shared/cors.ts` - Headers CORS unificados
- [x] `_shared/response.ts` - Respuestas ok/fail estándar
- [x] `_shared/errors.ts` - Tipos AppError/HttpError
- [x] `_shared/logger.ts` - Logging estructurado
- [x] `_shared/rate-limit.ts` - Rate limiting consolidado  
  Obs: API unificada y compatible con `scraper-maxiconsumo`.

### F3: Refactor Funciones Críticas
- [ ] **api-proveedor** (3744 → modular)
  - Router tipado + handlers separados
  - Schemas y validators centralizados
  - Utils consolidados (cache, http, metrics, etc.)
  - Tests: reales (imports de módulos)
  - Logging: handlers migrados a `_shared/logger`

- [ ] **scraper-maxiconsumo** (3212 → 9 módulos)
  - types.ts, config.ts, cache.ts, anti-detection.ts
  - parsing.ts, matching.ts, storage.ts, scraping.ts
  - Tests: reales (imports de módulos)
  - Pendiente: validación runtime de alertas y comparaciones

- [ ] **cron-jobs-maxiconsumo** (2900 → 4 jobs + orchestrator)
  - jobs/daily-price-update.ts
  - jobs/realtime-alerts.ts
  - jobs/weekly-analysis.ts
  - jobs/maintenance.ts
  - orchestrator.ts
  - Tests: reales (imports de módulos)
  - Persistencia: validación runtime OK

### F4: Testing
- [x] Framework: Vitest 4.0.16
- [x] Coverage: @vitest/coverage-v8
- [x] Runner/scripts: `package.json` y `test.sh` alineados con Vitest
- [x] Tests reales: imports de módulos reales (parsing/matching/alertas/router/cron)
- [x] Integration: `tests/integration` en Vitest; comando `npm run test:integration`
- [x] E2E smoke: `tests/e2e/*.smoke.test.ts`; comando `npm run test:e2e`
- [ ] Performance/seguridad: pendientes (migrar a Vitest y definir fixtures)
  - Obs: unit tests siguen con `npx vitest run`; suites avanzadas usan configs separadas.

### F5: Observabilidad
- [ ] Logging estructurado con requestId/jobId/runId (parcial; cron auxiliares pendientes)
- [ ] Métricas básicas: duración, errores, items procesados (cron jobs listos; falta cobertura total)
- [x] Logs guardan en `cron_jobs_execution_log` (payload validado runtime)

### WS1: Inventario y migración de logs
- [x] WS1.0.1 Inventario `console.log|console.error` en `supabase/functions` (2026-01-09).
- [x] WS1.0.1 Resultado: `supabase/functions/api-minimarket/index.ts`, `supabase/functions/notificaciones-tareas/index.ts`, `supabase/functions/cron-testing-suite/index.ts` (testing), `supabase/functions/_shared/logger.ts` (interno).
- [x] WS1.6 Migración console.* en `supabase/functions/api-minimarket/index.ts`, `supabase/functions/notificaciones-tareas/index.ts`, `supabase/functions/api-proveedor/utils/cache.ts`.
- [x] WS1.6 Verificación: `rg -n "console\\." supabase/functions` solo muestra `_shared/logger.ts` y `cron-testing-suite`.
- [x] WS1.4.1 Payload alineado con schema y estados `exitoso|fallido|parcial` en `supabase/functions/cron-jobs-maxiconsumo/execution-log.ts`.
- [x] WS1.4.2 Validación runtime de payload (estado/tipos) antes de insertar en `cron_jobs_execution_log`.
- [x] WS1.5.1 Métricas por job (`productos_*`, `alertas_*`, `emails_*`, `sms_*`) persistidas en `cron_jobs_execution_log`.

### WS2: Runner de integración (Supabase local)
- [x] WS2.1.1 Script: `scripts/run-integration-tests.sh` ejecuta `supabase start` + `supabase db reset`.
- [x] WS2.1.2 Config: `vitest.integration.config.ts` + tests/integration en Vitest; comando `npm run test:integration`.
- [x] WS2.1 Evidencia: `npm run test:integration` OK (31/31).

### WS2: Smoke tests E2E mínimos
- [x] WS2.2.1 Tests de endpoints críticos (`status`, `precios`, `alertas`) en `tests/e2e/api-proveedor.smoke.test.ts`.
- [x] WS2.2.2 Cron smoke (`maintenance_cleanup` + insert en `cron_jobs_execution_log`) en `tests/e2e/cron.smoke.test.ts`.
- [x] Runner E2E: `scripts/run-e2e-tests.sh` + comando `npm run test:e2e`.
- [x] WS2.2 Evidencia: `npm run test:e2e` OK (4/4).

### F6: CI/CD
- [x] GitHub Actions workflow: `.github/workflows/ci.yml` (activo en `main`)
  - Job: lint (ESLint)
  - Job: test (Vitest) - **193 tests pasando** ✅
  - Job: build (Vite)
  - Job: typecheck (tsc)
  - Job: edge-functions-check (Deno, estricto)
  - Job: integration (**gated** - requiere `vars.RUN_INTEGRATION_TESTS` o `workflow_dispatch`) ✅
  - Job: e2e (**manual** - solo via `workflow_dispatch` con `run_e2e=true`) ✅
- [x] Carpetas Jest legacy (`performance/`, `security/`, `api-contracts/`) marcadas con README y excluidas de CI ✅

### F7: Gateway Security (api-minimarket) - 2026-01-12
- [x] Auth: JWT de usuario para RLS (no service role en lecturas) ✅
- [x] CORS: restrictivo con `ALLOWED_ORIGINS` env var (bloquea requests browser sin Origin) ✅
- [x] Rate limit: 60 req/min por IP (FixedWindowRateLimiter) ✅
- [x] Circuit breaker: `api-minimarket-db` con failureThreshold=5, openTimeoutMs=30_000 ✅
- [x] Helpers modularizados en `api-minimarket/helpers/`:
  - `auth.ts` (163 líneas) - extractBearerToken, verifyJwt, requireRole
  - `validation.ts` (130 líneas) - isUuid, isValidDate, validateRequiredFields
  - `pagination.ts` (96 líneas) - parsePagination, buildRangeHeader
  - `supabase.ts` (205 líneas) - createClient, queryTable, callFunction
- [x] Tests: 46 nuevos tests para helpers gateway ✅

---

## 📊 Métricas Finales

| Métrica | Antes | Después (2026-01-12) |
|---------|-------|---------|
| Archivos monolíticos >2000 líneas | 3 | 0 (refactor hecho) |
| Tests unitarios pasando | ~10 | **147** (Vitest) ✅ |
| Tests archivos | 5 | **11** (+ gateway helpers + api-proveedor-auth) ✅ |
| Framework testing | Jest+Vitest mezclados | Vitest unificado en suites activas |
| CI/CD | Ninguno | Pipeline activo en `main` + jobs gated |
| Shared libs | Dispersas | 6 módulos `_shared/` (adopción parcial) |
| Gateway security | Básico | **Hardened** (JWT, CORS, rate limit, circuit breaker) ✅ |
| Logging estructurado | Parcial | Parcial (cron auxiliares pendientes) |

---

## 📁 Estructura Final

```
supabase/functions/
├── _shared/              # Utilidades compartidas
│   ├── cors.ts
│   ├── response.ts
│   ├── errors.ts
│   ├── logger.ts
│   ├── rate-limit.ts
│   └── circuit-breaker.ts
├── api-minimarket/       # Gateway principal (HARDENED)
│   ├── index.ts          # 1357 líneas (refactorizado)
│   └── helpers/          # NUEVO - Helpers modularizados
│       ├── auth.ts       # JWT auth, roles
│       ├── validation.ts # UUID, dates, required fields
│       ├── pagination.ts # Parsing, range headers
│       ├── supabase.ts   # Client creation, queries
│       └── index.ts      # Barrel export
├── api-proveedor/        # Modular (router + handlers + utils)
├── scraper-maxiconsumo/  # Modular (9 módulos especializados)
├── cron-jobs-maxiconsumo/# Modular (4 jobs + orchestrator)
└── [otras funciones]/    # Adoptan _shared progresivamente

tests/unit/
├── api-proveedor-routing.test.ts  # 17 tests
├── scraper-parsing.test.ts        # 10 tests
├── scraper-matching.test.ts       # 9 tests
├── scraper-alertas.test.ts        # 3 tests
├── scraper-cache.test.ts          # tests de cache
├── scraper-config.test.ts         # tests de config
├── scraper-cookie-jar.test.ts     # tests de cookies
├── cron-jobs.test.ts              # 8 tests
├── response-fail-signature.test.ts # tests de respuesta
└── api-minimarket-gateway.test.ts # 46 tests (auth, validation, pagination, supabase, CORS, rate limit)

tests/integration/        # (gated - requiere env vars)
├── api-scraper.integration.test.ts
└── database.integration.test.ts

tests/e2e/                # (manual via workflow_dispatch)
├── api-proveedor.smoke.test.ts
└── cron.smoke.test.ts

tests/performance/        # (legacy Jest - desactivado)
├── README.md             # NUEVO - nota de estado
└── load-testing.test.js

tests/security/           # (legacy Jest - desactivado)
├── README.md             # NUEVO - nota de estado
└── security-tests.test.js

tests/api-contracts/      # (legacy Jest - desactivado)
├── README.md             # NUEVO - nota de estado
└── openapi-compliance.test.js

.github/workflows/
└── ci.yml                # Pipeline con jobs gated
```

---

## 🔮 Siguientes Pasos Recomendados

### Corto plazo (próximas 2 semanas)
1. **Aumentar coverage**: Objetivo 80% en módulos críticos (actual ~70%)
2. ~~**CI**: integrar `test:integration` y `test:e2e` en pipeline (WS6.1)~~ ✅ COMPLETADO
3. **Observabilidad**: cerrar validación runtime de alertas/comparaciones (WS4.1)
4. **Migrar suites Jest legacy** a Vitest (performance, security, api-contracts)

### Mediano plazo (1-2 meses)
1. **Refactor cron auxiliares**: Consolidar si hay duplicación
2. **Dashboard de métricas**: Visualizar health de cron jobs
3. **Documentación API**: Generar desde OpenAPI specs

### Largo plazo
1. **Staging environment**: Pipeline de deploy a staging
2. **Performance testing**: Benchmarks automatizados
3. **Security audit**: Revisión de RLS y permisos

---

## 📚 Documentación Actualizada

| Documento | Estado | Notas |
|-----------|--------|-------|
| [PLAN_EJECUCION.md](PLAN_EJECUCION.md) | ⚠️ Actualizado | Plan no completado |
| [ROADMAP.md](ROADMAP.md) | ✅ Vigente | Plan rolling 90 días |
| [PLAN_WS_DETALLADO.md](PLAN_WS_DETALLADO.md) | ✅ Vigente | Plan operativo por workstreams |
| [DECISION_LOG.md](DECISION_LOG.md) | ✅ Vigente | Decisiones confirmadas |
| [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md) | ✅ Vigente | Progreso aproximado hacia producción |
| [INVENTARIO_ACTUAL.md](INVENTARIO_ACTUAL.md) | ✅ Vigente | Refleja estructura modular |
| [BASELINE_TECNICO.md](BASELINE_TECNICO.md) | ✅ Vigente | Punto de partida documentado |
| [ESQUEMA_BASE_DATOS_ACTUAL.md](ESQUEMA_BASE_DATOS_ACTUAL.md) | ✅ Vigente | Schema alineado |
| [API_README.md](API_README.md) | ✅ Vigente | Endpoints documentados |
| [ARCHITECTURE_DOCUMENTATION.md](ARCHITECTURE_DOCUMENTATION.md) | ⚠️ Revisar | Actualizar con nueva modularización |
| [CRON_AUXILIARES.md](../supabase/functions/CRON_AUXILIARES.md) | ✅ Actualizado | Adopción real de _shared documentada |
| [AUDITORIA_RLS_CHECKLIST.md](AUDITORIA_RLS_CHECKLIST.md) | ⚠️ Pendiente | Checklist y scripts preparados; requiere credenciales |

---

## ✍️ Estado de Cierre

- **Cierre:** Pendiente (plan no completado)
- **Próxima revisión:** 2026-02-09
