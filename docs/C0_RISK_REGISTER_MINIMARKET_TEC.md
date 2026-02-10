# C0 - Risk Register (Mini Market System)

**Fecha:** 2026-02-10  
**Estado:** Vigente (revisar al cerrar un release o cambiar infraestructura)

> Objetivo: tener un registro mínimo, accionable y trazable de riesgos técnicos/operativos.

## Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación | Estado | Evidencia/Notas |
|----|--------|:-----:|:-------:|------------|--------|-----------------|
| R-001 | Desincronización de stock por fallos de idempotencia/concurrencia | M | A | Mantener idempotencia en `/reservas` + tests de concurrencia | Mitigado | Ver `docs/ESTADO_ACTUAL.md` (migración `20260209000000`) |
| R-002 | Credenciales/secrets desalineados entre envs | M | A | `EnvAuditOps` + rotación controlada + no exponer valores | En progreso | `docs/SECRET_ROTATION_PLAN.md` |
| R-003 | Observabilidad incompleta (errores sin trazabilidad) | M | M | Integrar Sentry cuando haya DSN real + runbook | Bloqueado | `docs/SENTRY_INTEGRATION_PLAN.md` |
| R-004 | `verify_jwt=false` en `api-minimarket` (tradeoff seguridad/usabilidad) | M | A | Compensar con validación app + roles + hardening; documentar y revisar antes de PROD | Aceptado (temporal) | Guardrail en `AGENTS.md` (raíz) y `docs/ESTADO_ACTUAL.md` |
| R-005 | Dependencias con major bumps pendientes (React 19, RRv7, etc.) | A | M | Plan de migración dedicada + pruebas | Diferido | `docs/ESTADO_ACTUAL.md` |
| R-006 | Docs desincronizadas (decisiones o archivos referenciados inexistentes) | A | M | DocuGuard + checks automáticos (refs/links) | En progreso | Este esfuerzo (2026-02-10) |

## Criterio de escalamiento

- Impacto **Alto** (A): bloquea operación o expone datos.
- Si aparece un riesgo nuevo A: registrar en `docs/DECISION_LOG.md` y actualizar `docs/ESTADO_ACTUAL.md`.

