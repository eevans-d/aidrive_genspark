-- =============================================================================
-- 20260222060000_deploy_all_cron_jobs.sql
--
-- Deploy all pg_cron jobs from supabase/cron_jobs/*.json definitions.
-- Procedures call Edge Functions via net.http_post with vault-based auth.
-- cron.schedule(name, expr, cmd) is idempotent (upserts by name).
-- =============================================================================

-- 1. daily_price_update — 0 2 * * * → cron-jobs-maxiconsumo
CREATE OR REPLACE PROCEDURE daily_price_update_9f7c2a8b()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url   := 'https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/cron-jobs-maxiconsumo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body  := jsonb_build_object(
      'action', 'execute',
      'job_id', 'daily_price_update',
      'parameters', jsonb_build_object(
        'scraping_mode', 'full_catalog',
        'price_change_threshold', 2,
        'notifications_enabled', true
      )
    ),
    timeout_milliseconds := 300000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule('daily_price_update', '0 2 * * *', 'CALL daily_price_update_9f7c2a8b()');

-- 2. weekly_trend_analysis — 0 3 * * 0 → cron-jobs-maxiconsumo
CREATE OR REPLACE PROCEDURE weekly_trend_analysis_3d8e5f7c()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url   := 'https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/cron-jobs-maxiconsumo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body  := jsonb_build_object(
      'action', 'execute',
      'job_id', 'weekly_trend_analysis',
      'parameters', jsonb_build_object(
        'analysis_period', 'weekly',
        'ml_predictions', true,
        'seasonal_patterns', true,
        'generate_reports', true
      )
    ),
    timeout_milliseconds := 600000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule('weekly_trend_analysis', '0 3 * * 0', 'CALL weekly_trend_analysis_3d8e5f7c()');

-- 3. realtime_change_alerts — */15 * * * * → cron-jobs-maxiconsumo
CREATE OR REPLACE PROCEDURE realtime_change_alerts_5a9b4c2d()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url   := 'https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/cron-jobs-maxiconsumo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body  := jsonb_build_object(
      'action', 'execute',
      'job_id', 'realtime_change_alerts',
      'parameters', jsonb_build_object(
        'alert_threshold', 15,
        'check_frequency', 15,
        'critical_products_only', true,
        'instant_notifications', true,
        'escalation_enabled', true
      )
    ),
    timeout_milliseconds := 120000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule('realtime_change_alerts', '*/15 * * * *', 'CALL realtime_change_alerts_5a9b4c2d()');

-- 4. notificaciones-tareas_invoke — 0 */2 * * * → notificaciones-tareas
CREATE OR REPLACE PROCEDURE notificaciones_tareas_5492c915()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url   := 'https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/notificaciones-tareas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body  := '{"edge_function_name":"notificaciones-tareas"}',
    timeout_milliseconds := 10000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule('notificaciones-tareas_invoke', '0 */2 * * *', 'CALL notificaciones_tareas_5492c915()');

-- 5. alertas-stock_invoke — 0 * * * * → alertas-stock
CREATE OR REPLACE PROCEDURE alertas_stock_38c42a40()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url   := 'https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/alertas-stock',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body  := '{"edge_function_name":"alertas-stock"}',
    timeout_milliseconds := 10000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule('alertas-stock_invoke', '0 * * * *', 'CALL alertas_stock_38c42a40()');

-- 6. reportes-automaticos_invoke — 0 8 * * * → reportes-automaticos
CREATE OR REPLACE PROCEDURE reportes_automaticos_523bf055()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url   := 'https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/reportes-automaticos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body  := '{"edge_function_name":"reportes-automaticos"}',
    timeout_milliseconds := 10000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule('reportes-automaticos_invoke', '0 8 * * *', 'CALL reportes_automaticos_523bf055()');

-- 7. maintenance_cleanup — 0 4 * * 0 → cron-jobs-maxiconsumo
CREATE OR REPLACE PROCEDURE maintenance_cleanup_7b3e9d1f()
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM net.http_post(
    url   := 'https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/cron-jobs-maxiconsumo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body  := jsonb_build_object(
      'action', 'execute',
      'job_id', 'maintenance_cleanup',
      'parameters', jsonb_build_object(
        'retention_days', 30,
        'vacuum_tables', true,
        'clean_execution_logs', true
      )
    ),
    timeout_milliseconds := 120000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule('maintenance_cleanup', '0 4 * * 0', 'CALL maintenance_cleanup_7b3e9d1f()');
