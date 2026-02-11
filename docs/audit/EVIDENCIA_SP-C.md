# EVIDENCIA SP-C — Análisis de Detalles

> Fecha: 2026-02-10
> Commit: `3b1a8b0`
> Ejecutor: Claude Code (Opus 4)
> Duración: ~25 min (4 agentes en paralelo)

---

## C1 — MANEJO DE ERRORES Y FEEDBACK

### 1. BACKEND — Stack de Errores

#### 1.1 `_shared/errors.ts` (227 líneas)

**Clases:**
- `AppError(message, code, status, details)` — clase base (extends Error)
- `HttpError(message, status, code, details)` — subclase para HTTP

**Conversores:**
- `fromFetchResponse(response)` — convierte Response PostgREST a AppError, parsea JSON body
- `fromFetchError(error)` — convierte TypeError (network) a AppError con code `NETWORK_ERROR`, status 503
- `toAppError(error)` — wrapper genérico para cualquier unknown error

**Mapeo SQLSTATE exhaustivo (`mapPostgrestCode`):**
| Clase SQL | Código semántico |
|-----------|-----------------|
| 08xxx | CONNECTION_ERROR |
| 22xxx | DATA_EXCEPTION (5 sub-códigos) |
| 23xxx | CONSTRAINT_VIOLATION (4 sub-códigos: DUPLICATE_KEY, FK, NOT_NULL, CHECK) |
| 28xxx | AUTH_ERROR |
| 40xxx | TRANSACTION_ROLLBACK (SERIALIZATION_FAILURE, DEADLOCK) |
| 42xxx | QUERY_ERROR (PERMISSION_DENIED, SYNTAX_ERROR, etc.) |
| 53xxx | INSUFFICIENT_RESOURCES |
| 54xxx | LIMIT_EXCEEDED |
| P0xxx | PLPGSQL_ERROR / RAISE_EXCEPTION |
| PGRSTxxx | 19 códigos PostgREST mapeados |

**`getErrorStatus(error)`**: Infiere HTTP status desde mensaje de texto (legacy). Soporta español: "no autorizado"→401, "acceso denegado"→403, "no encontrad"→404, "ya existe"→409.

**Veredicto:** Robusto y bien diseñado. Buena cobertura de SQLSTATE y PGRST.

#### 1.2 `_shared/response.ts` (196 líneas)

- `ok<T>(data, status, headers, options)` → `{success: true, data, message?, requestId?}`
- `fail(code, message, status, ...)` → `{success: false, error: {code, message, details?}}`
- `failWithDetails` — deprecated, delega a `fail`
- Contrato JSON consistente con `requestId` para correlación

**Adopción:**
| Función | Usa response.ts |
|---------|----------------|
| api-minimarket | SÍ |
| api-proveedor | SÍ |
| alertas-stock | SÍ |
| alertas-vencimientos | SÍ |
| notificaciones-tareas | SÍ |
| reportes-automaticos | SÍ |
| reposicion-sugerida | SÍ |
| scraper-maxiconsumo | NO |
| cron-jobs-maxiconsumo | NO |
| cron-notifications | NO |
| cron-dashboard | NO |
| cron-health-monitor | NO |
| cron-testing-suite | NO |

**7/13 adopción. 6 funciones (cron/NO-PROD) sin response estandarizado.**

#### 1.3 `api-minimarket/helpers/auth.ts` (344 líneas)

**Mecanismos de resiliencia:**
- Cache in-memory (TTL 30s) con SHA-256 hash del token como key
- Negative cache para 401 (TTL 10s) — evita loops
- Circuit breaker dedicado: 3 failures → open 15s, half-open 1 success → closed
- AbortController timeout 5s

**Mensajes de error en español:**
| Situación | Mensaje | Código | Status |
|-----------|---------|--------|--------|
| Token inválido | "Token inválido o expirado" | UNAUTHORIZED | 401 |
| Sin autenticación | "No autorizado - requiere autenticación" | UNAUTHORIZED | 401 |
| Sin rol | "Acceso denegado - requiere rol: X" | FORBIDDEN | 403 |
| Breaker open | "Auth service temporarily unavailable (breaker open)" | AUTH_BREAKER_OPEN | 503 |
| Timeout | "Auth service timeout" | AUTH_TIMEOUT | 503 |
| Network error | "Auth service unreachable" | AUTH_ERROR | 503 |

**Nota:** Los mensajes de breaker/timeout están en inglés (inconsistencia idiomática).

### 2. FRONTEND — Stack de Errores

#### 2.1 `lib/apiClient.ts` — Capa de Transporte

**Clases de error:**
- `ApiError(code, message, status, details, requestId)` — error de API
- `TimeoutError(timeoutMs, endpoint, requestId)` — timeout (Spanish: "La solicitud a X excedió el tiempo límite")

**Flujo:**
1. `getAuthToken()` → obtiene JWT via `supabase.auth.getSession()`
2. Si no hay token → `ApiError('AUTH_REQUIRED', 'Authentication required', 401)` (en inglés)
3. Agrega `x-request-id` (UUID) a headers
4. Timeout configurable (default 30s) via AbortController
5. Parsea response JSON, verifica `success` field
6. Propaga `ApiError` con `requestId` del servidor

**GAP:** No hay interceptor para 401. Si el backend devuelve 401, el error se propaga como `ApiError` genérico — no hay redirect automático a login ni refresh de token.

#### 2.2 `components/errorMessageUtils.ts` — Traducción

