# ROADMAP VIGENTE (Rolling 90 días)

**Última actualización:** 2026-01-09  
**Estado:** vigente  
**Fuente de verdad:** este documento + `docs/DECISION_LOG.md` + `docs/CHECKLIST_CIERRE.md`

---

## Objetivo del roadmap
Definir un plan de ejecución **claro, medible y sin ambigüedades** para estabilizar, operar y evolucionar el sistema en los próximos 90 días, con foco en calidad, observabilidad y confiabilidad.

## Cómo usar este documento
- Si una tarea no está aquí, **no está planificada**.
- Cada item incluye **criterio de aceptación**, **dependencias** y **prioridad**.
- Al cerrar un item, actualizar `docs/CHECKLIST_CIERRE.md` y dejar evidencia (test, log, captura o link).
- Para detalle operativo por tarea, ver `docs/PLAN_WS_DETALLADO.md`.

## Workstreams (por módulos/subsistemas)

### WS1 — Observabilidad y Logging (P0)
**Objetivo:** logging estructurado y trazabilidad mínima en funciones críticas.

- **WS1.1 Adoptar `_shared/logger` en handlers críticos**  
  **Scope:** `api-proveedor`, `scraper-maxiconsumo`, `cron-jobs-maxiconsumo`  
  **Aceptación:** 0 `console.log` en handlers críticos; logs con `requestId|jobId|runId`.  
  **Dependencias:** `_shared/logger.ts`, convención de IDs definida (ver D-005).

- **WS1.2 Persistencia de ejecución de cron**  
  **Scope:** `cron_jobs_execution_log`  
  **Aceptación:** payload validado runtime y coincide con schema; errores registran `status=failed`.  
  **Dependencias:** migraciones actuales + validación runtime.

- **WS1.3 Métricas básicas por job/handler**  
  **Aceptación:** duración, cantidad de items, errores y alertas registradas.  
  **Dependencias:** WS1.1, WS1.2.

### WS2 — Testing & QA (P0/P1)
**Objetivo:** tests ejecutables más allá de unitarios, sin runners ambiguos.

- **WS2.1 Runner de integración definido y documentado**  
  **Aceptación:** comando único y reproducible en CI/local; checklist con prerequisitos.  
  **Dependencias:** decisión D-004 en `docs/DECISION_LOG.md`.

- **WS2.2 Smoke tests E2E mínimos**  
  **Scope:** endpoints `status`, `precios`, `alertas` + cron básico.  
  **Aceptación:** tests pasan en Supabase local; falla clara si falta env.  
  **Dependencias:** WS2.1.

- **WS2.3 Performance baseline**  
  **Aceptación:** benchmark mínimo y valores base registrados.  
  **Dependencias:** dataset/fixture definido.

### WS3 — Base de Datos y Migraciones (P0)
**Objetivo:** migraciones validadas en entornos reales y rollback claro.

- **WS3.1 Verificar migraciones en staging/prod**  
  **Aceptación:** checklist de ejecución con evidencia por entorno.  
  **Dependencias:** acceso a entorno y credenciales.

- **WS3.2 Procedimiento de rollback documentado**  
  **Aceptación:** pasos reproducibles en `docs/DEPLOYMENT_GUIDE.md`.  
  **Dependencias:** WS3.1.

### WS4 — Cron & Automatizaciones (P1)
**Objetivo:** cron jobs consistentes y observables.

- **WS4.1 Validación runtime de alertas/comparaciones**  
  **Aceptación:** validadores activos; errores quedan registrados.  
  **Dependencias:** WS1.1.

- **WS4.2 Consistencia en uso de `_shared`**  
  **Scope:** cron auxiliares (`cron-notifications`, `cron-dashboard`, `cron-health-monitor`).  
  **Aceptación:** logging y response unificados.

### WS5 — Frontend (P1)
**Objetivo:** calidad de build y rendimiento básico.

- **WS5.1 Reducir warning de chunk >500 kB**  
  **Aceptación:** chunk principal <500 kB o justificado en docs.  
  **Dependencias:** análisis de rutas y módulos.

- **WS5.2 Error boundaries y fallback UI**  
  **Aceptación:** cobertura en rutas críticas; fallback visible.

### WS6 — CI/CD y Release (P1)
**Objetivo:** pipeline confiable y reproducible.

- **WS6.1 Integrar pruebas de integración al pipeline**  
  **Aceptación:** job separado con gating; se ejecuta solo con env válidas.  
  **Dependencias:** WS2.1.

- **WS6.2 Validación de secrets y envs**  
  **Aceptación:** checks de env requeridas antes de build/deploy.

### WS7 — Seguridad (P1)
**Objetivo:** seguridad mínima documentada y ejecutable.

- **WS7.1 Auditoría RLS**  
  **Aceptación:** reporte con tablas críticas y políticas activas.  
  **Dependencias:** WS3.1.

- **WS7.2 Escaneo de dependencias**  
  **Aceptación:** `npm audit` y Snyk (si token) en CI con umbral definido.

### WS8 — Documentación & Gobernanza (P0)
**Objetivo:** documentación alineada y sin contradicciones.

- **WS8.1 Actualizar arquitectura a estado real**  
  **Aceptación:** `docs/ARCHITECTURE_DOCUMENTATION.md` refleja stack y límites reales.  
  **Dependencias:** WS1/WS2/WS3.

- **WS8.2 Handoff y fuentes de verdad**  
  **Aceptación:** `docs/DECISION_LOG.md` y `docs/ROADMAP.md` referenciados en README y `.github/copilot-instructions.md`.

---

## Hitos (gates)

### Hito A (0–2 semanas)
- WS1.1, WS2.1, WS3.1 completados.
- Evidencia registrada en `docs/CHECKLIST_CIERRE.md`.

### Hito B (3–6 semanas)
- WS1.2, WS2.2, WS4.1 completados.
- Pipeline ajustado (WS6.1).

### Hito C (7–12 semanas)
- WS5.1, WS7.1, WS8.1 completados.
- Cierre de pendientes críticos en `docs/CHECKLIST_CIERRE.md`.

---

## Definition of Done (DoD)
- Tests relevantes pasan.
- Documentación actualizada y coherente.
- Evidencia de verificación (logs, reportes o checklist).
- Sin cambios pendientes en `git status`.

## Control de cambios
1. Actualizar `docs/ROADMAP.md`.
2. Actualizar `docs/PLAN_WS_DETALLADO.md` si cambian tareas operativas.
3. Registrar decisión en `docs/DECISION_LOG.md` si aplica.
4. Reflejar estado en `docs/CHECKLIST_CIERRE.md`.
