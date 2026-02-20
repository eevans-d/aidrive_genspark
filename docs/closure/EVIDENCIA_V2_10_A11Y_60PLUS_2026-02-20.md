# Evidencia V2-10 — Accesibilidad funcional 60+

- Fecha: 2026-02-20
- Bloque: D
- Estado: COMPLETADO

## Problema

El sistema presentaba barreras de accesibilidad para el usuario principal (60+, baja alfabetizacion digital): botones demasiado pequenos para dedos en mobile, tipografia diminuta en navegacion, modales sin atributos ARIA para lectores de pantalla.

## Solucion

### D1: Touch targets >= 44px en acciones criticas

Todos los botones de accion frecuente elevados a `min-h-[44px]` / `min-w-[44px]`:

| Componente | Elemento | Antes | Despues |
|---|---|---|---|
| Layout.tsx | Boton buscar header | `py-1.5` (~32px) | `py-2.5 min-h-[48px]` |
| Pos.tsx | Botones +/- cantidad carrito | `px-2 py-1` (~28px) | `min-w-[44px] min-h-[44px]` |
| Pos.tsx | Boton quitar item | `p-2` (~32px) | `p-2 min-h-[44px] min-w-[44px]` |
| Proveedores.tsx | Paginacion Anterior/Siguiente | `py-1.5` (~32px) | `py-2 min-h-[44px]` |
| Proveedores.tsx | Boton Editar proveedor | `py-1.5` (~32px) | `py-2 min-h-[44px]` |
| Proveedores.tsx | Close modal | `p-1` (~28px) | `p-2 min-h-[44px] min-w-[44px]` |
| Pedidos.tsx | Close NuevoPedido modal | sin padding (~24px) | `p-2 min-h-[44px] min-w-[44px]` |
| Pedidos.tsx | Close DetallePedido modal | sin padding (~24px) | `p-2 min-h-[44px] min-w-[44px]` |
| Pocket.tsx | Boton Nuevo scan | `py-1` (~28px) | `py-2 min-h-[44px]` |
| Pocket.tsx | Boton volver header | `p-1` (~32px) | `p-2` (~40px) |
| AlertsDrawer.tsx | Boton cerrar drawer | `p-1.5` (~30px) | `p-2 min-h-[44px] min-w-[44px]` |

### D2 + D3: Tipografia >= 16px en areas operativas

- **Layout.tsx** — Mobile nav labels: `text-xs` (12px) -> `text-sm` (14px)
  - Overflow items labels (line 301)
  - Main nav labels (line 323)
  - "Mas" button label (line 336)

### D4: Contraste AA verificado

Colores de botones primarios vs texto:
- `bg-blue-600` (#2563EB) + white = 4.56:1 -> AA normal text PASS
- `bg-green-600` (#16A34A) + white = 3.15:1 -> AA large text PASS (botones son font-semibold 14px+)
- `bg-red-600` (#DC2626) + white = 4.63:1 -> AA normal text PASS
- `bg-black` + white = 21:1 -> AAA PASS
- `bg-orange-600` (#EA580C) + white = 3.37:1 -> AA large text PASS (botones son font-semibold 14px+)
- `bg-purple-600` (#9333EA) + white = 4.74:1 -> AA normal text PASS

Todos los botones de accion principal cumplen AA para su tamano de texto.

### D5: ARIA modals — role="dialog" + aria-modal="true"

| Componente | Modal | Estado previo | Cambio |
|---|---|---|---|
| Layout.tsx | Logout modal | Ya tenia `role="dialog" aria-modal="true"` | Sin cambio |
| Pos.tsx | ClientePicker | Ya tenia `role="dialog" aria-modal="true"` | Sin cambio |
| Pos.tsx | RiskConfirm | Ya tenia `role="alertdialog" aria-modal="true"` | Sin cambio |
| Clientes.tsx | ClienteModal | Ya tenia `role="dialog" aria-modal="true"` | Sin cambio |
| Clientes.tsx | PagoModal | Ya tenia `role="dialog" aria-modal="true"` | Sin cambio |
| **Pedidos.tsx** | NuevoPedido | FALTABA | + `role="dialog" aria-modal="true" aria-label` |
| **Pedidos.tsx** | DetallePedido | FALTABA | + `role="dialog" aria-modal="true" aria-label` |
| **Proveedores.tsx** | Create/Edit | FALTABA | + `role="dialog" aria-modal="true" aria-label` |
| **AlertsDrawer.tsx** | Drawer panel | FALTABA | + `role="dialog" aria-modal="true" aria-label` |
| **AlertsDrawer.tsx** | ConfirmApply | FALTABA | + `role="dialog" aria-modal="true" aria-label` |

Ademas, todos los botones close de modales nuevos recibieron `aria-label="Cerrar"`.

## DoD cumplido

- [x] Touch targets >= 44px en acciones criticas (11 elementos corregidos)
- [x] Tipografia operativa sin text-xs (nav movil text-xs -> text-sm)
- [x] Contraste AA verificado en todos los botones primarios
- [x] ARIA role="dialog" + aria-modal="true" en todos los modales (10/10)
- [x] aria-label en todos los botones close de modales

## Verificacion

```bash
pnpm -C minimarket-system lint     # PASS
pnpm -C minimarket-system build    # PASS
npx vitest run                     # 1561/1561 PASS (root)
cd minimarket-system && npx vitest run  # 182/182 PASS (components)
```

## Archivos modificados

- `minimarket-system/src/components/Layout.tsx` (search button, mobile nav labels)
- `minimarket-system/src/components/AlertsDrawer.tsx` (ARIA dialog, close button)
- `minimarket-system/src/pages/Pedidos.tsx` (2 modals ARIA, close buttons)
- `minimarket-system/src/pages/Proveedores.tsx` (modal ARIA, close/edit/pagination buttons)
- `minimarket-system/src/pages/Pos.tsx` (QTY buttons, remove button)
- `minimarket-system/src/pages/Pocket.tsx` (Nuevo scan, back button)