- `detectErrorType(error)` → 'network' | 'server' | 'generic'
- `parseErrorMessage(error, isProd)`:
  - En PROD: traduce a mensajes amigables en español
  - network/fetch → "No se pudo conectar con el servidor. Verifica tu conexión."
  - 401/unauthorized → "Sesión expirada. Por favor, vuelve a iniciar sesión."
  - 403 → "No tienes permisos para realizar esta acción."
  - 500/server → "Error del servidor. Intenta de nuevo más tarde."
  - Fallback: "Ocurrió un error inesperado."
  - En DEV: muestra `error.message` tal cual

**Solo se usa cuando la página utiliza `<ErrorMessage>`.** Las páginas con `toast.error()` NO pasan por `parseErrorMessage`.

#### 2.3 `components/ErrorMessage.tsx` — Componente Visual

- Iconos por tipo: WifiOff (network), ServerOff (server), AlertCircle (generic)
- Botón "Reintentar" con estado isRetrying y animación spin
- Soporte `requestId` visual (Ref: `<code>`)
- Textos en español ("Reintentar", "Reintentando...")
- 3 tamaños: sm, md, lg

### 3. TABLA C1 — ESCENARIOS DE ERROR END-TO-END

| # | Escenario | Backend | Frontend (apiClient) | UI (Página) | Mensaje operador | Veredicto | Evidencia |
|---|-----------|---------|---------------------|-------------|-----------------|-----------|-----------|
| 1 | JWT expirado/inválido | auth.ts → 401 "Token inválido o expirado" | ApiError(UNAUTHORIZED, msg, 401) | ErrorMessage: "Sesión expirada" (7pp); toast.error genérico (4pp); console.error (1pp Pedidos) | Varía por página | **PARCIAL** | `supabase/functions/api-minimarket/helpers/auth.ts`, `minimarket-system/src/components/errorMessageUtils.ts` |
| 2 | Sin sesión (no logueado) | N/A (no llega al backend) | Throws ApiError('AUTH_REQUIRED', 'Authentication required', 401) | Depende de página: no hay interceptor global | Solo en dev; en prod: "Ocurrió un error" | **MAL** | `minimarket-system/src/lib/apiClient.ts` |
| 3 | Sin rol requerido (403) | auth.ts → "Acceso denegado - requiere rol: X" (403) | ApiError(FORBIDDEN, msg, 403) | ErrorMessage: "No tienes permisos" (7pp); toast con msg técnico (4pp) | 7/13 OK, 4/13 técnico | **PARCIAL** | `supabase/functions/api-minimarket/helpers/auth.ts`, `minimarket-system/src/components/errorMessageUtils.ts` |
| 4 | Network error (sin red) | N/A | TypeError → no capturado como TimeoutError | ErrorMessage: "No se pudo conectar" (7pp); toast genérico (4pp) | Parcial | **PARCIAL** | `minimarket-system/src/lib/apiClient.ts`, `minimarket-system/src/components/errorMessageUtils.ts` |
| 5 | Timeout (>30s) | N/A | TimeoutError: "La solicitud a X excedió el tiempo límite (30s)" | ErrorMessage/toast con msg | En español, accionable | **OK** | `minimarket-system/src/lib/apiClient.ts` |
| 6 | Server error (500) | errors.ts → AppError con SQLSTATE mapping → response.ts fail() | ApiError con code/message | ErrorMessage: "Error del servidor" (7pp) | Accionable donde hay ErrorMessage | **PARCIAL** | `supabase/functions/_shared/errors.ts`, `supabase/functions/_shared/response.ts` |
| 7 | Duplicate key (23505) | errors.ts → DUPLICATE_KEY, 409 | ApiError con message del backend | toast/ErrorMessage con msg | Backend msg pasa; no traducido a español amigable | **PARCIAL** | `supabase/functions/_shared/errors.ts` |
| 8 | FK violation (23503) | errors.ts → FOREIGN_KEY_VIOLATION, 409 | ApiError | toast/ErrorMessage | Técnico para operador | **MAL** | `supabase/functions/_shared/errors.ts` |
| 9 | Validación (campo requerido) | Handler retorna fail('VALIDATION_ERROR', msg, 400) | ApiError con msg | toast.error(msg) en Pos/Deposito/Clientes | Depende del handler | **OK** (donde implementado) | `supabase/functions/api-minimarket/helpers/validation.ts`, páginas con mutaciones |
| 10 | RLS/Permission denied (42501) | errors.ts → PERMISSION_DENIED, status original | ApiError | ErrorMessage/toast | Técnico | **MAL** | `supabase/functions/_shared/errors.ts` |
| 11 | Auth breaker open (503) | auth.ts → "Auth service temporarily unavailable" | ApiError(AUTH_BREAKER_OPEN, msg, 503) | ErrorMessage: "Error del servidor" | No menciona temporalidad | **PARCIAL** | `supabase/functions/api-minimarket/helpers/auth.ts` |
| 12 | Pedidos.tsx mutación falla | Backend retorna error normalmente | ApiError propagado | `console.error()` SOLAMENTE — operador ve NADA | **Sin feedback visual** | **MAL** (P0) | `minimarket-system/src/pages/Pedidos.tsx` |
| 13 | Rate limited (429) | response.ts fail('RATE_LIMITED', msg, 429) | ApiError(RATE_LIMITED, msg, 429) | ErrorMessage genérico | No dice "espere" ni cuánto | **PARCIAL** | `supabase/functions/_shared/response.ts`, `minimarket-system/src/components/errorMessageUtils.ts` |
| 14 | Circuit breaker DB (503) | api-minimarket returns 503 | ApiError | ErrorMessage: "Error del servidor" | Genérico, no dice "temporal" | **PARCIAL** | `supabase/functions/_shared/circuit-breaker.ts`, `supabase/functions/api-minimarket/index.ts` |

### 4. RESUMEN C1

**Patrones de error por página:**

