# Esquema de Base de Datos - Sistema Mini Market

**Actualizado:** 2026-02-27 (sincronizado contra `supabase/migrations/*.sql`)
**Migraciones:** 52/52 sincronizadas (local = remoto)
**Fuente de verdad:** `supabase/migrations/*.sql` (este documento es derivado)

---

## Resumen Ejecutivo

| Metrica | Valor |
|---------|-------|
| Tablas | 44 |
| Vistas no materializadas | 11 |
| Vistas materializadas | 3 |
| Funciones/Stored Procedures | 30+ |
| Triggers | 4 |
| Migraciones | 52 |

---

## Indice de Tablas por Grupo Funcional

| Grupo | Tablas |
|-------|--------|
| Core: Catalogo | categorias, productos, proveedores |
| Core: Inventario | stock_deposito, movimientos_deposito, stock_reservado, ordenes_compra |
| Core: Precios | precios_historicos, precios_proveedor |
| Operaciones: Clientes/Pedidos | clientes, pedidos, detalle_pedidos |
| Operaciones: POS/Ventas | ventas, venta_items, cuentas_corrientes_movimientos |
| Operaciones: Varios | productos_faltantes, ofertas_stock, bitacora_turnos |
| Gestion: Tareas | tareas_pendientes, notificaciones_tareas |
| Gestion: Personal | personal |
| Proveedor/Scraper | cache_proveedor, configuracion_proveedor, estadisticas_scraping, comparacion_precios, alertas_cambios_precios |
| Cron Jobs | cron_jobs_tracking, cron_jobs_execution_log, cron_jobs_alerts, cron_jobs_notifications, cron_jobs_metrics, cron_jobs_monitoring_history, cron_jobs_health_checks, cron_jobs_config, cron_jobs_notification_preferences, cron_jobs_locks |
| OCR/Facturas | facturas_ingesta, facturas_ingesta_items, facturas_ingesta_eventos, producto_aliases, precios_compra, supplier_profiles |
| Infraestructura | rate_limit_state, circuit_breaker_state |

---

## 1. Core: Catalogo

### categorias

Clasificacion jerarquica de productos con margenes sugeridos.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| codigo | text | NULL | | |
| nombre | text | NOT NULL | | |
| descripcion | text | NULL | | |
| parent_id | uuid | NULL | | FK -> categorias(id) ON DELETE SET NULL |
| nivel | integer | NULL | 1 | |
| margen_minimo | numeric(5,2) | NULL | 0 | |
| margen_maximo | numeric(5,2) | NULL | 100 | |
| activo | boolean | NULL | true | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_categorias_parent_id(parent_id)`, `idx_categorias_codigo(codigo)`, `idx_categorias_activo(activo)`
**RLS:** ENABLED. Policies: SELECT (todos los roles), INSERT/UPDATE/DELETE (admin, deposito).

---

### productos

Catalogo de productos con pricing integrado.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| nombre | text | NOT NULL | | |
| descripcion | text | NULL | | |
| categoria | text | NULL | | Legacy (texto libre) |
| categoria_id | uuid | NULL | | FK -> categorias(id) ON DELETE SET NULL |
| marca | text | NULL | | |
| contenido_neto | text | NULL | | |
| dimensiones | jsonb | NULL | | |
| codigo_barras | text | NULL | | |
| sku | text | NULL | | |
| precio_actual | numeric(12,2) | NOT NULL | 0 | Constraint NOT NULL (mig 20260212) |
| precio_costo | numeric(12,2) | NULL | | |
| precio_sugerido | numeric(12,2) | NULL | | |
| margen_ganancia | numeric(5,2) | NULL | | |
| proveedor_principal_id | uuid | NULL | | FK -> proveedores(id) ON DELETE SET NULL |
| observaciones | text | NULL | | |
| activo | boolean | NULL | true | |
| created_by | uuid | NULL | | |
| updated_by | uuid | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_productos_categoria_id`, `idx_productos_proveedor_principal_id`, `idx_productos_activo`, `idx_productos_nombre`
**RLS:** ENABLED. Policies: SELECT (todos los roles), INSERT/UPDATE/DELETE (staff).

---

### proveedores

Informacion de proveedores.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| nombre | text | NOT NULL | | |
| contacto | text | NULL | | |
| email | text | NULL | | |
| telefono | text | NULL | | |
| productos_ofrecidos | text[] | NULL | | Array de nombres |
| direccion | text | NULL | | |
| cuit | text | NULL | | |
| sitio_web | text | NULL | | |
| activo | boolean | NULL | true | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_proveedores_nombre`, `idx_proveedores_activo`
**RLS:** ENABLED. Policies: SELECT (todos), INSERT/UPDATE/DELETE (admin, deposito).

---

## 2. Core: Inventario

### stock_deposito

Inventario actual por producto y ubicacion.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NULL | | FK -> productos(id) ON DELETE CASCADE |
| cantidad_actual | integer | NULL | 0 | CHECK >= 0 (`stock_no_negativo`) |
| stock_minimo | integer | NULL | 0 | |
| stock_maximo | integer | NULL | 0 | |
| ubicacion | text | NULL | 'Principal' | |
| lote | text | NULL | | |
| fecha_vencimiento | date | NULL | | |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_stock_deposito_producto_id`, `idx_stock_deposito_ubicacion`, `idx_stock_deposito_producto_ubicacion(producto_id, ubicacion) UNIQUE`
**RLS:** ENABLED. Policies: SELECT (todos).

---

### movimientos_deposito

