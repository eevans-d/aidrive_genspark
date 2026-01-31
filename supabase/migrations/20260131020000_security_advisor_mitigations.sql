-- Security Advisor mitigations (search_path + security_invoker + revoke anon)
-- Generated 2026-01-31 after Advisor mitigation in PROD.

BEGIN;

-- Fix search_path for functions flagged by Advisor
ALTER FUNCTION IF EXISTS public.has_personal_role(roles text[]) SET search_path = public;
ALTER FUNCTION IF EXISTS public.fnc_redondear_precio(precio numeric) SET search_path = public;
ALTER FUNCTION IF EXISTS public.fnc_margen_sugerido(p_producto_id uuid) SET search_path = public;
ALTER FUNCTION IF EXISTS public.fnc_productos_bajo_minimo() SET search_path = public;
ALTER FUNCTION IF EXISTS public.fnc_stock_disponible(p_producto_id uuid, p_deposito text) SET search_path = public;

-- SECURITY DEFINER views -> security_invoker (internal dashboards)
ALTER VIEW IF EXISTS public.vista_cron_jobs_dashboard SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vista_cron_jobs_metricas_semanales SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vista_cron_jobs_alertas_activas SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vista_alertas_activas SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vista_oportunidades_ahorro SET (security_invoker = true);

-- Revoke anon grants from internal tables/views/materialized views
REVOKE ALL ON TABLE public.alertas_cambios_precios FROM anon;
REVOKE ALL ON TABLE public.cache_proveedor FROM anon;
REVOKE ALL ON TABLE public.comparacion_precios FROM anon;
REVOKE ALL ON TABLE public.configuracion_proveedor FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_alerts FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_config FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_execution_log FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_health_checks FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_metrics FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_monitoring_history FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_notification_preferences FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_notifications FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_tracking FROM anon;
REVOKE ALL ON TABLE public.estadisticas_scraping FROM anon;
REVOKE ALL ON TABLE public.precios_proveedor FROM anon;
REVOKE ALL ON TABLE public.stock_reservado FROM anon;

REVOKE ALL ON TABLE public.vista_alertas_activas FROM anon;
REVOKE ALL ON TABLE public.vista_cron_jobs_alertas_activas FROM anon;
REVOKE ALL ON TABLE public.vista_cron_jobs_dashboard FROM anon;
REVOKE ALL ON TABLE public.vista_cron_jobs_metricas_semanales FROM anon;
REVOKE ALL ON TABLE public.vista_oportunidades_ahorro FROM anon;

REVOKE ALL ON TABLE public.tareas_metricas FROM anon;

COMMIT;
