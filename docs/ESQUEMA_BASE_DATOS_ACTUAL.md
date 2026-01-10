# Esquema de Base de Datos - Sistema Mini Market
**Actualizado:** 2025-10-31 (Post FASE 1)

## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Tablas principales** | 11 |
| **Total campos** | 120+ |
| **Índices custom** | 12 |
| **Constraints CHECK** | 40+ |
| **Foreign Keys** | 4 |
| **Tamaño total** | ~700 KB |

---

## 🗂️ Tablas del Sistema Mini Market

### 1️⃣ **categorias** (NUEVO - FASE 1) ✨
**Propósito:** Clasificación jerárquica de productos con márgenes sugeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| codigo | VARCHAR(20) | Código único (ej: ALI, BEB) |
| nombre | VARCHAR(100) | Nombre de la categoría |
| descripcion | TEXT | Descripción detallada |
| parent_id | UUID | FK auto-referencial para jerarquía |
| nivel | INTEGER | Nivel en la jerarquía (1, 2, 3...) |
| margen_minimo | DECIMAL(5,2) | Margen mínimo sugerido (%) |
| margen_maximo | DECIMAL(5,2) | Margen máximo sugerido (%) |
| activo | BOOLEAN | Estado de la categoría |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última modificación |

**Índices:**
- `idx_categorias_parent_id` (parcial: WHERE parent_id IS NOT NULL)
- `idx_categorias_activo` (parcial: WHERE activo = TRUE)
- `idx_categorias_codigo`

**Datos:** 6 categorías predeterminadas (ALI, BEB, LIM, HIG, BAZ, GEN)

---

### 2️⃣ **productos** (MEJORADO - FASE 1) ✨
**Propósito:** Catálogo de productos con información completa

| Campo | Tipo | Descripción | Estado |
|-------|------|-------------|--------|
| id | UUID | PK | Original |
| nombre | VARCHAR(255) | Nombre del producto | Original |
| descripcion | TEXT | Descripción | Original |
| codigo_barras | VARCHAR(100) | UNIQUE - EAN/UPC | **MEJORADO** |
| **sku** | VARCHAR(50) | Stock Keeping Unit único | **NUEVO** |
| **categoria_id** | UUID | FK → categorias(id) | **NUEVO** |
| **marca** | VARCHAR(100) | Marca comercial | **NUEVO** |
| **contenido_neto** | VARCHAR(50) | Contenido (ej: 500ml) | **NUEVO** |
| **dimensiones** | JSONB | {largo, ancho, alto, peso} | **NUEVO** |
| **activo** | BOOLEAN | Estado del producto | **NUEVO** |
| precio_sugerido | DECIMAL(12,2) | Precio sugerido de venta | Original |
| observaciones | TEXT | Observaciones generales | Original |
| created_at | TIMESTAMPTZ | Fecha de creación | Original |
| updated_at | TIMESTAMPTZ | Última modificación | Original |

**Índices nuevos:**
- `idx_productos_sku_unique` (UNIQUE parcial: WHERE sku IS NOT NULL)
- `idx_productos_categoria_id` (parcial: WHERE categoria_id IS NOT NULL)
- `idx_productos_dimensiones_gin` (GIN para búsqueda en JSONB)
- `idx_productos_activo` (parcial: WHERE activo = TRUE)

**Datos:** 8 productos migrados con categoria_id

---

### 3️⃣ **precios_proveedor** (scraping - vigente)
**Propósito:** Precios scrapeados de proveedores externos (Maxiconsumo Necochea y otros locales de la zona)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| sku | TEXT | SKU del proveedor |
| nombre | TEXT | Nombre del producto |
| marca | TEXT | Marca |
| categoria | TEXT | Categoría |
| precio_unitario | DECIMAL(12,2) | Precio unitario |
| precio_promocional | DECIMAL(12,2) | Precio promocional |
| precio_actual | DECIMAL(12,2) | Precio actual |
| precio_anterior | DECIMAL(12,2) | Precio anterior |
| stock_disponible | INTEGER | Stock informado |
| stock_nivel_minimo | INTEGER | Umbral de stock |
| codigo_barras | TEXT | Código de barras |
| url_producto | TEXT | URL del producto |
| imagen_url | TEXT | URL de imagen |
| descripcion | TEXT | Descripción |
| hash_contenido | TEXT | Hash para detectar cambios |
| score_confiabilidad | NUMERIC(5,2) | Score de confiabilidad |
| ultima_actualizacion | TIMESTAMPTZ | Última actualización |
| fuente | TEXT | Origen del scraping |
| activo | BOOLEAN | Estado |
| metadata | JSONB | Datos extra |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última modificación |

