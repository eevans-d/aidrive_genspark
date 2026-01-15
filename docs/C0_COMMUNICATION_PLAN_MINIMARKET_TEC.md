# C0_COMMUNICATION_PLAN_MINIMARKET_TEC

**Fecha:** 2026-01-15  
**Dominio:** TEC  
**Nivel:** Intermedio  
**Estado:** Draft

## Objetivo
Definir canales y cadencias para coordinación técnica y de negocio durante la ejecución del roadmap (rolling 90 días).

## Canales
- Primario: GitHub Issues/PR (decisiones, tracking, ADRs).
- Secundario: Chat interno (sin decisiones finales).
- Documentación: carpeta docs/ (fuente de verdad), actualizada por PR.

## Cadencias
| Evento | Frecuencia | Participantes | Contenido |
|--------|------------|---------------|-----------|
| Checkpoint semanal | 1/semana | Backend, QA, Frontend, DBA | Estado WS, bloqueos, riesgos nuevos |
| Gate Hito A/B/C | Al completar hito | Leads + QA + DBA | Evidencia de criterios, decisión de avance |
| Revisión ADRs | Continua (asíncrona) | Owners técnicos | Aprobación de cambios de arquitectura/tooling |
| Post-incident | Ad-hoc | Equipo afectado | Mini-RCA, acciones inmediatas |

## Reglas
- Toda decisión técnica se registra en docs/DECISION_LOG.md y, si aplica, ADR dedicado.
- Cambios en scope se reflejan en docs/ROADMAP.md y docs/PLAN_WS_DETALLADO.md.
- Evidencia de cumplimiento de WS/hitos en docs/CHECKLIST_CIERRE.md.

## Escalación
- Bloqueo >2 días en P0/P1: escalar a leads (Backend/QA/DBA) en el checkpoint siguiente o de inmediato por chat + issue.
- Riesgos de seguridad o datos: etiquetar como P0 y abrir issue dedicado.
