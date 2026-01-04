-- Create missing tables/views/functions inferred from code usage.
-- Note: FKs are omitted to avoid failing on environments without base tables.

-- -----------------------------
-- Scraping/proveedor tables
-- -----------------------------
CREATE TABLE IF NOT EXISTS configuracion_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  frecuencia_scraping text,
  umbral_cambio_precio numeric,
  proxima_sincronizacion timestamptz,
  ultima_sincronizacion timestamptz,
  configuraciones jsonb DEFAULT '{}'::jsonb,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracion_proveedor_nombre
  ON configuracion_proveedor (nombre);

CREATE TABLE IF NOT EXISTS estadisticas_scraping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente text,
  categoria text,
  granularidad text,
  productos_totales integer,
  productos_actualizados integer,
  productos_nuevos integer,
  productos_fallidos integer,
  comparaciones_realizadas integer,
  duracion_ms integer,
  errores integer,
  detalle jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estadisticas_scraping_created_at
  ON estadisticas_scraping (created_at DESC);

CREATE TABLE IF NOT EXISTS comparacion_precios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid,
  nombre_producto text,
  precio_actual numeric,
  precio_proveedor numeric,
  diferencia_absoluta numeric,
  diferencia_porcentual numeric,
  fuente text,
  fecha_comparacion timestamptz NOT NULL,
  es_oportunidad_ahorro boolean DEFAULT false,
  recomendacion text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comparacion_precios_fecha
  ON comparacion_precios (fecha_comparacion DESC);
CREATE INDEX IF NOT EXISTS idx_comparacion_precios_producto
  ON comparacion_precios (producto_id);
CREATE INDEX IF NOT EXISTS idx_comparacion_precios_oportunidad
  ON comparacion_precios (es_oportunidad_ahorro);