| Página | ErrorMessage | toast.error | console.error | Veredicto |
|--------|-------------|-------------|--------------|-----------|
| Dashboard | SÍ (parseErrorMessage + retry) | NO | NO | **OK** |
| Tareas | SÍ (parseErrorMessage + retry) | NO | NO | **OK** |
| Stock | SÍ (parseErrorMessage + retry) | NO | NO | **OK** |
| Productos | SÍ (parseErrorMessage + retry) | SÍ (mutations) | NO | **OK** |
| Kardex | SÍ (parseErrorMessage + retry) | NO | NO | **OK** |
| Rentabilidad | SÍ (parseErrorMessage + retry) | NO | NO | **OK** |
| Proveedores | SÍ (parseErrorMessage + retry) | NO | NO | **OK** |
| Pos | NO | SÍ (detallado, en español) | NO | **PARCIAL** |
| Pocket | NO | SÍ (detallado) | NO | **PARCIAL** |
| Deposito | NO | SÍ (ApiError.message) | NO | **PARCIAL** |
| Clientes | NO | SÍ (msg técnico) | NO | **PARCIAL** |
| Pedidos | Inline div (queries) | NO | SÍ (mutations) | **MAL** |
| Login | Inline div | NO | NO | **PARCIAL** |

**Hallazgos críticos C1:**

1. **P0:** Pedidos.tsx — 3 mutations (crear, actualizar estado, toggle item) solo hacen `console.error()`. El operador no recibe feedback visual de errores.
2. **P0:** No hay interceptor 401 global. Si el token expira mid-session, cada página maneja el error individualmente (o no lo maneja).
3. **P1:** `apiClient.ts` no traduce errores del backend a español. Los mensajes del backend llegan en crudo a las páginas con `toast.error()`.
4. **P1:** Los mensajes de auth breaker/timeout del backend están en inglés, inconsistente con el resto en español.
5. **P1:** Errores de constraint DB (FK, duplicados, RLS) no se traducen a mensajes accionables para el operador.

---

## C2 — CONSISTENCIA DE DATOS

### 1. TIPOS EN `database.ts` vs ENTIDADES REALES

**`minimarket-system/src/types/database.ts`** define 11 interfaces:

| # | Interface | Campos clave | Usado por hooks |
|---|-----------|-------------|-----------------|
| 1 | Proveedor | id, nombre, contacto, email, activo | useProveedores |
| 2 | Producto | id, nombre, categoria, codigo_barras, precio_actual, precio_costo, margen_ganancia | useProductos |
| 3 | PrecioHistorico | id, producto_id, precio, fuente, cambio_porcentaje | useProductos (inline) |
| 4 | StockDeposito | id, producto_id, cantidad_actual, stock_minimo, stock_maximo?, ubicacion, lote, fecha_vencimiento | useStock |
| 5 | StockReservado | id, producto_id, cantidad, estado ('activa'|'cancelada'|'aplicada') | — |
| 6 | OrdenCompra | id, producto_id, proveedor_id, cantidad, estado | — |
| 7 | MovimientoDeposito | id, producto_id, tipo_movimiento ('entrada'|'salida'|'ajuste'), cantidad | useDeposito, useKardex |
| 8 | ProductoFaltante | id, producto_id, producto_nombre, resuelto | — |
| 9 | TareaPendiente | id, titulo, descripcion, prioridad, estado, asignada_a_nombre | useTareas |
| 10 | NotificacionTarea | id, tarea_id, tipo, mensaje, leido | — |
| 11 | Personal | id, nombre, email, rol, departamento, activo | — |

### 2. ENTIDADES FALTANTES EN `database.ts`

| Entidad | En DB (migrations) | En apiClient.ts | En database.ts | Status |
|---------|-------------------|-----------------|---------------|--------|
| ventas | SÍ (tablas ventas, ventas_items) | SÍ (VentaItemInput, CreateVentaParams, VentaResponse inline) | **NO** | **DRIFT** |
| pedidos | SÍ (tablas pedidos, pedidos_items) | SÍ (PedidoResponse, PedidoItem, CreatePedidoParams inline) | **NO** | **DRIFT** |
| clientes | SÍ (tabla clientes) | SÍ (ClienteSaldoItem inline) | **NO** | **DRIFT** |
| cuentas_corrientes | SÍ (tabla cuentas_corrientes) | SÍ (CuentaCorrienteResumen inline) | **NO** | **DRIFT** |
| bitacora | SÍ (tabla bitacora_ventas) | SÍ (BitacoraItem inline) | **NO** | **DRIFT** |

**5 entidades críticas** tienen tipos definidos inline en `apiClient.ts` pero NO en el archivo central `database.ts`. Esto causa:
- Duplicación de definiciones de tipo
- Riesgo de divergencia si las columnas DB cambian
- Imposibilidad de compartir tipos entre hooks que leen de supabase directo vs apiClient

**Nota de precisión:** el único tipo funcionalmente ausente en ambos lados (sin contrato explícito en `database.ts` ni en `apiClient.ts`) es **Categorías** como entidad dedicada.

### 3. DATA ACCESS PATTERN — DUAL PATH

| Hook | Lee de | Bypass gateway | Tipo fuente |
|------|--------|---------------|-------------|
| useProveedores | supabase directo (PostgREST) | SÍ | database.ts: Proveedor |
| useProductos | supabase directo | SÍ | database.ts: Producto |
| useStock | supabase directo | SÍ | database.ts: StockDeposito |
| useKardex | supabase directo | SÍ | database.ts: MovimientoDeposito |
| useDashboardStats | supabase directo | SÍ | database.ts: varios + inline |
| useTareas | supabase directo | SÍ | database.ts: TareaPendiente |
| useRentabilidad | supabase directo | SÍ | Inline: ProductoRentabilidad |
| useDeposito | supabase directo | SÍ | database.ts: MovimientoDeposito |
| **usePedidos** | **apiClient (gateway)** | **NO** | **apiClient inline types** |

