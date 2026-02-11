---
name: workflow-router
description: >
  Router canónico de workflows. Resuelve activación automática/manual, prioridades
  y reglas de conflicto entre flujos.
version: 1.0.0
trigger:
  automatic:
    - en cada interacción del agente
    - cuando cambia el tipo de evento (inicio, code-change, error, cierre)
  manual:
    - abrir router
    - revisar workflows
  schedule: []
priority: 1
timeout: 5
---

# Workflow Router (Canónico)

**Canonical ID:** `workflow-router`  
**Skill counterpart:** `skills-orchestrator` en `.agent/skills/ORCHESTRATOR.md`

## Lógica de Activación

El agente debe evaluar estos triggers en cada interacción.

### Triggers Automáticos

| Condición Detectada | Workflow |
|--------------------|----------|
| Inicio de sesión / primera interacción | `session-start` |
| Se modificó o creó código | `code-change` |
| Falló un comando o test/build | `error-recovery` |
| El agente va a cerrar respuesta final | `session-end` |
| `docs/ESTADO_ACTUAL.md` stale (>14 días) | `full-audit` |

### Triggers Manuales

| Keyword usuario | Workflow |
|----------------|----------|
| auditoría, audit, revisar todo | `full-audit` |
| inicio, start, nueva sesión | `session-start` |
| cierre, fin, terminar | `session-end` |
| error, falla, no funciona | `error-recovery` |
| feature, nueva funcionalidad | `feature-development` |
| pre release, release check | `pre-release-audit` |
| hardening, go live | `production-hardening` |
| test before deploy, validar deploy | `test-before-deploy` |
| auditoria de codigo profunda | `audit-codebase` |
| flujo de sesion completo | `session-workflow` |

### Reglas de Conflicto

1. No ejecutar workflows de forma simultánea.
2. Si llega trigger nuevo durante ejecución:
   - mayor prioridad: pausar actual, ejecutar nuevo, reanudar;
   - menor prioridad: encolar.
3. `session-end` es obligatorio antes de terminar sesión.

### Prioridades

1. `error-recovery`
2. `code-change`
3. `session-start`
4. `session-end`
5. `full-audit`

### Integración con Skills

- Cada workflow invoca skills desde `.agent/skills/`.
- Si un skill requerido no existe: registrar `[SKILL_PENDIENTE:<nombre>]` y continuar con fallback.

### Workflows Legacy Controlados

Estos workflows siguen vigentes como rutas especializadas y no deben considerarse huérfanos:
- `session-workflow`
- `test-before-deploy`
- `feature-development`
- `audit-codebase`
- `pre-release-audit`
- `production-hardening`
