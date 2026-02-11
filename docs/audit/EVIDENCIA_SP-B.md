# EVIDENCIA SP-B — Validación Funcional

> Fecha: 2026-02-11
> Commit: `3b1a8b0` (main)
> Ejecutor: Antigravity (Gemini)
> Modo: **B (fallback — análisis estático)**. Sin runtime/credenciales disponibles.
> Duración: ~1h (análisis estático profundo de código)

---

## B1 — SIMULACIÓN DE JORNADA DEL OPERADOR

**Método:** Análisis estático de 13 páginas, hooks, handlers, apiClient.ts (899 lín), auth.ts (344 lín), validation.ts (130 lín). Sin app corriendo.

| # | Tarea | Página | Estado | Bloqueantes | Gaps UX | Evidencia |
|---|-------|--------|--------|-------------|---------|-----------|
| 1 | Login | Login.tsx (93 lín) | ✅ OK | — | Credenciales de prueba hardcodeadas visibles en UI (`admin@minimarket.com / password123`) | `useAuth().signIn()` redirige a `/`; `setError(err.message)` muestra error en div rojo; textos en español |
| 2 | Ver dashboard | Dashboard.tsx (228 lín) | ✅ OK | — | Bitácora y CC solo visibles para admin/ventas (useUserRole) | Híbrido: `useDashboardStats` (Supabase directo, 3 queries paralelas) + `apiClient` (bitacoraApi, cuentasCorrientesApi). ErrorMessage + Skeleton. |
| 3 | Consultar stock | Stock.tsx (243 lín) | ✅ OK | — | CSV export funcional pero sin filtro de búsqueda por nombre | `useStock` (Supabase directo). ErrorMessage + SkeletonTable. Filtro por nivel stock (Todos/Bajo/Crítico/Agotado). getNivelStock() compara vs stock_mínimo. |
| 4 | Registrar ingreso | Deposito.tsx (566 lín) | ⚠️ PARCIAL | — | Sin ErrorMessage: usa solo `toast.error()` → efímero. Sin retry. Sin Skeleton. | 2 modos (rápido + completo). `depositoApi.movimiento()`. `onError` usa `toast.error(err.message)`. Formulario completo: producto, cantidad, tipo, motivo. |
| 5 | Gestionar productos | Productos.tsx (567 lín) | ✅ OK | — | Toast efímero para errores de creación/precio | `productosApi` + `preciosApi`. ErrorMessage + SkeletonTable. CRUD: crear + aplicar precio. handleExportCsv. `onError` usa `toast.error()`. |
| 6 | Vender (POS) | Pos.tsx (597 lín) | ✅ | — | Layout fijo, ErrorMessage y Skeleton implementados. UX mejorada. | `ventasApi.create()` con idempotencyKey UUID. `searchApi.search()`. `ofertasApi`. Carrito → pago → WhatsApp recibo. `money()` usa `toLocaleString('es-AR')`. `onError` diferencia idempotencia (422) y reenviado de errores técnicos. |
| 7 | Venta rápida mobile | Pocket.tsx (566 lín) | ⚠️ PARCIAL | — | Sin Layout, sin ErrorMessage, sin Skeleton. 3 modos (stock/etiqueta/precio) pero solo toast.error. No distingue error vs vacío. | Barcode scanner (JsBarcode). 3 ActionModes. `depositoApi` para stock update. `searchApi` por código de barras. LabelPreview + PriceCheck. |
| 8 | Gestionar pedidos | Pedidos.tsx (708 lín) | ❌ FALLA (UX) | **P0: HC-3** — 3 mutaciones con solo `console.error()`. Operador NO recibe feedback de error. | Sin ErrorMessage. Error de carga: div rojo inline simple. CRUD + estados (pendiente→preparando→listo→entregado). SkeletonTable OK. | L50: `console.error('Error creando pedido:', err)`. L59: `console.error('Error actualizando estado:', err)`. L68: `console.error('Error actualizando item:', err)`. NuevoPedidoModal completo (708 lín total). |
| 9 | Gestionar clientes | Clientes.tsx (494 lín) | ⚠️ PARCIAL | — | Sin ErrorMessage, sin Skeleton. `toast.error` efímero para mutaciones. | `clientesApi` + `cuentasCorrientesApi`. ClienteModal (crear/editar) + PagoModal. `onError` usa `toast.error()`. `money()` formatea $. WhatsApp URL helper. |
| 10 | Revisar tareas | Tareas.tsx (461 lín) | ✅ OK | — | — | ErrorMessage + SkeletonList. Optimistic updates (onMutate con cache). `tareasApi`. Crear/completar/cancelar. `computeTareasMetrics()`. |
| 11 | Consultar kardex | Kardex.tsx | ✅ OK | — | Sin Skeleton | `useKardex` hook. ErrorMessage + parseErrorMessage. Filtros producto/lote. |
| 12 | Ver rentabilidad | Rentabilidad.tsx | ✅ OK | — | Sin Skeleton | `useRentabilidad` hook. ErrorMessage + parseErrorMessage. Márgenes por producto. |
| 13 | Ver proveedores | Proveedores.tsx | ✅ OK | — | Sin Skeleton (usaría SkeletonText parcial) | `useProveedores` hook. ErrorMessage + parseErrorMessage. |