Historial de movimientos de inventario (kardex).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NULL | | FK -> productos(id) ON DELETE SET NULL |
| tipo_movimiento | text | NOT NULL | | ENTRADA, SALIDA, AJUSTE, venta |
| cantidad | integer | NOT NULL | | |
| cantidad_anterior | integer | NULL | | |
| cantidad_nueva | integer | NULL | | |
| motivo | text | NULL | | |
| usuario_id | uuid | NULL | | |
| proveedor_id | uuid | NULL | | FK -> proveedores(id) ON DELETE SET NULL |
| observaciones | text | NULL | | |
| factura_ingesta_item_id | uuid | NULL | | FK -> facturas_ingesta_items(id) ON DELETE SET NULL |
| fecha_movimiento | timestamptz | NULL | now() | |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_movimientos_deposito_producto_id`, `idx_movimientos_deposito_fecha_movimiento(fecha_movimiento DESC)`, `idx_movimientos_deposito_tipo`, `idx_movimientos_factura_item(factura_ingesta_item_id) WHERE NOT NULL`, `uq_movimientos_factura_item_idempotent(factura_ingesta_item_id) UNIQUE WHERE NOT NULL`
**RLS:** ENABLED. Policies: SELECT (todos), INSERT (admin, deposito).

---

### stock_reservado

Reservas de stock para pedidos en curso.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NOT NULL | | FK -> productos(id) ON DELETE RESTRICT |
| cantidad | integer | NOT NULL | | |
| estado | text | NULL | 'activa' | |
| referencia | text | NULL | | |
| usuario | uuid | NULL | | |
| fecha_reserva | timestamptz | NULL | | |
| fecha_cancelacion | timestamptz | NULL | | |
| created_at | timestamptz | NULL | now() | |
| idempotency_key | text | NULL | | Agregado en mig 20260204 |

**Indices:** `idx_stock_reservado_producto_estado(producto_id, estado)`, `idx_stock_reservado_idempotency_key(idempotency_key) UNIQUE PARTIAL WHERE NOT NULL`
**RLS:** ENABLED. Policies: SELECT (authenticated, permiso abierto).

---

### ordenes_compra

Ordenes de compra a proveedores.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NOT NULL | | FK -> productos(id) ON DELETE RESTRICT |
| proveedor_id | uuid | NULL | | FK -> proveedores(id) ON DELETE SET NULL |
| cantidad | integer | NOT NULL | | |
| cantidad_recibida | integer | NULL | 0 | |
| estado | text | NULL | 'pendiente' | |
| fecha_creacion | timestamptz | NULL | now() | |
| fecha_estimada | timestamptz | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_ordenes_compra_producto_estado(producto_id, estado)`, `idx_ordenes_compra_proveedor_id`
**RLS:** ENABLED. Policies: SELECT (todos), INSERT/UPDATE/DELETE (admin, ventas).

---

## 3. Core: Precios

### precios_historicos

Historial de cambios de precios de venta.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NULL | | FK -> productos(id) ON DELETE CASCADE |
| precio_anterior | numeric(12,2) | NULL | | |
| precio_nuevo | numeric(12,2) | NULL | | |
| fecha_cambio | timestamptz | NULL | now() | |
| motivo_cambio | text | NULL | | |
| usuario_id | uuid | NULL | | |
| fecha | timestamptz | NULL | | Legacy (no usado, drift residual) |
| cambio_porcentaje | numeric(7,2) | NULL | | |
| created_at | timestamptz | NULL | now() | |

**Nota:** Columnas `precio` y `fuente` eliminadas en mig 20260213. Columna `fecha` es residual (legacy, no usada por codigo activo).
**Indices:** `idx_precios_historicos_producto_id`, `idx_precios_historicos_fecha_cambio(fecha_cambio DESC)`
**RLS:** ENABLED. Policies: SELECT (todos).

---

### precios_proveedor

Precios scrapeados de proveedores externos (Maxiconsumo, otros).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| sku | text | NOT NULL | | UNIQUE |
| nombre | text | NULL | | |
| marca | text | NULL | | |
| categoria | text | NULL | | |
| precio_unitario | numeric(12,2) | NULL | | |
| precio_promocional | numeric(12,2) | NULL | | |
| precio_actual | numeric(12,2) | NULL | | |
| precio_anterior | numeric(12,2) | NULL | | |
| stock_disponible | integer | NULL | | |
| stock_nivel_minimo | integer | NULL | | |
| codigo_barras | text | NULL | | |
| url_producto | text | NULL | | |
| imagen_url | text | NULL | | |
| descripcion | text | NULL | | |
| hash_contenido | text | NULL | | Hash para detectar cambios |
| score_confiabilidad | numeric(5,2) | NULL | | |
| ultima_actualizacion | timestamptz | NULL | | |
| fuente | text | NULL | | Origen del scraping |
| activo | boolean | NULL | true | |
| metadata | jsonb | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_precios_proveedor_sku UNIQUE`, `idx_precios_proveedor_fuente`, `idx_precios_proveedor_categoria`, `idx_precios_proveedor_activo`, `idx_proveedor_cb(codigo_barras)`
**RLS:** ENABLED (mig 20260216040000). Sin policies (acceso solo via service_role).

---

## 4. Operaciones: Clientes/Pedidos

### clientes

Clientes recurrentes del mini market.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| nombre | text | NOT NULL | | |
| telefono | text | NULL | | |
| email | text | NULL | | |
| direccion_default | text | NULL | | |
| edificio | text | NULL | | |
| piso | text | NULL | | |
| departamento | text | NULL | | |
| observaciones | text | NULL | | |
| activo | boolean | NULL | true | |
| limite_credito | numeric(12,2) | NULL | | Agregado en mig 20260207010000 |
| whatsapp_e164 | text | NULL | | Agregado en mig 20260207010000 |
| link_pago | text | NULL | | Agregado en mig 20260207010000 |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | Trigger `set_clientes_updated_at` |

**Indices:** `idx_clientes_nombre`, `idx_clientes_telefono PARTIAL WHERE NOT NULL`, `idx_clientes_activo PARTIAL WHERE activo = TRUE`
**Trigger:** `clientes_limite_credito_only_admin` (solo admin puede modificar `limite_credito`)
**RLS:** ENABLED. Policies finales (mig 20260212130000): SELECT/INSERT/UPDATE (admin, ventas), DELETE (admin).

---

### pedidos

Registro de pedidos con estados y pagos.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| numero_pedido | SERIAL | | | Secuencial legible |
| cliente_id | uuid | NULL | | FK -> clientes(id) |
| cliente_nombre | text | NOT NULL | | |
| cliente_telefono | text | NULL | | |
| tipo_entrega | text | NULL | | retiro, domicilio |
| direccion_entrega | text | NULL | | |
| edificio | text | NULL | | |
| piso | text | NULL | | |
| departamento | text | NULL | | |
| horario_entrega_preferido | text | NULL | | |
| estado | text | NULL | | pendiente, preparando, listo, entregado, cancelado |
| estado_pago | text | NULL | | pendiente, parcial, pagado |
| monto_total | numeric(12,2) | NULL | 0 | |
| monto_pagado | numeric(12,2) | NULL | 0 | |
| observaciones | text | NULL | | Visibles para el cliente |
| observaciones_internas | text | NULL | | Solo personal |
| audio_url | text | NULL | | |
| transcripcion_texto | text | NULL | | |
| creado_por_id | uuid | NULL | | FK -> auth.users(id) |
| preparado_por_id | uuid | NULL | | FK -> auth.users(id) |
| entregado_por_id | uuid | NULL | | FK -> auth.users(id) |
| fecha_pedido | timestamptz | NULL | now() | |
| fecha_entrega_estimada | timestamptz | NULL | | |
| fecha_preparado | timestamptz | NULL | | |
| fecha_entregado | timestamptz | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_pedidos_numero(numero_pedido DESC)`, `idx_pedidos_estado`, `idx_pedidos_estado_pago`, `idx_pedidos_fecha(fecha_pedido DESC)`, `idx_pedidos_cliente_id PARTIAL WHERE NOT NULL`, `idx_pedidos_creado_por`, `idx_pedidos_estado_fecha(estado, fecha_pedido DESC) COMPOSITE`
**RLS:** ENABLED. Policies (mig 20260212130000): SELECT/INSERT/UPDATE (admin, deposito, ventas), DELETE (admin).

