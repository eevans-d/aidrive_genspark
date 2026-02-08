-- ============================================================================
-- FASE 1: ARBITRAJE DE PRECIOS — Vistas de análisis
-- ============================================================================
-- vista_arbitraje_producto: por producto, última y anterior comparación,
--   delta costo proveedor, margen vs reposición, flags riesgo.
-- vista_oportunidades_compra: productos con stock bajo + caída de costo >= 10%.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. vista_arbitraje_producto
-- ----------------------------------------------------------------------------
-- Para cada producto obtiene:
--   - costo_proveedor_actual: precio_proveedor de la comparación más reciente
--   - costo_proveedor_prev:   precio_proveedor de la comparación previa
--   - delta_costo_pct:        variación porcentual entre ambas (NULL si no hay previa)
--   - precio_venta_actual:    precio de venta del producto
--   - margen_vs_reposicion:   margen bruto si se repone al costo actual del proveedor
--   - riesgo_perdida:         TRUE si costo_proveedor_actual > precio_venta_actual
--   - margen_bajo:            TRUE si margen_vs_reposicion < 10%
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW vista_arbitraje_producto AS
WITH ranked AS (
  SELECT
    cp.producto_id,
    cp.nombre_producto,
    cp.precio_proveedor,
    cp.precio_actual   AS precio_producto_snapshot,
    cp.fecha_comparacion,
    ROW_NUMBER() OVER (
      PARTITION BY cp.producto_id
      ORDER BY cp.fecha_comparacion DESC
    ) AS rn
  FROM comparacion_precios cp
  WHERE cp.producto_id IS NOT NULL
),
ultima AS (
  SELECT producto_id, nombre_producto, precio_proveedor, fecha_comparacion
  FROM ranked WHERE rn = 1
),
previa AS (
  SELECT producto_id, precio_proveedor
  FROM ranked WHERE rn = 2
)
SELECT
  u.producto_id,
  COALESCE(p.nombre, u.nombre_producto)                         AS nombre_producto,
  p.sku,
  u.precio_proveedor                                             AS costo_proveedor_actual,
  pr.precio_proveedor                                            AS costo_proveedor_prev,
  CASE
    WHEN pr.precio_proveedor IS NOT NULL AND pr.precio_proveedor > 0
    THEN ROUND(
      ((u.precio_proveedor - pr.precio_proveedor) / pr.precio_proveedor * 100)::numeric,
      2
    )
    ELSE NULL
  END                                                            AS delta_costo_pct,
  p.precio_actual                                                AS precio_venta_actual,
  CASE
    WHEN p.precio_actual IS NOT NULL AND p.precio_actual > 0
    THEN ROUND(
      ((p.precio_actual - u.precio_proveedor) / p.precio_actual * 100)::numeric,
      2
    )
    ELSE NULL
  END                                                            AS margen_vs_reposicion,
  -- Flag: vendemos por debajo de lo que costará reponer
  (u.precio_proveedor > COALESCE(p.precio_actual, 0))           AS riesgo_perdida,
  -- Flag: margen < 10% si se repone a costo actual
  (
    p.precio_actual IS NOT NULL
    AND p.precio_actual > 0
    AND ((p.precio_actual - u.precio_proveedor) / p.precio_actual * 100) < 10
  )                                                              AS margen_bajo,
  u.fecha_comparacion                                            AS fecha_ultima_comparacion
FROM ultima u
INNER JOIN productos p ON u.producto_id = p.id AND p.activo = true
LEFT JOIN previa pr ON u.producto_id = pr.producto_id;

-- Comentario para documentación
COMMENT ON VIEW vista_arbitraje_producto IS
  'Arbitraje de precios: compara costo proveedor actual vs precio de venta y costo previo. Fase 1.';

-- ----------------------------------------------------------------------------
-- 2. vista_oportunidades_compra
-- ----------------------------------------------------------------------------
-- Productos con stock bajo (según mv_stock_bajo) cuyo costo de proveedor
-- cayó >= 10% respecto a la comparación previa.
-- Nota: mv_stock_bajo es materializada (hasta 1h desfasada).
--       Si no hay comparación previa (delta NULL), NO es oportunidad.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW vista_oportunidades_compra AS
SELECT
  va.producto_id,
  va.nombre_producto,
  va.sku,
  va.costo_proveedor_actual,
  va.costo_proveedor_prev,
  va.delta_costo_pct,
  va.precio_venta_actual,
  va.margen_vs_reposicion,
  msb.cantidad_actual,
  msb.stock_minimo,
  msb.nivel_stock,
  va.fecha_ultima_comparacion
FROM vista_arbitraje_producto va
INNER JOIN mv_stock_bajo msb ON va.producto_id = msb.producto_id
WHERE
  va.delta_costo_pct IS NOT NULL
  AND va.delta_costo_pct <= -10;

COMMENT ON VIEW vista_oportunidades_compra IS
  'Oportunidades de compra: stock bajo + caída de costo proveedor >= 10%. Fase 1.';
