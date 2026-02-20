# EVIDENCIA_V2_06_ERROR_HANDLING_2026-02-20

**Fecha:** 2026-02-20
**Tarea:** V2-06 Error handling completo
**Estado:** COMPLETADO

---

## Descripcion

Mejoras integrales en el manejo de errores del sistema, cubriendo:
- Bloque A: `extractRequestId()` + feedback visual de logout (sin `console.error`)
- Bloque B: Soporte para 429 (rate limiting) y timeout/aborted en `errorMessageUtils.ts`
- Bloque C (sesion cierre V2): Propagacion de `requestId` a todas las paginas restantes

## Bloque A — requestId + logout feedback

### minimarket-system/src/components/Layout.tsx

| Cambio |
|--------|
| Eliminado `console.error` en `performSignOut`. Errores se capturan via `setLogoutError` con feedback visual en modal. |
| Agregados atributos `role="dialog"` y `aria-modal="true"` al modal de logout. |

### minimarket-system/src/components/errorMessageUtils.ts

| Cambio |
|--------|
| Agregada funcion `extractRequestId()` — extrae `requestId` de objetos de error para trazabilidad. |

### Paginas con requestId (Bloque A original)

- `Dashboard.tsx`: `requestId={extractRequestId(error)}`
- `Pos.tsx`: `requestId={extractRequestId(productosError)}`
- `Pedidos.tsx`: `requestId={extractRequestId(error)}`

## Bloque B — 429/timeout

### errorMessageUtils.ts — detectErrorType()
- Agregado `timeout` y `aborted` al patron `network`
- Agregado `429` y `rate` al patron `server`

### errorMessageUtils.ts — parseErrorMessage()
- Handler timeout/aborted: `"La solicitud tardo demasiado. Verifica tu conexion e intenta de nuevo."`
- Handler 429/rate: `"Demasiadas solicitudes. Espera unos segundos e intenta de nuevo."`
- Orden de evaluacion: network > timeout > 401 > 403 > 429 > 500 > generico

### Mapeo completo (status/code -> mensaje prod)

| Condicion | Mensaje |
|---|---|
| network/fetch | No se pudo conectar con el servidor. Verifica tu conexion. |
| timeout/aborted | La solicitud tardo demasiado. Verifica tu conexion e intenta de nuevo. |
| 401/unauthorized | Sesion expirada. Por favor, vuelve a iniciar sesion. |
| 403 | No tienes permisos para realizar esta accion. |
| 429/rate | Demasiadas solicitudes. Espera unos segundos e intenta de nuevo. |
| 500/server | Error del servidor. Intenta de nuevo mas tarde. |
| default | Ocurrio un error inesperado. |
| ApiError + requestId | Mensaje backend directo (trazable) |

## Bloque C — requestId extendido (sesion cierre V2)

Paginas actualizadas con `extractRequestId`:
- `Clientes.tsx`: `requestId={extractRequestId(clientesQuery.error)}`
- `Deposito.tsx`: `requestId={extractRequestId(catalogError)}`
- `Kardex.tsx`: `requestId={extractRequestId(error)}`
- `Rentabilidad.tsx`: `requestId={extractRequestId(error)}`
- `Ventas.tsx`: `requestId={extractRequestId(error)}`
- `Proveedores.tsx`: `requestId={extractRequestId(error)}`
- `Pocket.tsx`: `requestId={extractRequestId(productosError)}` + PriceCheck

## Verificacion

| Verificacion | Resultado |
|--------------|-----------|
| `rg "console\.error" Layout.tsx` | 0 instancias |
| `rg "requestId=\{" minimarket-system/src/pages` | Presente en todas las paginas con ErrorMessage |
| Feedback visual logout | Errores mostrados en modal, no en consola |
| Accesibilidad modal logout | `role="dialog"` y `aria-modal="true"` presentes |
| lint + build + tests | PASS |

## Archivos Modificados

- `minimarket-system/src/components/Layout.tsx`
- `minimarket-system/src/components/errorMessageUtils.ts`
- `minimarket-system/src/pages/Dashboard.tsx`
- `minimarket-system/src/pages/Pos.tsx`
- `minimarket-system/src/pages/Pedidos.tsx`
- `minimarket-system/src/pages/Pedidos.test.tsx`
- `minimarket-system/src/pages/Clientes.tsx`
- `minimarket-system/src/pages/Deposito.tsx`
- `minimarket-system/src/pages/Kardex.tsx`
- `minimarket-system/src/pages/Rentabilidad.tsx`
- `minimarket-system/src/pages/Ventas.tsx`
- `minimarket-system/src/pages/Proveedores.tsx`
- `minimarket-system/src/pages/Pocket.tsx`
