# CONTEXT PROMPT — Coverage 80% + Hardening + DX (2026-02-16)

> **Uso:** Pegar COMPLETO en una nueva ventana de Claude Code.
> **Generado:** 2026-02-16 por sesión previa (D-114/D-115).
> **Estimación:** 20-25 tareas secuenciales/agrupables.

---

## ROL

Eres un agente técnico ejecutor senior del proyecto **Mini Market System**. Tu misión en esta sesión es llevar el coverage global de tests del **64.37% actual al ≥80% requerido**, corregir deuda técnica pendiente, y dejar el proyecto documentado y verificado.

---

## PROYECTO

```
Nombre:     Mini Market System
Repo local: /home/eevan/ProyectosIA/aidrive_genspark
Branch:     main
Stack:      React/Vite/TS (frontend) + Supabase Edge Functions/Deno (backend) + PostgreSQL
Ref:        dqaygmjpzoqjjrywdsxi
Estado:     APROBADO (P0 cerrados). Score operativo: 92/100.
```

---

## ESTADO VERIFICADO (pre-sesión)

| Indicador | Valor |
|-----------|-------|
| Unit tests | **891/891 PASS** (47 archivos, 16s) |
| Auxiliary tests | **45 PASS + 4 skipped** (3 archivos) |
| Coverage global | **64.37% stmts / 56.87% branch / 68.8% funcs / 66.09% lines** |
| Threshold requerido | **80% en todo** (`vitest.config.ts` → `thresholds.global`) |
| Edge Functions | 13 activas |
| Migraciones | 41/41 local=remoto |
| CI Pipeline | lint → test → build → typecheck → edge-functions-check → security-tests |

---

## PRIMER PASO OBLIGATORIO

Lee en este orden antes de tocar código:
1. `docs/ESTADO_ACTUAL.md` — estado global verificado
2. `docs/closure/OPEN_ISSUES.md` — issues abiertos/cerrados
3. `vitest.config.ts` — config de test y coverage
4. `vitest.auxiliary.config.ts` — tests auxiliares (contract/performance/api-contracts)

---

## DIAGNÓSTICO DE COVERAGE (datos reales, 2026-02-16)

### Módulos por DEBAJO del 80% (acción requerida)

| Módulo | Stmts% | Lines% | Archivos principales | Líneas sin cubrir |
|--------|--------|--------|---------------------|-------------------|
| `minimarket-system/src/mocks/` | 12.22 | 13.09 | `supabaseMock.ts`, handlers mock | **EXCLUIR** del coverage (son mocks) |
| `api-minimarket/helpers/` | 42.10 | 42.21 | `auth.ts` (35%), `supabase.ts` (~2%) | auth: cache/breaker/fetchUserInfo; supabase: client helpers |
| `_shared/circuit-breaker.ts` | 50.57 | 50.00 | shared RPC functions | Líneas 128-247 (RPC-backed breaker) |
| `_shared/` (global) | 66.29 | 69.36 | `rate-limit.ts`, `audit.ts`, `errors.ts` | Ramas no cubiertas |
| `api-minimarket/handlers/` | 60.79 | 61.04 | `ventas.ts` (47%), `pedidos.ts`, `clientes.ts`, `search.ts` | Handlers CRUD sin tests unitarios |
| `api-proveedor/utils/` | 62.90 | 63.15 | `params.ts`, `constants.ts` | Funciones utilitarias |
| `scraper-maxiconsumo/` | 64.07 | 65.46 | `anti-detection.ts` (34%), `storage.ts` (47%) | anti-detection: líneas 46-70, 228-399 |
| `hooks/queries/` | 76.62 | 81.53 | `useDashboardStats.ts` (73%) | Branch coverage bajo |

### Módulos ya OK (≥80%)

| Módulo | Lines% |
|--------|--------|
| `src/components/` | 95.45 |
| `src/utils/` | 100 |
| `api-proveedor/` (root) | 90.74 |
| `cron-jobs-maxiconsumo/jobs/` | 96.84 |
| `scraper-maxiconsumo/utils/` | 89.65 |

---

## TAREAS (20-25) — EJECUTAR EN ORDEN

### BLOQUE A: Quick Wins de Coverage (tareas 1-2)

**TAREA 1: Excluir `src/mocks/` del reporte de coverage**
- Archivo: `vitest.config.ts` → `coverage.exclude[]`
- Agregar: `'minimarket-system/src/mocks/**'` y `'tests/mocks/**'`
- Impacto: `src/mocks` tiene 12% coverage y arrastra el promedio innecesariamente (son archivos de mock, no código productivo)
- Verificar: `npx vitest run --coverage 2>&1 | grep "All files"` → el % global debe subir

