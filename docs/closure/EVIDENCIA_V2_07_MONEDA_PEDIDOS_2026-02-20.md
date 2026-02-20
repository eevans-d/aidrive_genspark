# EVIDENCIA_V2_07_MONEDA_PEDIDOS_2026-02-20

**Fecha:** 2026-02-20
**Tarea:** V2-07 Formato monetario en Pedidos
**Estado:** COMPLETADO

---

## Descripcion

Reemplazo de todas las instancias de `.toLocaleString()` para valores monetarios en la pagina de Pedidos con la funcion utilitaria `money()` del modulo `../utils/currency`. Esto garantiza formato monetario consistente (locale es-AR, 2 decimales) en toda la aplicacion.

## Cambios Implementados

### minimarket-system/src/pages/Pedidos.tsx

| Linea | Cambio |
|-------|--------|
| 26 | Agregado import de `money` desde `../utils/currency`. |
| 223 | `pedido.monto_total.toLocaleString()` reemplazado con `money(pedido.monto_total)` en la vista de tarjeta del pedido. |
| 589 | `item.subtotal.toLocaleString()` reemplazado con `money(item.subtotal)` en el subtotal de item del formulario de creacion. |
| 602 | `totalPedido.toLocaleString()` reemplazado con `money(totalPedido)` en el total del formulario de creacion. |
| 694 | `item.subtotal.toLocaleString()` reemplazado con `money(item.subtotal)` en la vista de detalle del item. |
| 700 | `pedido.monto_total.toLocaleString()` reemplazado con `money(pedido.monto_total)` en el pie de la vista de detalle. |

### Detalle de la funcion money()

- Ubicacion: `minimarket-system/src/utils/currency.ts`
- Locale: `es-AR`
- Formato: 2 decimales fijos
- Ejemplo: `money(15000)` -> `$15.000,00`

## Verificacion

| Verificacion | Resultado |
|--------------|-----------|
| `rg "toLocaleString" Pedidos.tsx` | 0 instancias monetarias restantes |
| 5 reemplazos confirmados | Todas las instancias de formato monetario usan `money()` |
| Consistencia con el resto de la app | Confirmada (misma funcion usada en POS, Ventas, etc.) |

## Archivos Modificados

- `minimarket-system/src/pages/Pedidos.tsx`
