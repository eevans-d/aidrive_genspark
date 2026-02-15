> [DEPRECADO: 2026-02-13] Documento historico. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/MEGA_PLAN_2026-02-13_042956.md`, `docs/closure/OPEN_ISSUES.md`.

# PLAN MAESTRO DE EJECUCIÓN — AUDITORÍA FORENSE v4.1 (VERSIÓN DEFINITIVA)

> **Fecha:** 2026-02-10
> **Commit base:** `3b1a8b0` (main)
> **Verificado:** 2 ciclos de revisión contra código real, Supabase API, filesystem
> **Referencia:** [`docs/BATERIA_PROMPTS_v4.1_FINAL.md`](BATERIA_PROMPTS_v4.1_FINAL.md)
> **Prompts ejecutor (Claude Code/Copilot):** `docs/closure/CLAUDE_CODE_CONTEXT_PROMPT_EXECUTOR_AUDITORIA_2026-02-10.md`
> **Todos los datos numéricos verificados con `wc -l`, `find`, `grep` contra código real.**

---

## TABLA DE CONTENIDO

1. [Hallazgos Críticos Pre-Ejecución](#hallazgos-críticos-pre-ejecución)
2. [Arquitectura del Plan](#arquitectura-del-plan)
3. [Prerrequisitos y Entorno de Auditoría](#prerrequisitos-y-entorno-de-auditoría)
4. [Datos Verificados de Referencia](#datos-verificados-de-referencia)
5. [SP-A — Auditoría Forense](#sp-a--auditoría-forense)
6. [SP-C — Análisis de Detalles](#sp-c--análisis-de-detalles)
7. [SP-B — Validación Funcional](#sp-b--validación-funcional)
8. [SP-D — Optimización](#sp-d--optimización)
9. [SP-E — Producción](#sp-e--producción)
10. [SP-F — Utilidad Real](#sp-f--utilidad-real)
11. [SP-Ω — Cierre](#sp-ω--cierre)
12. [Resumen de Ejecución](#resumen-de-ejecución)
13. [Correcciones Aplicadas](#correcciones-aplicadas-tras-2-ciclos-de-verificación)

---

## HALLAZGOS CRÍTICOS PRE-EJECUCIÓN

### HC-1: 3 cron jobs potencialmente inoperantes

Los cron jobs `notificaciones-tareas`, `alertas-stock` y `reportes-automaticos` en `deploy_all_cron_jobs.sql` **NO envían Authorization header**, pero sus Edge Functions se desplegaron con `verify_jwt=true` (Supabase default). Si `net.http_post` pasa por el API Gateway de Supabase (Kong), Kong rechazaría con 401 antes de llegar a la función.

**Cron jobs con auth (funcionan):**
- `daily_price_update` → `cron-jobs-maxiconsumo` — `Bearer + current_setting('app.service_role_key')`
- `weekly_trend_analysis` → `cron-jobs-maxiconsumo` — ídem
- `realtime_change_alerts` → `cron-jobs-maxiconsumo` — ídem

**Cron jobs sin auth (riesgo):**
- `alertas-stock_invoke` — solo `Content-Type: application/json`
- `notificaciones-tareas_invoke` — solo `Content-Type: application/json`
- `reportes-automaticos_invoke` — solo `Content-Type: application/json`

**Verificar urgente en SP-B (B2):** ¿Estos jobs ejecutan o fallan silenciosamente con 401?

### HC-2: `deploy.sh` tiene 2 bugs críticos

1. **No filtra `_shared/`:** El loop `for func_dir in supabase/functions/*/` incluye `_shared/` como si fuera una Edge Function. Con `set -e` activo, `supabase functions deploy "_shared"` fallaría y **abortaría todo el deployment**.
2. **No tiene `--no-verify-jwt` para `api-minimarket`:** Si se usa `deploy.sh`, se resetearía `api-minimarket` a `verify_jwt=true`, **rompiendo el API Gateway completo**.

### HC-3: Bug UX en Pedidos.tsx

Las mutaciones (`handleCreatePedido`, `handleUpdateEstado`, `handleToggleItemPreparado`) solo hacen `console.error()`. El operador **no recibe feedback alguno** cuando falla crear o actualizar un pedido.

---

## ARQUITECTURA DEL PLAN

```
SP-A (paralelo) ──┐
                  ├─→ SP-B (secuencial) ──→ SP-D (secuencial) ──→ SP-E (secuencial) ──→ SP-F (secuencial) ──→ SP-Ω
SP-C (paralelo) ──┘
A1+A2+A3              B1→B2→B3→B4          D2→D3→D1→D4          E2→E1→E3→E4          F1→F2→F3              Ω
C1+C2+C3+C4
```

**Nota:** B1 puede iniciarse con A1 mínimo mientras C1/C3 avanzan; la dependencia estricta aplica a B2.

**Flujo de información:**
- **SP-A** produce: inventario funcional real, mapa de pendientes, lista de fantasmas → alimenta TODO lo posterior
- **SP-C** produce: gaps de calidad (errores, datos, UX, deps) → alimenta validación
- **SP-B** produce: veredicto funcional por flujo E2E → alimenta optimización
- **SP-D** produce: lista priorizada de fixes técnicos → alimenta checklist producción
- **SP-E** produce: checklist go/no-go → alimenta evaluación de utilidad
- **SP-F** produce: evaluación desde perspectiva operador → alimenta cierre
- **SP-Ω** produce: **18 gates binarios → VEREDICTO FINAL**

---

## PRERREQUISITOS Y ENTORNO DE AUDITORÍA

**Objetivo:** que un auditor/agente nuevo pueda ejecutar los sub-planes sin adivinar accesos, datos ni formato de evidencia.

### Accesos mínimos

- Supabase: DB (SQL editor o `psql`) + logs de Edge Functions + listar funciones (`supabase functions list` o API).
- Workspace local: `pnpm` (frontend) + `deno` (edge functions) para correr checks y tests.
- CI: lectura de GitHub Actions para confirmar `6/6` jobs obligatorios verdes.

### Datos mínimos (dataset)

- 1 usuario por rol (solo NOMBRES de variables): `TEST_USER_ADMIN`, `TEST_USER_DEPOSITO`, `TEST_USER_VENTAS`, `TEST_PASSWORD`.
- Datos para flujos B1/B2: productos (>=10), stock inicial, 1 proveedor, 1 cliente con cuenta corriente, 1 pedido con items.

### Evidencia (estándar)

- Guardar evidencia por sub-plan en `docs/audit/` (sin secretos): `EVIDENCIA_SP-A.md` ... `EVIDENCIA_SP-Ω.md`.
- Cada gate debe registrar: `Gate # | Evidencia (link/consulta/log) | Fecha | Resultado (✅/⚠️/❌) | Nota`.

---

## DATOS VERIFICADOS DE REFERENCIA

> Todos los números siguientes fueron verificados con comandos reales durante los 2 ciclos de revisión.

### Edge Functions (13 desplegadas)

| # | Función | Versión | verify_jwt | Archivos TS | Líneas | Trigger |
|---|---------|---------|------------|-------------|--------|---------|
| 1 | api-minimarket | v20 | **false** | 22 | 5767 | Frontend (apiClient) |
| 2 | api-proveedor | v11 | true | 12 | ~800 | Externo/manual (sin caller en repo; verificar logs) |
| 3 | scraper-maxiconsumo | v11 | true | 11 | 2308 | Llamada por cron-jobs-maxiconsumo |
| 4 | cron-jobs-maxiconsumo | v12 | true | 10 | ~900 | pg_cron (3 jobs CON auth) |
| 5 | alertas-stock | v10 | true | 1 | ~200 | pg_cron (SIN auth header) |
| 6 | notificaciones-tareas | v10 | true | 1 | ~200 | pg_cron (SIN auth header) |
| 7 | reportes-automaticos | v10 | true | 1 | ~200 | pg_cron (SIN auth header) |
| 8 | alertas-vencimientos | v10 | true | 1 | 206 | **Sin trigger (huérfana)** |
| 9 | reposicion-sugerida | v10 | true | 1 | 237 | **Sin trigger (huérfana)** |
| 10 | cron-notifications | v12 | true | 1 | 1282 | Solo testing-suite (simulación) |
| 11 | cron-dashboard | v10 | true | 1 | 1283 | **Sin trigger (huérfana)** |
| 12 | cron-health-monitor | v10 | true | 1 | 958 | Solo testing-suite |
| 13 | cron-testing-suite | v10 | true | 1 | 1424 | Manual (dev/QA) |

**Clasificación de trigger (para A1/A3/D2):**
- **PROD (caller/cron confirmado):** 1, 3, 4, 5, 6, 7
- **EXTERNO/MANUAL (sin caller observable en repo):** 2
- **NO-PROD (sin trigger productivo):** 8-13 (huérfanas o dev/QA)

### Módulos `_shared/` — Adopción verificada

| Módulo | Líneas | Adopción | Funciones que NO lo usan |
|--------|--------|----------|--------------------------|
| `logger.ts` | — | **13/13** (100%) | — |
| `cors.ts` | 128 | **11/13** (85%) | cron-jobs-maxiconsumo, cron-testing-suite |
| `response.ts` | 196 | **7/13** (54%) | scraper, cron-dashboard, cron-health-monitor, cron-notifications, cron-testing-suite, cron-jobs-maxiconsumo |
| `rate-limit.ts` | 273 | **4/13** (31%) | api-minimarket, api-proveedor, scraper, cron-notifications |
| `circuit-breaker.ts` | — | **4/13** (31%) | api-minimarket, api-proveedor, scraper, cron-jobs-maxiconsumo |
| `errors.ts` | 227 | **2/13** (15%) | api-minimarket, api-proveedor |
| `audit.ts` | — | **1/13** (8%) | api-minimarket |

### Frontend (13 páginas)

| # | Página | Líneas | Layout | ErrorMessage | Skeleton | Patrón de error sin ErrorMessage |
|---|--------|--------|--------|-------------|----------|----------------------------------|
| 1 | Dashboard | 228 | Sí | ✅ | ✅ | — |
| 2 | Stock | — | Sí | ✅ | ✅ | — |
| 3 | Productos | — | Sí | ✅ | ✅ | — |
| 4 | Tareas | — | Sí | ✅ | ✅ | — |
| 5 | Kardex | — | Sí | ✅ | ❌ | — |
| 6 | Rentabilidad | — | Sí | ✅ | ❌ | — |
| 7 | Proveedores | — | Sí | ✅ | ❌ | — |
| 8 | Pedidos | 708 | Sí | ❌ | ✅ | `console.error` en mutaciones (**bug: sin feedback**), div rojo inline en queries |
| 9 | Deposito | — | Sí | ❌ | ❌ | `toast.error()` + estado inline efímero, sin retry |
| 10 | Clientes | — | Sí | ❌ | ❌ | `toast.error()` + div rojo hardcoded, sin retry |
| 11 | Pos | 597 | **No** | ❌ | ❌ | Solo `toast.error()`, sin indicación visual si carga falla |
| 12 | Pocket | 566 | **No** | ❌ | ❌ | Solo `toast.error()`, confunde error con vacío |
| 13 | Login | — | **No** | ❌ | ❌ | `useState<string>` → div rojo inline, funcional |

**ErrorMessage:** 7/13 | **Skeleton:** 5/13

### Archivos clave

| Archivo | Líneas | Contenido |
|---------|--------|-----------|
| `apiClient.ts` | 899 | 13 módulos API, ~32 endpoints, ~37 tipos exportados |
| `database.ts` | 151 | 11 interfaces manuales (faltan: Pedidos, Clientes, Ventas, Ofertas, Bitácora, Categorías) |
| `auth.ts` (helpers) | 344 | JWT manual + cache SHA-256 (30s pos / 10s neg) + circuit breaker |
| `validation.ts` | 130 | Validación de inputs en handlers |
| `ErrorMessage.tsx` | 116 | Componente con retry, request-id, tipo de error |

### Conteos globales

| Categoría | Cantidad verificada |
|-----------|-------------------|
| Edge Functions desplegadas | 13 |
| Migraciones SQL | 33 |
| Archivos test (total) | 71 (55 en tests/ + 16 frontend) |
| Archivos docs | 115 |
| Cron jobs SQL configurados | 6 |
| Páginas frontend | 13 |
| Funciones sin trigger productivo | 6 (~5390 líneas) |

> Nota: el conteo de docs puede variar por nuevos archivos en `docs/closure/`. Recalcular con `find docs -type f | wc -l`.

### Nota sobre tipos

Los tipos "faltantes" en `database.ts` **existen como tipos inline** en `apiClient.ts` para: Pedidos, Clientes, Ventas, Ofertas, Bitácora, Cuentas Corrientes, Arbitraje, Search. Solo **Categorías** no tiene tipo en ningún lugar del codebase. El problema es **dispersión**, no ausencia total.

### Dashboard — Patrón híbrido confirmado

Dashboard.tsx usa **ambas fuentes**:
- **Datos principales:** `useDashboardStats` → Supabase directo (3 queries paralelas: tareas pendientes, stock bajo, total productos)
- **Datos secundarios:** `apiClient` → `cuentasCorrientesApi.resumen()` + `bitacoraApi.list()` (solo para roles admin/ventas)

---

## SP-A — AUDITORÍA FORENSE

**Objetivo:** Establecer la línea base de realidad: qué funciona, qué falta, qué sobra.
**Ejecución:** A1, A2, A3 en **paralelo**.
**Entregable:** 3 tablas maestras = fuente de verdad para todo el plan.

---

### A1 — INVENTARIO FUNCIONAL REAL VS DECLARADO

**Objetivo:** Para CADA componente declarado como "implementado", verificar si realmente funciona.

#### A1.1 — Edge Functions (13)

Para cada función, verificar con evidencia:

| Verificación | Método |
|---|---|
| Existe en filesystem | `ls supabase/functions/{nombre}/index.ts` |
| Desplegada ACTIVE en Supabase | API Supabase Management o `supabase functions list` |
| Entry point funcional | Leer index.ts — ¿`Deno.serve()`? ¿Imports resuelven? |
| Trigger productivo real | ¿apiClient la llama? ¿Cron SQL la invoca? ¿Otra función la fetch? ¿Uso externo/manual (logs)? |
| Módulos `_shared/` que importa | Grep imports `from '../_shared/'` |
| Tests que la cubren | Buscar en `tests/unit/` archivos relacionados |
| Docs correctos | ¿`API_README.md` documenta sus endpoints? ¿Alineado? |

**Verificaciones especiales por función:**

| Función | Qué verificar |
|---|---|
| `api-minimarket` (5767 lín, 22 archivos) | Los ~50 endpoints en API_README.md ¿están implementados en 10 handlers + 6 routers? Cruzar con apiClient.ts (13 módulos, ~32 endpoints). Identificar los ~15-18 endpoints documentados sin caller frontend. |
| `api-proveedor` (12 archivos) | Confirmar si tiene caller externo (integración/manual) o si está sin uso. Verificar 9 handlers. Revisar logs de invocación. |
| `alertas-stock` + `notificaciones-tareas` + `reportes-automaticos` | **PRIORIDAD 1:** ¿Cron jobs funcionan? verify_jwt=true + sin Authorization heading en cron SQL = ¿401? Verificar ejecutando manualmente o revisando `cron_jobs_execution_log`. |
| `alertas-vencimientos` (206 lín) + `reposicion-sugerida` (237 lín) | Confirmar huérfanas. Ambas implementadas completamente. Evaluar: ¿deberían tener cron job? |
| `cron-testing-suite` + `cron-dashboard` + `cron-health-monitor` + `cron-notifications` | Confirmar que solo sirven para dev/QA/simulación. No productivas. |

#### A1.2 — Frontend (13 páginas)

Para cada página en `minimarket-system/src/pages/`:

| Verificación | Método |
|---|---|
| Ruta en App.tsx | Path, ProtectedRoute, Layout sí/no, roles requeridos |
| Hook/fuente de datos | ¿Hook de `hooks/queries/`? ¿apiClient directo? ¿Supabase directo? |
| API endpoints usados | Cruzar con apiClient.ts endpoints. ¿Todos los endpoints llamados existen en el gateway? |
| ErrorMessage | ¿Presente? (hoy 7/13). Si no: ¿qué patrón de error usa? |
| Skeleton | ¿Presente? (hoy 5/13). Si no: ¿qué muestra durante carga? |
| Tests | ¿Tiene `*.test.tsx` o hook test? |

**Verificaciones especiales:**
- `Dashboard.tsx`: Patrón **híbrido** (useDashboardStats directo + apiClient). ¿Inconsistencia con patrón gateway?
- `Pos.tsx` (597 lín): POS sin Layout (fullscreen). ¿Protección de roles? ¿Bot de "volver"?
- `Pocket.tsx` (566 lín): PDA sin Layout. ¿Barcode scanner funciona? ¿3 modos operativos?
- `Pedidos.tsx` (708 lín): **Bug conocido:** mutaciones sin feedback de error al usuario.

#### A1.3 — BD/Migraciones (33 archivos)

| Verificación | Método |
|---|---|
| Tablas creadas vs referenciadas | Cruzar tablas en migraciones vs queries en frontend y Edge Functions |
| `database.ts` alineado | 11 interfaces manuales vs tablas reales. Tipos inline de apiClient vs tablas. Solo Categorías sin tipo en ningún lado. |
| Stored procedures | Verificar existencia: `sp_aplicar_precio`, `sp_reservar_stock`, `fn_refresh_stock_views` |
| RLS policies | Migración RLS v2: deny-by-default en 10 tablas P0. ¿Tablas nuevas (pedidos, clientes, ventas, ofertas, bitácora) tienen RLS? |
| Vistas materializadas | MVs en migración `20260206235900`. Refresh via RPC en `20260208010000`. pg_cron NO instalado → refresh manual. |

**Salida A1:** Tabla: `Componente | Tipo (EF/Page/Table/SP) | Existe | Funcional | Trigger | Testeado | Docs | Veredicto`

---

### A2 — MAPA DE PENDIENTES CON CRITICIDAD

**Objetivo:** Catalogar TODA la deuda técnica (0 marcadores TODO/FIXME en código).

#### 2.1 Gaps de adopción `_shared/`

| Módulo | Adopción | Gap | Funciones sin él |
|--------|----------|-----|------------------|
| `response.ts` | 7/13 (54%) | 6 funciones | scraper, cron-dashboard, cron-health-monitor, cron-notifications, cron-testing-suite, cron-jobs-maxiconsumo |
| `errors.ts` | 2/13 (15%) | 11 funciones | Todas excepto api-minimarket, api-proveedor |
| `audit.ts` | 1/13 (8%) | 12 funciones | Todas excepto api-minimarket |
| `cors.ts` | 11/13 (85%) | 2 funciones | cron-testing-suite, cron-jobs-maxiconsumo |
| `rate-limit.ts` | 4/13 (31%) | 9 funciones | Sin protección de rate |

#### 2.2 Gaps de UX frontend

| Gap | Páginas afectadas (cantidad) |
|-----|------------------------------|
| Sin ErrorMessage | Deposito, Pedidos, Pocket, Pos, Clientes, Login **(6)** |
| Sin Skeleton | Deposito, Kardex, Rentabilidad, Proveedores, Pocket, Pos, Clientes, Login **(8)** |
| Sin ErrorBoundary granular | Todas — solo boundary global en main.tsx |
| Mutaciones sin feedback error | Pedidos.tsx: `console.error()` en create/update **(1, bug)** |

#### 2.3 Gaps de tipos

- `database.ts`: 11 interfaces manuales, sin auto-generación (`supabase gen types typescript`)
- Tipos para Pedidos, Clientes, Ventas, Ofertas, Bitácora, CC, Arbitraje, Search — existen **dispersos en apiClient.ts** (no centralizados)
- **Categorías**: sin tipo en ningún lado del codebase
- Riesgo: drift entre interfaces manuales y 33 migraciones ejecutadas

#### 2.4 Gaps de docs

- `VITE_API_GATEWAY_URL`: solo en SECRETOS_REQUERIDOS, falta en OBTENER_SECRETOS
- `NOTIFICATIONS_MODE`, `SLACK_WEBHOOK_URL`, `SMTP_*`: no documentados en guías de secretos
- A5 docs (allowlist en SECURITY.md y API_README.md): pendiente

#### 2.5 Gaps de infraestructura

- pg_cron: extensión NO habilitada → refresh de MVs manual via RPC
- Sentry: sin DSN real (stub local funciona)
- SendGrid: no operativo (modo simulación)
- Rotación de secretos: plan listo, ejecución pendiente
- `deploy.sh`: 2 bugs críticos (no filtra `_shared/`, no tiene `--no-verify-jwt`)
- Supabase JS: v2.39.3 (Edge Functions) vs v2.95.3 (frontend)

#### 2.6 Clasificación por impacto

- 🔴 **BLOQUEANTE:** Cron jobs con verify_jwt sin auth (3 funciones potencialmente inoperantes). `deploy.sh` bugs.
- 🟡 **IMPORTANTE:** ErrorMessage faltante en POS/Pocket (páginas de operación diaria). Pedidos.tsx bug mutaciones. Tipos manuales con drift. 6 funciones huérfanas desplegadas.
- 🟢 **COSMÉTICO:** Adopción de audit.ts (1/13). Import_map.json duplicado. Carpeta tests/unit/components/ vacía.

**Salida A2:** Tabla: `Pendiente | Ubicación | Criticidad (🔴/🟡/🟢) | Impacto operador | Esfuerzo (h)`

---

### A3 — DETECCIÓN DE FUNCIONALIDAD FANTASMA

**Objetivo:** Identificar código desplegado que no se ejecuta en ningún flujo productivo.

#### 3.1 Edge Functions huérfanas (6 confirmadas, ~5390 líneas)

| Función | Líneas | Archivos | Situación | Acción recomendada |
|---|---|---|---|---|
| `alertas-vencimientos` | 206 | 1 (index.ts) | Implementada completa, sin trigger | **CONECTAR:** crear cron job con auth header |
| `reposicion-sugerida` | 237 | 1 (index.ts) | Implementada completa, sin trigger | **CONECTAR:** crear cron job o integrar en frontend Dashboard |
| `cron-notifications` | 1282 | 1 (index.ts) | Solo llamada por testing-suite (modo simulación) | **INVESTIGAR:** ¿conectar a canal real (email/Slack)? |
| `cron-dashboard` | 1283 | 1 (index.ts) | Admin/devops sin frontend | **INVESTIGAR:** ¿útil sin panel admin? |
| `cron-health-monitor` | 958 | 1 (index.ts) | Solo llamada por testing-suite | **INVESTIGAR:** ¿crear cron para monitoreo real? |
| `cron-testing-suite` | 1424 | 1 (index.ts) | Suite QA manual | **DOCUMENTAR:** herramienta dev-only |

#### 3.2 Endpoints sin caller frontend (~15-18)

Cruzar `API_README.md` (~50 endpoints documentados) con `apiClient.ts` (~32 endpoints implementados). Los restantes probablemente incluyen: categorías CRUD, proveedores CRUD expandido, stock queries detalladas, depósito listado, reservas, compras recepción, reportes generación, health, precios historial/margen.

#### 3.3 `api-proveedor` — diseñada pero desconectada

12 archivos, documentada como server-to-server con shared secret. NINGÚN componente del codebase la invoca. Espera integración futura con proveedor externo.

#### 3.4 Archivos redundantes

- `supabase/functions/import_map.json`: duplica imports de `supabase/functions/deno.json`
- `tests/unit/components/`: carpeta vacía
- `docs/closure/` (42 archivos): históricos de sesiones pasadas, no productivos
- `docs/archive/` (10 archivos): archivados
- `VITE_USE_MOCKS` flag en `tareasApi`: ¿residual, se debe eliminar para producción?

**Salida A3:** Tabla: `Componente | Ubicación | Líneas | Motivo fantasma | Acción: ELIMINAR/CONECTAR/DOCUMENTAR/INVESTIGAR`

---

## SP-C — ANÁLISIS DE DETALLES

**Objetivo:** Evaluar calidad transversal en 4 dimensiones.
**Ejecución:** C1, C2, C3, C4 en **paralelo**. Puede iniciarse en paralelo con SP-A; la priorización final se nutre de A2/A3.
**Entregable:** Mapa de gaps de calidad con priorización.

---

### C1 — MANEJO DE ERRORES Y FEEDBACK

**Objetivo:** ¿Los errores se manejan correctamente y el operador recibe feedback comprensible?

#### 1. Backend: `errors.ts` (227 lín) + `response.ts` (196 lín)

- `errors.ts` mapea ~30 PGRST codes + ~20 SQLSTATE classes → `AppError`/`HttpError`
- `response.ts` envelope `ok()`/`fail()` genera JSON consistente con sanitización
- Solo **2 funciones** (api-minimarket, api-proveedor) usan AMBOS módulos
- **7 funciones** usan response.ts sin errors.ts → manejan errores de BD con catch genérico
- **6 funciones** (cron/scraper) NO usan ninguno → formato de error ad-hoc

**Verificar:** ¿Cómo manejan errores las 6 funciones sin response.ts? ¿JSON válido? ¿HTTP status correcto?

#### 2. Frontend: `ErrorMessage.tsx` (116 lín)

- Props: `message`, `onRetry`, `type` (network/server/generic), `isRetrying`, `size`, `requestId`
- Usado en 7/13 páginas. Las 6 restantes:

| Página | Patrón sin ErrorMessage | Problema |
|---|---|---|
| Deposito | `toast.error()` + estado inline efímero | Sin retry, sin componente completo |
| Clientes | `toast.error()` + div rojo hardcoded | Sin retry |
| Pos | Solo `toast.error()` | Si carga de productos falla, sin indicación visual principal |
| Pocket | Solo `toast.error()` | **Confunde error con estado vacío** |
| Pedidos | `console.error()` en mutaciones + div inline en queries | **Bug: usuario no ve errores de escritura** |
| Login | `useState<string>` → div rojo inline | Funcional pero no estandarizado |

#### 3. Cadena de errores E2E

Trazar: BD error → Edge Function → `errors.ts` → `response.ts` → `apiClient` catch → `ErrorMessage` render.
- ¿El mensaje final al operador es comprensible?
- ¿Está en español?
- ¿`apiClient.ts` traduce errores técnicos a mensajes user-friendly?

#### 4. Errores de auth

- `auth.ts` (344 lín): ¿retorna mensajes claros con JWT inválido/expirado?
- Cache de auth (30s positivo): ¿token revocado permanece válido hasta 30s?
- Circuit breaker: ¿si se abre, el gateway acepta requests sin auth?
- Frontend `useAuth()`: ¿intercepta 401? ¿Auto-redirect a login?

**Salida C1:** Tabla: `Escenario de error | Backend manejo | Frontend manejo | Mensaje al operador | Veredicto (✅/⚠️/❌)`

---

### C2 — CONSISTENCIA DE DATOS

**Objetivo:** ¿Los tipos, schemas y queries son coherentes entre todas las capas?

#### 1. `database.ts` (11 interfaces manuales) vs BD real (33 migraciones)

Comparar campo por campo cada interfaz vs tabla SQL correspondiente:
- `Proveedor`, `Producto`, `PrecioHistorico`, `StockDeposito`, `StockReservado`
- `OrdenCompra`, `MovimientoDeposito`, `ProductoFaltante`, `TareaPendiente`
- `NotificacionTarea`, `Personal`

Identificar: campos en BD pero no en tipos TS. Campos en tipos que no existen en BD.

#### 2. Tipos inline en `apiClient.ts` (~37 tipos) vs `database.ts`

- ¿Hay duplicación o divergencia entre ambos archivos?
- `PedidoResponse`, `VentaResponse`, `ClienteSaldoItem`, etc. — ¿consistentes con tablas reales?
- `Categorías` no tiene tipo en ningún lado — ¿se usa en queries?

#### 3. Queries frontend vs tablas reales

- `useDashboardStats`: 3 queries Supabase directas → ¿columnas existen?
- Dashboard también usa `cuentasCorrientesApi.resumen()` y `bitacoraApi.list()` via apiClient
- `useKardex`, `useDeposito`, `useStock`, `useRentabilidad`, `useProveedores`: ¿columnas seleccionadas existen?

#### 4. Edge Functions vs BD

- 10 handlers de `api-minimarket`: ¿queries usan columnas existentes en tablas reales?
- `scraper-maxiconsumo/storage.ts`: ¿persiste en `precios_proveedor` con campos correctos?
- `alertas-stock`: ¿compara `cantidad_actual` vs `stock_minimo` correctamente?

#### 5. Timezones

- ¿BD usa `timestamptz` o `timestamp`?
- ¿Frontend formatea con timezone local del operador (es-AR)?
- ¿Cron jobs usan UTC?

#### 6. Foreign keys y constraints

- Tablas cron (`cron_jobs_execution_log`, `cron_jobs_metrics`, etc.): ¿tienen FK o son independientes?
- `detalle_pedidos` → `pedidos`: ¿FK con cascade?
- `stock_deposito` → `productos`: ¿FK con restrict?

**Salida C2:** Tabla: `Entidad | database.ts | apiClient.ts | BD migration | Edge Function | Status (ALINEADO/DRIFT/FALTA)`

---

### C3 — UX PARA USUARIO NO-TÉCNICO

**Objetivo:** ¿Un operador de minimarket hispanohablante puede usar el sistema sin capacitación?

#### 1. Idioma

- Verificar TODAS las 13 páginas: ¿textos en español? ¿labels, placeholders, tooltips, confirmaciones?
- ¿Mensajes de error en español comprensible? (ErrorMessage + ErrorBoundary fallback)
- ¿Alertas del sistema en español? (`alert()`, `confirm()`, toast)

#### 2. Formato numérico

- `Pos.tsx` usa `toLocaleString('es-AR')` ✅ — ¿TODAS las páginas lo usan consistentemente?
- ¿Precios con `$` y separador correcto (`.` miles, `,` decimales en es-AR)?
- ¿Cantidades de stock formateadas sin decimales?
- ¿Fechas en formato local (dd/mm/aaaa)?

#### 3. Navegación

- ¿≤3 clicks desde Dashboard a cualquier función?
- Layout sidebar: ¿ítems ordenados por frecuencia de uso?
- Pocket y Pos sin Layout: ¿cómo vuelve al sistema principal? ¿Botón "volver"?

#### 4. Estados vacíos

- ¿Qué ve el operador con 0 datos? (primer uso, tabla vacía)
- 5 páginas con Skeleton: ¿transición loading → datos limpia?
- 8 páginas sin Skeleton: ¿spinner? ¿nada? ¿flash de contenido?

#### 5. Responsive/mobile

- Pos y Pocket sin Layout — ¿diseñados para mobile/tablet?
- Tablas en Stock, Productos, Kardex: ¿usables en pantalla pequeña?
- Botones touch-friendly: ¿≥44px de área táctil?

#### 6. Accesibilidad mínima

- ¿Labels en inputs? ¿Alt en imágenes? ¿Contraste suficiente?
- ¿Focus visible en elementos interactivos?

#### 7. Rubrica medible (para Gate 14)

**Definición operativa:** un operador sin capacitación (solo orientación básica) debe completar un circuito mínimo sin bloqueos ni mensajes inentendibles.

| Métrica | Umbral (✅) | Evidencia mínima |
|---|---|---|
| Circuito mínimo completado (login → stock → depósito → producto → venta POS → kardex) | 6/6 pasos ✅ | checklist + capturas |
| Tiempo total del circuito mínimo | ≤ 45 min | cronómetro + notas |
| Errores bloqueantes sin feedback accionable | 0 | capturas/toasts + request-id si aplica |
| Navegación a funciones principales | ≤ 3 clicks desde Dashboard | recorrido documentado |

**Salida C3:** Tabla: `Página | Español | Formato $ | Skeleton | Empty state | Mobile | Veredicto`

---

### C4 — DEPENDENCIAS EXTERNAS

**Objetivo:** Mapear riesgos de dependencias que no controlamos.

#### 1. Supabase Free Plan

- Edge Functions: 500K invocaciones/mes. ¿Suficiente para ~200 tx/día + 6 cron jobs?
- BD: 500MB. ¿Proyección de crecimiento con `cron_jobs_execution_log` acumulando?
- **Timeout: 60s (free tier).** `scraper-maxiconsumo` cron SQL configura 120-600s pero free tier limita a 60s. ¿Scraping completa en <60s?
- Bandwidth: 5GB/mes. ¿Scraping genera tráfico significativo?

#### 2. Maxiconsumo scraping

- ¿ToS prohíbe scraping? Riesgo legal.
- Frecuencia: `realtime_change_alerts` cada 15 min + `daily_price_update` diario. ¿Agresivo?
- `anti-detection.ts` (existente) y `utils/cookie-jar.ts`: ¿implementaciones reales o placeholders?
- Plan B si Maxiconsumo bloquea: ¿el sistema funciona sin precios de proveedor?

#### 3. npm dependencies

- Vulnerabilidad moderada: lodash 4.17.21 via recharts (Prototype Pollution) — riesgo bajo en contexto frontend
- `npm audit` del root: 0 vulnerabilidades
- Vitest: 4.0.18 (root) vs 4.0.17 (frontend) — discrepancia minor, no crítica

#### 4. Supabase JS version gap

- Edge Functions: `@supabase/supabase-js@2.39.3` (fijo en deno.json + import_map.json duplicado)
- Frontend: v2.95.3
- ¿Breaking changes entre versiones? ¿Incompatibilidad de tipos?

#### 5. Rate-limit en producción

- `_shared/rate-limit.ts` (273 lín): in-memory (`Map<string, RateLimitState>`)
- NO sobrevive cold starts. NO se comparte entre isolates de Deno Deploy.
- Migración `20260208020000_add_rate_limit_state.sql` crea tabla BD.
- **Verificar:** ¿El código de rate-limit.ts usa esa tabla BD? ¿O solo el Map in-memory?
- En producción distribuida: **rate limiting actual probablemente inefectivo**.

**Salida C4:** Tabla: `Dependencia | Riesgo | Probabilidad | Impacto | Mitigación existente | Acción`

---

## SP-B — VALIDACIÓN FUNCIONAL

**Objetivo:** Verificar que los flujos reales del operador funcionan de punta a punta.
**Ejecución:** B1 → B2 → B3 → B4 **secuencial** estricto.
**Depende de:** A1 mínimo (inventario) + evidencia parcial de C1/C3. Se recomienda SP-A + SP-C completos antes de B2.
**Entregable:** Veredicto funcional por flujo + mapa de eslabones rotos.

---

### B1 — SIMULACIÓN DE JORNADA DEL OPERADOR

**Contexto:** Todo el tráfico frontend pasa por `api-minimarket` como gateway único, excepto Dashboard que es **híbrido** (Supabase directo + apiClient).

| # | Tarea diaria | Página | APIs/Hooks | Verificar |
|---|-------------|--------|-----------|-----------|
| 1 | Login | Login.tsx | Supabase Auth directo | ¿Redirige a `/`? ¿Maneja credenciales incorrectas? |
| 2 | Ver dashboard | Dashboard.tsx | `useDashboardStats` (Supabase directo) + `apiClient` (bitácora, CC) | ¿3 queries paralelas + 2 apiClient? ¿Stats correctos? |
| 3 | Consultar stock | Stock.tsx | `useStock` | ¿Cantidad vs mínimo? ¿Filtros funcionan? |
| 4 | Registrar ingreso | Deposito.tsx | `depositoApi.movimiento` | ¿Crea movimiento entrada? ¿Actualiza stock_deposito? |
| 5 | Gestionar productos | Productos.tsx | `productosApi` + `preciosApi` | ¿CRUD completo? ¿Aplicar precio funciona? |
| 6 | Vender (POS) | Pos.tsx | `ventasApi` + `searchApi` + `ofertasApi` + `clientesApi` | ¿Carrito → pago → idempotencia UUID? ¿Descuenta stock? ¿WhatsApp recibo? |
| 7 | Venta rápida mobile | Pocket.tsx | `depositoApi` + `insightsApi` | ¿Barcode scanner? ¿3 modos (stock/etiqueta/precio)? |
| 8 | Gestionar pedidos | Pedidos.tsx | `pedidosApi` | ¿CRUD + estado + pago? **⚠️ Bug: mutaciones sin feedback error** |
| 9 | Gestionar clientes | Clientes.tsx | `clientesApi` + `cuentasCorrientesApi` | ¿Alta + saldo + pago CC? |
| 10 | Revisar tareas | Tareas.tsx | `tareasApi` | ¿Crear/completar/cancelar? ¿`VITE_USE_MOCKS` apagado en prod? |
| 11 | Consultar kardex | Kardex.tsx | `useKardex` | ¿Movimientos con filtro producto/lote? |
| 12 | Ver rentabilidad | Rentabilidad.tsx | `useRentabilidad` | ¿Márgenes calculados correctamente? |
| 13 | Ver proveedores | Proveedores.tsx | `useProveedores` | ¿Lista con datos útiles? |

**Salida B1:** Tabla: `Tarea | Estado (✅/⚠️/❌) | Bloqueantes | Gaps UX`

---

### B2 — FLUJOS CRÍTICOS E2E

**5 flujos completos verificando CADA eslabón:**

#### Flujo 1 — Stock → Alerta → Notificación

```
Deposito.tsx → POST /deposito/movimiento → api-minimarket/routers/deposito.ts
→ UPDATE stock_deposito SET cantidad_actual
→ cantidad_actual < stock_minimo?
→ pg_cron: alertas-stock (cada 1h) [⚠️ verify_jwt=true SIN auth header]
→ ¿alerta generada? → ¿notificación entregada? → ¿Dashboard muestra?
```

**Punto crítico:** ¿El cron job `alertas-stock_invoke` funciona con verify_jwt=true y sin Authorization header? Verificar en `cron_jobs_execution_log`.

#### Flujo 2 — Scraping de precios

```
pg_cron: daily_price_update (02:00) → cron-jobs-maxiconsumo + Bearer token ✅
→ orchestrator.ts → jobs/daily-price-update.ts
→ fetch(scraper-maxiconsumo) internamente
→ anti-detection → scraping → parsing → matching → storage
→ precios_proveedor actualizada
→ ¿Frontend muestra precios actualizados? ¿Insights arbitraje funciona?
```

**Punto crítico:** Timeout de 300s (cron SQL config) vs 60s (free tier). ¿Scraping completa dentro del límite?

#### Flujo 3 — Venta completa POS

```
Pos.tsx: buscar producto (searchApi) → agregar carrito → seleccionar cliente (opcional)
→ POST /ventas (ventasApi.create con idempotencyKey UUID)
→ api-minimarket/handlers/ventas.ts
→ INSERT ventas + UPDATE stock_deposito (descontar)
→ ¿Kardex registrado? ¿Stock actualizado? ¿CC actualizada si fiado?
→ ¿WhatsApp recibo funcional?
```

**Punto crítico:** `sp_reservar_stock` con ON CONFLICT fix (migración 20260209). ¿Maneja concurrencia de 2 ventas simultáneas?

#### Flujo 4 — Pedido E2E

```
Pedidos.tsx: crear pedido (pedidosApi.create)
→ api-minimarket/handlers/pedidos.ts (383 lín)
→ INSERT pedidos + detalle_pedidos
→ updateEstado: pendiente → en_preparacion → listo → entregado
→ updatePago: registrar pago
→ ⚠️ Bug: mutaciones solo console.error → usuario no ve errores
```

#### Flujo 5 — Monitoreo de cron jobs

```
cron-health-monitor → [⚠️ SIN TRIGGER — huérfana]
→ cron-dashboard → [⚠️ SIN FRONTEND — huérfana]
→ Flujo NO funciona E2E — ambas funciones son huérfanas.
```

**Veredicto esperado:** Flujo 5 FALLA por diseño. No hay panel de monitoreo operativo.

**Salida B2:** Tabla por flujo: `Paso | Componente | Entrada | Salida | ¿Funciona? | Eslabón roto?`

---

### B3 — UTILIDAD REAL DE OUTPUTS

**Test:** Para cada output, responder: *"Un operador que ve esto, ¿sabe qué hacer a continuación?"*

| Output | Función/Página | Evaluar accionabilidad |
|---|---|---|
| Dashboard stats | Dashboard.tsx | ¿Tareas urgentes al primer vistazo? ¿Stock bajo dice QUÉ producto reponer? |
| Alertas stock bajo | alertas-stock (cron) | ¿Producto + cantidad restante + sugerencia? ¿O solo "stock bajo"? |
| Alertas vencimientos | alertas-vencimientos **(HUÉRFANA)** | No llega al operador — función nunca se ejecuta |
| Reposición sugerida | reposicion-sugerida **(HUÉRFANA)** | No llega al operador — función nunca se ejecuta |
| Precios scraper | scraper → insightsApi.arbitraje | ¿Muestra precio proveedor vs venta vs margen? ¿Comprensible? |
| Rentabilidad | Rentabilidad.tsx | ¿Márgenes por producto? ¿Promedio? ¿Exportable? |
| Reportes | reportes-automaticos (cron) | ¿Se envían (email/canal) o solo BD? ¿Formato legible? |
| Notificaciones | notificaciones-tareas (cron) | ¿Canal real? ¿O solo registro en BD? |
| Recibo WhatsApp | Pos.tsx | ¿Formateado con productos + totales + datos negocio? |
| Bitácora | Dashboard.tsx (bitacoraApi) | ¿Últimas 10 acciones comprensibles? |

**Salida B3:** Tabla: `Output | Contenido | Accionable (Sí/Parcial/No) | Canal de entrega | Veredicto`

---

### B4 — CONDICIONES ADVERSAS REALES

| # | Escenario | Qué verificar | Dónde mirar |
|---|-----------|---------------|-------------|
| 1 | **Maxiconsumo cambia HTML** | ¿`parsing.ts` detecta estructura inesperada? ¿Genera alerta o falla silenciosamente? | `scraping.ts`, `parsing.ts`, `alertas.ts` |
| 2 | **BD acumula logs** | ¿`cron_jobs_execution_log` crece sin límite? ¿`jobs/maintenance.ts` tiene rotación? ¿Índices? | `maintenance.ts`, migraciones de índices |
| 3 | **Edge Function timeout** | ¿`scraper-maxiconsumo` completa en <60s (free tier)? ¿Circuit breaker actúa? | `config.ts`, `circuit-breaker.ts` |
| 4 | **Datos incorrectos** | ¿Stock puede ser negativo? ¿Precio con formato incorrecto? ¿`validation.ts` (130 lín) cubre? | `validation.ts`, handlers, componentes React |
| 5 | **Sesión expirada** | ¿`auth.ts` retorna error claro? ¿Frontend intercepta 401? ¿Auto-redirect a login? | `auth.ts`, `apiClient.ts`, `AuthContext.tsx` |
| 6 | **Cron job falla** | ¿`orchestrator.ts` aísla fallos entre jobs? ¿`execution-log.ts` registra? ¿Alerta? | `orchestrator.ts`, `execution-log.ts` |
| 7 | **Concurrencia** | ¿2 ventas simultáneas del mismo producto? ¿`sp_reservar_stock` ON CONFLICT funciona? | migración `20260209`, stored procedure |

**Para cada escenario:** ¿Qué ve el operador? ¿El sistema se recupera? ¿Se pierde data?

**Salida B4:** Tabla: `Escenario | Comportamiento actual | Riesgo | Impacto en operador | Mitigación existente | Acción`

---

## SP-D — OPTIMIZACIÓN

**Objetivo:** Identificar y priorizar fixes técnicos.
**Ejecución:** D2 → D3 → D1 → D4 **secuencial**.
**Depende de:** SP-B.
**Entregable:** Lista priorizada de fixes con esfuerzo estimado.

---

### D2 — CÓDIGO MUERTO

#### 1. Edge Functions huérfanas (de A3)

Decisión requerida para cada función: ¿eliminar, conectar (crear cron/integrar en frontend), o documentar como dev-only?

#### 2. Archivos redundantes

| Archivo/carpeta | Situación | Acción propuesta |
|---|---|---|
| `supabase/functions/import_map.json` | Duplica imports de `deno.json` | Verificar si Supabase CLI lo necesita, si no: eliminar |
| `tests/unit/components/` | Carpeta vacía | Eliminar |
| `VITE_USE_MOCKS` en `tareasApi` | Flag de desarrollo | Evaluar si se elimina para producción |
| `docs/closure/` (42 archivos) | Históricos de sesiones pasadas | Mover a branch `archive` o subdirectorio marcado |
| `docs/archive/` (10 archivos) | Archivados | Verificar que no hay referencias rotas |

#### 3. Endpoints sin caller frontend (~15-18)

¿Documentar como "API disponible para futuras integraciones" o eliminar handlers? Decisión de producto.

#### 4. Tests legacy

CI marca `tests/performance/`, `tests/security/`, `tests/api-contracts/` como "LEGACY desactivado". ¿Migrar a Vitest o eliminar?

**Salida D2:** Tabla: `Artefacto | Tipo | Líneas/archivos | Acción: ELIMINAR/CONSERVAR/DOCUMENTAR | Justificación`

---

### D3 — SEGURIDAD

#### 1. Autenticación `api-minimarket` (verify_jwt=false)

- `auth.ts` (344 lín): validación JWT manual + cache SHA-256 (30s pos/10s neg) + circuit breaker (3 fallos → 15s open) + timeout 5s
- **Riesgo cache:** Un token revocado permanece válido hasta 30s
- **Riesgo circuit breaker:** Si se abre, ¿el gateway acepta requests sin auth? Verificar comportamiento
- `requireRole()` valida contra `app_metadata.rol` (no `user_metadata`) ✅
- **deploy.sh NO tiene `--no-verify-jwt`** — redeployment rompería el gateway

#### 2. RLS (Row Level Security)

- Migración RLS v2: deny-by-default + `has_personal_role()` en 10 tablas P0
- **Verificar:** ¿Tablas nuevas post-RLS v2 (pedidos, clientes, ventas, ofertas, bitácora) tienen RLS?
- `AUDITORIA_RLS_CHECKLIST.md` + `AUDITORIA_RLS_EJECUTADA_2026-01-31.md`: ¿cubren tablas nuevas?

#### 3. CORS producción

- `_shared/cors.ts` (128 lín): si `ALLOWED_ORIGINS` no configurado, fallback a `localhost:5173`
- ¿Variable configurada en Supabase dashboard para dominio de producción?
- ¿Wildcard `*` permitido en algún punto? Verificar

#### 4. Rate limiting real

- `_shared/rate-limit.ts` (273 lín): in-memory `Map`, NO sobrevive cold starts
- Migración `20260208020000`: crea tabla BD para rate limit persistente
- **Verificar:** ¿El código usa la tabla BD o solo el Map in-memory?
- En Deno Deploy con múltiples isolates: cada isolate tiene su propio contador → **inefectivo**

#### 5. Secrets

- ¿`.env` en `.gitignore`? Verificar
- ¿`.env.example` sin valores reales? Verificar
- ¿`SUPABASE_SERVICE_ROLE_KEY` aparece en código frontend? Grep en `minimarket-system/src/`
- ¿Secrets hardcodeados en Edge Functions? Grep strings `eyJ`, `sk_`, `SG.`
- ¿GitHub CI tiene secrets configurados? (Actualmente: NO, build usa placeholder)

#### 6. 3 cron jobs sin auth (HC-1)

- Verificar si `alertas-stock`, `notificaciones-tareas`, `reportes-automaticos` ejecutan o fallan
- Si fallan con 401: **agregar Bearer token al cron SQL** o **re-deploy con `--no-verify-jwt`**
- Si no fallan: ¿por qué no? ¿`net.http_post` interno bypasea Kong?

#### 7. Input validation

- `validation.ts` (130 lín): ¿valida UUIDs? ¿Sanitiza strings? ¿Previene injection?
- ¿Handlers validan body de POST/PUT antes de queries?
- ¿Frontend valida antes de enviar?

**Salida D3:** Tabla: `Vector | Riesgo (Alto/Medio/Bajo) | Estado actual | Mitigación | Acción requerida`

---

### D1 — PERFORMANCE REAL

#### 1. Cold start de `api-minimarket`

- `index.ts` = 2184 lín + 21 módulos = 5767 lín total
- ¿Cuánto tarda el primer request después de inactividad?
- ¿Lazy loading de handlers o todo se importa al inicio?

#### 2. Queries ineficientes

- Buscar `SELECT *` en Edge Functions y hooks frontend — ¿se seleccionan solo columnas necesarias?
- `useDashboardStats` hace `select('*')` + `limit(100)` en stock y filtra client-side → potencialmente ineficiente
- ¿Paginación implementada en listados grandes?

#### 3. Índices

- ¿`stock_deposito` tiene índice en `producto_id` + `cantidad_actual`?
- ¿`cron_jobs_execution_log` tiene índice en `created_at` para rotación?
- ¿Migraciones crean índices en campos de filtro frecuente?

#### 4. Vistas materializadas

- MVs creadas en migración `20260206235900`
- Refresh via RPC en `20260208010000`
- pg_cron NO instalado → refresh manual → ¿datos desactualizados?

#### 5. Proyección de escala

- ~500-2000 productos, ~50-200 transacciones/día
- ¿`cron_jobs_execution_log` sin rotación acumula datos indefinidamente?
- ¿`jobs/maintenance.ts` implementa limpieza?
- ¿BD 500MB (free tier) suficiente para 12 meses?

#### 6. Frontend performance

- React lazy loading de 13 páginas: ¿bundle splitting funciona?
- TanStack Query: ¿`staleTime` configurado? ¿Refetch innecesarios?
- ¿Re-renders excesivos en componentes de lista?

**Salida D1:** Tabla: `Aspecto | Estado actual | Riesgo | Impacto a 6 meses | Acción`

---

### D4 — OPTIMIZACIÓN UX FINAL

#### Quick wins (esfuerzo bajo, impacto alto)

| Fix | Páginas | Esfuerzo | Impacto |
|---|---|---|---|
| Agregar `ErrorMessage` a 6 páginas | Deposito, Pedidos, Pocket, Pos, Clientes, Login | ~2-3h | 🔴 ALTO — operador ve errores comprensibles |
| Fix bug Pedidos.tsx mutaciones | Pedidos | ~30min | 🔴 ALTO — feedback de errores de escritura |
| Agregar Skeleton loading a 8 páginas | Deposito, Kardex, Rentabilidad, Proveedores, Pocket, Pos, Clientes, Login | ~3-4h | 🟡 MEDIO — feedback de carga profesional |
| Verificar `toLocaleString('es-AR')` en 13 páginas | Todas | ~1h | 🟡 MEDIO — consistencia formato moneda |
| Verificar estados vacíos (primer uso) | Todas | ~2h | 🟡 MEDIO — operador sabe qué hacer con 0 datos |

#### Mejoras estructurales (esfuerzo medio)

| Mejora | Scope | Esfuerzo | Impacto |
|---|---|---|---|
| ErrorBoundaries granulares por ruta | App.tsx | ~2h | 🟡 MEDIO — error en una página no crashea toda la app |
| Alertas accionables en Dashboard | Dashboard.tsx | ~3h | 🔴 ALTO — "Stock bajo en HARINA → Reponer" vs solo "stock bajo" |
| Exportación de reportes (PDF/CSV) | reportes-automaticos | ~4h | 🟡 MEDIO — valor real del sistema de reportes |
| Onboarding de primer uso | Nuevo componente | ~4h | 🟡 MEDIO — valor desde el minuto 1 |
| Fix `deploy.sh` (2 bugs) | deploy.sh | ~30min | 🔴 ALTO — deployment seguro |

**Salida D4:** Lista priorizada de fixes UX con esfuerzo, dependencias y asignación.

---

## SP-E — PRODUCCIÓN

**Objetivo:** Determinar si el sistema está listo para deploy a producción.
**Ejecución:** E2 → E1 → E3 → E4 **secuencial**.
**Depende de:** SP-D.
**Entregable:** Checklist go/no-go con estado binario de cada ítem.

---

### E2 — VARIABLES DE ENTORNO Y SECRETS

#### 1. Inventario completo (cruzar 3 fuentes)

- `docs/OBTENER_SECRETOS.md`
- `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`
- Grep de `Deno.env.get(` en Edge Functions + `import.meta.env.` en frontend

#### 2. Verificar configuración actual

- ¿Supabase dashboard tiene los secrets obligatorios?
- ¿GitHub CI tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`? (Actualmente: NO, build usa placeholder)
- ¿`ALLOWED_ORIGINS` apunta a dominio de producción o a localhost?

#### 3. Gaps documentales

- `VITE_API_GATEWAY_URL`: solo en SECRETOS_REQUERIDOS, **falta en OBTENER_SECRETOS**
- `NOTIFICATIONS_MODE`, `SLACK_WEBHOOK_URL`, `SMTP_*`: no documentados en ninguna guía de secretos
- ¿Estos secrets son realmente usados? Verificar con grep

#### 4. Seguridad de secrets

- ¿Rotación ejecutada? Plan listo en `SECRET_ROTATION_PLAN.md` pero no ejecutado
- ¿`API_PROVEEDOR_SECRET` suficientemente fuerte?
- ¿`.env.example` con valores placeholder, no reales?

**Salida E2:** Tabla: `Secret | Configurado en Supabase | Configurado en CI | Documentado | Usado por | Estado`

---

### E1 — CHECKLIST DE DESPLIEGUE

#### Pre-deploy

| Check | Comando/acción | Estado esperado |
|---|---|---|
| Unit tests pasan | `npx vitest run tests/unit/` | 46 archivos, 0 fallos |
| Frontend tests pasan | `cd minimarket-system && pnpm test:components` | 16 archivos, 0 fallos |
| Frontend build | `cd minimarket-system && pnpm build` | Sin errores (warnings OK) |
| TypeScript check | `cd minimarket-system && npx tsc --noEmit` | 0 errores |
| Edge Functions syntax | `deno check --no-lock` × 13 funciones | 0 errores |
| Sin console.log debug | Grep `console.log` en Edge Functions + frontend prod | Solo logs intencionales |
| Sin secrets hardcodeados | Grep `eyJ`, `sk_`, `SG.` en codebase | 0 resultados |
| CI pipeline | GitHub Actions `ci.yml` | 6/6 jobs obligatorios verdes |

#### Supabase producción

| Check | Acción | Estado esperado |
|---|---|---|
| 33 migraciones aplicadas | Verificar con `supabase db push` o SQL Editor | Todas aplicadas |
| RLS habilitado | Dashboard → Auth → Policies | Todas las tablas cubiertas |
| 13 Edge Functions ACTIVE | `supabase functions list` | 13 ACTIVE |
| `api-minimarket` verify_jwt=false | Deploy con `--no-verify-jwt` (NO usar deploy.sh actual) | verify_jwt=false |
| **HC-1 fix: 3 cron jobs** | Agregar Bearer token AL cron SQL de alertas-stock, notificaciones-tareas, reportes-automaticos | Jobs ejecutan sin 401 |
| 6 cron jobs configurados | Ejecutar `deploy_all_cron_jobs.sql` (con fix auth) en SQL Editor | Jobs visibles |
| Secrets obligatorios | Verificar en Supabase Secrets | Todos presentes |
| `ALLOWED_ORIGINS` producción | Apunta a dominio real | No localhost |

#### Frontend hosting

| Check | Acción | Estado esperado |
|---|---|---|
| `VITE_SUPABASE_URL` | Apunta a `dqaygmjpzoqjjrywdsxi.supabase.co` | Producción |
| `VITE_SUPABASE_ANON_KEY` | Key de producción correcta | Funcional |
| `VITE_API_GATEWAY_URL` | URL completa del gateway Edge Function | Funcional |
| HTTPS | Hosting con SSL activo | Configurado |
| SPA redirect | `/*` → `index.html` | Configurado |

#### Post-deploy verificación

| Check | Método |
|---|---|
| Login funciona | Probar con credenciales reales |
| Dashboard carga con datos | Verificar 3 stats + bitácora + CC |
| CRUD Stock | Crear/leer/editar movimiento |
| POS venta completa | Simular venta → verificar stock descuenta → kardex registra |
| Cron ejecuta | Esperar scheduling → verificar `cron_jobs_execution_log` |
| Todas las 13 rutas accesibles | Navegar /, /stock, /productos, /tareas, /kardex, /rentabilidad, /proveedores, /pedidos, /deposito, /clientes, /pos, /pocket, /login |

**Salida E1:** Checklist: ✅ Pasa / ❌ Falla / ⚠️ Parcial / 🔒 Bloqueado

---

### E3 — LOGGING Y MONITOREO

#### 1. `_shared/logger.ts` — 13/13 funciones lo usan ✅

- ¿Logs van a Supabase Edge Function logs?
- ¿Formato estructurado (JSON) o texto plano?
- ¿Niveles info/warn/error correctamente usados?
- ¿Incluye request-id para correlación?

#### 2. `cron_jobs_execution_log`

- ¿Cada ejecución genera entrada?
- ¿`execution-log.ts` registra resultado + duración?
- ¿`maintenance.ts` implementa rotación/limpieza?

#### 3. Sentry (BLOQUEADO)

- Infraestructura local: `observability.ts` con `reportError()` (localStorage, máx 50 errores)
- `ErrorBoundary` ya llama `reportError()` en `componentDidCatch`
- **Falta:** Cuenta Sentry + DSN real. Plan en `SENTRY_INTEGRATION_PLAN.md`
- No bloqueante para MVP, pero **sin visibilidad de errores frontend en producción**

#### 4. Canales de alerta — Estado REAL

| Canal | Estado |
|---|---|
| Sentry | BLOQUEADO (sin DSN) |
| SendGrid email | No operativo (modo simulación) |
| Slack Webhook | No configurado |
| Push notifications | No implementado |
| **Resultado** | **NO hay canal de alerta real en producción** |

#### 5. Health checks

- ¿`api-minimarket` tiene endpoint `/health`? Verificar implementación
- `cron-health-monitor` (huérfana): potencialmente útil si se le agrega cron job
- ¿Hay uptime monitoring externo (UptimeRobot, Better Stack)?

**Salida E3:** Tabla: `Canal | Configurado | Funcional | Cobertura | Acción requerida`

---

### E4 — ROLLBACK

#### 1. Migraciones SQL

- Template transaccional en `docs/ROLLBACK_SQL_TEMPLATE.md` (BEGIN/COMMIT)
- Ejemplo concreto: `ROLLBACK_20260116000000_create_stock_aggregations.sql`
- Verificación post-rollback: `docs/verify_rollback.sql`
- Evidencia de rollback exitoso previo: `ROLLBACK_EVIDENCE_2026-01-29.md`
- **¿Las 33 migraciones son TODAS reversibles?** ¿Hay migraciones destructivas (DROP sin backup)?

#### 2. Edge Functions

- Supabase mantiene versiones → re-deploy a versión anterior posible
- ¿Proceso documentado? Tiempo estimado: ~5min por función

#### 3. Frontend

- CI genera artefacto `frontend-build` (7 días retención)
- Re-deploy del bundle anterior es posible

#### 4. Datos

- Supabase free tier NO tiene PITR (Point-in-Time Recovery) — solo Pro ($25/mo)
- ¿Hay proceso de backup manual documentado?
- ¿`pg_dump` periódico configurado?
- **Riesgo:** Sin backup automatizado, un error destructivo en BD no es reversible

**Salida E4:** Tabla: `Componente | Rollback posible | Método | Tiempo estimado | Riesgo de data loss`

---

## SP-F — UTILIDAD REAL

**Objetivo:** Evaluar desde la perspectiva del operador de minimarket.
**Ejecución:** F1 → F2 → F3 **secuencial**.
**Depende de:** SP-B + SP-E.
**Entregable:** Evaluación de utilidad real + features sobre-ingenierizados.

---

### F1 — ¿RESUELVE EL PROBLEMA REAL?

**Pregunta central:** ¿Un dueño de minimarket puede gestionar su negocio diario con este sistema?

Cadena de valor a verificar:

```
Inventario (Stock + Deposito + Kardex)
    ↓
Precios (Productos + Scraper → Insights arbitraje + Rentabilidad)
    ↓
Ventas (POS + Pocket + Clientes + Cuentas Corrientes)
    ↓
Alertas (Stock bajo + Vencimientos + Tareas)
    ↓
Reportes (reportes-automaticos + Dashboard stats + Bitácora)
```

**Para cada eslabón:** ¿Completamente funcional? ¿Parcial? ¿Roto?

| Necesidad del operador | Cubierta por | Evaluar |
|---|---|---|
| Saber cuánto tengo de cada producto | Stock.tsx + Deposito.tsx + Kardex.tsx | ¿Datos correctos? ¿Actualizados? |
| Comparar precios con proveedores | scraper + insightsApi → RentabilidaD | ¿Scraping funciona? ¿Datos útiles? |
| Vender con registro completo | Pos.tsx + Pocket.tsx | ¿Carrito → stock → kardex → recibo? |
| Gestionar clientes con CC | Clientes.tsx + cuentasCorrientesApi | ¿Crédito, saldos, pagos? |
| Recibir alertas | alertas-stock + alertas-vencimientos + notificaciones-tareas | ¿Alertas llegan? ¿Por qué canal? |
| Ver reportes de mi negocio | Dashboard + Rentabilidad + reportes-automaticos | ¿Datos accionables? ¿Exportables? |

**Criterio F1 (medible):** ✅ si las 3 filas P0 (Inventario, Ventas, Clientes/CC) están en ✅ y al menos 2/3 filas P1 (Precios, Alertas, Reportes) están en ✅ o ⚠️.

**Salida F1:** Tabla: `Necesidad del negocio | Cubierta por | Estado (✅/⚠️/❌) | Gap`

---

### F2 — ¿VALOR DESDE EL MINUTO 1?

**Pregunta:** La primera vez que el operador usa el sistema, ¿obtiene valor?

| Paso del primer uso | Verificar |
|---|---|
| Crear primer usuario | ¿Por Supabase dashboard? ¿Registro self-service? |
| Login | ¿Claro? ¿Redirige correctamente? |
| Dashboard con 0 datos | ¿Muestra algo útil o pantalla vacía? |
| Cargar primer producto | ¿Intuitivo desde Productos.tsx sin instrucción? |
| Primera venta | ¿POS funciona con solo 1 producto? |
| ¿Hay datos seed? | ¿BD viene con datos de ejemplo? |
| ¿Hay guía de primer uso? | ¿Onboarding wizard o tutorial? |
| ¿Funciones críticas sin cron? | ¿Stock y POS funcionan sin configurar cron jobs? |

**Métrica (TTFV):** desde login hasta primera venta registrada (y visible en Kardex) ≤ 20 min con dataset mínimo.

**Salida F2:** Lista: `Paso | Funciona | UX | Fricción | Mejora sugerida`

---

### F3 — FUNCIONALIDAD QUE NADIE USARÁ

**Pregunta:** ¿Hay features sobre-ingenierizados para un minimarket de ~200 tx/día?

| Feature | Líneas | Usuario objetivo | ¿Minimarket lo necesita? | Veredicto |
|---|---|---|---|---|
| `cron-testing-suite` | 1424 | DevOps/QA | No en producción | INNECESARIO (dev-only) |
| `cron-dashboard` | 1283 | DevOps/Admin | Sin frontend → no accesible | INNECESARIO |
| `cron-health-monitor` | 958 | SRE | Sin trigger → no ejecuta | INNECESARIO |
| `cron-notifications` | 1282 | Sistema | Potencial si se conecta a canal real | INVESTIGAR |
| `circuit-breaker.ts` | ~200 | Arquitecto | Overkill para volumen, útil como seguro | OVERKILL pero conservar |
| `audit.ts` | ~150 | Compliance | 1/13 funciones lo usa | OVERKILL |
| `anti-detection.ts` + `cookie-jar.ts` | ~300 | Scraper | Necesario si Maxiconsumo bloquea | NECESARIO |
| `docs/closure/` | 42 archivos | Desarrollo | Históricos de sesión | INNECESARIO post-producción |

**Total potencialmente innecesario:** ~5000+ líneas de código desplegado + 42 archivos docs.

**Salida F3:** Tabla: `Feature | Líneas | Veredicto: NECESARIO/OVERKILL/INNECESARIO | Acción: ELIMINAR/CONSERVAR/DOCUMENTAR`

---

## SP-Ω — CIERRE

**Objetivo:** Consolidar TODOS los hallazgos en un veredicto único e inapelable.
**Depende de:** Todos los sub-planes anteriores.
**Entregable:** 18 gates binarios + veredicto final.

---

### CHECKLIST DEFINITIVO DE CONFIANZA — 18 GATES

| # | Gate | Fuentes de evidencia | Riesgo pre-auditoría | Estado |
|---|------|---------------------|---------------------|--------|
| 1 | Auth funciona E2E (login → JWT → api-minimarket → datos) | B1, B2, D3 | BAJO | ⬜ |
| 2 | CRUD Stock funciona (listar, crear movimiento, actualizar) | B1, B2 | BAJO | ⬜ |
| 3 | POS venta completa (carrito → pago → stock → kardex) | B1, B2 | MEDIO | ⬜ |
| 4 | Alertas stock bajo llegan al operador | B2, B3, D3 | **ALTO** (cron sin auth — HC-1) | ⬜ |
| 5 | Alertas vencimientos funcional | B2, A3 | **ALTO** (función huérfana) | ⬜ |
| 6 | Reposición sugerida funcional | B3, A3 | **ALTO** (función huérfana) | ⬜ |
| 7 | RLS correcto en TODAS las tablas con datos sensibles | D3 | MEDIO | ⬜ |
| 8 | No hay secrets expuestos en código fuente | D3, E2 | BAJO | ⬜ |
| 9 | Rate-limit efectivo en endpoints públicos | D3, C4 | **ALTO** (in-memory, inefectivo) | ⬜ |
| 10 | 6 cron jobs configurados ejecutan sin error | B2, E1, D3 | **ALTO** (3 sin auth — HC-1) | ⬜ |
| 11 | 33 migraciones aplicadas correctamente en producción | E1 | BAJO | ⬜ |
| 12 | Mensajes de error en español comprensible para operador | C1, C3 | MEDIO | ⬜ |
| 13 | ErrorMessage en las 13 páginas [hoy 7/13, requiere D4] | C1, D4 | **ALTO** | ⬜ |
| 14 | Operador puede usar sin capacitación técnica (rubrica C3.7/F2) | C3, F1, F2 | MEDIO | ⬜ |
| 15 | Plan de rollback documentado y probado | E4 | BAJO | ⬜ |
| 16 | Monitoreo activo con canal de alertas real | E3 | **ALTO** (sin canal real) | ⬜ |
| 17 | 13 Edge Functions healthy (ACTIVE en Supabase) | E1 | BAJO | ⬜ |
| 18 | CI pipeline 6/6 jobs obligatorios verdes | E1 | BAJO | ⬜ |

### Criterio de veredicto

| Resultado | Condición |
|---|---|
| ✅ **LISTO PARA PRODUCCIÓN** | 18/18 gates ✅ |
| ⚠️ **OPERABLE CON RESERVAS** | 9 gates obligatorios ✅ + resto puede ser ⚠️ |
| ❌ **NO LISTO** | Cualquier gate obligatorio es ❌ |

### Perfiles de decisión (Piloto vs Producción)

| Perfil | Requisito mínimo | Notas |
|---|---|---|
| Piloto (MVP) | Gates 1, 2, 3, 4, 7, 8, 11, 17, 18 en ✅ | Permite operar con reservas para validar en campo |
| Producción (go-live) | Gates de Piloto + 15 y 16 en ✅ | Rollback probado + monitoreo mínimo pasan a ser obligatorios |

### Core mínimo (Piloto/MVP) — 9 gates obligatorios

| Gate | Razón |
|---|---|
| 1 — Auth | Sin auth no hay sistema |
| 2 — Stock | Función primaria del minimarket |
| 3 — POS | Sin ventas no hay negocio |
| 4 — Alertas stock bajo | Prevención de quiebres |
| 7 — RLS | Seguridad de datos |
| 8 — Secrets | Seguridad fundamental |
| 11 — Migraciones | BD funcional |
| 17 — Functions healthy | Backend operativo |
| 18 — CI verde | Pipeline confiable |

### Opcionales (Piloto/MVP) — pueden ser ⚠️ sin bloquear

| Gate | Nota |
|---|---|
| 5 — Vencimientos | Función huérfana, valor futuro |
| 6 — Reposición | Función huérfana, valor futuro |
| 9 — Rate-limit | Riesgo bajo en volumen actual (~200 tx/día) |
| 10 — Cron jobs | Los 3 de maxiconsumo funcionan; los otros 3 requieren fix |
| 12 — Errores español | Mejorable post-MVP |
| 13 — ErrorMessage | D4 resuelve; mejorable incrementalmente |
| 14 — UX sin capacitación | Mejorable con onboarding post-MVP |
| 15 — Rollback | Template existe, testear pre-producción |
| 16 — Monitoreo | Crítico pero no bloqueante para MVP |

### 7 gates con riesgo ALTO (más probables de fallar)

Gates 4, 5, 6, 9, 10, 13, 16 — estos serán los que determinen si el veredicto es "CON RESERVAS" o "NO LISTO".

### Entregable final SP-Ω

1. Estado de cada gate con evidencia concreta (capturas, logs, outputs)
2. Lista de fixes obligatorios pre-producción (bloqueantes)
3. Lista de fixes recomendados post-MVP (mejoras)
4. **Veredicto: LISTO / CON RESERVAS / NO LISTO**
5. Condiciones específicas para pasar de "CON RESERVAS" a "LISTO"

---

## RESUMEN DE EJECUCIÓN

| Sub-Plan | Prompts | Tipo ejecución | Esfuerzo est. | Entregable principal |
|---|---|---|---|---|
| **SP-A** | A1 + A2 + A3 | Paralelo | 4-6h | Inventario de realidad |
| **SP-C** | C1 + C2 + C3 + C4 | Paralelo | 4-6h | Mapa de gaps de calidad |
| **SP-B** | B1 → B2 → B3 → B4 | Secuencial | 6-8h | Veredicto funcional E2E |
| **SP-D** | D2 → D3 → D1 → D4 | Secuencial | 4-6h | Fixes priorizados |
| **SP-E** | E2 → E1 → E3 → E4 | Secuencial | 3-4h | Checklist go/no-go |
| **SP-F** | F1 → F2 → F3 | Secuencial | 2-3h | Evaluación de utilidad |
| **SP-Ω** | Ω | Final | 1-2h | **VEREDICTO FINAL** |
| **TOTAL** | **26 prompts** | **7 sub-planes** | **~24-35h** | 18 gates → LISTO / CON RESERVAS / NO LISTO |

---

## CORRECCIONES APLICADAS TRAS 2 CICLOS DE VERIFICACIÓN

| # | Dato | Valor incorrecto anterior | Valor verificado real | Impacto |
|---|------|--------------------------|----------------------|---------|
| 1 | `database.ts` líneas | 155 | **151** | Menor |
| 2 | `response.ts` adopción | 9/13 (69%) | **7/13 (54%)** | Significativo — 6 funciones sin envelope estándar, no 4 |
| 3 | `ErrorMessage.tsx` líneas | 117 | **116** | Menor |
| 4 | `Pos.tsx` líneas | 598 | **597** | Menor |
| 5 | `Pocket.tsx` líneas | 567 | **566** | Menor |
| 6 | `apiClient.ts` líneas | 900 | **899** | Menor |
| 7 | `errors.ts` líneas | 228 | **227** | Menor |
| 8 | `response.ts` líneas | 197 | **196** | Menor |
| 9 | `cors.ts` líneas | 129 | **128** | Menor |
| 10 | Páginas sin Skeleton | 8 (incluía Pedidos) | **8** (Pedidos SÍ tiene Skeleton, pero el total sigue siendo 8 correctas sin Skeleton) | Pedidos ya estaba en las 5 CON Skeleton |
| 11 | Total test files | 65 | **71** (55 en tests/ + 16 frontend) | Los 6 extra son: integration(3), e2e(3) que no contaban como "auxiliary" |
| 12 | Total docs files | 112 | **115** | Puede variar por `docs/closure/` (conteo al 2026-02-10) |
| 13 | Dashboard queries | "Solo Supabase directo" | **Híbrido**: useDashboardStats (directo) + apiClient (bitácora, CC) | Significativo para análisis de patrones |
| 14 | Tipos "faltantes" | "6 entidades sin tipo" | Solo **Categorías** sin tipo en ningún lado; las otras 5 están inline en apiClient | Significativo — problema es dispersión, no ausencia |
| 15 | `deploy.sh` | No mencionado | **2 bugs**: no filtra `_shared/`, no tiene `--no-verify-jwt` | **Crítico** — nuevo hallazgo HC-2 |
| 16 | Pedidos.tsx mutaciones | No mencionado | **Bug**: `console.error()` sin feedback al usuario | **Importante** — nuevo hallazgo HC-3 |
| 17 | Gate 10 redacción | "13 cron jobs" | **6 cron jobs** SQL configurados (no 13) | Corregido en documento final |

---

> **Documento definitivo** | Plan verificado en 2 ciclos contra código real |
> Commit base: `3b1a8b0` | Fecha: 2026-02-10 |
> Listo para ejecución tras aprobación del operador.
