# C1_MEGA_PLAN_MINIMARKET_TEC_v1.0.0

**Proyecto:** Minimarket System  
**Dominio MPC:** TEC (Software)  
**Nivel MPC:** Intermedio (C0, C1, C4; C2/C3 combinados por workstreams)  
**Fecha:** 2026-01-14  
**Fuentes de verdad:** docs/ROADMAP.md, docs/PLAN_WS_DETALLADO.md, docs/DECISION_LOG.md, docs/ESTADO_ACTUAL.md, docs/CHECKLIST_CIERRE.md  
**Estado:** Draft alineado al roadmap vigente (no ejecutar, uso para planificación)

---

## 1. Consolidación del Alcance
- El objetivo de los próximos 90 días: estabilizar y endurecer el sistema (API gateway, funciones Supabase, cron, frontend) hasta un estado listo para producción, con énfasis en observabilidad, seguridad y verificación de migraciones.
- Objetivos SMART:
  1) Habilitar logging estructurado completo (requestId/jobId/runId) en funciones críticas y cron auxiliares con 0 `console.*` fuera de `_shared/logger` antes del hito B (6 semanas).
  2) Verificar y evidenciar migraciones en staging/prod (WS3.1) con checklist firmado y rollback documentado antes del hito B.
  3) Activar suites integration + E2E smoke con un comando único (Vitest + Supabase local) y habilitar gating en CI antes del hito B.
  4) Completar auditoría RLS P0 (productos, stock_deposito, movimientos_deposito, precios_historicos, proveedores, personal) con evidencia en CHECKLIST_CIERRE.md antes del hito C (12 semanas).
  5) Reducir payload y riesgo en frontend: conteo correcto en Dashboard (WS5.3), movimiento de depósito atómico (WS5.4) y paginación/select mínimo (WS5.5) antes del hito C.
- Alcance (in-scope): observabilidad WS1, testing WS2, DB WS3, cron WS4, frontend WS5, seguridad WS7, documentación WS8, evolución mínima WS9. Fuera de alcance inmediato: features nuevas no listadas en ROADMAP.md y despliegue productivo sin credenciales.

---

## 2. Arquitectura Multinivel (Etapas y Fases)

**E1: Fundación y Gobierno (Semana 0-2)**
- F1.1 Revisión de baseline y activos (C0 refresh) usando INVENTARIO_ACTUAL + BASELINE_TECNICO.
- F1.2 Risk Register y stakeholders (crear docs faltantes; mapear owners por WS).
- F1.3 Normalización de tooling (Vitest único; desactivar Jest legacy en tests/package.json).
- F1.4 Actualización de arquitectura referencial a estado real (ARCHITECTURE_DOCUMENTATION.md).

**E2: Observabilidad y QA (Semana 1-4)**
- F2.1 WS1.1-WS1.3 logging estructurado en api-proveedor, scraper, cron-jobs-maxiconsumo.
- F2.2 WS1.6 adopción _shared en entrypoints/auxiliares y eliminación de console.*.
- F2.3 WS2.1 runner integración y WS2.2 smoke E2E (local Supabase + gating CI). 
- F2.4 WS1.4/WS1.5 métricas y persistencia cron_jobs_execution_log.

**E3: Datos y Seguridad (Semana 3-6)**
- F3.1 WS3.1 verificación de migraciones staging/prod (con evidencia) y WS3.2 rollback documentado.
- F3.2 Auditoría RLS (D-019) con scripts rls_audit y checklist; evidencia en CHECKLIST_CIERRE.
- F3.3 WS7.3-WS7.5 hardening gateway roles/CORS/service role; escaneo dependencias (WS7.2).

**E4: Producto y UX (Semana 5-9)**
- F4.1 WS5.3 conteo Dashboard con count real.
- F4.2 WS5.4 movimiento de depósito atómico vía RPC.
- F4.3 WS5.5 paginación + select mínimo; WS5.6 decisión y adopción de caching de datos.
- F4.4 WS9.1 alertas proactivas de stock (mínimo creíble).

