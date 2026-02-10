# 📋 AUDITORÍA: DOCUMENTACIÓN vs REALIDAD DEL REPO

**Fecha:** 2026-02-09  
**Alcance:** Repo completo (`eevans-d/aidrive_genspark`, branch `main`)  
**Metodología:** Comparación directa entre afirmaciones en docs y evidencia en filesystem/código  
**Autor:** Auditoría automatizada (GitHub Copilot Coding Agent)

> Nota (actualización 2026-02-10): varias brechas detectadas aquí fueron resueltas posteriormente (CORS local, limpieza de paths, centralización de métricas, inventario de endpoints, etc.).  
> Para conteos actuales, usar `docs/METRICS.md` como fuente única.

---

## 1) INVENTARIO DE DOCUMENTACIÓN REAL

### Raíz del proyecto

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| README.md | `/README.md` | Inicio rápido, estructura, stack, estado |
| CHANGELOG.md | `/CHANGELOG.md` | Historial de versiones (última: v1.5.0, 2025-11-03) |
| CLAUDE.md | `/CLAUDE.md` | Bootstrap para agente IA (Protocol Zero) |
| SECURITY.md | `/SECURITY.md` | Política de reporte de vulnerabilidades |
| IA_USAGE_GUIDE.md | `/IA_USAGE_GUIDE.md` | Guía de uso de IA en el proyecto |
| LICENSE | `/LICENSE` | Licencia del proyecto |
| .env.example | `/.env.example` | Variables de entorno (backend/CI) |
| .env.test.example | `/.env.test.example` | Variables de entorno para tests |

### `/docs/` — Documentación principal (40+ archivos)

