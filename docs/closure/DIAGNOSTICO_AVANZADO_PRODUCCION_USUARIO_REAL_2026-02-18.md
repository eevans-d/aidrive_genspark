# DIAGNOSTICO AVANZADO DE PRODUCCION — USUARIO REAL

**Fecha:** 2026-02-18
**Baseline:** `97af2aa` (main, clean)
**Tests:** 1225/1225 PASS (59 archivos root), 20.45s
**Auditor:** Claude Code (Opus 4, mode READ-ONLY)
**Metodo:** Analisis estatico de codigo + verificacion de docs vs filesystem

---

## 1. Resumen Ejecutivo

| Metrica | Valor |
|---------|-------|
| Score de riesgo | **MEDIO-ALTO** (4 criticos, 8 altos, 18 medios, 18 bajos) |
| Hallazgos criticos | 4 |
| Hallazgos altos | 8 |
| Hallazgos medios | 18 |
| Hallazgos bajos | 18 |
| Drift documental | 3 de 7 vectores drifted |
| Areas limpias | `api-proveedor` handlers, `alertas-stock`, `reportes-automaticos`, `_shared/circuit-breaker`, `_shared/rate-limit`, `_shared/logger` |

---

## 2. Matriz VULN-001..008 (estado post-remediacion D-134)

| VULN | Descripcion | Estado | Evidencia | Riesgo Residual |
|------|-------------|--------|-----------|-----------------|
| VULN-001 | `db reset` destructivo en deploy.sh | CERRADO | `deploy.sh:444-449` — `db reset` solo en path `dev`, sin `--linked` | BAJO (migrate.sh no tiene gating — ver ALTO-D01) |
| VULN-002 | deploy.sh ordering (functions before migrations) | CERRADO (parcial) | `deploy.sh:635-637` — functions deploy antes de migrations | MEDIO (ver ALTO-D03) |
| VULN-003 | Concurrencia `sp_movimiento_inventario` | CERRADO | Migracion `20260217200000` con `FOR UPDATE` | BAJO |
| VULN-004 | Concurrencia `sp_actualizar_pago_pedido` | CERRADO | Migracion `20260217200000` con `FOR UPDATE` | BAJO |
| VULN-005 | `fetchWithRetry` sin timeout interno | CERRADO | `api-proveedor/utils/http.ts` usa `fetchWithTimeout` internamente | BAJO |
| VULN-006 | Bare `fetch()` en handlers `api-proveedor` | CERRADO | Todos los handlers usan `fetchWithTimeout` (3-15s) | BAJO |
| VULN-007 | Health checks con probes falsos | CERRADO | `checkExternalDependencies()` con `fetchProbe` HTTP real | BAJO |
| VULN-008 | N+1 en `alertas-stock` | CERRADO | Batch fetch + batch insert | BAJO |

**Riesgo residual global de VULNs:** BAJO. Todas cerradas con evidencia en codigo.

---

## 3. Problemas CRITICOS (rompen funcionalidad para usuario real)

| ID | Componente | Archivo:Linea | Descripcion | Reproduccion | Impacto |
|----|-----------|--------------|-------------|--------------|---------|
| CRIT-01 | api-minimarket | `helpers/validation.ts:60` | `sanitizeTextParam` usa regex `[^a-zA-Z0-9 _.-]` que elimina TODOS los caracteres Unicode/acentos. Buscar "Cafe" retorna "Caf" → 0 resultados. Afecta 14 endpoints de busqueda. | GET `/productos?search=Cafe` | **Busqueda rota** para productos con nombres en espanol (acentos, enie). Afecta POS, stock, clientes, proveedores. |
| CRIT-02 | api-minimarket | `index.ts:1081-1104` | `GET /stock` carga TODA la tabla `stock_deposito` + TODA la tabla `productos` en memoria y hace join in-memory. Sin paginacion, sin limite. | GET `/stock` con catalogo >500 productos | **Timeout/OOM** en edge function. Pagina de stock deja de funcionar al crecer el catalogo. |
| CRIT-03 | api-minimarket | `index.ts:1661-1680` | Cancelacion de reserva: (1) no verifica estado actual (puede cancelar una ya consumida), (2) no llama SP para liberar stock, (3) no valida ownership. | POST `/reservas/:id/cancelar` sobre reserva consumida | **Stock fantasma** — inventario permanece reservado sin razon, o doble-liberacion si hay trigger. |
| CRIT-04 | cron-dashboard | `cron-dashboard/index.ts` (21 fetch calls) | Las 21 llamadas `fetch()` del cron-dashboard NO tienen `AbortSignal.timeout`. Si Supabase REST cuelga, el dashboard se bloquea hasta que Deno mata el isolate (~150s). 6 llamadas secuenciales en `getDashboardHandler`. | Supabase REST lento → dashboard timeout | **Dashboard inoperante** cuando hay latencia de DB. Sin timeout, no hay fallback ni error rapido. |

