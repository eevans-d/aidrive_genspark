# DECISION LOG

**Última actualización:** 2026-01-15  
**Propósito:** registrar decisiones para evitar ambigüedad en futuras sesiones.

| ID | Decisión | Estado | Fecha | Nota |
|----|----------|--------|-------|------|
| D-001 | Framework de tests unitarios = **Vitest** | Aprobada | 2026-01-09 | Unifica scripts y CI. |
| D-002 | Lockfiles requeridos (`package-lock.json`, `minimarket-system/pnpm-lock.yaml`) | Aprobada | 2026-01-09 | Reproducibilidad CI/local. |
| D-003 | Estrategia de ramas = **solo `main`** | Aprobada | 2026-01-09 | Simplifica delivery. |
| D-004 | Runner de integración (Vitest + Supabase local) | Aprobada | 2026-01-09 | Confirmado por usuario. |
| D-005 | Estándar de logging: `_shared/logger` + `requestId/jobId/runId` | Aprobada | 2026-01-09 | Confirmado por usuario. |
| D-006 | Cobertura mínima: **80% módulos críticos**, **60% total** | Aprobada | 2026-01-09 | Confirmado por usuario. |
| D-007 | `precios_proveedor` se usa para scraping (Maxiconsumo/locales); precios de compra internos quedan como `precios_compra_proveedor` (pendiente) | Aprobada | 2026-01-10 | Evita colisión entre scraping y compras. |
| D-008 | `comparacion_precios` mantiene schema simplificado (sin `proveedor_id` y campos avanzados) hasta activar comparación multi-proveedor | Aprobada | 2026-01-10 | Documentación alineada a implementación actual. |
| D-009 | Gateway exige JWT con rol válido para endpoints de lectura/escritura (sin rol por defecto) | Aprobada | 2026-01-10 | Refuerza control de acceso en `api-minimarket`. |
| D-010 | API proveedor es interna: auth por shared secret + CORS allowlist; check por header es temporal y debe reemplazarse por verificacion real en FASE 7/8 | Aprobada | 2026-01-11 | Hardening pendiente: validar token real y restringir origenes. |
| D-011 | E2E/Integración bloqueados sin `.env.test` real; usar `npm run test:unit` o `--dry-run` hasta tener claves | Aprobada | 2026-01-11 | Evita fallos al carecer de credenciales de Supabase. |
| D-012 | Se habilita roadmap “sin credenciales”: solo unit tests, dry-run, y hardening estático hasta que se entreguen claves reales | Aprobada | 2026-01-11 | Define alcance temporal mientras se esperan variables reales. |
| D-013 | **Gateway api-minimarket**: usa JWT de usuario para RLS (no service role); rate limit 60 req/min; circuit breaker integrado | Aprobada | 2026-01-12 | Hardening completo del gateway principal. |
| D-014 | **CORS restrictivo en gateway**: bloquea requests browser sin `Origin`; requiere `ALLOWED_ORIGINS` env var | Aprobada | 2026-01-12 | Evita fallback permisivo; server-to-server sin Origin permitido. |
| D-015 | **CI gated jobs**: integration/E2E solo corren con `workflow_dispatch` o `vars.RUN_*_TESTS=true` | Aprobada | 2026-01-12 | Evita fallos CI por falta de secrets; jobs obligatorios siguen corriendo. |
| D-016 | **Carpetas Jest legacy** (`tests/performance/`, `tests/security/`, `tests/api-contracts/`) marcadas con README y desactivadas de CI | Aprobada | 2026-01-12 | Clarifica qué suites están activas vs legacy. |
| D-017 | **API_PROVEEDOR_READ_MODE**: api-proveedor usa `anon` por defecto para lecturas; `service` solo para escrituras (sincronizar/cache persistente) | Aprobada | 2026-01-13 | Reduce exposición de service role key; hardening PROMPT 3. |
| D-018 | **SCRAPER_READ_MODE**: scraper-maxiconsumo usa `anon` por defecto para lecturas; `service` solo para escrituras | Aprobada | 2026-01-13 | Implementado: readKey/writeKey separados en index.ts y storage.ts. Fallback a service con warning si falta ANON_KEY. |
| D-019 | **Auditoría RLS pendiente**: checklist y scripts preparados en `docs/AUDITORIA_RLS_CHECKLIST.md` y `scripts/rls_audit.sql`; requiere credenciales para ejecutar | Pendiente | 2026-01-13 | Tablas P0 sin verificar: productos, stock_deposito, movimientos_deposito, precios_historicos, proveedores, personal. |
| D-020 | **Retiro Jest legacy**: eliminar deps Jest de `tests/package.json` y mantener el archivo como wrapper | Aprobada | 2026-01-15 | Vitest es runner único; Jest legacy desactivado. |
| D-021 | **WS5.6 caching diferido**: no implementar React Query/SWR hasta tener métricas reales | Aprobada | 2026-01-15 | Priorizar paginación (WS5.5) primero. |
| D-022 | **console.* en cron-testing-suite**: permitidos permanentemente para debugging de suite | Aprobada | 2026-01-15 | Excepción controlada para testing-suite. |
| D-023 | **--dry-run en scripts**: integration/E2E soportan `--dry-run` que valida prereqs sin ejecutar | Aprobada | 2026-01-15 | Permite verificar configuración sin Supabase real. |

