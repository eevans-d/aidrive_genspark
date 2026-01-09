# Copilot Instructions - Mini Market

## Estructura del Proyecto
```
minimarket-system/     # Frontend React + Vite + TS
├── src/lib/supabase.ts       # Cliente Supabase
├── src/contexts/AuthContext.tsx  # Autenticación
├── src/pages/                # Páginas (Dashboard, Stock, etc.)
└── src/types/database.ts     # Tipos TS

supabase/functions/    # Edge Functions (Deno) - 11 activas, modularización parcial
├── _shared/           # Utilidades compartidas
│   ├── cors.ts        # Headers CORS unificados
│   ├── response.ts    # Respuestas ok/fail estándar
│   ├── errors.ts      # Tipos AppError/HttpError
│   ├── logger.ts      # Logging estructurado
│   └── rate-limit.ts  # Rate limiting (uso inconsistente)
├── api-minimarket/    # API Gateway principal (1050 líneas)
├── api-proveedor/     # API proveedor - MODULAR (router + handlers + utils)
├── scraper-maxiconsumo/  # Scraper de precios - MODULAR (9 módulos)
│   ├── types.ts, config.ts, cache.ts, anti-detection.ts
│   ├── parsing.ts, matching.ts, alertas.ts, storage.ts, scraping.ts
│   └── index.ts (orquestador)
├── cron-jobs-maxiconsumo/ # Orquestador cron - MODULAR (4 jobs + orchestrator)
│   ├── jobs/daily-price-update.ts
│   ├── jobs/realtime-alerts.ts
│   ├── jobs/weekly-analysis.ts
│   ├── jobs/maintenance.ts
│   └── orchestrator.ts
├── cron-testing-suite/ # Suite de testing cron
├── cron-notifications/ # Notificaciones cron
├── cron-dashboard/     # Dashboard API
├── cron-health-monitor/ # Health monitor
├── alertas-stock/     # Alertas de inventario ✓
├── reportes-automaticos/ # Reportes ✓
└── notificaciones-tareas/ # Notificaciones ✓

supabase/cron_jobs/    # Scripts/JSON de scheduling de cron jobs
supabase/migrations/   # Migraciones SQL versionadas
supabase/config.toml   # Configuracion Supabase local

tests/unit/            # Tests unitarios (Vitest) - imports de módulos reales
├── api-proveedor-routing.test.ts  # 17 tests
├── scraper-parsing.test.ts        # 10 tests
├── scraper-matching.test.ts       # 7 tests
├── scraper-alertas.test.ts        # 3 tests
└── cron-jobs.test.ts              # 8 tests

.github/workflows/     # CI/CD
└── ci.yml             # Pipeline: lint → test → build → typecheck

docs/                  # 20 archivos de documentación + OpenAPI/Postman
├── PLAN_EJECUCION.md           # Plan técnico (en progreso)
├── CHECKLIST_CIERRE.md         # Estado del proyecto
├── ANALISIS_EXHAUSTIVO_PROYECTO.md
├── OBJETIVOS_Y_KPIS.md
├── INVENTARIO_ACTUAL.md
├── BASELINE_TECNICO.md
├── DB_GAPS.md
├── API_README.md
├── ARCHITECTURE_DOCUMENTATION.md
├── CRON_JOBS_COMPLETOS.md
├── DEPLOYMENT_GUIDE.md
├── DOCUMENTACION_TECNICA_ACTUALIZADA.md
├── ESQUEMA_BASE_DATOS_ACTUAL.md
├── OPERATIONS_RUNBOOK.md
├── api-openapi-3.1.yaml
├── api-proveedor-openapi-3.1.yaml
├── postman-collection.json
└── postman-collection-proveedor.json
```

## Comandos (desde raíz del proyecto)
```bash
# Frontend (desde minimarket-system/)
pnpm dev       # Desarrollo
pnpm build     # Build
pnpm lint      # Linter

# Tests (desde raíz)
npx vitest run              # Unit tests (según vitest.config.ts)
npx vitest run tests/unit/  # Solo unit tests
npx vitest --coverage       # Unit tests con coverage
```

## Patrones del Código

### Frontend
- **Auth**: `useAuth()` de `AuthContext.tsx` → `user`, `signIn`, `signOut`
- **Rutas protegidas**: `ProtectedRoute` en `App.tsx` redirige a `/login`
- **Queries**: `supabase.from('tabla').select('*').eq('campo', valor)`
- **Env requeridas**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Edge Functions (Deno)
- Patrón: `Deno.serve` + CORS headers + responder OPTIONS
- Env requeridas: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- API Gateway: `api-minimarket/index.ts` → routing por path/method + roles

### Base de Datos
- Tabla `stock_deposito`: `cantidad_actual`, `stock_minimo`, `stock_maximo`
- Cron jobs usan tablas: `cron_jobs_execution_log`, `cron_jobs_alerts`, `cron_jobs_metrics`, `cron_jobs_tracking`, `cron_jobs_notifications`, `cron_jobs_monitoring_history`, `cron_jobs_health_checks`
- Vistas cron usadas por funciones: `vista_cron_jobs_dashboard`, `vista_cron_jobs_metricas_semanales`, `vista_cron_jobs_alertas_activas`

## Fuentes de Verdad
| Qué | Dónde |
|-----|-------|
| API endpoints | `docs/API_README.md` |
| Schema BD | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| OpenAPI spec | `docs/api-openapi-3.1.yaml` |
| Arquitectura | `docs/ARCHITECTURE_DOCUMENTATION.md` |
| Deploy | `docs/DEPLOYMENT_GUIDE.md` |
| Operaciones | `docs/OPERATIONS_RUNBOOK.md` |
| Plan de ejecución | `docs/PLAN_EJECUCION.md` |
| Estado del proyecto | `docs/CHECKLIST_CIERRE.md` |

## Estado Actual (Enero 2025 - verificado)

### Funciones Modularizadas
1. **api-proveedor**: Router + handlers + schemas + validators + utils
2. **scraper-maxiconsumo**: 9 módulos (types, config, cache, anti-detection, parsing, matching, storage, scraping, index)
3. **cron-jobs-maxiconsumo**: 4 jobs aislados + orchestrator
   - Pendientes críticos: rate limiter API, alertas reales, y persistencia con schema DB.

### Testing
- Framework: **Vitest 4.0.16**
- Tests: imports de módulos reales (parsing/matching/alertas/router/cron)
- Runner/scripts: `package.json` y `test.sh` alineados con Vitest
- Nota: suites integration/e2e/seguridad/performance requieren runner/deps separados (Jest/otros)

### CI/CD
- Pipeline: `.github/workflows/ci.yml`
- Jobs: lint → test → build → typecheck → edge-functions-check
- Nota: workflow activo en `main` y edge-check estricto

### Funciones Auxiliares de Cron (documentadas en CRON_AUXILIARES.md):
- `cron-testing-suite` - Testing e2e de cron jobs
- `cron-notifications` - Envío de notificaciones
- `cron-dashboard` - API para dashboard
- `cron-health-monitor` - Monitoreo de salud

### Notas:
- `tests/datos_reales/results/` está en .gitignore (no versionar resultados)
- CI configurado en `.github/workflows/ci.yml` (activo en `main`)
- Vitest elegido; runner/scripts alineados