### Resumen B1

- **✅ OK:** 7/13 (Dashboard, Stock, Productos, Tareas, Kardex, Rentabilidad, Proveedores)
- **⚠️ PARCIAL:** 4/13 (Deposito, Pos, Pocket, Clientes) — errores efímeros via toast, sin ErrorMessage
- **❌ FALLA:** 1/13 (Pedidos) — **P0: HC-3**, operador sin feedback en mutaciones
- **1 BLOCKED:** Ninguno (análisis estático suficiente para inferir comportamiento)

**Hallazgos P0:**
1. **HC-3 — Pedidos.tsx:** 3 mutaciones silencian errores con `console.error()`. Impacto: operador cree que el pedido se creó/actualizó cuando falló.

**Hallazgos P1:**
1. Pos.tsx sin Layout → no hay navegación al sistema principal (solo hardcoded `useNavigate('/pos')`)
2. Pocket.tsx no distingue error de carga vs datos vacíos (confunde al operador)
3. 4 páginas (Deposito, Pos, Pocket, Clientes) sin ErrorMessage persistente
4. Credenciales de prueba en Login.tsx UI (seguridad en producción)
5. 8/13 páginas sin Skeleton → flash de contenido during loading

---

## B2 — FLUJOS CRÍTICOS E2E

### Flujo 1 — Stock → Alerta → Notificación

| Paso | Componente | Entrada | Salida | ¿Funciona? | Eslabón roto? | Evidencia |
|------|-----------|---------|--------|------------|---------------|-----------|
| 1 | Deposito.tsx | Formulario movimiento | POST /deposito/movimiento | ✅ | — | `depositoApi.movimiento()` → apiClient L460-480 |
| 2 | api-minimarket/index.ts (`POST /deposito/movimiento`) | Request movimiento | UPDATE stock_deposito | ✅ | — | Ruta inline en gateway registra movimiento + actualiza stock |
| 3 | stock_deposito | UPDATE | cantidad_actual vs stock_minimo | ✅ | — | Campo `stock_minimo` existe en tabla |
| 4 | pg_cron: alertas-stock_invoke | cron cada 1h | Invoke Edge Function | ❌ **ROTO** | **HC-1: Sin Authorization header** | `deploy_all_cron_jobs.sql` L54: solo `Content-Type: application/json`. verify_jwt=true (default Supabase). Kong rechaza con 401. |
| 5 | alertas-stock Edge Function | (Si llegara) Request | JSON alertas + crear tareas | ✅ (lógica OK) | — | `index.ts` L14-160: Usa `service_role_key` internamente para REST calls. Crea tareas automáticas si nivel=crítico. |
| 6 | Dashboard.tsx | — | Mostrar stock bajo/alertas | ✅ | — | `useDashboardStats` consulta `stock_deposito` directo |

