# DECISION LOG

**Última actualización:** 2026-01-31  
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
| D-019 | **Auditoría RLS ejecutada**: checklist y scripts en `docs/AUDITORIA_RLS_CHECKLIST.md` y `scripts/rls_audit.sql` | Completada | 2026-01-23 | Tablas P0 verificadas y protegidas. |
| D-020 | **Retiro Jest legacy**: eliminar deps Jest de `tests/package.json` y mantener el archivo como wrapper | Aprobada | 2026-01-15 | Vitest es runner único; Jest legacy desactivado. |
| D-021 | **WS5.6 caching diferido**: no implementar React Query/SWR hasta tener métricas reales | Aprobada | 2026-01-15 | Priorizar paginación (WS5.5) primero. |
| D-024 | **React Query consolidado** en páginas críticas (8/8 con data; Login no aplica) | Aprobada | 2026-01-22 | Se revierte la postergación inicial de D-021. |
| D-025 | **Patrón de acceso a datos frontend**: lecturas directas a Supabase vía RLS; escrituras vía Gateway (excepción: alta inicial en `personal` durante signUp) | Aprobada | 2026-01-23 | Balance entre performance (lecturas) y control (escrituras). Ver detalle abajo. |
| D-026 | **`npm audit` documentado** (vulnerabilidades dev en rollup/vite aceptadas) | Aprobada | 2026-01-23 | Evidencia referenciada en `docs/archive/ROADMAP.md` y `docs/CHECKLIST_CIERRE.md`. |
| D-022 | **console.* en cron-testing-suite**: permitidos permanentemente para debugging de suite | Aprobada | 2026-01-15 | Excepción controlada para testing-suite. **Actualizado:** se migró a `_shared/logger` (2026-01-22). |
| D-023 | **--dry-run en scripts**: integration/E2E soportan `--dry-run` que valida prereqs sin ejecutar | Aprobada | 2026-01-15 | Permite verificar configuración sin Supabase real. |
| D-027 | **ALLOWED_ORIGINS local-only**: lista exacta `http://localhost:5173,http://127.0.0.1:5173` | Aprobada | 2026-01-23 | Si se agrega dominio publico, registrar cambio y actualizar Supabase/CI. |
| D-028 | **API_PROVEEDOR_SECRET unico y alineado** entre Supabase, GitHub Actions y `.env.test` | Aprobada | 2026-01-24 | Regenerado y alineado (2026-01-24). Registrar futuras rotaciones. |
| D-029 | **Roles server-side**: usar solo `app_metadata.role` (sin fallback a `user_metadata`) | Aprobada | 2026-01-25 | WS7.5 aplicado en `api-minimarket` auth helper. |
| D-030 | **TEST_PASSWORD re-sincronizado** para usuarios E2E (staging) | Completada | 2026-01-26 | Password actualizado en Auth + `.env.test`; E2E auth real revalidado. |
| D-031 | **Owners + rotación de secretos** documentados (M10) | Completada | 2026-01-26 | Owners y ventana de rotación definidos en `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`. |
| D-032 | **Secretos obtenidos desde Supabase** y validados sin exponer valores | Completada | 2026-01-29 | `SUPABASE_*`, `DATABASE_URL`, `API_PROVEEDOR_SECRET`, `ALLOWED_ORIGINS` obtenidos/cargados; validación mínima OK (status + dry-run). |
| D-033 | Ejecutar rollback de `create_stock_aggregations` en STAGING | Completada | 2026-01-30 | Rollback SQL manual ejecutado; evidencia en `docs/ROLLBACK_EVIDENCE_2026-01-29.md`. |
| D-034 | **Remediación Security Advisor (RLS)** en STAGING | Completada (verificada) | 2026-01-30 | Snapshot DESPUÉS capturado (JSON traducido por UI): RLS 6/6 + 6 policies + sin grants `anon` en esas tablas. |
| D-035 | **Auditoría RLS Lite** detecta gaps P0 | Completada | 2026-01-30 | Gaps cerrados por remediación role-based (ver D-036). |
| D-036 | **RLS role-based v2 aplicada y verificada** | Completada | 2026-01-31 | `anon` revocado en tablas críticas, 30 policies activas, post-check OK. Evidencia: `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`. |
| D-037 | **Migración versionada RLS role-based v2** | Completada | 2026-01-31 | Aplicada en PROD y verificada (04:06–04:15 UTC). Archivo: `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql`. |
| D-038 | **Security Advisor en PROD con alertas no críticas** | Aprobada | 2026-01-31 | 5 ERROR (vistas SECURITY DEFINER), 7 WARN (funciones + Auth), 15 INFO (tablas internas sin policies). Acciones recomendadas sin bloqueo. Evidencia: Parte 7 en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`. |
| D-039 | **Mitigación de alertas no críticas (Advisor)** | Completada | 2026-01-31 | search_path fijado, security_invoker en vistas, anon grants revocados; ERROR=0, WARN=2, INFO=15. Pendiente manual: leaked password protection. Evidencia: Parte 8 en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`. |
| D-040 | **Migración para mitigaciones Advisor** | Aprobada | 2026-01-31 | Archivo creado: `supabase/migrations/20260131020000_security_advisor_mitigations.sql` (pendiente aplicar/validar). |
| D-041 | **Consolidación de planificación en Hoja de Ruta MADRE** | Completada | 2026-01-31 | Se creó `docs/HOJA_RUTA_MADRE_2026-01-31.md` y se retiraron planes antiguos (`HOJA_RUTA_30_PASOS.md`, `PLAN_PENDIENTES_DEFINITIVO.md`, `HOJA_RUTA_UNIFICADA_2026-01-30.md`). |

---

## Siguientes Pasos (2026-01-31)