---

### detalle_pedidos

Items individuales de cada pedido.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| pedido_id | uuid | NOT NULL | | FK -> pedidos(id) ON DELETE CASCADE |
| producto_id | uuid | NULL | | FK -> productos(id) |
| producto_nombre | text | NULL | | Snapshot al momento del pedido |
| producto_sku | text | NULL | | |
| cantidad | integer | NOT NULL | | CHECK > 0 |
| precio_unitario | numeric(12,2) | NULL | | |
| subtotal | numeric(12,2) | NULL | | GENERATED: cantidad * precio_unitario (STORED) |
| observaciones | text | NULL | | |
| preparado | boolean | NULL | false | |
| preparado_por_id | uuid | NULL | | |
| fecha_preparado | timestamptz | NULL | | |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_detalle_pedidos_pedido`, `idx_detalle_pedidos_producto PARTIAL WHERE NOT NULL`, `idx_detalle_pedidos_preparado`
**RLS:** ENABLED. Policies (mig 20260212130000): SELECT/INSERT/UPDATE (admin, deposito, ventas), DELETE (admin).

---

## 5. Operaciones: POS/Ventas

### ventas

Ventas realizadas por POS.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| idempotency_key | text | NOT NULL | | UNIQUE |
| usuario_id | uuid | NOT NULL | | |
| cliente_id | uuid | NULL | | FK -> clientes(id) ON DELETE SET NULL |
| metodo_pago | text | NOT NULL | | efectivo, tarjeta, cuenta_corriente |
| monto_total | numeric(12,2) | NOT NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_ventas_idempotency_key UNIQUE`, `idx_ventas_created_at(created_at DESC)`, `idx_ventas_cliente_id`
**RLS:** ENABLED. Policies: SELECT (admin, ventas).

---

### venta_items

Items individuales de cada venta POS.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| venta_id | uuid | NOT NULL | | FK -> ventas(id) ON DELETE CASCADE |
| producto_id | uuid | NOT NULL | | FK -> productos(id) ON DELETE RESTRICT |
| producto_nombre_snapshot | text | NOT NULL | | Snapshot al momento |
| producto_sku_snapshot | text | NULL | | |
| cantidad | integer | NOT NULL | | CHECK > 0 |
| precio_unitario | numeric(12,2) | NOT NULL | | CHECK >= 0 |
| subtotal | numeric(12,2) | NOT NULL | | CHECK >= 0 |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_venta_items_venta_id`, `idx_venta_items_producto_id`
**RLS:** ENABLED. Policies: SELECT (admin, ventas).

---

### cuentas_corrientes_movimientos

Ledger de cuenta corriente (cargos y pagos por cliente).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| cliente_id | uuid | NOT NULL | | FK -> clientes(id) ON DELETE CASCADE |
| venta_id | uuid | NULL | | FK -> ventas(id) ON DELETE SET NULL |
| usuario_id | uuid | NOT NULL | | |
| tipo | text | NOT NULL | | CHECK IN ('cargo','pago','ajuste') |
| monto | numeric(12,2) | NOT NULL | | |
| descripcion | text | NULL | | |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_cc_mov_cliente_id`, `idx_cc_mov_created_at(created_at DESC)`, `idx_cc_mov_venta_id`
**RLS:** ENABLED. Policies: SELECT (admin, ventas).

---

## 6. Operaciones: Varios

### productos_faltantes

