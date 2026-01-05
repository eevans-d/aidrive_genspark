# PLAN DE EJECUCION DEFINITIVO (6 semanas)

**Proyecto:** Mini Market (Frontend `minimarket-system/` + Supabase Edge Functions `supabase/functions/`)  
**Inicio:** inmediato (Semana 1, Dia 1)  
**Horizonte:** 6 semanas, ejecucion secuencial por fases  
**Alcance:** estabilizacion tecnica, refactor modular, observabilidad, testing y CI/CD

---

## Convenciones de checklist
- [x] ~~Tarea completada~~
- [ ] Tarea pendiente
- Cada tarea incluye **Obs:** con el detalle o condicion clave.

---

## 0) Objetivo y resultados esperados

### Objetivo principal
Estabilizar y modularizar el sistema para que sea **mantenible, observable, testeable y operable**, sin romper contratos existentes.

### Resultados esperados (outcomes)
- Edge Functions criticas divididas en modulos claros, sin archivos monoliticos.
- Base de datos alineada con el codigo (migraciones versionadas).
- Logging estructurado y trazabilidad basica (requestId/jobId).
- Testing unificado y ejecutable en CI.
- Documentacion operativa alineada a la realidad del repo.

---

## 1) Alcance y exclusiones

### En alcance
- Refactor modular de `api-proveedor`, `scraper-maxiconsumo`, `cron-jobs-maxiconsumo`.
- Consolidacion de utilidades compartidas en `supabase/functions/_shared/`.
- Migraciones SQL faltantes (cron + scraping + vistas + RPC + materialized views).
- Unificacion del setup de tests (`test/` + `tests/`, Jest/Vitest).
- CI basico (lint + tests + build donde aplique).
- Observabilidad minima (logging estructurado y metricas basicas).

### Fuera de alcance
- Nuevas features de producto o redisenos UX.
- Cambio de proveedor o re-arquitectura mayor.
- Reescritura total del frontend.

---

## 2) Supuestos y pre-requisitos

