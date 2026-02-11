-- ==============================================================
-- Deploy de Cron Jobs - Mini Market
--
-- Este script consolida los cron jobs definidos en `supabase/cron_jobs/*.json`.
-- Ejecutar en Supabase SQL Editor.
--
-- Requisitos:
-- - Extensiones `pg_cron` y `pg_net` habilitadas.
-- - Si usás los jobs que llaman `cron-jobs-maxiconsumo`, el setting
--   `app.service_role_key` debe existir (o ajustar el header Authorization).
-- ==============================================================

-- ----------------------------------------------------------------
-- Job 2: notificaciones-tareas (cada 2 horas)
-- ----------------------------------------------------------------
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

SELECT cron.schedule(
  'notificaciones-tareas_invoke',
  '0 */2 * * *',
  'CALL notificaciones_tareas_5492c915()'
);

-- ----------------------------------------------------------------
-- Job 3: alertas-stock (cada 1 hora)
-- ----------------------------------------------------------------
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

SELECT cron.schedule(
  'alertas-stock_invoke',
  '0 * * * *',
  'CALL alertas_stock_38c42a40()'
);

-- ----------------------------------------------------------------
-- Job 4: reportes-automaticos (08:00 diario)
-- ----------------------------------------------------------------
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

SELECT cron.schedule(
  'reportes-automaticos_invoke',
  '0 8 * * *',
  'CALL reportes_automaticos_523bf055()'
);

-- ----------------------------------------------------------------
-- Job 5: cron-jobs-maxiconsumo (02:00 diario) - daily_price_update
-- ----------------------------------------------------------------
CREATE OR REPLACE PROCEDURE daily_price_update_9f7c2a8b()
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
      'job_id', 'daily_price_update',
      'parameters', jsonb_build_object(
        'scraping_mode', 'full_catalog',
        'price_change_threshold', 2,
        'notifications_enabled', true
      )
    ),
    timeout_milliseconds:=300000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule(
  'daily_price_update',
  '0 2 * * *',
  'CALL daily_price_update_9f7c2a8b()'
);

-- ----------------------------------------------------------------
-- Job 6: cron-jobs-maxiconsumo (Domingos 03:00) - weekly_trend_analysis
-- ----------------------------------------------------------------
CREATE OR REPLACE PROCEDURE weekly_trend_analysis_3d8e5f7c()
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
      'job_id', 'weekly_trend_analysis',
      'parameters', jsonb_build_object(
        'analysis_period', 'weekly',
        'ml_predictions', true,
        'seasonal_patterns', true,
        'generate_reports', true
      )
    ),
    timeout_milliseconds:=600000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule(
  'weekly_trend_analysis',
  '0 3 * * 0',
  'CALL weekly_trend_analysis_3d8e5f7c()'
);

-- ----------------------------------------------------------------
-- Job 7: cron-jobs-maxiconsumo (cada 15 minutos) - realtime_change_alerts
-- ----------------------------------------------------------------
CREATE OR REPLACE PROCEDURE realtime_change_alerts_5a9b4c2d()
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
      'job_id', 'realtime_change_alerts',
      'parameters', jsonb_build_object(
        'alert_threshold', 15,
        'check_frequency', 15,
        'critical_products_only', true,
        'instant_notifications', true,
        'escalation_enabled', true
      )
    ),
    timeout_milliseconds:=120000
  );
  COMMIT;
END;
$$;

SELECT cron.schedule(
  'realtime_change_alerts',
  '*/15 * * * *',
  'CALL realtime_change_alerts_5a9b4c2d()'
);

-- ----------------------------------------------------------------
-- Job 8: maintenance_cleanup (Domingos 04:00) - limpieza semanal
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
