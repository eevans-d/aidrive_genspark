# PLAN DETALLADO POR WORKSTREAMS (WS1-WS8)

**Ultima actualizacion:** 2026-01-09  
**Estado:** vigente  
**Relacion:** `docs/ROADMAP.md`, `docs/DECISION_LOG.md`, `docs/CHECKLIST_CIERRE.md`

---

## Proposito
Describir un plan **detallado, verificable y sin ambiguedades** para ejecutar los workstreams del roadmap. Este documento es el nivel operativo (tareas, evidencias, responsables).

## Convenciones
- **ID de tarea:** WSx.y.z
- **Owner:** rol responsable (Backend/DB/QA/Ops/Frontend)
- **Evidencia:** comando, log o doc donde se verifica el cumplimiento
- Si una tarea cambia alcance, registrar decision en `docs/DECISION_LOG.md`.

---

## WS1 - Observabilidad y Logging (P0)
**Objetivo:** logging estructurado y trazabilidad minima en funciones criticas.

### WS1.0 Preparacion
- **WS1.0.1 Inventario de logs actuales** (Owner: Backend)  
  Pasos: `rg -n "console\\.log|console\\.error" supabase/functions` y clasificar por modulo.  
  Aceptacion: lista de puntos a migrar registrada en `docs/CHECKLIST_CIERRE.md` (seccion WS1).

- **WS1.0.2 Esquema de logging base** (Owner: Backend)  
  Definir campos minimos:
  `level`, `event`, `message`, `request_id`, `job_id`, `run_id`, `duration_ms`, `items_total`, `items_ok`, `items_fail`, `error`.  
  Aceptacion: esquema acordado y usado en WS1.1/WS1.2/WS1.3.

### WS1.1 API Proveedor
- **WS1.1.1 Contexto y request_id** (Owner: Backend)  
  Pasos: generar `request_id` en entrypoint (`api-proveedor/index.ts`) desde header `x-request-id` o UUID.  
  Aceptacion: cada handler loguea con `request_id`.

- **WS1.1.2 Migrar logs en handlers** (Owner: Backend)  
  Scope: `supabase/functions/api-proveedor/handlers/*`.  
  Aceptacion: `rg -n "console\\.log" supabase/functions/api-proveedor` devuelve 0.

### WS1.2 Scraper Maxiconsumo
- **WS1.2.1 Contexto de ejecucion** (Owner: Backend)  
  Pasos: propagar `run_id` desde `scraper-maxiconsumo/index.ts` hacia modulos.  
  Aceptacion: logs de parsing/matching incluyen `run_id`.

- **WS1.2.2 Migrar logs en modulos** (Owner: Backend)  
  Scope: `parsing.ts`, `matching.ts`, `scraping.ts`, `storage.ts`.  
  Aceptacion: `rg -n "console\\.log" supabase/functions/scraper-maxiconsumo` devuelve 0.

### WS1.3 Cron Jobs Maxiconsumo
- **WS1.3.1 Contexto job_id/execution_id** (Owner: Backend)  
  Pasos: asegurar `job_id` y `execution_id` por job en `jobs/*`.  
  Aceptacion: logs incluyen `job_id` y `execution_id`.

- **WS1.3.2 Migrar logs en jobs** (Owner: Backend)  
  Scope: `jobs/daily-price-update.ts`, `jobs/realtime-alerts.ts`, `jobs/weekly-analysis.ts`, `jobs/maintenance.ts`.  
  Aceptacion: `rg -n "console\\.log" supabase/functions/cron-jobs-maxiconsumo/jobs` devuelve 0.

### WS1.4 Persistencia de ejecucion (cron_jobs_execution_log)
- **WS1.4.1 Alinear payload con schema DB** (Owner: Backend/DB)  
  Schema en `supabase/migrations/20260104020000_create_missing_objects.sql`.  
  Campos obligatorios: `job_id`, `start_time`, `estado`.  
  Aceptacion: insert incluye `job_id`, `execution_id`, `start_time`, `end_time`, `duracion_ms`, `estado`.

- **WS1.4.2 Validacion runtime del payload** (Owner: Backend)  
  Pasos: validar `estado` y tipos antes de insertar; fallas registran `status=failed`.  
  Aceptacion: errores de validacion quedan en `error_message` y log estructurado.

### WS1.5 Metricas basicas
- **WS1.5.1 Metricas por job** (Owner: Backend)  
  Campos: `productos_procesados`, `productos_exitosos`, `productos_fallidos`, `alertas_generadas`.  
  Aceptacion: `cron-dashboard` puede leer valores sin nulls en ejecuciones exitosas.

