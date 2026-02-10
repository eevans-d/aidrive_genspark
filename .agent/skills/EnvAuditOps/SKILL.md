---
name: EnvAuditOps
description: Audita variables de entorno usadas vs documentadas (solo nombres). Detecta mismatches como EMAIL_FROM vs SMTP_FROM.
role: CODEX
impact: 0-1
chain: [DocuGuard]
---

# EnvAuditOps Skill

**ROL:** CODEX. Auditoria de env vars (nombres) para evitar drift entre codigo, `.env.example` y Supabase secrets.

## Guardrails (Obligatorio)

1. NO imprimir valores de secrets/JWTs (solo nombres).
2. No modificar secretos ni deployar: este skill solo audita y reporta.

## Activacion

**Activar cuando:**
- Se agregan/modifican env vars.
- Hay incidentes por variables faltantes (ej: From email).
- Se prepara secret rotation o deploy.

## Protocolo

1. Ejecutar auditoria (nombres solamente):
   ```bash
   .agent/scripts/env_audit.py --format markdown
   ```
2. (Opcional) Comparar con Supabase secrets (nombres solamente):
   ```bash
   .agent/scripts/env_audit.py --with-supabase --format markdown
   ```
3. Crear evidencia en `docs/closure/`:
   - `ENV_AUDIT_<YYYY-MM-DD>_<HHMMSS>.md` (copiar salida)
4. Acciones recomendadas:
   - Si falta en `.env.example`: agregar nombre (sin valores reales).
   - Si falta en Supabase secrets: planificar set (sin exponer valores).
   - Si hay mismatch (alias): preferir unificar en codigo o agregar alias temporal documentado.

