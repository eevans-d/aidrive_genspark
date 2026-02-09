# Evidencia de flujos (frontend) — Minimarket System

**Fuente:** revisión de JSX y hooks en `minimarket-system/src/pages/` y `minimarket-system/src/hooks/`.  
**Alcance:** alta producto, recepción, ajuste, cambio de precio, alerta stock.  
**Nota:** si no existe JSX para el flujo, se documenta como gap (no inferible por código).

---

## 1) Alta de producto

**Componentes/páginas detectadas**
- `Productos.tsx`: catálogo + detalle con historial de precios (solo lectura). No hay formulario de alta ni CTA de creación. 

**Hooks relacionados**
- `useProductos` (fetch de productos + historial). No existe hook de creación/alta. 

**Pasos/campos requeridos (JSX)**
- **N/A**: no hay formulario ni inputs para alta.

**Fricciones observadas**
- No hay UI para alta de producto en `Productos.tsx`. El flujo no se puede completar desde el frontend. 

**Quick wins**
- Agregar CTA “Nuevo producto” con formulario mínimo (nombre, categoría, código de barras, precio costo, precio venta) y mutación vía gateway.

---

## 2) Recepción de mercadería (entrada)

**Componentes/páginas detectadas**
- `Deposito.tsx`: formulario “Registrar Movimiento” con selección de tipo (entrada/salida), búsqueda/selección de producto, cantidad, proveedor (solo para entrada), observaciones y submit.

**Hooks relacionados**
- `Deposito.tsx` usa `useQuery` inline para dropdowns de productos y proveedores.
- `Deposito.tsx` usa `useMutation` con `depositoApi.movimiento` (gateway).
- `useDeposito` existe en hooks, pero no se utiliza en la página de depósito (solo fetch de stock/movimientos).

**Pasos/campos requeridos (JSX + validación local)**
1. Elegir tipo **Entrada** (default). 
2. Buscar producto (input) + seleccionar item del listado (requerido en submit). 
3. Ingresar **Cantidad** (input number con `required`).
4. (Opcional) Seleccionar Proveedor (solo entrada). 
5. (Opcional) Observaciones.
6. Submit “REGISTRAR MOVIMIENTO”.

**Fricciones observadas**
- No hay campo explícito para lote o comprobante de recepción (solo observaciones). 
- El motivo se autogenera (“Entrada proveedor {id}” / “Entrada manual”), sin posibilidad de editarlo en UI.

**Quick wins**
- Agregar campo “Lote” (si aplica) y “Comprobante/Remito” como inputs opcionales. 
- Permitir editar `motivo` cuando tipo=entrada (override manual).

---

## 3) Ajuste de stock

**Componentes/páginas detectadas**
- `Kardex.tsx`: muestra movimientos con resumen “Ajustes” (solo lectura). 
- `Deposito.tsx`: permite “Entrada” o “Salida”, pero **no** “Ajuste”.

**Hooks relacionados**
- `useKardex` calcula y devuelve cantidad de ajustes en resumen, pero no hay UI para registrarlos.

**Pasos/campos requeridos (JSX)**
- **N/A**: no existe formulario para registrar ajustes.

**Fricciones observadas**
- No se puede registrar ajuste (tipo `ajuste`) desde UI; solo se ve en Kardex si ya existe.

**Quick wins**
- Agregar tipo “Ajuste” en `Deposito.tsx` con campos mínimos: producto, cantidad (delta +/-), motivo obligatorio y observaciones.

---

## 4) Cambio de precio

**Componentes/páginas detectadas**
- `Productos.tsx`: muestra precio actual, precio costo, margen y **historial de precios**.

**Hooks relacionados**
- `useProductos` trae `precios_historicos` y `precio_actual`, pero no hay mutación para cambios.

**Pasos/campos requeridos (JSX)**
- **N/A**: no existe formulario ni CTA de cambio de precio.

**Fricciones observadas**
- No hay UI para registrar cambio de precio; solo lectura del historial.

**Quick wins**
- Agregar modal de actualización de precio (precio nuevo + fuente + observaciones) y mutación vía gateway con invalidación de `useProductos`.

---

## 5) Alerta de stock

**Componentes/páginas detectadas**
- `Stock.tsx`: tabla con filtros “Todos / Stock Bajo / Crítico” y badges de estado.
- `Dashboard.tsx`: muestra KPI de stock bajo (solo lectura).

**Hooks relacionados**
- `useStock` (fetch de stock y alertas agregadas).

**Pasos/campos requeridos (JSX)**
1. (Opcional) Seleccionar filtro de estado.
2. (Opcional) Exportar CSV.

**Fricciones observadas**
- Las alertas son solo visuales; no hay acción directa de reposición ni notificación/ack.

**Quick wins**
- Añadir CTA “Crear tarea de reposición” desde filas con stock bajo/crítico (vincular con flujo de `Tareas.tsx`).

---

## Observaciones generales (limitaciones de evidencia)
- No se puede inferir desde el JSX si el backend exige campos adicionales o validaciones server-side (no visible en estas páginas).
- No hay señales de roles/permisos en UI para estos flujos; la lógica puede estar en gateway o RLS.