Lista de productos a reponer.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NULL | | FK -> productos(id) ON DELETE SET NULL |
| producto_nombre | text | NULL | | |
| fecha_reporte | timestamptz | NULL | now() | |
| reportado_por_id | uuid | NULL | | |
| reportado_por_nombre | text | NULL | | |
| proveedor_asignado_id | uuid | NULL | | FK -> proveedores(id) ON DELETE SET NULL |
| resuelto | boolean | NULL | false | |
| fecha_resolucion | timestamptz | NULL | | |
| observaciones | text | NULL | | |
| cantidad_faltante | integer | NULL | | |
| prioridad | text | NULL | | |
| estado | text | NULL | | |
| fecha_deteccion | timestamptz | NULL | | |
| cantidad_pedida | integer | NULL | | |
| precio_estimado | numeric(12,2) | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_productos_faltantes_producto_id`, `idx_productos_faltantes_resuelto`
**RLS:** ENABLED. Policies: SELECT/INSERT (todos), UPDATE/DELETE (staff).

---

### ofertas_stock

Ofertas sobre items de stock (descuento por vencimiento proximo, etc.).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| stock_id | uuid | NOT NULL | | FK -> stock_deposito(id) ON DELETE CASCADE |
| descuento_pct | numeric(5,2) | NOT NULL | | CHECK > 0 AND < 100 |
| precio_oferta | numeric(12,2) | NOT NULL | | CHECK >= 0 |
| activa | boolean | NOT NULL | true | |
| created_by | uuid | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |
| deactivated_by | uuid | NULL | | |
| deactivated_at | timestamptz | NULL | | |

**Indices:** `idx_ofertas_stock_stock_id`, `idx_ofertas_stock_created_at(created_at DESC)`, `idx_ofertas_stock_unique_active(stock_id) UNIQUE PARTIAL WHERE activa`
**RLS:** ENABLED. Policies: SELECT (admin, ventas, deposito).

---

### bitacora_turnos

Notas de turno (bitacora operativa).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| usuario_id | uuid | NOT NULL | auth.uid() | |
| usuario_nombre | text | NULL | | |
| usuario_email | text | NULL | | |
| usuario_rol | text | NULL | | |
| nota | text | NOT NULL | | |
| created_at | timestamptz | NOT NULL | now() | |

**Indices:** `idx_bitacora_turnos_created_at(created_at DESC)`
**RLS:** ENABLED. Policies: INSERT (staff, solo propio usuario_id), SELECT (admin).

---

## 7. Gestion: Tareas y Notificaciones

### tareas_pendientes

Sistema de tareas y seguimiento operativo.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| titulo | text | NOT NULL | | |
| descripcion | text | NULL | | |
| tipo | text | NULL | | |
| prioridad | text | NULL | | |
| estado | text | NULL | 'pendiente' | |
| datos | jsonb | NULL | | |
| asignado_a_id | uuid | NULL | | Variante canonica |
| asignada_a_id | uuid | NULL | | Variante femenina (compat) |
| asignada_a_nombre | text | NULL | | |
| creada_por_id | uuid | NULL | | |
| creada_por_nombre | text | NULL | | |
| fecha_creacion | timestamptz | NULL | now() | |
| fecha_vencimiento | timestamptz | NULL | | |
| fecha_completado | timestamptz | NULL | | Variante canonica |
| fecha_completada | timestamptz | NULL | | Variante femenina (compat) |
| completado_por_id | uuid | NULL | | Variante canonica |
| completada_por_id | uuid | NULL | | Variante femenina (compat) |
| completada_por_nombre | text | NULL | | |
| fecha_cancelada | timestamptz | NULL | | |
| cancelada_por_id | uuid | NULL | | |
| cancelada_por_nombre | text | NULL | | |
| razon_cancelacion | text | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Nota:** Las columnas duplicadas (asignado_a_id/asignada_a_id, etc.) existen por compatibilidad entre frontend y edge functions.
**RLS:** ENABLED. Policies: SELECT (todos), INSERT/UPDATE/DELETE (staff).

---

### notificaciones_tareas

Notificaciones del sistema por tarea.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| tarea_id | uuid | NULL | | FK -> tareas_pendientes(id) ON DELETE CASCADE |
| tipo | text | NULL | | |
| mensaje | text | NULL | | |
| usuario_destino_id | uuid | NULL | | |
| usuario_destino_nombre | text | NULL | | |
| fecha_envio | timestamptz | NULL | now() | |
| leido | boolean | NULL | false | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_notificaciones_tareas_tarea_id`, `idx_notificaciones_tareas_fecha_envio(fecha_envio DESC)`
**RLS:** ENABLED. Policies: SELECT/UPDATE (solo registros propios via `usuario_destino_id = auth.uid()`).

---

## 8. Gestion: Personal

### personal

Gestion de personal del mini market (vinculado a auth.users).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_auth_id | uuid | NULL | | UNIQUE constraint |
| nombre | text | NOT NULL | | |
| email | text | NULL | | |
| telefono | text | NULL | | |
| rol | text | NULL | | admin, deposito, ventas, usuario |
| departamento | text | NULL | | |
| activo | boolean | NULL | true | |
| fecha_ingreso | date | NULL | CURRENT_DATE | |
| direccion | text | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_personal_user_auth_id`, `idx_personal_activo`, `personal_user_auth_id_unique UNIQUE`
**RLS:** ENABLED. Policies: SELECT (solo propio registro via `user_auth_id = auth.uid()`).

---

## 9. Proveedor/Scraper

### cache_proveedor

Cache en base de datos para respuestas de api-proveedor.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| endpoint | text | NOT NULL | | PK |
| payload | jsonb | NOT NULL | | |
| updated_at | timestamptz | NOT NULL | now() | |
| ttl_seconds | integer | NOT NULL | | |

**Indices:** `cache_proveedor_updated_at_idx(updated_at DESC)`
**RLS:** No habilitado explicitamente. Grants revocados a anon.

---

### configuracion_proveedor

Configuracion de scraping por proveedor.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| nombre | text | NOT NULL | | UNIQUE |
| frecuencia_scraping | text | NULL | | |
| umbral_cambio_precio | numeric | NULL | | |
| proxima_sincronizacion | timestamptz | NULL | | |
| ultima_sincronizacion | timestamptz | NULL | | |
| configuraciones | jsonb | NULL | '{}' | |
| activo | boolean | NULL | true | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_configuracion_proveedor_nombre UNIQUE`
**RLS:** ENABLED. Sin policies (acceso solo via service_role).