---

## Siguientes Pasos (2026-01-13)

### Pendientes SIN credenciales (priorizados)

| Prioridad | Tarea | Comando/Ruta | Estado |
|-----------|-------|--------------|--------|
| ~~P0~~ | ~~Refactor SCRAPER_READ_MODE (D-018)~~ | ~~`supabase/functions/scraper-maxiconsumo/storage.ts`, `index.ts`~~ | ✅ Completado |
| P1 | Ampliar tests unitarios de scraper (HTML vacío, timeouts) | `tests/unit/scraper-*.test.ts` | Pendiente |
| P1 | Migrar suites performance/security a Vitest | `tests/performance/`, `tests/security/` | Pendiente |
| P2 | Documentar flujos E2E frontend en `minimarket-system/e2e/README.md` | Ya creado, ampliar | Parcial |

### Pendientes CON credenciales (requieren `.env.test` o acceso Supabase)

| Prioridad | Tarea | Checklist/Script | Bloqueador |
|-----------|-------|------------------|------------|
| P0 | Ejecutar auditoría RLS (D-019) | `docs/AUDITORIA_RLS_CHECKLIST.md`, `scripts/rls_audit.sql` | Credenciales Supabase |
| P0 | Verificar migraciones en staging/prod (WS3.1) | `migrate.sh`, checklist en DEPLOYMENT_GUIDE | Acceso entorno |
| P1 | Tests de integración reales | `npm run test:integration` | `.env.test` con claves |
| P1 | E2E smoke con Supabase local | `npm run test:e2e` | Supabase CLI + claves |
| P2 | Validación runtime de alertas/comparaciones (WS4.1) | `cron-jobs-maxiconsumo/jobs/realtime-alerts.ts` | Datos reales |

### Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| RLS no validada en tablas P0 | Alto - datos expuestos | Ejecutar `scripts/rls_audit.sql` al obtener credenciales |
| ~~Service role expuesto en scraper~~ | ~~Medio - abuso potencial~~ | ✅ D-018 implementado |
| Tests integration/E2E no corren en CI | Medio - regresiones ocultas | Activar `vars.RUN_INTEGRATION_TESTS` al tener secrets |
| Migraciones no verificadas en prod | Alto - inconsistencia DB | WS3.1 con checklist obligatorio antes de deploy |

---

## Resumen de sesión (2026-01-13)

**Ejecutado (4 PROMPTs sin credenciales):**
1. ✅ E2E frontend: 8 tests Playwright con mocks (`minimarket-system/e2e/`)
2. ✅ CI/Runbook: documentación E2E en OPERATIONS_RUNBOOK.md
3. ✅ Hardening api-proveedor/scraper: +46 tests unitarios (D-017, D-018)
4. ✅ Auditoría RLS: checklist + script SQL preparados (D-019)

**Verificación post-ejecución:**
- `npm test` → **193 tests unitarios OK** (13 archivos)
- `pnpm test:e2e:frontend` → **8 tests Playwright OK**
- Git status: 7 archivos modificados, 4 archivos nuevos (untracked)

**Archivos nuevos:**
- `tests/unit/api-proveedor-read-mode.test.ts` (34 tests)
- `tests/unit/scraper-storage-auth.test.ts` (12 tests)
- `docs/AUDITORIA_RLS_CHECKLIST.md` (368 líneas)
- `minimarket-system/e2e/tareas.proveedores.spec.ts` (2 tests)