**TAREA 2: Fix `Proveedores.test.tsx` — envolver en QueryClientProvider**
- Archivo: `minimarket-system/src/pages/Proveedores.test.tsx` (si existe) o localizar con `find minimarket-system -name "Proveedores.test*"`
- Problema: el test falla porque el componente usa `useQuery`/`useMutation` sin `QueryClientProvider`
- Fix: envolver el render en `QueryClientProvider` con un `queryClient` de test
- Verificar: el test debe PASAR

---

### BLOQUE B: Coverage de Módulos Críticos Backend (tareas 3-10)

**TAREA 3: Tests para `helpers/auth.ts` (349 líneas, coverage 35% → 80%)**
- Ruta fuente: `supabase/functions/api-minimarket/helpers/auth.ts`
- Tests existentes: `tests/unit/auth-resilient.test.ts` (421 líneas), `tests/unit/gateway-auth.test.ts` (210 líneas)
- Qué falta cubrir:
  - `fetchUserInfo()`: flujo completo con mock de `fetch` (success, 401, timeout, network error)
  - Cache hit/miss/eviction (authCache con TTL 30s, negative cache)
  - Breaker integration: authBreakerAllows() → false returns 503
  - Role normalization: `jefe`→`admin`, `depósito`→`deposito`, `vendedor`→`ventas`
  - `createRequestHeaders()`: ya testeado parcialmente, verificar coverage
- Estrategia: mockear `fetch` con `vi.fn()`, NO mockear las funciones internas. Importar las funciones REALES y usar `_clearAuthCache()`, `_resetAuthBreaker()` en `beforeEach`.
- Archivo destino: `tests/unit/auth-fetchuser.test.ts` (NUEVO)

**TAREA 4: Tests para `helpers/supabase.ts` (245 líneas, coverage ~2%)**
- Ruta fuente: `supabase/functions/api-minimarket/helpers/supabase.ts`
- Este archivo contiene helpers para crear el cliente Supabase y construir queries
- Revisar qué exporta y qué es testeable sin conexión real
- Las funciones que requieren conexión real pueden mockearse con `vi.mock`
- Archivo destino: `tests/unit/helpers-supabase.test.ts` (NUEVO)

**TAREA 5: Tests para `_shared/circuit-breaker.ts` RPC functions (248 líneas, coverage 50%)**
- Ruta fuente: `supabase/functions/_shared/circuit-breaker.ts`
- Tests existentes: `tests/unit/shared-circuit-breaker.test.ts` (241 líneas), `tests/unit/circuit-breaker-shared.test.ts` (218 líneas)
- Qué falta: líneas 128-247 = `recordCircuitBreakerEvent()`, `checkCircuitBreakerShared()`, `_resetCbRpcAvailability()`
- Estas funciones hacen fetch a RPCs. Mockear `fetch` globalmente.
- Cubrir: RPC success, RPC 404 (fallback), RPC error (fallback), `cbRpcAvailable` caching
- Archivo destino: agregar al existente `tests/unit/circuit-breaker-shared.test.ts`

**TAREA 6: Tests para `scraper-maxiconsumo/anti-detection.ts` (427 líneas, coverage 34%)**
- Ruta fuente: `supabase/functions/scraper-maxiconsumo/anti-detection.ts`
- Tests existentes: `tests/unit/scraper-anti-detection.test.ts` (316 líneas)
- Qué falta: líneas 46-70 (proxy/captcha helpers), líneas 228-399 (session management, fetchConReintentos, delay, cookie jar integration)
- Funciones a cubrir: `isProxyEffectivelyEnabled()`, `isCaptchaServiceEnabled()`, `getEffectiveProxyUrl()`, `getEffectiveCaptchaService()`, `generateSessionId()`, `generateRequestId()`, `generarHeadersAleatorios()`, `generateAdvancedHeaders()`, `fetchConReintentos()`, `crearSesionNavegacion()`
- Estrategia: mockear `fetch` para `fetchConReintentos`. Las funciones de generación son puras/aleatorias — testear forma y tipo.
- Archivo destino: agregar al existente `tests/unit/scraper-anti-detection.test.ts`

**TAREA 7: Tests para `scraper-maxiconsumo/storage.ts` (202 líneas, coverage ~47%)**
- Ruta fuente: `supabase/functions/scraper-maxiconsumo/storage.ts`
- Tests existentes: `tests/unit/scraper-storage-auth.test.ts` (572 líneas)
- Revisar qué líneas faltan, agregar tests para flujos no cubiertos
- Archivo destino: agregar al existente o crear `tests/unit/scraper-storage.test.ts`

