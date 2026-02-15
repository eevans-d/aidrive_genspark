> [DEPRECADO: 2026-02-13] Documento historico/referencial. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`, `docs/closure/OPEN_ISSUES.md`.

# CONTRATOS FRONTEND - BACKEND (mock + datos esperados)

**Objetivo:** definir contratos reales entre UI y Supabase, mas mocks sugeridos sin credenciales.
**Alcance:** paginas documentadas `Login`, `Dashboard`, `Deposito`, `Stock`, `Productos`, `Proveedores`, `Tareas`, `Kardex`, `Rentabilidad`.

---

## Variables de entorno (frontend)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_GATEWAY_URL`
- `VITE_USE_MOCKS`

---

## Autenticacion (Supabase Auth)
**Usos en UI:**
- `supabase.auth.getUser()` al iniciar.
- `supabase.auth.onAuthStateChange(...)` para cambios de sesion.
- `supabase.auth.signInWithPassword({ email, password })` en Login.
- `supabase.auth.signUp(...)` + insert en `personal` (registro).
- `supabase.auth.signOut()` en logout.

**Contrato esperado (resumen):**
- `User` con `id`, `email`, `app_metadata`, `user_metadata`.
- JWT valido para RLS en tablas.

**Mock sugerido (User):**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "email": "admin@minimarket.com",
  "app_metadata": { "role": "admin" },
  "user_metadata": { "nombre": "Admin" }
}
```

---

## Dashboard
**Consultas reales:**
- `tareas_pendientes`: `select('*')`, `eq('estado','pendiente')`, `order('prioridad', desc)`, `limit(5)`.
- `stock_deposito`: `select('*')`.
- `productos`: `select('id', { count: 'exact', head: true })`.

**Campos minimos usados:**
- `tareas_pendientes`: `id`, `titulo`, `descripcion`, `prioridad`, `estado`, `fecha_vencimiento`, `asignada_a_nombre`.
- `stock_deposito`: `cantidad_actual`, `stock_minimo`.
- `productos`: solo `count`.

**Mock sugerido:**
```json
{
  "tareas_pendientes": [
    { "id": "t1", "titulo": "Revisar stock", "prioridad": "urgente", "estado": "pendiente", "asignada_a_nombre": "Juan" }
  ],
  "stock_deposito": [
    { "id": "s1", "producto_id": "p1", "cantidad_actual": 3, "stock_minimo": 5 }
  ],
  "productos_count": 120
}
```

---

## Deposito
**Consultas reales:**
- Gateway: `GET /productos/dropdown` (campos: `id`, `nombre`, `codigo_barras`).
- Gateway: `GET /proveedores/dropdown` (campos: `id`, `nombre`).
- Gateway: `POST /deposito/movimiento` → server-side ejecuta `sp_movimiento_inventario(...)`.

**Payload gateway (`/deposito/movimiento`):**
- `producto_id`, `tipo` (alias: `tipo_movimiento`), `cantidad`, `motivo` (alias: `origen`), `destino`, `proveedor_id`, `observaciones`.

**RPC parametros (server-side):**
- `p_producto_id`, `p_tipo`, `p_cantidad`, `p_origen`, `p_destino`, `p_usuario`, `p_orden_compra_id`, `p_proveedor_id`, `p_observaciones`.

**Mock sugerido (RPC response):**
```json
{
  "producto_id": "p1",
  "tipo": "salida",
  "cantidad": 2,
  "stock_anterior": 5,
  "stock_nuevo": 3,
  "ubicacion": "Principal"
}
```

---

## Stock
**Consultas reales:**
- `stock_deposito`: `select('*')`, `order('cantidad_actual', asc)`.
- `productos`: `select('*')`, `in('id', ids)`.
- `stock_reservado`: `select('id,producto_id,cantidad,estado')`, `eq('estado','activa')`.
- `ordenes_compra`: `select('id,producto_id,cantidad,cantidad_recibida,estado')`, `in('estado',['pendiente','en_transito'])`.

**Campos minimos usados:**
- `stock_deposito`: `id`, `producto_id`, `cantidad_actual`, `stock_minimo`, `ubicacion`, `lote`.
- `productos`: `id`, `nombre`.
- `stock_reservado`: `producto_id`, `cantidad`.
- `ordenes_compra`: `producto_id`, `cantidad`, `cantidad_recibida`, `estado`.

**Mock sugerido (stock agregado):**
```json
{
  "id": "s1",
  "producto_id": "p1",
  "cantidad_actual": 10,
  "stock_minimo": 5,
  "ubicacion": "Principal",
  "reservado": 2,
  "disponible": 8,
  "transito": 3,
  "producto": { "id": "p1", "nombre": "Arroz 1kg" }
}
```

---

## Productos
**Consultas reales:**
- `productos`: `select('id,nombre,categoria,codigo_barras,precio_actual,precio_costo,proveedor_principal_id,margen_ganancia')`,
  `eq('activo', true)`, `order('nombre')`, `range(from, to)`, `count: 'exact'`.
- `proveedores`: `select('id,nombre,contacto,email,telefono,productos_ofrecidos,activo,created_at,updated_at')`,
  `in('id', proveedorIds)`, `eq('activo', true)`.
- `precios_historicos`: `select('id,producto_id,precio,fuente,fecha,cambio_porcentaje')`,
  `eq('producto_id', id)`, `order('fecha', desc)`, `limit(5)`.

**Mock sugerido:**
```json
{
  "id": "p1",
  "nombre": "Arroz 1kg",
  "categoria": "Almacen",
  "codigo_barras": "123456789",
  "precio_actual": 1000,
  "precio_costo": 700,
  "proveedor_principal_id": "prov1",
  "margen_ganancia": 30,
  "historial": [
    { "id": "h1", "producto_id": "p1", "precio": 950, "fuente": "manual", "fecha": "2026-01-01", "cambio_porcentaje": -5 }
  ],
  "proveedor": { "id": "prov1", "nombre": "Proveedor A", "activo": true }
}
```

---

## Proveedores
**Consultas reales:**
- `proveedores`: `select('id,nombre,contacto,email,telefono,productos_ofrecidos,activo,created_at,updated_at')`,
  `eq('activo', true)`, `order('nombre')`, `range(from, to)`, `count: 'exact'`.
- `productos`: `select('id,nombre,categoria,precio_actual,margen_ganancia,proveedor_principal_id')`,
  `in('proveedor_principal_id', ids)`, `eq('activo', true)`.

**Mock sugerido:**
```json
{
  "id": "prov1",
  "nombre": "Proveedor A",
  "contacto": "Juan Perez",
  "email": "ventas@proveedora.com",
  "telefono": "123456789",
  "productos_ofrecidos": ["Almacen"],
  "activo": true,
  "productos": [
    { "id": "p1", "nombre": "Arroz 1kg", "categoria": "Almacen", "precio_actual": 1000, "margen_ganancia": 30 }
  ]
}
```


---

## Kardex
**Consultas reales:**
- `movimientos_deposito`: `select('*, productos(nombre), proveedores(nombre)', { count: 'exact' })`,
  `order('fecha_movimiento', desc)`, `limit(200)`.
- Filtros opcionales en hook: `eq('producto_id', productoId)`, `gte('fecha_movimiento', fechaDesde)`, `lte('fecha_movimiento', fechaHasta)`.
- Gateway (dropdown productos): `GET /productos/dropdown` via `apiClient.productos.dropdown()`.

**Filtros UI (cliente):**
- `productoFiltro` se aplica localmente sobre `movimientos`.
- `loteFiltro` se filtra por substring en `mov.lote`.

**Campos minimos usados:**
- `movimientos_deposito`: `id`, `producto_id`, `tipo_movimiento`, `cantidad`, `fecha_movimiento`, `lote`, `motivo`, `observaciones`.
- `productos(nombre)` -> `producto_nombre`.
- `proveedores(nombre)` -> `proveedor_nombre` (mapeado en hook, no visible en UI actual).
- `resumen` (entradas/salidas/ajustes) se calcula en frontend.

**Mock sugerido:**
```json
{
  "movimientos": [
    {
      "id": "m1",
      "producto_id": "p1",
      "producto_nombre": "Arroz 1kg",
      "tipo_movimiento": "entrada",
      "cantidad": 5,
      "fecha_movimiento": "2026-01-20T10:00:00Z",
      "lote": "L-001",
      "motivo": "compra",
      "observaciones": "Ingreso inicial"
    },
    {
      "id": "m2",
      "producto_id": "p1",
      "producto_nombre": "Arroz 1kg",
      "tipo_movimiento": "salida",
      "cantidad": 2,
      "fecha_movimiento": "2026-01-21T09:00:00Z",
      "lote": "L-001",
      "motivo": "venta",
      "observaciones": "Venta mostrador"
    }
  ],
  "total": 2,
  "resumen": { "entradas": 1, "salidas": 1, "ajustes": 0 }
}
```

---

## Rentabilidad
**Consultas reales:**
- `productos`: `select('id,nombre,categoria,precio_actual,precio_costo,margen_ganancia', { count: 'exact' })`,
  `eq('activo', true)`, `not('precio_actual','is', null)`, `not('precio_costo','is', null)`,
  `order('margen_ganancia', desc)`.
- Gateway (dropdown proveedores): `GET /proveedores/dropdown` via `apiClient.proveedores.dropdown()`.
  Nota: el filtro por proveedor no se aplica aun (no hay `proveedor_id` en el hook).

**Campos minimos usados:**
- `productos`: `id`, `nombre`, `categoria`, `precio_actual`, `precio_costo`, `margen_ganancia`.
- `margen_porcentaje` se calcula en frontend: `(precio_actual - precio_costo) / precio_costo`.
- `promedios` se calcula en frontend (margen, precio promedio venta/costo).

**Mock sugerido:**
```json
{
  "productos": [
    {
      "id": "p1",
      "nombre": "Arroz 1kg",
      "categoria": "Almacen",
      "precio_actual": 1000,
      "precio_costo": 700,
      "margen_ganancia": 300,
      "margen_porcentaje": 42.9
    },
    {
      "id": "p2",
      "nombre": "Leche 1L",
      "categoria": "Lacteos",
      "precio_actual": 800,
      "precio_costo": 850,
      "margen_ganancia": -50,
      "margen_porcentaje": -5.9
    }
  ],
  "total": 2,
  "promedios": { "margenPromedio": 18.5, "precioPromedioVenta": 900, "precioPromedioCosto": 775 }
}
```

---

## Tareas
**Consultas reales:**
- `tareas_pendientes`: `select('*')`, `order('prioridad', desc)`, `order('created_at', desc)`.
- Gateway: `POST /tareas` para nueva tarea.
- Gateway: `PUT /tareas/:id/completar` para completar.
- Gateway: `PUT /tareas/:id/cancelar` para cancelar.

**Mock sugerido:**
```json
{
  "id": "t1",
  "titulo": "Revisar stock",
  "descripcion": "Verificar productos criticos",
  "prioridad": "urgente",
  "estado": "pendiente",
  "fecha_creacion": "2026-01-01T10:00:00Z"
}
```

---

## Modo mock sin credenciales (implementado)
- Flag `VITE_USE_MOCKS=true` en `minimarket-system/.env` activa el mock local sin Supabase real.
- Implementacion: `minimarket-system/src/lib/supabase.ts` selecciona `createMockSupabaseClient`.
- Fixtures actuales en `minimarket-system/src/mocks/data.ts` (ajustar si se necesita mas cobertura).
