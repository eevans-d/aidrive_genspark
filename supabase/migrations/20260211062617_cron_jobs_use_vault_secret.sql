-- ==============================================================
-- Migration: Switch cron job procedures from current_setting('app.service_role_key')
-- to Supabase Vault pattern (vault.decrypted_secrets).
-- This is the Supabase-recommended approach per docs/guides/functions/schedule-functions.
--
-- Date: 2026-02-11
-- Author: GitHub Copilot (Claude Opus 4)
-- Prerequisite: vault.create_secret(..., 'service_role_key') already executed.
--
-- What this fixes:
-- - current_setting('app.service_role_key') requires ALTER DATABASE SET (superuser)
-- - Supabase restricts superuser → setting was always NULL → runtime failure
-- - Vault pattern works without superuser privileges and is the official recommendation
-- ==============================================================

-- Procedure 1: notificaciones-tareas (cada 2 horas)
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

-- Procedure 2: alertas-stock (cada 1 hora)
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

-- Procedure 3: reportes-automaticos (08:00 diario)
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

-- Procedure 4: maintenance_cleanup (Domingos 04:00)
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

-- ==============================================================
-- ROLLBACK (if needed):
-- Revert to current_setting pattern (will fail without superuser):
-- CREATE OR REPLACE PROCEDURE ... 'Authorization', 'Bearer ' || current_setting('app.service_role_key') ...
-- Remove vault secret:
-- DELETE FROM vault.secrets WHERE name = 'service_role_key';
-- ==============================================================
