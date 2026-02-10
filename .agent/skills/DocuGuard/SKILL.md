---
name: DocuGuard
description: Guardian de documentacion. Sincroniza docs con codigo real, autogenera metricas y valida links para evitar drift.
role: CODEX->EXECUTOR
impact: 0-1
chain: []
---

# DocuGuard Skill

**ROL:** CODEX (fase 0-A: verificar) + EXECUTOR (fase B-C: sincronizar, actualizar).
**REGLA DE ORO:** "Si no esta documentado, no existe."

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos.

## Reglas de Automatizacion

1. Ejecutar TODAS las fases automaticamente en secuencia.
2. Si encuentra patrones prohibidos -> BLOQUEAR y reportar.
3. Si encuentra desincronizacion -> CORREGIR automaticamente.
4. Clasificar cambios como REAL/A CREAR/PROPUESTA FUTURA.
5. Generar reporte de sincronizacion al finalizar (evidencia en `docs/closure/`).

## Activacion

**Activar cuando:**
- Codigo modificado o creado.
- Cambios en variables de entorno.
- Auditoria de Pull Request.
- Invocado automaticamente por otro skill.

**NO activar cuando:**
- Refactor en progreso (codigo roto).
- Tareas exploratorias sin commits.

## Protocolo de Ejecucion

### FASE 0: Aislar Cambios (worktree/branch)

Objetivo: evitar mezclar cambios con el workspace local.

Checklist:
- Trabajar en una branch dedicada (ej: `chore/docuguard-sync-YYYYMMDD`).
- `git status --porcelain` debe estar limpio al empezar.

### FASE 0: Reality Check (R0)

Antes de documentar CUALQUIER cosa, verificar:
1. El archivo/modulo existe en el repo?
   ```bash
   ls <ruta_del_archivo>
   ```
2. El endpoint/funcion existe?
   ```bash
   grep -r "<nombre>" supabase/functions/ --include="*.ts" -l
   ```
3. La afirmacion es verificable? Si no -> clasificar como PROPUESTA FUTURA.

### FASE A: Code Pattern Scan

Buscar patrones prohibidos:
```bash
rg -l "console\\.log" supabase/functions/ --glob="*.ts"
rg -l -e "ey[A-Za-z0-9\\-_=]{20,}" supabase/functions/ --glob="*.ts"
```
Si encuentra algo -> BLOQUEAR y reportar.

### FASE B: Generar "Verdad" (determinística)

1. Regenerar métricas (fuente única):
   ```bash
   node scripts/metrics.mjs
   ```
   (CI/gates usan: `node scripts/metrics.mjs --check`)
2. Validar links internos en markdown:
   ```bash
   node scripts/validate-doc-links.mjs
   ```
3. (Opcional) Env audit (solo nombres):
   ```bash
   .agent/scripts/env_audit.py --format markdown
   ```

### FASE C: Sincronizacion (docs fuente-de-verdad)

Reglas:
- Conteos (endpoints, hooks, páginas, tests, migraciones, edge functions): **no hardcodear**. Usar `docs/METRICS.md`.
- Plan vigente: `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md` (MADRE queda histórico).

Checklist:
1. **README Check:** Si cambió estructura o comandos -> actualizar `README.md`.
2. **API Docs:** Si cambió `supabase/functions/` o specs -> verificar `docs/API_README.md` + `docs/*.yaml`.
3. **Decision Log:** Si hubo cambio arquitectónico/guardrail -> registrar en `docs/DECISION_LOG.md`.
4. **Estado Actual:** Verificar que `docs/ESTADO_ACTUAL.md` refleje cambios relevantes.
5. **Cron docs:** Si cambia `supabase/cron_jobs/` -> actualizar `docs/CRON_JOBS_COMPLETOS.md` y docs inline (`supabase/cron_jobs/*.md`).

### FASE C: Verificacion

1. Leer `docs/ESTADO_ACTUAL.md`.
2. Tu cambio contradice el estado actual? -> Actualizar el archivo.
3. Verificar que fechas en docs sean recientes.

### FASE D: Cierre (PR + evidencia)

1. Crear evidencia en `docs/closure/`:
   - `DOCUGUARD_SYNC_REPORT_YYYY-MM-DD.md` con:
     - Qué se cambió (paths).
     - Qué se verificó (comandos) sin imprimir secretos.
2. Quality gates mínimos:
   ```bash
   node scripts/validate-doc-links.mjs
   npm run test:unit
   ```
3. Commit + push + PR:
   ```bash
   git add -A
   git commit -m "docs: sync documentation with repo reality (DocuGuard)"
   git push -u origin HEAD
   gh pr create --base main --head <branch> --title "docs: sync documentation with repo reality (DocuGuard)" --body "<resumen>"
   ```

## Quality Gates

- [ ] Sin console.log ni secretos en codigo.
- [ ] `docs/METRICS.md` regenerado desde `scripts/metrics.mjs`.
- [ ] `node scripts/validate-doc-links.mjs` OK.
- [ ] Documentacion con fecha actualizada (cuando aplica).
- [ ] docs/ESTADO_ACTUAL.md refleja realidad.
- [ ] Sin documentos que referencien archivos inexistentes.

## Anti-Loop / Stop-Conditions

**SI hay conflicto entre docs:**
1. Priorizar archivo mas reciente por timestamp.
2. Documentar decision en EVIDENCE.md.
3. Continuar SIN esperar input.

**SI enlace roto encontrado:**
1. Marcar con [ENLACE ROTO] en el doc.
2. Intentar corregir (crear archivo faltante si es REAL/A CREAR, o eliminar referencia si era aspiracional).
3. Re-ejecutar `node scripts/validate-doc-links.mjs`.

**NUNCA:** Quedarse esperando confirmacion manual.
