# 🔷 BATERÍA DE PROMPTS v4.1 — AIDRIVE_GENSPARK
## Auditoría Forense Final & Validación Real de Producción

> Generado: 2026-02-10 — Verificado contra commit `3b1a8b0` (HEAD main) del repositorio `eevans-d/aidrive_genspark`
> Verificación: doble pasada automática contra código real, Supabase Cloud API, y filesystem

---

## CONTEXTO VERIFICADO DEL PROYECTO

| Variable | Valor verificado |
|----------|-----------------|
| Repo | `eevans-d/aidrive_genspark` |
| Stack | React + Vite + TS (frontend) · Supabase Edge Functions/Deno (backend) · PLpgSQL · Vitest |
| Estado | ~95% desarrollado, fase de auditoría forense |
| Usuario final | Operador/dueño de minimarket (no técnico, hispanohablante) |
| Producción | Supabase Cloud (`dqaygmjpzoqjjrywdsxi`) + hosting estático |
| Edge Functions | **13 desplegadas**, todas ACTIVE |
| CI/CD | GitHub Actions: lint + agent-skills + test + build + typecheck + edge-functions-check (6 obligatorios) + 3 opcionales (integration, e2e, e2e-frontend) |
| Migraciones | **33** archivos SQL versionados en `supabase/migrations/` |
| Tests | **71 archivos** de test total (55 en `tests/` + 16 frontend) — framework 100% Vitest |
| Docs | **115 archivos** en `docs/` (46 raíz + 10 archive + 2 audit + 42 closure + 1 db + 14 mpc) |

### Edge Functions confirmadas (13) — datos de Supabase Cloud API

| Función | verify_jwt | Versión | Estado |
|---------|-----------|---------|--------|
| `api-minimarket` | **false** | v20 | ACTIVE |
| `cron-jobs-maxiconsumo` | true | v12 | ACTIVE |
| `cron-notifications` | true | **v12** | ACTIVE |
| `api-proveedor` | true | v11 | ACTIVE |
| `scraper-maxiconsumo` | true | v11 | ACTIVE |
| `alertas-stock` | true | v10 | ACTIVE |
| `alertas-vencimientos` | true | v10 | ACTIVE |
| `cron-dashboard` | true | v10 | ACTIVE |
| `cron-health-monitor` | true | v10 | ACTIVE |
| `cron-testing-suite` | true | v10 | ACTIVE |
| `notificaciones-tareas` | true | v10 | ACTIVE |
| `reportes-automaticos` | true | v10 | ACTIVE |
| `reposicion-sugerida` | true | v10 | ACTIVE |

### `_shared/` verificado (7 módulos)

`audit.ts` · `circuit-breaker.ts` · `cors.ts` · `errors.ts` · `logger.ts` · `rate-limit.ts` · `response.ts`

**Adopción real por módulo:**

| Módulo _shared | Funciones que lo usan | Cobertura |
|---|---|---|
| `logger.ts` | **13/13** | 100% ✅ |
| `cors.ts` | **11/13** | 85% (faltan: cron-testing-suite, cron-jobs-maxiconsumo) |
| `response.ts` | **7/13** | 54% (faltan: scraper-maxiconsumo, cron-dashboard, cron-health-monitor, cron-notifications, cron-testing-suite, cron-jobs-maxiconsumo) |
| `rate-limit.ts` | **4/13** | 31% (api-minimarket, api-proveedor, cron-notifications, scraper-maxiconsumo) |
| `circuit-breaker.ts` | **4/13** | 31% (api-minimarket, api-proveedor, scraper-maxiconsumo, cron-jobs-maxiconsumo) |
| `errors.ts` | **2/13** | 15% (api-minimarket, api-proveedor) |
| `audit.ts` | **1/13** | 8% (solo api-minimarket) |

### `api-minimarket` — estructura modularizada (5767 líneas total)

```
api-minimarket/
├── index.ts              (2184 líneas — orquestador principal + rutas legacy)
├── handlers/             (10 archivos: bitacora, clientes, cuentas_corrientes, insights, ofertas, pedidos, reservas, search, utils, ventas)
├── helpers/              (5 archivos: auth, index, pagination, supabase, validation)
└── routers/              (6 archivos: index, deposito, productos, stock, tareas, types)
```

**Nota:** El `index.ts` sigue teniendo 2184 líneas — la modularización extrajo handlers y routers pero el archivo principal sigue siendo grande con rutas legacy.

### Páginas frontend verificadas (16 archivos en `src/pages/`)

`Clientes` · `Dashboard` · `Deposito` · `Kardex` · `Login` · `Pedidos` · `Pocket` · `Pos` · `Productos` · `Proveedores` · `Rentabilidad` · `Stock` · `Tareas`

Más 3 archivos de test colocados en pages: `Dashboard.test.tsx`, `Login.test.tsx`, `Tareas.optimistic.test.tsx`

**Páginas NO mencionadas en el documento original:** `Clientes.tsx`, `Pocket.tsx`, `Rentabilidad.tsx`

### Tests verificados — inventario completo

