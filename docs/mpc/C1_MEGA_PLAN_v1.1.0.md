# C1 — Mega Plan Modular (MPC v2.1)

**Proyecto:** Mini Market System  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** Vigente (plan para ejecución por módulos)  

---

## 0) Contexto base y reglas

- **Fuentes de verdad:** `docs/ESTADO_ACTUAL.md`, `docs/CHECKLIST_CIERRE.md`, `docs/DECISION_LOG.md`.
- **Pendientes P1 activos:** WS7.5 (roles server-side contra tabla/claims) y rollback probado (OPS-SMART-1).
- **Reglas clave:** frontend escribe via gateway; evitar `console.*` en `supabase/functions`; documentar decisiones en `docs/DECISION_LOG.md`.

---

## 1) Pre-plan general (mapa modular)

| Módulo | Objetivo | Estado | Prioridad | Bloqueadores | Subplanes |
|---|---|---|---|---|---|
| M1 Gobierno & Documentación | Fuentes de verdad alineadas y sin ambigüedades | En curso | P0 | N/A | `C2_SUBPLAN_E7_v1.1.0.md` |
| M2 Auth/RBAC & Roles | Eliminar fallback `user_metadata` y validar roles contra tabla/claims | Parcial | P1 | Acceso DB/Auth | `C2_SUBPLAN_E4_v1.1.0.md` |
| M3 DB/Migraciones/RLS | Integridad de schema y RLS | Completado/Mantenimiento | P1 | Acceso DB | `C2_SUBPLAN_E3_v1.1.0.md`, `C2_SUBPLAN_E4_v1.1.0.md` |
| M4 Gateway & APIs | Robustez operativa, errores y timeouts | Mantenimiento | P1 | N/A | `C2_SUBPLAN_E4_v1.1.0.md` |
| M5 Frontend & UX/Data | React Query estable y UX coherente | Mantenimiento | P1 | N/A | `C2_SUBPLAN_E5_v1.1.0.md` |
| M6 Testing & QA | Suites unit/integration/e2e + evidencia | Parcial | P1 | Credenciales | `C2_SUBPLAN_E2_v1.1.0.md` |
| M7 Ops/Deployment | Rollback probado y runbooks operativos | Parcial | P1 | Staging | `C2_SUBPLAN_E3_v1.1.0.md`, `C2_SUBPLAN_E6_v1.1.0.md` |
| M8 Seguridad & Compliance | Rotación de secretos y scanning controlado | Pendiente | P1 | Accesos | `C2_SUBPLAN_E4_v1.1.0.md`, `C2_SUBPLAN_E6_v1.1.0.md` |
| M9 Ingesta & Automatizaciones | Scraper/cron resilientes con métricas | Mantenimiento | P2 | Datos reales | `C2_SUBPLAN_E8_v1.1.0.md` |

---

## 2) Orden recomendado de ejecución

1. **M1 (Docs) + M6 (QA)** en paralelo para asegurar coherencia y evidencia.
2. **M2 (Roles)** y **M7 (Rollback)** como pendientes P1 críticos.
3. **M8 (Seguridad/Secrets)** inmediatamente después de M2/M7.
4. **M3/M4/M5/M9** como mantenimiento periódico o cuando haya cambios.

---

## 3) Entregables mínimos por módulo

| Módulo | Entregables | Evidencia |
|---|---|---|
| M1 | Docs sin contradicciones + nota de cambios | `docs/INFORME_CHAT_2026-01-23.md` |
| M2 | Roles server-side sin `user_metadata` + tests | `tests/unit/gateway-auth.test.ts` |
| M3 | RLS audit + migraciones verificadas | `docs/AUDITORIA_RLS_CHECKLIST.md` |
| M4 | Errores/timeouts revisados + docs endpoint | `docs/API_README.md` |
| M5 | Hooks estables + UX de roles coherente | Tests frontend + revisión visual |
| M6 | Suites con evidencia (unit/integration/e2e) | `test-reports/*` |
| M7 | Rollback probado con evidencia | `docs/DEPLOYMENT_GUIDE.md` |
| M8 | Secrets rotados + decision log | `docs/DECISION_LOG.md` |
| M9 | Cron y scraper con métricas estables | `cron_jobs_execution_log` |

---

## 4) Plan detallado por módulo

### M1 — Gobierno & Documentación
**Objetivo:** eliminar contradicciones y mantener una única versión de verdad.