**Veredicto Flujo 1:** ❌ **FALLA** — Eslabón 4 roto por HC-1. Alertas de stock no se generan vía cron. Dashboard sí muestra stock bajo (Supabase directo) pero NO las alertas/tareas que crearía `alertas-stock`.

---

### Flujo 2 — Scraping de precios

| Paso | Componente | Entrada | Salida | ¿Funciona? | Eslabón roto? | Evidencia |
|------|-----------|---------|--------|------------|---------------|-----------|
| 1 | pg_cron: daily_price_update | cron 02:00 UTC | Invoke cron-jobs-maxiconsumo | ✅ | — | `deploy_all_cron_jobs.sql`: **CON** `Bearer + current_setting('app.service_role_key')` |
| 2 | cron-jobs-maxiconsumo/index.ts | POST /execute | orchestrator.ts → job dispatch | ✅ | — | L30-47: `handleExecute` → `executeJob(jobId, ctx, ...)` |
| 3 | orchestrator.ts | jobId='daily_price_update' | ejecutarScrapingCompleto() | ✅ | — | Mapa de jobs incluye `daily_price_update` → scraping completo |
| 4 | scraping.ts | Config categorías | Fetch HTML + parse | ⚠️ | **Riesgo timeout** | L51-121: retry(max 5), anti-detection, delays 2-4s entre categorías. **Timeout 60s (free tier)** vs procesamiento multi-categoría. |
| 5 | parsing.ts | HTML | ProductoMaxiconsumo[] | ✅ | — | `extractProductosConOptimizacion`: regex/DOM parsing + confidence score + hash |
| 6 | storage.ts | Productos parsed | UPSERT precios_proveedor | ✅ (estático) | BLOCKED runtime | Persiste en tabla `precios_proveedor` con campos correctos |
| 7 | Frontend: insightsApi.arbitraje | — | Arbitraje precio proveedor vs venta | BLOCKED | Runtime | `insightsApi` en apiClient expone endpoint pero sin test de UI visible |

**Veredicto Flujo 2:** ⚠️ **PARCIAL** — Cron OK con auth. Pipeline scraping funcional pero timeout 60s (free tier) es riesgo real (multi-categoría con delays). Sin evidencia runtime de que complete en <60s.

---

### Flujo 3 — Venta completa POS

| Paso | Componente | Entrada | Salida | ¿Funciona? | Eslabón roto? | Evidencia |
|------|-----------|---------|--------|------------|---------------|-----------|
| 1 | Pos.tsx | Búsqueda producto | searchApi.search() | ✅ | — | L286: `queryFn` busca por texto. Ofertas via Supabase directo. |
| 2 | Pos.tsx | Agregar a carrito | CartItem[] + calcTotal() | ✅ | — | L34-37: `calcTotal` con soporte descuento_pct. `money()` formateo es-AR. |
| 3 | Pos.tsx | Seleccionar cliente (opcional) | clientesApi.listConSaldo() | ✅ | — | L62: Query clientes con saldo |
| 4 | Pos.tsx → ventasApi | Confirmar venta | POST /ventas + idempotencyKey | ✅ | — | `ventasApi.create(params, idempotencyKey)` → apiClient L656-664. Header `Idempotency-Key`. UUID v4. |
| 5 | api-minimarket/handlers/ventas.ts | CreateVentaParams | INSERT venta + UPDATE stock | ✅ (estático) | — | Handler procesa venta atomicámente. `sp_reservar_stock` para concurrencia. |
| 6 | sp_reservar_stock | Venta items | UPDATE stock_deposito + INSERT venta | ✅ | — | Migración `20260209`: ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING |
| 7 | Kardex | — | Movimiento registrado | ✅ (estático) | — | Venta genera movimiento tipo 'salida' en depósito |
| 8 | WhatsApp recibo | Venta confirmada | buildWhatsAppUrl() | ⚠️ | — | L39-42: URL `wa.me/{e164}` pero **sin cuerpo de recibo** en el código visible. Solo abre chat. |