| Ubicación | Archivos | Framework | CI |
|---|---|---|---|
| `tests/unit/` | **46** `.test.ts` | Vitest 4.0.18 | ✅ Obligatorio |
| `tests/integration/` | **3** `.test.ts` | Vitest 4.0.18 | ⚠️ Opcional (gated) |
| `tests/e2e/` | **3** (`2` `.test.ts` + `1` `.test.js`) | Vitest 4.0.18 | ⚠️ Opcional (gated) |
| `tests/performance/` | **1** `.vitest.test.ts` | Vitest auxiliary | ⚠️ Opcional |
| `tests/security/` | **1** `.vitest.test.ts` | Vitest auxiliary | ⚠️ Opcional |
| `tests/api-contracts/` | **1** `.vitest.test.ts` | Vitest auxiliary | ⚠️ Opcional |
| `minimarket-system/src/` | **16** `.test.ts(x)` | Vitest + jsdom + MSW | Via `pnpm test:components` |
| **Total** | **71 archivos** | 100% Vitest (no hay Jest) | — |

**Archivos unit test (`tests/unit/`):** shared-cors, shared-errors, shared-logger, shared-response, shared-audit, shared-circuit-breaker, shared-rate-limit, gateway-auth, gateway-pagination, gateway-validation, api-ofertas, api-bitacora, api-ventas-pos, api-reservas-concurrencia, api-reservas-integration, api-proveedor-routing, api-proveedor-auth, api-proveedor-health, api-proveedor-read-mode, auth-resilient, boundary-edge-cases, circuit-breaker-shared, cron-health-monitor, cron-jobs-execution-log, cron-jobs-handlers, cron-jobs-locking, cron-jobs, cron-notifications, cron-validators, frontend-hooks, frontend-utils, integration-contracts, pedidos-handlers, rate-limit-shared, resilience-gaps, scraper-alertas, scraper-anti-detection, scraper-cache, scraper-config, scraper-cookie-jar, scraper-matching, scraper-parsing-edge-cases, scraper-parsing, scraper-storage-auth, security-gaps, strategic-high-value

**Frontend tests (`minimarket-system/src/`):** 3 pages (Dashboard, Login, Tareas.optimistic) + 3 components (ErrorBoundary, ErrorMessage, Layout) + 8 hooks (useDashboardStats, useDeposito, useKardex, useProductos, useProveedores, useRentabilidad, useStock, useTareas) + 2 lib (apiClient, roles)

**Setup MSW:** `minimarket-system/src/setupTests.ts` mockea endpoints Supabase + handlers para productos, tareas, stock, auth.

### Docs verificados — estructura real

```
docs/                    — 46 archivos en raíz
├── archive/             — 10 archivos (ROADMAP.md histórico, reality checks, etc.)
├── audit/               — 2 archivos (evidence report, gap matrix)
├── closure/             — 42 archivos (baselines, mega-plans, execution logs, etc.)
├── db/                  — 1 archivo (README stock aggregations)
└── mpc/                 — 14 archivos (C0-C4 MPC lifecycle + subplans E1-E9)
Total: 115 archivos
```

### Migraciones verificadas (33 archivos)

Desde `20250101000000_version_sp_aplicar_precio.sql` hasta `20260209000000_fix_sp_reservar_stock_on_conflict.sql`. Incluyen las últimas: `20260208020000_add_rate_limit_state.sql`, `20260208030000_add_circuit_breaker_state.sql`, `20260209000000_fix_sp_reservar_stock_on_conflict.sql`.

### CI/CD Pipeline verificado (`ci.yml` — 407 líneas)

**Jobs obligatorios (6):**
1. `lint` — ESLint en frontend
2. `agent-skills` — Lint de skills + config Python
3. `test` — `npx vitest run tests/unit/` + coverage
4. `build` — `pnpm build` frontend (needs: lint, test)
5. `typecheck` — `tsc --noEmit` frontend
6. `edge-functions-check` — `deno check --no-lock` cada Edge Function

**Jobs opcionales (3, gated):**
7. `integration` — Vitest `tests/integration/` (requiere secrets + flag)
8. `e2e` — Vitest `tests/e2e/` (requiere manual dispatch + secrets)
9. `e2e-frontend` — Playwright con mocks (requiere flag, sin secrets)

### Pendientes conocidos y verificados

1. `_shared/response.ts` NO usado por 4 funciones cron (notifications, testing-suite, dashboard, health-monitor) — usan `new Response()` directo
2. `_shared/errors.ts` solo 2 funciones (api-minimarket, api-proveedor)
3. `_shared/audit.ts` solo 1 función (api-minimarket)
4. `api-minimarket/index.ts` todavía tiene **2184 líneas** — modularización parcial, no completa
5. `cron-notifications` v12 (corregido, no v11)
6. 3 páginas frontend sin documentar: `Clientes.tsx`, `Pocket.tsx`, `Rentabilidad.tsx`
7. `ErrorMessage` NO está en todas las páginas — falta en: Clientes, Deposito, Login, Pedidos, Pocket, Pos
8. Skeleton loading solo en 5 páginas: Dashboard, Pedidos, Productos, Stock, Tareas
9. Frontend @supabase/supabase-js en v2.95.3, Edge Functions fijas en v2.39.3 — discrepancia de versiones

---

## 📊 ÍNDICE DE PROMPTS (26 prompts, 6 fases + cierre)

