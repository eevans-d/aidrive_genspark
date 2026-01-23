-- Migration: Stock aggregations for performance optimization
-- Purpose: Create materialized views and functions to optimize dashboard queries
-- Date: 2026-01-16
-- Dependencies: stock_deposito, productos, movimientos_deposito tables

-- ============================================================================
-- 1. VISTA MATERIALIZADA: Productos con stock bajo
-- ============================================================================
-- Optimiza consultas de productos que necesitan reposición
-- Actualización: REFRESH MATERIALIZED VIEW CONCURRENTLY cada hora (vía cron)

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stock_bajo AS
SELECT 
  sd.id AS stock_id,
  sd.producto_id,
  p.nombre AS producto_nombre,
  p.sku,
  p.codigo_barras,
  p.categoria_id,
  c.nombre AS categoria_nombre,
  sd.cantidad_actual,
  sd.stock_minimo,
  sd.stock_maximo,
  CASE 
    WHEN sd.cantidad_actual <= 0 THEN 'sin_stock'
    WHEN sd.cantidad_actual < sd.stock_minimo * 0.5 THEN 'critico'
    WHEN sd.cantidad_actual < sd.stock_minimo THEN 'bajo'
    ELSE 'normal'
  END AS nivel_stock,
  -- Cálculo de porcentaje de stock respecto al mínimo
  CASE 
    WHEN sd.stock_minimo > 0 THEN 
      ROUND((sd.cantidad_actual::numeric / sd.stock_minimo::numeric * 100)::numeric, 2)
    ELSE 100
  END AS porcentaje_stock_minimo,
  sd.ubicacion,
  sd.updated_at AS ultima_actualizacion
FROM stock_deposito sd
INNER JOIN productos p ON sd.producto_id = p.id
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE 
  p.activo = true
  AND sd.stock_minimo IS NOT NULL
  AND sd.stock_minimo > 0
  AND sd.cantidad_actual < sd.stock_minimo;

-- Índices para optimizar consultas
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stock_bajo_stock_id 
  ON mv_stock_bajo (stock_id);
CREATE INDEX IF NOT EXISTS idx_mv_stock_bajo_producto_id 
  ON mv_stock_bajo (producto_id);
CREATE INDEX IF NOT EXISTS idx_mv_stock_bajo_nivel 
  ON mv_stock_bajo (nivel_stock);
CREATE INDEX IF NOT EXISTS idx_mv_stock_bajo_categoria 
  ON mv_stock_bajo (categoria_id);

COMMENT ON MATERIALIZED VIEW mv_stock_bajo IS 
  'Vista materializada de productos con stock por debajo del mínimo configurado. Refresh cada hora vía cron.';

-- ============================================================================
-- 2. VISTA MATERIALIZADA: Productos próximos a vencer
-- ============================================================================
-- Optimiza alertas de vencimiento
-- Requiere campo fecha_vencimiento en stock_deposito (nullable por compatibilidad)

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_productos_proximos_vencer AS
SELECT 
  sd.id AS stock_id,
  sd.producto_id,
  p.nombre AS producto_nombre,
  p.sku,
  p.codigo_barras,
  sd.lote,
  sd.fecha_vencimiento,
  sd.cantidad_actual,
  -- Días hasta el vencimiento
  (sd.fecha_vencimiento::date - CURRENT_DATE) AS dias_hasta_vencimiento,
  CASE 
    WHEN sd.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
    WHEN sd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgente'
    WHEN sd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'proximo'
    ELSE 'normal'
  END AS nivel_alerta,
  sd.ubicacion,
  sd.updated_at AS ultima_actualizacion
FROM stock_deposito sd
INNER JOIN productos p ON sd.producto_id = p.id
WHERE 
  p.activo = true
  AND sd.fecha_vencimiento IS NOT NULL
  AND sd.cantidad_actual > 0
  AND sd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '60 days';

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vencimiento_stock_id 
  ON mv_productos_proximos_vencer (stock_id);
CREATE INDEX IF NOT EXISTS idx_mv_vencimiento_producto_id 
  ON mv_productos_proximos_vencer (producto_id);
CREATE INDEX IF NOT EXISTS idx_mv_vencimiento_nivel 
  ON mv_productos_proximos_vencer (nivel_alerta);
CREATE INDEX IF NOT EXISTS idx_mv_vencimiento_fecha 
  ON mv_productos_proximos_vencer (fecha_vencimiento);

COMMENT ON MATERIALIZED VIEW mv_productos_proximos_vencer IS 
  'Vista materializada de productos con fechas de vencimiento próximas (60 días). Refresh cada 6 horas vía cron.';

-- ============================================================================
-- 3. VISTA: Resumen de stock por categoría (no materializada, siempre actualizada)
-- ============================================================================

