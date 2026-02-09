-- ============================================================================
-- Add fn_refresh_stock_views (RPC) + optional pg_cron schedule
-- Fecha: 2026-02-08
-- ============================================================================
-- Contexto:
-- - El frontend lee MVs `mv_stock_bajo` y `mv_productos_proximos_vencer` (AlertsDrawer).
-- - En el remoto se detectó ausencia de un helper para refrescarlas vía RPC, lo
--   cual dificulta automatizar/operar el refresh hacia producción.
--
-- Objetivo:
-- - Crear `public.fn_refresh_stock_views()` (RETURNS void) para refrescar ambas MVs.
-- - Intentar `REFRESH ... CONCURRENTLY` y fallback a refresh normal si no está permitido
--   en el contexto de ejecución (por ejemplo, dentro de una transacción).
-- - (Opcional) Crear un job de pg_cron si la extensión está instalada, evitando duplicados.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_refresh_stock_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Best-effort: intentar refresh concurrente, y fallback a refresh normal.
  BEGIN
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_stock_bajo';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'REFRESH MATERIALIZED VIEW public.mv_stock_bajo';
  END;

  BEGIN
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_productos_proximos_vencer';
  EXCEPTION WHEN OTHERS THEN
    EXECUTE 'REFRESH MATERIALIZED VIEW public.mv_productos_proximos_vencer';
  END;
END;
$$;

COMMENT ON FUNCTION public.fn_refresh_stock_views() IS
  'Refresca MVs de stock usadas por AlertsDrawer (mv_stock_bajo y mv_productos_proximos_vencer). Intenta CONCURRENTLY y hace fallback a refresh normal.';

-- Seguridad: evitar que roles públicos puedan forzar refresh (carga).
REVOKE ALL ON FUNCTION public.fn_refresh_stock_views() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_refresh_stock_views() TO service_role;

-- Opcional: schedule del refresh cada hora si pg_cron está disponible.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_stock_views') THEN
      PERFORM cron.schedule(
        'refresh_stock_views',
        '7 * * * *',
        'SELECT public.fn_refresh_stock_views()'
      );
    END IF;
  END IF;
END $$;
