# C0_STAKEHOLDERS_MINIMARKET_TEC

**Fecha:** 2026-01-15  
**Dominio:** TEC  
**Nivel:** Intermedio  
**Estado:** Draft

## Roles del proyecto
| Rol | Responsabilidades | Decisiones clave | Disponibilidad | Canal |
|-----|-------------------|------------------|----------------|-------|
| Backend/DevOps | Edge Functions, CI/CD, observabilidad, hardening | ADRs técnicos, releases | Según sprints | GitHub Issues/PR, chat |
| Ops | Ambientes, credenciales, ventanas de mantenimiento | Gating CI, despliegues y rollback | Bajo demanda | GitHub Issues/PR |
| QA | Estrategia de testing, runners, fixtures | Aceptación de suites y cobertura | Parcial | GitHub Issues/PR |
| Frontend | UI/UX, data layer, paginación, movimientos atómicos | Cambios de UI y caching | Según sprints | GitHub Issues/PR |
| DBA | Migraciones, RLS, rollback, auditorías | Cambios de schema y políticas | Bajo demanda (ventanas) | GitHub Issues/PR |
| Arquitectura | Actualización de arquitectura referencial | Alineación de límites y patrones | Parcial | GitHub Issues/PR |
| Seguridad | Auditoría RLS, CORS, roles | Aprobación de hardening | Bajo demanda | GitHub Issues/PR |
| PM/Docs | Roadmap, plan WS, documentación de cierre | Priorización y estado documental | Parcial | GitHub Issues/PR |

## Roles de negocio/app
| Rol app | Alcance | Riesgo | Notas |
|---------|---------|--------|-------|
| Admin | Operaciones completas | Alto | Verificar RLS y JWT claims |
| Supervisor | Gestión stock/reportes | Medio | Roles deben venir de tabla/claims, no metadata |
| Empleado | Operaciones básicas | Bajo | Restricciones por RLS |
| Anon | Lectura mínima o nula | Bajo | CORS/Rate limit aplican |

## Participación y cadencia
- Cadencia técnica sugerida: checkpoint semanal breve + checkpoint de hito (A/B/C) alineado a ROADMAP.
- Revisión de ADRs: asíncrona vía PR; aprobación por rol responsable.
- Incidentes: seguir plan en C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md (cuando se active).