---

### estadisticas_scraping

Estadisticas de ejecuciones del scraper.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| fuente | text | NULL | | |
| categoria | text | NULL | | |
| granularidad | text | NULL | | |
| productos_totales | integer | NULL | | |
| productos_actualizados | integer | NULL | | |
| productos_nuevos | integer | NULL | | |
| productos_fallidos | integer | NULL | | |
| comparaciones_realizadas | integer | NULL | | |
| duracion_ms | integer | NULL | | |
| errores | integer | NULL | | |
| detalle | jsonb | NULL | '{}' | |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_estadisticas_scraping_created_at(created_at DESC)`
**RLS:** ENABLED. Sin policies (service_role only).

---

### comparacion_precios

Comparaciones de precios (nuestro vs proveedor).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NULL | | FK -> productos(id) ON DELETE SET NULL |
| nombre_producto | text | NULL | | |
| precio_actual | numeric | NULL | | Nuestro precio |
| precio_proveedor | numeric | NULL | | Precio del proveedor |
| diferencia_absoluta | numeric | NULL | | |
| diferencia_porcentual | numeric | NULL | | |
| fuente | text | NULL | | |
| fecha_comparacion | timestamptz | NOT NULL | | |
| es_oportunidad_ahorro | boolean | NULL | false | |
| recomendacion | text | NULL | | |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_comparacion_precios_fecha(fecha_comparacion DESC)`, `idx_comparacion_precios_producto`, `idx_comparacion_precios_oportunidad`
**RLS:** ENABLED. Sin policies (service_role only).

---

### alertas_cambios_precios

Alertas generadas por cambios significativos de precios en proveedores.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NULL | | |
| nombre_producto | text | NULL | | |
| tipo_cambio | text | NULL | | |
| valor_anterior | numeric | NULL | | |
| valor_nuevo | numeric | NULL | | |
| porcentaje_cambio | numeric | NULL | | |
| severidad | text | NULL | | |
| mensaje | text | NULL | | |
| accion_recomendada | text | NULL | | |
| fecha_alerta | timestamptz | NULL | | |
| procesada | boolean | NULL | false | |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_alertas_cambios_precios_fecha(fecha_alerta DESC)`, `idx_alertas_cambios_precios_procesada`, `idx_alertas_cambios_precios_severidad`
**RLS:** ENABLED. Sin policies (service_role only).

---

## 10. Cron Jobs (10 tablas)

### cron_jobs_tracking

Estado y tracking principal de cron jobs.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| job_id | text | NOT NULL | | UNIQUE |
| nombre_job | text | NULL | |
| descripcion | text | NULL | |
| activo | boolean | NULL | true |
| estado_job | text | NULL | 'inactivo' |
| ultima_ejecucion | timestamptz | NULL | |
| proxima_ejecucion | timestamptz | NULL | |
| duracion_ejecucion_ms | integer | NULL | |
| intentos_ejecucion | integer | NULL | 0 |
| resultado_ultima_ejecucion | jsonb | NULL | |
| error_ultima_ejecucion | text | NULL | |
| circuit_breaker_state | text | NULL | 'closed' |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_tracking_job_id UNIQUE`, `idx_cron_jobs_tracking_estado`
**RLS:** ENABLED. Sin policies (service_role only).

### cron_jobs_execution_log

Log detallado de ejecuciones.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| job_id | text | NOT NULL | |
| execution_id | text | NULL | |
| start_time | timestamptz | NULL | |
| end_time | timestamptz | NULL | |
| duracion_ms | integer | NULL | |
| estado | text | NULL | |
| request_id | text | NULL | |
| parametros_ejecucion | jsonb | NULL | |
| resultado | jsonb | NULL | |
| error_message | text | NULL | |
| memory_usage_start | bigint | NULL | |
| productos_procesados | integer | NULL | |
| productos_exitosos | integer | NULL | |
| productos_fallidos | integer | NULL | |
| alertas_generadas | integer | NULL | |
| emails_enviados | integer | NULL | |
| sms_enviados | integer | NULL | |
| created_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_execution_log_job(job_id, start_time DESC)`, `idx_cron_jobs_execution_log_estado`

### cron_jobs_alerts

Alertas de cron jobs.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| job_id | text | NOT NULL | |
| execution_id | text | NULL | |
| tipo_alerta | text | NULL | |
| severidad | text | NULL | |
| titulo | text | NULL | |
| descripcion | text | NULL | |
| accion_recomendada | text | NULL | |
| canales_notificacion | jsonb | NULL | |
| fecha_envio | timestamptz | NULL | |
| estado_alerta | text | NULL | 'activas' |
| fecha_resolucion | timestamptz | NULL | |
| created_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_alerts_job(job_id, created_at DESC)`, `idx_cron_jobs_alerts_estado`, `idx_cron_jobs_alerts_severidad`

### cron_jobs_notifications

Notificaciones enviadas por cron jobs.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| template_id | text | NULL | |
| channel_id | text | NULL | |
| priority | text | NULL | |
| source | text | NULL | |
| recipients | jsonb | NULL | |
| data | jsonb | NULL | |
| status | text | NULL | |
| message_id | text | NULL | |
| error_message | text | NULL | |
| sent_at | timestamptz | NULL | now() |
| created_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_notifications_channel(channel_id, sent_at DESC)`

### cron_jobs_metrics

Metricas agregadas de cron jobs.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| job_id | text | NULL | |
| fecha_metricas | date | NOT NULL | |
| ejecuciones_totales | integer | NULL | 0 |
| disponibilidad_porcentual | numeric | NULL | 100 |
| tiempo_promedio_ms | integer | NULL | 0 |
| alertas_generadas_total | integer | NULL | 0 |
| created_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_metrics_fecha(fecha_metricas DESC)`, `idx_cron_jobs_metrics_job`

