---
name: SessionOps
description: 'Arranque/cierre de sesion Protocol Zero: bootstrap + baseline + extraccion
  + mega plan template + archivado con evidencia.'
role: CODEX
version: 1.0.0
impact: MEDIUM
impact_legacy: 0-1
triggers:
  automatic:
  - orchestrator keyword match (SessionOps)
  manual:
  - SessionOps
  - nueva sesion
  - nueva sesión
  - arranquemos
chain:
  receives_from: []
  sends_to:
  - ExtractionOps
  - MegaPlanner
  required_before: []
priority: 1
---

# SessionOps Skill

**ROL:** CODEX. Reduce friccion: 1 comando para arrancar con evidencia y otro para cerrar/archivar.

## Guardrails (Obligatorio)

1. NO imprimir secretos/JWTs (solo nombres).
2. NO usar comandos destructivos (`git reset --hard`, `git checkout -- <file>`, force-push).
3. `api-minimarket` debe permanecer `verify_jwt=false` (si se redeployea usar `--no-verify-jwt`).

## Reglas de Automatizacion

1. Ejecutar kickoff/cierre completo sin pedir confirmacion.
2. Si script falla -> ejecutar protocolo manual equivalente.
3. Validar que todos los artefactos esperados fueron generados.
4. Si faltan artefactos -> crearlos manualmente y documentar.
5. Al finalizar kickoff, invocar ExtractionOps + MegaPlanner automaticamente.

## Activacion

**Activar cuando:**
- El usuario dice "arranquemos", "nueva sesion", "kickoff", "empezar", "iniciar sesion".
- El usuario dice "cierre", "cerrar sesion", "archivar sesion", "session end".
- Se necesita un proceso guiado sin pasos manuales.

**NO activar cuando:**
- Ya hay sesion activa (para kickoff).
- En medio de implementacion (completar primero).

## Protocolo (Push-Button)

### A) Arrancar sesion (recomendado)

1 comando (crea sesion + baseline + reportes + mega plan template):
```bash
.agent/scripts/p0.sh kickoff "<objetivo>" --with-supabase
```

Opcional (mas completo, mas lento):
```bash
.agent/scripts/p0.sh kickoff "<objetivo>" --with-gates --with-perf --with-supabase
```

### B) Arrancar sesion (fallback manual)

Si `p0.sh` no esta disponible:

1. **Crear estructura:**
   ```bash
   mkdir -p .agent/sessions/current
   echo "$(date -Iseconds)" > .agent/sessions/current/SESSION_ACTIVE
   ```
2. **Crear briefing:**
   - Escribir `BRIEFING.md` con objetivo, scope, restricciones.
3. **Ejecutar BaselineOps:** capturar baseline manual.
4. **Ejecutar ExtractionOps:** generar reportes.
5. **Invocar MegaPlanner:** producir plan Top-10.

### C) Cerrar y archivar sesion

```bash
.agent/scripts/p0.sh session-end
```

### D) Cierre manual (fallback)

Si `p0.sh` no esta disponible:

1. **Crear SESSION_REPORT.md** con resumen de logros.
2. **Archivar:**
   ```bash
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   mv .agent/sessions/current .agent/sessions/archive/session_$TIMESTAMP
   ```
3. **Generar evidencia de cierre** en `docs/closure/SESSION_CLOSE_<YYYY-MM-DD>.md`.

## Artefactos Esperados

### Kickoff:
- `.agent/sessions/current/SESSION_ACTIVE`
- `.agent/sessions/current/BRIEFING.md`
- `docs/closure/BASELINE_LOG_*.md`
- `docs/closure/TECHNICAL_ANALYSIS_*.md`
- `docs/closure/INVENTORY_REPORT_*.md`
- `docs/closure/MEGA_PLAN_*.md` (plantilla para completar con DoD)

### Cierre:
- `.agent/sessions/current/SESSION_REPORT.md`
- Sesion archivada en `.agent/sessions/archive/`
- `docs/closure/SESSION_CLOSE_*.md`

## Quality Gates

- [ ] SESSION_ACTIVE creado (kickoff) o eliminado (cierre).
- [ ] Todos los artefactos esperados generados.
- [ ] Evidencia de baseline incluida.
- [ ] No hay secretos expuestos en ningun artefacto.
- [ ] Sesion archivada correctamente (cierre).

## Anti-Loop / Stop-Conditions

**SI scripts no disponibles:**
1. Ejecutar protocolo manual (FASE B/D).
2. Documentar que se uso fallback manual.
3. Continuar sin esperar input.

**SI artefactos faltan tras ejecucion:**
1. Crear manualmente los faltantes.
2. Documentar cuales fueron creados manualmente.
3. Continuar con la sesion.

**SI ya existe SESSION_ACTIVE (para kickoff):**
1. Reportar "Sesion ya activa".
2. Preguntar si desea cerrar la anterior primero.
3. No sobrescribir sin confirmacion.

**NUNCA:** Quedarse esperando confirmacion manual para operaciones de impacto 0-1.

## Notas

- Este skill no implementa cambios de codigo: solo prepara/archiva y deja evidencia.
- Para convertir evidencia en plan final: usar `MegaPlanner` y completar el `MEGA_PLAN_*.md`.
