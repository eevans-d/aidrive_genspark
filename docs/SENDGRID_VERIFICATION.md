# Verificacion Sender/Dominio SendGrid

**Fecha:** 2026-02-09
**Estado:** BLOQUEADO — requiere acceso a SendGrid Dashboard

---

## 1) Configuracion actual

```
SMTP Host:  smtp.sendgrid.net
SMTP Port:  587
SMTP User:  apikey (estandar SendGrid)
From Email: noreply@minimarket-system.com (configurado en Supabase Auth SMTP)
From Name:  Sistema MiniMarket
```

## 2) Hallazgo: discrepancia de variable de entorno

| Componente | Variable esperada | Fallback |
|------------|-------------------|----------|
| Supabase Auth SMTP | Configuracion Dashboard | — |
| Supabase Secrets | `SMTP_FROM` | — |
| `cron-notifications/index.ts` (linea 497) | `EMAIL_FROM` | `noreply@minimarket.com` |

**Problema:** La Edge Function `cron-notifications` lee `EMAIL_FROM` pero el secret configurado es `SMTP_FROM`. Esto causa que use el fallback `noreply@minimarket.com` en vez de `noreply@minimarket-system.com`.

**Accion requerida:** Agregar `EMAIL_FROM` como alias del secret, o cambiar el codigo a leer `SMTP_FROM`.

## 3) Verificacion de sender — BLOQUEADA

Para verificar que `noreply@minimarket-system.com` es un sender verificado en SendGrid se necesita:

1. Acceder a SendGrid Dashboard > Settings > Sender Authentication
2. Verificar que el dominio `minimarket-system.com` tenga DNS records (CNAME) configurados
3. O verificar en Settings > Sender Management > Verified Senders que el email individual este verificado

**No se puede hacer desde CLI.** Requiere login en https://app.sendgrid.com

## 4) Checklist para el owner

- [ ] Acceder a SendGrid Dashboard
- [ ] Verificar si `noreply@minimarket-system.com` es sender verificado
  - Si NO: crear Single Sender Verification o Domain Authentication
- [ ] Resolver discrepancia `EMAIL_FROM` vs `SMTP_FROM`:
  - Opcion A: `supabase secrets set EMAIL_FROM=noreply@minimarket-system.com`
  - Opcion B: cambiar `cron-notifications/index.ts` linea 497 a leer `SMTP_FROM`
- [ ] Enviar email de prueba (cambiar `NOTIFICATIONS_MODE` a `test`)
- [ ] Verificar en SendGrid Activity que el email fue entregado
- [ ] Registrar evidencia en `docs/closure/EXECUTION_LOG_*.md`

## 5) Riesgo si no se verifica

- Emails de notificacion pueden ser rechazados por el servidor destino (SPF/DKIM fail)
- SendGrid puede throttlear o bloquear la cuenta por enviar desde sender no verificado
- En modo `NOTIFICATIONS_MODE=test` el impacto es nulo (no se envian emails reales)
