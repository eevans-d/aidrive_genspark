# Auditoría de seguridad por endpoint

**Fecha:** 2026-02-09
**Alcance:** `supabase/functions/api-minimarket` (gateway) + `supabase/functions/api-proveedor` (proveedor).

## Hallazgos globales

### Gateway (`api-minimarket`)
- **Rate limiting + circuit breaker:** se aplican globalmente antes del routing y afectan a *todos* los endpoints listados abajo (incluye `/health`).【F:supabase/functions/api-minimarket/index.ts†L243-L343】
- **`checkRole`:** helper aplicado dentro de cada ruta (salvo `/health`).【F:supabase/functions/api-minimarket/index.ts†L314-L317】【F:supabase/functions/api-minimarket/index.ts†L2131-L2136】
- **`parseJsonBody`:** helper definido en el gateway y usado solo en endpoints con cuerpo JSON.【F:supabase/functions/api-minimarket/index.ts†L361-L367】

### Proveedor (`api-proveedor`)
- **Rate limiting + circuit breaker:** se aplican globalmente antes del routing y afectan a *todos* los endpoints del proveedor listados abajo.【F:supabase/functions/api-proveedor/index.ts†L207-L233】【F:supabase/functions/api-proveedor/index.ts†L314-L329】
- **Autenticación:** no existe `checkRole`; la autorización es por `x-api-secret` (según `endpointSchemas.requiresAuth`).【F:supabase/functions/api-proveedor/index.ts†L294-L302】【F:supabase/functions/api-proveedor/schemas.ts†L33-L42】
- **`parseJsonBody`:** no existe en el proveedor; los handlers reciben `URL`/`Request` y validan parámetros de query o usan llamadas internas (ej. `sincronizar`).【F:supabase/functions/api-proveedor/index.ts†L166-L204】【F:supabase/functions/api-proveedor/handlers/sincronizar.ts†L28-L51】

## Inventario + controles por endpoint

### Gateway `api-minimarket`

| # | Método | Endpoint | `checkRole` | `parseJsonBody` | Rate limit / circuit breaker |
| --- | --- | --- | --- | --- | --- |
| 1 | GET | `/search` | `BASE_ROLES` | No (query params) | Global (gateway) |
| 2 | GET | `/productos/dropdown` | `BASE_ROLES` | No | Global (gateway) |
| 3 | GET | `/proveedores/dropdown` | `BASE_ROLES` | No | Global (gateway) |
| 4 | GET | `/categorias` | `BASE_ROLES` | No | Global (gateway) |
| 5 | GET | `/categorias/:id` | `BASE_ROLES` | No | Global (gateway) |
| 6 | GET | `/productos` | `BASE_ROLES` | No | Global (gateway) |
| 7 | GET | `/productos/:id` | `BASE_ROLES` | No | Global (gateway) |
| 8 | POST | `/productos` | `admin`, `deposito` | Sí | Global (gateway) |
| 9 | PUT | `/productos/:id` | `admin`, `deposito` | Sí | Global (gateway) |
| 10 | DELETE | `/productos/:id` | `admin` | No | Global (gateway) |
| 11 | GET | `/proveedores` | `admin`, `deposito` | No | Global (gateway) |
| 12 | GET | `/proveedores/:id` | `admin`, `deposito` | No | Global (gateway) |
| 13 | POST | `/precios/aplicar` | `admin` | Sí | Global (gateway) |
| 14 | GET | `/precios/producto/:id` | `BASE_ROLES` | No | Global (gateway) |
| 15 | POST | `/precios/redondear` | `BASE_ROLES` | Sí | Global (gateway) |
| 16 | GET | `/precios/margen-sugerido/:id` | `BASE_ROLES` | No | Global (gateway) |
| 17 | GET | `/stock` | `BASE_ROLES` | No | Global (gateway) |
| 18 | GET | `/stock/minimo` | `admin`, `deposito` | No | Global (gateway) |
| 19 | GET | `/stock/producto/:id` | `BASE_ROLES` | No | Global (gateway) |
| 20 | GET | `/reportes/efectividad-tareas` | `BASE_ROLES` | No | Global (gateway) |
| 21 | POST | `/tareas` | `BASE_ROLES` | Sí | Global (gateway) |
| 22 | PUT | `/tareas/:id/completar` | `BASE_ROLES` | No | Global (gateway) |
| 23 | PUT | `/tareas/:id/cancelar` | `BASE_ROLES` | Sí | Global (gateway) |
| 24 | POST | `/deposito/movimiento` | `admin`, `deposito` | Sí | Global (gateway) |
| 25 | GET | `/deposito/movimientos` | `admin`, `deposito` | No | Global (gateway) |
| 26 | POST | `/deposito/ingreso` | `admin`, `deposito` | Sí | Global (gateway) |
| 27 | POST | `/reservas` | `admin`, `ventas`, `deposito` | Sí | Global (gateway) |
| 28 | POST | `/reservas/:id/cancelar` | `admin`, `ventas`, `deposito` | No | Global (gateway) |
| 29 | POST | `/compras/recepcion` | `admin`, `deposito` | Sí | Global (gateway) |
| 30 | GET | `/pedidos` | `BASE_ROLES` | No | Global (gateway) |
| 31 | GET | `/pedidos/:id` | `BASE_ROLES` | No | Global (gateway) |
| 32 | POST | `/pedidos` | `BASE_ROLES` | Sí | Global (gateway) |
| 33 | PUT | `/pedidos/:id/estado` | `BASE_ROLES` | Sí | Global (gateway) |
| 34 | PUT | `/pedidos/:id/pago` | `admin`, `deposito` | Sí | Global (gateway) |
| 35 | PUT | `/pedidos/items/:id` (y `/preparado` legacy) | `BASE_ROLES` | Sí | Global (gateway) |
| 36 | GET | `/insights/arbitraje` | `BASE_ROLES` | No | Global (gateway) |
| 37 | GET | `/insights/compras` | `BASE_ROLES` | No | Global (gateway) |
| 38 | GET | `/insights/producto/:id` | `BASE_ROLES` | No | Global (gateway) |
| 39 | GET | `/clientes` | `admin`, `ventas` | No | Global (gateway) |
| 40 | POST | `/clientes` | `admin`, `ventas` | Sí | Global (gateway) |
| 41 | PUT | `/clientes/:id` | `admin`, `ventas` | Sí | Global (gateway) |
| 42 | GET | `/cuentas-corrientes/resumen` | `admin`, `ventas` | No | Global (gateway) |
| 43 | GET | `/cuentas-corrientes/saldos` | `admin`, `ventas` | No | Global (gateway) |
| 44 | POST | `/cuentas-corrientes/pagos` | `admin`, `ventas` | Sí | Global (gateway) |
| 45 | POST | `/ventas` | `admin`, `ventas` | Sí | Global (gateway) |
| 46 | GET | `/ventas` | `admin`, `ventas` | No | Global (gateway) |
| 47 | GET | `/ventas/:id` | `admin`, `ventas` | No | Global (gateway) |
| 48 | GET | `/ofertas/sugeridas` | `BASE_ROLES` | No | Global (gateway) |
| 49 | POST | `/ofertas/aplicar` | `BASE_ROLES` | Sí | Global (gateway) |
| 50 | POST | `/ofertas/:id/desactivar` | `BASE_ROLES` | No | Global (gateway) |
| 51 | POST | `/bitacora` | `BASE_ROLES` | Sí | Global (gateway) |
| 52 | GET | `/bitacora` | `admin` | No | Global (gateway) |
| 53 | GET | `/health` | **No aplica** (público) | No | Global (gateway) |