**8/9 hooks** leen de supabase directo (PostgREST), bypaseando completamente el gateway `api-minimarket`. Solo `usePedidos` usa el gateway.

**Implicaciones:**
- Los hooks PostgREST bypasean rate-limit, circuit-breaker, audit logging del gateway
- Las queries PostgREST usan `select('*')` o selects parciales — no pasan por validación del gateway
- Si se cambia un endpoint del gateway, los hooks PostgREST no se ven afectados (y viceversa)
- RLS del usuario se aplica directamente (positivo para seguridad)

### 4. TABLA C2 — STATUS DE CONSISTENCIA POR ENTIDAD

| Entidad | database.ts | apiClient.ts | Migración/SQL | Handler/Hook | Status | Evidencia |
|---------|-------------|-------------|--------------|-------------|--------|-----------|
| productos | Producto ✓ | CreateProductoParams (inline) | 20260131_initial ✓ | useProductos (supabase), productosApi (gateway) | **ALINEADO** | database.ts:13, apiClient.ts:183 |
| proveedores | Proveedor ✓ | DropdownItem (parcial) | 20260131_initial ✓ | useProveedores (supabase), proveedoresApi (gateway) | **ALINEADO** | database.ts:1, apiClient.ts:213 |
| stock | StockDeposito ✓ | — (no en apiClient) | 20260131_initial ✓ | useStock (supabase-only) | **ALINEADO** | database.ts:37 |
| kardex/movimientos | MovimientoDeposito ✓ | MovimientoResponse (inline) | 20260131_initial ✓ | useKardex (supabase), depositoApi (gateway) | **ALINEADO** | database.ts:74 |
| tareas | TareaPendiente ✓ | TareaResponse (inline) | 20260131_initial ✓ | useTareas (supabase), tareasApi (gateway) | **ALINEADO** | database.ts:104 |
| **ventas** | **FALTA** | VentaItemInput, CreateVentaParams, VentaResponse (inline) | 20260131_initial ✓ | ventasApi (gateway-only) | **DRIFT** | apiClient.ts inline |
| **pedidos** | **FALTA** | PedidoResponse, PedidoItem, CreatePedidoParams (inline) | multiple migrations ✓ | usePedidos (gateway) | **DRIFT** | apiClient.ts inline |
| **clientes** | **FALTA** | ClienteSaldoItem (inline) | 20260131_initial ✓ | clientesApi (gateway) | **DRIFT** | apiClient.ts inline |
| **cuentas_corrientes** | **FALTA** | CuentaCorrienteResumen (inline) | 20260131_initial ✓ | Dashboard/Clientes (gateway) | **DRIFT** | apiClient.ts inline |
| **bitacora** | **FALTA** | BitacoraItem (inline) | 20260209 ✓ | bitacoraApi (gateway) | **DRIFT** | apiClient.ts inline |
| rentabilidad | **FALTA** (inline en hook) | — (no en apiClient) | view/query | useRentabilidad (supabase, inline ProductoRentabilidad) | **DRIFT** | useRentabilidad.ts:9 |
| personal | Personal ✓ | — (no en apiClient) | 20260131_initial ✓ | — (sin hook dedicado) | **ALINEADO** (sin uso) | database.ts:139 |

### 5. HALLAZGOS CRÍTICOS C2

1. **DRIFT MAYOR:** 5 entidades críticas (ventas, pedidos, clientes, cuentas_corrientes, bitacora) tienen tipos solo en apiClient.ts, no en database.ts. Esto viola el principio de single source of truth para tipos.
2. **DUAL-PATH DATA ACCESS:** 8/9 hooks bypasean el gateway (PostgREST directo). Solo usePedidos usa el gateway. Esto crea dos fuentes de verdad para el mismo dato.
3. **Inline types en hooks:** useRentabilidad define `ProductoRentabilidad` inline, no en database.ts ni apiClient.ts.
4. **Tipo `Personal`** definido en database.ts pero sin hook ni uso visible en el frontend.
5. **`StockReservado`, `OrdenCompra`, `ProductoFaltante`** definidos en database.ts pero sin hook ni uso visible.

---

## C3 — UX PARA USUARIO NO TÉCNICO

### 1. IDIOMA (ESPAÑOL)

| Página | Textos en español | Labels | Errores | Placeholders | Veredicto |
|--------|-------------------|--------|---------|-------------|-----------|
| Dashboard | SÍ | SÍ | SÍ (parseErrorMessage) | N/A | **OK** |
| Pos | SÍ | SÍ | SÍ (toast en español) | SÍ | **OK** |
| Pocket | SÍ | SÍ | SÍ (toast) | SÍ | **OK** |
| Pedidos | SÍ | SÍ | **PARCIAL** (errors inline, sin parseErrorMessage) | SÍ | **PARCIAL** |
| Tareas | SÍ | SÍ | SÍ (parseErrorMessage) | SÍ | **OK** |
| Deposito | SÍ | SÍ | SÍ (toast) | SÍ | **OK** |
| Productos | SÍ | SÍ | SÍ (parseErrorMessage + toast) | SÍ | **OK** |
| Kardex | SÍ | SÍ | SÍ (parseErrorMessage) | SÍ | **OK** |
| Stock | SÍ | SÍ | SÍ (parseErrorMessage) | N/A | **OK** |
| Rentabilidad | SÍ | SÍ | SÍ (parseErrorMessage) | N/A | **OK** |
| Proveedores | SÍ | SÍ | SÍ (parseErrorMessage) | N/A | **OK** |
| Clientes | SÍ | SÍ | SÍ (toast) | SÍ | **OK** |
| Login | SÍ | SÍ | SÍ (inline div) | SÍ | **OK** |