| # | Fase | Nombre |
|---|------|--------|
| A1 | Auditoría | Inventario Funcional Real vs Declarado |
| A2 | Auditoría | Mapa de Pendientes con Criticidad |
| A3 | Auditoría | Detección de Funcionalidad Fantasma |
| B1 | Validación | Simulación de Jornada del Operador |
| B2 | Validación | Flujos Críticos E2E |
| B3 | Validación | Utilidad Real de Outputs |
| B4 | Validación | Condiciones Adversas Reales |
| C1 | Detalles | Manejo de Errores y Feedback |
| C2 | Detalles | Consistencia de Datos |
| C3 | Detalles | UX para Usuario No-Técnico |
| C4 | Detalles | Dependencias Externas |
| D1 | Optimización | Performance Real |
| D2 | Optimización | Código Muerto |
| D3 | Optimización | Seguridad |
| D4 | Optimización | UX Final |
| E1 | Producción | Checklist de Despliegue |
| E2 | Producción | Variables y Secrets |
| E3 | Producción | Logging y Monitoreo |
| E4 | Producción | Rollback |
| F1 | Utilidad | ¿Resuelve el Problema Real? |
| F2 | Utilidad | ¿Valor desde el Minuto 1? |
| F3 | Utilidad | Funcionalidad que Nadie Usará |
| Ω | Cierre | Checklist Definitivo de Confianza |

---

## 🔄 SECUENCIA DE EJECUCIÓN

```
FASE A (en paralelo) ──→ FASE C (en paralelo) ──→ FASE B (secuencial)
  A1 + A2 + A3              C1 + C2 + C3 + C4       B1→B2→B3→B4
                                                          │
FASE D (secuencial) ──→ FASE E (secuencial) ──→ FASE F + Ω
  D2→D3→D1→D4           E2→E1→E3→E4            F1→F2→F3→Ω
```

---

## 📝 PROMPTS COMPLETOS

---

### A1 — INVENTARIO FUNCIONAL REAL VS DECLARADO

**Objetivo:** Comparar lo declarado como "implementado" en docs vs lo que REALMENTE funciona en el código.

**Rol:** Auditor Forense — escéptico profesional. Si un checklist dice "✓", verificar el código real.

**Pasos:**
1. Extraer funcionalidad declarada de `docs/CHECKLIST_CIERRE.md`, `docs/ESTADO_ACTUAL.md`
2. Para cada funcionalidad: ¿existe el archivo? ¿tiene imports correctos? ¿es invocable desde un entry point? ¿tiene test en `tests/unit/`?
3. Mapear las **13** Edge Functions contra uso real:
   - `api-minimarket` → ¿`index.ts` (2184 líneas) + handlers (10) + routers (6) cubren los endpoints de `docs/API_README.md`?
   - `api-proveedor` → ¿router.ts + handlers (9: alertas, comparacion, configuracion, estadisticas, health, precios, productos, sincronizar, status) responden?
   - `scraper-maxiconsumo` → ¿los 9 módulos (types, config, cache, anti-detection, parsing, matching, alertas, storage, scraping) + orquestador index.ts (340 líneas) + utils/cookie-jar.ts están conectados?
   - `cron-jobs-maxiconsumo` → ¿index.ts + orchestrator.ts + jobs (daily-price-update, maintenance, realtime-alerts, weekly-analysis) + config.ts + execution-log.ts + types.ts + validators.ts funcionan? (10 archivos total)
   - `alertas-vencimientos`, `reposicion-sugerida` → ¿funcionales o stubs?
   - `cron-testing-suite` (1424 líneas), `cron-notifications` (1282 líneas), `cron-dashboard` (1283 líneas), `cron-health-monitor` (958 líneas) → ¿implementados o parciales?
4. Verificar **33** migraciones en `supabase/migrations/` crean todas las tablas referenciadas
5. Verificar que **13** páginas en `src/pages/` (Clientes, Dashboard, Deposito, Kardex, Login, Pedidos, Pocket, Pos, Productos, Proveedores, Rentabilidad, Stock, Tareas) tienen ruta en App.tsx y queries a tablas existentes

**Salida:** Tabla: `Funcionalidad | Declarada en | Código existe | Invocable | Testeada | Veredicto (REAL/FANTASMA/PARCIAL)`

**Anti-patrones:** ❌ No asumir existencia = completitud · ❌ No confiar en `// ✓` sin verificar · ❌ No contar test con `skip` como "testeada"

---

### A2 — MAPA DE PENDIENTES CON CRITICIDAD

**Objetivo:** Mapear TODOS los pendientes clasificados por impacto en el operador del minimarket.

**Rol:** QA Lead — clasifica por IMPACTO EN USUARIO FINAL, no por dificultad técnica.

**Pasos:**
1. Buscar en todo el codebase: `TODO`, `FIXME`, `HACK`, `XXX`, `PENDIENTE`, `console.log`/`console.warn` de debug
2. Revisar `_shared/` adoption gaps reales:
   - `response.ts` no usado por 4 funciones cron
   - `errors.ts` solo en 2 funciones API
   - `audit.ts` solo en api-minimarket
   - `cors.ts` falta en cron-testing-suite y cron-jobs-maxiconsumo
3. Verificar `ErrorMessage` ausente en 6 páginas: Clientes, Deposito, Login, Pedidos, Pocket, Pos
4. Analizar `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md` — items no completados
5. Revisar `docs/DECISION_LOG.md` — decisiones pendientes de implementar
6. Discrepancia Supabase JS: v2.39.3 (Edge Functions) vs v2.95.3 (frontend)

**Clasificación:**
- 🔴 BLOQUEANTE: operador NO puede completar tarea esencial
- 🟡 IMPORTANTE: funciona con degradación o riesgo de datos incorrectos
- 🟢 COSMÉTICO: no afecta funcionalidad

**Salida:** Tabla: `Pendiente | Ubicación | Criticidad | Justificación | Esfuerzo (h)` + Top 5 pre-producción

---