**Índices actuales:**
- `idx_precios_proveedor_sku` (UNIQUE)
- `idx_precios_proveedor_fuente`
- `idx_precios_proveedor_categoria`
- `idx_precios_proveedor_activo`

**Nota:** Esta tabla NO representa precios de compra internos.

#### **precios_compra_proveedor** (pendiente)
**Propósito:** Gestión de precios de compra vigentes e históricos por proveedor (cuando se habilite la carga interna)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| producto_id | UUID | FK → productos(id) ON DELETE CASCADE |
| proveedor_id | UUID | FK → proveedores(id) ON DELETE CASCADE |
| precio_compra | DECIMAL(12,2) | Precio de compra actual |
| precio_anterior | DECIMAL(12,2) | Precio anterior (para comparación) |
| fecha_vigencia_desde | TIMESTAMPTZ | Inicio de vigencia |
| fecha_vigencia_hasta | TIMESTAMPTZ | Fin de vigencia (NULL si vigente) |
| moneda | VARCHAR(3) | Moneda (ARS, USD, etc.) |
| es_precio_vigente | BOOLEAN | TRUE solo para precio actual |
| descuento_volumen | JSONB | [{cantidad_min, descuento_%}] |
| condiciones_pago | VARCHAR(100) | Términos de pago |
| tiempo_entrega_dias | INTEGER | SLA de entrega |
| cantidad_minima_pedido | INTEGER | MOQ |
| notas | TEXT | Observaciones |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última modificación |

**Índices sugeridos:**
- `idx_precios_compra_proveedor_vigente_unico` (UNIQUE parcial: solo 1 precio vigente por producto-proveedor)
- `idx_precios_compra_proveedor_producto`
- `idx_precios_compra_proveedor_proveedor`
- `idx_precios_compra_proveedor_fecha_vigencia`
- `idx_precios_compra_proveedor_descuento_gin` (GIN)

**Constraint destacado:** Solo puede haber 1 precio vigente por combinación producto-proveedor

---

### 4️⃣ **proveedores**
**Propósito:** Información de proveedores

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| nombre | VARCHAR(255) | Razón social |
| cuit | VARCHAR(11) | CUIT/CUIL |
| telefono | VARCHAR(50) | Teléfono de contacto |
| email | VARCHAR(255) | Email |
| direccion | TEXT | Dirección física |
| activo | BOOLEAN | Estado del proveedor |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Última modificación |

---

### 5️⃣ **stock_deposito**
**Propósito:** Inventario actual por producto

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| producto_id | UUID | FK → productos(id) |
| cantidad_actual | INTEGER | Stock actual |
| stock_minimo | INTEGER | Punto de reorden |
| stock_maximo | INTEGER | Stock máximo sugerido |
| ubicacion | VARCHAR(50) | Ubicación física |
| lote | VARCHAR(50) | Número de lote |
| fecha_vencimiento | DATE | Fecha de vencimiento |
| created_at | TIMESTAMPTZ | Fecha de creación |

---

### 6️⃣ **movimientos_deposito**
**Propósito:** Historial de movimientos de inventario

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| producto_id | UUID | FK → productos(id) |
| tipo_movimiento | VARCHAR(20) | ENTRADA, SALIDA, AJUSTE |
| cantidad | INTEGER | Cantidad movida |
| cantidad_anterior | INTEGER | Stock antes del movimiento |
| cantidad_nueva | INTEGER | Stock después del movimiento |
| motivo | TEXT | Razón del movimiento |
| usuario_id | UUID | Usuario responsable |
| proveedor_id | UUID | Proveedor (si aplica) |
| fecha | TIMESTAMPTZ | Fecha del movimiento |
| observaciones | TEXT | Notas adicionales |
| created_at | TIMESTAMPTZ | Fecha de registro |

---

### 7️⃣ **precios_historicos**
**Propósito:** Historial de precios de venta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| producto_id | UUID | FK → productos(id) |
| precio_anterior | DECIMAL(12,2) | Precio viejo |
| precio_nuevo | DECIMAL(12,2) | Precio nuevo |
| fecha_cambio | TIMESTAMPTZ | Fecha del cambio |
| usuario_id | UUID | Usuario que modificó |
| created_at | TIMESTAMPTZ | Fecha de registro |

---

