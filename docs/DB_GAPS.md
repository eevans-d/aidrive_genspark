> [DEPRECADO: 2026-02-13] Documento historico/referencial. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`, `docs/closure/OPEN_ISSUES.md`.

# DB GAPS (objetos sin migracion versionada)

**Estado:** ✅ RESUELTO - Todos los gaps cubiertos en migraciones  
**Última revisión:** 2026-01-31

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

## ✅ Hallazgos Cerrados (2026-01-31)

Los hallazgos P0/P1/P2 mencionados anteriormente fueron resueltos con las siguientes migraciones:
- `20260110000000_fix_constraints_and_indexes.sql`
- `20260131000000_rls_role_based_policies_v2.sql`
- `20260131020000_security_advisor_mitigations.sql`

**Nota:** El documento `REPORTE_REVISION_DB.md` mencionado originalmente nunca fue creado; los hallazgos se documentaron directamente en las evidencias de auditoría RLS (`docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` [removido en D-109; ver historial git]).