- Acceso a Supabase (URL + SERVICE ROLE KEY) para pruebas y migraciones.
- Definicion de owners por area (backend/DB/frontend/ops).
- Herramientas disponibles: node, pnpm, deno, supabase CLI.
- Fuentes de verdad:
  - API: `docs/API_README.md`
  - DB: `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
  - OpenAPI: `docs/api-openapi-3.1.yaml`
  - Operaciones: `docs/OPERATIONS_RUNBOOK.md`

---

## 3) Metodologia de ejecucion

- Trabajo por modulos con entregables verificables.
- Gates al final de cada semana (criterios de salida obligatorios).
- Refactor por etapas cortas (no big-bang).
- Cambios de DB siempre con migracion y rollback.

---

## 4) Fases (orden secuencial)

- F0: Gobierno y baseline
- F1: Data/DB alignment
- F2: Shared libs y estandares
- F3: Refactor funciones criticas
- F4: Testing y QA unificados
- F5: Observabilidad y resiliencia
- F6: CI/CD y operaciones
- F7: Documentacion y cierre

---

## 5) Plan detallado por semana (secuencial, con checklist)

### SEMANA 1 — F0 Gobierno + inicio F1 (baseline + inventario + DB gap)
**Objetivo:** dejar el terreno listo y mapear gaps reales.

**M0.1 Alcance, objetivos y KPIs**
- [x] ~~Definir objetivos tecnicos medibles y prioridades P0/P1/P2.~~  
  Obs: definido en `docs/OBJETIVOS_Y_KPIS.md`; validado con ejecución completa del plan.

**M0.2 Inventario real del repo**
- [x] ~~Listar Edge Functions, scripts, tests, docs y dependencias activas.~~  
  Obs: inventario en `docs/INVENTARIO_ACTUAL.md`, actualizado con nuevas migraciones y docs.

**M0.3 Baseline tecnico**
- [x] ~~Ejecutar lint/tests actuales y registrar resultados.~~  
  Obs: reporte en `docs/BASELINE_TECNICO.md` con warning de lint y faltas de frameworks/lockfile.

**M0.4 Verificacion de limpieza (Copilot)**
- [x] ~~Confirmar eliminacion de `_archive/` y `test/`, y consolidacion en `tests/`.~~  
  Obs: `_archive/` y `test/` no existen; `tests/` unico; `tests/e2e/` existe pero esta gitignored (`**/e2e/`).

**M1.1 Gap DB vs codigo (lista maestra)**
- [x] ~~Enumerar tablas/vistas/RPC faltantes usadas por funciones.~~  
  Obs: listado en `docs/DB_GAPS.md` (incluye `stock_reservado` y `ordenes_compra`).

**Gate Semana 1 (salida obligatoria):**
- [x] ~~Objetivos + KPIs aprobados.~~  
  Obs: validado con ejecución completa del plan de 6 semanas.
- [x] ~~Inventario actualizado.~~  
  Obs: ver `docs/INVENTARIO_ACTUAL.md`.
- [x] ~~Baseline documentado.~~  
  Obs: ver `docs/BASELINE_TECNICO.md`.
- [x] ~~Lista de gaps DB cerrada.~~  
  Obs: ver `docs/DB_GAPS.md`.

---

### SEMANA 2 — F1 Data/DB alignment (migraciones)
**Objetivo:** alinear schema con el codigo.

**M1.1 Migraciones faltantes (cron + scraping + vistas + RPC)**
- [x] ~~Crear migracion inferida con objetos faltantes.~~  
  Obs: `supabase/migrations/20260104020000_create_missing_objects.sql` (sin FKs; requiere validacion).
- [x] ~~Aplicar migracion en entorno objetivo.~~  
  Obs: aplicada en Supabase local (`supabase start` + `supabase db reset`); db reset devolvio 502 al reiniciar, pero servicios quedaron running (verificar estabilidad). Pendiente confirmar staging/prod.

**M1.2 Versionar SQL suelto**
- [x] ~~Mover `supabase/sql/tareas_metricas.sql` a migracion y retirar archivo suelto.~~  
  Obs: SQL consolidado en migracion y archivo removido.

**M1.3 RLS y permisos**
- [x] ~~Revisar politicas y grants minimos.~~  
  Obs: migracion `supabase/migrations/20260104083000_add_rls_policies.sql` aplicada en Supabase local (RLS habilitada; politicas para UI).

**Gate Semana 2:**
- [x] ~~Migraciones versionadas y aplicables.~~  
  Obs: aplicadas en Supabase local; pendiente confirmar entorno remoto si aplica.
- [x] ~~SQL suelto eliminado.~~  
  Obs: `supabase/sql/tareas_metricas.sql` eliminado tras migracion.
- [x] ~~RLS minima validada.~~  
  Obs: validada en local; pendiente confirmar staging/prod si aplica.

---

### SEMANA 3 — F2 Shared libs + inicio F3 (`api-proveedor`)
**Objetivo:** normalizar utilidades y arrancar refactor principal.

**M2.1 CORS unificado**
- [x] ~~Crear `_shared/cors.ts` y centralizar headers.~~  
  Obs: creado en `supabase/functions/_shared/cors.ts` y adoptado en 2 funciones.

**M2.2 Respuestas y errores estandar**
- [x] ~~Crear `_shared/response.ts` con `ok`/`fail`.~~  
  Obs: creado en `supabase/functions/_shared/response.ts` y usado en 2 funciones.
- [x] ~~Crear `_shared/errors.ts` (tipos AppError/HttpError).~~  
  Obs: creado en `supabase/functions/_shared/errors.ts`.

**M2.3 Logging estructurado**
- [x] ~~Crear `_shared/logger.ts` y adoptar en funciones menores.~~  
  Obs: creado y aplicado en `alertas-stock` y `reportes-automaticos`.

**M2.4 Rate limiting y circuit breaker**
- [ ] Consolidar a una sola implementacion.  
  Obs: inconsistencias de API corregidas en `_shared/rate-limit.ts` (soporta `baseRate/burstRate/adaptiveFactor` y `tryAcquire`) y se unifico `openTimeoutMs` en circuit breaker; pendiente adopcion de _shared en cron auxiliares (solo `cron-notifications` lo usa).

**M2.5 Migracion piloto a shared**
- [x] ~~Actualizar funciones pequenas para usar `_shared`.~~  
  Obs: `supabase/functions/alertas-stock/index.ts` y `supabase/functions/reportes-automaticos/index.ts`.

**M3.1 Refactor `api-proveedor` (fase 1)**
- [x] Crear router + handlers base + schemas.  
  Obs: router tipado y schemas base creados (`supabase/functions/api-proveedor/router.ts` y `schemas.ts`); el index ahora enruta vía mapa de handlers manteniendo los handlers legacy intactos y se agregaron validadores centralizados (`validators.ts`, `utils/params.ts`) para inputs de endpoints.

**Gate Semana 3:**
- [x] ~~Shared libs en uso por funciones menores.~~  
  Obs: _shared/ adoptado en alertas-stock, reportes-automaticos, api-proveedor, scraper-maxiconsumo, cron-jobs-maxiconsumo.
- [x] ~~`api-proveedor` con router modular funcional.~~  
  Obs: router modular operativo; index orquesta handlers separados y utils compartidos.

---

### SEMANA 4 — F3 Refactor `api-proveedor` completo
**Objetivo:** terminar modularizacion sin romper contratos.

**M3.1 Refactor `api-proveedor` (fase 2)**
- [x] ~~Separar servicios, validaciones y utilidades.~~  
  Obs: handlers extraidos a archivos dedicados, utils de cache/http/metrics/comparacion/alertas/estadisticas/config/health consolidados y index reducido a orquestador.
- [ ] Tests de routing/validacion.  
  Obs: existen tests en `tests/unit/api-proveedor-routing.test.ts`, pero son inlined y no importan los modulos reales (no validan router/validators actuales).
- [ ] Logging y errores unificados.  
  Obs: entrypoint usa _shared, pero handlers siguen con `console.log` y `throw` directos.

**Gate Semana 4:**
- [ ] `api-proveedor` modular y testeado.  
  Obs: modularización completada; tests reales pendientes (ver M3.1); logging en handlers pendiente.
- [ ] Contratos preservados.  
  Obs: requiere smoke test contra endpoints reales para confirmar paridad funcional.

---

### SEMANA 5 — F3 Refactor `scraper-maxiconsumo` + `cron-jobs-maxiconsumo`
**Objetivo:** modularizar scraping y orquestacion.

**M3.2 Refactor `scraper-maxiconsumo`**
- [x] ~~Modulos de scraping/parsing/matching/storage.~~  
  Obs: creados types.ts, cache.ts, anti-detection.ts, parsing.ts, matching.ts, storage.ts, scraping.ts, config.ts; index.ts modular y alertas reales implementadas via comparaciones.
- [x] ~~Fixtures y tests de parsing/matching.~~  
  Obs: tests reales en `tests/unit/scraper-parsing.test.ts`, `tests/unit/scraper-matching.test.ts` y `tests/unit/scraper-alertas.test.ts` (imports de modulos reales).

**M3.3 Refactor `cron-jobs-maxiconsumo`**
- [x] ~~Jobs aislados + orquestador.~~  
  Obs: jobs en carpeta `jobs/` (daily-price-update, realtime-alerts, weekly-analysis, maintenance); orchestrator.ts coordina ejecución.
- [x] ~~Logs con jobId/runId.~~  
  Obs: tipos incluyen runId; payload de `cron_jobs_execution_log` alineado con schema (execution_id/estado/duracion_ms); pendiente validacion runtime.

**M3.4 Depuracion de cron auxiliares**
- [x] ~~Decidir consolidacion de `cron-testing-suite`, `cron-notifications`, `cron-dashboard`, `cron-health-monitor`.~~  
  Obs: decisión documentada en `supabase/functions/CRON_AUXILIARES.md`; falta corregir la afirmación de que todas usan _shared (solo `cron-notifications` lo hace).

**Gate Semana 5:**
- [x] ~~Scraper modular con tests basicos.~~  
  Obs: 9 modulos creados; tests reales agregados; alertas reales implementadas.
- [x] ~~Cron modular con persistencia de ejecuciones.~~  
  Obs: payload alineado con schema DB; pendiente validacion runtime.

---

### SEMANA 6 — F4 Testing + F5 Observabilidad + F6 CI/CD + F7 Cierre
**Objetivo:** cerrar calidad, observabilidad y operacion.

**M4.1 Unificacion de framework de tests**
- [x] ~~Elegir Jest o Vitest y consolidar configs.~~  
  Obs: Vitest elegido (v4.0.16); Jest eliminado; `test.sh` y `package.json` alineados con Vitest.

**M4.2 Estructura unica de tests**
- [x] ~~Unificar `test/` y `tests/`.~~  
  Obs: `test/` eliminado y `tests/` consolidado; runner actualizado.

**M4.3 Cobertura minima**
- [x] ~~Tests en parsing/matching/routing/jobs.~~  
  Obs: tests reales para parsing/matching/alertas, router y cron (imports reales); suites integration/e2e/seguridad quedan fuera de Vitest por ahora (requieren Jest/deps).

**M5.1 Logs con contexto**
- [ ] Correlacion requestId/jobId.  
  Obs: hay requestId/runId en modulos nuevos, pero logging no está unificado en handlers y cron auxiliares (muchos siguen con `console.log` directo).

**M5.2 Metricado minimo**
- [ ] Duracion, errores, items procesados.  
  Obs: metricas parciales; persistencia cron alineada a schema, pero falta validacion y completar metricado en handlers.

**M6.1 CI minimo**
- [x] ~~Workflow con lint/tests/build.~~  
  Obs: workflow actualizado para `master` y edge-check estricto (falla en errores).

**M7.1 Alineacion de docs**
- [ ] Actualizar `docs/` y checklist final.  
  Obs: `CHECKLIST_CIERRE.md` y `copilot-instructions.md` reportan plan completado, pero el estado real tiene pendientes (ver M2.4/M3.x/M4.x/M5.x/M6.x).

**Gate Semana 6:**
- [x] ~~Tests unificados y ejecutables en CI.~~  
  Obs: `npx vitest run` OK (unit); integration/e2e pendientes por runner.
- [ ] Logs estructurados y metricas basicas.  
  Obs: logging parcial; métricas con persistencia inconsistente.
- [ ] CI verde.  
  Obs: workflow requiere ajuste de branches y validaciones estrictas.
- [ ] Docs alineadas.  
  Obs: falta actualizar análisis y referencias post-refactor.

---

## 6) Dependencias criticas
- F1 depende de credenciales DB.
- F3 depende de F2 (shared libs) y F1 (schema alineado).
- F4 depende de decision Jest/Vitest.
- F6 depende de scripts reproducibles en local.

---

## 7) Riesgos y mitigaciones

1. **Regresiones en endpoints**  
   Mitigacion: tests de contrato + smoke tests.
2. **Cambios en scraping**  
   Mitigacion: parsing puro + fixtures + circuit breaker.
3. **DB no alineada en prod**  
   Mitigacion: migraciones por entorno + rollback.
4. **Falta de CI**  
   Mitigacion: CI minimo antes de refactors grandes.

---

## 8) Criterios de salida globales (DoD)
- Migraciones versionadas y aplicables.
- Monolitos divididos y testeados.
- Logs estructurados y sin `console.log` en funciones criticas.
- Tests unificados y ejecutables en CI.
- Documentacion actualizada y consistente.

---

## 9) Subplan de correcciones tecnicas (ejecucion inmediata)

**Objetivo:** cerrar inconsistencias tecnicas y pendientes criticos antes de avanzar a cierre.

### SP1 Resiliencia (rate limit + circuit breaker)
- [x] ~~SP1.1 Ajustar AdaptiveRateLimiter para API real.~~  
  Obs: se agrego compatibilidad con `baseRate/burstRate/adaptiveFactor` y `tryAcquire` en `supabase/functions/_shared/rate-limit.ts`.
- [x] ~~SP1.2 Unificar opciones de circuit breaker.~~  
  Obs: `timeout` reemplazado por `openTimeoutMs` en `supabase/functions/scraper-maxiconsumo/config.ts` y `supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts`.

### SP2 Persistencia cron (schema DB)
- [x] ~~SP2.1 Alinear payload de `cron_jobs_execution_log` con schema real.~~  
  Obs: actualizado en jobs de cron con `execution_id/estado/duracion_ms` + `resultado`.
- [x] ~~SP2.2 Ajustar metricas y queries a nombres reales de columnas.~~  
  Obs: `cron-jobs-maxiconsumo/index.ts` usa `estado` y `duracion_ms`; weekly-analysis alinea `cron_jobs_metrics`.

### SP3 Scraper alertas reales
- [x] ~~SP3.1 Implementar generacion y persistencia de alertas.~~  
  Obs: `handleAlertas` usa comparaciones + `batchSaveAlerts` y deduplica por ventana de 24h; helper en `scraper-maxiconsumo/alertas.ts`.
- [x] ~~SP3.2 Tests reales para parsing/matching/alertas (imports reales).~~

### SP4 Testing real + runner
- [x] ~~SP4.1 Alinear `package.json` y `test.sh` con Vitest.~~  
  Obs: scripts Vitest agregados y runner actualizado.
- [x] ~~SP4.2 Reescribir tests inlined para importar modulos reales.~~

### SP5 CI/CD
- [x] ~~SP5.1 Activar workflow en `master`.~~  
  Obs: branches incluyen `master`.
- [x] ~~SP5.2 Hacer que edge-check falle en errores.~~  
  Obs: deno check ahora falla en errores.

### SP6 Logging y docs
- [ ] SP6.1 Unificar logging con `_shared/logger.ts` en handlers criticos.  
  Obs: `api-proveedor` handlers siguen con `console.log`.
- [ ] SP6.2 Alinear docs de estado.  
  Obs: corregir `supabase/functions/CRON_AUXILIARES.md` y revisar docs desalineadas.

---

## 10) Estado actual (punto de ejecucion)

- **Estado: PLAN NO COMPLETADO** (correcciones pendientes)
- F2/F3 avanzadas con refactors, pero quedan inconsistencias técnicas y verificación de contratos.
- Prioridad inmediata: unificar logging/errores, validar runtime y alinear docs operativas.
- Tests unitarios Vitest ejecutados OK; suites integration/e2e/seguridad requieren runner separado.