| Archivo | Ruta | Tipo |
|---------|------|------|
| AGENTS.md | `docs/AGENTS.md` | Guía para agentes IA |
| API_README.md | `docs/API_README.md` | Documentación de endpoints API |
| ARCHITECTURE_DOCUMENTATION.md | `docs/ARCHITECTURE_DOCUMENTATION.md` | Arquitectura del sistema |
| AUDITORIA_RLS_CHECKLIST.md | `docs/AUDITORIA_RLS_CHECKLIST.md` | Checklist auditoría RLS |
| AUDITORIA_RLS_EJECUTADA_2026-01-31.md | `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` | Evidencia auditoría RLS ejecutada |
| BACKLOG_PRIORIZADO.md | `docs/BACKLOG_PRIORIZADO.md` | Backlog con prioridades |
| C4_HANDOFF_MINIMARKET_TEC.md | `docs/C4_HANDOFF_MINIMARKET_TEC.md` | Handoff técnico |
| C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md | `docs/C4_INCIDENT_RESPONSE_MINIMARKET_TEC.md` | Plan de respuesta a incidentes |
| C4_SLA_SLO_MINIMARKET_TEC.md | `docs/C4_SLA_SLO_MINIMARKET_TEC.md` | SLA/SLO del sistema |
| CHECKLIST_CIERRE.md | `docs/CHECKLIST_CIERRE.md` | Checklist de cierre a producción |
| CHECKLIST_PREFLIGHT_PREMORTEM.md | `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` | Preflight y premortem |
| CONTRATOS_FRONTEND_BACKEND.md | `docs/CONTRATOS_FRONTEND_BACKEND.md` | Contratos frontend-backend |
| DB_GAPS.md | `docs/DB_GAPS.md` | Brechas en base de datos |
| DECISION_LOG.md | `docs/DECISION_LOG.md` | Log de decisiones técnicas |
| DEPLOYMENT_GUIDE.md | `docs/DEPLOYMENT_GUIDE.md` | Guía de deploy y rollback |
| E2E_SETUP.md | `docs/E2E_SETUP.md` | Setup de tests E2E |
| ESQUEMA_BASE_DATOS_ACTUAL.md | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` | Schema de BD |
| ESTADO_ACTUAL.md | `docs/ESTADO_ACTUAL.md` | **Fuente de verdad** — estado actual |
| HOJA_RUTA_MADRE_2026-01-31.md | `docs/HOJA_RUTA_MADRE_2026-01-31.md` | Hoja de ruta vigente |
| HOJA_RUTA_ACTUALIZADA_2026-02-08.md | `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md` | Roadmap actualizado |
| IA_USAGE_GUIDE.md | `docs/IA_USAGE_GUIDE.md` | Guía IA (copia de raíz) |
| INFORME_PREMORTEM_OPERATIVO.md | `docs/INFORME_PREMORTEM_OPERATIVO.md` | Informe premortem |
| OBTENER_SECRETOS.md | `docs/OBTENER_SECRETOS.md` | Cómo obtener credenciales |
| OPERATIONS_RUNBOOK.md | `docs/OPERATIONS_RUNBOOK.md` | Runbook operacional |
| PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md | `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md` | Plan de mejoras |
| PLAN_EJECUCION_PREMORTEM.md | `docs/PLAN_EJECUCION_PREMORTEM.md` | Plan de ejecución premortem |
| PLAN_MITIGACION_WARN_STAGING_2026-01-31.md | `docs/PLAN_MITIGACION_WARN_STAGING_2026-01-31.md` | Plan mitigación WARN |
| REALITY_CHECK_UX.md | `docs/REALITY_CHECK_UX.md` | Auditoría UX |
| REPORTE_ANALISIS_PROYECTO.md | `docs/REPORTE_ANALISIS_PROYECTO.md` | Reporte de análisis |
| ROLLBACK_EVIDENCE_2026-01-29.md | `docs/ROLLBACK_EVIDENCE_2026-01-29.md` | Evidencia de rollback |
| ROLLBACK_SQL_TEMPLATE.md | `docs/ROLLBACK_SQL_TEMPLATE.md` | Template SQL de rollback |
| SECRETOS_REQUERIDOS_Y_VALIDACION.md | `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md` | Secretos requeridos |
| SECRET_ROTATION_PLAN.md | `docs/SECRET_ROTATION_PLAN.md` | Plan de rotación de secretos |
| SECURITY.md | `docs/SECURITY.md` | Política de seguridad |
| SECURITY_AUDIT_REPORT.md | `docs/SECURITY_AUDIT_REPORT.md` | Reporte de auditoría de seguridad |
| SENDGRID_VERIFICATION.md | `docs/SENDGRID_VERIFICATION.md` | Verificación SendGrid |
| SENTRY_INTEGRATION_PLAN.md | `docs/SENTRY_INTEGRATION_PLAN.md` | Plan de integración Sentry |
| api-openapi-3.1.yaml | `docs/api-openapi-3.1.yaml` | OpenAPI spec (gateway) |
| api-proveedor-openapi-3.1.yaml | `docs/api-proveedor-openapi-3.1.yaml` | OpenAPI spec (proveedor) |
| postman-collection.json | `docs/postman-collection.json` | Colección Postman gateway |
| postman-collection-proveedor.json | `docs/postman-collection-proveedor.json` | Colección Postman proveedor |

### `/docs/` — Subdirectorios

| Subdirectorio | Archivos | Contenido |
|---------------|----------|-----------|
| `docs/archive/` | 5 archivos | Docs archivados (ESTADO_CIERRE, REALITY_CHECK_UX, SECURITY_ADVISOR_REVIEW, SKILLS_OPTIMIZATION) |
| `docs/audit/` | 2 archivos | Evidence report + gap matrix |
| `docs/closure/` | 17 archivos | Reportes de cierre, execution logs, prompts, session close |
| `docs/db/` | 1 archivo | README stock_aggregations |
| `docs/mpc/` | 13 archivos | Mega Plan Consolidado (C0–C4 + subplanes E1–E9) |

### CI/CD y Config

| Archivo | Ruta |
|---------|------|
| ci.yml | `.github/workflows/ci.yml` |
| copilot-instructions.md | `.github/copilot-instructions.md` |
| CODEOWNERS | `.github/CODEOWNERS` |
| dependabot.yml | `.github/dependabot.yml` |

### Edge Functions (documentación inline)

| Archivo | Ruta |
|---------|------|
| CRON_AUXILIARES.md | `supabase/functions/CRON_AUXILIARES.md` |
| cron_jobs/README.md | `supabase/cron_jobs/README.md` |
| cron_jobs/IMPLEMENTACION_COMPLETADA.md | `supabase/cron_jobs/IMPLEMENTACION_COMPLETADA.md` |

### Frontend

| Archivo | Ruta |
|---------|------|
| README.md | `minimarket-system/README.md` |
| .env.example | `minimarket-system/.env.example` |

### Tests

| Archivo | Ruta |
|---------|------|
| README.md | `tests/README.md` |

### Otros (raíz)

| Archivo | Tipo |
|---------|------|
| `package.json` | Config npm workspace |
| `vitest.config.ts` | Config Vitest principal |
| `vitest.auxiliary.config.ts` | Config Vitest auxiliar |
| `vitest.e2e.config.ts` | Config Vitest E2E |
| `vitest.integration.config.ts` | Config Vitest integración |
| `deploy.sh` | Script de deploy |
| `test.sh` | Script runner de tests |
| `setup.sh` | Script de setup |
| `deno.json` | Config Deno |

---

## 2) GAP REPORT

### Tabla de Brechas

| # | Doc / Sección | Afirmación | Realidad + Evidencia | Impacto | Acción Propuesta |
|---|--------------|------------|---------------------|---------|-----------------|
| **G01** | `README.md` línea 38 | "8 hooks React Query" | **9 hooks** en `minimarket-system/src/hooks/queries/`: useDashboardStats, useDeposito, useKardex, **usePedidos**, useProductos, useProveedores, useRentabilidad, useStock, useTareas | Bajo | Actualizar a "9 hooks React Query" |
| **G02** | `README.md` línea 40 | "9 páginas" | **13 páginas** en `minimarket-system/src/pages/`: Dashboard, Login, Deposito, Kardex, Productos, Proveedores, Stock, Tareas, **Pedidos, Pocket, Pos, Clientes, Rentabilidad** | Medio | Actualizar a "13 páginas" |
| **G03** | `README.md` línea 52 | "725 tests (2026-02-06)" | **785 unit tests** según ESTADO_ACTUAL.md (2026-02-09); **45 archivos** en `tests/unit/` | Medio | Actualizar conteo a 785 y fecha a 2026-02-09 |
| **G04** | `README.md` línea 46 | "Gateway (29 endpoints)" | **34 rutas** definidas en `supabase/functions/api-minimarket/index.ts` (bloques `if (path === ... && method === ...)`). Ver `docs/METRICS.md`. | Alto | Actualizar a conteo real de endpoints |
| **G05** | `README.md` línea 91 | "Tests: Unit 725 + Integration 38 + E2E smoke 4 + Frontend 40" | **Unit 785 + Frontend 101** (no 40; ver ESTADO_ACTUAL.md línea 15) | Medio | Actualizar métricas a valores actuales |
| **G06** | `README.md` línea 90 | "Avance Global: 95%" | Sin métrica verificable. No hay criterio formal de "100%" definido | Bajo | Eliminar o reemplazar con referencia a ESTADO_ACTUAL.md |
| **G07** | `CLAUDE.md` (copilot-instructions) | "11 activas" edge functions | **13 funciones** listadas en `supabase/functions/` (excluyendo `_shared/`). Ver ESTADO_ACTUAL.md líneas 279–294 | Alto | Actualizar a "13 funciones" en copilot-instructions.md |
| **G08** | `CLAUDE.md` "Fuentes de Verdad" | Referencia a `PLAN_WS_DETALLADO.md` | **NO EXISTE** — retirado según CHECKLIST_CIERRE.md línea 58 | Alto | Eliminar referencia |
| **G09** | `CLAUDE.md` "Fuentes de Verdad" | Referencia a `INVENTARIO_ACTUAL.md` | **NO EXISTE** — retirado según CHECKLIST_CIERRE.md línea 58 | Alto | Eliminar referencia |
| **G10** | `CLAUDE.md` "Fuentes de Verdad" | Referencia a `BASELINE_TECNICO.md` | **NO EXISTE** — retirado según CHECKLIST_CIERRE.md línea 58 | Alto | Eliminar referencia |
| **G11** | `CLAUDE.md` "Fuentes de Verdad" | Referencia a `ROADMAP.md` como "Plan histórico" | **NO EXISTE en docs/**. CHECKLIST_CIERRE dice "movido a archive/" pero `docs/archive/ROADMAP.md` **TAMPOCO EXISTE** | Alto | Eliminar referencia o crear archivo placeholder en archive |
| **G12** | `CLAUDE.md` "Estado Actual" | "646 passing" unit tests | Número no verificable. ESTADO_ACTUAL.md dice 785 (2026-02-09) | Medio | Actualizar al número correcto |
| **G13** | `CLAUDE.md` "Estado Actual" | "40 passing" frontend tests | **101 component tests** según ESTADO_ACTUAL.md línea 61 (`pnpm -C minimarket-system test:components` → 101 tests) | Medio | Actualizar a "101 component tests" |
| **G14** | `CLAUDE.md` "Estado Actual" | "15 passing" security tests | **14 tests** según ESTADO_ACTUAL.md línea 324 y CHECKLIST_CIERRE.md línea 33 | Bajo | Actualizar a "14 tests" |
| **G15** | `CLAUDE.md` "Estado Actual" | Migraciones "12 versionadas" | **32 archivos** en `supabase/migrations/` | Alto | Actualizar conteo |
| **G16** | `ARCHITECTURE_DOCUMENTATION.md` | "8 Edge Functions" modularizadas | **13 funciones** en repo (ver G07) | Alto | Actualizar sección de Edge Functions |
| **G17** | `ARCHITECTURE_DOCUMENTATION.md` | "8 pages" con React Query | **13 páginas** (ver G02); **9 con hooks React Query** (Dashboard, Kardex, Productos, Proveedores, Rentabilidad, Stock, Tareas, Pedidos, Deposito) | Medio | Actualizar conteo de páginas |
| **G18** | `CHECKLIST_CIERRE.md` línea 12 | "23 migraciones versionadas" | **32 archivos** en `supabase/migrations/` | Medio | Actualizar conteo (es histórico, pero confuso) |
| **G19** | `CHECKLIST_CIERRE.md` línea 32 | "765 tests unitarios (raíz 725 + frontend 40)" | **785 unit + 101 frontend** = 886 total (ver ESTADO_ACTUAL.md) | Medio | Actualizar cifras |
| **G20** | `CHECKLIST_CIERRE.md` línea 72 | Referencia a `scripts/rls_audit.sql` | **NO EXISTE** — archivo no encontrado en `scripts/` ni en ninguna ubicación del repo | Alto | Eliminar referencia o crear script |
| **G21** | `CHECKLIST_CIERRE.md` línea 77 | Referencia a `supabase/seed/test-users.sql` | **Directorio `supabase/seed/` NO EXISTE** | Alto | Eliminar referencia o crear directorio y archivo |
| **G22** | `CHECKLIST_CIERRE.md` línea 56–57 | Referencia a `C0_RISK_REGISTER_MINIMARKET_TEC.md`, `C0_STAKEHOLDERS_MINIMARKET_TEC.md`, `C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md` | **NINGUNO EXISTE** — los 3 archivos están ausentes de `docs/` | Alto | Eliminar referencias a archivos inexistentes |
| **G23** | `CHECKLIST_CIERRE.md` línea 56 | Referencia a `OBJETIVOS_Y_KPIS.md` | **NO EXISTE** en `docs/` | Alto | Eliminar referencia o crear archivo |
| **G24** | `CHECKLIST_CIERRE.md` línea 304 | "ROADMAP.md movido a archive/" | `docs/archive/ROADMAP.md` **NO EXISTE** | Medio | Eliminar referencia |
| **G25** | `CHECKLIST_CIERRE.md` línea 304 | "ROLLBACK_DRILL_STAGING.md movido a archive/" | `docs/archive/ROLLBACK_DRILL_STAGING.md` **NO EXISTE** | Medio | Eliminar referencia |
| **G26** | `ESTADO_ACTUAL.md` línea 314 | "Páginas: 9" | **13 páginas** en repo (ver G02) | Medio | Actualizar a 13 |
| **G27** | `ESTADO_ACTUAL.md` línea 315 | "Hooks Query: 8" | **9 hooks** en `minimarket-system/src/hooks/queries/` (ver G01) | Bajo | Actualizar a 9 |
| **G28** | `ESTADO_ACTUAL.md` línea 316 | "Componentes: 3 (Layout, ErrorBoundary, ErrorMessage)" | **8 componentes** en `minimarket-system/src/components/`: AlertsDrawer, BarcodeScanner, ErrorBoundary, ErrorMessage, GlobalSearch, Layout, Skeleton, errorMessageUtils | Medio | Actualizar a 8 |
| **G29** | `ESTADO_ACTUAL.md` línea 317 | "Libs: 5 (apiClient, supabase, roles, observability, queryClient)" | **5 archivos lib** confirmados — CORRECTO | — | Sin acción |
| **G30** | `.env.example` línea 13 | `ALLOWED_ORIGINS=http://localhost:3000` | Frontend Vite corre en **puerto 5173** (ver `minimarket-system/vite.config.ts` y `.env.test.example` que dice `http://localhost:5173`) | Alto | Cambiar a `http://localhost:5173` |
| **G31** | `ESTADO_ACTUAL.md` línea 279 | "Edge Functions en repo (13)" — lista 13 funciones | **13 funciones confirmadas** en `supabase/functions/` (excluyendo `_shared/`) — CORRECTO | — | Sin acción |
| **G32** | `ESTADO_ACTUAL.md` línea 306 | "Módulos Compartidos: 7" en `_shared/` | **7 archivos** confirmados: cors.ts, response.ts, errors.ts, logger.ts, rate-limit.ts, audit.ts, circuit-breaker.ts — CORRECTO | — | Sin acción |
| **G33** | `CHECKLIST_CIERRE.md` línea 246 | "Gateway (29 endpoints)" en estructura final | **34 rutas** en `api-minimarket/index.ts` (ver G04 y `docs/METRICS.md`) | Alto | Actualizar conteo |
| **G34** | `ESQUEMA_BASE_DATOS_ACTUAL.md` | "14 tablas principales" + "3 Stored Procedures" | Repo tiene **32 migraciones** que crean muchas más tablas (clientes, pedidos, detalle_pedidos, rate_limit_state, circuit_breaker_state, etc.) y **5+ stored procedures** (sp_movimiento_inventario, sp_aplicar_precio, sp_reservar_stock, sp_acquire_job_lock, sp_release_job_lock, sp_check_rate_limit, etc.) | Alto | Actualizar schema doc con tablas/SPs faltantes |
| **G35** | `DEPLOYMENT_GUIDE.md` línea 48 | `npm run build` para frontend | **Correcto** como alternativa, pero el CI usa `pnpm build` (ver `.github/workflows/ci.yml` línea 154). Docs deberían ser consistentes | Bajo | Alinear con `pnpm build` o documentar ambos |
| **G36** | Directorio raíz | `Nueva carpeta/` existe en la raíz del repo | Contiene archivos de Word y markdown que parecen **accidentales** (Zone.Identifier files, .docx): `gemini.docx`, `de grok.docx`, `INFORME_DEFINITIVO_MEJORAS_MINIMARKET.md`, `PLAN_MEJORAS_UX_FRICTION_REDUCTION.md` | Alto | Eliminar directorio o mover contenido relevante a `docs/` |
| **G37** | `CHECKLIST_CIERRE.md` | Líneas 38–41 duplicadas | "CI con jobs gated" y "Frontend testing completo" aparecen **dos veces** consecutivas | Bajo | Eliminar duplicados |
| **G38** | `ESTADO_ACTUAL.md` línea 330 | "Coverage (vitest v8): 69.39% lines (2026-02-06)" | CHECKLIST_CIERRE línea 42 dice "69.91%". Ambos por debajo del **80% mínimo** declarado en CLAUDE.md | Medio | Reconciliar cifra y documentar gap vs objetivo 80% |
| **G39** | `CLAUDE.md` | "Branches permitidos para deploy: main, staging" | No existe branch `staging` visible. `deploy.sh` soporta `dev/staging/production` como argumentos de entorno, no ramas | Bajo | Clarificar que se refiere a entornos de deploy, no a branches |

