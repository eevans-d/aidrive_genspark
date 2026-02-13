---
name: SendGridOps
description: Verifica y corrige configuracion SendGrid/Supabase SMTP (EMAIL_FROM vs
  SMTP_FROM) con evidencia y sin exponer secretos.
role: CODEX->EXECUTOR
version: 1.0.0
impact: HIGH
impact_legacy: 1-2
triggers:
  automatic:
  - orchestrator keyword match (SendGridOps)
  manual:
  - SendGridOps
  - sendgrid
  - smtp
  - smtp_from
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  required_before: []
priority: 8
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

## Quality Gates

- [ ] Mismatch de nombres identificado (EMAIL_FROM vs SMTP_FROM).
- [ ] Opcion de fix elegida (A o B) y justificada.
- [ ] Secret/config seteado correctamente (solo nombre verificado).
- [ ] Funcion afectada redeployada.
- [ ] Health check o log post-deploy verificado.
- [ ] Evidencia generada en `docs/closure/` sin valores expuestos.

## Anti-Loop / Stop-Conditions

**SI Supabase CLI no disponible:**
1. Documentar fix requerido como checklist para el owner.
2. Marcar como BLOCKED.
3. NO intentar workaround riesgoso.

**SI SendGrid Dashboard no accesible:**
1. Solo verificar configuracion local (codigo +env vars).
2. Marcar verificacion de Verified Sender como BLOCKED.
3. Generar checklist manual para el owner.

**SI mismatch persiste post-fix:**
1. Verificar que el redeploy se completo.
2. Revisar logs de la Edge Function.
3. Maximo 2 intentos; si persiste → NEEDS_HUMAN_REVIEW.

**NUNCA:** Exponer valores de API keys o SMTP credentials.
