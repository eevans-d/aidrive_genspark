# EVIDENCIA GATE 4 - Canal Real de Alertas al Operador

**Fecha:** 2026-02-12
**Estado:** PASS

## Descripcion

Canal real de notificaciones implementado con envio via SendGrid HTTP API.
Reemplazo de simulaciones en `cron-notifications` por envio real para email, webhook y Slack.

## Canal implementado

**Email via SendGrid HTTP API** - Canal primario operativo.

### Secretos utilizados (no valores)

| Variable | Proposito |
|----------|-----------|
| `SENDGRID_API_KEY` | API key SendGrid para envio HTTP |
| `SMTP_FROM` | Email remitente configurado |
| `NOTIFICATIONS_MODE` | Modo actual: `real` (no simulacion) |
| `SLACK_WEBHOOK_URL` | (Opcional) Webhook Slack para canal `slack_alerts` |
| `WEBHOOK_URL` | (Opcional) Webhook genérico para canal `webhook_default` |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/cron-notifications/index.ts` | Envio real en `sendEmail()` via SendGrid API, `sendWebhook()` via HTTP POST real, `sendSlack()` via Slack webhook real. Agregado canal `webhook_default` (env `WEBHOOK_URL`). Logging sanitizado (no PII ni URLs de webhooks). |

## Cambios en funciones de envio

### `sendEmail()`
- **Antes:** Simulacion con log + delay 100ms
- **Ahora:** Si `NOTIFICATIONS_MODE=real`, envia via SendGrid v3 API (`POST https://api.sendgrid.com/v3/mail/send`), retorna messageId real
- **Fallback:** Si mode=simulation, mantiene comportamiento simulado

### `sendWebhook()`
- **Antes:** Simulacion con log + delay 100ms
- **Ahora:** Si `NOTIFICATIONS_MODE=real`, hace real `fetch()` al webhook configurado (soporta `method` + `headers` si están definidos en el canal)
- **Fallback:** Si mode=simulation, mantiene comportamiento simulado

### `sendSlack()`
- **Antes:** Simulacion con log + delay 150ms
- **Ahora:** Si `NOTIFICATIONS_MODE=real`, hace real `fetch()` POST al Slack webhook URL
- **Fallback:** Si mode=simulation, mantiene comportamiento simulado

## Cambios de logging (seguridad)

- Se removió logging de **URLs de webhooks**.
- Se removió logging de **destinatarios** (emails/teléfonos) y **contenido** (preview/body) en logs de envío.
- Los logs de envío ahora reportan solo métricas seguras: `toCount`, `messageChars`, `recipientCounts`, `status`, etc.

## Evidencia de entrega real

### Test 1: Alerta critica de prueba
```bash
$ curl -s -X POST ".../cron-notifications/test" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
  "templateId": "critical_alert",
  "channelId": "email_default",
  "testData": { "alertType": "E2E_TEST" }
}'
```
**Respuesta:**
```json
{
  "success": true,
  "data": {
    "channelId": "email_default",
    "status": "sent",
    "messageId": "isYe8z1MQVyCvwynVjwfvw",
    "timestamp": "2026-02-12T06:29:04.375Z"
  }
}
```

### Test 2: Verificacion final
```json
{
  "success": true,
  "data": {
    "channelId": "email_default",
    "status": "sent",
    "messageId": "koXaNQsdTvOKI5K6nDLJTA",
    "timestamp": "2026-02-12T06:29:37.645Z"
  }
}
```

**Nota:** Los `messageId` (isYe8z1MQVyCvwynVjwfvw, koXaNQsdTvOKI5K6nDLJTA) son IDs reales de SendGrid, confirmando entrega real (no simulada).

**Nota 2:** El endpoint `/test` usa destinatarios dummy internos (para smoke). Para validar entrega real a un operador específico, usar `/send` con el schema `NotificationRequest` y `recipients.email` explícito.

## Despliegue

```bash
$ supabase functions deploy cron-notifications --project-ref dqaygmjpzoqjjrywdsxi --use-api
Deployed Functions on project dqaygmjpzoqjjrywdsxi: cron-notifications
```

**Nota (seguridad):** no usar `--no-verify-jwt` en `cron-notifications`. Debe permanecer con `verify_jwt=true` (protegida). Solo `api-minimarket` debe mantenerse con `verify_jwt=false`.

## Canales disponibles para operador

| Canal | channelId | Estado | Requisito |
|-------|----------|--------|-----------|
| Email (SendGrid) | `email_default` | OPERATIVO | `SENDGRID_API_KEY`, `SMTP_FROM`, `NOTIFICATIONS_MODE=real` |
| Webhook | `webhook_default` | LISTO (codigo) | Configurar `WEBHOOK_URL` |
| Slack | `slack_alerts` | LISTO (codigo) | Configurar `SLACK_WEBHOOK_URL` |
| SMS (Twilio) | `sms_critical` | SIMULACION | (Pendiente implementación real) `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
