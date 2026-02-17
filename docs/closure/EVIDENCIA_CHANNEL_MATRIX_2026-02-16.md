# Evidencia: Matriz de Canales Opcionales por Entorno

- **Fecha:** 2026-02-16
- **Tarea:** Definir matriz por entorno para canales opcionales (`WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_*`)
- **Referencia:** CONTINUIDAD_SESIONES §3.1 #4, OPEN_ISSUES P2
- **Método:** Análisis estático de `cron-notifications/index.ts` + `.env.example` + `deploy.sh`

---

## 1. Canales de Notificación Disponibles

El sistema `cron-notifications` define 4 canales. Cada canal se auto-habilita/deshabilita según la presencia de sus variables de entorno.

| Canal | Variable clave | Auto-disable si vacía | Rate limit | Estado de implementación |
|-------|---------------|----------------------|------------|--------------------------|
| `email_default` | `SENDGRID_API_KEY` | No (siempre activo) | 100/h, 1000/d | Completo (SendGrid HTTP API) |
| `webhook_default` | `WEBHOOK_URL` | Sí (`!!Deno.env.get(...)`) | 50/h, 200/d | Completo (POST con `X-Source` header) |
| `slack_alerts` | `SLACK_WEBHOOK_URL` | Sí (`!!Deno.env.get(...)`) | 50/h, 200/d | Completo (POST con color-coding) |
| `sms_critical` | `TWILIO_ACCOUNT_SID` | N/A (hardcoded `isActive: false`) | 10/h, 50/d | **No implementado** (placeholder) |

---

## 2. Matriz por Entorno

### Leyenda
- **REQUERIDO**: Debe estar configurado; fallo si ausente en modo `real`.
- **RECOMENDADO**: Debería configurarse para funcionalidad completa.
- **OPCIONAL**: Configurar solo si se desea el canal.
- **NO APLICA**: No configurar (feature no implementada o no relevante).
- **N/A (default)**: Tiene valor por defecto funcional; configurar solo para override.

### 2.1 Variables de Email (SendGrid)

| Variable | development | staging | production | Default | Notas |
|----------|-------------|---------|------------|---------|-------|
| `SENDGRID_API_KEY` | NO APLICA | REQUERIDO | REQUERIDO | (ninguno) | En dev se usa `NOTIFICATIONS_MODE=simulation` |
| `SMTP_HOST` | NO APLICA | N/A (default) | N/A (default) | `smtp.sendgrid.net` | Backup SMTP; email usa API HTTP |
| `SMTP_PORT` | NO APLICA | N/A (default) | N/A (default) | `587` | Backup SMTP |
| `SMTP_USER` | NO APLICA | N/A (default) | N/A (default) | `apikey` | Literal `apikey` para SendGrid |
| `SMTP_PASS` | NO APLICA | REQUERIDO | REQUERIDO | (ninguno) | Debe coincidir con `SENDGRID_API_KEY` |
| `SMTP_FROM` | NO APLICA | RECOMENDADO | REQUERIDO | `noreply@minimarket-system.com` | Dirección remitente verificada en SendGrid |
| `EMAIL_FROM` | NO APLICA | OPCIONAL | OPCIONAL | (ninguno) | Alias legacy; fallback si `SMTP_FROM` ausente |

### 2.2 Variables de Canales Opcionales

| Variable | development | staging | production | Default | Notas |
|----------|-------------|---------|------------|---------|-------|
| `WEBHOOK_URL` | NO APLICA | OPCIONAL | OPCIONAL | (ninguno) | Canal auto-deshabilitado si vacío |
| `SLACK_WEBHOOK_URL` | NO APLICA | RECOMENDADO | RECOMENDADO | (ninguno) | Canal auto-deshabilitado si vacío; útil para alertas de equipo |
| `TWILIO_ACCOUNT_SID` | NO APLICA | NO APLICA | NO APLICA | (ninguno) | Feature SMS **no implementada** (`isActive: false`) |
| `TWILIO_AUTH_TOKEN` | NO APLICA | NO APLICA | NO APLICA | (ninguno) | Feature SMS **no implementada** |
| `TWILIO_FROM_NUMBER` | NO APLICA | NO APLICA | NO APLICA | `+1234567890` | Feature SMS **no implementada** |

### 2.3 Variables de Control

| Variable | development | staging | production | Default | Notas |
|----------|-------------|---------|------------|---------|-------|
| `NOTIFICATIONS_MODE` | `simulation` | `real` | `real` | `simulation` | `deploy.sh` bloquea deploy a prod si no es `real` |
| `ENVIRONMENT` | `development` | `staging` | `production` | `development` | Controla bloqueo de endpoints `/send` y `/test` en prod |

---

## 3. Decisiones Documentadas

### D-118: Twilio no se configura en ningún entorno
- **Razón:** El canal `sms_critical` tiene `isActive: false` hardcoded en el código. No existe implementación real de envío SMS. Configurar las variables no tendría efecto.
- **Acción futura:** Si se implementa SMS, cambiar `isActive` a `!!Deno.env.get('TWILIO_ACCOUNT_SID')` (patrón ya usado por webhook y Slack) y actualizar esta matriz.

### D-119: WEBHOOK_URL es opcional en todos los entornos
- **Razón:** Es un canal genérico para integraciones custom. No todo deployment necesita un webhook externo. El canal se auto-deshabilita si la variable está vacía.
- **Recomendación:** Configurar solo si existe un endpoint receptor (ej: n8n, Zapier, sistema interno).

### D-120: SLACK_WEBHOOK_URL es recomendado en staging/production
- **Razón:** Las alertas de Slack son el canal más práctico para visibilidad de equipo en tiempo real. Sin embargo, el sistema funciona correctamente sin él (las alertas se registran en base de datos siempre).
- **Recomendación:** Crear un webhook en Slack Workspace → canal `#minimarket-alertas` y configurar la variable.

### D-121: Variables no configuradas en Supabase Secrets remotos
- **Status actual (cross-ref ENV_AUDIT 2026-02-16):** Las siguientes variables de canales opcionales no están en Supabase Secrets:
  - `WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- **Impacto:** Ninguno. Los canales se auto-deshabilitan. Cuando se decida activar Slack o Webhook, agregar el secret con `supabase secrets set VARIABLE=valor`.

---

## 4. Guía de Configuración Rápida

### Activar Slack en producción
```bash
# 1. Crear webhook en https://api.slack.com/messaging/webhooks
# 2. Configurar secret (sin exponer valor)
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../xxx
# 3. Redesplegar cron-notifications
supabase functions deploy cron-notifications --no-verify-jwt
```

### Activar Webhook genérico en producción
```bash
# 1. Tener endpoint receptor listo
# 2. Configurar secret
supabase secrets set WEBHOOK_URL=https://your-endpoint.com/webhook
# 3. Redesplegar cron-notifications
supabase functions deploy cron-notifications --no-verify-jwt
```

### Verificar canales activos
```bash
# Invocar el endpoint /status del function
curl -s https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/cron-notifications/status \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | jq '.channels'
```

---

## 5. Resumen de Impacto en .env.example

El archivo `.env.example` ya contiene todas las variables listadas (sincronizado en env audit D-116). No requiere cambios. Las variables opcionales están correctamente marcadas con comentario `# Optional`.

---

_Evidencia generada automáticamente. No contiene valores de secretos._
