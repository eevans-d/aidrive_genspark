-- ============================================================================
-- Migration: Hardening global de SECURITY DEFINER (search_path)
-- Descripcion: asegura search_path fijo en funciones SECURITY DEFINER del schema public
-- Fecha: 2026-02-24
-- ============================================================================

BEGIN;

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      fn.schema_name,
      fn.function_name,
      fn.identity_args
    );

    RAISE NOTICE 'Hardened SECURITY DEFINER function %.%(%)',
      fn.schema_name,
      fn.function_name,
      fn.identity_args;
  END LOOP;
END $$;

COMMIT;
