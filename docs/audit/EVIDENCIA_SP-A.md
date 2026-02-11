# EVIDENCIA SP-A — Auditoría Forense

> Fecha: 2026-02-10
> Commit: `3b1a8b0`
> Ejecutor: Claude Code (Opus 4)
> Duración: ~15 min (3 agentes en paralelo)

---

## A1 — INVENTARIO FUNCIONAL REAL VS DECLARADO

**Commit audited:** `3b1a8b0` (main)
**Scope:** 13 Edge Functions, 13 Frontend Pages, 33 Migrations, 1 API Gateway

### EDGE FUNCTIONS INVENTORY

| # | Function | index.ts | _shared imports | Trigger type | Trigger evidence | Tests | Verdict |
|---|----------|----------|----------------|-------------|-----------------|-------|---------|
| 1 | **api-minimarket** | YES (22 TS, ~5,539 loc) | 7/7 | PROD/FRONTEND | apiClient.ts → VITE_API_GATEWAY_URL; 17 consuming files | ~15 test files | **REAL** |
| 2 | **api-proveedor** | YES (25 TS, ~2,800 loc) | 6/7 | PROD/EXTERNO | cron-jobs-maxiconsumo → daily-price-update; routing/auth/health tests | ~5 test files | **REAL** |
| 3 | **scraper-maxiconsumo** | YES (11 TS, ~2,319 loc) | 4/7 | PROD/INTERNAL | cron-jobs-maxiconsumo → `/scraping` y `/comparacion` | ~9 test files | **REAL** |
| 4 | **cron-jobs-maxiconsumo** | YES (10 TS, ~1,541 loc) | 2/7 | PROD/CRON | SQL: daily 02:00 + Sun 03:00 + */15min (CON auth header) | ~5 test files | **REAL** |
| 5 | **alertas-stock** | YES (1 TS, 162 loc) | 3/7 | PROD/CRON | SQL: every 1h (SIN auth header) | NONE | **REAL** (sin tests) |
| 6 | **notificaciones-tareas** | YES (1 TS, 176 loc) | 3/7 | PROD/CRON | SQL: every 2h (SIN auth header) | NONE | **REAL** (sin tests) |
| 7 | **reportes-automaticos** | YES (1 TS, 174 loc) | 3/7 | PROD/CRON | SQL: daily 08:00 (SIN auth header) | NONE | **REAL** (sin tests) |
| 8 | **alertas-vencimientos** | YES (1 TS, 207 loc) | 3/7 | NO-CRON | Sin cron entry, sin frontend caller | NONE | **PARTIAL** (sin trigger) |
| 9 | **reposicion-sugerida** | YES (1 TS, 238 loc) | 3/7 | NO-CRON | Sin cron entry, sin caller. Frontend usa views/insightsApi | NONE | **PARTIAL** (huérfana) |
| 10 | **cron-notifications** | YES (1 TS, 1,283 loc) | 3/7 | INTERNAL | Solo llamado por cron-testing-suite. Modos simulados. | 1 test file | **PARTIAL** (simulación) |
| 11 | **cron-dashboard** | YES (1 TS, 1,284 loc) | 2/7 | INTERNAL | Sin cron, sin frontend. Llama cron-health-monitor y cron-jobs | NONE | **PARTIAL** (sin trigger) |
| 12 | **cron-health-monitor** | YES (1 TS, 959 loc) | 2/7 | INTERNAL | Llamado por cron-dashboard y cron-testing-suite | 1 test file | **PARTIAL** (solo interno) |
| 13 | **cron-testing-suite** | YES (1 TS, 1,425 loc) | 1/7 | NO-PROD | Arnés de testing. Llama varias funciones. No en cron SQL. | N/A (ES el test) | **PARTIAL** (QA-only) |

**Resumen:** 7 REAL (54%) · 6 PARTIAL (46%) · 0 GHOST

### FRONTEND PAGES INVENTORY