### A3 — DETECCIÓN DE FUNCIONALIDAD FANTASMA

**Objetivo:** Identificar código que existe pero NUNCA se ejecuta en flujos reales.

**Rol:** Detective de Código Muerto — sigue cada hilo de ejecución.

**Pasos:**
1. Para cada Edge Function: ¿tiene trigger real (HTTP, cron en `supabase/cron_jobs/`, invocación desde frontend)?
2. Scraper: ¿`index.ts` (340 líneas) importa y usa TODOS los 10 módulos? ¿`anti-detection.ts` y `cache.ts` están integrados o son aspiracionales?
3. Frontend: ¿hay componentes sin ruta? ¿imports a tablas/funciones inexistentes? ¿`Pocket.tsx` tiene ruta accesible?
4. `_shared/`: ¿`audit.ts` (solo 1 usuario) es útil? ¿`circuit-breaker.ts` (4 usuarios) justifica su existencia?
5. Tests: ¿hay tests que importan módulos refactorizados o renombrados? ¿Todos los 46 unit tests pasan?
6. `cron-testing-suite` (1424 líneas) — ¿se usa en producción o fue solo para desarrollo?

**Salida:** Lista con: `Qué | Dónde | Por qué es fantasma | Acción: ELIMINAR/CONECTAR/INVESTIGAR`

---

### B1 — SIMULACIÓN DE JORNADA DEL OPERADOR

**Objetivo:** Simular las tareas diarias de un operador y verificar cada flujo.

**Rol:** Operador de minimarket con conocimiento básico de tecnología.

**13 tareas (incluyendo las 3 páginas no documentadas previamente):**
1. Login (`Login.tsx` → Supabase Auth)
2. Dashboard del día (`Dashboard.tsx` → `useDashboardStats` + bitacoraApi + cuentasCorrientesApi)
3. Consultar stock (`Stock.tsx` → `useStock`)
4. Registrar mercadería (`Deposito.tsx` → depositoApi.movimiento)
5. Verificar precios scraper (¿qué página muestra precios de Maxiconsumo?)
6. Revisar alertas stock bajo (Dashboard muestra stockBajo)
7. Vender productos (`Pos.tsx` → ventasApi + ofertas activas)
8. Gestionar pedidos (`Pedidos.tsx` → `usePedidos`)
9. Revisar tareas (`Tareas.tsx` → `useTareas` + crear/completar/cancelar)
10. Gestionar productos y precios (`Productos.tsx` → productosApi + preciosApi)
11. Gestionar clientes (`Clientes.tsx` — nueva, verificar funcionalidad)
12. Consultar rentabilidad (`Rentabilidad.tsx` — nueva, verificar datos)
13. Punto de venta rápida (`Pocket.tsx` — nueva, verificar flujo)

**Para cada tarea:** ¿página existe? ¿API responde? ¿<3s? ¿comprensible sin capacitación?

**Salida:** Tabla: `Tarea | Estado (✅/⚠️/❌/❓) | Componentes | Gaps`

---

### B2 — FLUJOS CRÍTICOS END-TO-END

**Objetivo:** Verificar 5 flujos E2E completos.

**Flujos:**
1. **Stock → Alerta:** Depósito actualiza stock → `stock_deposito.cantidad_actual < stock_minimo` → `alertas-stock` dispara → notificación llega
2. **Scraping:** `cron-jobs-maxiconsumo` → `scraper-maxiconsumo` → parsing → matching → storage → precios en dashboard
3. **Venta completa:** `Pos.tsx` scan → carrito → ventasApi → stock se descuenta → kardex se registra → `Pocket.tsx` sincroniza?
4. **Pedido E2E:** crear pedido → preparar items → cambiar estado → entrega → relación con clientes
5. **Monitoreo:** `cron-health-monitor` → `cron_jobs_health_checks` → `cron-dashboard` → datos visibles en frontend?

**Salida:** Tabla por flujo: `Paso | Componente | Entrada | Salida esperada | ¿Funciona?` + eslabones rotos

---

### B3 — UTILIDAD REAL DE OUTPUTS

**Objetivo:** ¿Los outputs ayudan al operador a TOMAR DECISIONES DE NEGOCIO?

**Evaluar:**
- **Alertas stock** (`alertas-stock`): ¿dice qué producto, cuánto queda, qué hacer?
- **Alertas vencimientos** (`alertas-vencimientos`): ¿útil para gestión de perecederos?
- **Reposición sugerida** (`reposicion-sugerida`): ¿genera pedidos automáticos o solo sugerencias?
- **Reportes** (`reportes-automaticos`): ¿formato legible? ¿comparativa? ¿exportable?
- **Scraper** (`scraper-maxiconsumo`): ¿precios se muestran junto al precio de venta? ¿calcula margen?
- **Dashboard** (`Dashboard.tsx`): ¿muestra lo importante primero? ¿indicadores claros?
- **Rentabilidad** (`Rentabilidad.tsx`): ¿métricas accionables para el operador?
- **Notificaciones** (`cron-notifications`, `notificaciones-tareas`): ¿canal real? ¿accionables?

**Test:** ¿El operador puede tomar una DECISIÓN basada en este output sin ayuda técnica?

---

### B4 — CONDICIONES ADVERSAS REALES