**TAREA 8: Tests para `handlers/ventas.ts` (286 líneas, coverage ~47%)**
- Ruta fuente: `supabase/functions/api-minimarket/handlers/ventas.ts`
- Tests existentes: `tests/unit/api-ventas-pos.test.ts` (173 líneas)
- Qué falta: handlers de listado con filtros de fecha, CRUD operations, edge cases
- Mockear Supabase client con `vi.mock` o pattern de dependency injection
- Archivo destino: `tests/unit/handlers-ventas.test.ts` (NUEVO) o ampliar existente

**TAREA 9: Tests para `handlers/pedidos.ts` (383 líneas)**
- Tests existentes: `tests/unit/pedidos-handlers.test.ts` (322 líneas)
- Revisar coverage actual y agregar tests para líneas faltantes
- Archivo destino: ampliar existente

**TAREA 10: Tests para `handlers/clientes.ts` (226 líneas) y `handlers/search.ts` (180 líneas)**
- Estos handlers probablemente tienen bajo coverage
- Crear tests con mocks de Supabase client
- Archivos destino: `tests/unit/handlers-clientes.test.ts`, `tests/unit/handlers-search.test.ts` (NUEVOS)

---

### BLOQUE C: Coverage de Módulos Secundarios (tareas 11-14)

**TAREA 11: Tests para `api-proveedor/utils/` (62.9% → 80%)**
- Archivos: `params.ts`, `constants.ts` y otros en `supabase/functions/api-proveedor/utils/`
- Listar exports y verificar qué está sin cubrir
- Agregar tests específicos

**TAREA 12: Ampliar tests de `_shared/rate-limit.ts` (273 líneas)**
- Tests existentes: `tests/unit/shared-rate-limit.test.ts` (295 líneas), `tests/unit/rate-limit-shared.test.ts` (248 líneas)
- Revisar si el coverage de este archivo ya está ≥80% o necesita más

**TAREA 13: Ampliar tests de `_shared/audit.ts` (209 líneas)**
- Tests existentes: `tests/unit/shared-audit.test.ts` (351 líneas)
- Revisar cobertura y ampliar si necesario

**TAREA 14: Revisar `hooks/queries/useDashboardStats.ts` (73% → 80%)**
- Frontend hook, branch coverage bajo (50%)
- Agregar test cases para branches no cubiertos

---

### BLOQUE D: DX y Tooling (tareas 15-16)

**TAREA 15: Fix pre-commit/lint-staged resolución de eslint**
- Problema: `eslint` puede fallar por resolución de binarios fuera de `minimarket-system/node_modules`
- Revisar `.husky/pre-commit` y/o `lint-staged` config en `package.json`
- Fix: usar path explícito o `npx` dentro de `minimarket-system/`
- Verificar: `git commit --allow-empty -m "test"` no falla

**TAREA 16: Documentar allowlist de `api-proveedor` en docs**
- El código de `INTERNAL_ORIGINS_ALLOWLIST` ya está implementado
- Agregar sección en `docs/API_README.md` bajo "CORS y Seguridad" explicando la configuración
- Agregar referencia en `docs/SECURITY.md`

---

### BLOQUE E: Verificación Final y Documentación (tareas 17-22)

**TAREA 17: Ejecutar coverage completo y verificar ≥80%**
```bash
npx vitest run --coverage
```
- El output debe mostrar ALL FILES ≥ 80% en stmts, branch, funcs, lines
- Si algún módulo sigue bajo, iterar con tests adicionales

**TAREA 18: Ejecutar auxiliary tests**
```bash
npx vitest run --config vitest.auxiliary.config.ts
```
- Debe pasar: 45+ tests PASS (4 skipped por credenciales es OK)

**TAREA 19: Ejecutar lint + build + typecheck del frontend**
```bash
cd minimarket-system && pnpm lint && pnpm build
```
- Ambos deben PASS sin errores

**TAREA 20: Verificar CI localmente (simulación)**
```bash
npx vitest run                           # unit tests
npx vitest run --config vitest.auxiliary.config.ts  # auxiliary
cd minimarket-system && pnpm lint && pnpm build     # frontend
```
- Todo debe PASS

