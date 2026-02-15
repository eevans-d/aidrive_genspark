---
name: code-change
description: >
  Pipeline automático tras cambios de código: seguridad, impacto, tests y documentación.
version: 1.1.0
trigger:
  automatic:
    - modificación/creación de archivos de código
    - finalización de CodeCraft o DebugHound
  manual:
    - revisar cambio
    - code change
  schedule: []
priority: 2
timeout: 20
auto_execution: true
---

// turbo-all

# Workflow: Code Change

## Cuándo se ejecuta
- **AUTOMÁTICAMENTE** después de cambios significativos de código backend/frontend/sql.
- El agente DEBE ejecutar este pipeline sin esperar instrucción del usuario.
- Si el agente modificó archivos `.tsx`, `.ts`, `.sql`, `.md` de docs, DEBE activar este workflow.

## Pipeline

### Step 1: Classify Change
**Skill/Acción:** clasificar cambio (`NEW_FILE`, `MODIFICATION`, `DELETION`, `REFACTOR`).
**Input:** diff actual.
**Output:** tipo + alcance.
**On failure:** asumir `MODIFICATION` conservador.

### Step 2: Security Scan
**Skill/Acción:** `SecurityAudit` (scan rápido) o fase A de `DocuGuard`.
**Input:** archivos modificados.
**Output:** hallazgos críticos/no críticos.
**On failure:** bloquear solo si hay indicio de secreto hardcodeado.

### Step 3: Impact Analysis
**Skill/Acción:** mapear docs afectadas (API_README, schema, estado).
**Input:** paths tocados.
**Output:** lista de docs objetivo.
**On failure:** incluir al menos `docs/ESTADO_ACTUAL.md`.

### Step 4: Tests/Lint
**Skill/Acción:** `TestMaster` + comandos mínimos según stack.
**Input:** alcance del cambio.
**Output:** PASS/PARCIAL/BLOCKED.
**On failure:** `error-recovery`.

### Step 5: Sync Documentation
**Skill/Acción:** `DocuGuard` final.
**Input:** resultados previos.
**Output:** documentación sincronizada.
**On failure:** registrar deuda con archivo/causa exacta.

## Diagrama de Flujo
`Classify -> Security -> Impact -> Tests/Lint -> Doc Sync`

## Manejo de Errores
| Error | Acción |
|-------|--------|
| test/lint falla | disparar `error-recovery` |
| scan detecta secreto | bloquear pipeline |

## Resultado Esperado
Código validado, riesgos detectados y documentación alineada automáticamente.
