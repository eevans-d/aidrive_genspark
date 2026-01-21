# DB GAPS (objetos sin migracion versionada)

**Estado:** ✅ RESUELTO - Todos los gaps cubiertos en migraciones  
**Última revisión:** 2026-01-21  
**Ver:** [REPORTE_REVISION_DB.md](REPORTE_REVISION_DB.md) para hallazgos pendientes

---

## Cron/monitoring ✅
- ~~`cron_jobs_execution_log`~~ → `20260104020000_create_missing_objects.sql`
- ~~`cron_jobs_alerts`~~ → `20260104020000_create_missing_objects.sql`
- ~~`cron_jobs_metrics`~~ → `20260104020000_create_missing_objects.sql`
- ~~`cron_jobs_tracking`~~ → `20260104020000_create_missing_objects.sql`
- ~~`cron_jobs_notifications`~~ → `20260104020000_create_missing_objects.sql`
- ~~`cron_jobs_monitoring_history`~~ → `20260104020000_create_missing_objects.sql`
- ~~`cron_jobs_health_checks`~~ → `20260104020000_create_missing_objects.sql`

## Scraping/proveedor ✅
- ~~`configuracion_proveedor`~~ → `20260104020000_create_missing_objects.sql`
- ~~`estadisticas_scraping`~~ → `20260104020000_create_missing_objects.sql`
- ~~`comparacion_precios`~~ → `20260104020000_create_missing_objects.sql`
- ~~`alertas_cambios_precios`~~ → `20260104020000_create_missing_objects.sql`

## Stock/ordenes ✅
- ~~`stock_reservado`~~ → `20260104020000_create_missing_objects.sql`
- ~~`ordenes_compra`~~ → `20260104020000_create_missing_objects.sql`

## Vistas ✅
- ~~`vista_cron_jobs_dashboard`~~ → `20260104020000_create_missing_objects.sql`
- ~~`vista_cron_jobs_metricas_semanales`~~ → `20260104020000_create_missing_objects.sql`
- ~~`vista_cron_jobs_alertas_activas`~~ → `20260104020000_create_missing_objects.sql`
- ~~`vista_alertas_activas`~~ → `20260104020000_create_missing_objects.sql`
- ~~`vista_oportunidades_ahorro`~~ → `20260104020000_create_missing_objects.sql`

## Materialized view ✅
- ~~`tareas_metricas`~~ → `20260104020000_create_missing_objects.sql`

## Funciones/RPC ✅
- ~~`fnc_deteccion_cambios_significativos`~~ → `20260104020000_create_missing_objects.sql`
- ~~`fnc_limpiar_datos_antiguos`~~ → `20260104020000_create_missing_objects.sql`
- ~~`fnc_redondear_precio`~~ → `20260104020000_create_missing_objects.sql`
- ~~`fnc_margen_sugerido`~~ → `20260104020000_create_missing_objects.sql`
- ~~`fnc_productos_bajo_minimo`~~ → `20260104020000_create_missing_objects.sql`
- ~~`fnc_stock_disponible`~~ → `20260104020000_create_missing_objects.sql`
- ~~`sp_movimiento_inventario`~~ → `20260104020000` + `20260109090000`

## Mencionadas en docs de cron ✅
- ~~`cron_jobs_config`~~ → `20260104020000_create_missing_objects.sql`
- ~~`cron_jobs_notification_preferences`~~ → `20260104020000_create_missing_objects.sql`

---

## ⚠️ Hallazgos Pendientes de Corrección

Ver [REPORTE_REVISION_DB.md](REPORTE_REVISION_DB.md) para:
- 6 hallazgos P0 (críticos)
- 12 hallazgos P1 (alta prioridad)
- 9 hallazgos P2 (mejoras)
- 5 items que requieren revisión manual

**Migración sugerida:** `20260110000000_fix_constraints_and_indexes.sql` (incluida en reporte)
