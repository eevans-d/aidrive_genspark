# Cron Jobs Status Report
**Fecha:** 2026-02-22 | **Total Jobs:** 7 | **OK:** 7 | **FAIL:** 0

## Estado por Job
| Job | Schedule | Auth | Timeout | Estado |
|-----|----------|------|---------|--------|
| daily_price_update | `0 2 * * *` | ✅ | 300000 ms | WARN (>60s) |
| weekly_trend_analysis | `0 3 * * 0` | ✅ | 600000 ms | WARN (>60s) |
| realtime_change_alerts | `*/15 * * * *` | ✅ | 120000 ms | WARN (>60s) |
| notificaciones-tareas_invoke | `0 */2 * * *` | ✅ | 10000 ms | PASS |
| alertas-stock_invoke | `0 * * * *` | ✅ | 10000 ms | PASS |
| reportes-automaticos_invoke | `0 8 * * *` | ✅ | 10000 ms | PASS |
| maintenance_cleanup | `0 4 * * 0` | ✅ | 120000 ms | WARN (>60s) |

## Verificaciones aplicadas
- HC-1 auth header: `Authorization=7` y `net.http_post=7` en `supabase/cron_jobs/deploy_all_cron_jobs.sql`.
- Funciones destino existentes:
  - `supabase/functions/cron-jobs-maxiconsumo/index.ts`
  - `supabase/functions/notificaciones-tareas/index.ts`
  - `supabase/functions/alertas-stock/index.ts`
  - `supabase/functions/reportes-automaticos/index.ts`
- `verify_jwt` explícito no definido en `supabase/config.toml`; en runtime sin Bearer las funciones responden 401 (esperado).

## Correcciones aplicadas en repo
1. `supabase/cron_jobs/deploy_all_cron_jobs.sql`
   - Se normalizó auth para todos los jobs usando `vault.decrypted_secrets`.
   - Se agregó `maintenance_cleanup` al SQL combinado.
2. `supabase/cron_jobs/job_daily_price_update.json`
3. `supabase/cron_jobs/job_weekly_trend_analysis.json`
4. `supabase/cron_jobs/job_realtime_alerts.json`
5. `supabase/cron_jobs/job_2.json`
6. `supabase/cron_jobs/job_3.json`
7. `supabase/cron_jobs/job_4.json`
8. `supabase/cron_jobs/job_maintenance_cleanup.json` (nuevo)

## Rollback (manual)
```sql
SELECT cron.unschedule('daily_price_update');
SELECT cron.unschedule('weekly_trend_analysis');
SELECT cron.unschedule('realtime_change_alerts');
SELECT cron.unschedule('notificaciones-tareas_invoke');
SELECT cron.unschedule('alertas-stock_invoke');
SELECT cron.unschedule('reportes-automaticos_invoke');
SELECT cron.unschedule('maintenance_cleanup');
```

## Deploy en produccion
- **Ejecutado:** 2026-02-22 via `supabase db push` (migracion `20260222060000_deploy_all_cron_jobs.sql`)
- **Verificacion:** 7 jobs activos en `cron.job`, 409 runs registrados en `cron.job_run_details` (todos `succeeded`)
- Jobs pre-existentes (1-3) actualizados; jobs nuevos (4-7) creados.
