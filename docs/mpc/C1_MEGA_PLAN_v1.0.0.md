# C1 — Mega Plan Modular (MPC v2.1)

**Proyecto:** Mini Market System  
**Fecha:** 2026-01-23  
**Versión:** 1.1.0  
**Estado:** Vigente (plan para ejecución por módulos)  

---

## 0) Contexto base y reglas

- **Fuentes de verdad:** `docs/ESTADO_ACTUAL.md`, `docs/CHECKLIST_CIERRE.md`, `docs/DECISION_LOG.md`.
- **Pendientes P1 activos:** WS7.5 (roles server-side contra tabla/claims) y rollback probado (OPS-SMART-1).
- **Reglas clave:** frontend escribe via gateway; evitar `console.*` en código productivo; documentar decisiones en `docs/DECISION_LOG.md`.

---

## 1) Pre-plan general (mapa modular)

| Módulo | Objetivo | Estado | Prioridad | Dependencias | Evidencia principal |
|---|---|---|---|---|---|
| M1 Gobierno & Documentación | Mantener fuentes de verdad alineadas y sin ambigüedades | En curso | P0 | N/A | `docs/ESTADO_ACTUAL.md` actualizado |
| M2 Auth/RBAC & Roles | Eliminar fallback `user_metadata` y validar roles contra tabla/claims | Parcial | P1 | Supabase Auth + DB | Tests + actualización gateway |
| M3 DB/Migraciones/RLS | Mantener migraciones coherentes y auditoría RLS vigente | Completado/Mantenimiento | P1 | Acceso DB | `docs/AUDITORIA_RLS_CHECKLIST.md` |
| M4 Gateway & APIs | Robustez de endpoints, timeouts y errores | Completado/Mantenimiento | P1 | Edge Functions | Tests gateway |
| M5 Frontend & UX/Data | React Query estable y UX consistente | Completado/Mantenimiento | P1 | Supabase/Mocks | Tests frontend |
| M6 Testing & QA | Suites unit/integration/e2e + evidencia | Parcial | P1 | Credenciales | `test-reports/*` |
| M7 Ops/Deployment | Rollback probado y runbooks operativos | Parcial | P1 | Staging | `docs/DEPLOYMENT_GUIDE.md` |
| M8 Seguridad & Compliance | Rotación de secretos y scanning controlado | Pendiente | P1 | Accesos | `docs/SECURITY_RECOMMENDATIONS.md` |
| M9 Ingesta & Automatizaciones | Scraper/cron resilientes con métricas | Completado/Mantenimiento | P2 | Datos reales | `cron_jobs_execution_log` |

---

## 2) Plan detallado por módulo

### M1 — Gobierno & Documentación
**Objetivo:** eliminar contradicciones y mantener una única versión de verdad.

**Pasos**
1. **M1.1 Auditoría de consistencia**: cruzar conteos (tests, páginas, hooks, módulos) con el repo y actualizar docs clave.
2. **M1.2 Normalización de referencias**: unificar nombre de repo, rutas y comandos en guías de cierre/seguridad.
3. **M1.3 Registro de cambios**: actualizar `docs/INFORME_CHAT_2026-01-23.md` con ajustes finales.

**Criterios de salida**
- No hay discrepancias entre `ESTADO_ACTUAL`, `CHECKLIST_CIERRE`, `DECISION_LOG` y `PROJECT_CLOSURE_REPORT`.
- Referencias al repo remoto son consistentes (`aidrive_genspark_forensic`).

**Evidencia**
- `rg` sin hallazgos de conteos contradictorios.

---

### M2 — Auth/RBAC & Roles (WS7.5)
**Objetivo:** validar roles server-side sin fallback a `user_metadata`.

**Pasos**
1. **M2.1 Definir fuente de verdad**: decidir si el rol se valida contra tabla `personal`, claims JWT, o ambos (preferible tabla + claims si existen).
2. **M2.2 Implementar en gateway**: ajustar helpers en `api-minimarket` para consultar `personal` o validar claim firmado; remover fallback a `user_metadata`.
3. **M2.3 Tests**: agregar/ajustar unit tests para roles en gateway y checks de permisos.
4. **M2.4 Documentación**: actualizar `docs/ARCHITECTURE_DOCUMENTATION.md` y `docs/DECISION_LOG.md` con la decisión final.

**Criterios de salida**
- `user_metadata` no se usa para autorización.
- Tests de roles pasan y están documentados.

**Evidencia**
- `tests/unit/gateway-auth.test.ts` actualizado y verde.

---

### M3 — DB/Migraciones/RLS
**Objetivo:** mantener integridad de schema y seguridad RLS.