- **WS1.6 Logging en entrypoints y auxiliares** (Owner: Backend)  
  Scope: `api-minimarket/index.ts`, `notificaciones-tareas/index.ts`, y utils de cache (`api-proveedor/utils/cache.ts`).  
  Aceptacion: `console.*` eliminado o redirigido a `_shared/logger`; `rg -n "console\\." supabase/functions` solo muestra `_shared/logger.ts` y suites de testing.

### Evidencia WS1
- `rg -n "console\\.log" supabase/functions/api-proveedor` => 0  
- `rg -n "console\\.log" supabase/functions/scraper-maxiconsumo` => 0  
- `rg -n "console\\.log" supabase/functions/cron-jobs-maxiconsumo/jobs` => 0  
- Query ejemplo: `select job_id, estado, duracion_ms from cron_jobs_execution_log order by start_time desc limit 5;`

### Riesgos y mitigacion
- **Riesgo:** romper logs existentes en cron auxiliares.  
  **Mitigacion:** limitar scope a modulos criticos y dejar auxiliares para WS4.

---

## WS2 - Testing & QA (P0/P1)
**Objetivo:** tests reproducibles mas alla de unitarios y sin runners ambiguos.

### WS2.0 Inventario y normalizacion
- **WS2.0.1 Inventario de suites** (Owner: QA)  
  Scope: `tests/integration`, `tests/e2e`, `tests/performance`, `tests/security`, `tests/api-contracts`.  
  Aceptacion: lista de suites y dependencias en `docs/CHECKLIST_CIERRE.md`.

- **WS2.0.2 Consolidar runner** (Owner: QA/Backend)  
  Decision: D-004 (Vitest + Supabase local).  
  Aceptacion: `package.json` expone `test:integration`, `test:e2e`, `test:performance`, `test:security`.

### WS2.1 Runner de integracion (Supabase local)
- **WS2.1.1 Script de entorno** (Owner: Ops)  
  Pasos: crear script que haga `supabase start` y `supabase db reset` antes de tests.  
  Aceptacion: un comando unico ejecuta la suite (sin pasos manuales).

- **WS2.1.2 Config Vitest integration** (Owner: QA)  
  Pasos: config separada para integration; timeouts y envs.  
  Aceptacion: `npx vitest run tests/integration` funciona con Supabase local.

### WS2.2 Smoke tests E2E minimos
- **WS2.2.1 Endpoints criticos** (Owner: QA)  
  Scope: `/status`, `/precios`, `/alertas` en `api-proveedor`.  
  Aceptacion: smoke tests pasan; fallan con mensaje claro si falta env.

- **WS2.2.2 Cron smoke** (Owner: QA/Backend)  
  Scope: ejecutar un job controlado y validar insert en `cron_jobs_execution_log`.  
  Aceptacion: registro visible y estado `success`.

### WS2.3 Performance baseline
- **WS2.3.1 Definir dataset/fixture** (Owner: QA)  
  Aceptacion: dataset reproducible para performance (sin datos reales).

- **WS2.3.2 Migrar tests a Vitest** (Owner: QA)  
  Scope: `tests/performance/load-testing.test.js` (actualmente Jest).  
  Aceptacion: `npx vitest run tests/performance` ejecuta sin Jest.

### WS2.4 Seguridad y contratos
- **WS2.4.1 API contracts** (Owner: QA)  
  Scope: `tests/api-contracts`.  
  Aceptacion: validacion OpenAPI con errores legibles.

- **WS2.4.2 Security tests** (Owner: QA/Sec)  
  Scope: `tests/security`.  
  Aceptacion: tests ejecutables con runner definido (Vitest o script dedicado).

### Evidencia WS2
- Comandos en README o `docs/OPERATIONS_RUNBOOK.md` con resultados reproducibles.  
- `npx vitest run tests/integration` pasa local con Supabase.
- `npm run test:e2e` pasa local con Supabase.

---

## WS3 - Base de Datos y Migraciones (P0)
**Objetivo:** migraciones validadas en entornos reales y rollback claro.

### WS3.0 Validacion local
- **WS3.0.1 Reset local** (Owner: DB/Ops)  
  Pasos: `supabase db reset` y smoke test.  
  Aceptacion: migraciones aplican sin errores.

- **WS3.0.2 Lista de migraciones** (Owner: DB)  
  Aceptacion: inventario coincide con `docs/INVENTARIO_ACTUAL.md`.

### WS3.1 Staging/Prod
- **WS3.1.1 Pre-check** (Owner: DB/Ops)  
  Pasos: backup/logs previos, ventana de mantenimiento.  
  Aceptacion: pre-check documentado.

