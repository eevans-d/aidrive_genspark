# PERFORMANCE_BASELINE_V2.md — Mini Market System

> Baseline de performance con presupuestos de latencia por ruta critica.
> Generado: 2026-03-04 | Version: 2.0

---

## 1. Arquitectura de latencia

```
Cliente (browser)
  → CDN/Edge (Supabase)
    → Edge Function (Deno isolate) [cold start: 200-500ms, warm: <50ms]
      → PostgREST (REST → PostgreSQL) [<100ms per query]
        → PostgreSQL (queries, SPs) [<50ms simple, <200ms complex]
```

### Factores de impacto

| Factor | Impacto tipico | Mitigacion |
|--------|---------------|-----------|
| Cold start Edge Function | +200-500ms (primera invocacion) | Keep-alive via cron health check |
| Latencia red cliente→Supabase | 50-200ms (variable) | CDN cache para assets |
| Queries PostgREST simples | <50ms | Indices optimizados |
| Queries PostgREST con joins | 50-200ms | Limitar embedding depth |
| Stored Procedures (SP) | 50-150ms | FOR UPDATE locks breves |
| Timeout configurado (gateway) | 10s (fetchWithTimeout) | Circuit breaker a 5 failures |

## 2. Presupuestos de latencia por ruta critica

### 2.1 Rutas de lectura (GET)

| Ruta | p50 budget | p95 budget | Notas |
|------|-----------|-----------|-------|
| `GET /health` | 50ms | 200ms | Sin DB, baseline minimo |
| `GET /productos/dropdown` | 100ms | 400ms | Query simple, cache recomendado |
| `GET /proveedores/dropdown` | 100ms | 400ms | Query simple |
| `GET /productos` | 150ms | 500ms | Con filtros + paginacion |
| `GET /stock` | 150ms | 500ms | PostgREST embedding (producto) |
| `GET /pedidos` | 200ms | 600ms | Filtros + paginacion |
| `GET /pedidos/:id` | 150ms | 500ms | Con detalle_pedidos join |
| `GET /clientes` | 150ms | 500ms | Vista saldos + paginacion |
| `GET /ventas` | 150ms | 500ms | Paginado |
| `GET /insights/arbitraje` | 200ms | 800ms | Vista materializada |
| `GET /insights/compras` | 200ms | 800ms | Vista materializada |
| `GET /search?q=` | 200ms | 600ms | Multi-tabla, ilike |
| `GET /reportes/efectividad-tareas` | 300ms | 1000ms | Agregacion limitada a 10k rows (T09) |
| `GET /bitacora` | 100ms | 400ms | Paginado simple |
| `GET /ofertas/sugeridas` | 200ms | 700ms | Vista con calculos |

### 2.2 Rutas de escritura (POST/PUT)

| Ruta | p50 budget | p95 budget | Notas |
|------|-----------|-----------|-------|
| `POST /ventas` | 300ms | 1000ms | SP atomica + idempotencia |
| `POST /deposito/movimiento` | 200ms | 700ms | SP sp_movimiento_inventario |
| `POST /deposito/ingreso` | 250ms | 800ms | SP + insert precios_compra |
| `POST /compras/recepcion` | 250ms | 800ms | SP + update OC |
| `POST /pedidos` | 300ms | 1000ms | Multi-insert (detalle) |
| `PUT /pedidos/:id/estado` | 150ms | 500ms | Update simple + audit |
| `POST /tareas` | 150ms | 500ms | Insert simple |
| `PUT /tareas/:id/completar` | 150ms | 500ms | Update + state guard |
| `POST /precios/aplicar` | 300ms | 1000ms | SP con FOR UPDATE lock |
| `POST /clientes` | 150ms | 500ms | Insert simple |
| `POST /cuentas-corrientes/pagos` | 200ms | 700ms | SP atomica |
| `POST /ofertas/aplicar` | 200ms | 700ms | Insert + update |
| `POST /bitacora` | 100ms | 400ms | Insert simple |
| `PUT /facturas/items/:id/validar` | 200ms | 700ms | Update + auto-validate check |

### 2.3 Rutas OCR (latencia alta esperada)

| Ruta | p50 budget | p95 budget | Notas |
|------|-----------|-----------|-------|
| `POST /facturas/:id/extraer` | 5000ms | 15000ms | GCV OCR + batch insert |
| `POST /facturas/:id/aplicar` | 500ms | 2000ms | Multi-item SP loop |

## 3. Budgets para frontend (Core Web Vitals)

| Metrica | Budget | Herramienta de medicion |
|---------|--------|----------------------|
| **LCP** (Largest Contentful Paint) | < 2500ms | Lighthouse |
| **FID** (First Input Delay) | < 100ms | Lighthouse |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| **TTI** (Time to Interactive) | < 3500ms | Lighthouse |
| **Bundle size (gzip)** | < 500KB initial | `pnpm build` output |

### 3.1 Bundle actual

| Chunk | Size | Gzip |
|-------|------|------|
| `react-*.js` | 549KB | 148KB |
| `scanner-*.js` | 457KB | 117KB |
| Total initial | ~1006KB | ~265KB |

**Estado:** Dentro de budget para conexiones 3G+. El chunk scanner es lazy-loaded (solo POS).

## 4. Rate limits y circuit breaker

| Componente | Configuracion | Budget |
|-----------|--------------|--------|
| Rate limiter | 60 req/min por IP | Suficiente para uso humano |
| Circuit breaker | 5 failures → open 30s | Protege contra cascada |
| Request timeout | 10s (PostgREST), 30s (cliente) | Previene hang |
| OCR timeout | 35s (gateway→facturas-ocr) | GCV puede tardar hasta 30s |

## 5. Recomendaciones de monitoreo

### 5.1 Alertas sugeridas

| Alerta | Condicion | Severidad |
|--------|-----------|-----------|
| Latencia p95 > budget × 2 | Cualquier ruta critica | Warning |
| Latencia p95 > budget × 5 | Cualquier ruta critica | Critical |
| Error rate > 5% | Global | Warning |
| Error rate > 10% | Global | Critical |
| Circuit breaker open | `api-minimarket-db` | Critical |
| Cold start rate > 30% | Edge Function invocations | Warning |

### 5.2 Herramientas

| Objetivo | Herramienta | Estado |
|----------|------------|--------|
| Metricas Edge Functions | Supabase Dashboard | Disponible |
| Latencia por ruta | Custom logging (x-request-id) | Implementado |
| Performance frontend | Lighthouse CI | Pendiente |
| Load testing real | k6 / Artillery | Pendiente (ver `tests/performance/`) |

## 6. Verificacion de budgets

### 6.1 Test en CI (mock, sin red)

```bash
npm run test:performance  # Vitest mock suite
```

### 6.2 Test real (requiere credenciales)

```bash
# No ejecutar en CI — solo entorno controlado
RUN_REAL_TESTS=true \
  SUPABASE_URL=... \
  SUPABASE_ANON_KEY=... \
  npm run test:performance
```

### 6.3 Validacion manual rapida

```bash
# Health check baseline (warm)
time curl -s https://<project>.supabase.co/functions/v1/api-minimarket/health

# Producto dropdown (authenticated)
time curl -s -H "Authorization: Bearer <jwt>" \
  https://<project>.supabase.co/functions/v1/api-minimarket/productos/dropdown
```

---

> **Revision:** Actualizar budgets tras cada cambio arquitectural significativo o tras medicion real con k6.
