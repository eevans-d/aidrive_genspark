---
name: session-end
description: >
  Cierra la sesión sin pérdida de contexto y sincroniza evidencia/documentación.
version: 1.0.0
trigger:
  automatic:
    - antes de emitir respuesta final del agente
    - cuando se detecta fin de tarea principal
  manual:
    - cierre
    - fin
    - terminar sesion
  schedule:
    - cada sesión
priority: 4
timeout: 12
---

# Workflow: Session End

## Cuándo se ejecuta
- Siempre al finalizar una sesión o bloque de trabajo relevante.

## Pipeline

### Step 1: Summarize Changes
**Skill/Acción:** inventario de cambios (`git diff --name-only`, `git diff --stat`).
**Input:** worktree.
**Output:** lista de archivos tocados.
**On failure:** fallback a `git status --short`.

### Step 2: Run DocuGuard
**Skill/Acción:** sincronización documental completa.
**Input:** archivos modificados.
**Output:** docs alineadas.
**On failure:** continuar y registrar deuda explícita.

### Step 3: Update ESTADO_ACTUAL
**Skill/Acción:** consolidar estado real en `docs/ESTADO_ACTUAL.md`.
**Input:** evidencia de sesión.
**Output:** estado actualizado.
**On failure:** crear entrada mínima en `docs/closure/OPEN_ISSUES.md`.

### Step 4: Decision Log
**Skill/Acción:** registrar decisiones de arquitectura en `docs/DECISION_LOG.md`.
**Input:** cambios estructurales.
**Output:** decision log actualizado.
**On failure:** skip si no hubo decisiones.

### Step 5: Session Report
**Skill/Acción:** `SessionOps` para cierre/archivo.
**Input:** resumen final.
**Output:** reporte de sesión.
**On failure:** dejar reporte mínimo en `docs/closure/`.

## Diagrama de Flujo
`Summarize -> DocuGuard -> ESTADO_ACTUAL -> DECISION_LOG -> Session Report`

## Manejo de Errores
| Error | Acción |
|-------|--------|
| DocuGuard falla | registrar deuda y continuar cierre |
| archivo destino no existe | crear archivo base y continuar |

## Resultado Esperado
Cierre reproducible, contexto persistente y cero pérdida de trazabilidad entre sesiones.
