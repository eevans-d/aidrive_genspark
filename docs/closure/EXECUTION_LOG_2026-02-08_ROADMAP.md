# EXECUTION LOG - Roadmap 2026-02-08

**Fecha:** 2026-02-08
**Branch:** `feat/roadmap-exec-20260208`
**Base:** `chore/closure-prep-20260202` @ `338b30b`
**Ejecutor:** Claude Code (Opus 4)
**Fuente:** `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`

---

## BASELINE (antes de cambios)

### Git Status
```
git status --porcelain=v1 → LIMPIO (0 archivos modificados)
git log -1 --oneline → 338b30b docs: make db push non-interactive in Claude prompt
Branch: chore/closure-prep-20260202
```

### Supabase Migration List (30 migraciones local=remoto)
```
20250101000000 | 20260104020000 | 20260104083000 | 20260109060000
20260109070000 | 20260109090000 | 20260110000000 | 20260110100000
20260116000000 | 20260131000000 | 20260131020000 | 20260131034034
20260131034328 | 20260202000000 | 20260202083000 | 20260204100000
20260204110000 | 20260204120000 | 20260206000000 | 20260206010000
20260206020000 | 20260206030000 | 20260206235900 | 20260207000000
20260207010000 | 20260207020000 | 20260207030000 | 20260208000000
20260208010000
```
Todas alineadas local=remoto.

### Edge Functions (13 activas)
| Funcion | Version | verify_jwt |
|---------|---------|------------|
| api-minimarket | v19 | false |
| scraper-maxiconsumo | v11 | true |
| cron-jobs-maxiconsumo | v12 | true |
| cron-notifications | v11 | true |
| api-proveedor | v10 | true |
| reportes-automaticos | v10 | true |
| reposicion-sugerida | v10 | true |
| alertas-vencimientos | v10 | true |
| cron-testing-suite | v10 | true |
| alertas-stock | v10 | true |
| cron-dashboard | v10 | true |
| cron-health-monitor | v10 | true |
| notificaciones-tareas | v10 | true |

### Secrets (13, solo nombres)
```
ALLOWED_ORIGINS, API_PROVEEDOR_SECRET, NOTIFICATIONS_MODE,
SENDGRID_API_KEY, SMTP_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT,
SMTP_USER, SUPABASE_ANON_KEY, SUPABASE_DB_URL,
SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
```

### Tests Baseline (ANTES de cambios)
| Suite | Resultado | Cantidad |
|-------|-----------|----------|
| npm run test:unit | PASS | 737 tests (41 files) |
| npm run test:integration | PASS | 38 tests (3 files) |
| npm run test:e2e | PASS | 4 tests (2 files) |
| pnpm lint | OK | 0 errors, 1 warning |
| pnpm build | OK | 27 entries precached |
| pnpm test:components | PASS | 101 tests (14 files) |

---

## FASE 1 — Hardening P0

### A3) Auth resiliente (cache + timeout + breaker dedicado)

**Archivo principal:** `supabase/functions/api-minimarket/helpers/auth.ts`

**Cambios realizados:**
- Token cache con SHA-256 hash key (30s TTL positivo, 10s negativo para 401)
- AbortController timeout (5s) para `/auth/v1/user`
- Circuit breaker dedicado para auth (3 failures -> open, 15s timeout, 1 success -> close)
- Negative cache: 401 se cachea con TTL corto para evitar flood
- Exports de test: `_clearAuthCache`, `_getAuthCacheSize`, `_resetAuthBreaker`, `_getAuthBreakerStats`

**Tests agregados:**
- `tests/unit/auth-resilient.test.ts` — 16 tests
- Cobertura: cache hit/miss, negative cache 401, timeout, breaker transitions, cache size

**Evidencia:**
```
npx vitest run tests/unit/auth-resilient.test.ts → 16 PASS
```

---

### A1) Rate limit compartido

**Migracion:** `supabase/migrations/20260208020000_add_rate_limit_state.sql`
**Archivo principal:** `supabase/functions/_shared/rate-limit.ts`

**Cambios realizados:**
- Tabla `rate_limit_state` (key TEXT PK, count, window_start, updated_at)
- RPC `sp_check_rate_limit(p_key, p_limit, p_window_seconds)` — UPSERT atomico
- RPC `sp_cleanup_rate_limit_state()` — limpieza de entradas >5min
- Permisos: REVOKE ALL FROM PUBLIC, GRANT solo a service_role
- `buildRateLimitKey(userId?, clientIp?)` en rate-limit.ts
- `checkRateLimitShared()` con RPC + fallback in-memory (sticky 404 detection)
- `_resetRpcAvailability()` para testing
- index.ts actualizado para usar buildRateLimitKey

**Tests agregados:**
- `tests/unit/rate-limit-shared.test.ts` — 14 tests
- Cobertura: key building (6 cases), headers (2 cases), RPC shared (6 cases)

**Evidencia:**
```
npx vitest run tests/unit/rate-limit-shared.test.ts → 14 PASS
```

---

## FASE 2 — Hardening P1

### A2) Circuit breaker semi-persistente

**Migracion:** `supabase/migrations/20260208030000_add_circuit_breaker_state.sql`
**Archivo principal:** `supabase/functions/_shared/circuit-breaker.ts`

**Cambios realizados:**
- Tabla `circuit_breaker_state` (breaker_key PK, state, failure/success counts, opened_at, timestamps)
- RPC `sp_circuit_breaker_record(p_key, p_event, thresholds...)` con row locking + transiciones
- RPC `sp_circuit_breaker_check(p_key)` read-only
- Permisos: service_role only
- `recordCircuitBreakerEvent()` en circuit-breaker.ts — RPC + fallback local
- `_resetCbRpcAvailability()` para testing