### 8️⃣ **productos_faltantes**
**Propósito:** Lista de productos a reponer

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| producto_id | UUID | FK → productos(id) |
| cantidad_faltante | INTEGER | Cantidad a reponer |
| prioridad | VARCHAR(20) | ALTA, MEDIA, BAJA |
| estado | VARCHAR(20) | PENDIENTE, EN_PROCESO, RESUELTO |
| fecha_deteccion | TIMESTAMPTZ | Cuándo se detectó |
| fecha_resolucion | TIMESTAMPTZ | Cuándo se resolvió |
| notas | TEXT | Observaciones |
| proveedor_sugerido_id | UUID | Proveedor sugerido |
| precio_estimado | DECIMAL(12,2) | Precio estimado |
| cantidad_pedida | INTEGER | Cantidad solicitada |
| created_at | TIMESTAMPTZ | Fecha de creación |

---

### 9️⃣ **tareas_pendientes**
**Propósito:** Sistema de tareas y seguimiento

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| tipo | VARCHAR(50) | Tipo de tarea |
| prioridad | VARCHAR(20) | ALTA, MEDIA, BAJA |
| estado | VARCHAR(20) | PENDIENTE, EN_PROCESO, COMPLETADA |
| titulo | VARCHAR(255) | Título de la tarea |
| descripcion | TEXT | Descripción detallada |
| datos | JSONB | Datos adicionales |
| asignado_a_id | UUID | Usuario asignado |
| completado_por_id | UUID | Usuario que completó |
| fecha_creacion | TIMESTAMPTZ | Fecha de creación |
| fecha_vencimiento | TIMESTAMPTZ | Fecha límite |
| fecha_completado | TIMESTAMPTZ | Fecha de completitud |
| (+ más campos) |  | Total 20 campos |

**Nota:** En el repo aparecen variantes `asignada_a_*` y `fecha_completada` (frontend/funciones). La migracion agrega ambas variantes y la vista `tareas_metricas` expone `asignado_a_id`/`fecha_completado` para compatibilidad.

---

### 🔟 **notificaciones_tareas**
**Propósito:** Notificaciones del sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| tarea_id | UUID | FK → tareas_pendientes(id) |
| usuario_id | UUID | Destinatario |
| tipo | VARCHAR(50) | Tipo de notificación |
| mensaje | TEXT | Mensaje |
| leida | BOOLEAN | Estado de lectura |
| fecha_envio | TIMESTAMPTZ | Cuándo se envió |
| fecha_lectura | TIMESTAMPTZ | Cuándo se leyó |
| canal | VARCHAR(20) | EMAIL, SMS, PUSH, SISTEMA |
| created_at | TIMESTAMPTZ | Fecha de creación |

---

### 1️⃣1️⃣ **personal**
**Propósito:** Gestión de personal del mini market

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| auth_user_id | UUID | FK → auth.users(id) UNIQUE |
| nombre_completo | VARCHAR(255) | Nombre y apellido |
| dni | VARCHAR(8) | DNI |
| telefono | VARCHAR(50) | Teléfono |
| email | VARCHAR(255) | Email |
| rol | VARCHAR(50) | Rol/Puesto |
| fecha_ingreso | DATE | Fecha de ingreso |
| activo | BOOLEAN | Estado laboral |
| direccion | TEXT | Dirección |
| created_at | TIMESTAMPTZ | Fecha de creación |

---

## 🔗 Diagrama de Relaciones

```
┌────────────────┐
│  categorias    │
│  (parent_id)   │──┐
└────────┬───────┘  │ (auto-referencial)
         │          │
         │          └──────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐         ┌────────────────┐
│   productos     │         │  subcategorías │
│                 │         └────────────────┘
│ - categoria_id  │
│ - sku (UNIQUE)  │
│ - codigo_barras │
└────────┬────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌──────────────────┐      ┌────────────────────┐
│ stock_deposito   │      │ precios_proveedor  │
│                  │      │                    │
│ - cantidad_actual│      │ - precio_compra    │
│ - stock_minimo   │      │ - es_precio_vigente│◄────┐
└─────────┬────────┘      └──────────┬─────────┘     │
          │                          │               │
          │                          │               │
          ▼                          ▼               │
┌──────────────────┐      ┌────────────────────┐    │
│ movimientos_     │      │   proveedores      │────┘
│ deposito         │      │                    │
│                  │      │ - nombre           │
│ - tipo_movimiento│      │ - cuit             │
│ - cantidad       │      │ - activo           │
└──────────────────┘      └────────────────────┘
          │
          │
          ▼
┌──────────────────┐
│ productos_       │
│ faltantes        │
│                  │
│ - prioridad      │
│ - estado         │
└──────────────────┘
          │
          ▼
┌──────────────────┐
│ tareas_          │
│ pendientes       │
│                  │
│ - tipo           │
│ - prioridad      │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│ notificaciones_  │
│ tareas           │
│                  │
│ - leida          │
└──────────────────┘
```

