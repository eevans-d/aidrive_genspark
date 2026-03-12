# Esquema de Base de Datos - Mini Market (Canonico Compacto)

**Actualizado:** 2026-03-12
**Fuente de verdad:** `supabase/migrations/*.sql`
**Estado:** `57/57` migraciones sincronizadas

## 1) Proposito
Este documento resume la estructura activa de BD para operacion y auditoria tecnica.
El detalle columna-por-columna historico permanece trazable en el historial de git del archivo.

## 2) Inventario estructural (alto nivel)
- Tablas: `45`
- Vistas no materializadas: `11`
- Vistas materializadas: `3`
- Funciones/SP: `30+`
- Triggers: `4`

## 3) Grupos funcionales y tablas principales
### Catalogo y datos base
- `categorias`
- `productos`
- `proveedores`

### Inventario y deposito
- `stock_deposito`
- `movimientos_deposito`
- `stock_reservado`
- `ordenes_compra`

### Precios
- `precios_historicos`
- `precios_proveedor`

### Operacion comercial
- `clientes`
- `pedidos`
- `detalle_pedidos`
- `ventas`
- `venta_items`
- `cuentas_corrientes_movimientos`

### Gestion interna
- `tareas_pendientes`
- `notificaciones_tareas`
- `personal`
- `bitacora_turnos`

### OCR / facturas
- `facturas_ingesta`
- `facturas_ingesta_items`
- `facturas_ingesta_eventos`
- `producto_aliases`
- `precios_compra`
- `supplier_profiles`

### Cron / observabilidad operativa
- `cron_jobs_tracking`
- `cron_jobs_execution_log`
- `cron_jobs_alerts`
- `cron_jobs_notifications`
- `cron_jobs_metrics`
- `cron_jobs_monitoring_history`
- `cron_jobs_health_checks`
- `cron_jobs_config`
- `cron_jobs_notification_preferences`
- `cron_jobs_locks`

### Infraestructura técnica
- `rate_limit_state`
- `circuit_breaker_state`

### Asistente IA
- `asistente_audit_log`

## 4) Invariantes de integridad clave
### Inventario
- `stock_deposito.cantidad_actual >= 0`
- `stock_deposito.stock_maximo >= stock_minimo`
- `movimientos_deposito` con trazabilidad por `factura_ingesta_item_id` cuando aplica.

### Idempotencia
- `movimientos_deposito.idempotency_key` con indice UNIQUE parcial.
- `stock_reservado.idempotency_key` con indice UNIQUE parcial.

### OCR
- `facturas_ingesta` controla estado del workflow (`pendiente`, `extraida`, `validada`, `aplicada`, `error`).
- `facturas_ingesta_items` mantiene score/confianza por item extraido.
- `facturas_ingesta_eventos` concentra auditoria de pipeline OCR.

### Pedidos y ventas
- Flujo de estados de pedidos validado en gateway con lock optimista.
- Relaciones de detalle y movimientos preservan consistencia referencial.

## 5) RLS y seguridad de datos
- Las tablas operativas activas se mantienen con RLS habilitado.
- Politicas separadas por rol funcional (`admin`, `deposito`, `ventas`) segun dominio.
- La validacion de autorizacion en Edge Functions complementa RLS en operaciones de negocio.

## 6) Stored procedures y funciones relevantes
- `sp_movimiento_inventario`: registro centralizado y consistente de movimientos.
- `sp_aplicar_precio`: validacion de margen y actualizacion atomica de precio.
- `sp_registrar_pago_cc`: registro de pagos en cuentas corrientes.
- Funciones auxiliares de OCR y auditoria usadas por gateway/edge functions.

## 7) Migraciones criticas recientes (continuidad a produccion)
- `20260302010000_*`: hardening inicial de constraints/idempotencia.
- `20260302020000_*`: controles de seguridad/consistencia adicionales.
- `20260302030000_*`: ajustes Tier 2 de continuidad.
- `20260303010000_sp_aplicar_precio_for_update.sql`: serializacion con `SELECT ... FOR UPDATE`.
- `20260304010000_create_asistente_audit_log.sql`: auditoria persistente del asistente IA.

## 8) Verificacion rapida de estado de esquema
```bash
# Estado local de migraciones
supabase migration list

# Verificar drift local/remoto
supabase db diff --linked

# Ejecutar checks de calidad relacionales
npm run test:integration
```

## 9) Relacion con issues abiertos
- `OCR-007` es externo (billing GCP), no un drift de esquema local.
- `AUTH-001`, `AUTH-002`, `DB-001` son hardenings de plataforma externa.
- `PERF-001` no aplica a BD (cerrado en frontend build).

## 10) Politica de mantenimiento del doc
- Mantener este archivo como resumen canónico de bajo ruido.
- Registrar cambios de estructura en `docs/DECISION_LOG.md`.
- Conservar detalle extensivo en archivos historicos bajo `docs/closure/archive/historical/`.
