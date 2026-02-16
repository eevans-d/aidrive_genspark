-- Migration: Enable RLS on precios_proveedor (traceability alignment)
--
-- Context: precios_proveedor already has RLS enabled in the remote DB
-- (verified via Management API, see docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md),
-- but no migration in the repo explicitly enables it. This migration
-- closes the traceability gap so that local/CI environments match remote.
--
-- This table is accessed exclusively by service_role (scraper-maxiconsumo
-- Edge Function with validateApiSecret auth). No anon/authenticated
-- access is needed.

BEGIN;

-- PART 1: Enable RLS (idempotent: no-op if already enabled)
ALTER TABLE public.precios_proveedor ENABLE ROW LEVEL SECURITY;

-- PART 2: Revoke all from public roles (defense-in-depth)
REVOKE ALL ON public.precios_proveedor FROM anon;
REVOKE ALL ON public.precios_proveedor FROM authenticated;

-- PART 3: Ensure service_role retains access
GRANT ALL ON public.precios_proveedor TO service_role;

COMMIT;

-- Rollback (manual, if needed):
--   ALTER TABLE public.precios_proveedor DISABLE ROW LEVEL SECURITY;
--   GRANT ALL ON public.precios_proveedor TO anon, authenticated;
