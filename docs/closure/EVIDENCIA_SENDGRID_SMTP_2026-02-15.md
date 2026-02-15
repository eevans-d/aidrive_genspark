# EVIDENCIA - SendGrid/SMTP (rotacion + delivery real) (2026-02-15)

**Fecha:** 2026-02-15  
**Objetivo:** cerrar el pendiente SendGrid/SMTP con evidencia reproducible, sin exponer secretos.

## 1) Contexto

- Proyecto Supabase (project-ref): `dqaygmjpzoqjjrywdsxi`
- Funciones involucradas:
  - `cron-notifications` (envio real via SendGrid HTTP API usando `SENDGRID_API_KEY`)
  - `notificaciones-tareas` (notificaciones backend)
- Sender/Dominio (estado externo):
  - Domain Authentication para `minimarket-system.com`: **NO configurado** (requiere DNS)
  - Single Sender verificado: `eevans.d@gmail.com`
  - Para el smoke real se uso `SMTP_FROM="eevans.d@gmail.com"` (sender verificado) para evitar rechazo por From.

## 2) Aplicacion de secrets (sin valores)

Archivo local (gitignored) usado para aplicar secrets sin exponer valores:
- `backups/.env.sendgrid.rotate.local`

Secrets requeridos (solo nombres):
- `SENDGRID_API_KEY`
- `SMTP_PASS`
- `SMTP_USER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_FROM`
- `NOTIFICATIONS_MODE`

Comando ejecutado (automatizado, no imprime valores):
- `scripts/apply-sendgrid-secrets-from-env.sh backups/.env.sendgrid.rotate.local`

Confirmación externa (Comet / Supabase Dashboard):
- URL: `https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi/functions/secrets`
- Timestamp UTC (UI): `2026-02-15 04:30:13 +0000` (actualización de secrets SMTP + SendGrid)

## 3) Redeploy (Supabase)

Redeploy ejecutado por el script:
- `supabase functions deploy cron-notifications --use-api --project-ref dqaygmjpzoqjjrywdsxi`
- `supabase functions deploy notificaciones-tareas --use-api --project-ref dqaygmjpzoqjjrywdsxi`

Versiones remotas observadas post-redeploy:
- `cron-notifications`: `v24` (`verify_jwt=true`)
- `notificaciones-tareas`: `v18` (`verify_jwt=true`)

## 4) Smoke real (cron-notifications/send)

Endpoint:
- `POST https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/cron-notifications/send`

Resultado (sin secretos):
- HTTP: `200`
- `success=true`
- `channels[0].status=sent`
- `messageId`: `4WLvTif9TYqxqfuYUBDS1Q`

## 5) Estado de cierre

- Bloqueo previo (401 invalid/expired/revoked) **REMOVIDO**.
- Estado actual del pendiente:
  - **CERRADO técnicamente** (envio real aceptado + `messageId` retornado).
  - **CERRADO externamente** (Email Activity confirma `processed`/`delivered` post-smoke).
  - **Higiene recomendada:** revocar la API key anterior en SendGrid (si aún está activa).

Referencias:
- Bloqueo previo: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-14.md`
- Evidencia externa Comet (pre-smoke): `docs/closure/EVIDENCIA_SENDGRID_COMET_2026-02-14.md`

## 6) Evidencia externa (Comet / navegador) - Email Activity

Fuente: salida de Comet (browser) reportada por el owner el **2026-02-15**.

Email Activity:
- URL: `https://app.sendgrid.com/email_activity`
- Message ID: `4WLvTif9TYqxqfuYUBDS1Q`
- Estado: `delivered`
- Subject: `ALERTA CRITICA - SMOKE_TEST` (UI muestra un emoji al inicio)
- From: `eevans.d@gmail.com`
- To: `eevans.d@gmail.com`
- Timestamp UTC (exacto, UI): `2026-02-15 04:30:00 UTC`

Historial de eventos (segun UI):
- `processed` (recibido por SendGrid): `2026-02-15 04:30:00 UTC`
- `delivered` (gmail-smtp-in.l.google.com): `2026-02-15 04:30:00 UTC`

## 7) Accion operativa final (recomendado)

1. En SendGrid Dashboard -> Settings -> API Keys, revocar la API key anterior (solo luego de confirmar este cierre).
2. Registrar evidencia (sin exponer valores) del estado final de keys (nombres + Active/Revoked/Disabled).