### cron_jobs_monitoring_history

Historial de monitoreo de salud.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| timestamp | timestamptz | NOT NULL | |
| uptime_percentage | numeric | NULL | |
| response_time_ms | integer | NULL | |
| memory_usage_percent | numeric | NULL | |
| active_jobs_count | integer | NULL | |
| success_rate | numeric | NULL | |
| alerts_generated | integer | NULL | |
| health_score | numeric | NULL | |
| details | jsonb | NULL | |
| created_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_monitoring_history_ts(timestamp DESC)`

### cron_jobs_health_checks

Health checks individuales por job.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| job_id | text | NOT NULL | |
| check_type | text | NULL | |
| status | text | NULL | |
| response_time_ms | integer | NULL | |
| check_details | jsonb | NULL | |
| last_success | timestamptz | NULL | |
| created_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_health_checks_job(job_id, created_at DESC)`

### cron_jobs_config

Configuracion de cron jobs.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| job_id | text | NOT NULL | UNIQUE |
| cron_expression | text | NULL | |
| edge_function_name | text | NULL | |
| cron_job_name | text | NULL | |
| descripcion | text | NULL | |
| parametros | jsonb | NULL | |
| is_active | boolean | NULL | true |
| created_at | timestamptz | NULL | now() |
| updated_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_config_job_id UNIQUE`

### cron_jobs_notification_preferences

Preferencias de notificacion por usuario.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NOT NULL | gen_random_uuid() |
| user_id | uuid | NULL | |
| channel_id | text | NULL | |
| enabled | boolean | NULL | true |
| preferences | jsonb | NULL | |
| created_at | timestamptz | NULL | now() |

### cron_jobs_locks

Locks distribuidos para cron jobs.

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| job_id | text | NOT NULL | PK |
| locked_until | timestamptz | NOT NULL | |
| locked_by | text | NULL | |
| updated_at | timestamptz | NULL | now() |

**Indices:** `idx_cron_jobs_locks_until`
**RLS:** ENABLED (mig 20260215). Sin policies (service_role only).

**Nota:** Todas las tablas cron_jobs_* tienen RLS ENABLED sin policies (acceso exclusivo via service_role).

---

## 11. Infraestructura

### rate_limit_state

Estado de rate limiting (atomico via SP).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| key | text | NOT NULL | | PK |
| count | integer | NOT NULL | 0 | |
| window_start | timestamptz | NOT NULL | NOW() | |
| updated_at | timestamptz | NOT NULL | NOW() | |

**Indices:** `idx_rate_limit_state_updated`
**Acceso:** service_role only (REVOKE ALL FROM PUBLIC).
**RLS:** ENABLED (mig 20260215). Sin policies.

---

### circuit_breaker_state

Estado de circuit breakers.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| breaker_key | text | NOT NULL | | PK |
| state | text | NOT NULL | 'closed' | CHECK IN ('closed','open','half_open') |
| failure_count | integer | NOT NULL | 0 | |
| success_count | integer | NOT NULL | 0 | |
| opened_at | timestamptz | NULL | | |
| last_failure_at | timestamptz | NULL | | |
| updated_at | timestamptz | NOT NULL | NOW() | |

**Acceso:** service_role only (REVOKE ALL FROM PUBLIC).
**RLS:** ENABLED (mig 20260215). Sin policies.

---

## 12. OCR / Facturas de Ingesta

### facturas_ingesta

Cabecera de facturas de compra ingresadas (OCR o manual).

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| proveedor_id | uuid | NOT NULL | | FK -> proveedores(id) ON DELETE RESTRICT |
| tipo_comprobante | text | NOT NULL | 'factura' | |
| numero | text | NULL | | |
| fecha_factura | date | NULL | | |
| total | numeric(12,2) | NULL | | |
| estado | text | NOT NULL | 'pendiente' | CHECK IN ('pendiente','extraida','validada','aplicada','error','rechazada') |
| imagen_url | text | NULL | | Ruta en Storage bucket `facturas` |
| datos_extraidos | jsonb | NULL | | JSON crudo del OCR |
| score_confianza | numeric(5,2) | NULL | | |
| request_id | text | NULL | | Tracing |
| created_by | uuid | NULL | | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Constraint:** `facturas_ingesta_unique_factura UNIQUE NULLS NOT DISTINCT (proveedor_id, tipo_comprobante, numero, fecha_factura)` — idempotencia.
**Indices:** `idx_facturas_ingesta_proveedor(proveedor_id)`, `idx_facturas_ingesta_estado(estado)`, `idx_facturas_ingesta_fecha(fecha_factura DESC)`, `idx_facturas_ingesta_created(created_at DESC)`
**RLS:** ENABLED. Policies: `fi_select_staff`, `fi_insert_staff`, `fi_update_staff` (admin, deposito), `fi_delete_admin` (admin).

---

### facturas_ingesta_items

Items/lineas individuales de cada factura.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| factura_id | uuid | NOT NULL | | FK -> facturas_ingesta(id) ON DELETE CASCADE |
| descripcion_original | text | NOT NULL | | Texto crudo del OCR |
| producto_id | uuid | NULL | | FK -> productos(id) ON DELETE SET NULL |
| alias_usado | text | NULL | | Alias que logro el match |
| cantidad | numeric(12,3) | NOT NULL | 1 | |
| unidad | text | NULL | 'u' | |
| precio_unitario | numeric(12,2) | NULL | | Precio factura (puede ser por bulto) |
| subtotal | numeric(12,2) | NULL | | |
| estado_match | text | NOT NULL | 'fuzzy_pendiente' | CHECK IN ('auto_match','alias_match','fuzzy_pendiente','confirmada','rechazada') |
| confianza_match | numeric(5,2) | NULL | | |
| unidades_por_bulto | integer | NULL | | Pack size extraido de descripcion (NxM parsing) |
| precio_unitario_costo | numeric(12,4) | NULL | | Costo unitario calculado: (precio/pack) * (1+IVA) |
| validacion_subtotal | text | NULL | | CHECK IN ('ok','warning','error') — cross-validation qty*price vs subtotal |
| notas_calculo | text | NULL | | Explicacion transparente del calculo |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_fi_items_factura(factura_id)`, `idx_fi_items_producto(producto_id)`, `idx_fi_items_estado(estado_match)`, `idx_fi_items_validacion(validacion_subtotal) WHERE != 'ok'`
**RLS:** ENABLED. Policies: `fi_items_select_staff`, `fi_items_insert_staff`, `fi_items_update_staff` (admin, deposito), `fi_items_delete_admin` (admin).