---

## 3) CHECKLIST DE CIERRE A PRODUCCIÓN (Definition of Done)

> Cada ítem es verificable. Se indica el comando o evidencia específica.

### A. Build & CI (5 ítems)

- [ ] **A1.** `pnpm -C minimarket-system build` produce build sin errores  
  _Verificar: exit code 0 + directorio `minimarket-system/dist/` generado_

- [ ] **A2.** `pnpm -C minimarket-system lint` pasa sin warnings ni errores  
  _Verificar: exit code 0_

- [ ] **A3.** `npx tsc --noEmit` (desde `minimarket-system/`) pasa sin errores  
  _Verificar: exit code 0_

- [ ] **A4.** CI pipeline (`.github/workflows/ci.yml`) en rama `main` ejecuta y pasa todos los jobs obligatorios: lint, test, build, typecheck, edge-functions-check  
  _Verificar: GitHub Actions → último run en `main` → todos los jobs verdes_

- [ ] **A5.** Build frontend es reproducible desde cero: `pnpm install --frozen-lockfile && pnpm build`  
  _Verificar: ejecutar en directorio limpio_

### B. Tests (6 ítems)

- [ ] **B1.** `npx vitest run tests/unit/` pasa (≥785 tests)  
  _Verificar: exit code 0 + conteo en output_

