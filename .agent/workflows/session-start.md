---
name: session-start
description: >
  Carga contexto operativo y prepara la sesión automáticamente.
version: 1.0.0
trigger:
  automatic:
    - inicio de interacción/sesión del agente
    - primera acción tras detectar contexto vacío
  manual:
    - inicio
    - start
    - nueva sesion
  schedule:
    - cada sesión
priority: 3
timeout: 10
---

# Workflow: Session Start

## Cuándo se ejecuta
- Al inicio de cada sesión o primera interacción.

## Pipeline

### Step 1: Load Context
**Skill/Acción:** leer `CLAUDE.md`, `AGENTS.md`, `.agent/skills/ORCHESTRATOR.md`, `docs/ESTADO_ACTUAL.md`, `docs/closure/README_CANONICO.md`, `docs/closure/archive/historical/ACTA_EJECUTIVA_FINAL_2026-02-13.md`.
**Input:** workspace actual.
**Output:** contexto mínimo cargado.
**On failure:** continuar en modo mínimo y registrar warning.

### Step 2: Check Project State
**Skill/Acción:** `SessionOps` + `BaselineOps`.
**Input:** repo local.
**Output:** resumen de estado (git/supabase/docs).
**On failure:** fallback a `git status`, `git log -5`, `head docs/ESTADO_ACTUAL.md`.

### Step 3: Freshness Check
**Skill/Acción:** validar antigüedad de docs fuente de verdad.
**Input:** `docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md`, `docs/closure/OPEN_ISSUES.md`.
**Output:** lista de stale docs.
**On failure:** marcar `BLOCKED` y continuar.

### Step 4: Pending Items
**Skill/Acción:** buscar pendientes heredados.
**Input:** `docs/`, `.agent/sessions/`.
**Output:** backlog corto de sesión.
**On failure:** skip.

### Step 5: Report
**Skill/Acción:** consolidar contexto inicial para ejecución.
**Input:** outputs previos.
**Output:** resumen accionable.
**On failure:** fallback a resumen básico.

## Diagrama de Flujo
`Load Context -> Check State -> Freshness -> Pending -> Report`

## Manejo de Errores
| Error | Acción |
|-------|--------|
| Archivo de contexto ausente | continuar con contexto mínimo |
| Comando git/supabase falla | marcar warning y seguir |

## Resultado Esperado
El agente arranca con contexto operativo, pendientes claros y riesgo de desincronización minimizado.