**TAREA 21: Actualizar documentación canónica**
- `docs/ESTADO_ACTUAL.md` → Sección 3: actualizar contadores de tests y coverage
- `docs/DECISION_LOG.md` → Agregar D-116 con resumen de la sesión
- `CHANGELOG.md` → Agregar entrada bajo v1.8.0 o crear v1.9.0 si aplica
- `docs/closure/OPEN_ISSUES.md` → Cerrar issues resueltos
- `docs/closure/CONTINUIDAD_SESIONES.md` → Actualizar tabla sección 2 (tests count) y sección 4 (registro de sesiones)

**TAREA 22: Commit final**
```bash
git add -A
git commit -m "feat(tests): coverage global ≥80% — nuevos tests + exclusiones + DX fixes"
```

---

### BLOQUE F: Tareas Opcionales (si queda margen, tareas 23-25)

**TAREA 23: Ampliar tests de `scraper-maxiconsumo/config.ts` y `cache.ts`**
- Config: 172 líneas, coverage a verificar
- Cache: 186 líneas, test existente tiene solo 81 líneas

**TAREA 24: Tests para `handlers/ofertas.ts`, `handlers/reservas.ts`, `handlers/insights.ts`**
- Handlers menores con coverage probablemente bajo
- Crear tests básicos con mocks

**TAREA 25: Limpieza incremental de 88 referencias históricas en docs**
- `docs/closure/OPEN_ISSUES.md` documenta 88 referencias en backticks apuntando a rutas históricas
- Limpiar por lotes sin romper trazabilidad

---

## GUARDRAILS (no negociables)

1. **NUNCA** exponer secretos/JWTs (solo nombres de variables).
2. **NUNCA** usar `git reset --hard`, `git checkout -- <file>`, force push.
3. Si redeploy de `api-minimarket`: usar `--no-verify-jwt`.
4. Coverage mínimo: **80%** (`vitest.config.ts` → `thresholds.global`).
5. Todo cambio debe dejar evidencia verificable en filesystem.
6. Tests deben importar código REAL del proyecto, no testear mocks contra mocks.
7. Cada tarea completada → registrar en `docs/DECISION_LOG.md`.

---

## ESTRUCTURA DEL PROYECTO (referencia rápida)

```
minimarket-system/src/     # Frontend React + Vite + TS
supabase/functions/        # Edge Functions (Deno)
├── _shared/               # cors, errors, response, circuit-breaker, rate-limit, audit, logger
├── api-minimarket/        # Gateway principal (handlers/, helpers/, routers/)
│   ├── handlers/          # ventas, pedidos, clientes, proveedores, reservas, ofertas, search, insights, bitacora
│   └── helpers/           # auth, pagination, validation, supabase
├── api-proveedor/         # API proveedor (validators, schemas, router, utils/)
├── scraper-maxiconsumo/   # Scraper (parsing, anti-detection, storage, cache, config, matching, alertas)
├── cron-jobs-maxiconsumo/ # Cron jobs (4 jobs + orchestrator)
└── ... (8 Edge Functions más)
supabase/migrations/       # 41 migraciones SQL
tests/unit/                # 47 archivos, 891 tests
tests/contract/            # 3 archivos
tests/performance/         # 1 archivo
tests/api-contracts/       # 1 archivo
tests/security/            # 1 archivo
```

## COMANDOS ÚTILES

```bash
# Tests
npx vitest run                                        # Unit tests (891)
npx vitest run --coverage                             # Con coverage
npx vitest run --config vitest.auxiliary.config.ts     # Auxiliary (contract/perf/api-contracts)
npx vitest run tests/unit/ARCHIVO.test.ts             # Un test específico

# Frontend
cd minimarket-system && pnpm dev                      # Dev server
cd minimarket-system && pnpm build                    # Build
cd minimarket-system && pnpm lint                     # Lint

# Git
git --no-pager log --oneline -5                       # Últimos commits
git --no-pager diff --stat                            # Archivos modificados
```

## FUENTES DE VERDAD

| Qué | Dónde |
|-----|-------|
| Estado global | `docs/ESTADO_ACTUAL.md` |
| Issues abiertos | `docs/closure/OPEN_ISSUES.md` |
| Decisiones | `docs/DECISION_LOG.md` (última: D-115) |
| Schema BD | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |
| API endpoints | `docs/API_README.md` |
| Seguridad | `docs/SECURITY.md` |
| Config coverage | `vitest.config.ts` → `coverage.thresholds` |
| Continuidad | `docs/closure/CONTINUIDAD_SESIONES.md` |

---

**OBJETIVO DE CIERRE:** Coverage ≥80% global verificado, 0 tests fallando, documentación actualizada, commit limpio en main.