### Pendientes actuales

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | Habilitar leaked password protection (Auth) | Supabase Dashboard | Pendiente |
| P1 | Aplicar/validar migración mitigaciones Advisor | `supabase/migrations/20260131020000_security_advisor_mitigations.sql` | Pendiente |
| P1 | Evaluar rotación si hubo exposición histórica de claves | Supabase Dashboard | Pendiente |

---

## Siguientes Pasos (2026-01-30)

### Pendientes actuales

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | Revisar Security Advisor (RLS/tabla pública) | `docs/SECURITY_ADVISOR_REVIEW_2026-01-30.md` | En verificación (gaps P0 detectados) |
| P1 | Revalidar RLS post-remediación (snapshot literal + `scripts/rls_audit.sql`) | `docs/SECURITY_ADVISOR_REVIEW_2026-01-30.md` | Snapshot literal OK; auditoría completa pendiente |
| P0 | Remediar policies/grants en `productos`, `proveedores`, `categorias` | `docs/SECURITY_ADVISOR_REVIEW_2026-01-30.md` | Pendiente |
| P1 | Evaluar rotación si hubo exposición histórica de claves | Supabase Dashboard | Pendiente |

---

## Siguientes Pasos (2026-01-29)

### Pendientes actuales

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | Evaluar rotación si hubo exposición histórica de claves | Supabase Dashboard | Pendiente |

| P1 | Probar rollback en staging (OPS-SMART-1) | `docs/DEPLOYMENT_GUIDE.md` | ✅ Completado (2026-01-30) |
## Siguientes Pasos (2026-01-25)

### Pendientes actuales

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | Probar rollback en staging (OPS-SMART-1) | `docs/DEPLOYMENT_GUIDE.md` | ✅ Completado (2026-01-30) |
| P1 | Rotar credenciales expuestas históricamente en docs (Supabase keys) | Supabase Dashboard | Pendiente (manual) |
| P1 | Sincronizar `TEST_PASSWORD` en Supabase Auth y revalidar E2E auth real | Supabase Dashboard | ✅ Completado (2026-01-26) |
| P1 | Definir owners y rotacion de secretos (M10) | `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md` | ✅ Completado (2026-01-26) |

---

## Siguientes Pasos (2026-01-13) - Histórico

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
| P0 | ~~Ejecutar auditoría RLS (D-019)~~ | `docs/AUDITORIA_RLS_CHECKLIST.md`, `scripts/rls_audit.sql` | ✅ Completado 2026-01-23 |
| P0 | ~~Verificar migraciones en staging/prod (WS3.1)~~ | `migrate.sh`, checklist en DEPLOYMENT_GUIDE | ✅ Completado 2026-01-23 |
| P1 | ~~Tests de integración reales~~ | `npm run test:integration` | ✅ Completado 2026-01-23 |
| P1 | ~~E2E smoke con Supabase local~~ | `npm run test:e2e` | ✅ Completado 2026-01-23 |
| P2 | ~~Validación runtime de alertas/comparaciones (WS4.1)~~ | `cron-jobs-maxiconsumo/jobs/realtime-alerts.ts` | ✅ Completado 2026-01-23 |

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

---

## D-025: Patrón de Acceso a Datos Frontend

### Contexto

El frontend necesita decidir cómo acceder a los datos:
1. **Lecturas directas a Supabase** (hooks React Query con `supabase.from()`)
2. **Todo via Gateway** (`apiClient.ts` → `api-minimarket`)

### Decisión

**Patrón híbrido:**

| Operación | Canal | Justificación |
|-----------|-------|---------------|
| **Lecturas (SELECT)** | Supabase directo | RLS protege datos; menor latencia; menos carga en gateway |
| **Escrituras (INSERT/UPDATE/DELETE)** | Gateway obligatorio *(excepción: alta inicial en `personal` durante signUp)* | Audit log, validación centralizada, control de negocio |
| **RPCs complejas** | Gateway | Centraliza lógica, evita exponer RPCs a frontend |

### Implementación Actual

```
minimarket-system/src/
├── hooks/queries/         # Lecturas directas (8 hooks)
│   ├── useStock.ts        → supabase.from('stock_deposito')
│   ├── useProductos.ts    → supabase.from('productos')
│   └── ...
├── lib/
│   ├── supabase.ts        # Cliente Supabase (anon key)
│   └── apiClient.ts       # Gateway (escrituras)
├── contexts/
│   └── AuthContext.tsx    # Excepción: insert a `personal` en signUp
```

### Razones

1. **RLS ya protege lecturas**: las políticas `USING(auth.uid() = ...)` aseguran que usuarios solo vean datos permitidos
2. **Gateway para writes**: el audit log y validaciones de negocio justifican el overhead
3. **Performance**: lecturas directas eliminan hop intermedio (frontend→gateway→supabase)
4. **Simplicidad**: hooks de React Query son más simples que wrappers de gateway

### Alternativa Descartada

Mover TODAS las operaciones al gateway implicaría:
- Duplicar lógica RLS en TypeScript
- Aumentar latencia de lecturas
- Más código de mantenimiento
- Sin beneficio real (RLS ya existe)

### Migración futura (no planificada)

Si se requiere:
1. Cachear respuestas en gateway con Redis
2. Agregar transformaciones server-side
3. Unificar para mobile apps (que no pueden usar RLS)

Entonces migrar lecturas al gateway.

### Validación

✅ 8 hooks de lectura usan Supabase directo
✅ `apiClient.ts` tiene métodos para escrituras (stock.ajustar, movimientos.registrar, etc.)
⚠️ Excepción actual: `AuthContext.tsx` crea registro en `personal` al signUp (write directo)
✅ RLS verificada para tablas críticas (auditoría completa D-019)