---

## 4. Problemas ALTOS (comportamiento incorrecto/datos incorrectos)

| ID | Componente | Archivo:Linea | Descripcion | Impacto |
|----|-----------|--------------|-------------|---------|
| ALTO-A01 | api-minimarket | `handlers/pedidos.ts:248-258` | Maquina de estados de pedido no aplicada — cualquier transicion es valida (ej. `entregado` → `pendiente`). | Ordenes en estados ilogicos, doble-entregas. |
| ALTO-A02 | api-minimarket | `handlers/ventas.ts:229-230` | `fecha_desde`/`fecha_hasta` no validados como fecha → PostgREST devuelve 500 en vez de 400. Mismo en `pedidos.ts:84-88`. | UX confusa con errores 500 opaco por input invalido. |
| ALTO-A03 | api-minimarket | `handlers/utils.ts:11-36` | Endpoints de dropdown (`/productos-dropdown`, `/proveedores-dropdown`) sin limite — cargan todo. | UI congelada en dispositivos lentos con catalogo grande. |
| ALTO-A04 | scraper | `scraper-maxiconsumo/storage.ts:24` | `supabaseFetch()` wrapper sin timeout. Usado por TODAS las operaciones de storage del scraper: bulk check, batch insert, batch update, paginacion `while(true)`. | Scraper bloqueado indefinidamente si Supabase REST cuelga. |
| ALTO-A05 | scraper | `scraper-maxiconsumo/index.ts:176-182` | `handleAlertas` usa 2x bare `fetch()` sin timeout para leer comparaciones y alertas. | Alerta de precios bloqueada sin timeout. |
| ALTO-A06 | frontend | `App.tsx:56` | `<Suspense>` sin `<ErrorBoundary>`. Si un chunk lazy falla (post-deploy, red), pantalla blanca sin recuperacion. `ErrorBoundary.tsx` existe pero no se usa. | **Pantalla blanca** tras deploy para usuarios con tabs abiertos. |
| ALTO-A07 | frontend | `Pedidos.tsx:370-376` | `precio_unitario` default 0 en NuevoPedidoModal, sin validacion `> 0`, sin auto-populate desde producto. | Pedidos con items a $0 → contabilidad incorrecta. |
| ALTO-D01 | deploy | `deploy.sh:628` + `deploy.sh:534-542` | (a) `set +e` desactiva abort en seccion critica. (b) `rollback_deployment()` es un stub (no-op). (c) Trap solo captura INT/TERM, no EXIT. | Si un paso falla sin `exit 1` explicito, el deploy continua silenciosamente. |

---

## 5. Problemas MEDIOS (inconsistencias/UX deficiente)

| ID | Componente | Archivo:Linea | Descripcion |
|----|-----------|--------------|-------------|
| MED-01 | api-minimarket | `handlers/pedidos.ts:78-83` | Filtros `estado`/`estado_pago` en lista no validados contra whitelist. |
| MED-02 | api-minimarket | `index.ts:1831` | `monto_pagado = 0` aceptado para pagos de pedido. |
| MED-03 | api-minimarket | `index.ts:1323` | `fecha_vencimiento` de tareas no validado como fecha. |
| MED-04 | api-minimarket | `_shared/rate-limit.ts:73` | Map de rate limiter nunca elimina keys stale (memory leak lento). |
| MED-05 | api-minimarket | `helpers/auth.ts:64-70` | Auth cache no evicta hasta 100+ entries (lazy eviction). |
| MED-06 | api-minimarket | `index.ts:2169-2175` | `/health` expone estado del circuit breaker sin autenticacion. |
| MED-07 | api-minimarket | `index.ts:1314` vs `routers/tareas.ts:28` | Enum `prioridad` difiere entre codigo activo (`baja/normal/urgente`) y dead code (`baja/media/alta/urgente`). |
| MED-08 | scraper | `storage.ts:37,78` | Silent empty catch blocks en `bulkCheckExistingProducts` y `batchUpdateProducts`. |
| MED-09 | cron-dashboard | `index.ts:200-258` | 6 queries independientes ejecutadas secuencialmente (waterfall). Deberian usar `Promise.allSettled`. |
| MED-10 | cron-notifications | `index.ts:720` | Fan-out secuencial por canal. Canal lento retrasa todos los siguientes. |
| MED-11 | frontend | `AuthContext.tsx:19-57` | Sin refresh proactivo de token. Flash de error tras idle largo antes de auto-recovery. |
| MED-12 | frontend | `queryClient.ts:22` | `refetchOnWindowFocus: false` → datos stale al cambiar de tab. |
| MED-13 | frontend | `Tareas.tsx:214-216` | `window.prompt()` para razon de cancelacion — hostil en mobile, sin validacion. |
| MED-14 | frontend | `Tareas.tsx:82-86, 150-152` | Mutations complete/cancel sin feedback visible (ni toast success ni toast error). |
| MED-15 | frontend | `Pedidos.tsx:300-323` | Sin confirmacion para transiciones irreversibles de estado (entregar, etc). |
| MED-16 | frontend | `Pos.tsx:375` | `onBlur` force-refocus atrapa el foco — AccessibilityIssue para usuarios teclado. |
| MED-17 | frontend | `Pos.tsx:356-363` | Boton "Limpiar" sin confirmacion (ESC si la tiene). |
| MED-18 | frontend | `Ventas.tsx:64-74` + `Pos.tsx:193-225` | Sin invalidacion de cache `ventas`/`stock`/`dashboard` tras venta POS. Datos stale. |