| # | Page | Route | Data source | Error handling | Skeleton | Tests | Verdict |
|---|------|-------|-------------|---------------|----------|-------|---------|
| 1 | Dashboard.tsx | `/` | Hybrid (supabase + apiClient) | ErrorMessage + parseErrorMessage | YES | Dashboard.test.tsx | **REAL** |
| 2 | Pos.tsx | `/pos` (sin Layout) | apiClient + supabase | toast.error | NO | NONE | **REAL** |
| 3 | Pocket.tsx | `/pocket` (sin Layout) | Hybrid (apiClient + supabase) | toast.error | NO | NONE | **REAL** |
| 4 | Pedidos.tsx | `/pedidos` | apiClient via usePedidos | **console.error ONLY (P0)** | YES | NONE | **REAL** (gap UX) |
| 5 | Tareas.tsx | `/tareas` | Hybrid (supabase + apiClient) | ErrorMessage + parseErrorMessage | YES | Tareas.optimistic.test.tsx | **REAL** |
| 6 | Deposito.tsx | `/deposito` | apiClient | toast.error | NO | NONE | **REAL** |
| 7 | Productos.tsx | `/productos` | Hybrid (supabase + apiClient) | ErrorMessage + toast.error | YES | NONE | **REAL** |
| 8 | Kardex.tsx | `/kardex` | Hybrid (supabase + apiClient) | ErrorMessage + parseErrorMessage | NO | NONE | **REAL** |
| 9 | Stock.tsx | `/stock` | supabase direct | ErrorMessage + parseErrorMessage | YES | NONE | **REAL** |
| 10 | Rentabilidad.tsx | `/rentabilidad` | Hybrid (supabase + apiClient) | ErrorMessage + parseErrorMessage | NO | NONE | **REAL** |
| 11 | Proveedores.tsx | `/proveedores` | supabase direct | ErrorMessage + parseErrorMessage | NO (texto) | NONE | **REAL** |
| 12 | Clientes.tsx | `/clientes` | apiClient | toast.error | NO | NONE | **REAL** |
| 13 | Login.tsx | `/login` | Auth (supabase.auth) | inline div | NO | Login.test.tsx | **REAL** |

**Resumen:** 13/13 REAL · 5 con Skeleton · 3 con tests de página · 1 solo con console.error (Pedidos)

### DB/MIGRATIONS

- **Total migraciones:** 33
- **Stored procedures confirmados:** 3/3 (sp_aplicar_precio, sp_reservar_stock, fn_refresh_stock_views)
- **Última migración:** `20260209000000_fix_sp_reservar_stock_on_conflict.sql`

### API COVERAGE

- **Módulos en apiClient.ts:** 13
- **Endpoints distintos:** ~28
- **Handlers en api-minimarket:** 10
- **Routers en api-minimarket:** 6 (NOTA: directory `routers/` NUNCA importada por index.ts — código fantasma)
- **Helpers:** 5 (validation, pagination, index, supabase, auth)
- **Total TS en api-minimarket:** 22 archivos, ~5,539 líneas

### TOP RISKS (A1)

**P0 — Críticos:**
1. Pedidos.tsx usa console.error sin feedback visual al operador
2. alertas-vencimientos desplegada pero nunca disparada
3. reposicion-sugerida desplegada pero huérfana
4. cron-notifications en modo simulación solamente
5. 5/13 Edge Functions con ZERO unit tests

**P1 — Importantes:**
1. 8/13 páginas sin Skeleton loading
2. Pos.tsx y Pocket.tsx fuera de Layout wrapper
3. cron-dashboard y cron-health-monitor sin cron schedule
4. Patrón híbrido dato source: 8/9 hooks leen de Supabase directo
5. 10/13 páginas sin tests dedicados

---

## A2 — MAPA DE PENDIENTES CON CRITICIDAD

### CODE MARKERS

Scan de `TODO|FIXME|HACK|XXX|PENDIENTE` en TypeScript: **ZERO markers encontrados**. Código limpio.

### CONSOLE STATEMENTS EN PRODUCCIÓN

| # | Statement | Location | Criticidad |
|---|-----------|----------|-----------|
| 1 | `console.warn('Scan error:', err)` | BarcodeScanner.tsx:44 | VERDE |
| 2 | `console.warn(line)` | _shared/logger.ts:35 | VERDE (intencional) |
| 3 | `console.error('Error creando pedido:', err)` | Pedidos.tsx:50 | **AMARILLO** |
| 4 | `console.error('Error actualizando estado:', err)` | Pedidos.tsx:59 | **AMARILLO** |
| 5 | `console.error('Error actualizando item:', err)` | Pedidos.tsx:68 | **AMARILLO** |

