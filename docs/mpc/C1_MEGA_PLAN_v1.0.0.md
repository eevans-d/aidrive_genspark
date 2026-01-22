# C1 — Mega Plan (MPC v2.0)

**Proyecto:** Mini Market System
**Fecha:** 2026-01-22
**Versión:** 1.0.0
**Estado:** Borrador ejecutable

---

## 1) Arquitectura multinivel (grafo de dependencias)

```mermaid
graph TD
  A[Frontend React/Vite] -->|Reads (actual)| D[(Supabase DB)]
  A -->|Writes (esperado)| G[API Gateway api-minimarket]
  A -->|Auth| S[Supabase Auth]
  G --> D[(Supabase DB)]
  P[API Proveedor] --> D
  S1[Scraper Maxiconsumo] --> D
  C1[Cron Jobs Maxiconsumo] --> D
  C2[Cron Auxiliares] --> D
  G --> L[Logger/_shared]
  P --> L
  S1 --> L
  C1 --> L
```

---

## 2) Etapas (E) y Fases (F)

### E1 — Observabilidad & Logging (P0)
- **F1.1** Adopción total de `_shared/logger` en handlers críticos.
- **F1.2** Persistencia de ejecución en `cron_jobs_execution_log`.
- **F1.3** Métricas mínimas por job/handler.

### E2 — Testing & QA (P0/P1)
- **F2.1** Runner integración documentado (Vitest configs).
- **F2.2** Smoke tests E2E mínimos (status, precios, alertas).
- **F2.3** Evidencia en `test-reports/`.
- **F2.4** Performance baseline (tests/performance) con evidencia.

### E3 — DB & Migraciones (P0)
- **F3.1** Validación de migraciones en staging/prod.
- **F3.2** Rollback documentado.

### E4 — Seguridad Operacional (P1)
- **F4.1** Auditoría RLS (script + evidencia).
- **F4.2** CORS restringido por env.
- **F4.3** Gateway sin service role en lecturas normales.
- **F4.4** Verificación roles server-side.

### E5 — Frontend Calidad (P1)
- **F5.1** Error boundaries/fallbacks.
- **F5.2** Paginación + columnas mínimas.
- **F5.3** Performance y UX críticos.

### E6 — CI/CD & Release (P1)
- **F6.1** Integración de pruebas en pipeline con guards.
- **F6.2** Validación de envs requeridas.

### E7 — Documentación & Gobernanza (P0)
- **F7.1** Arquitectura alineada a estado real.
- **F7.2** Handoff y fuentes de verdad.
- **F7.3** Reporte final de análisis.

### E8 — Cron & Automatizaciones (P1)
- **F8.1** Validación runtime de alertas/comparaciones.
- **F8.2** Consistencia en uso de `_shared` en cron auxiliares.

---

## 3) Matriz RAID (Riesgos, Supuestos, Issues, Dependencias)

| Tipo | ID | Descripción | Impacto | Prob. | Mitigación | Owner |
|---|---|---|---|---|---|---|
| Riesgo | R-01 | Credenciales staging/prod ausentes | Alto | Alto | Acordar ventana y responsables | PO/Ops |
| Issue | I-03 | Frontend lee directo de Supabase (confirmado) | Alto | Alto | Plan de migración de lecturas al gateway | Tech Lead |
| Riesgo | R-03 | RLS incompleto en tablas críticas | Alto | Medio | Ejecutar auditoría + evidencias | Security |
| Supuesto | S-01 | Roadmap vigente es fuente de verdad | Medio | Medio | Validar con PO | PO |
| Supuesto | S-02 | Vitest es runner estándar | Bajo | Bajo | Mantener configs actuales | QA |
| Issue | I-01 | Logging parcial en cron auxiliares | Alto | Alto | WS1.1/WS4.2 | Backend |
| Issue | I-02 | E2E real bloqueado por credenciales | Alto | Alto | WS2.2 cuando haya acceso | QA/Ops |
| Dependencia | D-01 | `SUPABASE_URL/ANON/ROLE` disponibles | Alto | Medio | Check env y runbook | Ops |
| Dependencia | D-02 | `ALLOWED_ORIGINS` definido | Medio | Medio | Configurar en env | Ops |

---

## 4) Criterios SMART (verificables)

### Funcionales
- **FR-SMART-1:** En 2 semanas, endpoints críticos (`status`, `precios`, `alertas`) pasan smoke tests E2E con evidencia en `test-reports/` (✓/✗), condicionado a credenciales válidas.

### Calidad
- **NFR-SMART-1:** 0 `console.log` en handlers críticos; logs estructurados incluyen `requestId` o `runId` y cobertura en cron auxiliares (✓/✗).

### Seguridad
- **SEC-SMART-1:** Auditoría RLS ejecutada y reporte guardado en docs/evidencias con tablas críticas marcadas (✓/✗).

### Operación
- **OPS-SMART-1:** Procedimiento de rollback documentado y probado en staging (✓/✗).

---

## 5) Priorización (valor vs esfuerzo)

| Item | Valor | Esfuerzo | Prioridad |
|---|---:|---:|---|
| E1 Observabilidad | 5 | 2 | P0 |
| E2 Testing/QA | 5 | 3 | P0 |
| E3 DB & Migraciones | 5 | 3 | P0 |
| E4 Seguridad | 4 | 2 | P1 |
| E5 Frontend | 3 | 2 | P1 |
| E6 CI/CD | 3 | 2 | P1 |
| E7 Documentación | 4 | 1 | P0 |
| E8 Cron & Automatizaciones | 3 | 2 | P1 |

---

## 6) Orden de ejecución

**Modelo híbrido:**
- **Secuencial crítico:** E1 → E2 → E3
- **Paralelo condicionado:** E7 y E8 pueden avanzar en paralelo desde el inicio.
- **Dependiente de credenciales:** E3 y E2.2 quedan bloqueadas sin acceso.

---

## 7) Plan de comunicación

- **Cadencia:** Daily async + checkpoint semanal.
- **Canales:** Issues en repo + docs/evidencias.
- **Formato:** Actualizar `docs/ROADMAP.md` + `docs/CHECKLIST_CIERRE.md` con evidencia.
- **Decisiones:** registrar en `docs/DECISION_LOG.md`.
