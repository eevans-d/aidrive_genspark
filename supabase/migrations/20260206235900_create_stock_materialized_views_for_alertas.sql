-- ============================================================================
-- Hotfix: Create missing stock materialized views used by AlertsDrawer
-- Fecha: 2026-02-06
-- ============================================================================
-- Contexto:
-- - El frontend usa lecturas directas (RLS) sobre `mv_stock_bajo` y
--   `mv_productos_proximos_vencer` en `useAlertas`.
-- - En el proyecto remoto vinculado se detectó ausencia de estas MVs, lo cual:
--   - rompe queries del drawer de alertas, y
--   - bloquea migraciones posteriores que dependen de estas relaciones.
--
-- Objetivo:
-- - (Re)crear ambas MVs en `public` si no existen.
-- - Crear índices básicos.
-- - Garantizar `SELECT` para `authenticated` (la UI no usa `anon`).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) mv_stock_bajo
-- ----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_stock_bajo AS
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
  CASE
    WHEN sd.stock_minimo > 0 THEN
      ROUND((sd.cantidad_actual::numeric / sd.stock_minimo::numeric * 100)::numeric, 2)
    ELSE 100
  END AS porcentaje_stock_minimo,
  sd.ubicacion,
  sd.updated_at AS ultima_actualizacion
FROM public.stock_deposito sd
INNER JOIN public.productos p ON sd.producto_id = p.id
LEFT JOIN public.categorias c ON p.categoria_id = c.id
WHERE
  p.activo = true
  AND sd.stock_minimo IS NOT NULL
  AND sd.stock_minimo > 0
  AND sd.cantidad_actual < sd.stock_minimo;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stock_bajo_stock_id
  ON public.mv_stock_bajo (stock_id);
CREATE INDEX IF NOT EXISTS idx_mv_stock_bajo_producto_id
  ON public.mv_stock_bajo (producto_id);
CREATE INDEX IF NOT EXISTS idx_mv_stock_bajo_nivel
  ON public.mv_stock_bajo (nivel_stock);
CREATE INDEX IF NOT EXISTS idx_mv_stock_bajo_categoria
  ON public.mv_stock_bajo (categoria_id);

COMMENT ON MATERIALIZED VIEW public.mv_stock_bajo IS
  'Vista materializada: productos con stock por debajo del mínimo. Usada por AlertsDrawer.';

REVOKE ALL ON public.mv_stock_bajo FROM anon;
REVOKE ALL ON public.mv_stock_bajo FROM authenticated;
GRANT SELECT ON public.mv_stock_bajo TO authenticated;

-- ----------------------------------------------------------------------------
-- 2) mv_productos_proximos_vencer
-- ----------------------------------------------------------------------------

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_productos_proximos_vencer AS
SELECT
  sd.id AS stock_id,
  sd.producto_id,
  p.nombre AS producto_nombre,
  p.sku,
  p.codigo_barras,
  sd.lote,
  sd.fecha_vencimiento,
  sd.cantidad_actual,
  (sd.fecha_vencimiento::date - CURRENT_DATE) AS dias_hasta_vencimiento,
  CASE
    WHEN sd.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
    WHEN sd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgente'
    WHEN sd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'proximo'
    ELSE 'normal'
  END AS nivel_alerta,
  sd.ubicacion,
  sd.updated_at AS ultima_actualizacion
FROM public.stock_deposito sd
INNER JOIN public.productos p ON sd.producto_id = p.id
WHERE
  p.activo = true
  AND sd.fecha_vencimiento IS NOT NULL
  AND sd.cantidad_actual > 0
  AND sd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '60 days';

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vencimiento_stock_id
  ON public.mv_productos_proximos_vencer (stock_id);
CREATE INDEX IF NOT EXISTS idx_mv_vencimiento_producto_id
  ON public.mv_productos_proximos_vencer (producto_id);
CREATE INDEX IF NOT EXISTS idx_mv_vencimiento_nivel
  ON public.mv_productos_proximos_vencer (nivel_alerta);
CREATE INDEX IF NOT EXISTS idx_mv_vencimiento_fecha
  ON public.mv_productos_proximos_vencer (fecha_vencimiento);

COMMENT ON MATERIALIZED VIEW public.mv_productos_proximos_vencer IS
  'Vista materializada: productos con vencimiento en <= 60 días. Usada por AlertsDrawer.';

REVOKE ALL ON public.mv_productos_proximos_vencer FROM anon;
REVOKE ALL ON public.mv_productos_proximos_vencer FROM authenticated;
GRANT SELECT ON public.mv_productos_proximos_vencer TO authenticated;

COMMIT;