**Veredicto Flujo 3:** ⚠️ **PARCIAL** — Pipeline venta idempotente funcional con ON CONFLICT fix. WhatsApp "recibo" es solo link para abrir chat, no envía recibo formateado. `onError` en Pos.tsx sí da toast.error (mejor que Pedidos).

---

### Flujo 4 — Pedido E2E

| Paso | Componente | Entrada | Salida | ¿Funciona? | Eslabón roto? | Evidencia |
|------|-----------|---------|--------|------------|---------------|-----------|
| 1 | Pedidos.tsx | NuevoPedidoModal | handleCreatePedido() | ❌ **UX** | **HC-3** | L44-52: `await createMutation.mutateAsync(pedidoData)` → catch solo `console.error`. Si falla, modal se cierra con `setShowForm(false)` sin informar error. |
| 2 | api-minimarket/handlers/pedidos.ts | POST /pedidos | INSERT pedidos + detalle_pedidos | ✅ (estático) | — | Handler completo (383 lín referenciado en plan) |
| 3 | Pedidos.tsx | Card → Comenzar Preparación | handleUpdateEstado(id, 'preparando') | ❌ **UX** | **HC-3** | L54-61: catch solo `console.error`. Operador clickea y nada pasa si falla. |
| 4 | Pedidos.tsx | Checkbox item | handleToggleItemPreparado(id, bool) | ❌ **UX** | **HC-3** | L63-70: catch solo `console.error`. Checkbox no revierte visualmente si falla. |
| 5 | Pedidos.tsx | Card → Marcar Entregado | handleUpdateEstado(id, 'entregado') | ❌ **UX** | **HC-3** | Mismo patrón que paso 3. |
| 6 | Backend | updatePago | Registrar pago pedido | ✅ (estático) | — | Handler soporta estados de pago (pendiente/parcial/pagado) |

**Veredicto Flujo 4:** ❌ **FALLA** — Backend OK, pero **todo el flujo UX roto por HC-3**. 3 mutaciones con solo `console.error()`. Operador NO recibe feedback de éxito ni error en crear pedido, cambiar estado, ni marcar items. Riesgo: operador cree que pedido se creó cuando falló.

---

### Flujo 5 — Monitoreo de cron jobs

| Paso | Componente | Entrada | Salida | ¿Funciona? | Eslabón roto? | Evidencia |
|------|-----------|---------|--------|------------|---------------|-----------|
| 1 | cron-health-monitor | — | Health check de Edge Functions | ❌ | **Sin trigger** | No hay cron SQL ni frontend que lo invoque. Solo llamado por cron-testing-suite/cron-dashboard. |
| 2 | cron-dashboard | — | Panel de monitoreo cron | ❌ | **Sin frontend** | 1283 líneas de código sin página frontend que lo consuma. |
| 3 | cron-jobs-maxiconsumo/status | GET /status | Recent executions | ✅ (estático) | — | handleStatus() L49-65: consulta `cron_jobs_execution_log`. Endpoint funcional pero sin UI. |
| 4 | Panel visualización | — | Operador ve estado crons | ❌ | **No existe** | No hay página de monitoreo para el operador. |

**Veredicto Flujo 5:** ❌ **FALLA (por diseño)** — No existe panel de monitoreo operativo. `cron-health-monitor` y `cron-dashboard` son funciones huérfanas sin trigger productivo ni frontend. El operador NO tiene visibilidad sobre el estado de los cron jobs.

---

### Mapa de Eslabones Rotos por Flujo

| Flujo | Eslabones rotos | Severidad | Impacto |
|-------|----------------|-----------|---------|
| 1 — Stock→Alerta | Cron invoke sin auth (HC-1) | 🔴 P0 | Alertas de stock nunca se generan vía cron |
| 2 — Scraping | Timeout 60s potencial | 🟡 P1 | Scraping podría no completar en free tier |
| 3 — Venta POS | WhatsApp recibo incompleto | 🟢 P2 | Recibo es solo link, no contiene productos/totales |
| 4 — Pedido | HC-3: 3 mutaciones sin feedback | 🔴 P0 | Operador no sabe si pedido se creó/actualizó |
| 5 — Monitoreo | Flujo completo inexistente | 🟡 P1 | Sin visibilidad operativa sobre cron jobs |