- [ ] **B2.** `pnpm -C minimarket-system test:components` pasa (≥101 tests)  
  _Verificar: exit code 0 + conteo_

- [ ] **B3.** `npx vitest run --coverage` reporta coverage ≥60% (threshold configurado en `vitest.config.ts`; objetivo declarado 80%)  
  _Verificar: output de coverage + archivo `coverage/index.html`_

- [ ] **B4.** `deno check --no-lock supabase/functions/*/index.ts` pasa para todas las Edge Functions  
  _Verificar: exit code 0 para cada función_

- [ ] **B5.** Tests de integración pasan con credenciales reales: `npm run test:integration` (38 tests)  
  _Verificar: requiere `.env.test` con credenciales; exit code 0_

- [ ] **B6.** Smoke tests E2E pasan: `npm run test:e2e` (4 tests)  
  _Verificar: requiere `.env.test`; exit code 0_

### C. Base de Datos (4 ítems)

- [ ] **C1.** Todas las migraciones aplicadas en producción: `supabase migration list --linked` muestra 32 migraciones sin pendientes  
  _Verificar: output del comando_

- [ ] **C2.** RLS habilitado en todas las tablas críticas (33 policies verificadas)  
  _Verificar: `SELECT count(*) FROM pg_policies WHERE schemaname = 'public'` → ≥33_

