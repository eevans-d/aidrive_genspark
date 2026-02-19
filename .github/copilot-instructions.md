# Copilot Instructions - Mini Market

## Estructura del Proyecto
```
minimarket-system/     # Frontend React 18 + Vite 6 + TS 5.9 (SPA/PWA)
├── src/lib/supabase.ts       # Cliente Supabase (lecturas directas vía RLS)
├── src/lib/apiClient.ts      # Gateway client (escrituras)
├── src/contexts/AuthContext.tsx  # Autenticación (useAuth hook)
├── src/pages/                # 15 páginas (React Query + React.lazy)
├── src/hooks/queries/        # 9 hooks de React Query
├── src/components/           # Componentes compartidos
└── src/types/database.ts     # Tipos TS

supabase/functions/    # Edge Functions (Deno v2) - 13 activas
├── _shared/           # Utilidades compartidas
│   ├── cors.ts        # Headers CORS unificados
│   ├── response.ts    # Respuestas ok/fail estándar
│   ├── errors.ts      # Tipos AppError/HttpError
│   ├── logger.ts      # Logging estructurado
│   ├── rate-limit.ts  # Rate limiting (FixedWindow + Adaptive)
│   └── circuit-breaker.ts # Circuit breaker
├── api-minimarket/    # API Gateway principal (~2243 líneas, monolito)
│   ├── index.ts       # Gateway (35 endpoints, JWT → roles → CORS → rate limit)
│   ├── handlers/      # Handlers puntuales
│   └── helpers/       # Auth, validation, pagination, supabase client
├── api-proveedor/     # API proveedor - MODULAR (router + handlers + utils)
├── scraper-maxiconsumo/  # Scraper de precios - MODULAR (9 módulos)
├── cron-jobs-maxiconsumo/ # Orquestador cron - MODULAR (4 jobs + orchestrator)
├── cron-testing-suite/ # Suite de testing cron
├── cron-notifications/ # Notificaciones multi-canal (SendGrid + Slack + Webhook)
├── cron-dashboard/     # Dashboard API
├── cron-health-monitor/ # Health monitor
├── alertas-stock/     # Alertas de inventario
├── alertas-vencimientos/ # Alertas de vencimientos
├── reportes-automaticos/ # Reportes
├── notificaciones-tareas/ # Notificaciones
└── reposicion-sugerida/ # Sugerencias de reposición

supabase/cron_jobs/    # Scripts/JSON de scheduling de cron jobs
supabase/migrations/   # 44 migraciones SQL versionadas
supabase/config.toml   # Configuracion Supabase local

tests/unit/            # Tests unitarios (Vitest) - 76 archivos
tests/contract/        # Tests de contratos - 3 archivos
tests/api-contracts/   # Tests OpenAPI - 1 archivo
tests/e2e/             # Smoke tests - 1 archivo
tests/security/        # Tests de seguridad - 1 archivo
tests/performance/     # Tests de rendimiento - 1 archivo
minimarket-system/e2e/ # Tests Playwright E2E - 4 archivos
minimarket-system/src/ # Tests de componentes frontend - 30 archivos

.github/workflows/     # CI/CD
├── ci.yml             # Pipeline: lint → test → build → typecheck → edge-check → security
└── deploy-cloudflare-pages.yml  # Deploy frontend a Cloudflare Pages

docs/                  # Documentación canónica
docs/closure/          # Evidencias, reportes de cierre, context prompts
.agent/                # Sistema agéntico Protocol Zero (skills + workflows)
```

## Comandos (desde raíz del proyecto)
```bash
# Frontend (desde minimarket-system/)
pnpm dev       # Desarrollo
pnpm build     # Build
pnpm lint      # Linter

# Tests (desde raíz)
npx vitest run              # Unit tests (1561 tests, 76 archivos)
npx vitest run tests/unit/  # Solo unit tests
npx vitest run --coverage   # Con coverage (mínimo 80%)

# Validación
node scripts/validate-doc-links.mjs  # Validar links de docs
node scripts/metrics.mjs             # Regenerar METRICS.md
```

## Patrones del Código