**Resultado:** 12/13 OK, 1/13 PARCIAL (Pedidos — errores de mutación sin feedback).
**13/13 páginas** tienen textos, labels y placeholders en español.

### 2. FORMATO MONETARIO ($)

| Página | Método | Locale | Formato | Veredicto |
|--------|--------|--------|---------|-----------|
| Dashboard | `toLocaleString('es-AR', {minimumFractionDigits: 2})` | es-AR | $1.234,56 | **OK** |
| Pos | `toLocaleString('es-AR', {min/maxFractionDigits: 2})` — helper `fmtARS(n)` | es-AR | Correcto | **OK** |
| Pocket | `toLocaleString('es-AR', {minimumFractionDigits: 2})` | es-AR | Correcto | **OK** |
| Kardex | `toLocaleString('es-AR')` — fechas | es-AR | Correcto | **OK** |
| Clientes | `toLocaleString('es-AR', {min/maxFractionDigits: 2})` — helper | es-AR | Correcto | **OK** |
| Tareas | `toLocaleString('es-AR')` — fechas | es-AR | Correcto | **OK** |
| **Pedidos** | `.toLocaleString()` **SIN locale** | **Default (browser)** | **Variable** | **MAL** |
| **Productos** | `.toFixed(2)` | N/A | $1234.56 (sin separador miles) | **MAL** |
| **Proveedores** | `.toFixed(2)` / `.toFixed(1)` | N/A | Sin separador miles | **MAL** |
| **Rentabilidad** | `.toFixed(2)` / `.toFixed(1)` | N/A | Sin separador miles | **MAL** |
| Stock | N/A (cantidades, no moneda) | N/A | N/A | **OK** |
| Deposito | N/A (cantidades) | N/A | N/A | **OK** |
| Login | N/A | N/A | N/A | **OK** |

**Resultado:** 7/10 páginas con moneda usan `toLocaleString('es-AR')` correctamente. 3 usan `toFixed()` (sin separador de miles). 1 usa `toLocaleString()` sin locale.

### 3. NAVEGACIÓN

- **Sidebar** visible en todas las páginas (excepto Pos y Pocket que NO usan Layout)
- **Todas las funciones principales** accesibles en 1 click desde el sidebar
- Pos y Pocket accesibles desde items del sidebar

**Veredicto:** Cumple <=3 clicks. **PASS**.

### 4. ESTADOS DE CARGA Y VACÍO

| Página | Skeleton loading | Empty state | Error state | Veredicto |
|--------|-----------------|-------------|-------------|-----------|
| Dashboard | SÍ (SkeletonCard, SkeletonText, SkeletonList) | SÍ ("No hay tareas pendientes") | SÍ (ErrorMessage) | **OK** |
| Pos | NO (sin skeleton) | SÍ ("Sin resultados") | toast.error | **PARCIAL** |
| Pocket | NO (texto "Cargando...") | SÍ ("Sin datos de arbitraje") | toast.error | **PARCIAL** |
| Pedidos | SÍ (SkeletonTable, SkeletonText) | SÍ ("No hay pedidos para mostrar") | Inline div (queries), console.error (mutations) | **PARCIAL** |
| Tareas | SÍ (SkeletonList, SkeletonText) | SÍ ("No hay tareas pendientes") | SÍ (ErrorMessage) | **OK** |
| Deposito | NO | SÍ ("No se encontraron productos") | toast.error | **PARCIAL** |
| Productos | SÍ (SkeletonTable, SkeletonText) | NO (tabla vacía) | SÍ (ErrorMessage + toast) | **PARCIAL** |
| Kardex | NO (isLoading check pero sin skeleton) | SÍ ("No hay movimientos") | SÍ (ErrorMessage) | **PARCIAL** |
| Stock | SÍ (SkeletonTable, SkeletonText) | SÍ ("No hay productos en esta categoría") | SÍ (ErrorMessage) | **OK** |
| Rentabilidad | NO (isLoading sin skeleton) | SÍ ("No hay productos con estos filtros") | SÍ (ErrorMessage) | **PARCIAL** |
| Proveedores | NO (isLoading=texto) | SÍ ("No hay productos asignados") | SÍ (ErrorMessage) | **PARCIAL** |
| Clientes | NO (isLoading spinner?) | SÍ ("Sin resultados") | toast.error | **PARCIAL** |
| Login | NO | N/A | Inline div | **PARCIAL** |

**Skeleton:** 5/13 (Dashboard, Pedidos, Tareas, Productos, Stock)
**Empty states:** 12/13 (todos excepto Productos que muestra tabla vacía)
**Error states estandarizados (ErrorMessage):** 7/13

### 5. MOBILE / POS-POCKET ERGONOMICS

**Análisis estático (sin runtime):**
- **Pos.tsx:** No usa Layout (sin sidebar), inputs con `autoFocus`, botón COBRAR grande, grilla responsive. Teclado numérico virtual no implementado.
- **Pocket.tsx:** Sin Layout, swipeable cards, botones grandes, formato compacto. Orientado a pantalla completa mobile.
- Ambas páginas usan Tailwind responsive classes, pero no hay `@media` queries explícitas ni breakpoints en componentes.

**Veredicto:** Diseño mobile-aware pero sin optimización dedicada (no hay `viewport meta` checks, no hay touch gesture handling, no hay offline mode).

### 6. RÚBRICA GATE 14

