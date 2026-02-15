> [ACTIVO_VERIFICADO: 2026-02-13] Documento activo. Revisado contra baseline actual y mantenido como referencia operativa.

# Verificacion Sender/Dominio SendGrid

**Fecha (original):** 2026-02-09  
**Ultima actualizacion:** 2026-02-15  
**Estado:** ✅ OK — rotacion aplicada + smoke real + Email Activity `delivered` (post-rotacion)

---

## 1) Configuracion actual

```
SMTP Host:  smtp.sendgrid.net
SMTP Port:  587
SMTP User:  apikey (estandar SendGrid)
From Email: (definido por secret `SMTP_FROM`; debe ser un sender verificado en SendGrid)
From Name:  Sistema MiniMarket
```

**Nota:** `cron-notifications` envia emails reales via **SendGrid HTTP API** usando `SENDGRID_API_KEY`. La configuracion `SMTP_*` aplica a Supabase Auth SMTP y a la definicion operativa del From.

## 2) Hallazgo: discrepancia de variable de entorno

| Componente | Variable esperada | Fallback |
|------------|-------------------|----------|
| Supabase Auth SMTP | Configuracion Dashboard | — |
| Supabase Secrets | `SMTP_FROM` | — |
| `cron-notifications/index.ts` (linea 496) | `SMTP_FROM` -> `EMAIL_FROM` | `noreply@minimarket-system.com` |

**Estado actual (repo):** La Edge Function `cron-notifications` prioriza `SMTP_FROM` y usa `EMAIL_FROM` solo como fallback. Con el secret `SMTP_FROM` presente, el From queda alineado.

**Accion recomendada:** Mantener `SMTP_FROM` como fuente de verdad. (Opcional) Definir `EMAIL_FROM` como alias para compatibilidad.

## 3) Sender verificado vs Domain Authentication (estado real)

Estado confirmado (Comet + evidencia 2026-02-15):

- Single Sender verificado: `eevans.d@gmail.com` (usado para el smoke real 2026-02-15).
- Domain Authentication para `minimarket-system.com`: **NO configurado** (requiere DNS).

Implicancia:
- Si se quiere usar `SMTP_FROM=noreply@minimarket-system.com`, se necesita Domain Authentication (recomendado) o verificar ese sender.

**No se puede verificar/operar desde CLI.** Requiere login en SendGrid Dashboard.

## 4) Checklist para el owner

- [ ] Acceder a SendGrid Dashboard
- [ ] Verificar si `SMTP_FROM` (From real del sistema) es un sender verificado
  - Si NO: crear Single Sender Verification o Domain Authentication (recomendado para `noreply@minimarket-system.com`)
- [x] Resolver discrepancia `EMAIL_FROM` vs `SMTP_FROM`: **RESUELTO (PR #53)** — codigo ahora lee `SMTP_FROM` primero
- [x] Redeploy `cron-notifications` (remote): **HECHO** (2026-02-15, `v24`, `verify_jwt=true`)
- [x] Rotar/crear API key SendGrid valida (Mail Send) y aplicarla en Supabase (`SENDGRID_API_KEY`/`SMTP_PASS`) — **HECHO** (2026-02-15)
- [x] Enviar email real de prueba (requiere `NOTIFICATIONS_MODE=real` en `production`) — **HECHO** (2026-02-15)
- [x] Verificar en SendGrid Activity que el email fue `processed`/`delivered` (post-smoke) y registrar evidencia — **HECHO** (2026-02-15)
- [ ] Revocar la API key anterior en SendGrid (solo luego de confirmar Email Activity) — RECOMENDADO (higiene)
- [ ] Registrar evidencia en `docs/closure/EXECUTION_LOG_*.md`

## 5) Riesgo si no se verifica

- Emails de notificacion pueden ser rechazados por el servidor destino (SPF/DKIM fail)
- SendGrid puede throttlear o bloquear la cuenta por enviar desde sender no verificado
- En modo `NOTIFICATIONS_MODE=simulation` el impacto es nulo (no se envian emails reales)

## 6) Addendum 2026-02-15 (estado real)

### Cierre confirmado (post-rotacion)

Se ejecuto un smoke real contra `cron-notifications/send` con secrets ya aplicados y el envio fue aceptado, y luego se confirmo en Email Activity:

- Resultado: HTTP `200`, `status=sent`, `messageId` no vacio + Email Activity `delivered`
- Evidencia: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`

**Higiene recomendada:** revocar la API key anterior (si aún está activa) y dejar evidencia de keys activas/revocadas sin exponer valores.