CREATE OR REPLACE VIEW vista_stock_por_categoria AS
SELECT 
  c.id AS categoria_id,
  c.nombre AS categoria_nombre,
  COUNT(DISTINCT p.id) AS total_productos,
  COUNT(DISTINCT CASE WHEN sd.cantidad_actual > 0 THEN p.id END) AS productos_con_stock,
  COUNT(DISTINCT CASE WHEN sd.cantidad_actual < sd.stock_minimo THEN p.id END) AS productos_stock_bajo,
  SUM(sd.cantidad_actual) AS cantidad_total_stock,
  SUM(CASE WHEN sd.cantidad_actual < sd.stock_minimo THEN sd.cantidad_actual ELSE 0 END) AS cantidad_stock_bajo,
  -- Valor total de inventario (requiere precio_compra en productos)
  SUM(sd.cantidad_actual * COALESCE(p.precio_costo, 0)) AS valor_inventario_total
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = true
LEFT JOIN stock_deposito sd ON p.id = sd.producto_id
WHERE c.activo = true
GROUP BY c.id, c.nombre
ORDER BY c.nombre;

COMMENT ON VIEW vista_stock_por_categoria IS 
  'Resumen agregado de stock por categoría con métricas de valor e inventario.';

-- ============================================================================
-- 4. FUNCIÓN: Métricas del dashboard (optimizada)
-- ============================================================================
-- Reemplaza múltiples queries individuales con una sola llamada RPC