CREATE TABLE IF NOT EXISTS alertas_cambios_precios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid,
  nombre_producto text,
  tipo_cambio text,
  valor_anterior numeric,
  valor_nuevo numeric,
  porcentaje_cambio numeric,
  severidad text,
  mensaje text,
  accion_recomendada text,
  fecha_alerta timestamptz,
  procesada boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alertas_cambios_precios_fecha
  ON alertas_cambios_precios (fecha_alerta DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_cambios_precios_procesada
  ON alertas_cambios_precios (procesada);
CREATE INDEX IF NOT EXISTS idx_alertas_cambios_precios_severidad
  ON alertas_cambios_precios (severidad);

-- -----------------------------
-- Stock/ordenes tables
-- -----------------------------
CREATE TABLE IF NOT EXISTS stock_reservado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL,
  estado text DEFAULT 'activa',
  referencia text,
  usuario uuid,
  fecha_reserva timestamptz,
  fecha_cancelacion timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservado_producto_estado
  ON stock_reservado (producto_id, estado);

CREATE TABLE IF NOT EXISTS ordenes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  proveedor_id uuid,
  cantidad integer NOT NULL,
  cantidad_recibida integer DEFAULT 0,
  estado text DEFAULT 'pendiente',
  fecha_creacion timestamptz DEFAULT now(),
  fecha_estimada timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ordenes_compra_producto_estado
  ON ordenes_compra (producto_id, estado);

-- -----------------------------
-- Tareas
-- -----------------------------
CREATE TABLE IF NOT EXISTS tareas_pendientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  tipo text,
  prioridad text,
  estado text DEFAULT 'pendiente',
  datos jsonb,
  asignado_a_id uuid,
  asignada_a_id uuid,
  asignada_a_nombre text,
  creada_por_id uuid,
  creada_por_nombre text,
  fecha_creacion timestamptz DEFAULT now(),
  fecha_vencimiento timestamptz,
  fecha_completado timestamptz,
  fecha_completada timestamptz,
  completado_por_id uuid,
  completada_por_id uuid,
  completada_por_nombre text,
  fecha_cancelada timestamptz,
  cancelada_por_id uuid,
  cancelada_por_nombre text,
  razon_cancelacion text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS tareas_pendientes
  ADD COLUMN IF NOT EXISTS asignado_a_id uuid;
ALTER TABLE IF EXISTS tareas_pendientes
  ADD COLUMN IF NOT EXISTS asignada_a_id uuid;
ALTER TABLE IF EXISTS tareas_pendientes
  ADD COLUMN IF NOT EXISTS completado_por_id uuid;
ALTER TABLE IF EXISTS tareas_pendientes
  ADD COLUMN IF NOT EXISTS completada_por_id uuid;
ALTER TABLE IF EXISTS tareas_pendientes
  ADD COLUMN IF NOT EXISTS fecha_completado timestamptz;
ALTER TABLE IF EXISTS tareas_pendientes
  ADD COLUMN IF NOT EXISTS fecha_completada timestamptz;

-- -----------------------------
-- Cron tables
-- -----------------------------
CREATE TABLE IF NOT EXISTS cron_jobs_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  nombre_job text,
  descripcion text,
  activo boolean DEFAULT true,
  estado_job text DEFAULT 'inactivo',
  ultima_ejecucion timestamptz,
  proxima_ejecucion timestamptz,
  duracion_ejecucion_ms integer,
  intentos_ejecucion integer DEFAULT 0,
  resultado_ultima_ejecucion jsonb,
  error_ultima_ejecucion text,
  circuit_breaker_state text DEFAULT 'closed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cron_jobs_tracking_job_id
  ON cron_jobs_tracking (job_id);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_tracking_estado
  ON cron_jobs_tracking (estado_job);

CREATE TABLE IF NOT EXISTS cron_jobs_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  execution_id text,
  start_time timestamptz,
  end_time timestamptz,
  duracion_ms integer,
  estado text,
  request_id text,
  parametros_ejecucion jsonb,
  resultado jsonb,
  error_message text,
  memory_usage_start bigint,
  productos_procesados integer,
  productos_exitosos integer,
  productos_fallidos integer,
  alertas_generadas integer,
  emails_enviados integer,
  sms_enviados integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_execution_log_job
  ON cron_jobs_execution_log (job_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_execution_log_estado
  ON cron_jobs_execution_log (estado);

CREATE TABLE IF NOT EXISTS cron_jobs_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  execution_id text,
  tipo_alerta text,
  severidad text,
  titulo text,
  descripcion text,
  accion_recomendada text,
  canales_notificacion jsonb,
  fecha_envio timestamptz,
  estado_alerta text DEFAULT 'activas',
  fecha_resolucion timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_alerts_job
  ON cron_jobs_alerts (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_alerts_estado
  ON cron_jobs_alerts (estado_alerta);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_alerts_severidad
  ON cron_jobs_alerts (severidad);

CREATE TABLE IF NOT EXISTS cron_jobs_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text,
  channel_id text,
  priority text,
  source text,
  recipients jsonb,
  data jsonb,
  status text,
  message_id text,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_notifications_channel
  ON cron_jobs_notifications (channel_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS cron_jobs_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text,
  fecha_metricas date NOT NULL,
  ejecuciones_totales integer DEFAULT 0,
  disponibilidad_porcentual numeric DEFAULT 100,
  tiempo_promedio_ms integer DEFAULT 0,
  alertas_generadas_total integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_metrics_fecha
  ON cron_jobs_metrics (fecha_metricas DESC);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_metrics_job
  ON cron_jobs_metrics (job_id);

CREATE TABLE IF NOT EXISTS cron_jobs_monitoring_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  uptime_percentage numeric,
  response_time_ms integer,
  memory_usage_percent numeric,
  active_jobs_count integer,
  success_rate numeric,
  alerts_generated integer,
  health_score numeric,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_monitoring_history_ts
  ON cron_jobs_monitoring_history (timestamp DESC);

CREATE TABLE IF NOT EXISTS cron_jobs_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  check_type text,
  status text,
  response_time_ms integer,
  check_details jsonb,
  last_success timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_health_checks_job
  ON cron_jobs_health_checks (job_id, created_at DESC);

-- Config tables referenced by docs
CREATE TABLE IF NOT EXISTS cron_jobs_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  cron_expression text,
  edge_function_name text,
  cron_job_name text,
  descripcion text,
  parametros jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cron_jobs_config_job_id
  ON cron_jobs_config (job_id);

CREATE TABLE IF NOT EXISTS cron_jobs_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  channel_id text,
  enabled boolean DEFAULT true,
  preferences jsonb,
  created_at timestamptz DEFAULT now()
);

-- -----------------------------
-- Views
-- -----------------------------
CREATE OR REPLACE VIEW vista_oportunidades_ahorro AS
SELECT * FROM comparacion_precios WHERE es_oportunidad_ahorro = true;

CREATE OR REPLACE VIEW vista_alertas_activas AS
SELECT * FROM alertas_cambios_precios WHERE procesada = false;

CREATE OR REPLACE VIEW vista_cron_jobs_dashboard AS
SELECT * FROM cron_jobs_tracking;

CREATE OR REPLACE VIEW vista_cron_jobs_alertas_activas AS
SELECT * FROM cron_jobs_alerts WHERE estado_alerta IN ('activas', 'activa');

CREATE OR REPLACE VIEW vista_cron_jobs_metricas_semanales AS
SELECT
  job_id,
  date_trunc('week', fecha_metricas)::date AS semana,
  SUM(ejecuciones_totales) AS ejecuciones_totales,
  AVG(disponibilidad_porcentual) AS disponibilidad_promedio,
  AVG(tiempo_promedio_ms) AS tiempo_promedio_ms,
  SUM(alertas_generadas_total) AS alertas_generadas_total
FROM cron_jobs_metrics
GROUP BY job_id, date_trunc('week', fecha_metricas)::date
ORDER BY semana DESC;

-- -----------------------------
-- Functions / RPC
-- -----------------------------
CREATE OR REPLACE FUNCTION fnc_redondear_precio(precio numeric)
RETURNS numeric AS $$
BEGIN
  IF precio IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN round(precio::numeric, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fnc_margen_sugerido(p_producto_id uuid)
RETURNS numeric AS $$
DECLARE
  v_margen numeric;
BEGIN
  SELECT COALESCE((c.margen_minimo + c.margen_maximo) / 2, p.margen_ganancia, 0)
    INTO v_margen
  FROM productos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
  WHERE p.id = p_producto_id;

  RETURN COALESCE(v_margen, 0);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fnc_productos_bajo_minimo()
RETURNS TABLE (
  producto_id uuid,
  nombre text,
  sku text,
  stock_actual integer,
  stock_minimo integer,
  stock_maximo integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.producto_id,
    p.nombre,
    p.sku,
    s.cantidad_actual,
    s.stock_minimo,
    s.stock_maximo
  FROM stock_deposito s
  LEFT JOIN productos p ON p.id = s.producto_id
  WHERE s.cantidad_actual <= s.stock_minimo;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fnc_stock_disponible(
  p_producto_id uuid,
  p_deposito text DEFAULT 'Principal'
)
RETURNS TABLE (
  producto_id uuid,
  deposito text,
  stock_disponible integer
) AS $$
DECLARE
  v_reservado integer := 0;
BEGIN
  SELECT COALESCE(SUM(sr.cantidad), 0)
    INTO v_reservado
  FROM stock_reservado sr
  WHERE sr.producto_id = p_producto_id AND sr.estado = 'activa';

  RETURN QUERY
  SELECT
    sd.producto_id,
    COALESCE(p_deposito, 'Principal') AS deposito,
    COALESCE(SUM(sd.cantidad_actual), 0)::int - COALESCE(v_reservado, 0)::int AS stock_disponible
  FROM stock_deposito sd
  WHERE sd.producto_id = p_producto_id
    AND (p_deposito IS NULL OR sd.ubicacion = p_deposito)
  GROUP BY sd.producto_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT p_producto_id, COALESCE(p_deposito, 'Principal'), 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION sp_movimiento_inventario(
  p_producto_id uuid,
  p_tipo text,
  p_cantidad integer,
  p_origen text DEFAULT NULL,
  p_destino text DEFAULT NULL,
  p_usuario uuid DEFAULT NULL,
  p_orden_compra_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_ubicacion text := COALESCE(p_destino, p_origen, 'Principal');
  v_stock_actual integer := 0;
  v_stock_nuevo integer := 0;
BEGIN
  SELECT COALESCE(cantidad_actual, 0)
    INTO v_stock_actual
  FROM stock_deposito
  WHERE producto_id = p_producto_id AND ubicacion = v_ubicacion
  LIMIT 1;

  IF p_tipo = 'salida' THEN
    v_stock_nuevo := GREATEST(v_stock_actual - p_cantidad, 0);
  ELSE
    v_stock_nuevo := v_stock_actual + p_cantidad;
  END IF;

  IF v_stock_actual = 0 THEN
    INSERT INTO stock_deposito (producto_id, cantidad_actual, stock_minimo, stock_maximo, ubicacion, created_at)
    VALUES (p_producto_id, v_stock_nuevo, 0, 0, v_ubicacion, now());
  ELSE
    UPDATE stock_deposito
      SET cantidad_actual = v_stock_nuevo
    WHERE producto_id = p_producto_id AND ubicacion = v_ubicacion;
  END IF;

  INSERT INTO movimientos_deposito (
    producto_id,
    tipo_movimiento,
    cantidad,
    cantidad_anterior,
    cantidad_nueva,
    motivo,
    usuario_id,
    fecha_movimiento,
    created_at
  ) VALUES (
    p_producto_id,
    p_tipo,
    p_cantidad,
    v_stock_actual,
    v_stock_nuevo,
    p_origen,
    p_usuario,
    now(),
    now()
  );

  IF p_orden_compra_id IS NOT NULL THEN
    UPDATE ordenes_compra
      SET cantidad_recibida = COALESCE(cantidad_recibida, 0) + p_cantidad,
          estado = CASE
            WHEN COALESCE(cantidad_recibida, 0) + p_cantidad >= cantidad THEN 'completada'
            ELSE 'en_transito'
          END,
          updated_at = now()
    WHERE id = p_orden_compra_id;
  END IF;

  RETURN jsonb_build_object(
    'producto_id', p_producto_id,
    'tipo', p_tipo,
    'cantidad', p_cantidad,
    'stock_anterior', v_stock_actual,
    'stock_nuevo', v_stock_nuevo,
    'ubicacion', v_ubicacion
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fnc_deteccion_cambios_significativos(
  p_umbral_porcentual numeric DEFAULT 15
) RETURNS integer AS $$
DECLARE
  v_count integer := 0;
BEGIN
  WITH cambios AS (
    SELECT
      ph.producto_id,
      p.nombre AS nombre_producto,
      ph.precio_anterior,
      ph.precio_nuevo,
      CASE
        WHEN ph.precio_anterior IS NULL OR ph.precio_anterior = 0 THEN NULL
        ELSE ((ph.precio_nuevo - ph.precio_anterior) / ph.precio_anterior) * 100
      END AS porcentaje
    FROM precios_historicos ph
    LEFT JOIN productos p ON p.id = ph.producto_id
    WHERE ph.fecha_cambio >= now() - interval '24 hours'
  ), insertadas AS (
    INSERT INTO alertas_cambios_precios (
      producto_id,
      nombre_producto,
      tipo_cambio,
      valor_anterior,
      valor_nuevo,
      porcentaje_cambio,
      severidad,
      mensaje,
      accion_recomendada,
      fecha_alerta,
      procesada
    )
    SELECT
      c.producto_id,
      c.nombre_producto,
      CASE WHEN c.porcentaje >= 0 THEN 'aumento' ELSE 'disminucion' END,
      c.precio_anterior,
      c.precio_nuevo,
      c.porcentaje,
      CASE
        WHEN abs(c.porcentaje) >= 25 THEN 'critica'
        WHEN abs(c.porcentaje) >= 15 THEN 'alta'
        WHEN abs(c.porcentaje) >= 8 THEN 'media'
        ELSE 'baja'
      END,
      'Cambio de precio significativo detectado',
      'Revisar estrategia de precios',
      now(),
      false
    FROM cambios c
    WHERE c.porcentaje IS NOT NULL
      AND abs(c.porcentaje) >= p_umbral_porcentual
      AND NOT EXISTS (
        SELECT 1 FROM alertas_cambios_precios a
        WHERE a.producto_id = c.producto_id
          AND a.fecha_alerta >= now() - interval '24 hours'
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM insertadas;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fnc_limpiar_datos_antiguos()
RETURNS integer AS $$
DECLARE
  v_total integer := 0;
  v_count integer := 0;
BEGIN
  DELETE FROM comparacion_precios
  WHERE fecha_comparacion < now() - interval '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;

  DELETE FROM alertas_cambios_precios
  WHERE procesada = true AND fecha_alerta < now() - interval '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;

  DELETE FROM estadisticas_scraping
  WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_total := v_total + v_count;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------
-- Materialized view for tareas
-- -----------------------------
DROP MATERIALIZED VIEW IF EXISTS tareas_metricas;

CREATE MATERIALIZED VIEW tareas_metricas AS
SELECT
  t.id AS tarea_id,
  COALESCE(t.asignado_a_id, t.asignada_a_id) AS asignado_a_id,
  COALESCE(t.completado_por_id, t.completada_por_id) AS completado_por_id,
  t.estado,
  t.fecha_creacion,
  t.fecha_vencimiento,
  COALESCE(t.fecha_completado, t.fecha_completada) AS fecha_completado,
  ROUND(EXTRACT(EPOCH FROM (COALESCE(t.fecha_completado, t.fecha_completada) - t.fecha_creacion)) / 3600, 2)
    AS tiempo_resolucion,
  CASE
    WHEN t.fecha_vencimiento IS NULL OR COALESCE(t.fecha_completado, t.fecha_completada) IS NULL THEN NULL
    WHEN COALESCE(t.fecha_completado, t.fecha_completada) <= t.fecha_vencimiento THEN TRUE
    ELSE FALSE
  END AS cumplimiento_sla,
  CASE
    WHEN t.fecha_vencimiento IS NULL THEN NULL
    WHEN COALESCE(t.fecha_completado, t.fecha_completada) IS NULL THEN GREATEST(0, DATE_PART('day', NOW() - t.fecha_vencimiento))
    ELSE GREATEST(0, DATE_PART('day', COALESCE(t.fecha_completado, t.fecha_completada) - t.fecha_vencimiento))
  END::INT AS dias_atraso
FROM tareas_pendientes t;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tareas_metricas_tarea_id
  ON tareas_metricas (tarea_id);

CREATE OR REPLACE FUNCTION refresh_tareas_metricas()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tareas_metricas;
EXCEPTION
  WHEN feature_not_supported THEN
    REFRESH MATERIALIZED VIEW tareas_metricas;
END;
$$;