| Gate | Criterio | Resultado | Evidencia |
|------|----------|-----------|-----------|
| G14-a | 100% textos en español | **PASS** (13/13) | Todas las páginas con labels, botones y mensajes en español |
| G14-b | Formato moneda consistente (separadores AR) | **FAIL** (7/10 con moneda OK) | Pedidos sin locale, Productos/Proveedores/Rentabilidad usan toFixed sin separador miles |
| G14-c | Navegación <=3 clicks | **PASS** | Sidebar → 1 click a todas las funciones |
| G14-d | ErrorMessage estandarizado en 100% páginas | **FAIL** (7/13) | Falta en Pedidos, Pos, Pocket, Deposito, Clientes, Login |
| G14-e | Skeleton loading en todas las páginas con queries | **FAIL** (5/13) | 8 páginas sin Skeleton |
| G14-f | Empty states en todas las páginas | **PASS** (12/13) | Solo Productos sin empty state explícito |

**Gate 14 global: FAIL (3/6 criterios pasan)**

### 7. TABLA C3 — CONSOLIDADO POR PÁGINA (SALIDA REQUERIDA)

| Página | Español | Formato $ | Skeleton | Empty state | Mobile | Veredicto | Evidencia |
|--------|---------|-----------|----------|-------------|--------|-----------|-----------|
| Dashboard | SÍ | OK (`es-AR`) | SÍ | SÍ | PARCIAL | **OK** | `minimarket-system/src/pages/Dashboard.tsx` |
| Pos | SÍ | OK (`es-AR`) | NO | SÍ | SÍ | **PARCIAL** | `minimarket-system/src/pages/Pos.tsx` |
| Pocket | SÍ | OK (`es-AR`) | NO (texto cargando) | SÍ | SÍ | **PARCIAL** | `minimarket-system/src/pages/Pocket.tsx` |
| Pedidos | SÍ | **MAL** (`toLocaleString()` sin locale) | SÍ | SÍ | PARCIAL | **PARCIAL** | `minimarket-system/src/pages/Pedidos.tsx` |
| Tareas | SÍ | N/A | SÍ | SÍ | PARCIAL | **OK** | `minimarket-system/src/pages/Tareas.tsx` |
| Deposito | SÍ | N/A | NO | SÍ | PARCIAL | **PARCIAL** | `minimarket-system/src/pages/Deposito.tsx` |
| Productos | SÍ | **MAL** (`toFixed`) | SÍ | NO | PARCIAL | **PARCIAL** | `minimarket-system/src/pages/Productos.tsx` |
| Kardex | SÍ | N/A | NO | SÍ | PARCIAL | **PARCIAL** | `minimarket-system/src/pages/Kardex.tsx` |
| Stock | SÍ | N/A | SÍ | SÍ | PARCIAL | **OK** | `minimarket-system/src/pages/Stock.tsx` |
| Rentabilidad | SÍ | **MAL** (`toFixed`) | NO | SÍ | PARCIAL | **PARCIAL** | `minimarket-system/src/pages/Rentabilidad.tsx` |
| Proveedores | SÍ | **MAL** (`toFixed`) | NO | SÍ | PARCIAL | **PARCIAL** | `minimarket-system/src/pages/Proveedores.tsx` |
| Clientes | SÍ | OK (`es-AR`) | NO | SÍ | PARCIAL | **PARCIAL** | `minimarket-system/src/pages/Clientes.tsx` |
| Login | SÍ | N/A | NO | N/A | PARCIAL | **PARCIAL** | `minimarket-system/src/pages/Login.tsx` |

---

## C4 — DEPENDENCIAS EXTERNAS

### 1. Supabase Free Plan Limits vs Uso Real

#### 1.1 Edge Function Timeout

**Límite Free plan:** 60 segundos por invocación.

| Cron Job | timeout_milliseconds (SQL) | Excede Free 60s? |
|----------|---------------------------|-------------------|
| notificaciones-tareas | 10,000 | NO |
| alertas-stock | 10,000 | NO |
| reportes-automaticos | 10,000 | NO |
| daily_price_update | 300,000 (5 min) | **SÍ — 5x el límite** |
| weekly_trend_analysis | 600,000 (10 min) | **SÍ — 10x el límite** |
| realtime_change_alerts | 120,000 (2 min) | **SÍ — 2x el límite** |
| maintenance_cleanup | 900,000 (15 min) | **SÍ — 15x el límite** |

**Evidencia:** `supabase/cron_jobs/deploy_all_cron_jobs.sql:104,139,176`; `cron-jobs-maxiconsumo/config.ts:15,32,50,69`.

**RIESGO CRÍTICO:** 4 de 7 jobs configurados tienen timeouts que superan el máximo de 60 segundos del Free plan. Estos jobs serán terminados por Supabase antes de completarse.

#### 1.2 Invocaciones Mensuales

| Job | Schedule | Invocaciones/mes |
|-----|----------|-----------------|
| notificaciones-tareas | `0 */2 * * *` | 360 |
| alertas-stock | `0 * * * *` | 720 |
| reportes-automaticos | `0 8 * * *` | 30 |
| daily_price_update | `0 2 * * *` | 30 |
| weekly_trend_analysis | `0 3 * * 0` | 4 |
| realtime_change_alerts | `*/15 * * * *` | 2,880 |
| **Subtotal cron** | | **4,024** |
| API usuario (estimado) | | ~1,500 |
| **TOTAL** | | **~5,524/mes** |

**Contra límite de 500,000/mes → ~1.1%. SEGURO.**

#### 1.3 Database Size

No hay mecanismo de monitoreo del tamaño de la BD. El job `maintenance_cleanup` (config.ts:63-77) incluye `cleanOldLogs: true, daysToKeepLogs: 30` pero con timeout de 900s que no puede ejecutarse en Free plan.

