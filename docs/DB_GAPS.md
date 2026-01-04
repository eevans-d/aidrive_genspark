# DB GAPS (objetos sin migracion versionada)

**Estado:** lista maestra inicial

---

## Cron/monitoring
- `cron_jobs_execution_log`
- `cron_jobs_alerts`
- `cron_jobs_metrics`
- `cron_jobs_tracking`
- `cron_jobs_notifications`
- `cron_jobs_monitoring_history`
- `cron_jobs_health_checks`

## Scraping/proveedor
- `configuracion_proveedor`
- `estadisticas_scraping`
- `comparacion_precios`
- `alertas_cambios_precios`

## Stock/ordenes
- `stock_reservado`
- `ordenes_compra`

## Vistas
- `vista_cron_jobs_dashboard`
- `vista_cron_jobs_metricas_semanales`
- `vista_cron_jobs_alertas_activas`
- `vista_alertas_activas`
- `vista_oportunidades_ahorro`

## Materialized view
- (sin gaps activos; `tareas_metricas` ya esta versionada en migracion)

## Funciones/RPC
- `fnc_deteccion_cambios_significativos`
- `fnc_limpiar_datos_antiguos`
- `fnc_redondear_precio`
- `fnc_margen_sugerido`
- `fnc_productos_bajo_minimo`
- `fnc_stock_disponible`
- `sp_movimiento_inventario`

## Mencionadas en docs de cron
- `cron_jobs_config`
- `cron_jobs_notification_preferences`
