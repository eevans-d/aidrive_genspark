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
- [ ] Definir objetivos tecnicos medibles y prioridades P0/P1/P2.  
  Obs: borrador creado en `docs/OBJETIVOS_Y_KPIS.md`, pendiente validacion final.

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
- [ ] Objetivos + KPIs aprobados.  
  Obs: pendiente validacion del borrador.
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
- [ ] Revisar politicas y grants minimos.  
  Obs: pendiente definir RLS para nuevas tablas cron/scraping.

**Gate Semana 2:**
- [x] ~~Migraciones versionadas y aplicables.~~  
  Obs: aplicadas en Supabase local; pendiente confirmar entorno remoto si aplica.
- [x] ~~SQL suelto eliminado.~~  
  Obs: `supabase/sql/tareas_metricas.sql` eliminado tras migracion.
- [ ] RLS minima validada.  
  Obs: pendiente.

---

### SEMANA 3 — F2 Shared libs + inicio F3 (`api-proveedor`)
**Objetivo:** normalizar utilidades y arrancar refactor principal.

**M2.1 CORS unificado**
- [x] ~~Crear `_shared/cors.ts` y centralizar headers.~~  
  Obs: creado en `supabase/functions/_shared/cors.ts` y adoptado en 2 funciones.

**M2.2 Respuestas y errores estandar**
- [x] ~~Crear `_shared/response.ts` con `ok`/`fail`.~~  
  Obs: creado en `supabase/functions/_shared/response.ts` y usado en 2 funciones.
- [ ] Crear `_shared/errors.ts` (tipos AppError/HttpError).  
  Obs: pendiente.

**M2.3 Logging estructurado**
- [x] ~~Crear `_shared/logger.ts` y adoptar en funciones menores.~~  
  Obs: creado y aplicado en `alertas-stock` y `reportes-automaticos`.

**M2.4 Rate limiting y circuit breaker**
- [ ] Consolidar a una sola implementacion.  
  Obs: pendiente.

**M2.5 Migracion piloto a shared**
- [x] ~~Actualizar funciones pequenas para usar `_shared`.~~  
  Obs: `supabase/functions/alertas-stock/index.ts` y `supabase/functions/reportes-automaticos/index.ts`.

**M3.1 Refactor `api-proveedor` (fase 1)**
- [ ] Crear router + handlers base + schemas.  
  Obs: pendiente.

**Gate Semana 3:**
- [ ] Shared libs en uso por funciones menores.  
  Obs: piloto hecho, falta extender a mas funciones.
- [ ] `api-proveedor` con router modular funcional.  
  Obs: pendiente.

---

### SEMANA 4 — F3 Refactor `api-proveedor` completo
**Objetivo:** terminar modularizacion sin romper contratos.

**M3.1 Refactor `api-proveedor` (fase 2)**
- [ ] Separar servicios, validaciones y utilidades.  
  Obs: pendiente.
- [ ] Tests de routing/validacion.  
  Obs: pendiente.
- [ ] Logging y errores unificados.  
  Obs: pendiente.

**Gate Semana 4:**
- [ ] `api-proveedor` modular y testeado.  
  Obs: pendiente.
- [ ] Contratos preservados.  
  Obs: pendiente.

---

### SEMANA 5 — F3 Refactor `scraper-maxiconsumo` + `cron-jobs-maxiconsumo`
**Objetivo:** modularizar scraping y orquestacion.

**M3.2 Refactor `scraper-maxiconsumo`**
- [ ] Modulos de scraping/parsing/matching/storage.  
  Obs: pendiente.
- [ ] Fixtures y tests de parsing/matching.  
  Obs: pendiente.

**M3.3 Refactor `cron-jobs-maxiconsumo`**
- [ ] Jobs aislados + orquestador.  
  Obs: pendiente.
- [ ] Logs con jobId/runId.  
  Obs: pendiente.

**M3.4 Depuracion de cron auxiliares**
- [ ] Decidir consolidacion de `cron-testing-suite`, `cron-notifications`, `cron-dashboard`, `cron-health-monitor`.  
  Obs: pendiente.

**Gate Semana 5:**
- [ ] Scraper modular con tests basicos.  
  Obs: pendiente.
- [ ] Cron modular con persistencia de ejecuciones.  
  Obs: pendiente.

---

### SEMANA 6 — F4 Testing + F5 Observabilidad + F6 CI/CD + F7 Cierre
**Objetivo:** cerrar calidad, observabilidad y operacion.

**M4.1 Unificacion de framework de tests**
- [ ] Elegir Jest o Vitest y consolidar configs.  
  Obs: pendiente decision.

**M4.2 Estructura unica de tests**
- [ ] Unificar `test/` y `tests/`.  
  Obs: `test/` ya no existe; falta normalizar `tests/` y config unica.

**M4.3 Cobertura minima**
- [ ] Tests en parsing/matching/routing/jobs.  
  Obs: pendiente.

**M5.1 Logs con contexto**
- [ ] Correlacion requestId/jobId.  
  Obs: pendiente.

**M5.2 Metricado minimo**
- [ ] Duracion, errores, items procesados.  
  Obs: pendiente.

**M6.1 CI minimo**
- [ ] Workflow con lint/tests/build.  
  Obs: pendiente.

**M7.1 Alineacion de docs**
- [ ] Actualizar `docs/` y checklist final.  
  Obs: pendiente consolidacion final.

**Gate Semana 6:**
- [ ] Tests unificados y ejecutables en CI.  
  Obs: pendiente.
- [ ] Logs estructurados y metricas basicas.  
  Obs: pendiente.
- [ ] CI verde.  
  Obs: pendiente.
- [ ] Docs alineadas.  
  Obs: pendiente.

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

## 9) Estado actual (punto de ejecucion)

- Avance actual: cierre de Semana 1 (F0) y parte de Semana 2 (F1) en curso.
- Siguiente paso inmediato: definir RLS minima para tablas nuevas y revisar permisos/grants.