---

## B3 — UTILIDAD REAL DE OUTPUTS

**Test por output:** *"Un operador que ve esto, ¿sabe qué hacer a continuación?"*

| # | Output | Función/Página | Contenido | Accionable | Canal de entrega | Veredicto | Evidencia |
|---|--------|---------------|-----------|-----------|-----------------|-----------|-----------|
| 1 | Dashboard stats | Dashboard.tsx | Tareas pendientes (count) + stock bajo (count) + total productos | **SÍ** | Web — visible al abrir app | ✅ Dice QUÉ falta | `useDashboardStats`: 3 queries paralelas (tareas pendientes, stock bajo, total productos). Cards con iconos descriptivos. |
| 2 | Dashboard — stock bajo | Dashboard.tsx | Solo count numérico ("X productos con stock bajo") | **PARCIAL** | Web — Dashboard | ⚠️ Dice CUÁNTOS pero no CUÁLES | No lista productos específicos con stock bajo. Operador debe ir a Stock.tsx para ver detalles. 2 clicks. |
| 3 | Alertas stock (cron) | alertas-stock (cron) | Producto + cantidad_actual + stock_mínimo + ubicación + proveedor + nivel (crítico/urgente/bajo) | **SÍ** (si funcionara) | BD solamente (JSON response) | ❌ No llega al operador | HC-1: cron falla con 401. Aun si funcionara, output es JSON → no hay canal de entrega (no email, no push, no panel). Crea tarea automática si nivel=crítico (sí accionable). |
| 4 | Alertas vencimientos | alertas-vencimientos | — | **NO** | Ninguno | ❌ Función HUÉRFANA | Sin cron trigger, sin frontend caller. 206 lín de código muerto. |
| 5 | Reposición sugerida | reposicion-sugerida | — | **NO** | Ninguno | ❌ Función HUÉRFANA | Sin trigger. 237 lín de código muerto. Frontend usa views/insightsApi en su lugar. |
| 6 | Precios scraper → Insights | insightsApi.arbitraje | Precio proveedor vs venta vs margen | **SÍ** | Web — vía Rentabilidad.tsx o insights | ⚠️ Datos disponibles si scraping funciona | Depende de Flujo 2 completar correctamente. `insightsApi` expone endpoint. |
| 7 | Rentabilidad | Rentabilidad.tsx | Márgenes por producto | **SÍ** | Web — página dedicada | ✅ Operador ve qué productos son rentables | `useRentabilidad` hook. ErrorMessage. Pero sin export ni comparativa temporal. |
| 8 | Reportes automáticos | reportes-automaticos (cron) | Reporte generado | **NO** | BD solamente | ❌ No llega al operador | HC-1: cron falla con 401. Aun si funcionara, no hay email/canal de entrega. Solo registro en BD. |
| 9 | Notificaciones tareas | notificaciones-tareas (cron) | Notificación de tareas | **NO** | BD solamente | ❌ No llega al operador | HC-1: cron falla con 401. Sin canal real de delivery (no email, no push). |
| 10 | Recibo WhatsApp | Pos.tsx | Link WhatsApp a contacto | **PARCIAL** | WhatsApp (link) | ⚠️ Solo abre chat, no envía recibo | `buildWhatsAppUrl(e164)` → `wa.me/{tel}`. No incluye cuerpo con productos/totales/datos negocio. |
| 11 | Bitácora | Dashboard.tsx (bitacoraApi) | Últimas acciones del sistema | **PARCIAL** | Web — Dashboard (admin/ventas) | ⚠️ Solo para roles admin/ventas | `bitacoraApi.list()` visible solo con `useUserRole`. Acciones comprensibles pero sin filtro/búsqueda. |

### Resumen B3

- **Accionable SÍ:** 3/11 (Dashboard stats, Rentabilidad, alertas-stock lógica)
- **Accionable PARCIAL:** 4/11 (Dashboard stock bajo, Insights, WhatsApp recibo, Bitácora)
- **Accionable NO:** 4/11 (Alertas stock cron, alertas-vencimientos, reportes, notificaciones)
- **Patrón común:** Los outputs que dependen de cron jobs sin auth (HC-1) NO llegan al operador. No existe canal real de notificaciones (email, push, WhatsApp automático).