**Alcance**
- Conteos (tests, páginas, hooks, módulos) y referencias al repo.
- Fuentes de verdad + registros de cambios.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M1-T1 | Auditoría de consistencia (conteos + rutas) | ✅ | `docs/ESTADO_ACTUAL.md` |
| M1-T2 | Normalizar nombre de repo y links | ✅ | docs/closure/* |
| M1-T3 | Registrar ajustes en informe de sesión | ✅ | `docs/INFORME_CHAT_2026-01-23.md` |
| M1-T4 | Completar contratos faltantes (Kardex/Rentabilidad) | ✅ | `docs/CONTRATOS_FRONTEND_BACKEND.md` |

**DoD / Validación**
- `rg` no arroja discrepancias clave (tests/páginas/roles).
- `docs/ESTADO_ACTUAL.md` refleja el estado real.

---

### M2 — Auth/RBAC & Roles (WS7.5)
**Objetivo:** validar roles server-side sin fallback a `user_metadata`.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M2-T1 | Definir fuente de verdad (tabla `personal` vs claims) | ⏳ | `docs/DECISION_LOG.md` |
| M2-T2 | Implementar verificación en gateway | ⏳ | `supabase/functions/api-minimarket` |
| M2-T3 | Ajustar tests de roles en gateway | ⏳ | `tests/unit/gateway-auth.test.ts` |
| M2-T4 | Actualizar documentación de roles | ⏳ | `docs/ARCHITECTURE_DOCUMENTATION.md` |

**DoD / Validación**
- `user_metadata` no se usa para autorización.
- Tests de roles pasan.

---

### M3 — DB/Migraciones/RLS
**Objetivo:** mantener integridad de schema y seguridad RLS.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M3-T1 | Auditoría RLS periódica | ✅ | `docs/AUDITORIA_RLS_CHECKLIST.md` |
| M3-T2 | Migraciones 10/10 verificadas | ✅ | `docs/CHECKLIST_CIERRE.md` |
| M3-T3 | Consistencia `user_auth_id` | ✅ | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` |

**DoD / Validación**
- RLS audit con evidencia.
- Migraciones confirmadas en staging/prod.

---

### M4 — Gateway & APIs
**Objetivo:** robustez operacional del gateway y API proveedor.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M4-T1 | Revisar timeouts y errores edge-case | ⏳ | `docs/API_README.md` |
| M4-T2 | Evaluar rate limit por usuario | ⏳ | `supabase/functions/_shared/rate-limit.ts` |
| M4-T3 | Verificar documentación endpoints críticos | ✅ | `docs/API_README.md` |

**DoD / Validación**
- Errores críticos manejados sin fugas de detalles.
- Docs alineadas con implementación.

---

### M5 — Frontend & UX/Data
**Objetivo:** UX estable con React Query y control de roles coherente.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M5-T1 | Error boundaries y fallback UI | ✅ | `minimarket-system/src/components/ErrorBoundary.tsx` |
| M5-T2 | Paginación + select mínimo | ✅ | `minimarket-system/src/pages/*` |
| M5-T3 | React Query consistente (8/8 con data) | ✅ | `minimarket-system/src/hooks/queries/*` |

**DoD / Validación**
- Tests frontend pasan y UX sin estados rotos.

---

### M6 — Testing & QA
**Objetivo:** pruebas reproducibles con evidencia.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M6-T1 | Unit tests 646/646 | ✅ | `test-reports/junit.xml` |
| M6-T2 | Integration 31/31 (gated) | ✅ | `tests/integration` |
| M6-T3 | E2E backend smoke 4/4 | ✅ | `tests/e2e/*.smoke.test.ts` |
| M6-T4 | E2E auth real 7/7 | ✅ | `minimarket-system/e2e/auth.real.spec.ts` |
| M6-T5 | Performance baseline documentado | ✅ | `tests/performance/load-testing.vitest.test.ts` |

**DoD / Validación**
- Evidencia registrada al ejecutar suites reales.

---

### M7 — Ops/Deployment
**Objetivo:** rollback probado y operativo.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M7-T1 | Rollback documentado | ✅ | `docs/DEPLOYMENT_GUIDE.md` |
| M7-T2 | Rollback probado en staging | ⏳ | Evidencia en docs |
| M7-T3 | Runbooks operativos actualizados | ✅ | `docs/OPERATIONS_RUNBOOK.md` |

**DoD / Validación**
- OPS-SMART-1 marcado completo con evidencia.

---

### M8 — Seguridad & Compliance
**Objetivo:** reducir exposición y formalizar scanning.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M8-T1 | Rotación de secretos Supabase/CI | ⏳ | Registro en `docs/DECISION_LOG.md` |
| M8-T2 | `npm audit` documentado | ✅ | `docs/DECISION_LOG.md` (D-026) |
| M8-T3 | Definir scanning gradual (CodeQL/Snyk) | ⏳ | `docs/SECURITY_RECOMMENDATIONS.md` |

**DoD / Validación**
- Secrets rotados y documentados.

---

### M9 — Ingesta & Automatizaciones
**Objetivo:** scraping y cron jobs resilientes.

**Checklist de ejecución**
| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| M9-T1 | Validación runtime de jobs/alertas | ✅ | `supabase/functions/cron-jobs-maxiconsumo/validators.ts` |
| M9-T2 | Logging y métricas consistentes | ✅ | `cron_jobs_execution_log` |
| M9-T3 | Performance real (k6) | ⏳ | Planificado |

**DoD / Validación**
- Cron jobs con métricas estables y sin fallos silenciosos.

---

## 5) Matriz RAID (actualizada)

| Tipo | ID | Descripción | Impacto | Prob. | Mitigación | Owner |
|---|---|---|---|---|---|---|
| Riesgo | R-01 | WS7.5 sin cierre (roles server-side) | Alto | Medio | M2 completo + tests | Backend |
| Riesgo | R-02 | Rollback sin prueba real | Alto | Medio | M7.2 con evidencia | Ops |
| Riesgo | R-03 | Secrets expuestos históricamente | Alto | Medio | M8.1 rotación | Ops/Sec |
| Issue | I-01 | ~~Contratos FE/BE incompletos (Kardex/Rentabilidad)~~ | Bajo | Bajo | ✅ Completado | Frontend/Docs |
| Dependencia | D-01 | Credenciales Supabase | Alto | Medio | `docs/OBTENER_SECRETOS.md` | Ops |

---

## 6) Criterios SMART (2026-01-23)

- **FR-SMART-1:** WS7.5 completado y verificado en gateway (✓/✗).
- **NFR-SMART-1:** Rollback probado en staging con evidencia (✓/✗).
- **SEC-SMART-1:** Rotación de secretos registrada y variables actualizadas (✓/✗).
- **DOC-SMART-1:** Contratos FE/BE completos (Kardex/Rentabilidad) (✓).

---

## 7) Nota de histórico

Este documento reemplaza el plan anterior. El historial completo queda en Git.
