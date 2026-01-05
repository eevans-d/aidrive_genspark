-- RLS policies for new tables (cron/scraping/stock/tareas).
-- NOTE: Policies are permissive for authenticated users where UI depends on them.

-- tareas_pendientes (UI read/write)
ALTER TABLE IF EXISTS tareas_pendientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tareas_pendientes_select_authenticated ON tareas_pendientes;
CREATE POLICY tareas_pendientes_select_authenticated
  ON tareas_pendientes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS tareas_pendientes_insert_authenticated ON tareas_pendientes;
CREATE POLICY tareas_pendientes_insert_authenticated
  ON tareas_pendientes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS tareas_pendientes_update_authenticated ON tareas_pendientes;
CREATE POLICY tareas_pendientes_update_authenticated
  ON tareas_pendientes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS tareas_pendientes_delete_authenticated ON tareas_pendientes;
CREATE POLICY tareas_pendientes_delete_authenticated
  ON tareas_pendientes
  FOR DELETE
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tareas_pendientes TO authenticated;

-- stock_reservado (UI read)
ALTER TABLE IF EXISTS stock_reservado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_reservado_select_authenticated ON stock_reservado;
CREATE POLICY stock_reservado_select_authenticated
  ON stock_reservado
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON TABLE stock_reservado TO authenticated;

-- ordenes_compra (UI read)
ALTER TABLE IF EXISTS ordenes_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ordenes_compra_select_authenticated ON ordenes_compra;
CREATE POLICY ordenes_compra_select_authenticated
  ON ordenes_compra
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON TABLE ordenes_compra TO authenticated;

-- Internal tables: RLS enabled; no policies (service_role bypass).
ALTER TABLE IF EXISTS configuracion_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS estadisticas_scraping ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comparacion_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alertas_cambios_precios ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS cron_jobs_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cron_jobs_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cron_jobs_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cron_jobs_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cron_jobs_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cron_jobs_monitoring_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cron_jobs_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cron_jobs_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cron_jobs_notification_preferences ENABLE ROW LEVEL SECURITY;