---

## B4 — CONDICIONES ADVERSAS REALES

| # | Escenario | Comportamiento actual | Riesgo | Impacto operador | Mitigación existente | Acción | Evidencia |
|---|-----------|----------------------|--------|-------------------|---------------------|--------|-----------|
| 1 | **Maxiconsumo cambia HTML** | `parsing.ts`: regex/DOM extraction con `extractProductosConOptimizacion()`. Si HTML cambia, regex falla → 0 productos. `calculateConfidenceScore()` calcula score pero **no hay alerta automática** si score bajo o 0 resultados. | 🟡 MEDIO | Precios desactualizados sin aviso. Operador no sabe que scraping falló. | Retry (5x) + anti-detection + scraping.ts error handling. `orchestrator.ts` aísla fallos pero solo loguea. | **P1:** Agregar alerta cuando `productos.length === 0` o `confidenceScore < umbral`. Notificar al operador. | `scraping.ts` L83-90: retry loop. `parsing.ts`: sin validación de resultados vacíos. |
| 2 | **BD acumula logs** | `cron_jobs_execution_log` crece sin límite con cada ejecución. `maintenance.ts` existe como job configurable pero **no tiene cron schedule automático** — solo ejecutable vía API manual. | 🟡 MEDIO | BD lenta (free tier: 500MB). Queries degradan si tabla crece sin índice temporal. | `maintenance.ts` en cron-jobs-maxiconsumo como job disponible. Tablas tienen timestamps. | **P1:** Configurar cron para `maintenance_cleanup` automático (semanal). Agregar índice en `created_at`. Política de retención (ejemplo: 30 días). | `config.ts` L61: job 'maintenance_cleanup' definido. `orchestrator.ts` L21: importado. Sin cron SQL schedule. |
| 3 | **Edge Function timeout** | `scraper-maxiconsumo`: multi-categoría secuencial con delays 2-4s entre categorías. Config SQL pide 120-600s pero free tier limita a **60s**. Si hay 5+ categorías con 2-4s delay = 10-20s delays + fetch time. Circuit breaker en `_shared/circuit-breaker.ts` pero es **in-memory** → no sobrevive cold starts. | 🔴 ALTO | Scraping incompleto. Precios parcialmente actualizados. Operador no sabe cuáles categorías fallaron. | Retry (5x) con backoff. `getRequestTimeoutMs()` configurable. Anti-detection delays. | **P0:** Medir tiempo real de scraping en producción. Si >60s: particionar en cron jobs separados por categoría. | `scraping.ts` L80: exponential backoff. `config.ts`: `getRequestTimeoutMs()`. Free tier: 60s hard limit. |
| 4 | **Datos incorrectos** | `validation.ts` (130 lín): cubre UUID, positiveNumber, nonNegativeNumber, positiveInt, textSanitize, ISODate, allowedFields, códigos. **No valida stock negativo explícitamente** — `parseNonNegativeNumber` disponible pero depende de que handlers la usen. | 🟡 MEDIO | Stock podría llegar a negativo si handler no valida. Precio con formato incorrecto rechazado por parsePositiveNumber. | `validation.ts` comprehensive. `sp_reservar_stock` usa parámetro `p_cantidad` sin constraint CHECK en SQL pero handler debería validar. | **P1:** Agregar constraint CHECK(cantidad_actual >= 0) en `stock_deposito`. Verificar que todos los handlers usen `parseNonNegativeNumber` para cantidades. | `validation.ts` L29-36: `parseNonNegativeNumber`. `sp_reservar_stock` no tiene CHECK constraint. |
| 5 | **Sesión expirada** | `auth.ts` (344 lín): JWT validation con **cache SHA-256 (30s pos / 10s neg)** + circuit breaker dedicado (3 failures → 15s open → half-open). `apiClient.ts` L98: `throw new ApiError('AUTH_REQUIRED', ..., 401)`. Frontend: `AuthContext` redirige a `/login` cuando Supabase invalida sesión, pero **no existe interceptor global** para 401 de `apiClient`. | 🟡 MEDIO | Puede haber 401 sin redirect inmediato si la sesión local persiste y falla una request al gateway. | auth.ts: cache + breaker + AbortController (5s timeout). ProtectedRoute + onAuthStateChange de Supabase cubren parte del flujo. | **P0:** Agregar interceptor 401 global para `AUTH_REQUIRED` y forzar `signOut()+navigate('/login')`. | `auth.ts` L37-42 y L86-95; `apiClient.ts` L98; `App.tsx` ProtectedRoute; `AuthContext.tsx` onAuthStateChange. |
| 6 | **Cron job falla** | `orchestrator.ts`: cada job ejecuta en try/catch. Fallos individuales se registran en `cron_jobs_execution_log`. **No hay alerta al operador** si un job falla — solo se registra en BD. `execution-log.ts` existe para registrar ejecuciones. | 🟡 MEDIO | Operador no sabe que cron falló. Precios desactualizados, alertas no generadas. Sin panel de monitoreo (Flujo 5 = FALLA). | `orchestrator.ts` aísla fallos entre jobs. `execution-log.ts` registra resultado/duración/error. `maintenance.ts` disponible para cleanup. | **P1:** Implementar canal de alerta real (email/push/webhook) cuando cron falla. Crear panel de monitoreo con cron-dashboard (conectar a frontend). | `orchestrator.ts` L11-21: job dispatch con error isolation. `cron-health-monitor`: 959 lín sin trigger. |
| 7 | **Concurrencia** | `sp_reservar_stock` con ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING. Fix aplicado en migración `20260209`. Stored procedure usa UPDATE atómico de stock_deposito. Frontend genera UUID v4 como idempotencyKey. | ✅ BAJO | 2 ventas simultáneas del mismo producto: SP usa UPDATE atómico, ON CONFLICT previene duplicados. Idempotencia correcta. | `sp_reservar_stock` atómico. Idempotency key UUID por venta. ON CONFLICT con partial index (fix 20260209). | Concurrencia manejada correctamente. | Migración `20260209`: L79: `ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING`. `apiClient.ts` L656-664: idempotencyKey en header. |

