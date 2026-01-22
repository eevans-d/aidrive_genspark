# C2 — Subplan E7 Documentación & Gobernanza (MPC v2.0)

**Etapa:** E7
**Fecha:** 2026-01-22
**Versión:** 1.0.0

---

## 1) Alcance

- **WS8.1** Actualizar arquitectura a estado real.
- **WS8.2** Handoff y fuentes de verdad.
- **WS8.3** Reporte final de análisis.
- **WS8.4** Backlog priorizado.

---

## 2) Referencias exactas (archivo:líneas)

- Arquitectura:
  - `docs/ARCHITECTURE_DOCUMENTATION.md:1-240`
- Roadmap vigente:
  - `docs/ROADMAP.md:1-200`
- Estado actual:
  - `docs/ESTADO_ACTUAL.md:1-120`
- Backlog:
  - `docs/BACKLOG_PRIORIZADO.md:1-200`
- CI y DoD:
  - `.github/workflows/ci.yml`
  - `docs/CHECKLIST_CIERRE.md`
- Instrucciones Copilot:
  - `.github/copilot-instructions.md`

---

## 3) Subtareas (estimación en horas)

| ID | Tarea | Estimación | Entregable |
|---|---|---:|---|
| E7-T1 | Revisar y alinear arquitectura con estado real | 3h | Secciones corregidas |
| E7-T2 | Verificar fuentes de verdad en README | 2h | README actualizado |
| E7-T3 | Consolidar reporte de análisis | 2h | `docs/REPORTE_ANALISIS_PROYECTO.md` |
| E7-T4 | Validar backlog priorizado | 1h | `docs/BACKLOG_PRIORIZADO.md` |

---

## 4) Variables de entorno críticas

- N/A (documentación).

---

## 5) Plan de testing

- Validación por checklist (DoD) y revisión de coherencia.

---

## 6) Plan de rollback

1. Revertir cambios de documentación si contradicen fuentes de verdad.
2. Mantener historial en `docs/DECISION_LOG.md`.

---

## 7) Checklist pre-implementación

- [ ] Confirmar fuentes de verdad (roadmap, estado actual, checklist cierre).
- [ ] Validar que no existan docs duplicadas.

## 8) Checklist post-implementación

- [ ] Arquitectura alineada al estado real.
- [ ] README con fuentes de verdad actualizadas.
- [ ] Backlog priorizado consistente.