---

### facturas_ingesta_eventos

Registro de auditoria/eventos por factura.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| factura_id | uuid | NOT NULL | | FK -> facturas_ingesta(id) ON DELETE CASCADE |
| evento | text | NOT NULL | | Tipo de evento (ej: 'ocr_iniciado', 'match_completado') |
| datos | jsonb | NULL | | Payload del evento |
| usuario_id | uuid | NULL | | |
| created_at | timestamptz | NULL | now() | |

**Indices:** `idx_fi_eventos_factura(factura_id)`, `idx_fi_eventos_created(created_at DESC)`
**RLS:** ENABLED. Policies: `fi_eventos_select_staff`, `fi_eventos_insert_staff` (admin, deposito).

---

### producto_aliases

Tabla de aliases para matching multinivel de nombres de factura a producto canonico.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| alias_texto | text | NOT NULL | | Texto original del alias |
| alias_normalizado | text | NOT NULL | GENERATED ALWAYS AS (lower(translate(trim(alias_texto), accents, plain))) STORED | Sin acentos, lowercase, trimmed |
| producto_id | uuid | NOT NULL | | FK -> productos(id) ON DELETE CASCADE |
| proveedor_id | uuid | NULL | | FK -> proveedores(id) ON DELETE SET NULL |
| confianza | text | NOT NULL | 'media' | CHECK IN ('alta','media','baja') |
| origen | text | NULL | | CHECK IN ('manual','ocr','cuaderno') |
| activo | boolean | NOT NULL | true | |
| created_at | timestamptz | NULL | now() | |
| created_by | uuid | NULL | | |

**Indices:** `idx_pa_alias_proveedor_unique(alias_normalizado, proveedor_id) UNIQUE NULLS NOT DISTINCT`, `idx_pa_producto(producto_id)`, `idx_pa_alias_normalizado(alias_normalizado)`, `idx_pa_activo(activo) PARTIAL WHERE activo = true`
**RLS:** ENABLED. Policies: `pa_select_all` (todos los roles), `pa_insert_staff`, `pa_update_staff` (admin, deposito), `pa_delete_admin` (admin).

---

### precios_compra

Historial de precios de compra internos, vinculable a factura.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| producto_id | uuid | NOT NULL | | FK -> productos(id) ON DELETE CASCADE |
| proveedor_id | uuid | NULL | | FK -> proveedores(id) ON DELETE SET NULL |
| precio_unitario | numeric(12,2) | NOT NULL | | |
| factura_ingesta_item_id | uuid | NULL | | FK -> facturas_ingesta_items(id) ON DELETE SET NULL |
| origen | text | NOT NULL | 'manual' | CHECK IN ('manual','factura','recepcion') |
| created_at | timestamptz | NULL | now() | |
| created_by | uuid | NULL | | |

**Indices:** `idx_pc_producto_fecha(producto_id, created_at DESC)`, `idx_pc_proveedor_producto(proveedor_id, producto_id)`, `idx_pc_factura_item(factura_ingesta_item_id) PARTIAL WHERE NOT NULL`
**Trigger:** `trg_update_precio_costo` — AFTER INSERT ejecuta `fn_update_precio_costo()` que actualiza `productos.precio_costo` con el valor insertado.
**RLS:** ENABLED. Policies: `pc_select_staff`, `pc_insert_staff` (admin, deposito), `pc_update_admin`, `pc_delete_admin` (admin).

---

### supplier_profiles

Configuracion per-vendor para OCR y calculo de precios de factura.

| Campo | Tipo | Nullable | Default | Notas |
|-------|------|----------|---------|-------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| proveedor_id | uuid | NOT NULL | | FK -> proveedores(id) ON DELETE CASCADE, UNIQUE |
| precio_es_bulto | boolean | NOT NULL | true | true = precio factura es por bulto/caja |
| iva_incluido | boolean | NOT NULL | false | true = precio ya incluye IVA |
| iva_tasa | numeric(5,2) | NOT NULL | 21.00 | Tasa IVA como porcentaje |
| pack_size_regex | text | NULL | '(\d+)\s*[xX]\s*\d+' | Regex para extraer pack size de descripcion |
| notas | text | NULL | | Notas operativas |
| activo | boolean | NOT NULL | true | |
| created_at | timestamptz | NULL | now() | |
| updated_at | timestamptz | NULL | now() | |

**Indices:** `idx_supplier_profiles_proveedor(proveedor_id)`
**RLS:** ENABLED. Policies: `supplier_profiles_select` (todos), `supplier_profiles_insert/update` (admin, deposito).

---

## 13. Vistas

### Vistas materializadas

| Vista | Refresh | Proposito |
|-------|---------|-----------|
| `mv_stock_bajo` | Cada 1h via `fn_refresh_stock_views()` | Productos con stock por debajo del minimo |
| `mv_productos_proximos_vencer` | Cada 6h via `fn_refresh_stock_views()` | Productos con vencimiento en proximos 60 dias |
| `tareas_metricas` | Vista materializada de metricas de tareas | Metricas de tareas con campos normalizados |

### Vistas no materializadas

