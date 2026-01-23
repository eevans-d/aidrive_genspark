# ROADMAP VIGENTE (Rolling 90 días)

**Última actualización:** 2026-01-23  
**Estado:** vigente  
**Fuente de verdad:** este documento + `docs/DECISION_LOG.md` + `docs/ESTADO_ACTUAL.md` + `docs/CHECKLIST_CIERRE.md`  
**Plan pendientes:** ver `docs/PLAN_PENDIENTES_DEFINITIVO.md`

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

- **WS2.2 Smoke tests E2E mínimos** ⏳ **DESBLOQUEADO 2026-01-23**  
  **Scope:** endpoints `status`, `precios`, `alertas` + cron básico.  
  **Aceptación:** tests pasan con Supabase real; falla clara si falta env.  
  **Dependencias:** WS2.1 ✅.  
  **Plan:** ver `docs/PLAN_PENDIENTES_DEFINITIVO.md` Paso 3.

- **WS2.3 Performance baseline** ✅ **COMPLETADO 2026-01-19**  
  **Aceptación:** benchmark mínimo y valores base registrados.  
  **Evidencia:** `tests/performance/load-testing.vitest.test.ts` - 5 tests passing, avg 24.7ms, 40k productos en 116ms.  
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

- **WS5.0 Fix warnings de lint (useEffect deps)** ✅ **COMPLETADO 2026-01-12** (ESLint 0 warnings)

- **WS5.1 Reducir warning de chunk >500 kB** ✅ **COMPLETADO 2026-01-12**  
  **Evidencia:** `pnpm build` sin warning de chunk; code splitting aplicado.  
  **Dependencias:** ninguna.

- **WS5.2 Error boundaries y fallback UI**  
  **Aceptación:** cobertura en rutas críticas; fallback visible.

- **WS5.3 Fix conteo de productos en Dashboard (P0)**  
  **Aceptación:** usa `count` real de Supabase; no depende de `data.length`.  
  **Dependencias:** ninguna.

- **WS5.4 Movimiento de depósito atómico (P0)**  
  **Aceptación:** stock + movimiento se actualizan en una sola operación (RPC); no permite salidas sin stock.  
  **Dependencias:** RPC `sp_movimiento_inventario`.

- **WS5.5 Paginación + select de columnas mínimas (P1)**  
  **Aceptación:** listas largas no cargan todo el dataset; payload reducido.
  **Dependencias:** queries ajustadas.

- **WS5.6 Capa de datos con caching (P1)** ✅ **COMPLETADO 2026-01-21**
  **Aceptación:** caching, reintentos y estados uniformes en pantallas críticas.
  **Evidencia:** React Query implementado con hooks: `useDashboardStats`, `useTareas`, `useStock`, etc. Tests con MSW pasando.
  **Dependencias:** decisión de librería (React Query/SWR).

### WS6 — CI/CD y Release (P1)
**Objetivo:** pipeline confiable y reproducible.

- **WS6.1 Integrar pruebas de integración en pipeline (gated)**  
  **Aceptación:** job separado con gating; se ejecuta solo con env válidas.  
  **Dependencias:** WS2.1.

- **WS6.2 Validación de envs requeridas**  
  **Aceptación:** checks de env requeridas antes de build/deploy.

- **WS6.3 E2E frontend en CI (manual)**  
  **Aceptación:** job manual `run_e2e_frontend=true` (o `vars.RUN_E2E_FRONTEND=true`) en CI ejecuta `pnpm test:e2e:frontend` con `VITE_USE_MOCKS=true`, sin requerir Supabase real; documentado en runbook.  
  Instrucciones locales: `cd minimarket-system && npx playwright install && pnpm test:e2e:frontend` (usa Playwright + mocks).

### WS7 — Seguridad (P1)
**Objetivo:** seguridad mínima documentada y ejecutable.

- **WS7.1 Auditoría RLS** ⏳ **DESBLOQUEADO 2026-01-23**  
  **Aceptación:** reporte con tablas críticas y políticas activas.  
  **Dependencias:** WS3.1 ✅.  
  **Plan:** ver `docs/PLAN_PENDIENTES_DEFINITIVO.md` Paso 1.

- **WS7.2 Escaneo de dependencias** ✅ **COMPLETADO 2026-01-23**  
  **Aceptación:** `npm audit` documentado en DECISION_LOG D-026.  
  **Evidencia:** Vulnerabilidades conocidas en deps dev (rollup, vite).

- **WS7.3 Gateway sin service role para queries normales (P0)**  
  **Aceptación:** queries usan JWT de usuario + anon key; service role sólo para tareas admin.  
  **Dependencias:** env `SUPABASE_ANON_KEY`.

- **WS7.4 CORS restringido por origen (P0)**  
  **Aceptación:** orígenes permitidos definidos por env; requests no autorizadas fallan.  
  **Dependencias:** `ALLOWED_ORIGINS`.

- **WS7.5 Roles server-side (P1)**  
  **Aceptación:** rol no se toma de `user_metadata`; se valida contra tabla/claims.  
  **Dependencias:** DB y auth.

### WS8 — Documentación & Gobernanza (P0)
**Objetivo:** documentación alineada y sin contradicciones.

- **WS8.1 Actualizar arquitectura a estado real**  
  **Aceptación:** `docs/ARCHITECTURE_DOCUMENTATION.md` refleja stack y límites reales.  
  **Dependencias:** WS1/WS2/WS3.

- **WS8.2 Handoff y fuentes de verdad**  
  **Aceptación:** `docs/DECISION_LOG.md` y `docs/ROADMAP.md` referenciados en README y `.github/copilot-instructions.md`.

- **WS8.3 Reporte final de análisis**  
  **Aceptación:** reporte consolidado en `docs/REPORTE_ANALISIS_PROYECTO.md`.  
  **Dependencias:** revisión final.

- **WS8.4 Backlog priorizado**  
  **Aceptación:** backlog con puntajes en `docs/BACKLOG_PRIORIZADO.md`.  
  **Dependencias:** WS8.3.

### WS9 — Evolución funcional (P2)
**Objetivo:** mejoras orientadas a operación y toma de decisiones.

- **WS9.1 Alertas proactivas de stock**  
  **Aceptación:** notificaciones automáticas cuando stock cae bajo umbral.

- **WS9.2 Reposición sugerida**  
  **Aceptación:** sugerencias basadas en stock mínimo y rotación.

- **WS9.3 Kardex e historial de movimientos**  
  **Aceptación:** vista filtrable y exportable por producto/lote/usuario.

- **WS9.4 Panel de rentabilidad**  
  **Aceptación:** margen real y rotación por producto visibles en UI.

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
