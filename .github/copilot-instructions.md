# Copilot Instructions - Mini Market

## Estructura del Proyecto
```
minimarket-system/     # Frontend React + Vite + TS
├── src/lib/supabase.ts       # Cliente Supabase
├── src/contexts/AuthContext.tsx  # Autenticación
├── src/pages/                # Páginas (Dashboard, Stock, etc.)
└── src/types/database.ts     # Tipos TS

supabase/functions/    # Edge Functions (Deno) - 11 activas
├── api-minimarket/    # API Gateway principal (1050 líneas)
├── api-proveedor/     # API proveedor Maxiconsumo (3744 líneas) ⚠️
├── scraper-maxiconsumo/  # Scraper de precios (3212 líneas) ⚠️
├── cron-jobs-maxiconsumo/ # Orquestador cron (2900 líneas) ⚠️
├── cron-testing-suite/ # Suite de testing cron (1413 líneas)
├── cron-notifications/ # Notificaciones cron (1184 líneas)
├── cron-dashboard/     # Dashboard API (1130 líneas)
├── cron-health-monitor/ # Health monitor (898 líneas)
├── alertas-stock/     # Alertas de inventario (160 líneas) ✓
├── reportes-automaticos/ # Reportes (177 líneas) ✓
└── notificaciones-tareas/ # Notificaciones (155 líneas) ✓

supabase/cron_jobs/    # Scripts/JSON de scheduling de cron jobs
supabase/migrations/   # Migraciones SQL versionadas
supabase/config.toml   # Configuracion Supabase local

docs/                  # 19 archivos de documentación + OpenAPI/Postman
├── ANALISIS_EXHAUSTIVO_PROYECTO.md
├── OBJETIVOS_Y_KPIS.md
├── INVENTARIO_ACTUAL.md
├── BASELINE_TECNICO.md
├── DB_GAPS.md
├── PLAN_EJECUCION.md
├── PLAN_LIMPIEZA_CONTEXTO.md
├── PROMPTS_CODEX_MINIMARKET.md
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

## Comandos (desde `minimarket-system/`)
```bash
pnpm dev       # Desarrollo
pnpm build     # Build
pnpm lint      # Linter
pnpm test      # Ejecuta `../test.sh` (runner actual)
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

## ⚠️ Aspectos Críticos (Requieren Atención)

### Funciones Gigantes (>2000 líneas) - Candidatas a refactorizar:
1. **api-proveedor** (3744 líneas): Dividir en módulos por endpoint
2. **scraper-maxiconsumo** (3212 líneas): Separar lógica de scraping, parsing, cache
3. **cron-jobs-maxiconsumo** (2900 líneas): Extraer jobs a archivos separados

### Funciones Auxiliares de Cron (podrían consolidarse):
- `cron-testing-suite` (1413 líneas)
- `cron-notifications` (1184 líneas)
- `cron-dashboard` (1130 líneas)
- `cron-health-monitor` (898 líneas)

### Notas:
- `tests/datos_reales/results/` está en .gitignore (no versionar resultados)
- No hay CI configurado aún
- Tests consolidados en `tests/` (runner: `test.sh`)
