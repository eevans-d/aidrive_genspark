# C0_DISCOVERY_MINIMARKET_TEC_2026-01-14

**Dominio:** TEC (Software)  
**Nivel MPC:** Intermedio  
**Fecha:** 2026-01-15  
**Fuentes:** docs/INVENTARIO_ACTUAL.md, docs/BASELINE_TECNICO.md, docs/ESTADO_ACTUAL.md, docs/ROADMAP.md, docs/DECISION_LOG.md, docs/CHECKLIST_CIERRE.md  
**Estado:** Draft (sin credenciales productivas)

## 1. Inventario de Activos
- Técnicos/Digitales: repos principal (monorepo), frontend Vite/React/TS (minimarket-system), Supabase Edge Functions (api-minimarket, api-proveedor, scraper-maxiconsumo, cron-jobs-maxiconsumo, auxiliares), DB PostgreSQL Supabase con migraciones versionadas, CI GitHub Actions, tests Vitest + Playwright.
- Humanos (roles): Backend/DevOps, QA, Frontend, DBA; roles de aplicación (admin, supervisor, empleado, anon).
- Físicos: N/A (cloud/SaaS); ambientes locales con Supabase CLI.
- Legales/Financieros: licencias cloud/Supabase; contratos no documentados.

## 2. Stack/Entorno Principal
- Frontend: React 18 + Vite + TS + Tailwind; Playwright para E2E (mocks).
- Backend: Deno/Supabase Edge Functions; shared libs (cors, response, errors, logger, rate-limit, circuit-breaker); gateway hardened.
- DB: Postgres Supabase; migraciones en supabase/migrations; funciones RPC; RLS mínima, auditoría pendiente (D-019).
- CI/CD: GitHub Actions (lint, test, build, typecheck, edge-check, integration gated, e2e manual).
- Testing: Vitest unit/integration/e2e backend; Playwright E2E frontend; suites performance/security/api-contracts legacy (Jest) fuera de CI.
- Limitaciones: falta de credenciales staging/prod; arquitectura desactualizada en docs; observabilidad parcial en cron auxiliares.

## 3. Matriz de Requerimientos (resumen)
- Funcionales: gateway con auth JWT y roles; scraping y comparación de precios; cron de alertas y métricas; frontend con dashboard, stock, tareas, proveedores; conteo correcto y movimientos atómicos; alertas de stock.
- No Funcionales: logging estructurado; métricas básicas; CI reproducible; paginación y select mínimo; seguridad RLS; CORS restrictivo; rate limit; circuit breaker.
- Restricciones: sin credenciales productivas; CI gated; RLS no auditada; migraciones no verificadas en prod; arquitectura referencial no actualizada.
- Deuda: validación runtime alertas/comparaciones; adopción completa de _shared; suites legacy Jest; falta SLO/SLA; falta incident response formal; observabilidad incompleta.

## 4. Stakeholders (ver detalle en C0_STAKEHOLDERS_MINIMARKET_TEC)
- Técnicos: Backend/DevOps (Edge/CI/CD), QA (tests), Frontend (Vite/React), DBA (migraciones/RLS).
- Roles de negocio/app: Admin, Supervisor, Empleado, Anon (RLS/ACL).
- Comunicación: GitHub (issues/PR), documentación en docs/.

## 5. Restricciones
- Técnicas: dependencias en Supabase; falta credenciales; RLS no auditada; logging parcial; Jest legacy puede confundir runners.
- Organizacionales: alcance limitado a roadmap vigente (rolling 90 días); sin múltiples entornos formales documentados.
- Compliance: RLS pendiente; no hay política de datos personales documentada.

## 6. Mapa de Deuda (priorizada)
- D1 (P0): Auditoría RLS tablas P0 sin evidencia.
- D2 (P0): Migraciones staging/prod no verificadas.
- D3 (P0): Validación runtime de alertas/comparaciones.
- D4 (P1): Observabilidad incompleta en cron auxiliares.
- D5 (P1): Suites performance/security/api-contracts en Jest legacy.
- D6 (P1): Arquitectura desactualizada vs estado real.
- D7 (P1): Falta SLO/SLA e Incident Response formal.
- D8 (P1): Paginación/select mínimo pendiente en frontend.
