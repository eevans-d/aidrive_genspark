# Cron Jobs - Manual Operativo (Mini Market System)

**Fecha:** 2026-02-22  
**Estado:** Vigente

## Fuente de verdad

- Configs: `supabase/cron_jobs/*.json`
- Funciones: `supabase/functions/cron-*/` + `supabase/functions/cron-jobs-maxiconsumo/`
- Estado general: `docs/ESTADO_ACTUAL.md`

## Cron jobs configurados (plantillas en repo)

> Los archivos `.json` incluyen `raw_sql` para programar jobs con `pg_cron` + `net.http_post`.

| Archivo | Cron | Edge Function | Propósito |
|--------|------|---------------|-----------|
| `supabase/cron_jobs/job_daily_price_update.json` | `0 2 * * *` | `cron-jobs-maxiconsumo` | Scraping/actualización diaria |
| `supabase/cron_jobs/job_weekly_trend_analysis.json` | `0 3 * * 0` | `cron-jobs-maxiconsumo` | Análisis semanal |
| `supabase/cron_jobs/job_realtime_alerts.json` | `*/15 * * * *` | `cron-jobs-maxiconsumo` | Alertas cada 15 min |
| `supabase/cron_jobs/job_2.json` | `0 */2 * * *` | `notificaciones-tareas` | Notificaciones tareas cada 2h |
| `supabase/cron_jobs/job_3.json` | `0 * * * *` | `alertas-stock` | Alertas stock cada 1h |
| `supabase/cron_jobs/job_4.json` | `0 8 * * *` | `reportes-automaticos` | Reportes diarios |
| `supabase/cron_jobs/job_maintenance_cleanup.json` | `0 4 * * 0` | `cron-jobs-maxiconsumo` | Mantenimiento semanal (retención/limpieza) |

## Implementación (Supabase)

1. Verificar extensiones requeridas:
```sql
select extname from pg_extension where extname in ('pg_cron');
```

2. Programar jobs:
   - Opción recomendada: ejecutar `supabase/cron_jobs/deploy_all_cron_jobs.sql` en Supabase SQL Editor.
   - Alternativa: ejecutar el `raw_sql` del `.json` correspondiente en Supabase SQL Editor.

3. Verificar jobs:
```sql
select * from cron.job;
select * from cron.job_run_details order by run_time desc limit 20;
```

## Notas

- Los jobs invocan Edge Functions con Authorization Bearer desde `vault.decrypted_secrets` (nombre: `service_role_key`).
- No guardar secrets en repo. Documentar solo nombres (ver `docs/OBTENER_SECRETOS.md`).