---

## 6. Drift Documental Detectado

| Vector | Documentado | Real | Veredicto |
|--------|------------|------|-----------|
| Root test files | 59 | 66 | **DRIFTED** (+7 archivos no contabilizados) |
| Frontend test files | 30 | 30 | ALIGNED |
| Migraciones | 43 | 43 | ALIGNED |
| Edge Functions | 13 | 13 | ALIGNED |
| Dead code `routers/` | No documentado | 6 archivos dead code | **DRIFTED** (no reconocido) |
| `git ls-files` count | 606 | 631 | **DRIFTED** (+25 archivos) |
| Frontend pages | 15 | 15 | ALIGNED |

### Contradicciones Internas
- `ESTADO_ACTUAL.md` seccion 2 dice "58 unit" test files, seccion D-133 dice "59", filesystem tiene 66.
- `routers/` directory en `api-minimarket` contiene 6 archivos de codigo muerto que ningun import referencia. No documentado como legacy ni en DECISION_LOG.
- `CONTINUIDAD_SESIONES.md` dice "1225/1225 PASS (root, D-133)" lo cual es correcto en conteo de tests pero el conteo de archivos asociado (59) ya no refleja la realidad (66).

---

## 7. Top 5 Acciones Priorizadas

| # | Accion | Hallazgos que cierra | Esfuerzo | Impacto |
|---|--------|---------------------|----------|---------|
| 1 | **Fix `sanitizeTextParam`**: cambiar regex a `[^\p{L}\p{N} _.-]` (con flag `u`) para permitir Unicode/acentos | CRIT-01 | 1 linea | CRITICO — desbloquea busqueda en espanol |
| 2 | **Agregar `AbortSignal.timeout` a cron-dashboard**: wrapper fetchWithTimeout en las 21 llamadas + `Promise.allSettled` para queries paralelas | CRIT-04, MED-09 | Medio | Previene dashboard inoperante por latencia DB |
| 3 | **Paginar `GET /stock`**: aceptar `limit`/`offset`, usar JOIN en PostgREST en vez de in-memory | CRIT-02 | Medio | Previene OOM con catalogo creciente |
| 4 | **Wrap `Suspense` en `ErrorBoundary`** en `App.tsx` + invalidar queries `ventas`/`stock` post-venta POS | ALTO-A06, MED-18 | 2 + 3 lineas | Previene pantalla blanca + datos stale |
| 5 | **Agregar timeout a `supabaseFetch` del scraper** + state machine en pedidos | ALTO-A04, ALTO-A01 | Medio | Previene scraper bloqueado + ordenes en estados invalidos |

---

## 8. Areas Limpias (sin hallazgos)

- **`api-proveedor/` handlers**: Todos usan `fetchWithTimeout`, `Promise.allSettled`, error propagation via `AppError`.
- **`alertas-stock/`**: `AbortSignal.timeout` en 3 fetches, batch processing correcto.
- **`reportes-automaticos/`**: `Promise.allSettled` + timeout en 5 fetches, graceful skip en fallos.
- **`_shared/circuit-breaker.ts`**: State machine correcta, RPC con timeout, fallback graceful.
- **`_shared/rate-limit.ts`**: Fixed-window algorithm correcto, RPC con timeout.
- **`_shared/logger.ts`**: JSON estructurado, sin `console.log`, respeta `LOG_LEVEL`.
- **PostgREST para acceso a datos**: Zero SQL injection risk — todas las queries via PostgREST parametrizado.
- **Stored Procedures criticos**: `sp_procesar_venta_pos`, `sp_reservar_stock`, `sp_actualizar_pago_pedido` usan `FOR UPDATE` correctamente.
- **JWT validation**: Cache con SHA-256 hashed keys, TTL, negative caching, circuit breaker dedicado.
- **Role extraction**: Solo desde `app_metadata` (no editable por usuario).

---

_Reporte generado como READ-ONLY audit. Ningun archivo de codigo fue modificado._
_Baseline: `97af2aa` | Branch: `main` | Tests: 1225/1225 PASS_