- **WS3.1.2 Apply migrations** (Owner: DB/Ops)  
  Aceptacion: migraciones aplicadas; evidencia en `docs/CHECKLIST_CIERRE.md`.

### WS3.2 Rollback
- **WS3.2.1 Procedimiento documentado** (Owner: DB/Ops)  
  Aceptacion: pasos y comandos en `docs/DEPLOYMENT_GUIDE.md`.

### Evidencia WS3
- Checklist de ejecucion por entorno en `docs/CHECKLIST_CIERRE.md`.  
- Logs de ejecucion y timestamps registrados.

---

## WS4 - Cron y Automatizaciones (P1)
- **WS4.1** Validacion runtime de alertas/comparaciones (depende WS1).  
- **WS4.2** Consistencia `_shared` en cron auxiliares.

## WS5 - Frontend (P1)
- **WS5.1** Reducir warning chunk >500k o documentar excepcion. ✅ COMPLETADO 2026-01-12 (code splitting + `pnpm build` sin warning).  
- **WS5.2** Error boundaries en rutas criticas.

### WS5.3 Fix conteo de productos (P0)
- **WS5.3.1 Ajustar query de Dashboard** (Owner: Frontend)  
  Pasos: usar `count` de Supabase con `head: true`.  
  Aceptacion: total de productos coincide con DB y no depende de `data.length`.

### WS5.4 Movimiento de deposito atomico (P0)
- **WS5.4.1 RPC de movimiento** (Owner: Frontend/DB)  
  Pasos: llamar `sp_movimiento_inventario` desde UI y evitar inserts separados.  
  Aceptacion: stock y movimiento se actualizan en un solo paso; sin salidas con stock insuficiente.

### WS5.5 Paginacion + select minimo (P1)
- **WS5.5.1 Paginar productos/proveedores/stock** (Owner: Frontend)  
  Pasos: limitar queries y agregar UI de paginado.  
  Aceptacion: no se carga el catalogo completo en un solo fetch.

### WS5.6 Capa de datos con caching (P1)
- **WS5.6.1 Evaluar React Query/SWR** (Owner: Frontend)  
  Aceptacion: decision documentada en `docs/DECISION_LOG.md`.
- **WS5.6.2 Implementar en pantallas criticas** (Owner: Frontend)  
  Scope: Dashboard, Stock, Productos, Proveedores.  
  Aceptacion: reintentos y estados uniformes.

## WS6 - CI/CD (P1)
- **WS6.1** Integrar pruebas de integracion en pipeline.  
- **WS6.2** Validacion de envs requeridas.

## WS7 - Seguridad (P1)
- **WS7.1** Auditoria RLS.  
- **WS7.2** Escaneo dependencias (npm audit + Snyk).

### WS7.3 Gateway sin service role (P0)
- **WS7.3.1 Cambiar auth headers** (Owner: Backend)  
  Pasos: usar JWT del usuario + anon key para PostgREST.  
  Aceptacion: queries no usan service role por defecto.

### WS7.4 CORS restringido (P0)
- **WS7.4.1 Origenes permitidos por env** (Owner: Backend/Ops)  
  Pasos: leer `ALLOWED_ORIGINS` y bloquear origenes no permitidos.  
  Aceptacion: preflight y requests no autorizadas retornan 403.

### WS7.5 Roles server-side (P1)
- **WS7.5.1 Definir tabla/claims** (Owner: Backend/DB)  
  Aceptacion: rol validado en server, no en `user_metadata`.

## WS8 - Documentacion y Gobernanza (P0)
- **WS8.1** Actualizar `docs/ARCHITECTURE_DOCUMENTATION.md` a estado real.  
- **WS8.2** Handoff: verificar que ROADMAP/DECISION_LOG estan referenciados.

### WS8.3 Reporte final de analisis
- **WS8.3.1 Consolidar hallazgos** (Owner: Docs)  
  Aceptacion: reporte en `docs/REPORTE_ANALISIS_PROYECTO.md`.

### WS8.4 Backlog priorizado
- **WS8.4.1 Crear backlog con puntajes** (Owner: Docs/PM)  
  Aceptacion: `docs/BACKLOG_PRIORIZADO.md` con top 5 y tabla completa.

## WS9 - Evolucion funcional (P2)
**Objetivo:** mejoras orientadas a operacion y decisiones del negocio.

### WS9.1 Alertas proactivas de stock
- **WS9.1.1 Job de alertas** (Owner: Backend)  
  Aceptacion: notificaciones generadas automaticamente con umbrales configurables.

