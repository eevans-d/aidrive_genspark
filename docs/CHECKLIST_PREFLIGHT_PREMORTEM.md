# CHECKLIST PREFLIGHT PREMORTEM — Mini Market System
**Fecha:** 2026-02-06  
**Version:** 1.1  
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

---

## 7) Registro de ejecucion (2026-02-04)

Ejecutado desde CLI local.

Verificaciones completadas:
- `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json` OK.
  - `verify_jwt=false` solo en `api-minimarket`.
  - Todas las demas funciones: `verify_jwt=true`.
- `supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json` OK.
  - Secrets presentes (nombres): `ALLOWED_ORIGINS`, `API_PROVEEDOR_SECRET`, `SENDGRID_API_KEY`, `SMTP_FROM`, `SMTP_HOST`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_USER`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.
  - `NOTIFICATIONS_MODE` no aparece en secrets (default actual: `simulation`).
- Health check gateway:
  - `GET /functions/v1/api-minimarket/health` → **200 OK**.

Bloqueado / pendiente (requiere credenciales o acceso DB):
- Health check `api-proveedor` y `cron-jobs-maxiconsumo`: requieren `Authorization` valido (verify_jwt true).
- Estado real de cron jobs (SQL en `cron.job`): requiere acceso DB.
- Pooling y conexiones (`pg_stat_activity`): requiere acceso DB.

---

## 8) Registro de ejecucion (2026-02-04, segunda corrida post-deploy)

Verificaciones completadas:
- `supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json` OK.
  - `NOTIFICATIONS_MODE` presente (configurado en Supabase Secrets).
- `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json` OK.
  - `verify_jwt=false` solo en `api-minimarket`.
  - Versiones: `api-minimarket` v18, `cron-jobs-maxiconsumo` v12, `cron-notifications` v11.
- Health check gateway:
  - `GET /functions/v1/api-minimarket/health` → **200 OK**, `status=healthy`.
- Health check proveedor:
  - `GET /functions/v1/api-proveedor/health` (con `x-api-secret` + `Authorization`) → **200 OK**, `status=unhealthy` (DB no disponible, scraper degradado).
- Health check cron jobs:
  - `GET /functions/v1/cron-jobs-maxiconsumo/health` (service role) → **200 OK**, `status=healthy`.

Bloqueado / pendiente:
- `psql` a `db.dqaygmjpzoqjjrywdsxi.supabase.co:5432` falla por **Network is unreachable (IPv6)**.
- No se pudo ejecutar SQL de `cron.job`/`cron_jobs_execution_log` ni pooling/conexiones.

---

## 9) Registro de ejecucion (2026-02-06 - auditoría local)

Suites ejecutadas (evidencia en `test-reports/` y `coverage/`):
- ✅ `npm run test:unit` — PASS (725 tests).
- ✅ `npm run test:auxiliary` — PASS (29 tests; 3 skipped por credenciales).
- ✅ `npm run test:integration` — PASS (38 tests).
- ✅ `npm run test:e2e` — PASS (4 smoke).
- ✅ `npm run test:coverage` — PASS (69.39% lines).
- ✅ `node scripts/smoke-notifications.mjs` — 200 OK (`/channels`, `/templates`).
- ✅ `pnpm -C minimarket-system lint` / `build` / `test:components` — OK.

Notas:
- `psql` a `db.dqaygmjpzoqjjrywdsxi.supabase.co:5432` sigue fallando desde este host (IPv6 `Network is unreachable`). Para ejecutar SQL preflight usar host con IPv6 o forzar IPv4/pooler (si aplica).
- `deno` no está disponible en PATH en este host; no se re-ejecutó `deno check` (última evidencia 2026-02-03).
- Healthcheck `api-proveedor`: sigue devolviendo `status=unhealthy` (ver `docs/ESTADO_ACTUAL.md`).

---

## 10) Registro A4: pg_cron y MVs refresh (2026-02-09)

**Metodo:** Supabase Management API (`POST /v1/projects/{ref}/database/query`).

### Extensiones instaladas
```
pg_graphql, pg_stat_statements, pgcrypto, plpgsql, supabase_vault, uuid-ossp
```
**`pg_cron`: NO instalado. `pg_net`: NO instalado.**

### RPC fn_refresh_stock_views
```sql
select n.nspname, p.proname from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='fn_refresh_stock_views';
-- Resultado: [{"schema":"public","proname":"fn_refresh_stock_views"}]
```
**EXISTE** en schema `public` (creada por migracion `20260208010000`).

### Conclusion
- Sin `pg_cron`, no hay schedule automatico de refresh.
- Refresh de `mv_stock_bajo` y `mv_productos_proximos_vencer` queda **manual**: invocar `select public.fn_refresh_stock_views()` via `service_role` (REST API o SQL Editor).
- Alternativa futura: habilitar extension `pg_cron` desde Dashboard (Supabase → Database → Extensions) y crear schedule (`cron.schedule('refresh_stock_views','*/7 * * * *','select public.fn_refresh_stock_views()')`) previa confirmacion del owner.