- [ ] **C3.** Security Advisor sin ERRORs: WARN≤1, ERROR=0  
  _Verificar: Supabase Dashboard → Security Advisor_

- [ ] **C4.** Stored procedures críticas existen: `sp_movimiento_inventario`, `sp_aplicar_precio`, `sp_reservar_stock`, `sp_acquire_job_lock`, `sp_release_job_lock`, `sp_check_rate_limit`  
  _Verificar: SQL Editor → `SELECT proname FROM pg_proc WHERE proname LIKE 'sp_%'`_

### D. Edge Functions & API (4 ítems)

- [ ] **D1.** Las 13 Edge Functions están desplegadas: `supabase functions list` muestra 13 activas  
  _Verificar: output del comando_

- [ ] **D2.** Health check gateway responde 200: `curl https://<ref>.supabase.co/functions/v1/api-minimarket/health`  
  _Verificar: HTTP 200 + `{"success":true}`_

- [ ] **D3.** Smoke test con JWT real (admin) a endpoint protegido  
  _Verificar: `node scripts/smoke-efectividad-tareas.mjs` → HTTP 200_

- [ ] **D4.** Secretos críticos configurados en Supabase: `supabase secrets list` incluye `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `API_PROVEEDOR_SECRET`, `NOTIFICATIONS_MODE`  
  _Verificar: output del comando_

### E. Documentación (3 ítems)

- [ ] **E1.** Todas las brechas del Gap Report (sección 2) con impacto Alto corregidas  
  _Verificar: re-auditoría de los G01–G39 con impacto Alto_

- [ ] **E2.** `docs/ESTADO_ACTUAL.md` refleja conteos reales de tests, pages, hooks, migraciones, endpoints  
  _Verificar: comparar cifras con `find`/`grep` en repo_

- [ ] **E3.** No existen referencias a archivos inexistentes en docs principales (README, CHECKLIST_CIERRE, CLAUDE.md, copilot-instructions.md)  
  _Verificar: `grep -r` de nombres de archivos referenciados → todos existen_

### F. Seguridad & Operaciones (3 ítems)

- [ ] **F1.** Rotación de secretos planificada o ejecutada antes de producción  
  _Verificar: `docs/SECRET_ROTATION_PLAN.md` completado o diferido con decisión documentada_

- [ ] **F2.** Rollback documentado y validado: `docs/DEPLOYMENT_GUIDE.md` sección 4 con procedimiento probado  
  _Verificar: evidencia en `docs/ROLLBACK_EVIDENCE_2026-01-29.md`_

- [ ] **F3.** `NOTIFICATIONS_MODE=real` configurado en producción  
  _Verificar: `supabase secrets list` → `NOTIFICATIONS_MODE` presente_

---

**Total: 25 ítems verificables**

---

## 4) DOC UPDATE PLAN (Paso a Paso)

### Prioridad 1 — Impacto Alto (brechas críticas, referencias rotas)

| Paso | Doc a actualizar | Acción | Evidencia |
|------|-----------------|--------|-----------|
| **1** | `.env.example` | Cambiar `ALLOWED_ORIGINS=http://localhost:3000` → `http://localhost:5173` | `.env.test.example` ya tiene `5173`; `minimarket-system/vite.config.ts` confirma puerto | 
| **2** | `README.md` | Actualizar: "9 páginas" → "13 páginas", "8 hooks" → "9 hooks", "725 tests" → "785 unit + 101 component", "29 endpoints" → "34 rutas (gateway)", "Frontend 40" → "101 component tests" | Conteo directo de archivos en repo + ESTADO_ACTUAL.md |
| **3** | `.github/copilot-instructions.md` | Actualizar "11 activas" → "13 funciones"; eliminar referencias a `PLAN_WS_DETALLADO.md`, `INVENTARIO_ACTUAL.md`, `BASELINE_TECNICO.md`; actualizar "12 versionadas" → "32 migraciones" | `ls supabase/functions/` + `ls supabase/migrations/` |
| **4** | `CLAUDE.md` | Eliminar referencias a archivos inexistentes: `ROADMAP.md`, `PLAN_WS_DETALLADO.md`, `INVENTARIO_ACTUAL.md`, `BASELINE_TECNICO.md`, `CRON_JOBS_COMPLETOS.md`, `DOCUMENTACION_TECNICA_ACTUALIZADA.md`. Actualizar conteos: tests, migraciones, funciones | Filesystem del repo |
| **5** | `docs/CHECKLIST_CIERRE.md` | Eliminar referencias a archivos inexistentes: `scripts/rls_audit.sql`, `supabase/seed/test-users.sql`, `C0_RISK_REGISTER_MINIMARKET_TEC.md`, `C0_STAKEHOLDERS_MINIMARKET_TEC.md`, `C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md`, `OBJETIVOS_Y_KPIS.md`, `archive/ROADMAP.md`, `archive/ROLLBACK_DRILL_STAGING.md`. Eliminar líneas duplicadas (38–41). Actualizar conteos: migraciones (32), tests (785+101), endpoints (gateway=34; total=43) | Filesystem + `docs/METRICS.md` |
| **6** | `docs/ARCHITECTURE_DOCUMENTATION.md` | Actualizar "8 Edge Functions" → "13 funciones"; actualizar "8 pages" → "13 páginas" | `ls supabase/functions/` + `ls minimarket-system/src/pages/` |
| **7** | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` | Agregar tablas faltantes: `clientes`, `pedidos`, `detalle_pedidos`, `rate_limit_state`, `circuit_breaker_state`, `cron_job_locks`, `stock_reservado_idempotency`, `ofertas`, `bitacora_turnos`, `ventas`, `cuenta_corriente`, etc. Agregar SPs faltantes | Archivos en `supabase/migrations/20260204*`, `20260206*`, `20260207*`, `20260208*` |

### Prioridad 2 — Impacto Medio (datos desactualizados)

| Paso | Doc a actualizar | Acción | Evidencia |
|------|-----------------|--------|-----------|
| **8** | `docs/ESTADO_ACTUAL.md` | Actualizar: "Páginas: 9" → "13", "Hooks Query: 8" → "9", "Componentes: 3" → "8" | Conteo directo en repo |
| **9** | `docs/CHECKLIST_CIERRE.md` | Actualizar métricas históricas con nota: "NOTA: cifras históricas; ver ESTADO_ACTUAL.md para valores actuales" | ESTADO_ACTUAL.md |
| **10** | `README.md` | Actualizar "Última actualización: 2026-02-06" → "2026-02-09" | Fecha actual |
| **11** | `CHANGELOG.md` | Agregar entradas para v1.6.0+ (Pedidos, POS, Ofertas, Bitácora, Rate Limit, Circuit Breaker) — muchos cambios no están registrados desde v1.5.0 | Commits y PRs recientes (#33–#48) |
| **12** | `docs/ESTADO_ACTUAL.md` | Reconciliar coverage: 69.39% vs 69.91% → usar valor más reciente con fecha | Output de `npx vitest run --coverage` |

### Prioridad 3 — Limpieza (bajo impacto, higiene)

| Paso | Doc a actualizar | Acción | Evidencia |
|------|-----------------|--------|-----------|
| **13** | Raíz del repo | Eliminar `Nueva carpeta/` (directorio accidental con .docx y Zone.Identifier files) o mover contenido útil a `docs/` | `ls "Nueva carpeta/"` |
| **14** | `docs/DEPLOYMENT_GUIDE.md` | Alinear comando `npm run build` → `pnpm build` (consistencia con CI) | `.github/workflows/ci.yml` línea 154 |
| **15** | `CLAUDE.md` | Clarificar "Branches permitidos para deploy: main, staging" → son entornos, no branches | `deploy.sh` acepta `dev/staging/production` como argumento |
| **16** | `docs/CHECKLIST_CIERRE.md` línea 304 | Eliminar claims de archivos "movidos a archive/" que no existen (ROADMAP.md, ROLLBACK_DRILL_STAGING.md, COMET_*.md) | `ls docs/archive/` |

---

## Resumen de Impacto

| Impacto | Cantidad de brechas | Archivos afectados |
|---------|--------------------|--------------------|
| **Alto** | 14 | README.md, CLAUDE.md, copilot-instructions.md, CHECKLIST_CIERRE.md, ARCHITECTURE_DOCUMENTATION.md, ESQUEMA_BASE_DATOS_ACTUAL.md, .env.example, "Nueva carpeta" |
| **Medio** | 12 | README.md, ESTADO_ACTUAL.md, CHECKLIST_CIERRE.md, CHANGELOG.md |
| **Bajo** | 6 | CLAUDE.md, DEPLOYMENT_GUIDE.md, README.md |
| **OK (sin acción)** | 3 | ESTADO_ACTUAL.md (Edge Functions, Libs, Módulos Compartidos) |

---

## Notas Finales

1. **Fuente de verdad más confiable:** `docs/ESTADO_ACTUAL.md` — es el doc más actualizado (2026-02-09) pero tiene brechas menores (conteos de páginas/hooks/componentes).
2. **Doc más desactualizado:** `docs/ARCHITECTURE_DOCUMENTATION.md` (v2.1.0, 2026-01-25) — no refleja los cambios de Fases 0–6.
3. **Riesgo principal:** Referencias a archivos inexistentes en docs que se usan como fuente de verdad para agentes IA (CLAUDE.md, copilot-instructions.md).
4. **"Nueva carpeta"** en raíz es un riesgo de higiene — contiene archivos .docx que no deberían estar versionados.
5. **Coverage (69–70%) está por debajo del objetivo declarado (80%)** en CLAUDE.md — requiere decisión explícita: bajar el objetivo o aumentar coverage.