**Evidencia (gateway):** definición de rutas, roles y uso de `parseJsonBody` en `api-minimarket/index.ts`.【F:supabase/functions/api-minimarket/index.ts†L423-L2136】

### Proveedor `api-proveedor`

| # | Método (observado) | Endpoint | `checkRole` | `parseJsonBody` | Rate limit / circuit breaker |
| --- | --- | --- | --- | --- | --- |
| 1 | (no validación de método en router) | `/precios` | N/A (usa `x-api-secret`) | No helper `parseJsonBody` | Global (proveedor) |
| 2 | (no validación de método en router) | `/productos` | N/A (usa `x-api-secret`) | No helper `parseJsonBody` | Global (proveedor) |
| 3 | (no validación de método en router) | `/comparacion` | N/A (usa `x-api-secret`) | No helper `parseJsonBody` | Global (proveedor) |
| 4 | (no validación de método en router) | `/sincronizar` | N/A (usa `x-api-secret`) | No helper `parseJsonBody` | Global (proveedor) |
| 5 | (no validación de método en router) | `/status` | N/A (usa `x-api-secret`) | No helper `parseJsonBody` | Global (proveedor) |
| 6 | (no validación de método en router) | `/alertas` | N/A (usa `x-api-secret`) | No helper `parseJsonBody` | Global (proveedor) |
| 7 | (no validación de método en router) | `/estadisticas` | N/A (usa `x-api-secret`) | No helper `parseJsonBody` | Global (proveedor) |
| 8 | (no validación de método en router) | `/configuracion` | N/A (usa `x-api-secret`) | No helper `parseJsonBody` | Global (proveedor) |
| 9 | (no validación de método en router) | `/health` | N/A (public, `requiresAuth=false`) | No helper `parseJsonBody` | Global (proveedor) |

**Evidencia (proveedor):** lista de endpoints y esquema de auth en `schemas.ts` + rate limit/circuit breaker en `index.ts`.【F:supabase/functions/api-proveedor/schemas.ts†L1-L42】【F:supabase/functions/api-proveedor/index.ts†L207-L329】

## Notas de alineación
- El inventario de endpoints en este reporte se deriva directamente del routing real en `api-minimarket/index.ts` (53 endpoints incluidos `/health`).【F:supabase/functions/api-minimarket/index.ts†L423-L2136】
- El inventario del proveedor se deriva del `endpointList` y del esquema de autenticación publicado en `schemas.ts`.【F:supabase/functions/api-proveedor/schemas.ts†L1-L42】
- Si se agregan nuevos endpoints o se modifica `requiresAuth` en el proveedor, este documento debe actualizarse en la misma PR.
