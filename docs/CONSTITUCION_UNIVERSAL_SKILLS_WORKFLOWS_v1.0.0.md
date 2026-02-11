# CONSTITUCION UNIVERSAL DE SKILLS Y WORKFLOWS AGENTICOS

Version: 1.0.0  
Estado: ACTIVA  
Fecha: 2026-02-11

## Preambulo

Esta constitucion define reglas obligatorias para cualquier sistema agentico de este repositorio, presente o futuro. Aplica a skills, workflows, scripts de orquestacion y documentacion operativa.

## Titulo I: Definiciones

- Skill: unidad atomica de capacidad con entrada, salida y criterios de calidad.
- Workflow: pipeline secuencial que orquesta skills y acciones.
- Trigger: condicion que dispara ejecucion automatica o manual.
- Chain: relacion de dependencia entre skills/workflows.
- Orchestrator: mapa de activacion y prioridades de skills.
- Router: mapa de activacion y prioridades de workflows.
- Quality Gate: validacion binaria PASS/FAIL.
- Guardrail: restriccion inviolable.
- Fallback: accion de respaldo ante fallo.
- Stop Condition: limite duro para evitar loops o daño.

## Titulo II: Principios Fundamentales

1. Autonomia: ejecucion automatica cuando el trigger se cumple.
2. Verificabilidad: toda afirmacion debe trazarse a evidencia real.
3. Idempotencia: re-ejecutar no debe romper estado.
4. Resiliencia: un fallo parcial no debe colapsar todo el sistema.
5. Trazabilidad: todo cambio debe dejar evidencia.
6. Minimalismo: eliminar complejidad innecesaria.

## Titulo III: Estructura Minima Obligatoria

- `CLAUDE.md`
- `.agent/skills/ORCHESTRATOR.md`
- `.agent/workflows/ROUTER.md`
- `.agent/workflows/session-start.md`
- `.agent/workflows/session-end.md`
- `docs/ESTADO_ACTUAL.md`

## Titulo IV: Anatomia Obligatoria de un Skill

Todo skill debe incluir frontmatter con:

```yaml
name: NombreDelSkill
description: >
  Que hace el skill y cuando usarlo
role: CODEX|EXECUTOR|CODEX->EXECUTOR
version: X.Y.Z
impact: LOW|MEDIUM|HIGH|CRITICAL
triggers:
  automatic:
    - condicion_detectable
  manual:
    - keyword
chain:
  receives_from: []
  sends_to: []
  required_before: []
priority: 1-10
```

Ademas debe incluir estas secciones:
- Guardrails (minimo 2)
- Activacion (activar cuando / no activar cuando)
- Protocolo de ejecucion por fases
- Quality Gates binarios
- Stop Conditions (anti-loop)

Guardrails universales obligatorios en todo skill:
1. NO exponer secretos, JWTs o tokens (solo nombres).
2. NO ejecutar operaciones destructivas de git o base de datos.

## Titulo V: Anatomia Obligatoria de un Workflow

Todo workflow debe incluir frontmatter con:

```yaml
name: workflow-name
description: >
  Que hace el workflow
version: X.Y.Z
trigger:
  automatic:
    - condicion_detectable
  manual:
    - keyword
  schedule:
    - frecuencia_opcional
priority: 1-10
timeout: minutos
```

Ademas debe incluir:
- Cuando se ejecuta
- Pipeline por steps secuenciales
- Manejo de errores por step
- Resultado esperado verificable

## Titulo VI: Reglas de Encadenamiento

1. Ningun skill ni workflow puede quedar huerfano sin trigger o referencia.
2. `session-end` es obligatorio y no puede omitirse.
3. Si hay conflicto de prioridades, ejecutar primero mayor prioridad.
4. Si un flujo falla, aplicar fallback y dejar evidencia.

## Titulo VII: Quality Gates Universales

| Gate | PASS | FAIL |
|------|------|------|
| Metadata | campos obligatorios presentes | falta al menos 1 campo obligatorio |
| Trazabilidad | evidencia y rutas reales | afirmaciones sin evidencia |
| Guardrails | no hay violaciones | se detecta violacion |
| Encadenamiento | rutas de activacion claras | skill/workflow huerfano |

## Titulo VIII: Stop Conditions Universales

- Maximo 3 reintentos por error reproducible.
- Maximo 2 ciclos de auto-fix por misma causa.
- Si persiste error critico, documentar BLOCKED y detener fase.
- Nunca esperar input humano para impacto bajo/medio.

## Titulo IX: Jerarquia Normativa

1. Guardrails del sistema (AGENTS.md + politicas de seguridad)
2. Esta Constitucion Universal
3. Router/Orchestrator canonicos
4. Skill/workflow especifico

Si hay conflicto, se aplica la norma de mayor jerarquia.

## Titulo X: Cumplimiento y Auditoria

- Toda sesion debe cerrar con evidencia en `docs/`.
- Toda actualizacion del sistema agentico debe reflejarse en `docs/ESTADO_ACTUAL.md`.
- Cambios estructurales deben referenciarse en `CLAUDE.md`.
- Incumplimientos criticos deben registrarse como P0.

## Anexo A: Check Rapido de Cumplimiento

1. Existe `ORCHESTRATOR.md` y `ROUTER.md`.
2. Skills/workflows tienen metadata minima.
3. CLAUDE.md referencia skills y workflows.
4. Session-start/session-end operativos.
5. No hay huérfanos sin trigger/referencia.