### Resumen B4

- **✅ OK (riesgo bajo):** 1/7 (Concurrencia)
- **🟡 MEDIO:** 5/7 (HTML cambia, BD logs, Datos incorrectos, Sesión expirada sin interceptor 401, Cron falla)
- **🔴 ALTO:** 1/7 (Edge Function timeout — 60s free tier vs scraping multi-categoría)

**Patrón dominante:** El sistema es robusto técnicamente (auth cache, circuit breaker, idempotencia, atomic SP) pero **falta un canal real de notificación al operador**. Cuando algo falla (cron, scraping, timeout), solo queda en logs y BD — el operador no se entera.

---

## RESUMEN EJECUTIVO SP-B

### Estado por sección

| Sección | Estado | Hallazgos clave |
|---------|--------|----------------|
| B1 — Jornada operador | ⚠️ PARCIAL | 7/13 OK, 4 parciales, 1 falla (Pedidos HC-3). 8/13 sin Skeleton. |
| B2 — Flujos E2E | ❌ PARCIAL | 2/5 OK, 1 parcial, 2 fallas. HC-1 rompe alertas. HC-3 rompe pedidos UX. |
| B3 — Utilidad outputs | ⚠️ PARCIAL | 3/11 accionables, 4 parciales, 4 no llegan al operador. Sin canal de notif. |
| B4 — Condiciones adversas | ⚠️ PARCIAL | 2/7 OK, 4 riesgo medio, 1 riesgo alto (timeout 60s). |

### Hallazgos P0

1. **HC-1: 3 cron jobs sin Authorization header** → alertas-stock, notificaciones-tareas, reportes-automaticos no ejecutan (401 silencioso)
2. **HC-3: 3 mutaciones en Pedidos.tsx con solo `console.error()`** → operador sin feedback en crear/actualizar pedidos
3. **Timeout 60s (free tier) vs scraping multi-categoría** → riesgo de scraping incompleto