CREATE OR REPLACE FUNCTION fn_dashboard_metrics(
  p_ubicacion text DEFAULT NULL
)
RETURNS TABLE (
  metric_name text,
  metric_value bigint,
  metric_label text
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  
  -- Total productos activos
  SELECT 
    'total_productos'::text,
    COUNT(*)::bigint,
    'Total de productos activos'::text
  FROM productos
  WHERE activo = true
  
  UNION ALL
  
  -- Productos con stock bajo
  SELECT 
    'stock_bajo'::text,
    COUNT(DISTINCT sd.producto_id)::bigint,
    'Productos con stock bajo'::text
  FROM stock_deposito sd
  INNER JOIN productos p ON sd.producto_id = p.id
  WHERE 
    p.activo = true
    AND sd.stock_minimo IS NOT NULL
    AND sd.cantidad_actual < sd.stock_minimo
    AND (p_ubicacion IS NULL OR sd.ubicacion = p_ubicacion)
  
  UNION ALL
  
  -- Productos sin stock
  SELECT 
    'sin_stock'::text,
    COUNT(DISTINCT sd.producto_id)::bigint,
    'Productos sin stock'::text
  FROM stock_deposito sd
  INNER JOIN productos p ON sd.producto_id = p.id
  WHERE 
    p.activo = true
    AND sd.cantidad_actual <= 0
    AND (p_ubicacion IS NULL OR sd.ubicacion = p_ubicacion)
  
  UNION ALL
  
  -- Productos próximos a vencer (30 días)
  SELECT 
    'proximos_vencer'::text,
    COUNT(DISTINCT sd.producto_id)::bigint,
    'Productos próximos a vencer (30 días)'::text
  FROM stock_deposito sd
  INNER JOIN productos p ON sd.producto_id = p.id
  WHERE 
    p.activo = true
    AND sd.fecha_vencimiento IS NOT NULL
    AND sd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
    AND sd.fecha_vencimiento >= CURRENT_DATE
    AND (p_ubicacion IS NULL OR sd.ubicacion = p_ubicacion)
  
  UNION ALL
  
  -- Productos vencidos
  SELECT 
    'vencidos'::text,
    COUNT(DISTINCT sd.producto_id)::bigint,
    'Productos vencidos'::text
  FROM stock_deposito sd
  INNER JOIN productos p ON sd.producto_id = p.id
  WHERE 
    p.activo = true
    AND sd.fecha_vencimiento IS NOT NULL
    AND sd.fecha_vencimiento < CURRENT_DATE
    AND sd.cantidad_actual > 0
    AND (p_ubicacion IS NULL OR sd.ubicacion = p_ubicacion)
  
  UNION ALL
  
  -- Total categorías activas
  SELECT 
    'total_categorias'::text,
    COUNT(*)::bigint,
    'Total de categorías activas'::text
  FROM categorias
  WHERE activo = true
  
  UNION ALL
  
  -- Total proveedores activos
  SELECT 
    'total_proveedores'::text,
    COUNT(*)::bigint,
    'Total de proveedores activos'::text
  FROM proveedores
  WHERE activo = true;
  
END;
$$;

COMMENT ON FUNCTION fn_dashboard_metrics IS 
  'Retorna métricas agregadas para el dashboard en una sola llamada optimizada. Filtro opcional por ubicacion.';

-- ============================================================================
-- 5. FUNCIÓN: Rotación de productos (últimos N días)
-- ============================================================================
-- Calcula velocidad de salida de productos para reposición inteligente

CREATE OR REPLACE FUNCTION fn_rotacion_productos(
  p_dias integer DEFAULT 30,
  p_limite integer DEFAULT 100
)
RETURNS TABLE (
  producto_id uuid,
  producto_nombre text,
  sku text,
  total_salidas bigint,
  total_ventas bigint,
  promedio_diario numeric,
  dias_analisis integer,
  stock_actual bigint,
  dias_cobertura numeric,
  nivel_rotacion text
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  
  WITH movimientos_periodo AS (
    SELECT 
      md.producto_id,
      SUM(CASE WHEN md.tipo_movimiento = 'salida' THEN md.cantidad ELSE 0 END) AS salidas,
      SUM(CASE WHEN md.tipo_movimiento = 'venta' THEN md.cantidad ELSE 0 END) AS ventas
    FROM movimientos_deposito md
    WHERE 
      md.fecha_movimiento >= CURRENT_DATE - (p_dias || ' days')::interval
      AND md.tipo_movimiento IN ('salida', 'venta')
    GROUP BY md.producto_id
  ),
  stock_actual AS (
    SELECT 
      sd.producto_id,
      SUM(sd.cantidad_actual) AS cantidad
    FROM stock_deposito sd
    GROUP BY sd.producto_id
  )
  SELECT 
    p.id,
    p.nombre,
    p.sku,
    COALESCE(mp.salidas, 0)::bigint,
    COALESCE(mp.ventas, 0)::bigint,
    ROUND(
      (COALESCE(mp.salidas, 0) + COALESCE(mp.ventas, 0))::numeric / p_dias::numeric, 
      2
    ) AS promedio_diario,
    p_dias,
    COALESCE(sa.cantidad, 0)::bigint,
    -- Días de cobertura con stock actual
    CASE 
      WHEN (COALESCE(mp.salidas, 0) + COALESCE(mp.ventas, 0)) > 0 THEN
        ROUND(
          COALESCE(sa.cantidad, 0)::numeric / 
          ((COALESCE(mp.salidas, 0) + COALESCE(mp.ventas, 0))::numeric / p_dias::numeric),
          1
        )
      ELSE NULL
    END AS dias_cobertura,
    -- Clasificación de rotación
    CASE 
      WHEN (COALESCE(mp.salidas, 0) + COALESCE(mp.ventas, 0))::numeric / p_dias > 10 THEN 'alta'
      WHEN (COALESCE(mp.salidas, 0) + COALESCE(mp.ventas, 0))::numeric / p_dias > 3 THEN 'media'
      WHEN (COALESCE(mp.salidas, 0) + COALESCE(mp.ventas, 0))::numeric / p_dias > 0 THEN 'baja'
      ELSE 'sin_movimiento'
    END AS nivel_rotacion
  FROM productos p
  LEFT JOIN movimientos_periodo mp ON p.id = mp.producto_id
  LEFT JOIN stock_actual sa ON p.id = sa.producto_id
  WHERE p.activo = true
  ORDER BY (COALESCE(mp.salidas, 0) + COALESCE(mp.ventas, 0)) DESC
  LIMIT p_limite;
  
END;
$$;

COMMENT ON FUNCTION fn_rotacion_productos IS 
  'Calcula rotación de productos basada en movimientos históricos (salidas + ventas). Útil para reposición inteligente.';

-- ============================================================================
-- 6. FUNCIÓN: Refresh de vistas materializadas (para cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_refresh_stock_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh concurrente permite queries durante la actualización
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stock_bajo;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_productos_proximos_vencer;
  
  RAISE NOTICE 'Stock materialized views refreshed successfully at %', now();
END;
$$;

COMMENT ON FUNCTION fn_refresh_stock_views IS 
  'Actualiza todas las vistas materializadas de stock. Llamar desde cron cada hora.';

-- ============================================================================
-- PERMISOS RLS (si aplica)
-- ============================================================================

-- Las vistas materializadas heredan permisos de las tablas base
-- Las funciones con SECURITY DEFINER ejecutan como owner (bypass RLS)

-- ============================================================================
-- NOTAS DE MANTENIMIENTO
-- ============================================================================
-- 
-- 1. REFRESH AUTOMÁTICO (configurar en cron):
--    - mv_stock_bajo: cada 1 hora
--    - mv_productos_proximos_vencer: cada 6 horas
--    
--    Comando: SELECT fn_refresh_stock_views();
--
-- 2. MONITOREO:
--    SELECT 
--      schemaname, 
--      matviewname, 
--      last_refresh 
--    FROM pg_matviews 
--    WHERE matviewname LIKE 'mv_%';
--
-- 3. ÍNDICES:
--    Los índices UNIQUE requieren que el refresh sea CONCURRENTLY
--    para evitar locks durante actualización.
--
-- 4. PERFORMANCE:
--    - Vistas materializadas: lectura muy rápida, escritura periódica
--    - Funciones: cálculo en tiempo real pero optimizado con índices
--    - Vista normal (vista_stock_por_categoria): siempre actualizada
--
-- ============================================================================