**Pasos**
1. **M3.1 Auditoría RLS periódica**: ejecutar `scripts/rls_audit.sql` y registrar evidencia.
2. **M3.2 Verificación migraciones**: confirmar `10/10` aplicadas en staging/prod y registrar hash.
3. **M3.3 Consistencia de columnas**: validar uso de `user_auth_id` en docs y seeds.

**Criterios de salida**
- Checklist RLS actualizado y firmado.
- Migraciones verificadas contra prod.

---

### M4 — Gateway & APIs
**Objetivo:** robustez operacional del gateway y API proveedor.

**Pasos**
1. **M4.1 Timeouts y errores**: revisar límites y códigos de error (edge cases).
2. **M4.2 Rate limit por usuario**: evaluar necesidad y diseñar estrategia si aplica.
3. **M4.3 Documentación de endpoints críticos**: confirmar estado en `docs/API_README.md`.

**Criterios de salida**
- Errores críticos manejados sin fugas de detalles.
- Documentación consistente con implementación.

---

### M5 — Frontend & UX/Data
**Objetivo:** UX estable con React Query y control de roles coherente.

**Pasos**
1. **M5.1 Role UX**: asegurar fallback visual si el rol no está disponible.
2. **M5.2 React Query**: revisar staleTime y queryKeys de hooks críticos.
3. **M5.3 E2E mocks**: mantener suites Playwright con mocks como smoke base.

**Criterios de salida**
- UI no falla con rol desconocido.
- Playwright mocks pasa sin flakiness.

---

### M6 — Testing & QA
**Objetivo:** pruebas reproducibles con evidencia.

**Pasos**
1. **M6.1 Unit tests**: mantener `npm run test:unit` como gate.
2. **M6.2 Integration/E2E**: ejecutar con `.env.test` real cuando aplique y guardar logs.
3. **M6.3 Reportes**: regenerar `test-reports/*` cuando cambie cobertura.

**Criterios de salida**
- Suites completas con evidencia y fecha.

---

### M7 — Ops/Deployment
**Objetivo:** rollback probado y operativo.

**Pasos**
1. **M7.1 Rollback en staging**: ejecutar procedimiento en `docs/DEPLOYMENT_GUIDE.md`.
2. **M7.2 Evidencia**: registrar comandos, tiempos y resultado.
3. **M7.3 Runbooks**: confirmar `docs/OPERATIONS_RUNBOOK.md` actualizado.

**Criterios de salida**
- OPS-SMART-1 marcado como completado con evidencia.

---

### M8 — Seguridad & Compliance
**Objetivo:** reducir exposición y formalizar scanning.

**Pasos**
1. **M8.1 Rotación de secretos**: rotar claves Supabase/CI y actualizar `.env.test` local.
2. **M8.2 Auditoría dependencias**: ejecutar `npm audit` y documentar excepciones.
3. **M8.3 Scanning opcional**: definir adopción gradual de CodeQL/Snyk (ver recomendaciones).

**Criterios de salida**
- Credenciales rotadas y documentadas.
- Riesgos conocidos registrados.

---

### M9 — Ingesta & Automatizaciones
**Objetivo:** scraping y cron jobs resilientes.

**Pasos**
1. **M9.1 Rate limits externos**: validar límites y backoff en scraper.
2. **M9.2 Observabilidad**: asegurar métricas en `cron_jobs_execution_log`.
3. **M9.3 Performance real**: planificar ejecución k6 cuando haya entorno.

**Criterios de salida**
- Cron jobs con métricas estables y sin fallos silenciosos.

---

## 3) Matriz RAID (actualizada)

| Tipo | ID | Descripción | Impacto | Prob. | Mitigación | Owner |
|---|---|---|---|---|---|---|
| Riesgo | R-01 | WS7.5 sin cierre (roles server-side) | Alto | Medio | M2 completo + tests | Backend |
| Riesgo | R-02 | Rollback sin prueba real | Alto | Medio | M7.1 con evidencia | Ops |
| Riesgo | R-03 | Secrets expuestos históricamente | Alto | Medio | M8.1 rotación | Ops/Sec |
| Issue | I-01 | Ambigüedad en conteos/doc | Medio | Bajo | M1.1/M1.2 | Docs |
| Dependencia | D-01 | Credenciales Supabase | Alto | Medio | `docs/OBTENER_SECRETOS.md` | Ops |

---

## 4) Criterios SMART (2026-01-23)

- **FR-SMART-1:** WS7.5 completado y verificado en gateway (✓/✗).
- **NFR-SMART-1:** Rollback probado en staging con evidencia (✓/✗).
- **SEC-SMART-1:** Rotación de secretos registrada y variables actualizadas (✓/✗).

---

## 5) Nota de histórico

Este documento reemplaza el plan anterior. El historial completo del v1.0.0 queda en Git.
