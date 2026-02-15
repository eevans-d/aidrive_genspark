# EVIDENCIA EXTERNA - SendGrid (Comet) (2026-02-14)

**Fecha:** 2026-02-14  
**Fuente:** salida de Comet compartida por el owner.  
**Objetivo:** capturar evidencia externa sin exponer secretos y sin sobredimensionar el estado (cierre requiere delivery real).

> Nota 2026-02-15: este documento es **histórico** (pre-cierre). El cierre completo (smoke + Email Activity `delivered`) quedó consolidado en `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`.

## 1) API Key Rotation (Dashboard)

- Nueva API key: creada y activa.
- Permiso: Mail Send (Full Access).
- API key anterior: identificada y aun activa (no revocada todavia).
- URL: `https://app.sendgrid.com/settings/api_keys`
- Timestamp UTC: reportado por Comet como aproximado (se recomienda capturar exacto).

## 2) Sender Authentication (Dashboard)

- Tipo: Single Sender Verification.
- Estado: verificado para un remitente personal (no dominio del proyecto).
- Domain Authentication para `minimarket-system.com`: no configurado.
- URL: `https://app.sendgrid.com/settings/sender_auth`
- Timestamp UTC: reportado por Comet como aproximado.

## 3) Email Activity (Dashboard)

- Resultado: sin mensajes encontrados en el rango verificado por Comet.
- URL: `https://app.sendgrid.com/email_activity`
- Timestamp UTC: reportado por Comet como aproximado.

## 4) Veredicto

- Estado del cierre SendGrid/SMTP (al 2026-02-14): **NO CERRADO** (faltaba aplicar nueva key en Supabase + ejecutar smoke + ver delivery real).
- Referencia técnica del bloqueo (histórico): `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-14.md`
- Estado actual (2026-02-15): **CERRADO** con evidencia externa: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`
