---
name: full-audit
description: >
  Auditoría integral de código, skills, workflows y documentación con reporte priorizado.
version: 1.0.0
trigger:
  automatic:
    - docs/ESTADO_ACTUAL.md stale > 14 días
    - primera sesión tras merge grande
  manual:
    - auditoria completa
    - full audit
    - revisar todo
  schedule:
    - semanal (si aplica)
priority: 5
timeout: 40
---

# Workflow: Full Audit

## Cuándo se ejecuta
- Bajo trigger manual o cuando se detecta drift sistémico.

## Pipeline

### Step 1: Structure Audit
**Skill/Acción:** inventario de estructura/repos.
**Input:** filesystem.
**Output:** mapa de componentes.
**On failure:** fallback a inventario parcial.

### Step 2: Code Quality Scan
**Skill/Acción:** `RealityCheck` + `SecurityAudit` básico.
**Input:** codebase.
**Output:** hallazgos por severidad.
**On failure:** continuar y marcar `BLOCKED` parcial.

### Step 3: Documentation Completeness
**Skill/Acción:** `DocuGuard` profundo.
**Input:** docs + código.
**Output:** code_huerfano/doc_fantasma/desincronizado.
**On failure:** generar listado mínimo de gaps.

### Step 4: Skills Health Check
**Skill/Acción:** `lint_skills.py` + verificación de orquestación.
**Input:** `.agent/skills`, `project_config.yaml`.
**Output:** estado de automatización agéntica.
**On failure:** reportar skill/archivo exacto.

### Step 5: Workflow Health Check
**Skill/Acción:** validar router y workflows requeridos.
**Input:** `.agent/workflows/`.
**Output:** cobertura de eventos.
**On failure:** marcar faltantes con prioridad.

### Step 6: Consolidated Report
**Skill/Acción:** generar reporte único en `docs/closure/`.
**Input:** hallazgos anteriores.
**Output:** acciones P0/P1 priorizadas.
**On failure:** reporte abreviado.

## Diagrama de Flujo
`Structure -> Code Scan -> Docs -> Skills -> Workflows -> Report`

## Manejo de Errores
| Error | Acción |
|-------|--------|
| comando de auditoría falla | fallback + continuar |
| hallazgo crítico | priorizar en P0 |

## Resultado Esperado
Visión 360° del estado real y plan accionable de corrección con evidencia.
