# C0 - Communication Plan (Mini Market System)

**Fecha:** 2026-02-10  
**Estado:** Vigente

## Objetivo

Mantener trazabilidad de decisiones y cambios, y reducir fricción operativa durante desarrollo, deploy y soporte.

## Canales

- **Decisiones técnicas:** `docs/DECISION_LOG.md`
- **Estado consolidado:** `docs/ESTADO_ACTUAL.md`
- **Plan vigente:** `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`
- **Incidentes:** `docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md` + registro en `docs/closure/` cuando aplique
- **PRs:** GitHub Pull Requests (requerir CI verde)

## Cadencia

| Evento | Qué se actualiza | Responsable |
|--------|-------------------|-------------|
| Merge a `main` | `docs/ESTADO_ACTUAL.md` (si impacta operación) | Autor del cambio |
| Cambio de arquitectura/guardrail | `docs/DECISION_LOG.md` | Autor del cambio |
| Release/deploy | Evidencia en `docs/closure/` + verificación de health | Owner/SRE |
| Incidente P0/P1 | Registro + postmortem (si aplica) | Owner/SRE |

## Reglas

1. No exponer secretos (solo nombres).
2. Si un documento referencia un archivo, el archivo debe existir o la referencia se elimina.
3. Si hay discrepancia de métricas, la fuente única es `docs/METRICS.md` (generado).

