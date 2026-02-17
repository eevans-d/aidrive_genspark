---
REPORTE DE AUDITORÍA SRE
Fecha: 2026-02-17T05:03:27+00:00
Proyecto: aidrive_genspark
---

RESUMEN EJECUTIVO

Contexto auditado y re-verificado:
- Backend principal: `supabase/functions/api-minimarket/index.ts`
- Backend proveedor/scraper: `supabase/functions/api-proveedor/*`, `supabase/functions/scraper-maxiconsumo/*`
- Jobs/automatizaciones: `supabase/functions/cron-*`, `supabase/functions/alertas-*`, `supabase/functions/reportes-automaticos`
- Frontend crítico de operación: `minimarket-system/src/lib/queryClient.ts`, `minimarket-system/src/lib/apiClient.ts`, `minimarket-system/src/pages/*`
- Configuración: `.env.example`, `.env.test.example`, `minimarket-system/.env.example`, `supabase/config.toml`, `package.json`, `minimarket-system/package.json`, `deploy.sh`

Integraciones externas detectadas en código real:
- Supabase REST/Auth/RPC
- `scraper-maxiconsumo` (Edge Function interna)
- SendGrid API
- Webhooks genéricos / Slack webhook
- Twilio (por env, canal opcional)

No se encontró en runtime del repositorio:
- Redis operativo
- PMS/QloApps
- Webhook inbound de WhatsApp/NLP conversacional

| Severidad | Cantidad |
|-----------|----------|
| CRÍTICO   | 2        |
| ALTO      | 4        |
| MEDIO     | 2        |
| INFO      | 0        |

---

HALLAZGOS DETALLADOS

### [CRÍTICO] VULN-001: Deploy ejecuta reset destructivo de base remota

UBICACIÓN: `deploy.sh:436`, `deploy.sh:626`
VECTOR: Dependencias

ESCENARIO DE FALLO:
Un deploy normal en `staging` o `production` ejecuta `supabase db reset --linked`. Si el proyecto está linkeado al remoto correcto, puede borrar/recrear esquema y datos productivos.

EVIDENCIA EN CÓDIGO:
```bash
if [ "$DRY_RUN" != "true" ]; then
  supabase db reset --linked || {
    log_error "Error en deploy de migraciones"
    exit 1
  }
fi
...
if [ "$DEPLOY_ENV" != "dev" ]; then
  deploy_to_supabase
  deploy_migrations
fi
```

SOLUCIÓN PROPUESTA:
Eliminar `db reset --linked` del flujo de deploy remoto y usar `supabase db push` con guardas estrictas por entorno.

IMPLEMENTACIÓN SUGERIDA:
```text
deploy_migrations() {
  if [ "$DRY_RUN" = "true" ]; then return 0; fi
  if [ "$DEPLOY_ENV" = "production" ] || [ "$DEPLOY_ENV" = "staging" ]; then
    supabase db push || exit 1
    return 0
  fi
  supabase db reset
}
```

ESFUERZO ESTIMADO: Bajo | 1-2h

### [CRÍTICO] VULN-002: Creación de pedidos sin idempotencia (duplicados bajo retry/concurrencia)

UBICACIÓN: `supabase/functions/api-minimarket/index.ts:1790`, `supabase/functions/api-minimarket/handlers/pedidos.ts:198`
VECTOR: Concurrencia

ESCENARIO DE FALLO:
Dos requests equivalentes (retry de cliente, duplicación de evento o doble click) en milisegundos crean pedidos distintos porque no existe `Idempotency-Key` en el flujo de `POST /pedidos`.

EVIDENCIA EN CÓDIGO:
```ts
const res = await handleCrearPedido(
  supabaseUrl,
  requestHeaders(),
  responseHeaders,
  requestId,
  bodyResult as unknown as Parameters<typeof handleCrearPedido>[4]
);
...
const result = await callFunction(supabaseUrl, 'sp_crear_pedido', headers, {
  p_items: JSON.stringify(payload.items),
});
```

SOLUCIÓN PROPUESTA:
Exigir `Idempotency-Key` en API, persistirla en `pedidos` y deduplicar en `sp_crear_pedido`.

IMPLEMENTACIÓN SUGERIDA:
```text
ALTER TABLE pedidos ADD COLUMN idempotency_key text;
CREATE UNIQUE INDEX idx_pedidos_idempotency_key
  ON pedidos(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- API POST /pedidos:
-- 1) validar header Idempotency-Key
-- 2) pasar p_idempotency_key al RPC
-- 3) RPC retorna pedido existente si ya fue procesado
```

ESFUERZO ESTIMADO: Alto | 4-8h

### [ALTO] VULN-003: TOCTOU en recepción de órdenes de compra (sobre-recepción)

UBICACIÓN: `supabase/functions/api-minimarket/index.ts:1713`, `supabase/migrations/20260110100000_fix_rls_security_definer.sql:157`
VECTOR: Concurrencia

ESCENARIO DE FALLO:
Dos recepciones concurrentes pasan el check de `pendiente` en API y ambas actualizan `cantidad_recibida`; resultado: recepción por encima del total ordenado.

