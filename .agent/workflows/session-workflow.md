---
description: Workflow estructurado para sesiones de trabajo con Protocol Zero. AUTOMATICO - sin intervencion manual.
auto_execution: true
---

# Protocol Zero: Session Workflow

**Este workflow es auto-ejecutable.** El agente detecta automaticamente que rol asumir.

## Auto-Deteccion de Rol

```
SI existe .agent/sessions/current/SESSION_ACTIVE -> ROL: EXECUTOR
SI NO existe -> ROL: CODEX
```

---

## CODEX (Estado Frio: Pre/Post Session)

**Quien:** Arquitecto + PM + Auditor. NO implementa codigo profundo.

### Pre-Session Steps

1. **Auto-verificar infraestructura:**
   ```bash
   mkdir -p .agent/sessions/current .agent/sessions/archive
   ```

2. **Generar BRIEFING.md** en `.agent/sessions/current/`:
   ```markdown
   # Briefing de Sesion
   **Fecha:** YYYY-MM-DD HH:MM
   **Generado por:** CODEX
   **Objetivo:** [Una frase verificable]

   ## Checklist Atomico (ejecutar en orden)
   - [ ] T1 - [Tarea con criterio de exito]
   - [ ] T2 - [Tarea con criterio de exito]

   ## Criterio de DONE
   - [ ] [Verificacion concreta]

   ## Restricciones
   - No tocar: [paths protegidos]
   - Nivel de impacto: [0-3]

   ## Rollback (si impacto >= 2)
   - [Comandos de reversion]
   ```

3. **Transicion automatica a EXECUTOR:**
   - Si impacto <= 1 -> crear SESSION_ACTIVE sin pedir confirmacion.
   - Si impacto >= 2 -> preparar rollback primero, luego crear SESSION_ACTIVE.

---

## EXECUTOR (Estado Caliente: Ejecucion)

**Quien:** Ejecutor tactico puro. MINIMA charla, MAXIMA ejecucion.

### Execution Steps

4. **Activar sesion:**
   ```bash
   touch .agent/sessions/current/SESSION_ACTIVE
   echo "Session started: $(date)" >> .agent/sessions/current/SESSION_LOG.md
   ```

5. **Ejecutar checklist:**
   - Leer BRIEFING.md.
   - Ejecutar cada tarea T1, T2, etc. en orden.
   - Marcar `[x]` al completar.
   - Si hay bloqueo -> marcar `[!]` y documentar.

6. **Registrar evidencia** en `EVIDENCE.md`:
   ```markdown
   ## Evidencia de Sesion
   **Archivos modificados:**
   - [ruta] - [que cambio]

   **Comandos ejecutados:**
   - `[comando]` -> [resultado]

   **Decisiones tomadas:**
   - [decision] porque [razon]
   ```

7. **Cerrar sesion:**
   ```bash
   rm -f .agent/sessions/current/SESSION_ACTIVE
   touch .agent/sessions/current/SESSION_COMPLETE
   echo "Session completed: $(date)" >> .agent/sessions/current/SESSION_LOG.md
   ```

---

## CODEX (Post-Session)

**Quien:** Auditor post-ejecucion.

### Post-Session Steps

8. **Validar resultados:**
   - Verificar criterios de DONE del briefing.
   - Ejecutar tests si aplica: `npx vitest run tests/unit/`
   - Comparar archivos tocados vs esperados.

9. **Generar SESSION_REPORT.md:**
   ```markdown
   # Reporte de Sesion
   **Fecha:** [timestamp]
   **Estado:** COMPLETADA | PARCIAL | FALLIDA

   ## Resumen
   - Completado: [lista]
   - Pendiente: [lista]

   ## Proximos pasos
   - [accion recomendada]
   ```

10. **Archivar sesion:**
    ```bash
    ARCHIVE_DIR=".agent/sessions/archive/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$ARCHIVE_DIR"
    mv .agent/sessions/current/*.md "$ARCHIVE_DIR/" 2>/dev/null
    rm -f .agent/sessions/current/SESSION_COMPLETE
    ```

---

## Reglas de Automatizacion

1. **Impacto 0-1:** Todo automatico. Sin pedir confirmacion.
2. **Impacto 2:** Automatico con rollback preparado.
3. **Impacto 3:** UNICO caso que requiere confirmacion humana.

## Anti-Loop / Stop Conditions

- Bloqueo real -> documentar + cerrar PARCIAL + reportar.
- Sesion > 4 horas -> forzar cierre + archivar.
- Impacto >= 2 y falla -> rollback inmediato.
- **NUNCA** quedarse en loop esperando input.