### WS9.2 Reposicion sugerida
- **WS9.2.1 Calculo de sugerencias** (Owner: Backend/DB)  
  Aceptacion: lista de reposicion basada en stock minimo y rotacion.

### WS9.3 Kardex e historial de movimientos
- **WS9.3.1 Vista filtrable + export** (Owner: Frontend)  
  Aceptacion: filtro por producto/lote/usuario y export CSV.

### WS9.4 Panel de rentabilidad
- **WS9.4.1 KPI de margen/rotacion** (Owner: Frontend/DB)  
  Aceptacion: tablero con margen real y rotacion por producto.

---

## Capa 2 - Sub-plan por etapas (E1–E5)
> Estructura operativa por etapa/fase alineada a `docs/C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0.md`. La evidencia se registra en `docs/CHECKLIST_CIERRE.md` y, si aplica, en `docs/VERIFICACION_*.md`.

### E1 Fundación y Gobierno (Semana 0-2)
- **Objetivo:** refrescar baseline, riesgos y arquitectura real; eliminar runners legacy.
- **Prerequisitos:** C0 vigente (`C0_DISCOVERY_MINIMARKET_TEC_2026-01-14.md`); sin credenciales productivas.
- **Inputs:** INVENTARIO_ACTUAL.md, BASELINE_TECNICO.md, ESTADO_ACTUAL.md, DECISION_LOG.md.
- **Outputs:** C0 refrescado, ARCHITECTURE_DOCUMENTATION.md actualizado, Jest legacy retirado, Risk/Stakeholders/Communication plan refrescados.
- **Fases y tareas:**
  - F1.1 C0 refresh + inventario (Owner: Backend/Ops, 4h) → Actualizar C0_DISCOVERY y CHECKLIST_CIERRE (F0/F1).
  - F1.2 Risk/Stakeholders/Comms (Owner: PM/Docs, 3h) → Refrescar C0_RISK_REGISTER, C0_STAKEHOLDERS, C0_COMMUNICATION_PLAN.
  - F1.3 Retiro Jest legacy (Owner: QA, 5h) → eliminar runners/tests legacy en `tests/performance`, `tests/security`, `tests/api-contracts`; DECISION_LOG ADR.
  - F1.4 Arquitectura real (Owner: Arquitectura/Backend, 6h) → ARCHITECTURE_DOCUMENTATION.md con stack y límites actuales.
- **Verificación:** `rg "jest" tests`=0 (except README), ARCHITECTURE_DOCUMENTATION.md actualizado, ADR en DECISION_LOG, CHECKLIST_CIERRE actualizado.
- **Rollback:** N/A (documental y scripts); mantener lockfiles como respaldo.
- **Evidencia:** CHECKLIST_CIERRE (F0/F1), hashes en DECISION_LOG, diffs de ARCHITECTURE_DOCUMENTATION.md.

### E2 Observabilidad y QA (Semana 1-4)
- **Objetivo:** logging estructurado sin console.*, métricas cron, runner integración/E2E listo (gated).
- **Prerequisitos:** `_shared/logger` adoptado; supabase local; modo sin credenciales (D-011/D-012).
- **Inputs:** WS1.*, WS2.*, DECISION_LOG (D-004, D-005, D-015).
- **Outputs:** 0 console.* en api-proveedor/scraper/cron-jobs-maxiconsumo, métricas cron activas, scripts integración/E2E operativos con gating.
- **Fases y tareas:**
  - F2.1 Logging WS1.1–1.3 (Owner: Backend, 8h) → limpiar console.* en api-proveedor, scraper, cron-jobs-maxiconsumo.
  - F2.2 Adopción _shared entrypoints/aux (Owner: Backend, 6h) → api-minimarket, notificaciones-tareas, cron auxiliares.
  - F2.3 Runner integración + E2E (gated) (Owner: QA/Ops, 6h) → scripts `run-integration-tests.sh`, `run-e2e-tests.sh` OK en `--dry-run`; gating documentado en CHECKLIST_CIERRE (D-015).
  - F2.4 Métricas/persistencia cron (Owner: Backend, 4h) → cron_jobs_execution_log con validación runtime.
- **Verificación:** `rg -n "console\\." supabase/functions` limpio (solo `_shared/logger.ts`); scripts `--dry-run` OK; inserts válidos en cron_jobs_execution_log.
- **Rollback:** revertir módulos tocados; mantener dry-run si no hay credenciales.
- **Evidencia:** CHECKLIST_CIERRE (E2), logs `--dry-run`, consultas a cron_jobs_execution_log.