---

## 📈 Mejoras FASE 1

### Nuevas Capacidades

✅ **Categorización jerárquica**
- Márgenes sugeridos por categoría
- Organización multi-nivel
- 6 categorías predeterminadas

✅ **Productos enriquecidos**
- SKU único por producto
- Código de barras UNIQUE
- Marca y contenido neto
- Dimensiones en JSONB
- Relación con categorías

✅ **Gestión avanzada de precios**
- Separación precio vigente vs. histórico
- Solo 1 precio vigente por producto-proveedor (constraint)
- Descuentos por volumen (JSONB)
- Condiciones de pago y SLA
- Historial completo de precios

---

## 🎯 Índices Estratégicos

### Índices Únicos
- `productos.codigo_barras` (UNIQUE)
- `productos.sku` (UNIQUE parcial)
- `categorias.codigo` (UNIQUE)
- `precios_proveedor.(producto_id, proveedor_id)` (UNIQUE parcial WHERE vigente)

### Índices Parciales (Optimizados)
- Solo registros activos
- Solo valores no NULL
- Solo precios vigentes

### Índices GIN (JSONB)
- `productos.dimensiones`
- `precios_proveedor.descuento_volumen`

**Total:** 12 índices custom + PKs/FKs automáticos

---

## 🔒 Constraints de Integridad

### CHECK Constraints
- Precios >= 0
- Cantidades >= 0
- Márgenes 0-100%
- Vigencia coherente (hasta > desde)
- Estados válidos (ENUM-like)

### Foreign Keys
- `productos.categoria_id` → `categorias.id`
- `precios_proveedor.producto_id` → `productos.id`
- `precios_proveedor.proveedor_id` → `proveedores.id`
- `categorias.parent_id` → `categorias.id`

**Total:** 40+ CHECK constraints, 4 FKs

---

## 📊 Tamaños de Tablas

| Tabla | Tamaño | Campos | Registros |
|-------|--------|--------|-----------|
| categorias | 88 KB | 11 | 6 |
| productos | 104 KB | 16 | 8 |
| precios_proveedor | 112 KB | 16 | 2 |
| proveedores | 32 KB | 9 | ~3 |
| stock_deposito | 24 KB | 9 | ~8 |
| movimientos_deposito | 32 KB | 11 | Variable |
| precios_historicos | 24 KB | 7 | Variable |
| productos_faltantes | 16 KB | 11 | Variable |
| tareas_pendientes | 32 KB | 20 | Variable |
| notificaciones_tareas | 32 KB | 9 | Variable |
| personal | 48 KB | 11 | ~3 |

**Total aproximado:** ~700 KB

---

## 🚀 Próximas Fases

### FASE 2: Tablas Transaccionales
- [ ] pedidos
- [ ] detalle_pedidos
- [ ] proveedor_performance

### FASE 3: Auditoría Particionada
- [ ] price_history (particionada por mes)
- [ ] stock_auditoria (particionada por mes)
- [ ] movimientos_auditoria (particionada por mes)

### FASE 4: Índices Avanzados
- [ ] Índices compuestos adicionales
- [ ] Índices de texto completo (FTS)
- [ ] Índices estadísticos

### FASE 5: Funciones y Triggers
- [ ] fnc_precio_vigente()
- [ ] sp_aplicar_precio()
- [ ] fnc_stock_disponible()
- [ ] Triggers de auditoría automática
- [ ] Triggers de updated_at

### FASE 6: Vistas
- [ ] v_inventario_actual
- [ ] v_stock_minimos
- [ ] v_kpis_operativos
- [ ] Vistas materializadas

---

## 📝 Notas Técnicas

### Performance
- Índices parciales reducen tamaño en ~40%
- GIN permite búsquedas O(log n) en JSONB
- Constraints a nivel DB (no en aplicación)

### Escalabilidad
- Particionamiento preparado para FASE 3
- JSONB para datos semi-estructurados
- UUIDs para IDs distribuidos

### Mantenibilidad
- Comentarios en todas las tablas
- Nombres descriptivos
- Estructura normalizada (3FN)

---

**Última actualización:** 2025-10-31  
**Versión:** Post-FASE 1  
**Estado:** Producción estable
