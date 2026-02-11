---
name: SecurityAudit
description: Auditoria de seguridad del sistema. RLS, secrets, OWASP, permisos y vulnerabilidades.
role: CODEX
version: 1.0.0
impact: CRITICAL
impact_legacy: 0
triggers:
  automatic:
  - orchestrator keyword match (SecurityAudit)
  manual:
  - SecurityAudit
  - seguridad
  - security
  - rls
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  required_before: []
priority: 6
---

# SecurityAudit Skill

**ROL:** CODEX (estado frio). Auditar, detectar vulnerabilidades, generar reporte. NO aplicar fixes directamente.
**PROTOCOLO:** "Seguridad no es opcional."

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.
3. Este skill NO aplica fixes: solo reporta con evidencia (rutas/comandos).

## Reglas de Automatizacion

1. Ejecutar todas las fases en secuencia sin pedir confirmacion.
2. Clasificar hallazgos por severidad (CRITICAL/HIGH/MEDIUM/LOW).
3. Generar reporte automaticamente al finalizar.
4. Si encuentra CRITICAL -> reportar inmediatamente pero continuar auditoria.
5. NO modificar codigo directamente (solo reportar).

## Activacion

**Activar cuando:**
- Pre-release audit.
- Nuevas tablas creadas (verificar RLS).
- Nuevos endpoints creados (verificar autenticacion).
- Usuario pide "auditar seguridad" o "verificar RLS".
- Cambios en politicas de autenticacion.

**NO activar cuando:**
- Solo cambios cosmeticos de UI.
- Solo cambios de documentacion.
- Hotfix urgente (priorizar funcionalidad primero).

## Protocolo de Ejecucion

### FASE A: Scan de Secrets y Patrones Prohibidos

1. **Buscar secrets hardcodeados:**
   ```bash
   grep -rE "ey[A-Za-z0-9\-_=]{20,}" --include="*.ts" --include="*.tsx" --include="*.js" -l
   grep -rE "(password|secret|token|key)\s*[:=]\s*['\"][^'\"]{8,}" --include="*.ts" --include="*.tsx" -l
   ```
2. **Verificar .env no commiteado:**
   ```bash
   git ls-files .env .env.local .env.production 2>/dev/null
   ```
3. **Buscar console.log en produccion:**
   ```bash
   grep -r "console\.log" supabase/functions/ --include="*.ts" -l
   ```

### FASE B: Auditoria RLS (Row Level Security)

1. **Listar tablas en migraciones:**
   ```bash
   grep -r "CREATE TABLE" supabase/migrations/ --include="*.sql" -l
   ```
2. **Verificar RLS habilitado:**
   ```bash
   grep -r "ENABLE ROW LEVEL SECURITY" supabase/migrations/ --include="*.sql" -l
   ```
3. **Comparar:** Tablas sin RLS = **CRITICAL**.
4. **Verificar policies existentes:**
   ```bash
   grep -r "CREATE POLICY" supabase/migrations/ --include="*.sql" | wc -l
   ```
5. **Usar script de auditoria si disponible:**
   ```bash
   cat scripts/rls_audit.sql
   ```

### FASE C: Auditoria de Autenticacion y Permisos

1. **Verificar endpoints protegidos:**
   ```bash
   grep -r "Authorization\|Bearer\|auth\|jwt" supabase/functions/api-minimarket/ --include="*.ts" -l
   ```
2. **Buscar endpoints sin autenticacion:**
   ```bash
   grep -r "Deno.serve" supabase/functions/ --include="*.ts" -l
   ```
   Comparar con los que verifican auth.
3. **Verificar roles y permisos:**
   ```bash
   grep -r "role\|admin\|user_role" minimarket-system/src/lib/roles.ts
   ```

### FASE D: OWASP Top 10 Quick Check

1. **Injection (SQL/XSS):**
   ```bash
   grep -r "innerHTML\|dangerouslySetInnerHTML" minimarket-system/src/ --include="*.tsx" -l
   grep -r "eval(" --include="*.ts" --include="*.tsx" -l
   ```
2. **CORS:**
   ```bash
   grep -r "Access-Control-Allow-Origin" supabase/functions/ --include="*.ts"
   ```
