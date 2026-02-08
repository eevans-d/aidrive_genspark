---
name: DocuGuard
description: Guardian de documentacion. Sincroniza docs con codigo, detecta desincronizaciones.
role: CODEX->EXECUTOR
impact: 0-1
chain: []
---

# DocuGuard Skill

**ROL:** CODEX (fase 0-A: verificar) + EXECUTOR (fase B-C: sincronizar, actualizar).
**REGLA DE ORO:** "Si no esta documentado, no existe."

## Reglas de Automatizacion

1. Ejecutar TODAS las fases automaticamente en secuencia.
2. Si encuentra patrones prohibidos -> BLOQUEAR y reportar.
3. Si encuentra desincronizacion -> CORREGIR automaticamente.
4. Clasificar cambios como REAL/A CREAR/PROPUESTA FUTURA.
5. Generar reporte de sincronizacion al finalizar.

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
grep -r "console\.log" supabase/functions/ --include="*.ts" -l
grep -rE "ey[A-Za-z0-9\-_=]{20,}" supabase/functions/ --include="*.ts" -l
```
Si encuentra algo -> BLOQUEAR y reportar.

### FASE B: Sincronizacion

1. **README Check:** Si cambio `package.json` o endpoints clave -> actualizar `README.md`.
2. **API Docs:** Si cambio `supabase/functions/` -> verificar `docs/API_README.md`.
3. **Decision Log:** Si hubo cambio arquitectonico -> registrar en `docs/DECISION_LOG.md`.
4. **Estado Actual:** Verificar que `docs/ESTADO_ACTUAL.md` refleje cambios.

### FASE C: Verificacion

1. Leer `docs/ESTADO_ACTUAL.md`.
2. Tu cambio contradice el estado actual? -> Actualizar el archivo.
3. Verificar que fechas en docs sean recientes.

## Quality Gates

- [ ] Sin console.log ni secretos en codigo.
- [ ] Documentacion con fecha actualizada.
- [ ] docs/ESTADO_ACTUAL.md refleja realidad.
- [ ] Sin documentos que referencien archivos inexistentes.

## Anti-Loop / Stop-Conditions

**SI hay conflicto entre docs:**
1. Priorizar archivo mas reciente por timestamp.
2. Documentar decision en EVIDENCE.md.
3. Continuar SIN esperar input.

**SI enlace roto encontrado:**
1. Marcar con [ENLACE ROTO] en el doc.
2. Continuar verificacion.
3. Reportar todos al final.

**NUNCA:** Quedarse esperando confirmacion manual.