**Escenarios:**
1. Maxiconsumo cambia HTML → ¿`parsing.ts` falla silenciosamente? ¿alerta? ¿`anti-detection.ts` tiene fallback?
2. BD llena → ¿`cron_jobs_execution_log` con millones de registros? ¿índices? ¿jobs/maintenance.ts tiene rotación?
3. Edge Function timeout (60s free/150s pro) → ¿`scraper-maxiconsumo` cabe? ¿retry? ¿circuit-breaker actúa?
4. Datos incorrectos → ¿stock negativo? ¿precio con comas? ¿validación frontend Y backend? ¿`helpers/validation.ts` cubre?
5. Sesión expirada → ¿`useAuth` maneja refresh? ¿Edge Functions retornan error claro? ¿`helpers/auth.ts` maneja?
6. Cron falla → ¿`orchestrator.ts` aísla fallos? ¿popula `cron_jobs_alerts`? ¿`execution-log.ts` registra?
7. Concurrencia → ¿dos operadores actualizan mismo stock? ¿`sp_reservar_stock` (corregido en migración 20260209) maneja ON CONFLICT?

---

### C1 — MANEJO DE ERRORES Y FEEDBACK

**Pasos:**
1. Auditar `_shared/errors.ts` (AppError/HttpError) — solo usado por 2 funciones (api-minimarket, api-proveedor)
2. Auditar `_shared/response.ts` — ¿`respondFail` incluye mensajes útiles en español? Solo 7/13 funciones lo usan
3. Cada Edge Function: ¿try/catch global en `Deno.serve`? ¿handlers individuales?
4. Frontend: `ErrorMessage` usado en 7 páginas (Dashboard, Kardex, Productos, Proveedores, Rentabilidad, Stock, Tareas) — **falta en 6**: Clientes, Deposito, Login, Pedidos, Pocket, Pos
5. ¿Mensajes en español comprensible o técnicos?
6. ¿`ErrorBoundary` componente global existe? (sí, verificado test)

**Calidad feedback:** 🟢 "No se pudo actualizar el stock. Verificá tu conexión." · 🔴 "Error: undefined is not a function"

---

### C2 — CONSISTENCIA DE DATOS

**Verificar:**
1. `src/types/database.ts` vs `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` vs 33 migraciones en `supabase/migrations/`
2. Nombres de campo consistentes entre frontend queries y BD
3. Foreign keys en tablas cron (`cron_jobs_execution_log`, `cron_jobs_metrics`, etc.)
4. Scraper: ¿`parsing.ts` output matches `matching.ts` input? ¿`storage.ts` persiste con tipos correctos?
5. Timezones: ¿UTC en BD, hora local en UI?
6. Discrepancia @supabase/supabase-js: v2.39.3 en Edge Functions vs v2.95.3 en frontend — ¿incompatibilidad de tipos?

---

### C3 — UX PARA USUARIO NO-TÉCNICO

**Evaluar:**
1. ¿Toda la UI en español? (Login.tsx verificado: sí)
2. ¿Números formateados? (`Pos.tsx` verificado: usa `toLocaleString('es-AR')` ✅ — ¿consistente en las 13 páginas?)
3. ¿Navegación ≤3 clicks a función principal?
4. ¿Estados vacíos con mensajes guía? (solo donde hay Skeletons: Dashboard, Pedidos, Productos, Stock, Tareas)
5. ¿Responsive/tablet? ¿Botones touch-friendly?
6. ¿Loading skeletons? Verificado en 5 páginas: Dashboard, Pedidos, Productos, Stock, Tareas — **faltan en 8 páginas**

---

### C4 — DEPENDENCIAS EXTERNAS

