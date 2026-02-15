-- ============================================================
-- Migration: P0 Security Hardening — RLS + Grants + search_path
-- Date: 2026-02-15
-- Description:
--   1) Enable RLS on internal tables: rate_limit_state,
--      circuit_breaker_state, cron_jobs_locks.
--   2) Revoke all privileges from anon/authenticated on those
--      tables (defense in depth — only service_role should access).
--   3) Fix mutable search_path on sp_aplicar_precio(uuid, numeric, numeric),
--      which was overwritten without SET search_path by migration
--      20260212100000_pricing_module_integrity.sql.
--
-- Rollback: see comments at end of file.
-- ============================================================

BEGIN;

-- =============================================================
-- PART 1: Enable Row Level Security on internal tables
-- =============================================================

ALTER TABLE public.rate_limit_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuit_breaker_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_jobs_locks ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed: these tables are only accessed via
-- SECURITY DEFINER functions (sp_check_rate_limit, sp_circuit_breaker_*,
-- sp_acquire_job_lock, sp_release_job_lock) which run as the function
-- owner (postgres/superuser), bypassing RLS. service_role also bypasses
-- RLS by default in Supabase.

-- =============================================================
-- PART 2: Revoke privileges from anon/authenticated (defense in depth)
-- =============================================================
-- Even with RLS enabled and no policies (which blocks access), we
-- explicitly revoke grants so that if RLS is ever accidentally
-- disabled, these roles still cannot touch the tables.

REVOKE ALL ON TABLE public.rate_limit_state FROM anon;
REVOKE ALL ON TABLE public.rate_limit_state FROM authenticated;

REVOKE ALL ON TABLE public.circuit_breaker_state FROM anon;
REVOKE ALL ON TABLE public.circuit_breaker_state FROM authenticated;

REVOKE ALL ON TABLE public.cron_jobs_locks FROM anon;
REVOKE ALL ON TABLE public.cron_jobs_locks FROM authenticated;

-- Ensure service_role retains necessary access (idempotent)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rate_limit_state TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.circuit_breaker_state TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cron_jobs_locks TO service_role;

-- =============================================================
-- PART 3: Fix search_path on sp_aplicar_precio
-- =============================================================
-- The function was redefined in 20260212100000_pricing_module_integrity.sql
-- with SECURITY DEFINER but WITHOUT SET search_path = public, overwriting
-- the earlier fix from 20260202083000_security_advisor_followup.sql.
-- Signature confirmed: sp_aplicar_precio(uuid, numeric, numeric).

ALTER FUNCTION public.sp_aplicar_precio(uuid, numeric, numeric)
  SET search_path = public;

COMMIT;

-- =============================================================
-- ROLLBACK (manual, if needed):
-- =============================================================
-- ALTER TABLE public.rate_limit_state DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.circuit_breaker_state DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cron_jobs_locks DISABLE ROW LEVEL SECURITY;
-- GRANT ALL ON TABLE public.rate_limit_state TO anon, authenticated;
-- GRANT ALL ON TABLE public.circuit_breaker_state TO anon, authenticated;
-- GRANT ALL ON TABLE public.cron_jobs_locks TO anon, authenticated;
-- ALTER FUNCTION public.sp_aplicar_precio(uuid, numeric, numeric)
--   RESET search_path;