### CATÁLOGO DE PENDIENTES (21 total: 5 ROJO · 12 AMARILLO · 4 VERDE)

| # | Pendiente | Ubicación | Criticidad | Impacto | Esfuerzo |
|---|-----------|-----------|-----------|---------|----------|
| P1 | deploy.sh NO filtra `_shared` | deploy.sh:307-321 | **ROJO** | Deploy falla | 1h |
| P2 | deploy.sh SIN `--no-verify-jwt` para api-minimarket | deploy.sh:313 | **ROJO** | Todos los requests autenticados fallan post-deploy | 1h |
| P3 | Pedidos.tsx mutations solo console.error | Pedidos.tsx:44-70 | **ROJO** | Operador sin feedback en errores | 2h |
| P7 | Rotación de secretos no ejecutada | Roadmap C3 | **ROJO** | Secretos potencialmente expuestos | 2h |
| P8 | SendGrid sender verification pendiente | ESTADO_ACTUAL:212 | **ROJO** | Emails fallan silenciosamente | 1h |
| P9 | SMTP_FROM vs EMAIL_FROM mismatch | D-074 | **ROJO** | Fallback a hardcoded noreply@ | 0.5h |
| P4 | Pedidos.tsx error inline en vez de ErrorMessage | Pedidos.tsx:82-88 | AMARILLO | UX inconsistente | 0.5h |
| P5 | Supabase JS gap: 2.39.3 vs 2.78.0+ | deno.json vs package.json | AMARILLO | Divergencia comportamiento | 1h |
| P6 | Allowlist no documentada | Roadmap A5 | AMARILLO | Devs sin contexto | 1h |
| P10 | Sentry bloqueado (sin DSN) | ESTADO_ACTUAL:23 | AMARILLO | Sin error tracking en prod | 2h |
| P11 | Leaked Password Protection requiere Pro plan | ESTADO_ACTUAL:176 | AMARILLO | Passwords filtrados aceptados | 0 ($) |
| P12 | pg_cron NO instalado, MV refresh manual | Roadmap A4 | AMARILLO | Alertas con datos obsoletos | 2h |
| P13 | Sin integration tests para /reservas | ESTADO_ACTUAL:220 | AMARILLO | Bugs concurrencia sin detectar | 3h |
| P15 | DB pooling/performance no verificado | ESTADO_ACTUAL:237 | AMARILLO | p50 baseline 839-1168ms | 4h |
| P16 | 7 páginas sin Skeleton | Multiple | AMARILLO | Pantalla blanca en conexiones lentas | 3h |
| P17 | 5 páginas sin ErrorMessage | Multiple | AMARILLO | Sin x-request-id en errores | 3h |
| P18 | 8 PRs pendientes de merge (#38-#46) | GitHub | AMARILLO | Mejoras no integradas | 2h |
| P20 | Coverage al 69.39% (< 80% política) | ESTADO_ACTUAL:347 | AMARILLO | Bajo umbral mínimo | 8h |
| P21 | audit module solo en 1 función | api-minimarket | AMARILLO | Sin audit trail en otros | 4h |
| P14 | x-request-id propagation incompleta | ESTADO_ACTUAL:234 | VERDE | Gaps tracing cron-to-cron | 2h |
| P19 | Major dep bumps diferidos (React 19, etc.) | package.json | VERDE | Divergencia crece | 8h |

### _SHARED ADOPTION MATRIX

| Module | Adoptantes | Gap |
|--------|-----------|-----|
| **logger** | 13/13 | Ninguno — universal |
| **cors** | 11/13 | cron-testing-suite, cron-jobs-maxiconsumo |
| **response** | 7/13 | 6 cron functions sin response estandarizado |
| **rate-limit** | 4/13 | 9 functions sin rate limiting |
| **circuit-breaker** | 4/13 | 9 functions sin circuit breaker |
| **errors** | 2/13 | Solo gateways; crons sin structured errors |
| **audit** | 1/13 | **GAP MAYOR:** Solo api-minimarket. Ningún audit trail en operaciones automatizadas |

### HC-2 VERIFICACIÓN: deploy.sh

**CONFIRMADO ROJO.**
- Lines 307-321: Loop itera `supabase/functions/*/` sin excluir `_shared` → intentará `deploy _shared` → fallo
- Line 313: `supabase functions deploy "$func_name"` sin `--no-verify-jwt` → redeploy de api-minimarket reactivará JWT gateway → 401 para todos los requests
- Sin flag `--use-api`

### HC-3 VERIFICACIÓN: Pedidos.tsx

**CONFIRMADO ROJO.**
```typescript
// Lines 44-70: 3 handlers SOLO con console.error
handleCreatePedido:      catch(err) { console.error('Error creando pedido:', err) }
handleUpdateEstado:      catch(err) { console.error('Error actualizando estado:', err) }
handleToggleItemPreparado: catch(err) { console.error('Error actualizando item:', err) }
```
Comparación: Deposito, Pos, Clientes usan `toast.error()`. Tareas usa `ErrorMessage`. Pedidos es la ÚNICA página que traga errores de mutación silenciosamente.

### FRONTEND UX GAPS

| Gap type | Páginas afectadas | Conteo |
|----------|-------------------|--------|
| Sin `ErrorMessage` | Pedidos, Clientes, Pos, Pocket, Deposito | 5 |
| Sin `Skeleton` loading | Kardex, Proveedores, Rentabilidad, Clientes, Pos, Pocket, Deposito | 7 |
| Sin ambos | Clientes, Pos, Pocket, Deposito | 4 |
| Sin gap | Dashboard, Tareas, Productos, Stock, Login | 5 |

### VERSION DISCREPANCIES

| Componente | Paquete | Versión |
|-----------|---------|---------|
| Frontend @supabase/supabase-js | package.json | ^2.78.0 (resuelve ~2.95.3) |
| Edge Functions @supabase/supabase-js | deno.json | 2.39.3 (pinned) |
| **Delta:** 56 minor versions |

---

## A3 — DETECCIÓN DE FUNCIONALIDAD FANTASMA

### CLASIFICACIÓN DE TRIGGERS

| Clasificación | Functions | Conteo |
|---------------|----------|--------|
| **PROD** | api-minimarket, scraper-maxiconsumo, cron-jobs-maxiconsumo | 3 |
| **EXTERNO/MANUAL** | api-proveedor | 1 |
| **CRON-RISK** | alertas-stock, notificaciones-tareas, reportes-automaticos | 3 (sin auth header en cron SQL) |
| **NO-PROD** | alertas-vencimientos, reposicion-sugerida, cron-notifications, cron-health-monitor, cron-dashboard | 5 |
| **QA-ONLY** | cron-testing-suite | 1 |

### CRON JOBS ANALYSIS

| Cron job | Schedule | Target | Auth header? | Riesgo |
|----------|----------|--------|-------------|--------|
| notificaciones-tareas_invoke | `0 */2 * * *` | notificaciones-tareas | **NO** | HIGH |
| alertas-stock_invoke | `0 * * * *` | alertas-stock | **NO** | HIGH |
| reportes-automaticos_invoke | `0 8 * * *` | reportes-automaticos | **NO** | HIGH |
| daily_price_update | `0 2 * * *` | cron-jobs-maxiconsumo | **SÍ** | LOW |
| weekly_trend_analysis | `0 3 * * 0` | cron-jobs-maxiconsumo | **SÍ** | LOW |
| realtime_change_alerts | `*/15 * * * *` | cron-jobs-maxiconsumo | **SÍ** | LOW |

**Hallazgo crítico:** Cron SQL referencia URL `htvlwhisjpdagqkqnpxg.supabase.co` vs project ref `dqaygmjpzoqjjrywdsxi`. Posible apunte a entorno diferente.

### ENDPOINTS SIN FRONTEND CALLER (~20)

De ~46 endpoints en api-minimarket gateway, ~20 no tienen caller en apiClient.ts:
- `/categorias`, `/categorias/:id`
- `/productos` (list, detail, PUT, DELETE)
- `/proveedores` (list, detail)
- `/precios/producto/:id`, `/precios/redondear`, `/precios/margen-sugerido/:id`
- `/stock`, `/stock/minimo`, `/stock/producto/:id`
- `/deposito/movimientos`, `/deposito/ingreso`
- `/reportes/efectividad-tareas`
- `/reservas`, `/reservas/:id/cancelar`
- `/compras/recepcion`, `/health`

**Causa raíz:** Patrón dual-path — frontend lee directamente de Supabase (PostgREST) para muchas entidades, los endpoints del gateway para esas lecturas existen pero no se usan.

### ARCHIVOS GHOST/REDUNDANTES

| Archivo/Dir | Situación | Líneas | Acción |
|------------|-----------|--------|--------|
| `api-minimarket/routers/` | **6 archivos, NUNCA importados por index.ts** | 1,023 | ELIMINAR |
| `import_map.json` | Duplicado de deno.json imports | 5 | ELIMINAR |
| `tests/unit/components/` | Directorio vacío | 0 | ELIMINAR |
| `src/pages/Dashboard.test.tsx` | Test mal ubicado en src/ | 131 | MOVER a tests/ |
| `src/pages/Login.test.tsx` | Test mal ubicado en src/ | 70 | MOVER a tests/ |
| `src/pages/Tareas.optimistic.test.tsx` | Test mal ubicado en src/ | 53 | MOVER a tests/ |

### LEGACY TESTS NO EN CI

| Suite | Archivo | Líneas | Estado CI |
|-------|---------|--------|-----------|
| Performance | tests/performance/load-testing.vitest.test.ts | 235 | **NO ejecutado** |
| Security | tests/security/security.vitest.test.ts | 472 | **NO ejecutado** |
| API Contracts | tests/api-contracts/openapi-compliance.vitest.test.ts | 365 | **NO ejecutado** |

Los 3 ya están migrados a Vitest pero CI solo ejecuta `npx vitest run tests/unit/`. **1,072 líneas de tests que nunca se ejecutan.**

### GHOST/ORPHAN LINES TOTAL

| Categoría | Líneas estimadas |
|-----------|-----------------|
| NO-PROD edge functions (5) | ~3,503 |
| QA-only function (cron-testing-suite) | ~1,286 |
| Unused routers/ directory | ~1,023 |
| Gateway endpoints sin frontend caller | ~800 est. |
| Legacy tests no en CI | 1,072 |
| Misplaced test files en src/ | 254 |
| import_map.json duplicado | 5 |
| **TOTAL** | **~7,943** |

---

## MÉTRICAS AGREGADAS SP-A

| Métrica | Valor |
|---------|-------|
| Edge Functions total | 13 deployed, 13 con index.ts |
| Edge Functions REAL | 7 (54%) |
| Edge Functions PARTIAL | 6 (46%) |
| Frontend Pages REAL | 13/13 (100%) |
| Migraciones | 33 |
| Stored Procedures | 3/3 confirmados |
| apiClient modules | 13 |
| apiClient endpoints | ~28 |
| Gateway endpoints total | ~46 |
| Gateway endpoints sin caller | ~20 |
| Cron jobs | 6 schedules → 6 funciones |
| Cron jobs SIN auth | 3 (HC-1) |
| Pendientes ROJO | 6 |
| Pendientes AMARILLO | 12 |
| Pendientes VERDE | 4 |
| Tests files sin ejecutar en CI | 3 suites (1,072 loc) |
| Ghost/orphan lines total | ~7,943 |
| Coverage | 69.39% (< 80% política) |
| _shared audit adoption | 1/13 (GAP MAYOR) |

---

## CROSS-REFERENCE HALLAZGOS NUEVOS (no en documentación previa)

| # | Hallazgo | Detectado en | Impacto |
|---|---------|-------------|---------|
| NEW-1 | `api-minimarket/routers/` (6 archivos, 1,023 líneas) NUNCA importado por index.ts | A3 | Ghost code en producción |
| NEW-2 | Cron SQL referencia URL `htvlwhisjpdagqkqnpxg` ≠ project ref `dqaygmjpzoqjjrywdsxi` | A3 | Posible apunte a entorno incorrecto |
| NEW-3 | SMTP_FROM vs EMAIL_FROM mismatch en cron-notifications | A2 | Emails con remitente hardcoded fallback |
| NEW-4 | 3 legacy test suites ya migradas a Vitest pero excluidas del CI | A3 | 1,072 líneas de tests desperdiciadas |
| NEW-5 | `VITE_USE_MOCKS` solo afecta a tareasApi, no a otros módulos | A3 | Coverage de mocks inconsistente |
