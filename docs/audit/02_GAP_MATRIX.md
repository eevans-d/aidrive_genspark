# Gap Matrix — Flujos críticos (frontend)

**Fuente:** JSX + hooks en `minimarket-system/src/pages/` y `minimarket-system/src/hooks/`.

| Flujo | Soporte UI actual | Evidencia en código | Fricciones/Gaps | Quick wins concretos |
|---|---|---|---|---|
| Alta producto | ❌ No implementado | `Productos.tsx` es solo lectura; no hay formulario ni hook de creación. | Imposible dar de alta desde frontend. | CTA “Nuevo producto” + formulario mínimo y mutación vía gateway. |
| Recepción (entrada) | ✅ Parcial | `Deposito.tsx` permite “Entrada” y guarda vía `depositoApi.movimiento`. | Sin lote/comprobante; motivo autogenerado no editable. | Agregar campos “Lote/Remito” y override de motivo en entrada. |
| Ajuste de stock | ❌ No implementado | `useKardex` incluye `ajustes` en resumen; UI no permite crear ajustes. | No se puede registrar ajuste en UI. | Agregar tipo “Ajuste” con motivo obligatorio y delta +/- en `Deposito.tsx`. |
| Cambio de precio | ❌ No implementado | `Productos.tsx` muestra historial, pero sin CTA ni mutación. | Sin flujo para actualizar precio, solo lectura. | Modal de cambio de precio (precio, fuente, observaciones) + invalidación `useProductos`. |
| Alerta stock | ✅ Parcial | `Stock.tsx` muestra badges y filtros; `Dashboard.tsx` solo KPI. | Alertas solo visuales; sin acción directa. | CTA “Crear tarea de reposición” desde tabla (integra `Tareas.tsx`). |

## Notas de evidencia
- La validación server-side y restricciones de roles no se deducen desde JSX/hook (no visible en estas páginas).
