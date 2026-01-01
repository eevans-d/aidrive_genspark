-- Vista materializada para métricas de tareas
-- Incluye tiempo_resolucion (horas), cumplimiento_sla y dias_atraso

DROP MATERIALIZED VIEW IF EXISTS tareas_metricas;

CREATE MATERIALIZED VIEW tareas_metricas AS
SELECT
    t.id AS tarea_id,
    t.asignado_a_id,
    t.completado_por_id,
    t.estado,
    t.fecha_creacion,
    t.fecha_vencimiento,
    t.fecha_completado,
    ROUND(EXTRACT(EPOCH FROM (t.fecha_completado - t.fecha_creacion)) / 3600, 2)
        AS tiempo_resolucion,
    CASE
        WHEN t.fecha_vencimiento IS NULL OR t.fecha_completado IS NULL THEN NULL
        WHEN t.fecha_completado <= t.fecha_vencimiento THEN TRUE
        ELSE FALSE
    END AS cumplimiento_sla,
    CASE
        WHEN t.fecha_vencimiento IS NULL THEN NULL
        WHEN t.fecha_completado IS NULL THEN GREATEST(0, DATE_PART('day', NOW() - t.fecha_vencimiento))
        ELSE GREATEST(0, DATE_PART('day', t.fecha_completado - t.fecha_vencimiento))
    END::INT AS dias_atraso
FROM tareas_pendientes t;

CREATE UNIQUE INDEX idx_tareas_metricas_tarea_id ON tareas_metricas (tarea_id);

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