**E5: Cierre y Transferencia (Semana 9-12)**
- F5.1 Documentación coherente (WS8.1, WS8.2, WS8.3, WS8.4); índice MPC.
- F5.2 Handoff operativo (procedimientos, credenciales, runbooks, SLO/SLA mínimos, IR plan).
- F5.3 Validación final y checklist de cierre; preparación de C4 (retrospectiva/post-mortem).

**Grafo de dependencias (simplificado)**
E1 → E2 → E3 → E4 → E5
          ↘ WS4.1 depende de E2 logging
          ↘ WS3.1/WS7.1 dependen de credenciales externas

---

## 3. Matriz RAID (resumida)

**Riesgos (≥5)**
- R1: Sin credenciales para staging/prod → bloquea RLS y migraciones; mitigar con plan "sin credenciales" y gate en CHECKLIST.
- R2: Runner legacy Jest causa resultados inconsistentes → remover o migrar a Vitest en tests/package.json; documentar D-016 cumplimiento.
- R3: Arquitectura desactualizada induce errores de diseño → actualizar ARCHITECTURE_DOCUMENTATION en E1.
- R4: Observabilidad parcial en cron auxiliares → WS1.6 y WS4.2 para adopción _shared.
- R5: Service role mal usado en gateway/scraper → respetar D-017/D-018 y validar en WS7.3.
- R6: Paginación ausente provoca OOM/timeouts → WS5.5 obligatorio en E4.

**Assumptions (≥3)**
- A1: Disponibilidad de Supabase local para integración/E2E.
- A2: Equipo puede reservar ventanas para staging/prod cuando lleguen credenciales.
- A3: No habrá cambios mayores de scope fuera de ROADMAP.md.

**Issues (situaciones actuales)**
- I1: Auditoría RLS pendiente (D-019) sin evidencia.
- I2: Validación runtime de alertas/comparaciones (WS4.1) pendiente.
- I3: Suites performance/security/api-contracts en Jest legacy (fuera de CI).

**Dependencies externas**
- Dp1: Credenciales Supabase staging/prod.
- Dp2: Tokens Snyk (WS7.2) si se habilita escaneo.
- Dp3: Ventana de mantenimiento para WS3.1/WS3.2.

---

## 4. Criterios de Éxito SMART
- Observabilidad: 0 `console.*` en funciones críticas; logs con requestId/jobId/runId; métricas cron registran duración e items.
- Calidad: `npm test` (unit) + `npm run test:integration` + `npm run test:e2e` reproducibles local; jobs gated en CI listos para activarse con secrets.
- Seguridad: Auditoría RLS P0 completada con evidencia; gateway sin uso de service role en lecturas; CORS restringido por ALLOWED_ORIGINS.
- Datos: Migraciones aplicadas y verificadas en staging/prod con rollback documentado.
- UX/Producto: Dashboard cuenta productos con count real; movimiento de depósito atómico; paginación y select mínimo activos.
- Documentación: ARCHITECTURE_DOCUMENTATION actualizado; índice MPC y handoff operativo disponibles.

---

## 5. Matriz de Priorización (P0–P3)
| Etapa/Fase | Pri | Criticidad | Esfuerzo | Valor | Riesgo | Score |
|------------|-----|------------|----------|-------|--------|-------|
| E2-F2.1 Logging críticos (WS1.1-1.3) | P0 | 5 | 3 | 4 | 3 | 20 |
| E3-F3.1 Migraciones staging/prod | P0 | 5 | 3 | 4 | 2 | 19 |
| E3-F3.2 Auditoría RLS P0 | P0 | 5 | 3 | 4 | 2 | 19 |
| E2-F2.3 Runner integración + E2E | P0 | 4 | 3 | 4 | 3 | 18 |
| E4-F4.4 Alertas stock (mínimo) | P1 | 4 | 3 | 4 | 3 | 18 |
| E4-F4.2 Movimiento atómico | P0 | 4 | 3 | 4 | 3 | 18 |
| E4-F4.1 Conteo Dashboard | P0 | 4 | 2 | 4 | 4 | 18 |
| E4-F4.3 Paginación/select mínimo | P1 | 4 | 3 | 3 | 3 | 17 |
| E2-F2.4 Métricas cron | P1 | 3 | 3 | 3 | 3 | 15 |
| E5-F5.2 Handoff + SLO/SLA + IR | P1 | 3 | 3 | 3 | 3 | 15 |
| E1-F1.3 Normalizar tooling (eliminar Jest) | P1 | 3 | 2 | 3 | 3 | 14 |

