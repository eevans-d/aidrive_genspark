---
name: skills-orchestrator
description: >
  Orquestador canónico de skills. Define orden de activación por evento,
  dependencias y política de autonomía.
version: 1.0.0
trigger:
  automatic:
    - inicio de sesión del agente
    - cambio de contexto de ejecución (código, error, deploy, cierre)
  manual:
    - abrir orquestador
    - revisar skills
  schedule: []
priority: 1
---

# Skills Orchestrator (Canónico)

**Canonical ID:** `skills-orchestrator`  
**Workflow counterpart:** `workflow-router` en `.agent/workflows/ROUTER.md`

## Orden de Ejecución por Evento

### Al inicio de sesión
1. `SessionOps` — bootstrap de sesión, baseline y contexto operativo.
2. `BaselineOps` — captura estado git/supabase sin secretos.
3. `ExtractionOps` — inventario técnico y evidencia para planificación.
4. `MegaPlanner` — consolidación de prioridades y plan ejecutable.

### Cuando se modifica código
1. `CodeCraft` — implementación principal.
2. `TestMaster` — verificación de calidad y regresiones.
3. `MigrationOps` — solo si hay cambios SQL/schema.
4. `DocuGuard` — sincronización documental obligatoria.

### Cuando se detecta error
1. `DebugHound` — diagnóstico y fix con evidencia.
2. `TestMaster` — confirmación de fix.
3. `DocuGuard` — actualización de estado/evidencia.

### Antes de despliegue
1. `ProductionGate` — ejecución de gates consolidados.
2. `SecurityAudit` — validación de riesgos activos.
3. `DeployOps` — preflight, dry-run y deploy seguro.
4. `RealityCheck` — smoke funcional post-deploy.
5. `DocuGuard` — cierre documental.

### Al final de sesión
1. `SessionOps` — cierre y archivado de sesión.
2. `DocuGuard` — actualización final de `docs/ESTADO_ACTUAL.md`.

## Grafo de Dependencias (texto)

- `SessionOps -> ExtractionOps -> MegaPlanner -> DocuGuard`
- `CodeCraft -> TestMaster -> DocuGuard`
- `CodeCraft -> MigrationOps -> DocuGuard`
- `DebugHound -> TestMaster -> DocuGuard`
- `DeployOps -> RealityCheck -> DocuGuard`
- `SentryOps -> TestMaster -> PerformanceWatch -> DocuGuard`

## Skills que no deben quedar huérfanos

Todos los skills en `.agent/skills/*` deben aparecer en al menos uno de estos mecanismos:
- `project_config.yaml` en `skill_orchestrator.trigger_patterns`
- `project_config.yaml` en `skill_graph.chains`/`dependencies`
- este orquestador por evento

## Política de autonomía

> [!IMPORTANT]
> **REGLA OBLIGATORIA:** Si el trigger se cumple, el skill se ejecuta automáticamente.
> El agente NO DEBE esperar invocación manual del usuario. La evaluación de triggers
> es continua y automática en cada interacción.

- Código modificado → `CodeCraft` + `TestMaster` + `DocuGuard` (obligatorio).
- Error detectado → `DebugHound` + `TestMaster` + `DocuGuard`.
- Si un skill falla y tiene fallback definido, ejecutar fallback y continuar.
- Si no hay trigger válido, no ejecutar skills innecesariamente.