**Tests agregados:**
- `tests/unit/circuit-breaker-shared.test.ts` — 9 tests
- Cobertura: transiciones in-memory (4), RPC-backed recording (5)

**Evidencia:**
```
npx vitest run tests/unit/circuit-breaker-shared.test.ts → 9 PASS
```

### A4) Cron/MVs verificacion

**Estado:** VERIFICADO — ya implementado en migraciones previas.

**MVs existentes:**
- `mv_stock_bajo` — productos con stock bajo minimo (migration 20260206235900)
- `mv_productos_proximos_vencer` — productos con vencimiento <=60 dias (migration 20260206235900)

**Refresh RPC:** `fn_refresh_stock_views()` (migration 20260208010000)
- Intenta REFRESH CONCURRENTLY, fallback a refresh normal
- SECURITY DEFINER, solo service_role
- pg_cron schedule condicional: `'7 * * * *'` (cada hora, minuto 7)

**Evidencia:**
- Migration 20260206235900: CREATE MATERIALIZED VIEW IF NOT EXISTS (ambas MVs)
- Migration 20260208010000: fn_refresh_stock_views() + cron.schedule condicional
- Decisions D-071 y D-072 documentadas en DECISION_LOG.md

### A5) Hardening api-proveedor

**Archivo principal:** `supabase/functions/api-proveedor/utils/auth.ts`

**Cambios realizados:**
- Implementada allowlist real de origenes internos (reemplaza TODO)
- Default allowlist: localhost, 127.0.0.1, host.docker.internal
- Extensible via env var `INTERNAL_ORIGINS_ALLOWLIST` (comma-separated)
- Sin Origin header (server-to-server) = permitido
- Origin en allowlist = permitido
- Origin no en allowlist = BLOQUEADO (403 ORIGIN_NOT_ALLOWED)
- index.ts actualizado: bloqueo real (no solo warning)

**Tests agregados:**
- `tests/unit/api-proveedor-auth.test.ts` — 10 tests nuevos (17 total)
- Cobertura: server-to-server (sin origin), localhost, 127.0.0.1, docker internal,
  external blocked, trailing slash, env var allowlist

**Evidencia:**
```
npx vitest run tests/unit/api-proveedor-auth.test.ts → 17 PASS
```

### FASE 2 — Cierre

**Tests completos post-FASE 2:**
```
npx vitest run tests/unit/ → 785 PASS (44 files) [baseline: 737, delta: +48]
pnpm lint → OK (0 errors)
pnpm build → OK (27 entries precached)
```

---

## FASE 3 — UX P1

### B1) Alta producto

**Archivos modificados:**
- `minimarket-system/src/lib/apiClient.ts` — nuevo `CreateProductoParams` + `productosApi.create()`
- `minimarket-system/src/pages/Productos.tsx` — boton "Nuevo producto" + modal con form (nombre, sku, codigo_barras, marca, contenido_neto)

**Cambios realizados:**
- CTA "Nuevo producto" en header de Productos
- Modal con formulario: nombre (obligatorio), sku, codigo_barras, marca, contenido_neto
- React Query mutation con invalidation de cache `['productos']`
- Toast de feedback (success/error)

### B2) Cambio precio

**Archivos modificados:**
- `minimarket-system/src/pages/Productos.tsx` — boton "Actualizar precio" + modal de precio

**Cambios realizados:**
- CTA "Actualizar precio" en panel de detalle del producto
- Modal con campos: precio_compra (obligatorio), margen_ganancia (opcional)
- Usa `preciosApi.aplicar()` existente (POST /precios/aplicar)
- Pre-carga valores actuales del producto seleccionado

### B3) Ajuste stock

**Archivos modificados:**
- `minimarket-system/src/lib/apiClient.ts` — tipo `MovimientoParams.tipo` extendido a `'entrada' | 'salida' | 'ajuste'`
- `minimarket-system/src/pages/Deposito.tsx` — tercer boton AJUSTE + campo motivo obligatorio

**Cambios realizados:**
- Boton AJUSTE (amber) como tercer tipo de movimiento en modo Normal
- Campo "Motivo del ajuste" obligatorio (solo visible para tipo ajuste)
- Oculta proveedor/destino para ajustes
- Validacion: motivo requerido antes de enviar

### B4) Acciones alertas

**Archivos modificados:**
- `minimarket-system/src/components/AlertsDrawer.tsx` — CTA en StockBajoItemRow

**Cambios realizados:**
- Boton "Crear tarea reposicion" en cada item de Stock Bajo
- Handler `handleCreateRepoTask()` crea tarea via `tareasApi.create()`
- Auto-completa titulo, descripcion y prioridad segun nivel de stock
- Prioridad: urgente para sin_stock/critico, normal para bajo

### FASE 3 — Cierre

**Tests completos post-FASE 3:**
```
npx vitest run tests/unit/ → 785 PASS (44 files)
pnpm lint → OK (0 errors)
pnpm build → OK (27 entries precached)
pnpm test:components → 101 PASS (14 files)
```

---

## FASE 4 — Release Readiness

### C2) Smokes read-only
<!-- COMPLETAR -->

### C1) Observabilidad frontend
<!-- COMPLETAR -->

### C3) Rotacion secretos
<!-- COMPLETAR -->

---

## RESUMEN FINAL
<!-- COMPLETAR -->
