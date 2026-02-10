---
name: SendGridOps
description: Verifica y corrige configuracion SendGrid/Supabase SMTP (EMAIL_FROM vs SMTP_FROM) con evidencia y sin exponer secretos.
role: CODEX->EXECUTOR
impact: 1-2
chain: [DocuGuard]
---

# SendGridOps Skill

**ROL:** CODEX->EXECUTOR. Resolver discrepancias de env vars y validar sender setup (dashboard).

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.
3. No asumir acceso a SendGrid Dashboard: si falta, marcar BLOQUEADO y dejar checklist para el owner.

## Activacion

**Activar cuando:**
- El usuario menciona SendGrid/SMTP.
- Hay mismatch `EMAIL_FROM` vs `SMTP_FROM`.
- Notificaciones salen con From incorrecto.

## Protocolo

### FASE A: Fuente de verdad

1. Leer `docs/SENDGRID_VERIFICATION.md`.
2. Confirmar en codigo donde se lee el From:
   ```bash
   rg -n "EMAIL_FROM|SMTP_FROM" supabase/functions/cron-notifications/index.ts
   ```

### FASE B: Elegir fix (default: alias secret)

**Opcion A (default, menor friccion):** Agregar `EMAIL_FROM` como alias del From real.

1. Verificar si `EMAIL_FROM` existe (nombres solamente):
   ```bash
   supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[].name' | rg -n "^EMAIL_FROM$" || true
   ```
2. Si no existe, setearlo (no es secreto, es config):
   ```bash
   supabase secrets set EMAIL_FROM=noreply@minimarket-system.com --project-ref dqaygmjpzoqjjrywdsxi
   ```
3. Redeploy de la funcion afectada:
   ```bash
   supabase functions deploy cron-notifications
   ```

**Opcion B (mas prolija, requiere cambio de codigo):** Cambiar la Edge Function a leer `SMTP_FROM` en vez de `EMAIL_FROM`, y desplegar.

### FASE C: Validacion (sin secretos)

1. Confirmar que el secret existe (solo nombre):
   ```bash
   supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[].name' | rg -n "^(SMTP_FROM|EMAIL_FROM)$" | sort
   ```
2. Verificar health (si la funcion expone endpoint publico) o revisar logs post-deploy.

### FASE D: Evidencia

Crear evidencia en `docs/closure/`:
- `SENDGRID_FIX_<YYYY-MM-DD>_<HHMMSS>.md` con:
  - Hallazgo (mismatch)
  - Opcion aplicada (A/B) y por que
  - Comandos ejecutados
  - Verificacion