### Frontend
- **Auth**: `useAuth()` de `AuthContext.tsx` → `user`, `signIn`, `signOut`
- **Rutas protegidas**: `ProtectedRoute` en `App.tsx` redirige a `/login`
- **Queries**: React Query hooks en `src/hooks/queries/` + Supabase client directo (lecturas RLS)
- **Escrituras**: `apiClient.ts` → Edge Function `api-minimarket` (JWT + roles)
- **Env requeridas**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_GATEWAY_URL`

### Edge Functions (Deno v2)
- Patrón: `Deno.serve` + CORS headers + responder OPTIONS
- Env requeridas: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- API Gateway: `api-minimarket/index.ts` → routing por path/method + roles
- Nota: `api-minimarket` se despliega con `--no-verify-jwt`

### Base de Datos (38 tablas)
- Schema completo: `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
- Tablas core: `categorias`, `productos`, `proveedores`, `stock_deposito`, `movimientos_deposito`
- Tablas POS/ventas: `clientes`, `ventas`, `venta_items`, `cuentas_corrientes_movimientos`
- Tablas cron: `cron_jobs_tracking`, `cron_jobs_execution_log`, `cron_jobs_alerts`, `cron_jobs_metrics`, etc.
- Tablas infra: `rate_limit_state`, `circuit_breaker_state`
- RLS: todas las tablas con políticas role-based (`has_personal_role()`)
- Vistas cron: `vista_cron_jobs_dashboard`, `vista_cron_jobs_metricas_semanales`, `vista_cron_jobs_alertas_activas`

## Fuentes de Verdad
| Qué | Dónde |
|-----|-------|
| Estado actual | `docs/ESTADO_ACTUAL.md` |
| Pendientes | `docs/closure/OPEN_ISSUES.md` |
| Decisiones | `docs/DECISION_LOG.md` |
| API endpoints | `docs/API_README.md` |
| Schema BD (38 tablas) | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| OpenAPI spec | `docs/api-openapi-3.1.yaml` |
| Arquitectura | `docs/ARCHITECTURE_DOCUMENTATION.md` |
| Deploy | `docs/DEPLOYMENT_GUIDE.md` |
| Operaciones | `docs/OPERATIONS_RUNBOOK.md` |
| Continuidad | `docs/closure/CONTINUIDAD_SESIONES.md` |
| Obra objetivo | `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md` |
| Credenciales | `docs/OBTENER_SECRETOS.md` (nombres, nunca valores) |
| Métricas | `docs/METRICS.md` (generado por `scripts/metrics.mjs`) |

## Estado Actual (Febrero 2026 - verificado D-142)

### Proyecto Supabase
- **Nombre:** minimarket-system
- **Ref:** dqaygmjpzoqjjrywdsxi
- **URL:** https://dqaygmjpzoqjjrywdsxi.supabase.co
- **Edge Functions:** 13 desplegadas y funcionando (api-minimarket v29, api-proveedor v20, scraper-maxiconsumo v21)
- **Migraciones:** 44 versionadas (44/44 synced)
- **Frontend:** Cloudflare Pages — https://aidrive-genspark.pages.dev

### Testing
- Framework: **Vitest** (unit/integration) + **Playwright** (E2E)
- Unit tests: 1561 passing (76 archivos)
- Frontend component tests: 175 passing (30 archivos)
- E2E tests: 4 passing
- Integration tests: 68 passing
- Coverage: 88.52% stmts / 80.16% branch / 92.32% funcs / 89.88% lines
- Coverage mínimo: 80%

### CI/CD
- Pipeline tests: `.github/workflows/ci.yml` (lint → test → build → typecheck → edge-check → security)
- Pipeline deploy: `.github/workflows/deploy-cloudflare-pages.yml` (push a main = producción automática)
- Veredicto operativo: **GO** (D-140, score 100%, 11/11 gates)

### Pendientes (ver `docs/closure/OPEN_ISSUES.md`)
1. P1: Configurar `SUPABASE_DB_URL` en GitHub Actions para backup (owner)
2. P2: Revocar API key anterior de SendGrid (owner)