3. **Rate Limiting:**
   ```bash
   grep -r "rate.limit\|rateLimit\|rate-limit" supabase/functions/ --include="*.ts" -l
   ```

### FASE E: Verificacion de Configuracion Supabase

1. **Verificar config.toml:**
   ```bash
   cat supabase/config.toml | grep -E "(auth|security|jwt)"
   ```
2. **Verificar .env.example tiene todas las variables:**
   ```bash
   cat .env.example
   ```

### FASE F: Cron Jobs Auth Verification (HC-1)

1. **Buscar cron jobs SQL:**
   ```bash
   grep -r "cron.schedule\|net.http_post" supabase/migrations/ --include="*.sql" -l
   ```
2. **Verificar Authorization header en cada cron job:**
   ```bash
   grep -B2 -A10 "net.http_post" supabase/migrations/ --include="*.sql" -r | grep -c "Authorization"
   ```
3. **Comparar con funciones que requieren JWT:**
   - Si la funcion objetivo tiene `verify_jwt=true` (Supabase default) y el cron job NO envia `Authorization: Bearer ...` -> **CRITICAL**: el job falla silenciosamente con 401.

### FASE G: Deploy Script Safety (HC-2)

1. **Verificar filtro de _shared/:**
   ```bash
   cat deploy.sh 2>/dev/null | grep -E "_shared|shared"
   ```
   Si el script itera `supabase/functions/*/` sin excluir `_shared/` -> **CRITICAL**: `set -e` abortara todo el deployment.

2. **Verificar --no-verify-jwt para api-minimarket:**
   ```bash
   cat deploy.sh 2>/dev/null | grep "no-verify-jwt"
   ```
   Si api-minimarket se deploya sin `--no-verify-jwt` -> **CRITICAL**: resetea el Gateway a `verify_jwt=true`, rompiendo todo el frontend.

### FASE H: Supabase Free-Tier Constraints

1. **Timeout de funciones:** El Free plan tiene timeout de 60s. Verificar funciones que pueden excederlo:
   ```bash
   grep -r "timeout\|setTimeout\|sleep\|delay" supabase/functions/ --include="*.ts" -l
   ```
2. **Cold start:** Las funciones inactivas tienen cold start de ~2-5s en Free plan. Funciones criticas (api-minimarket) pueden verse afectadas.

## Severidad de Hallazgos

| Severidad | Ejemplo | Accion |
|-----------|---------|--------|
| CRITICAL | Secret hardcodeado, tabla sin RLS | Reportar inmediatamente |
| HIGH | Endpoint sin auth, CORS wildcard | Reportar como blocker |
| MEDIUM | console.log en produccion, rate limit faltante | Reportar como warning |
| LOW | Mejora posible pero no vulnerabilidad | Documentar como sugerencia |

## Salida Requerida

Generar/actualizar: `docs/SECURITY_AUDIT_REPORT.md`

```markdown
# Security Audit Report
**Fecha:** [Date] | **Score:** [1-10] | **Hallazgos:** [N]

## CRITICAL
- [ ] [Hallazgo con evidencia]

## HIGH
- [ ] [Hallazgo con evidencia]

## MEDIUM
- [ ] [Hallazgo con evidencia]

## LOW
- [ ] [Sugerencia]

## RLS Status
| Tabla | RLS Habilitado | Policies | Estado |
|-------|---------------|----------|--------|
| [tabla] | Si/No | [N] | OK/VULNERABLE |

## Recomendaciones
1. [Accion prioritaria]
2. [Accion secundaria]
```

## Quality Gates

- [ ] Todas las tablas con RLS verificado.
- [ ] Sin secrets hardcodeados.
- [ ] Todos los endpoints criticos con autenticacion.
- [ ] Sin console.log en backend.
- [ ] CORS configurado correctamente.

## Anti-Loop / Stop-Conditions

**SI no se puede acceder a Supabase Dashboard:**
1. Ejecutar auditoria estatica del codigo.
2. Documentar limitacion.
3. Marcar como PARCIAL.

**SI hay > 20 hallazgos:**
1. Priorizar CRITICAL y HIGH primero.
2. Documentar todos pero enfocarse en top 10.
3. Continuar SIN esperar input.

**NUNCA:** Modificar codigo directamente. Solo reportar hallazgos.