**Límite Free:** 500MB DB, 1GB storage. Riesgo de crecimiento sin poda si maintenance_cleanup nunca completa.

### 2. Scraping Maxiconsumo — Fragilidad y Riesgos

#### 2.1 Mecanismo de Parsing

**Archivo:** `supabase/functions/scraper-maxiconsumo/parsing.ts`

El scraper **NO usa parser DOM** (cheerio, jsdom, etc.). Usa exclusivamente **expresiones regulares** para extraer productos del HTML (3 patrones regex cascading).

**Riesgo:** Los regex asumen estructura HTML específica. Cualquier cambio menor en clases CSS, estructura de tags, o formato de precios de maxiconsumo.com romperá la extracción silenciosamente (devuelve 0 productos sin error).

#### 2.2 Frecuencia de Scraping

- `daily_price_update`: 1x/día — scraping completo 9 categorías
- `realtime_change_alerts`: cada 15 min — verificación cambios
- `weekly_trend_analysis`: 1x/semana — análisis agregado
- **96 requests/día a maxiconsumo.com** solo del `realtime_change_alerts`

#### 2.3 Anti-Detección

**Archivo:** `supabase/functions/scraper-maxiconsumo/anti-detection.ts`

Módulo dedicado con: rotación User-Agents (7 agentes), headers aleatorios (Sec-Ch-Ua, DNT), simulación horario comercial, cookie jar persistente, delays 1.5-6s con jitter, exponential backoff.

#### 2.4 Plan B si el Scraper Falla

**No existe plan B.** Mitigaciones existentes: circuit breaker in-memory (resetea en cold start), cache in-memory 5min, retries con backoff hasta 5 intentos/categoría.

**Lo que NO existe:** datos cacheados en BD como fallback, notificación si falla N veces consecutivas, modo degradado con datos stale.

### 3. Dependencias — Version Gaps

#### 3.1 @supabase/supabase-js

| Ubicación | Versión | Método import |
|-----------|---------|---------------|
| Edge Functions (deno.json) | 2.39.3 (pinned) | esm.sh |
| Edge Functions (import_map.json) | 2.39.3 (pinned) | esm.sh |
| api-minimarket, reposicion-sugerida | jsr:@2 (latest 2.x) | JSR |
| Frontend (package.json) | ^2.78.0 | npm |
| Tests root (package.json) | ^2.95.3 | npm devDep |

**Gap total: ~56 minor versions** entre backend pinned (2.39.3) y frontend (^2.78.0). Además, inconsistencia interna en backend: deno.json pinea 2.39.3 pero api-minimarket usa jsr:@2 que resuelve a latest 2.x.

#### 3.2 Otras Dependencias

| Dependencia | Frontend | Root | Observación |
|-------------|---------|------|-------------|
| React | ^18.3.1 | — | React 19 disponible |
| lucide-react | ^0.364.0 | ^0.562.0 | ~200 minor versions gap |
| TypeScript | ~5.9.3 | — | Actual |
| Vitest | ^4.0.17 | ^4.0.18 | Micro-gap |
| Tailwind | 3.4.16 | — | v4 disponible |

#### 3.3 `npm audit` (resumen)

- Root (`/`): `npm audit --json --omit=dev` -> **0 vulnerabilidades prod**.
- Frontend (`minimarket-system/`): `npm audit --json --omit=dev` -> **1 vulnerabilidad moderada** (transitiva `lodash` 4.17.21, advisory GHSA-xxjr-mmjv-4gpg).
- Impacto observado: dependencia transitiva, fix disponible en la cadena de dependencias.

### 4. Rate-Limit y Circuit-Breaker — Efectividad Real

#### 4.1 Resumen de Efectividad

| Función | Rate Limit | Circuit Breaker | Cross-instance? |
|---------|-----------|----------------|-----------------|
| api-minimarket | RPC + fallback in-memory | RPC + fallback in-memory | **SÍ (único)** |
| api-proveedor | In-memory solo | In-memory solo | NO |
| scraper-maxiconsumo | In-memory solo | In-memory solo | NO |
| cron-notifications | In-memory solo | N/A | NO |
| cron-jobs-maxiconsumo | N/A | In-memory solo | NO |

**Solo api-minimarket** usa las variantes RPC compartidas (`checkRateLimitShared`, `checkCircuitBreakerShared`) que persisten en PostgreSQL vía stored procedures (`sp_check_rate_limit`, `sp_circuit_breaker_record`/`sp_circuit_breaker_check`).

Las otras 3-4 funciones usan `Map` in-memory que:
- Se reinician en cada cold start
- No se comparten entre isolates concurrentes en Deno Deploy
- Son efectivamente inefectivas en producción

**Evidencia:** `rate-limit.ts:73` (in-memory Map), `circuit-breaker.ts:87` (in-memory Map), `api-minimarket/index.ts:247,298` (versiones RPC), migraciones `20260208020000` y `20260208030000` (tablas state).

### 5. Tabla de Riesgos C4