EVIDENCIA EN CÓDIGO:
```ts
const pendiente = Math.max(total - recibida, 0);
if (cantidadNumero > pendiente) {
  return respondFail('CONFLICT', 'Cantidad supera lo pendiente de recepcion', 409);
}
const movimiento = await callFunction(supabaseUrl, 'sp_movimiento_inventario', requestHeaders(), {
  p_cantidad: cantidadNumero,
});
```

SOLUCIÓN PROPUESTA:
Mover la validación de pendiente al SP que actualiza OC (misma transacción) con lock `FOR UPDATE` de la fila de `ordenes_compra`.

IMPLEMENTACIÓN SUGERIDA:
```text
CREATE FUNCTION sp_recepcionar_orden(p_orden_id uuid, p_cantidad int, ...)
AS $$
SELECT cantidad, COALESCE(cantidad_recibida,0)
INTO v_total, v_recibida
FROM ordenes_compra WHERE id = p_orden_id FOR UPDATE;
IF p_cantidad > (v_total - v_recibida) THEN
  RAISE EXCEPTION 'PENDIENTE_EXCEDIDO';
END IF;
-- aplicar update + movimiento en la misma tx
$$;
```

ESFUERZO ESTIMADO: Medio | 2-4h

### [ALTO] VULN-004: Actualización de pago de pedido con read-modify-write no atómico

UBICACIÓN: `supabase/functions/api-minimarket/handlers/pedidos.ts:350`
VECTOR: Concurrencia

ESCENARIO DE FALLO:
Pagos concurrentes del mismo pedido pueden perder actualización (último write gana) porque el cálculo de estado de pago se hace fuera de una operación atómica.

EVIDENCIA EN CÓDIGO:
```ts
const pedidos = await queryTable(supabaseUrl, 'pedidos', headers, { id: pedidoId }, 'id,monto_total');
...
const result = await updateTable(supabaseUrl, 'pedidos', pedidoId, headers, {
  monto_pagado,
  estado_pago,
  updated_at: new Date().toISOString(),
});
```

SOLUCIÓN PROPUESTA:
Reemplazar por RPC transaccional con lock de fila (`FOR UPDATE`) y monto incremental.

IMPLEMENTACIÓN SUGERIDA:
```text
CREATE FUNCTION sp_actualizar_pago_pedido(p_pedido_id uuid, p_monto_incremental numeric) RETURNS pedidos AS $$
UPDATE pedidos
SET monto_pagado = LEAST(monto_total, COALESCE(monto_pagado,0) + p_monto_incremental),
    estado_pago = CASE WHEN ... THEN 'pagado' WHEN ... THEN 'parcial' ELSE 'pendiente' END,
    updated_at = now()
WHERE id = p_pedido_id
RETURNING *;
$$;
```

ESFUERZO ESTIMADO: Medio | 2-4h

### [ALTO] VULN-005: Retry de POST sin timeout ni idempotencia en sincronización de scraper

UBICACIÓN: `supabase/functions/api-proveedor/utils/http.ts:1`, `supabase/functions/api-proveedor/handlers/sincronizar.ts:68`
VECTOR: Dependencias

ESCENARIO DE FALLO:
Si el scraper procesa pero falla la respuesta de red, el retry repite el POST y puede disparar sincronizaciones duplicadas. Sin timeout, cada intento puede quedar colgado.

EVIDENCIA EN CÓDIGO:
```ts
for (let i = 0; i <= maxRetries; i++) {
  const response = await fetch(url, options);
  if (response.ok) return response;
}
...
await fetchWithRetry(scrapingUrl, { method: 'POST', body: JSON.stringify(requestBody) }, 3, 1000);
```

SOLUCIÓN PROPUESTA:
Agregar timeout por intento, limitar retry a errores transitorios y usar idempotencia por `request_id`.

IMPLEMENTACIÓN SUGERIDA:
```text
await fetchWithRetry(scrapingUrl, {
  method: 'POST',
  headers: { 'x-request-id': requestId, 'idempotency-key': requestId, ... },
  body: JSON.stringify(requestBody)
}, { maxRetries: 2, timeoutMs: 8000, retryStatuses: [429,502,503,504] });

-- scraper: rechazar/procesar una sola vez por request_id
```

ESFUERZO ESTIMADO: Medio | 2-4h

### [ALTO] VULN-006: Fan-out de consultas proveedor sin timeout explícito

UBICACIÓN: `supabase/functions/api-proveedor/handlers/precios.ts:22`, `supabase/functions/api-proveedor/handlers/precios.ts:121`
VECTOR: Dependencias

ESCENARIO DE FALLO:
Con latencia alta o 503 intermitente en Supabase, las llamadas sin timeout ocupan workers más tiempo del esperado y degradan toda la API.

EVIDENCIA EN CÓDIGO:
```ts
const queries = await Promise.allSettled([
  buildPreciosQuery(...),
  buildPreciosCountQuery(...),
  buildPreciosStatsQuery(...)
]);
...
return fetch(query, {
  headers: supabaseReadHeaders
});
```