| Vista | Proposito |
|-------|-----------|
| `vista_stock_por_categoria` | Resumen agregado de stock por categoria |
| `vista_oportunidades_ahorro` | Comparaciones con oportunidad de ahorro |
| `vista_alertas_activas` | Alertas de precios no procesadas |
| `vista_cron_jobs_dashboard` | Dashboard de cron jobs |
| `vista_cron_jobs_alertas_activas` | Alertas activas de cron jobs |
| `vista_cron_jobs_metricas_semanales` | Metricas semanales agregadas |
| `vista_arbitraje_producto` | Analisis de arbitraje (costo proveedor vs venta) |
| `vista_oportunidades_compra` | Oportunidades de compra (stock bajo + precio proveedor bajo) |
| `vista_cc_saldos_por_cliente` | Saldos de cuenta corriente por cliente |
| `vista_cc_resumen` | Resumen global de cuentas corrientes |
| `vista_ofertas_sugeridas` | Ofertas sugeridas para productos proximos a vencer |

---

## 14. Funciones y Stored Procedures (principales)

### Funciones de negocio

| Funcion | Tipo | Proposito |
|---------|------|-----------|
| `sp_aplicar_precio(uuid, numeric, numeric)` | SECURITY DEFINER | Aplica precio de compra y calcula venta con margen. FOR UPDATE en productos. |
| `sp_movimiento_inventario(uuid, text, integer, text, uuid, uuid)` | SECURITY DEFINER | Registra movimiento de inventario. FOR UPDATE en stock_deposito/ordenes_compra. |
| `sp_crear_pedido(...)` | SECURITY DEFINER | Creacion atomica de pedido con items. |
| `sp_procesar_venta_pos(jsonb)` | SECURITY DEFINER | Venta POS atomica con idempotency, FOR UPDATE/SHARE, ledger CC. Hardened. |
| `sp_registrar_pago_cc(jsonb)` | SECURITY DEFINER | Registra pago a cuenta corriente. |
| `sp_aplicar_oferta_stock(uuid, numeric)` | SECURITY DEFINER | Aplica oferta sobre stock (idempotente). |
| `sp_desactivar_oferta_stock(uuid)` | SECURITY DEFINER | Desactiva una oferta. |
| `sp_actualizar_pago_pedido(uuid, numeric)` | SECURITY DEFINER | Actualiza pago de pedido con FOR UPDATE lock. |
| `sp_reservar_stock(uuid, integer, text, uuid)` | SECURITY DEFINER | Reserva stock con idempotency key. |
| `sp_cancelar_reserva(uuid, uuid)` | SECURITY DEFINER | Cancela reserva con FOR UPDATE lock. |

### Funciones de infraestructura

| Funcion | Tipo | Proposito |
|---------|------|-----------|
| `sp_acquire_job_lock(text, integer, text)` | SECURITY DEFINER | Lock distribuido para cron jobs. |
| `sp_release_job_lock(text, text)` | SECURITY DEFINER | Libera lock de cron job. |
| `sp_check_rate_limit(text, integer, integer)` | SECURITY DEFINER | Check + increment atomico de rate limit. service_role only. |
| `sp_cleanup_rate_limit_state()` | SECURITY DEFINER | Limpia entries stale de rate limit. service_role only. |
| `sp_circuit_breaker_record(text, text, integer, integer, integer)` | SECURITY DEFINER | Registra evento en circuit breaker. service_role only. |
| `sp_circuit_breaker_check(text, integer)` | SECURITY DEFINER | Read-only check de circuit breaker. service_role only. |
| `has_personal_role(text[])` | SECURITY DEFINER | Verifica rol del usuario autenticado via tabla personal. |
| `trigger_set_updated_at()` | TRIGGER | Auto-update de `updated_at` en UPDATE. |

### Funciones de agregacion

| Funcion | Tipo | Proposito |
|---------|------|-----------|
| `fn_dashboard_metrics(uuid)` | STABLE, SECURITY DEFINER | Metricas agregadas para dashboard (reemplaza 7 queries). |
| `fn_rotacion_productos(integer, integer)` | STABLE, SECURITY DEFINER | Analisis de rotacion de productos. |
| `fn_refresh_stock_views()` | SECURITY DEFINER | Refresh de vistas materializadas (para cron). |
| `fnc_redondear_precio(numeric)` | IMMUTABLE | Redondea precio a 2 decimales. |
| `fnc_margen_sugerido(uuid)` | - | Calcula margen sugerido para un producto. |
| `fn_update_precio_costo()` | SECURITY DEFINER, TRIGGER | Actualiza `productos.precio_costo` al insertar en `precios_compra`. |

### Triggers

| Trigger | Tabla | Proposito |
|---------|-------|-----------|
| `set_clientes_updated_at` | clientes | Auto-update `updated_at` |
| `clientes_limite_credito_only_admin` | clientes | Solo admin puede modificar `limite_credito` |
| `set_pedidos_updated_at` | pedidos | Auto-update `updated_at` |
| `trg_update_precio_costo` | precios_compra | AFTER INSERT: actualiza `productos.precio_costo` con el ultimo valor |

---

## 15. Notas de Drift Detectado

1. **`precios_historicos.fecha`**: Columna legacy residual. No fue eliminada en la migracion de cleanup (20260213). No es usada por codigo activo.
2. **`cache_proveedor` RLS**: No tiene `ENABLE ROW LEVEL SECURITY` explicito en migraciones. Solo tiene REVOKE de anon.
3. **Roles legacy en RLS**: Tablas creadas en mig 20260131000000 usan arrays de roles legacy (`['admin','administrador','deposito','deposito','ventas','vendedor','usuario']`). Tablas creadas/overridden en mig 20260212130000 usan roles canonicos (`['admin','deposito','ventas']`). Funcional pero inconsistente.

---

**Version:** Post-Mega-Plan-O1 (GO, 49 migraciones, 43 tablas, 11 vistas, 3 MV)
**Estado:** Produccion estable (pipeline OCR desplegado; falta secret GCV_API_KEY)
