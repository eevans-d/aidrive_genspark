# CHECKLIST PREFLIGHT PREMORTEM — Mini Market System
**Fecha:** 2026-02-04  
**Version:** 1.0  
**Uso:** ejecutar antes de cualquier cambio de WS1–WS5

## 1) Variables y entorno
- Confirmar `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `API_PROVEEDOR_SECRET`.
- Confirmar `SMTP_*`, `SLACK_WEBHOOK_URL`, `TWILIO_*`, `NOTIFICATIONS_MODE`.

Comando (si hay CLI):
```bash
supabase secrets list --project-ref <ref>
```

## 2) Edge Functions y verify_jwt
Objetivo: validar el estado real de `verify_jwt` por funcion.

Opcion CLI (si disponible):
```bash
supabase functions list --project-ref <ref>
```

Opcion Dashboard:
- Supabase Dashboard > Functions > seleccionar funcion > Settings > Verify JWT.

## 3) Cron jobs activos
Objetivo: confirmar jobs y schedule reales.

SQL (en SQL Editor):
```sql
select jobname, schedule, active, command
from cron.job
order by jobname;
```

SQL (ultima ejecucion por job):
```sql
select job_id, max(start_time) as last_run
from cron_jobs_execution_log
group by job_id
order by last_run desc;
```

## 4) Pooling y conexiones
Objetivo: confirmar limites y saturacion actual.

SQL:
```sql
show max_connections;
select count(*) as active_connections from pg_stat_activity;
```

## 5) Health checks rapidos
Objetivo: confirmar endpoints vivos antes de cambios.

Gateway:
```bash
curl -sS "${SUPABASE_URL}/functions/v1/api-minimarket/health"
```

Proveedor:
```bash
curl -sS "${SUPABASE_URL}/functions/v1/api-proveedor/health" \
  -H "x-api-secret: <API_PROVEEDOR_SECRET>"
```

Cron jobs:
```bash
curl -sS "${SUPABASE_URL}/functions/v1/cron-jobs-maxiconsumo/health" \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
```

## 6) Evidencia minima a registrar
- Fecha/hora de ejecucion.
- Output de cada comando SQL y curl.
- Screenshot de verify_jwt por funcion si es via Dashboard.
- Registrar en `docs/ESTADO_ACTUAL.md`.