(Score = Criticidad×2 + Valor×2 + Esfuerzo + Riesgo; Esfuerzo/Riesgo invertidos: 5 = bajo)

---

## 6. Orden de Ejecución Recomendado
1) E1 (Fundación): refresh C0, Risk Register, arquitectura real, normalización de tooling.
2) E2 (Observabilidad/QA): logging crítico, runner integración/E2E, métricas cron.
3) E3 (Datos/Seguridad): migraciones staging/prod + rollback, auditoría RLS, hardening gateway/service role, escaneo deps.
4) E4 (Producto/UX): conteo Dashboard, movimiento atómico, paginación/select mínimo, caching decision, alertas stock mínimas.
5) E5 (Cierre): documentación coherente, handoff, SLO/SLA e IR plan, backlog remanente y retro.

Justificación: bloqueadores de seguridad y datos (E3) dependen de logging y runner estable (E2); frontend optimizaciones esperan estabilidad de datos; cierre depende de evidencia previa.

---

## 7. Gaps y Solapamientos
- Gaps: falta Risk Register formal, Stakeholder map, Communication plan, Handoff, SLA/SLO, Incident Response, Lessons Learned; arquitectura desactualizada; suites legacy Jest sin migrar.
- Solapamientos: ROADMAP vs PLAN_WS_DETALLADO ya alineados; mantener DECISION_LOG como fuente para cambios de alcance. Evitar duplicar criterios de aceptación entre ROADMAP y este C1 (referenciar en lugar de copiar).

---

## 8. Log ADR Inicial (referencias)
- D-004 Runner integración Vitest + Supabase local (vigente).
- D-005 Estándar logging `_shared/logger` con IDs.
- D-013/014 Gateway hardening (JWT, rate limit, circuit breaker, CORS restrictivo).
- D-017/018 Uso de ANON para lecturas en api-proveedor/scraper; service solo escrituras.
- D-019 Auditoría RLS pendiente (scripts y checklist listos).
- Nuevo ADR sugerido: retiro definitivo de Jest en tests/package.json y migración de performance/security/api-contracts a Vitest.

---

## 9. Checkpoints (nivel Intermedio)
- Checkpoint 0: E1 completado (C0 refresh, Risk Register, arquitectura actualizada, tooling normalizado).
- Checkpoint 1: E2+E3 completados (logging, runner integración/E2E, migraciones verificadas, RLS auditada, hardening gateway).
- Checkpoint Final: E4+E5 completados (optimización frontend mínima, alertas stock, handoff, SLO/SLA, IR plan, doc coherente, evidencia en CHECKLIST_CIERRE.md).

---

## 10. Evidencia requerida por etapa
- E1: C0_DISCOVERY actualizado, Risk Register, arquitectura revisada, DECISION_LOG con ADR de tooling tests.
- E2: outputs de `rg "console\."`=0 en funciones críticas; `npm run test:integration` y `npm run test:e2e` (local) con prerequisitos; métricas cron insertadas.
- E3: checklist migraciones por entorno; salida de scripts rls_audit; policies/grants capturados; configuración gateway verificada; escaneo deps (audit/Snyk).
- E4: pruebas de conteo Dashboard, RPC atómico, paginación y select mínimo; decisión de caching documentada; alertas stock operativas.
- E5: docs actualizadas (ARCHITECTURE_DOCUMENTATION, ROADMAP, PLAN_WS_DETALLADO, DECISION_LOG, CHECKLIST_CIERRE, handoff, SLO/SLA, IR plan); backlog remanente y retro preparadas.

---

## 11. Notas de ejecución
- No ejecutar despliegues productivos ni auditorías RLS hasta contar con credenciales oficiales.
- Mantener gating en CI (integration/E2E) hasta disponer de envs; activar manualmente con vars RUN_* cuando corresponda.
- Cada cierre de WS debe actualizar CHECKLIST_CIERRE.md y adjuntar evidencia (logs, capturas, reportes, hashes de commit).