SOLUCIÓN PROPUESTA:
Estandarizar `fetchWithTimeout` para todos los handlers de api-proveedor (`precios`, `productos`, `comparacion`, `alertas`, `estadisticas`).

IMPLEMENTACIÓN SUGERIDA:
```text
const r = await fetchWithTimeout(query, { headers: supabaseReadHeaders }, 5000);
if (!r.ok) throw await fromFetchResponse(r, 'Error...');

const [a,b,c] = await Promise.allSettled([
  fetchWithTimeout(q1, h, 5000),
  fetchWithTimeout(q2, h, 3000),
  fetchWithTimeout(q3, h, 3000),
]);
```

ESFUERZO ESTIMADO: Medio | 2-4h

### [MEDIO] VULN-007: Health check con dependencias externas hardcodeadas en “healthy”

UBICACIÓN: `supabase/functions/api-proveedor/utils/health.ts:90`, `supabase/functions/api-proveedor/handlers/status.ts:107`
VECTOR: Dependencias

ESCENARIO DE FALLO:
Durante caída real de dependencia externa, health/status puede seguir reportando “saludable”, retrasando mitigación y escalamiento.

EVIDENCIA EN CÓDIGO:
```ts
export async function checkExternalDependencies(): Promise<any> {
  return {
    status: 'healthy',
    score: 100,
    dependencies: { supabase_api: 'healthy', scraper_endpoint: 'healthy' }
  };
}
```

SOLUCIÓN PROPUESTA:
Reemplazar respuesta estática por probes reales con timeout y reflejar degradación parcial.

IMPLEMENTACIÓN SUGERIDA:
```text
const deps = await Promise.allSettled([
  fetchWithTimeout(supabaseProbe, { headers }, 3000),
  fetchWithTimeout(scraperProbe, { headers }, 3000),
]);
const okCount = deps.filter(d => d.status === 'fulfilled' && d.value.ok).length;
return { status: okCount === 2 ? 'healthy' : 'degraded', score: okCount * 50 };
```

ESFUERZO ESTIMADO: Bajo | 1-2h

### [MEDIO] VULN-008: Retorno tras inactividad sin refetch automático (estado visual obsoleto)

UBICACIÓN: `minimarket-system/src/lib/queryClient.ts:18`
VECTOR: UX

ESCENARIO DE FALLO:
Usuario deja la app varias horas y vuelve; la UI mantiene datos cacheados sin refetch al foco, generando decisiones sobre stock/pedidos desactualizados.

EVIDENCIA EN CÓDIGO:
```ts
queries: {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  retry: 1,
  refetchOnWindowFocus: false,
},
```

SOLUCIÓN PROPUESTA:
Habilitar refetch al recuperar foco/reconexión en vistas operativas y mostrar “última actualización”.

IMPLEMENTACIÓN SUGERIDA:
```text
queries: {
  staleTime: 1000 * 60 * 2,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: 1
}
// UI: badge "Actualizado hace X min" + botón "Actualizar"
```

ESFUERZO ESTIMADO: Bajo | 1-2h

PRIORIDAD NÚMERO 1 PARA HOY

Qué: Corregir `VULN-002` (idempotencia en `POST /pedidos`).

Por qué es urgente:
Es el riesgo con mayor Probabilidad×Impacto operativo diario: genera duplicados reales de pedidos bajo retry/evento repetido, afectando caja, despacho y trazabilidad.

Pasos concretos:
1. Crear columna `idempotency_key` + índice único parcial en `pedidos`.
2. Extender `sp_crear_pedido` para deduplicar y retornar pedido existente.
3. Exigir `Idempotency-Key` en `POST /pedidos`.
4. Hacer que frontend envíe key por intento lógico.
5. Agregar test concurrente de doble request con misma key.

Validación:
- Dos `POST /pedidos` concurrentes con misma key retornan mismo `pedido_id`.
- Reintento tras timeout de red no incrementa filas en `pedidos`.
- No hay duplicados por ventana de 24h en auditoría de pedidos.

MATRIZ DE DEPENDENCIAS

| Fix | Depende de | Notas |
|-----|------------|-------|
| F1 Eliminar `db reset --linked` de deploy remoto | Ninguno | Mitiga riesgo catastrófico inmediato en pipeline |
| F2 Idempotencia `POST /pedidos` | Ninguno | Bloquea duplicados por retry/concurrencia |
| F3 Recepción OC transaccional con lock | Ninguno | Evita sobre-recepción por TOCTOU |
| F4 Pago pedido atómico | Ninguno | Evita pérdida de actualización bajo concurrencia |
| F5 Retry seguro scraper (timeout + idempotency) | Ninguno | Evita ejecuciones duplicadas y cuelgues largos |
| F6 Timeouts en fan-out api-proveedor | F5 | Reusa wrapper HTTP endurecido |
| F7 Health checks reales | F6 | Usa probes con timeout consistentes |
| F8 Refetch UX al volver foco | Ninguno | Reduce riesgo de operar con datos viejos |
