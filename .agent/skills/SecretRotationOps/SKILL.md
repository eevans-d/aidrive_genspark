---
name: SecretRotationOps
description: Rotacion segura de secretos (API_PROVEEDOR_SECRET, SendGrid) con rollback,
  redeploy y evidencia. Nunca expone valores.
role: CODEX->EXECUTOR
version: 1.0.0
impact: CRITICAL
impact_legacy: 2-3
triggers:
  automatic:
  - orchestrator keyword match (SecretRotationOps)
  manual:
  - SecretRotationOps
  - rotacion de secretos
  - rotar secretos
  - secret rotation
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  required_before: []
priority: 8
---

# SecretRotationOps Skill

**ROL:** CODEX->EXECUTOR. Rotacion real con evidencia y rollback.

## Guardrails (Obligatorio)

1. NO imprimir valores de secrets/JWTs (solo nombres).
2. NO rotar manualmente `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` salvo incidente confirmado (impacto 3).
3. Impacto 3 (produccion): requiere confirmacion humana antes de aplicar.
4. Siempre preparar rollback antes de `supabase secrets set`.

## Activacion

**Activar cuando:**
- El usuario pide rotar secretos.
- Se detecta leak o compromiso.
- Post-auditoria de seguridad.

## Protocolo (Fuente de verdad)

Leer primero `docs/SECRET_ROTATION_PLAN.md` (sin valores).

## Ejecucion Segura (no imprime valores)

### FASE A: Baseline + rollback

1. Capturar baseline:
   ```bash
   .agent/scripts/baseline_capture.sh
   ```
2. Listar secrets (nombres) y guardar evidencia:
   ```bash
   supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[].name' | sort
   ```
3. Preparar rollback:
   - Guardar el valor anterior en un vault/password manager (NO en repo).
   - Crear evidencia del "rollback ready" (sin el valor).

### FASE B: Rotar `API_PROVEEDOR_SECRET` (P1)

Generar valor sin imprimirlo:
```bash
NEW_SECRET="$(openssl rand -hex 32)"
supabase secrets set API_PROVEEDOR_SECRET="$NEW_SECRET" --project-ref dqaygmjpzoqjjrywdsxi
unset NEW_SECRET
```

Redeploy de funciones que lo usan:
```bash
supabase functions deploy api-proveedor
supabase functions deploy scraper-maxiconsumo
```

Validacion (sin auth):
```bash
curl -sS https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-proveedor/health | head -c 200
```

### FASE C: Rotar SendGrid (P1, requiere Dashboard)

1. Crear nueva API key en SendGrid Dashboard.
2. Setear en Supabase sin imprimir:
   ```bash
   read -s -p "SendGrid API key: " NEW_KEY; echo
   supabase secrets set SENDGRID_API_KEY="$NEW_KEY" SMTP_PASS="$NEW_KEY" SMTP_USER="apikey" --project-ref dqaygmjpzoqjjrywdsxi
   unset NEW_KEY
   ```
3. Redeploy funciones de notificacion:
   ```bash
   supabase functions deploy notificaciones-tareas
   supabase functions deploy cron-notifications
   ```
4. Validar con modo test si existe (`NOTIFICATIONS_MODE=test`) y evidencia en SendGrid Activity.

## Evidencia Requerida

Crear en `docs/closure/`:
- `SECRET_ROTATION_<YYYY-MM-DD>_<HHMMSS>.md` con:
  - Secrets rotados (NOMBRES)
  - Rollback preparado (si/no)
  - Funciones redeployadas
  - Validacion (health/smoke)
  - Acciones pendientes en SendGrid Dashboard (revocar key anterior)

## Quality Gates

- [ ] Baseline capturado antes de rotar.
- [ ] Rollback preparado (valor anterior guardado en vault, NO en repo).
- [ ] Secret rotado exitosamente (`supabase secrets set` exit 0).
- [ ] Funciones afectadas redeployadas.
- [ ] Health check post-deploy exitoso (200 OK).
- [ ] Evidencia generada en `docs/closure/` sin valores expuestos.

## Anti-Loop / Stop-Conditions

**SI `supabase secrets set` falla:**
1. NO reintentar automáticamente (impacto 3).
2. Documentar error y proponer fix manual.
3. Verificar que el valor anterior sigue activo.

**SI health check falla post-rotacion:**
1. Ejecutar rollback inmediato (re-set valor anterior).
2. Documentar incidente con timestamp.
3. NO intentar segunda rotacion sin diagnostico.

**SI no hay acceso a SendGrid Dashboard:**
1. Marcar rotacion SendGrid como BLOCKED.
2. Generar checklist para el owner.
3. Continuar con otros secrets si aplica.

**NUNCA:** Exponer valores de secrets en logs, evidencia ni chat.