### E3 Datos y Seguridad (Semana 3-6)
- **Objetivo:** migraciones verificadas, rollback documentado, auditoría RLS P0, hardening roles/CORS/service role.
- **Prerequisitos:** credenciales Supabase (URL/ANON/SERVICE_ROLE), ventana de mantenimiento, Supabase CLI.
- **Inputs:** WS3.*, WS7.*, AUDITORIA_RLS_CHECKLIST.md, scripts/rls_audit.sql, DECISION_LOG (D-017/D-018/D-019).
- **Outputs:** checklist migraciones por entorno, rollback en DEPLOYMENT_GUIDE.md, reporte auditoría RLS, gateway validado sin service role para lecturas.
- **Fases y tareas:**
  - F3.1 Migraciones staging/prod + checklist (Owner: DB/Ops, 8h) → evidencia por entorno en CHECKLIST_CIERRE.
  - F3.2 Auditoría RLS P0 (Owner: DB/Sec, 6h) → ejecutar scripts/rls_audit.sql; capturar policies/grants.
  - F3.3 Hardening roles/CORS/service role + npm audit/Snyk (Owner: Backend/QA, 6h) → validar D-017/D-018, CORS y deps.
- **Verificación:** CHECKLIST_CIERRE por entorno; salida rls_audit.sql; CORS/roles verificados en api-minimarket/api-proveedor; npm audit/Snyk sin críticos.
- **Rollback:** según DEPLOYMENT_GUIDE.md (WS3.2); backups previos obligatorios.
- **Evidencia:** logs de migración, reporte RLS, capturas políticas/grants, DECISION_LOG si hay cambios.

### E4 Producto y UX (Semana 5-9)
- **Objetivo:** reducir riesgo en UI: conteo correcto, movimiento atómico, paginación/select mínimo, decisión de caching.
- **Prerequisitos:** endpoints estables; ANON_KEY disponible; RPC `sp_movimiento_inventario` operativo.
- **Inputs:** WS5.3–5.6, ESQUEMA_BASE_DATOS_ACTUAL.md, tipos TS en `minimarket-system/src/types/*`.
- **Outputs:** Dashboard usa count real; depósito usa RPC atómico; listas paginadas/select mínimo; caching decision documentada.
- **Fases y tareas:**
  - F4.1 Conteo Dashboard (Owner: Frontend, 3h) → usar `count` real con `head: true`.
  - F4.2 Movimiento atómico (Owner: Frontend/DB, 5h) → consumir `sp_movimiento_inventario` y evitar operaciones separadas.
  - F4.3 Paginación/select mínimo (Owner: Frontend, 6h) → limitar payload en productos/proveedores/stock.
  - F4.4 Caching decisión + implementación mínima (Owner: Frontend, 6h) → definir librería y aplicarla en pantallas críticas.
- **Verificación:** pruebas manuales UI (Dashboard/Deposito); tests unitarios/frontend actualizados; payloads reducidos; decisiones de caching documentadas.
- **Rollback:** revertir cambios frontend; desactivar caching si causa regresiones.
- **Evidencia:** CHECKLIST_CIERRE (E4), notas en VERIFICACION_*.md, commits referenciados.

### E5 Cierre y Transferencia (Semana 9-12)
- **Objetivo:** documentación coherente, handoff operativo, SLO/SLA e IR plan listos, backlog final.
- **Prerequisitos:** E2–E4 completados; decisiones registradas; credenciales definidas para handoff.
- **Inputs:** WS8.*, C4 docs (handoff, SLA/SLO, IR), ROADMAP.md, DECISION_LOG.md.
- **Outputs:** ARCHITECTURE_DOCUMENTATION.md actualizado, DECISION_LOG/ROADMAP referenciados, BACKLOG_PRIORIZADO.md final, CHECKLIST_CIERRE marcado como listo.
- **Fases y tareas:**
  - F5.1 Documentación coherente (Owner: Docs, 6h) → ARCHITECTURE_DOCUMENTATION, ROADMAP, DECISION_LOG, PLAN_WS_DETALLADO consistentes.
  - F5.2 Handoff + SLO/SLA + IR (Owner: Docs/Ops, 6h) → C4_HANDOFF, C4_SLA_SLO, C4_INCIDENT_RESPONSE completos.
  - F5.3 Validación final y retro/post-mortem (Owner: PM/Equipo, 4h) → CHECKLIST_CIERRE Final y retro/post-mortem documentados.
- **Verificación:** CHECKLIST_CIERRE Final; C4 docs completos; retro documentada.
- **Rollback:** N/A (documentación); conservar versiones previas en git.
- **Evidencia:** CHECKLIST_CIERRE, enlaces en MPC_INDEX.md, actualizaciones en DECISION_LOG y ROADMAP.