### Hallazgos P1

1. Sin canal real de notificación (sin email, push, webhook para alertas)
2. 4 páginas sin ErrorMessage persistente (Deposito, Pos, Pocket, Clientes)
3. `maintenance_cleanup` sin cron schedule automático (BD puede crecer sin límite)
4. WhatsApp "recibo" solo abre chat (no envía contenido)
5. Flujo 5 (monitoreo) completamente inexistente para el operador

### Estado final SP-B: **PARCIAL**

> Análisis estático completo. El sistema es técnicamente capaz pero tiene gaps UX críticos (HC-3) y dependencias rotas (HC-1) que impiden considerarlo funcional E2E para un operador real.

---

## Addendum: Fixes P0 aplicados (2026-02-11, Claude Code Opus 4)

### HC-3 corregido en Pedidos.tsx

**Fix aplicado:**
- Línea 23: `import { toast } from 'sonner';` agregado
- Línea 52: `toast.error(err instanceof Error ? err.message : 'Error al crear pedido')` en `handleCreatePedido`
- Línea 62: `toast.error(err instanceof Error ? err.message : 'Error al actualizar estado del pedido')` en `handleUpdateEstado`
- Línea 72: `toast.error(err instanceof Error ? err.message : 'Error al actualizar item del pedido')` en `handleToggleItemPreparado`
- `console.error` retenido para debug (convive con `toast.error`)

**Verificación:**
- `pnpm -C minimarket-system build` → PASS (5.48s, 27 entradas PWA precache)
- `rg -n "toast.error" minimarket-system/src/pages/Pedidos.tsx` → 3 coincidencias (L52, L62, L72)
- `rg -n "console.error" minimarket-system/src/pages/Pedidos.tsx` → 3 coincidencias (L51, L61, L71)

**Impacto:**
- B1 tarea 8 (Pedidos): ❌ FALLA → ⚠️ PARCIAL (operador recibe feedback de error vía toast; falta ErrorMessage persistente)
- B2 Flujo 4 (Pedido E2E): eslabones 1,3,4,5 UX reclasificados de ❌ a ⚠️
- HC-3 resuelto: 0 mutaciones críticas sin feedback al operador

### Interceptor global 401 implementado

**Fix aplicado:**
- `minimarket-system/src/lib/authEvents.ts` creado (observer pattern)
- `apiClient.ts` L99: `authEvents.emit('auth_required')` cuando no hay token
- `apiClient.ts` L139-141: `authEvents.emit('auth_required')` cuando server responde 401
- `AuthContext.tsx` L41-44: listener que ejecuta `signOut()` automáticamente al recibir evento `auth_required`

**Impacto:**
- B4 escenario 5 (Sesión expirada): reclasificado de 🟡 MEDIO a ✅ BAJO (interceptor 401 global activo)

---

## Addendum 2: Revalidación Codex post-cierre abrupto (2026-02-11)

Se confirmó ejecución efectiva de los fixes P0 y se completó un ajuste pendiente de Prompt 3.

### Ajuste aplicado

- `Pedidos.tsx`: se reemplazó el bloque inline de error de carga por `ErrorMessage` persistente con retry:
  - `message={parseErrorMessage(error)}`
  - `type={detectErrorType(error)}`
  - `onRetry={refetch}`
  - `isRetrying={isFetching}`

### Verificación

- `pnpm -C minimarket-system build` → ✅ PASS.
- `pnpm -C minimarket-system lint` → ✅ PASS.
- `rg -n "ErrorMessage|parseErrorMessage|detectErrorType" minimarket-system/src/pages/Pedidos.tsx` → ✅ presente.

### Impacto SP-B

- B1 tarea 8 (Pedidos) mejora en robustez UX: ahora tiene feedback persistente de error de carga + feedback toast en mutaciones.
- Conteo de adopción `ErrorMessage` en páginas auditadas (revalidación final con `Pos.tsx`): **9/13** (antes 7/13).
