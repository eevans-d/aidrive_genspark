# DECISION LOG

**Última actualización:** 2026-01-26  
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
| D-025 | **Patrón de acceso a datos frontend**: lecturas directas a Supabase vía RLS; escrituras SIEMPRE vía Gateway | Aprobada | 2026-01-23 | Balance entre performance (lecturas) y control (escrituras). Ver detalle abajo. |
| D-026 | **`npm audit` documentado** (vulnerabilidades dev en rollup/vite aceptadas) | Aprobada | 2026-01-23 | Evidencia referenciada en `docs/ROADMAP.md` y `docs/CHECKLIST_CIERRE.md`. |
| D-022 | **console.* en cron-testing-suite**: permitidos permanentemente para debugging de suite | Aprobada | 2026-01-15 | Excepción controlada para testing-suite. **Actualizado:** se migró a `_shared/logger` (2026-01-22). |
| D-023 | **--dry-run en scripts**: integration/E2E soportan `--dry-run` que valida prereqs sin ejecutar | Aprobada | 2026-01-15 | Permite verificar configuración sin Supabase real. |
| D-027 | **ALLOWED_ORIGINS local-only**: lista exacta `http://localhost:5173,http://127.0.0.1:5173` | Aprobada | 2026-01-23 | Si se agrega dominio publico, registrar cambio y actualizar Supabase/CI. |
| D-028 | **API_PROVEEDOR_SECRET unico y alineado** entre Supabase, GitHub Actions y `.env.test` | Aprobada | 2026-01-24 | Regenerado y alineado (2026-01-24). Registrar futuras rotaciones. |
| D-029 | **Roles server-side**: usar solo `app_metadata.role` (sin fallback a `user_metadata`) | Aprobada | 2026-01-25 | WS7.5 aplicado en `api-minimarket` auth helper. |
| D-030 | **TEST_PASSWORD re-sincronizado** para usuarios E2E (staging) | Completada | 2026-01-26 | Password actualizado en Auth + `.env.test`; E2E auth real revalidado. |
| D-031 | **Owners + rotación de secretos** documentados (M10) | Completada | 2026-01-26 | Owners y ventana de rotación definidos en `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`. |

---

## Siguientes Pasos (2026-01-25)

### Pendientes actuales

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | Probar rollback en staging (OPS-SMART-1) | `docs/DEPLOYMENT_GUIDE.md` | Pendiente (intento 2026-01-26: status OK; rollback no ejecutado) |
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
| **Escrituras (INSERT/UPDATE/DELETE)** | Gateway obligatorio | Audit log, validación centralizada, control de negocio |
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
✅ RLS verificada para tablas críticas (auditoría completa D-019)
