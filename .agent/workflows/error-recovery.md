---
name: error-recovery
description: >
  Manejo automático de errores: captura contexto, clasifica, intenta fix y documenta.
version: 1.0.0
trigger:
  automatic:
    - fallo de comando/test/build
    - fallo de otro workflow
  manual:
    - error
    - falla
    - no funciona
  schedule: []
priority: 1
timeout: 15
---

# Workflow: Error Recovery

## Cuándo se ejecuta
- Ante cualquier error técnico que interrumpa el pipeline.

## Pipeline

### Step 1: Capture Error Context
**Skill/Acción:** capturar mensaje exacto, comando, archivo/línea, último diff.
**Input:** salida de error.
**Output:** contexto reproducible.
**On failure:** conservar stderr bruto.

### Step 2: Classify Error
**Skill/Acción:** clasificar `SYNTAX`, `RUNTIME`, `CONFIG`, `DEPENDENCY`, `ENV`, `UNKNOWN`.
**Input:** contexto capturado.
**Output:** tipo de error.
**On failure:** `UNKNOWN`.

### Step 3: Auto-Fix Attempt
**Skill/Acción:** `DebugHound` con máximo 3 intentos.
**Input:** tipo + contexto.
**Output:** fix aplicado o no.
**On failure:** pasar a Step 4.

### Step 4: Verify Fix
**Skill/Acción:** `TestMaster` mínimo relevante.
**Input:** fix aplicado.
**Output:** PASS/FAIL.
**On failure:** volver a Step 3 (hasta límite).

### Step 5: Document Error
**Skill/Acción:** registrar en `docs/closure/OPEN_ISSUES.md` o evidencia SP.
**Input:** error persistente.
**Output:** deuda técnica trazable.
**On failure:** emitir reporte mínimo en salida.

## Diagrama de Flujo
`Capture -> Classify -> Auto-Fix -> Verify -> Document`

## Manejo de Errores
| Error | Acción |
|-------|--------|
| fix no converge en 3 intentos | documentar y escalar |
| error de entorno no replicable | marcar BLOCKED con prerequisito |

## Resultado Esperado
Error resuelto automáticamente o documentado con contexto suficiente para resolución humana.