**Inventario:**
1. **Supabase** — ¿plan free suficiente? ¿límites de invocaciones/timeout?
2. **Maxiconsumo** — ¿ToS prohíbe scraping? ¿plan B si bloquea? ¿`anti-detection.ts`+`utils/cookie-jar.ts` ayudan?
3. **npm deps** — root `package.json`: vitest 4.0.18, msw 2.12.9, jsdom 27.4.0 · frontend: vitest 4.0.17, Playwright 1.57.0
4. **Deno imports** — `supabase/functions/deno.json` fija `@supabase/supabase-js@2.39.3` ✅ — duplicado en `import_map.json`
5. **Secrets requeridos** (de `docs/OBTENER_SECRETOS.md` + `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`):
   - **Obligatorios (13):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_GATEWAY_URL` (solo en SECRETOS_REQUERIDOS), `API_PROVEEDOR_SECRET`, `ALLOWED_ORIGINS`, `TEST_USER_ADMIN`, `TEST_USER_DEPOSITO`, `TEST_USER_VENTAS`, `TEST_PASSWORD`
   - **Opcionales documentados (6):** `SENDGRID_API_KEY`, `TWILIO_AUTH_TOKEN`, `CAPTCHA_PROVIDER`+`CAPTCHA_API_KEY`, `SEMGREP_APP_TOKEN`, `OPENAI_API_KEY`
   - **Opcionales NO documentados en guías de secretos (3):** `NOTIFICATIONS_MODE`, `SLACK_WEBHOOK_URL`, `SMTP_*` — gap de documentación

---

### D1 — PERFORMANCE REAL

**Auditar:**
1. ¿`SELECT *` donde se podrían seleccionar columnas específicas?
2. ¿Índices en `stock_deposito`, `cron_jobs_execution_log`? (verificar migraciones de índices)
3. ¿Vistas `vista_cron_jobs_*` materializadas o recalculadas? (verificar migración `20260206235900_create_stock_materialized_views_for_alertas.sql` + `20260208010000_add_refresh_stock_views_rpc_and_cron.sql`)
4. ¿Frontend re-renders innecesarios? ¿`staleTime` configurado?
5. Proyección: ~500-2000 productos, ~50-200 transacciones/día → ¿escala a 6-12 meses?
6. ¿`jobs/maintenance.ts` en cron-jobs-maxiconsumo tiene limpieza de logs?
7. `api-minimarket/index.ts` con 2184 líneas — ¿impacto en cold start?

---

### D2 — CÓDIGO MUERTO

**Basado en A3:**
1. Imports no utilizados, funciones exportadas sin importar
2. ¿`docs/archive/` contiene docs obsoletos que confunden? (10 archivos verificados)
3. ¿`docs/closure/` con 41 archivos — cuántos son relevantes vs históricos?
4. ¿`import_map.json` duplica `supabase/functions/deno.json`? (verificado: SÍ, ambos fijan @supabase/supabase-js@2.39.3)
5. ¿`tests/unit/components/` vacío — carpeta fantasma?
6. ¿Tests legacy en `tests/performance/`, `tests/security/`, `tests/api-contracts/`? (CI los documenta como LEGACY desactivado)

---

### D3 — SEGURIDAD

**Verificar:**
1. **Secrets:** ¿`.env` en `.gitignore`? ¿`SERVICE_ROLE_KEY` en frontend? ¿`.env.example` existe? ✅
2. **RLS:** revisar 33 migraciones + `docs/AUDITORIA_RLS_CHECKLIST.md` + `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` + migración `20260131000000_rls_role_based_policies_v2.sql`
3. **api-minimarket verify_jwt=false** — confirmado. ¿`helpers/auth.ts` (344 líneas) maneja auth internamente?
4. **Validación inputs:** ¿`helpers/validation.ts` (130 líneas) valida UUIDs? (verificado en api-ofertas: sí)
5. **CORS:** `_shared/cors.ts` — ¿`ALLOWED_ORIGINS` configurado? ¿no wildcard en prod?
6. **Rate-limit:** `_shared/rate-limit.ts` aplicado a **4 funciones** (api-minimarket, api-proveedor, cron-notifications, scraper-maxiconsumo) — **9 funciones sin rate-limit**
7. **Headers seguridad:** CSP, X-Frame-Options en frontend
8. **Secret rotation:** `docs/SECRET_ROTATION_PLAN.md` existe — ¿implementado?

---

### D4 — OPTIMIZACIÓN UX FINAL

**Consolidar C1+C3+B3:**
- Quick wins: agregar `ErrorMessage` a las 6 páginas faltantes, Skeletons a las 8 páginas faltantes
- Mejoras estructurales: alertas accionables, exportación reportes, dashboard priorizado
- Mapa de experiencia: apertura → operación diaria → cierre
- Verificar consistencia de `toLocaleString('es-AR')` en todas las páginas

---

### E1 — CHECKLIST DE DESPLIEGUE

**Pre-deploy:**
- [ ] `npx vitest run tests/unit/` — 46 archivos sin errores
- [ ] `pnpm build` en `minimarket-system/` sin warnings críticos
- [ ] `tsc --noEmit` sin errores
- [ ] `deno check --no-lock` para cada una de las 13 Edge Functions
- [ ] Sin `console.log` de debug · Sin secrets hardcodeados
- [ ] `npm run test:auxiliary` — 3 archivos auxiliary sin errores

**Supabase producción:**
- [ ] 33 migraciones aplicadas (última: `20260209000000_fix_sp_reservar_stock_on_conflict.sql`)
- [ ] RLS habilitado en TODAS las tablas
- [ ] 13 Edge Functions desplegadas: `supabase functions deploy`
- [ ] `api-minimarket` con `--no-verify-jwt`
- [ ] Cron jobs configurados en Supabase Dashboard (ver `supabase/cron_jobs/deploy_all_cron_jobs.sql`)
- [ ] 13+ secrets obligatorios configurados

**Frontend:**
- [ ] `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` apuntan a producción
- [ ] `VITE_API_GATEWAY_URL` configurado
- [ ] HTTPS · SPA redirect · Cache headers

**Post-deploy:**
- [ ] Login funciona · Dashboard carga · CRUD Stock funcional · POS venta completa · Cron ejecuta · Alertas generan
- [ ] 13 páginas accesibles y navegables

---

### E2 — VARIABLES DE ENTORNO Y SECRETS

**Verificado de `docs/OBTENER_SECRETOS.md` y `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`:**

| Variable | Dónde se usa | Requerida | Dónde configurar |
|----------|-------------|-----------|-----------------|
| `VITE_SUPABASE_URL` | Frontend (build via `import.meta.env`) | ✅ | CI secrets + `.env` |
| `VITE_SUPABASE_ANON_KEY` | Frontend (build via `import.meta.env`) | ✅ | CI secrets + `.env` |
| `VITE_API_GATEWAY_URL` | Frontend (API calls via `apiClient.ts`) | ✅ | CI secrets + `.env` | ⚠️ **Solo documentado en SECRETOS_REQUERIDOS, falta en OBTENER_SECRETOS** |
| `SUPABASE_URL` | Edge Functions (via `Deno.env.get()`) | ✅ | Supabase Secrets |
| `SUPABASE_ANON_KEY` | Edge Functions | ✅ | Supabase Secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | ✅ | Supabase Secrets (NUNCA en frontend) |
| `DATABASE_URL` | Edge Functions / Ops | ✅ | Supabase Secrets |
| `ALLOWED_ORIGINS` | CORS (_shared/cors.ts) | ✅ | Supabase Secrets |
| `API_PROVEEDOR_SECRET` | api-proveedor auth | ✅ | Supabase Secrets |
| `TEST_USER_ADMIN` | Testing `.env.test` | ✅ (CI) | `.env.test` local |
| `TEST_USER_DEPOSITO` | Testing | ✅ (CI) | `.env.test` local |
| `TEST_USER_VENTAS` | Testing | ✅ (CI) | `.env.test` local |
| `TEST_PASSWORD` | Testing | ✅ (CI) | `.env.test` local |
| `SENDGRID_API_KEY` | Notificaciones email | ⚠️ Opcional | Supabase Secrets |
| `TWILIO_AUTH_TOKEN` | SMS | ⚠️ Opcional | Supabase Secrets |
| `CAPTCHA_PROVIDER` | Scraper anti-bot | ⚠️ Opcional | Supabase Secrets |
| `CAPTCHA_API_KEY` | Scraper anti-bot | ⚠️ Opcional | Supabase Secrets |
| `SEMGREP_APP_TOKEN` | Security scanning | ⚠️ Opcional | CI secrets |
| `OPENAI_API_KEY` | Integración IA | ⚠️ Opcional | Supabase Secrets |
| `NOTIFICATIONS_MODE` | Modo notificaciones | ⚠️ Opcional | Supabase Secrets | ⚠️ **No documentado en OBTENER_SECRETOS ni SECRETOS_REQUERIDOS** |
| `SLACK_WEBHOOK_URL` | Alertas Slack | ⚠️ Opcional | Supabase Secrets | ⚠️ **No documentado en docs de secretos** |
| `SMTP_*` | Email SMTP directo | ⚠️ Opcional | Supabase Secrets | ⚠️ **No documentado en docs de secretos** |

---

### E3 — LOGGING Y MONITOREO

**Verificar:**
1. `_shared/logger.ts` — **13/13 funciones lo usan** ✅ (adopción completa)
2. ¿`cron_jobs_execution_log` registra cada ejecución? ¿`execution-log.ts` en cron-jobs-maxiconsumo?
3. ¿`cron-health-monitor` (958 líneas) genera datos útiles o solo para dev?
4. ¿Hay plan Sentry? (`docs/SENTRY_INTEGRATION_PLAN.md` existe — estado: sin DSN configurado según ESTADO_ACTUAL.md)
5. ¿Alertas de fallos llegan al operador por canal real? (SENDGRID_API_KEY pendiente operativa según ESTADO_ACTUAL)
6. ¿`cron-dashboard` (1283 líneas) expone métricas a algún frontend?

---

### E4 — ROLLBACK

**Verificar:**
1. `docs/ROLLBACK_SQL_TEMPLATE.md` — ¿template funcional?
2. `docs/ROLLBACK_EVIDENCE_2026-01-29.md` — ¿evidencia de rollback exitoso?
3. `docs/ROLLBACK_20260116000000_create_stock_aggregations.sql` — ¿script específico de rollback?
4. `docs/verify_rollback.sql` — ¿script de verificación?
5. ¿Edge Functions pueden re-deployar versión anterior? (versiones guardadas en Supabase Cloud)
6. ¿33 migraciones SQL son reversibles?
7. ¿Hay backup de BD antes de deploy?

---

### F1 — ¿RESUELVE EL PROBLEMA REAL?

**Pregunta central:** ¿Un dueño de minimarket sin conocimiento técnico puede gestionar su negocio con este sistema?

**Verificar cadena completa:**
- Inventario (Stock + Deposito) → Precios (Productos + Scraper) → Ventas (Pos + Pocket) → Clientes → Alertas (stock + vencimientos) → Reportes → Rentabilidad → ¿funcional E2E?

---

### F2 — ¿VALOR DESDE EL MINUTO 1?

**Verificar:** ¿El operador obtiene valor REAL la primera vez que usa el sistema?
- ¿Onboarding claro? ¿Datos de ejemplo? ¿Guía de primer uso?
- ¿Las funciones más críticas (stock, ventas, alertas) funcionan sin configuración compleja?
- ¿Login + Dashboard inmediato con datos útiles?

---

### F3 — FUNCIONALIDAD QUE NADIE USARÁ

**Detectar:** features sobre-ingenierizadas para un minimarket:
- `cron-testing-suite` (1424 líneas) — ¿un operador de minimarket lo necesita?
- `circuit-breaker.ts` usado por 4 funciones — ¿necesario para ~200 transacciones/día?
- `audit.ts` solo en api-minimarket — ¿para qué audiencia?
- Dashboard de monitoreo de cron jobs (`cron-dashboard` 1283 líneas) — ¿público objetivo: operador o devops?
- `cron-health-monitor` (958 líneas) — ¿métricas relevantes para el negocio o solo infra?
- `docs/closure/` con 41 archivos — ¿útiles post-producción o solo para la fase de desarrollo?

---

### Ω — CHECKLIST DEFINITIVO DE CONFIANZA

**Pregunta final:** ¿Puedo enviar este sistema a producción HOY con confianza?

| Gate | Verificado | Estado |
|------|-----------|--------|
| Auth funciona E2E | | ⬜ |
| CRUD Stock funciona | | ⬜ |
| POS venta completa | | ⬜ |
| Alertas stock bajo llegan | | ⬜ |
| Alertas vencimientos funcional | | ⬜ |
| Reposición sugerida funcional | | ⬜ |
| RLS correcto en todas las tablas | | ⬜ |
| No hay secrets expuestos | | ⬜ |
| Rate-limit en endpoints públicos | | ⬜ |
| 13 Cron jobs programados y funcionales | | ⬜ |
| 33 migraciones aplicadas | | ⬜ |
| Mensajes de error en español comprensible | | ⬜ |
| ErrorMessage en 13 páginas (actualmente 7) | | ⬜ |
| Operador puede usar sin capacitación técnica | | ⬜ |
| Plan de rollback documentado y probado | | ⬜ |
| Monitoreo activo con alertas | | ⬜ |
| 13 Edge Functions healthy | | ⬜ |
| CI pipeline 6/6 obligatorios pasan | | ⬜ |

**Veredicto: ✅ LISTO / ⚠️ CON RESERVAS / ❌ NO LISTO**

---

## CORRECCIONES APLICADAS vs DOCUMENTO ORIGINAL v4.0

| Item en v4.0 | Corrección verificada en v4.1 |
|---|---|
| Commit `605b4fb` | **`3b1a8b0`** (HEAD actual de main) |
| `cron-notifications` v11 | **v12** (confirmado via Supabase API) |
| "api-minimarket ya no es monolítico de 1050 líneas" | **index.ts aún tiene 2184 líneas** + 21 archivos modulares = 5767 líneas total. Modularización parcial, no completa |
| "_shared adoption: solo cron-notifications usa parcialmente" | **logger.ts tiene 100% adopción** (13/13). La adopción es variable por módulo, no nula |
| "3 funciones cron NO usan _shared" | **Incorrecto**: las 3 usan al menos `logger.ts`. No usan `response.ts`, `errors.ts`, `audit.ts` |
| Páginas frontend: "Dashboard, Stock, Tareas, Productos, Proveedores, Kardex, Deposito, Pos, Pedidos, Login" | **Faltan 3**: `Clientes.tsx`, `Pocket.tsx`, `Rentabilidad.tsx` (total: 13 páginas) |
| "ErrorMessage verificado en Dashboard, Stock, Tareas, Productos, Proveedores, Kardex" | **Correcto** + `Rentabilidad.tsx`. Falta en 6 páginas |
| "`SkeletonCard`, `SkeletonTable`, `SkeletonList` usados" | Skeletons solo en **5 páginas**, faltan en 8 |
| Referencia a `docs/AUDITORIA_DOCS_VS_REALIDAD_2026-02-09.md` | **NO EXISTE** — eliminada la referencia |
| "cron-testing-suite (1413 líneas)" | **1424 líneas** |
| "cron-notifications (1246)" | **1282 líneas** |
| "cron-dashboard (1130)" | **1283 líneas** |
| "cron-health-monitor (898)" | **958 líneas** |
| Tests: "5 archivos, 47 tests" / "shared-cors, gateway-auth, api-ofertas, api-bitacora + suites auxiliares" | **71 archivos** total (55 en `tests/` + 16 frontend) |
| CI: "6 jobs obligatorios" (mencionaba lint, test, build, typecheck, edge-functions-check + "3 opcionales") | **6 obligatorios**: lint, **agent-skills**, test, build, typecheck, edge-functions-check + **3 opcionales**: integration, e2e, e2e-frontend |
| "PLAN_EJECUCION.md" | Existe como `PLAN_EJECUCION_PREMORTEM.md` ✅ (ya corregido en v4.0) |
| "ROADMAP.md" | Existe en `docs/archive/ROADMAP.md` (histórico archivado). Vigente: `HOJA_RUTA_ACTUALIZADA_2026-02-08.md` |
| Secrets: "13 confirmados" | **13 obligatorios + 8-9 opcionales = ~22 referenciados** en docs |
| "Env: process.env" corregido a import.meta.env / Deno.env.get() | ✅ Ya correcto en v4.0 |
| Scraper módulos: "9 módulos" | **9 módulos** funcionales (types, config, cache, anti-detection, parsing, matching, alertas, storage, scraping) + `index.ts` orquestador + `utils/cookie-jar.ts` = **11 archivos** total |
| cron-jobs-maxiconsumo: "4 jobs + orchestrator" | **4 jobs + orchestrator + index.ts + config.ts + execution-log.ts + types.ts + validators.ts** = **10 archivos** |
| api-proveedor handlers: no detallados | **9 handlers**: alertas, comparacion, configuracion, estadisticas, health, precios, productos, sincronizar, status |
| Migraciones: "12 versionadas" → "incluyendo 2 de 2026-01-31" | **33 migraciones** (última: 20260209) |
| "Tests: 646 passing / 40 frontend / 15 seguridad" (copilot-instructions) | Números desactualizados — ESTADO_ACTUAL.md dice **812 unit + 38 integration + 5 e2e + 110 components** (sesión 2026-02-09) |
| docs: "40+ archivos" | **115 archivos** (incluyendo subdirectorios) |
| `import_map.json` duplica `deno.json` | **Confirmado:** ambos fijan @supabase/supabase-js@2.39.3 de forma idéntica |
| Vitest version: "4.0.16" (copilot-instructions) | **4.0.18** (root) / **4.0.17** (minimarket-system) |
| `tests/unit/components/` | **Vacío** — carpeta fantasma |

---

> **Nota de verificación:** Este documento fue generado mediante inspección directa del filesystem, la API de Supabase Cloud, git log, y lectura de archivos fuente. Cada cifra ha sido verificada contra el estado real del repositorio al 2026-02-10.