| # | Dependencia | Riesgo | Prob. | Impacto | Mitigación | Acción | Evidencia |
|---|-------------|--------|-------|---------|-----------|--------|-----------|
| 1 | Supabase Free plan timeout (60s) | 4/7 cron jobs con timeout > 60s | **ALTA** | **CRÍTICO** | Ninguna | Upgrade Pro o rediseñar jobs <60s | `deploy_all_cron_jobs.sql:104,139,176` |
| 2 | Supabase invocaciones (500K/mes) | Uso ~5,524/mes = 1.1% | BAJA | BAJO | N/A | Monitorear | Cálculo sección 1.2 |
| 3 | Supabase DB size (500MB) | maintenance_cleanup no ejecutable (timeout 900s > 60s) | MEDIA | ALTO | Job configurado pero inefectivo | Cleanup <60s o pg_cron SQL | `config.ts:63-77` |
| 4 | Scraper fragilidad HTML | Regex parsing, sin DOM parser | **ALTA** | **ALTO** | 3 patrones fallback, retries | Migrar a parser DOM; alerta 0 productos | `parsing.ts:67-71` |
| 5 | Scraper ToS/legal | Anti-detección explícita, 96 req/día | MEDIA | ALTO | Anti-detection, delays | Evaluar API oficial; reducir frecuencia | `anti-detection.ts:77-154` |
| 6 | @supabase/supabase-js gap | ~56 minor versions backend vs frontend | **ALTA** | MEDIO | Ninguna | Unificar versión | `deno.json:3`, `package.json:81` |
| 7 | Rate-limit in-memory (3/4 fn) | Inefectivo en Deno Deploy (cold start/isolates) | **ALTA** | MEDIO | api-minimarket usa RPC | Migrar a checkRateLimitShared | `rate-limit.ts:73` |
| 8 | Circuit-breaker in-memory (3/4 fn) | Estado se pierde en cold start | **ALTA** | MEDIO | api-minimarket usa RPC | Migrar a variantes Shared/RPC | `circuit-breaker.ts:87` |
| 9 | lucide-react gap | ~200 minor versions frontend vs root | BAJA | BAJO | N/A | Alinear en próximo upgrade | `package.json:93,34` |
| 10 | React major gap | 18.3.1, React 19 disponible | BAJA | BAJO | N/A | Planificar migración | `package.json:95` |
| 11 | Scraper sin Plan B (datos stale) | Sin fallback BD si scraper falla | MEDIA | ALTO | Cache in-memory 5min | Tabla scraper_last_result en BD | `scraper/index.ts:131` |
| 12 | Import methods inconsistentes | esm.sh@2.39.3 vs jsr:@2 en mismo deploy | MEDIA | MEDIO | N/A | Estandarizar un solo método | `deno.json:3`, `index.ts:392` |
| 13 | Dependencia transitiva vulnerable (`lodash`) | 1 moderada en frontend (`npm audit`) | BAJA | BAJO | Ninguna específica | Actualizar cadena que trae `lodash` | `minimarket-system` audit JSON |

### 6. Resumen Ejecutivo C4

**Hallazgos críticos:**

1. **Timeout Free plan vs cron jobs (Riesgo #1):** 4 de 7 cron jobs tienen timeouts entre 2 y 15 minutos contra un máximo de 60s del Free plan. El scraper probablemente nunca completa su ejecución.
2. **Fragilidad del scraper (Riesgo #4):** Parsing regex sin DOM parser. Cualquier cambio HTML causa falla silenciosa.
3. **Rate-limit/circuit-breaker parcialmente efectivos (Riesgos #7, #8):** Infraestructura RPC existe pero solo api-minimarket la usa. Las demás funciones tienen implementación in-memory inefectiva.
4. **Version gap @supabase/supabase-js (Riesgo #6):** ~56 minor versions entre backend y frontend con inconsistencia de métodos de importación.

---

## MÉTRICAS AGREGADAS SP-C

| Métrica | Valor |
|---------|-------|
| Escenarios error auditados | 14 |
| Escenarios OK | 2 (14%) |
| Escenarios PARCIAL | 8 (57%) |
| Escenarios MAL | 4 (29%) |
| Páginas con ErrorMessage | 7/13 |
| Páginas con Skeleton | 5/13 |
| Entidades con DRIFT de tipos | 6/12 |
| Hooks que bypasean gateway | 8/9 |
| Gate 14 criterios PASS | 3/6 |
| Formato moneda consistente | 7/10 |
| Riesgos externos CRÍTICO | 2 (timeout Free plan, scraper fragilidad) |
| Riesgos externos ALTO | 4 |
| Riesgos externos MEDIO | 4 |
| Rate-limit/circuit-breaker efectivo (cross-instance) | 1/5 funciones |
| @supabase/supabase-js version gap | ~56 minor versions |

---

## CROSS-REFERENCE HALLAZGOS NUEVOS SP-C

| # | Hallazgo | Sección | Impacto |
|---|---------|---------|---------|
| NEW-C1 | No hay interceptor 401 global en frontend — sin redirect automático a login | C1 | Sesión expirada no se detecta consistentemente |
| NEW-C2 | apiClient.ts no traduce errores backend a español para toast.error() | C1 | 4 páginas muestran mensajes técnicos al operador |
| NEW-C3 | 5 entidades críticas (ventas, pedidos, clientes, CC, bitacora) sin tipos en database.ts | C2 | Tipos duplicados inline en apiClient.ts |
| NEW-C4 | 8/9 hooks bypasean gateway — sin rate-limit, circuit-breaker ni audit en esas queries | C2 | Protecciones del gateway no aplican a la mayoría del tráfico |
| NEW-C5 | Pedidos.tsx usa .toLocaleString() sin locale 'es-AR' (inconsistente con resto) | C3 | Formato monetario variable según browser del operador |
| NEW-C6 | Productos, Proveedores, Rentabilidad usan .toFixed() sin separador de miles | C3 | $1234.56 en vez de $1.234,56 |
| NEW-C7 | 4/7 cron jobs configurados con timeout > 60s del Free plan — probablemente nunca completan | C4 | Scraping y maintenance efectivamente rotos |
| NEW-C8 | maintenance_cleanup (limpieza logs/métricas) no puede ejecutarse — datos crecen sin poda | C4 | Riesgo de alcanzar límite 500MB del Free plan |
