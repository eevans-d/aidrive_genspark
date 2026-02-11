-- ==============================================================
-- Migration: Fix HC-1 (cron jobs missing Authorization header)
--            + Add maintenance_cleanup weekly schedule
--
-- Date: 2026-02-11
-- Author: Claude Code (Opus 4)
-- Impact: 2 (rollback prepared, no data loss risk)
--
-- What this fixes:
-- 1. notificaciones-tareas_invoke: was missing Authorization header → 401
-- 2. alertas-stock_invoke: was missing Authorization header → 401
-- 3. reportes-automaticos_invoke: was missing Authorization header → 401
-- 4. Adds new maintenance_cleanup job (weekly, Sundays 04:00 UTC)
--
-- Prerequisites:
-- - Extensions pg_cron and pg_net must be enabled
-- - Setting app.service_role_key must exist
-- ==============================================================

BEGIN;

-- ----------------------------------------------------------------
-- Step 1: Unschedule old jobs (safe — ignores if not found)
-- ----------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('notificaciones-tareas_invoke');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('alertas-stock_invoke');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  PERFORM cron.unschedule('reportes-automaticos_invoke');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ----------------------------------------------------------------
-- Step 2: Replace procedures WITH Authorization header
-- ----------------------------------------------------------------

-- Job 2: notificaciones-tareas (cada 2 horas)
CREATE OR REPLACE PROCEDURE notificaciones_tareas_5492c915()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url:='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/notificaciones-tareas',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body:='{"edge_function_name":"notificaciones-tareas"}',
    timeout_milliseconds:=10000
  );
  COMMIT;
END;
$$;

-- Job 3: alertas-stock (cada 1 hora)
CREATE OR REPLACE PROCEDURE alertas_stock_38c42a40()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url:='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/alertas-stock',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body:='{"edge_function_name":"alertas-stock"}',
    timeout_milliseconds:=10000
  );
  COMMIT;
END;
$$;

-- Job 4: reportes-automaticos (08:00 diario)
CREATE OR REPLACE PROCEDURE reportes_automaticos_523bf055()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url:='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/reportes-automaticos',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body:='{"edge_function_name":"reportes-automaticos"}',
    timeout_milliseconds:=10000
  );
  COMMIT;
END;
$$;

-- ----------------------------------------------------------------
-- Step 3: Reschedule jobs with same cron expressions
-- ----------------------------------------------------------------
SELECT cron.schedule(
  'notificaciones-tareas_invoke',
  '0 */2 * * *',
  'CALL notificaciones_tareas_5492c915()'
);

SELECT cron.schedule(
  'alertas-stock_invoke',
  '0 * * * *',
  'CALL alertas_stock_38c42a40()'
);

SELECT cron.schedule(
  'reportes-automaticos_invoke',
  '0 8 * * *',
  'CALL reportes_automaticos_523bf055()'
);

-- ----------------------------------------------------------------
-- Step 4: Add maintenance_cleanup job (weekly, Sundays 04:00 UTC)
-- ----------------------------------------------------------------
CREATE OR REPLACE PROCEDURE maintenance_cleanup_7b3e9d1f()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url:='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/cron-jobs-maxiconsumo',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body:=jsonb_build_object(
      'action', 'execute',
      'job_id', 'maintenance_cleanup',
      'parameters', jsonb_build_object(
        'retention_days', 30,
        'vacuum_tables', true,
        'clean_execution_logs', true
      )
    ),
    timeout_milliseconds:=120000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule(
  'maintenance_cleanup',
  '0 4 * * 0',
  'CALL maintenance_cleanup_7b3e9d1f()'
);

COMMIT;

-- ==============================================================
-- ROLLBACK SCRIPT (execute manually if needed)
-- ==============================================================
-- BEGIN;
--
-- -- Unschedule fixed jobs
-- SELECT cron.unschedule('notificaciones-tareas_invoke');
-- SELECT cron.unschedule('alertas-stock_invoke');
-- SELECT cron.unschedule('reportes-automaticos_invoke');
-- SELECT cron.unschedule('maintenance_cleanup');
--
-- -- Restore old procedures WITHOUT auth (original state)
-- CREATE OR REPLACE PROCEDURE notificaciones_tareas_5492c915()
-- LANGUAGE plpgsql AS $$
-- BEGIN
--   PERFORM net.http_post(
--     url:='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/notificaciones-tareas',
--     headers:=jsonb_build_object('Content-Type', 'application/json'),
--     body:='{"edge_function_name":"notificaciones-tareas"}',
--     timeout_milliseconds:=10000
--   );
--   COMMIT;
-- END;
-- $$;
--
-- CREATE OR REPLACE PROCEDURE alertas_stock_38c42a40()
-- LANGUAGE plpgsql AS $$
-- BEGIN
--   PERFORM net.http_post(
--     url:='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/alertas-stock',
--     headers:=jsonb_build_object('Content-Type', 'application/json'),
--     body:='{"edge_function_name":"alertas-stock"}',
--     timeout_milliseconds:=10000
--   );
--   COMMIT;
-- END;
-- $$;
--
-- CREATE OR REPLACE PROCEDURE reportes_automaticos_523bf055()
-- LANGUAGE plpgsql AS $$
-- BEGIN
--   PERFORM net.http_post(
--     url:='https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/reportes-automaticos',
--     headers:=jsonb_build_object('Content-Type', 'application/json'),
--     body:='{"edge_function_name":"reportes-automaticos"}',
--     timeout_milliseconds:=10000
--   );
--   COMMIT;
-- END;
-- $$;
--
-- -- Drop maintenance procedure
-- DROP PROCEDURE IF EXISTS maintenance_cleanup_7b3e9d1f();
--
-- -- Reschedule with original expressions
-- SELECT cron.schedule(
--   'notificaciones-tareas_invoke', '0 */2 * * *',
--   'CALL notificaciones_tareas_5492c915()'
-- );
-- SELECT cron.schedule(
--   'alertas-stock_invoke', '0 * * * *',
--   'CALL alertas_stock_38c42a40()'
-- );
-- SELECT cron.schedule(
--   'reportes-automaticos_invoke', '0 8 * * *',
--   'CALL reportes_automaticos_523bf055()'
-- );
--
-- COMMIT;
-- ==============================================================
