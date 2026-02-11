---
name: CronFixOps
description: Validar y corregir configuraciones de cron jobs. Detecta HC-1 (auth faltante),
  timeouts, y schedules faltantes.
role: CODEX->EXECUTOR
version: 1.0.0
impact: CRITICAL
impact_legacy: 2
triggers:
  automatic:
  - orchestrator keyword match (CronFixOps)
  manual:
  - CronFixOps
  - fix cron
  - cron jobs
  - arreglar cron
chain:
  receives_from: []
  sends_to:
  - DocuGuard
  - TestMaster
  required_before: []
priority: 5
---

# CronFixOps Skill

**ROL:** CODEX (fase A-B: analizar cron configs) + EXECUTOR (fase C: generar/aplicar fixes SQL).
**PROTOCOLO:** "Un cron job sin auth es un cron job muerto."

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres de variables, nunca valores).
2. NO usar comandos destructivos.
3. Impacto 2: toda correccion SQL debe tener rollback preparado.
4. NO deployar funciones directamente: solo generar SQL y documentar deploy manual.

## Reglas de Automatizacion

1. Ejecutar scan completo de cron SQL sin pedir confirmacion.
2. Generar SQL de correccion automaticamente para HC-1.
3. Si hay timeout potencial -> documentar como WARNING (no bloquear).
4. Generar reporte de estado de cron jobs al finalizar.
5. Si se genera SQL de fix -> guardar en `supabase/migrations/` con timestamp.

## Activacion

**Activar cuando:**
- Usuario pide "fix cron", "verificar cron", "arreglar cron".
- Post-audit: corregir HC-1 de `docs/audit/EVIDENCIA_SP-*.md`.
- Despues de crear nueva Edge Function que sera invocada por cron.
- Pre-produccion: verificar todos los cron jobs como parte de ProductionGate.

**NO activar cuando:**
- Solo creando nueva Edge Function (usar CodeCraft).
- Solo deployando (usar DeployOps).
- Bug en logica de la funcion destino (usar DebugHound).

## Protocolo de Ejecucion

### FASE A: Inventario de Cron Jobs

1. **Buscar todas las definiciones de cron:**
   ```bash
   grep -rn "cron.schedule\|net.http_post" supabase/ --include="*.sql" -l
   ```

2. **Listar cron SQL files:**
   ```bash
   ls supabase/cron_jobs/*.sql 2>/dev/null
   find supabase/migrations/ -name "*.sql" -exec grep -l "cron.schedule" {} \;
   ```

3. **Inventariar cada cron job:**
   Para cada job, extraer:
   - Nombre del job
   - Schedule (frecuencia)
   - URL destino (Edge Function)
   - Headers enviados (especialmente Authorization)
   - Body/params

### FASE B: Validacion por Job

Para cada cron job identificado, verificar:

| Check | Comando | Criterio PASS |
|-------|---------|---------------|
| Auth Header | `grep -A10 "<job_name>" <file> \| grep "Authorization"` | Tiene `Authorization: Bearer` |
| Funcion existe | `ls supabase/functions/<nombre>/index.ts` | Archivo existe |
| verify_jwt | `grep "verify_jwt" supabase/config.toml 2>/dev/null` | Si verify_jwt=true (default), DEBE tener auth header |
| Timeout viable | Comparar timeout config vs Free tier (60s) | < 60s o justificado |
| Schedule coherente | Verificar que el schedule tiene sentido | No duplicados, frecuencia razonable |

**Tabla de resultados esperada:**

| Job | Schedule | Target | Auth Header | Existe | Timeout OK | Estado |
|-----|----------|--------|-------------|--------|-----------|--------|
| alertas-stock_invoke | */60 min | alertas-stock | ❌ NO | ✅ | ✅ | **FAIL: HC-1** |
| notificaciones-tareas_invoke | */120 min | notificaciones-tareas | ❌ NO | ✅ | ✅ | **FAIL: HC-1** |
| reportes-automaticos_invoke | 08:00 | reportes-automaticos | ❌ NO | ✅ | ✅ | **FAIL: HC-1** |
| daily_price_update | 02:00 | cron-jobs-maxiconsumo | ✅ SI | ✅ | ⚠️ 60s | **WARN** |
| maintenance_cleanup | — | cron-jobs-maxiconsumo | — | ✅ | ✅ | **FAIL: Sin schedule** |

### FASE C: Generar SQL de Correccion

Para cada cron job que falla HC-1, generar SQL que agrega Authorization header:

```sql
-- Fix HC-1: Agregar Authorization header a cron jobs
-- Rollback: SELECT cron.unschedule('<job_name>');

SELECT cron.unschedule('<job_name>');

SELECT cron.schedule(
  '<job_name>',
  '<schedule>',
  $$
  SELECT net.http_post(
    url := '<supabase_url>/functions/v1/<function_name>',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**Para maintenance_cleanup sin schedule:**
```sql
-- Agregar schedule semanal para maintenance_cleanup
SELECT cron.schedule(
  'maintenance_cleanup_weekly',
  '0 4 * * 0', -- Domingos 04:00 UTC
  $$
  SELECT net.http_post(
    url := '<supabase_url>/functions/v1/cron-jobs-maxiconsumo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"jobId": "maintenance_cleanup"}'::jsonb
  ) AS request_id;
  $$
);
```

### FASE D: Verificacion Post-Fix

1. **Validar SQL sintaxis:**
   ```bash
   # Verificar que el file SQL generado tiene sintaxis valida
   grep -c "cron.schedule" supabase/migrations/<nuevo_file>.sql
   grep -c "Authorization" supabase/migrations/<nuevo_file>.sql
   ```

2. **Cross-reference con deploy_all_cron_jobs.sql:**
   ```bash
   diff <(grep "schedule" supabase/cron_jobs/deploy_all_cron_jobs.sql) <(grep "schedule" supabase/migrations/<nuevo_file>.sql) 2>/dev/null
   ```

3. **Documentar en EVIDENCE.md:**
   - Jobs corregidos
   - SQL generado (ruta)
   - Rollback SQL disponible
   - Deploy pendiente (requiere `supabase db push`)

## Salida Requerida

Generar: `docs/CRON_JOBS_STATUS.md`

```markdown
# Cron Jobs Status Report
**Fecha:** [Date] | **Total Jobs:** [N] | **OK:** [N] | **FAIL:** [N]

## Estado por Job
| Job | Schedule | Auth | Timeout | Estado |
|-----|----------|------|---------|--------|
| [job] | [freq] | ✅/❌ | OK/WARN | PASS/FAIL |

## Correcciones Pendientes
1. [Migration file] -> requiere `supabase db push`

## Rollback
- `SELECT cron.unschedule('<job_name>');`
```

## Quality Gates

- [ ] Todos los cron jobs inventariados.
- [ ] Todos los jobs con auth header verificado.
- [ ] SQL de correccion generado para HC-1.
- [ ] Rollback SQL incluido.
- [ ] maintenance_cleanup tiene schedule o documentado como pendiente.

## Anti-Loop / Stop-Conditions

**SI no se puede verificar cron.schedule (pg_cron no accesible):**
1. Analizar SQL files estaticamente.
2. Documentar limitacion.
3. Generar SQL de correccion basado en analisis estatico.

**SI hay >10 cron jobs:**
1. Priorizar los que invocan Edge Functions (mas riesgo de HC-1).
2. Documentar crons internos por separado.

**NUNCA:** Ejecutar SQL de cron directamente sin que el usuario apruebe.
