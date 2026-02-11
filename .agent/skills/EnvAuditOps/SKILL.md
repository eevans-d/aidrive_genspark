---
name: EnvAuditOps
description: Audita variables de entorno usadas vs documentadas (solo nombres). Detecta
  mismatches como EMAIL_FROM vs SMTP_FROM.
role: CODEX
version: 1.0.0
impact: MEDIUM
impact_legacy: 0-1
triggers:
  automatic:
  - orchestrator keyword match (EnvAuditOps)
  manual:
  - EnvAuditOps
  - env
  - dotenv
  - variables de entorno
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  required_before: []
priority: 6
---

# EnvAuditOps Skill

**ROL:** CODEX. Auditoria de env vars (nombres) para evitar drift entre codigo, `.env.example` y Supabase secrets.

## Guardrails (Obligatorio)

1. NO imprimir valores de secrets/JWTs (solo nombres).
2. No modificar secretos ni deployar: este skill solo audita y reporta.

## Reglas de Automatizacion

1. Ejecutar auditoria completa sin pedir confirmacion.
2. Si encuentra drift (var usada pero no documentada) -> reportar como WARNING.
3. Si encuentra mismatch de nombres (alias: EMAIL_FROM vs SMTP_FROM) -> reportar como CRITICAL.
4. Generar evidencia automaticamente en `docs/closure/`.
5. Si `.env.example` esta desactualizado -> actualizar automaticamente (solo nombres, nunca valores).

## Activacion

**Activar cuando:**
- Se agregan/modifican env vars.
- Hay incidentes por variables faltantes (ej: From email).
- Se prepara secret rotation o deploy.
- Pre-release audit (invocado por SecurityAudit o DeployOps).

**NO activar cuando:**
- Solo cambios de UI sin env vars.
- Documentacion pura sin cambios de config.

## Protocolo

### FASE A: Scan Automatizado

1. Ejecutar auditoria (nombres solamente):
   ```bash
   .agent/scripts/env_audit.py --format markdown
   ```
2. (Opcional) Comparar con Supabase secrets (nombres solamente):
   ```bash
   .agent/scripts/env_audit.py --with-supabase --format markdown
   ```

### FASE B: Scan Manual (fallback si script falla)

Si el script no esta disponible o falla:

1. **Frontend env vars:**
   ```bash
   grep -roh "import\.meta\.env\.[A-Z_]*" minimarket-system/src/ --include="*.ts" --include="*.tsx" | sort -u
   ```
2. **Backend env vars:**
   ```bash
   grep -roh "Deno\.env\.get('[A-Z_]*')" supabase/functions/ --include="*.ts" | sort -u
   ```
3. **Documentadas:**
   ```bash
   cat .env.example 2>/dev/null | grep -E "^[A-Z_]+=" | cut -d= -f1 | sort
   ```
4. **Comparar:** vars usadas vs documentadas -> reportar drift.

### FASE C: Evidencia

Crear evidencia en `docs/closure/`:
- `ENV_AUDIT_<YYYY-MM-DD>_<HHMMSS>.md` (copiar salida)

Acciones recomendadas:
- Si falta en `.env.example`: agregar nombre (sin valores reales).
- Si falta en Supabase secrets: planificar set (sin exponer valores).
- Si hay mismatch (alias): preferir unificar en codigo o agregar alias temporal documentado.

## Quality Gates

- [ ] Todas las env vars usadas en codigo estan documentadas en `.env.example`.
- [ ] No hay mismatch de nombres (aliases sin documentar).
- [ ] Supabase secrets cubren todas las vars requeridas por Edge Functions.
- [ ] No hay vars hardcodeadas en codigo (deben venir de env).
- [ ] Evidencia generada sin exponer valores.

## Anti-Loop / Stop-Conditions

**SI Supabase CLI no disponible:**
1. Ejecutar solo auditoria local (frontend + backend vs `.env.example`).
2. Marcar Supabase comparison como BLOCKED.
3. Continuar con reporte parcial.

**SI hay > 50 variables:**
1. Priorizar las criticas (auth, DB, API keys).
2. Documentar top 20.
3. Dejar resto como backlog.

**SI `.env.example` no existe:**
1. Crear uno minimo con los nombres encontrados.
2. Documentar decision en evidencia.
3. Continuar SIN esperar input.

**NUNCA:** Imprimir valores de env vars. Solo nombres.
