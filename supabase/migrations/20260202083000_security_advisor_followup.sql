-- Security Advisor follow-up: fix mutable search_path + restrict materialized view access
-- Generated 2026-02-02 after COMET verification (WARN=3).

BEGIN;

-- Fix mutable search_path warning for SECURITY DEFINER function
ALTER FUNCTION public.sp_aplicar_precio(uuid, numeric, numeric)
  SET search_path = public;

-- Prevent data API access to materialized view by anon/authenticated
REVOKE ALL ON TABLE public.tareas_metricas FROM anon;
REVOKE ALL ON TABLE public.tareas_metricas FROM authenticated;

COMMIT;
