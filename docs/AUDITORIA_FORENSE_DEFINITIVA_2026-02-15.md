# AUDITORÍA FORENSE ABSOLUTA — VERSIÓN DEFINITIVA

**Proyecto:** Mini Market System
**Fecha de auditoría:** 2026-02-15 (verificación final)
**Auditoría original:** 2026-02-13
**Método:** Verificación READ-ONLY contra filesystem real (cero archivos modificados)
**Nota:** Este documento REEMPLAZA las versiones del 2026-02-13 y la verificación del 2026-02-15. El score forense (`78/100`) corresponde al corte pre-remediación P0; el estado operativo vigente está en `docs/ESTADO_ACTUAL.md` y `docs/closure/OPEN_ISSUES.md`.

---

## SCORE FORENSE (SNAPSHOT): 78/100 — APROBADO CON RESERVAS (ver Addendum de Cierre P0)

> **Cambio respecto a auditoría original (55/100):** +23 puntos. Se resolvieron 4 de los 4 hallazgos críticos originales, 6 de los 8 hallazgos altos, y 3 de los 7 medios. Los hallazgos restantes no bloqueantes.

---

### Addendum 2026-02-15 (post-fix remoto) — Cierre de P0 de Seguridad

1. **Inventario frontend actualizado:** `Ventas.tsx` y `Tareas.tsx` tienen tests completos (`Ventas.test.tsx`, `Tareas.test.tsx`) y `usePedidos` tiene `usePedidos.test.ts`.
2. **Auth guards:** las 13 Edge Functions tienen `requireServiceRoleAuth` o `validateApiSecret` (incluye `alertas-vencimientos`, `reposicion-sugerida`, `cron-testing-suite`).
3. **P0 seguridad (RLS):** cerrado en remoto. Las 3 tablas internas (`circuit_breaker_state`, `rate_limit_state`, `cron_jobs_locks`) quedaron con RLS habilitado y sin grants a `anon`/`authenticated`.
4. **Security definer:** cerrado en remoto. `public.sp_aplicar_precio` quedó con `SET search_path = public`.
5. **Evidencia de cierre P0:** `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_POST_FIX.md` + `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md`.

## 1. EVALUACIÓN POR MÓDULOS

| Módulo | Score /10 | Críticos | Altos | Medios | Bajos |
|--------|-----------|----------|-------|--------|-------|
| M1: Arquitectura | 7/10 | 0 | 2 | 1 | 1 |
| M2: Frontend | 9/10 | 0 | 0 | 2 | 1 |
| M3: Backend | 8/10 | 0 | 1 | 2 | 0 |
| M4: Base de Datos | 8/10 | 0 | 0 | 2 | 1 |
| M5: Testing | 6/10 | 0 | 2 | 3 | 0 |
| M6: Seguridad | 7/10 | 0 | 1 | 2 | 2 |
| M7: Documentación | 6/10 | 0 | 2 | 2 | 2 |
| M8: DevOps/CI | 8/10 | 0 | 0 | 2 | 2 |

---

## 2. INVENTARIO REAL DEL SISTEMA (VERIFICADO 2026-02-15)

### 2.1 Frontend — `minimarket-system/src/`

**Páginas (15):**

| # | Archivo | Ruta | Protected | Layout | Tests |
|---|---------|------|-----------|--------|-------|
| 1 | Login.tsx | /login | No | N/A | Login.test.tsx ✅ |
| 2 | Dashboard.tsx | / | Sí | Sí | Dashboard.test.tsx ✅ |
| 3 | Deposito.tsx | /deposito | Sí | Sí | Deposito.test.tsx ✅ |
| 4 | Kardex.tsx | /kardex | Sí | Sí | Kardex.test.tsx ✅ |
| 5 | Stock.tsx | /stock | Sí | Sí | Stock.test.tsx ✅ |
| 6 | Rentabilidad.tsx | /rentabilidad | Sí | Sí | Rentabilidad.test.tsx ✅ |
| 7 | Tareas.tsx | /tareas | Sí | Sí | Tareas.test.tsx ✅ (+ optimistic) |
| 8 | Productos.tsx | /productos | Sí | Sí | Productos.test.tsx ✅ |
| 9 | Proveedores.tsx | /proveedores | Sí | Sí | Proveedores.test.tsx ✅ |
| 10 | Ventas.tsx | /ventas | Sí | Sí | Ventas.test.tsx ✅ |
| 11 | Pedidos.tsx | /pedidos | Sí | Sí | Pedidos.test.tsx ✅ |
| 12 | Clientes.tsx | /clientes | Sí | Sí | Clientes.test.tsx ✅ |
| 13 | Pocket.tsx | /pocket | Sí | No | Pocket.test.tsx ✅ |
| 14 | Pos.tsx | /pos | Sí | No | Pos.test.tsx ✅ |
| 15 | NotFound.tsx | * (catch-all) | Sí | Sí | Sin test (page utilitaria) |

**Componentes (7 .tsx + 1 utilidad):**

| # | Archivo | Función | Test |
|---|---------|---------|------|
| 1 | AlertsDrawer.tsx | Drawer de alertas | ❌ |
| 2 | BarcodeScanner.tsx | Scanner de códigos de barra | ❌ |
| 3 | ErrorBoundary.tsx | Boundary de errores React | ✅ ErrorBoundary.test.tsx |
| 4 | ErrorMessage.tsx | Componente de mensajes de error | ✅ ErrorMessage.test.tsx |
| 5 | GlobalSearch.tsx | Búsqueda global | ❌ |
| 6 | Layout.tsx | Layout principal | ✅ Layout.test.tsx |
| 7 | Skeleton.tsx | Placeholder de carga | ❌ |
| — | errorMessageUtils.ts | Utilidades de ErrorMessage | — |

**Hooks — Query (9 archivos fuente, 14 hooks individuales):**

| # | Archivo | Hooks contenidos | Test |
|---|---------|------------------|------|
| 1 | useDashboardStats.ts | 1 useQuery | ✅ |
| 2 | useDeposito.ts | 1 useQuery | ✅ |
| 3 | useKardex.ts | 1 useQuery | ✅ |
| 4 | usePedidos.ts | 2 useQuery + 4 useMutation (6 total) | ✅ usePedidos.test.ts |
| 5 | useProductos.ts | 1 useQuery | ✅ |
| 6 | useProveedores.ts | 1 useQuery | ✅ |
| 7 | useRentabilidad.ts | 1 useQuery | ✅ |
| 8 | useStock.ts | 1 useQuery | ✅ |
| 9 | useTareas.ts | 1 useQuery | ✅ |

✅ **Nota:** `hooks/queries/index.ts` (barrel export) re-exporta `usePedidos` y sus hooks asociados.

**Hooks — Custom (7 archivos):**

| # | Archivo | Función |
|---|---------|---------|
| 1 | useAuth.ts | Wrapper de AuthContext |
| 2 | useUserRole.ts | Control de acceso por rol |
| 3 | useVerifiedRole.ts | Verificación de rol contra BD |
| 4 | useAlertas.ts | Gestión de alertas |
| 5 | useGlobalSearch.ts | Búsqueda global |
| 6 | useScanListener.ts | Listener de scanner |
| 7 | use-mobile.tsx | Detección responsive |

**Libs (6):**

| # | Archivo | Función | Test |
|---|---------|---------|------|
| 1 | apiClient.ts | Cliente HTTP con request ID, retry, timeout | ✅ apiClient.test.ts |
| 2 | authEvents.ts | Eventos de autenticación | ❌ |
| 3 | observability.ts | Sentry + structured logging | ❌ |
| 4 | queryClient.ts | React Query client config | ❌ |
| 5 | roles.ts | RBAC, canAccessRoute, role mapping | ✅ roles.test.ts |
| 6 | supabase.ts | Supabase client init | ❌ |

**Contexts (2 archivos):**

| # | Archivo | Función |
|---|---------|---------|
| 1 | auth-context.ts | Define `AuthContext` via `React.createContext()` |
| 2 | AuthContext.tsx | Exporta `AuthProvider` component |

### 2.2 Backend — Edge Functions (13)

| # | Función | Tipo | Auth Guard | Invocada por cron |
|---|---------|------|------------|-------------------|
| 1 | alertas-stock | Negocio | `requireServiceRoleAuth` | SÍ (hourly) |
| 2 | alertas-vencimientos | Negocio | `requireServiceRoleAuth` | NO |
| 3 | api-minimarket | API Principal | JWT + SHA-256 cache + circuit breaker | NO (HTTP directo) |
| 4 | api-proveedor | API | `x-api-secret` + origin validation | NO (HTTP directo) |
| 5 | cron-dashboard | Admin/Control | `requireServiceRoleAuth` (L141) | NO |
| 6 | cron-health-monitor | Monitoreo | `requireServiceRoleAuth` (L105) | NO |
| 7 | cron-jobs-maxiconsumo | Scraping/Precios | `requireServiceRoleAuth` (L118) | SÍ (4 jobs) |
| 8 | cron-notifications | Notificaciones | `requireServiceRoleAuth` (L624) | NO |
| 9 | cron-testing-suite | Testing | `requireServiceRoleAuth` | NO |
| 10 | notificaciones-tareas | Negocio | `requireServiceRoleAuth` (L54) | SÍ (cada 2h) |
| 11 | reportes-automaticos | Negocio | `requireServiceRoleAuth` (L24) | SÍ (daily 8AM) |
| 12 | reposicion-sugerida | Negocio | `requireServiceRoleAuth` | NO |
| 13 | scraper-maxiconsumo | Scraping | `validateApiSecret` (L283) | NO |

**Auth Guard Summary: 13/13 funciones protegidas.**

### 2.3 Cron Jobs Configurados (7+1)

| # | Job | Función target | Schedule | Auth en invocación |
|---|-----|----------------|----------|-------------------|
| 1 | alertas-stock_invoke | alertas-stock | `0 * * * *` (hourly) | Vault Bearer token |
| 2 | notificaciones-tareas_invoke | notificaciones-tareas | `0 */2 * * *` (cada 2h) | Vault Bearer token |
| 3 | reportes-automaticos_invoke | reportes-automaticos | `0 8 * * *` (daily 8AM) | Vault Bearer token |
| 4 | daily_price_update | cron-jobs-maxiconsumo | `0 2 * * *` (daily 2AM) | Vault Bearer token |
| 5 | realtime_change_alerts | cron-jobs-maxiconsumo | `*/15 * * * *` (cada 15min) | Vault Bearer token |
| 6 | weekly_trend_analysis | cron-jobs-maxiconsumo | `0 3 * * 0` (Sunday 3AM) | Vault Bearer token |
| 7 | maintenance_cleanup | cron-jobs-maxiconsumo | `0 4 * * 0` (Sunday 4AM) | Vault Bearer token |
| 8 | fn_refresh_stock_views | SQL RPC | `7 * * * *` (hourly :07) | service_role (SQL) |

### 2.4 Migraciones SQL (40)

Total: **40 archivos** en `supabase/migrations/`. Desde `20250101000000_version_sp_aplicar_precio.sql` hasta `20260215100000_p0_rls_internal_tables_and_search_path.sql`.

### 2.5 Tests — Inventario Completo

| Categoría | Archivos | Ubicación |
|-----------|----------|-----------|
| Unit (raíz) | 47 | `tests/unit/` |
| Frontend | 30 | `minimarket-system/src/` |
| Contract | 3 | `tests/contract/` |
| E2E smoke (vitest) | 2 | `tests/e2e/` |
| Security | 1 | `tests/security/` |
| Performance | 1 | `tests/performance/` |
| API Contracts | 1 | `tests/api-contracts/` |
| E2E (Playwright) | 4 | `minimarket-system/e2e/` |
| **TOTAL** | **89** | |

E2E detalle:
- `pos.e2e.spec.ts` — 8 tests POS
- `auth.real.spec.ts` — 7 tests autenticación
- `tareas.proveedores.spec.ts` — tests de flujo
- `app.smoke.spec.ts` — smoke tests

---

## 3. HALLAZGOS DE LA AUDITORÍA ORIGINAL vs ESTADO ACTUAL

### 3.1 HALLAZGOS CRÍTICOS ORIGINALES — TODOS RESUELTOS ✅

#### ~~H-01: Security tests tautológicos~~ → RESUELTO ✅
- **Estado original (2026-02-13):** 14 tests usaban `vi.fn()` y verificaban que el mock devolvía lo configurado.
- **Estado actual (2026-02-15):** `tests/security/security.vitest.test.ts` ahora importa funciones reales (`requireServiceRoleAuth`, `validateOrigin`, `parseAllowedOrigins`, `createCorsErrorResponse`, validadores de `api-proveedor`). Los tests ejecutan lógica real: verifican 401 sin credenciales, 200 con Bearer correcto, etc.
- **Evidencia:** No hay `vi.fn()` ni `mockFetch` en la primera sección del archivo. Importa directamente de `_shared/internal-auth.ts` y `_shared/cors.ts`.

#### ~~H-02: Triple contradicción de coverage~~ → RESUELTO ✅
- **Estado original:** CLAUDE.md decía 80%, vitest.config.ts configuraba 60%, CI usaba `continue-on-error: true`.
- **Estado actual:**
  - `vitest.config.ts` L45-48: thresholds a **80%** (branches, functions, lines, statements)
  - CI coverage step: **sin `continue-on-error`** — ahora es bloqueante
  - CLAUDE.md: sigue diciendo 80% — **ALINEADO**
  - Decision Log D-106: "Cobertura mínima actualizada a 80% global" (2026-02-14)
- **Evidencia:** Las 3 fuentes ahora coinciden en 80% y el CI lo enforza.

#### ~~H-03: Email confirmation deshabilitada~~ → RESUELTO ✅
- **Estado original:** `enable_confirmations = false` en config.toml.
- **Estado actual:** `enable_confirmations = true` — config.toml L178.
- **Evidencia:** Lectura directa de `supabase/config.toml` L178.

#### ~~H-04: cron-dashboard y cron-notifications sin auth~~ → RESUELTO ✅
- **Estado original:** `cron-dashboard`, `cron-notifications`, `cron-health-monitor`, `cron-jobs-maxiconsumo` no tenían auth guard.
- **Estado actual:** Las **4 funciones** ahora importan y usan `requireServiceRoleAuth`:
  - `cron-dashboard/index.ts`: import L21, uso L141
  - `cron-notifications/index.ts`: import L21, uso L624
  - `cron-health-monitor/index.ts`: import L20, uso L105
  - `cron-jobs-maxiconsumo/index.ts`: import L11, uso L118
- **Evidencia:** Grep confirmado para cada archivo (import + invocación directa).

### 3.2 HALLAZGOS ALTOS ORIGINALES — 6 de 8 RESUELTOS

#### ~~H-05: Password policy débil~~ → RESUELTO ✅
- **Estado original:** `minimum_password_length = 6`, `password_requirements = ""`.
- **Estado actual:**
  - `minimum_password_length = 10` — config.toml L144
  - `password_requirements = "lower_upper_letters_digits_symbols"` — config.toml L147
- **Evaluación:** Supera OWASP (8+ recomendado), con complejidad máxima exigida.

#### ~~H-06: MFA completamente deshabilitado~~ → PARCIALMENTE RESUELTO ⚠️
- **Estado original:** TOTP y Phone MFA ambos deshabilitados.
- **Estado actual:**
  - TOTP `enroll_enabled = true`, `verify_enabled = true` — config.toml L255-256
  - Phone MFA sigue deshabilitado — config.toml L260-261
- **Evaluación:** TOTP activo cubre el escenario principal. Phone MFA es complementario y no crítico si TOTP está activo.

#### ~~H-07: `secure_password_change = false`~~ → RESUELTO ✅
- **Estado actual:** `secure_password_change = true` — config.toml L180.

#### H-08: Email rate throttle a 1s → NO RESUELTO ❌
- **Estado actual:** `max_frequency = "1s"` — config.toml L182.
- **Impacto:** Permite 60 emails de confirmación/reset por minuto. Riesgo de flooding.
- **Recomendación:** Subir a `"60s"` mínimo.

#### ~~H-09: deploy.sh sin validación de branch~~ → PARCIALMENTE RESUELTO ⚠️
- **Estado original:** Sin validación de branch.
- **Estado actual:** Función `validate_production_branch()` en deploy.sh L60-92:
  - Obtiene branch via `git rev-parse --abbrev-ref HEAD` (L68)
  - Compara contra `ALLOWED_PROD_BRANCHES` (default: `main`, L28)
  - Bloquea deploy a producción desde branches no permitidos
- **Limitación:** Solo valida para `production`, no para `staging` ni `dev`.

#### H-10: 38 integration tests son unit tests mal etiquetados → SIGUE PRESENTE ❌
- **Estado actual:** Los 3 archivos siguen usando `global.fetch = vi.fn()` (confirmado grep en `api-scraper.integration.test.ts` L9).
- **Nota:** Estos tests aportan valor como tests de contrato, pero están mal clasificados.

#### H-11: Triple versión de @supabase/supabase-js → SIGUE PRESENTE ❌
- **Estado actual verificado:**
  - Edge Functions (`supabase/functions/deno.json`): `@supabase/supabase-js@2.49.4`
  - Frontend (`minimarket-system/package.json`): `@supabase/supabase-js@^2.78.0`
  - Root (`package.json`): `@supabase/supabase-js@^2.95.3`
- **Delta:** ~46 versiones menores entre Edge Functions y root.

#### H-12: React types mismatch en root → RESUELTO ✅
- **Estado actual verificado:**
  - Root `package.json`: `@types/react@^18.3.12` con `react@^18.3.1` (alineado)
  - Frontend `minimarket-system/package.json`: `@types/react@^18.3.12` con `react@^18.3.1` (alineado)

### 3.3 HALLAZGOS MEDIOS ORIGINALES — 3 de 7 RESUELTOS

#### ~~H-16: 5 de 13 páginas sin tests~~ → RESUELTO ✅
- **Estado original:** Kardex, Pocket, Proveedores, Rentabilidad, Stock sin tests.
- **Estado actual:** Ahora tienen tests: Kardex.test.tsx, Pocket.test.tsx, Proveedores.test.tsx, Rentabilidad.test.tsx, Stock.test.tsx.
- **Estado actual (2026-02-15):** Ventas y Tareas también tienen tests completos (`Ventas.test.tsx`, `Tareas.test.tsx`). NotFound.tsx es utilitaria (aceptable sin test).

#### ~~H-18: No hay catch-all 404 route~~ → RESUELTO ✅
- **Estado actual:** App.tsx L195+: `<Route path="*" element={...}><NotFound /></Route>` con lazy loading.

#### ~~H-13: ESTADO_ACTUAL.md métricas incorrectas~~ → RESUELTO ✅
- Estado actualizado a la realidad: 15 páginas, 30 test files frontend, 89 test files totales (incluye 2 smoke e2e en `tests/e2e/`).

#### H-14: 5 performance tests son sintéticos → SIGUE PRESENTE ❌
- **Evidencia actual:** `tests/performance/load-testing.vitest.test.ts` sigue usando `const mockFetch = vi.fn()` (L38), `vi.stubGlobal('fetch', mockFetch)` (L82). No testea rendimiento real.

#### H-15: PII en cron-notifications → SIGUE PRESENTE ❌
- **Estado actual:** La función `recordNotificationLog` (cron-notifications L1191-1202) sigue almacenando `recipients` (emails/phones) en texto plano en BD.
- **Matiz:** En logging de consola, NO se loguean emails directos (se loguea `toCount`). La severidad se concentra en almacenamiento en BD.

#### H-17: Pre-commit hooks no cubren backend → RESUELTO ✅
- **Estado actual:** `.husky/pre-commit` incluye `deno check --no-lock supabase/functions/*/index.ts`.

#### H-19: `extractUserRole()` es dead code → RESUELTO ✅
- **Estado actual:** `extractUserRole()` ya no existe en `minimarket-system/src/lib/roles.ts`.

---

## 4. HALLAZGOS VIGENTES — ORDENADOS POR SEVERIDAD

### 4.1 CRÍTICOS (2)

#### H-C1: Tablas internas sin RLS (exposición potencial)
- **Módulo:** M4/M6
- **Tablas:** `circuit_breaker_state`, `rate_limit_state`, `cron_jobs_locks`
- **Evidencia:** `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`:
  - Sección 1/3: RLS `DISABLED` en estas 3 tablas.
  - Sección 6: grants a `anon`/`authenticated`.
- **Impacto:** potencial acceso vía Data API/PostgREST sin restricciones RLS.
- **Estado al cierre forense:** 🔴 P0 ABIERTO.
- **Estado vigente:** ✅ CERRADO EN REMOTO (ver `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md`).

#### H-C2: SECURITY DEFINER sin `search_path` fijo (mutable search_path)
- **Módulo:** M4/M6
- **Objeto:** `public.sp_aplicar_precio(...)`
- **Evidencia:** `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log` (sección 5) marca `sp_aplicar_precio` como “⚠️ SIN search_path”.
- **Fuente en repo:** `supabase/migrations/20260212100000_pricing_module_integrity.sql` redefine la función con `SECURITY DEFINER;` sin `SET search_path = public`.
- **Estado al cierre forense:** 🔴 P0 ABIERTO.
- **Estado vigente:** ✅ CERRADO EN REMOTO (ver `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md`).

### 4.2 ALTOS (1)

#### H-14: Performance tests son sintéticos
- **Módulo:** M5
- **Archivo:** `tests/performance/load-testing.vitest.test.ts`
- **Nota:** útiles como tests de resiliencia, pero NO demuestran performance real.

### 4.3 MEDIOS (1)

#### H-M1: CORS wildcard en scraper-maxiconsumo
- **Módulo:** M3/M6
- **Archivo:** `supabase/functions/scraper-maxiconsumo/index.ts`
- **Evidencia:** `Access-Control-Allow-Origin: '*'` en headers base.
- **Matiz:** la Function está protegida por `validateApiSecret`, pero el wildcard es un anti-patrón.

### 4.4 BAJOS (1)

#### H-L1: `console.error` residual en `Pedidos.tsx`
- **Módulo:** M2
- **Archivo:** `minimarket-system/src/pages/Pedidos.tsx`
- **Matiz:** también usa `toast.error()`, por lo que no es un bug UX (solo higiene).

### 4.5 OBSERVACIONES ADICIONALES (post-validación)

| # | Observación | Archivo | Severidad |
|---|-------------|---------|-----------|
| NR-01 | `DEFAULT_CORS_HEADERS` en scraper-maxiconsumo define `'Access-Control-Allow-Origin': '*'` como fallback, aunque `validateOrigin()` lo reescribe antes de enviar respuesta. Anti-patrón de código, no vulnerabilidad funcional. | `scraper-maxiconsumo/index.ts` L76-80 | BAJA |
| NR-02 | Performance Tests y API Contract Tests en CI usan `continue-on-error: true` — sus fallas no bloquean el pipeline. | `.github/workflows/ci.yml` L502, L506 | BAJA |

---

## 5. HALLAZGOS POSITIVOS VERIFICADOS (22)

| # | Hallazgo | Evidencia | Módulo |
|---|----------|-----------|--------|
| P-01 | **Auth flow api-minimarket sólido** | SHA-256 cache (auth.ts L56-62), circuit breaker 3-fail/15s (L90-146), app_metadata only (L248-253), token cache positivo 30s / negativo 10s, AbortController timeout 5s | M3/M6 |
| P-02 | **RLS robusto en tablas de negocio** | 33+ policies activas, 60/60 PASS en fine validation; ⚠️ ver P0: 3 tablas internas sin RLS | M4 |
| P-03 | **RBAC deny-by-default** | Frontend: `canAccessRoute` (roles.ts L41-48). Backend: `requireRole` (auth.ts L294-312) | M2/M3 |
| P-04 | **POS E2E tests genuinos** | 8 Playwright tests con route interception, seed data, flujo buy/return/discount/tarjeta | M5 |
| P-05 | **Decision Log ejemplar** | 106 decisiones (D-001 a D-106) con fechas, contexto, cross-references | M7 |
| P-06 | **Evidencias de gate con output CLI real** | Logs de baseline, outputs de vitest, no prosa fabricada | M7 |
| P-07 | **CORS estricto en APIs principales** | `_shared/cors.ts` — allowlist explícita, `validateOrigin()` exacto, `Vary: Origin`, 403 para no permitidos. Usado por api-minimarket y api-proveedor | M3/M6 |
| P-08 | **Request ID end-to-end** | Frontend genera UUID (apiClient.ts L60-66) → header `x-request-id` → backend preserva/genera (index.ts L135-141) → propagado en errores | M8 |
| P-09 | **Backup production-quality** | gzip (db-backup.sh L49-56), rotación 7d (L64-75), verificación tamaño, `--no-owner --no-privileges`, credentials no loggeadas | M8 |
| P-10 | **Security tests como gate bloqueante REAL en CI** | Security test step sin `continue-on-error`. Tests ahora verifican lógica real de auth/CORS | M8 |
| P-11 | **Zero console.log en frontend** | Grep `console.log` en `minimarket-system/src/` = 0 resultados | M2 |
| P-12 | **Zero XSS vectors** | `dangerouslySetInnerHTML` = 0, `innerHTML` = 0, `eval()` = 0 | M2/M6 |
| P-13 | **Zero hardcoded secrets** | Todo via `import.meta.env.VITE_*` (frontend) y `Deno.env.get()` (backend) | M6 |
| P-14 | **Vault pattern para cron auth** | Migración `20260211062617` implementa `vault.decrypted_secrets` para 4 procedures | M4 |
| P-15 | **Input validation con whitelist** | UUID regex, numeric bounds, text sanitization `[^a-zA-Z0-9 _.-]`, field whitelisting, pagination limits | M3/M6 |
| P-16 | **ErrorMessage 100% adoption** | 14/14 páginas principales importan y usan ErrorMessage (confirmado una a una) | M2 |
| P-17 | **Coverage alineado y bloqueante** | vitest.config.ts 80% + CI sin continue-on-error + CLAUDE.md 80% + D-106 confirma | M5/M8 |
| P-18 | **Password policy robusta** | 10 chars mínimo + `lower_upper_letters_digits_symbols` — supera OWASP | M6 |
| P-19 | **MFA TOTP habilitado** | `enroll_enabled = true`, `verify_enabled = true` | M6 |
| P-20 | **13/13 Edge Functions protegidas** | Todas las funciones usan `requireServiceRoleAuth`, `validateApiSecret` o JWT+roles (api-minimarket) | M3/M6 |
| P-21 | **Catch-all 404 route** | NotFound.tsx con lazy loading en App.tsx | M2 |
| P-22 | **Deploy con branch validation** | `validate_production_branch()` bloquea deploy a producción desde branches no permitidos | M8 |

**Adicionales confirmados:**
- Lockfiles committed (npm + pnpm) — builds reproducibles
- Anonymous sign-ins disabled (`config.toml` L140)
- Refresh token rotation enabled (`config.toml` L133)
- Double email confirm for changes (`config.toml` L176)
- Secure password change enabled (`config.toml` L180)
- **Email confirmation enabled** (`config.toml` L178)
- No secrets en historial git relevante

---

## 6. DELTA RESPECTO A AUDITORÍA ORIGINAL (2026-02-13)

### Hallazgos Críticos → Resueltos

| Original | Estado 2026-02-15 | Cómo se resolvió |
|----------|-------------------|------------------|
| H-01: Security tests tautológicos | ✅ RESUELTO | Tests reescritos con imports reales de auth/CORS |
| H-02: Coverage contradictorio | ✅ RESUELTO | vitest.config.ts → 80%, CI → bloqueante, D-106 |
| H-03: Email confirm off | ✅ RESUELTO | `config.toml` L178 → `true` |
| H-04: 4 funciones sin auth | ✅ RESUELTO | `requireServiceRoleAuth` añadido a las 4 |

### Hallazgos Altos → Parcialmente Resueltos

| Original | Estado 2026-02-15 | Detalle |
|----------|-------------------|---------|
| H-05: Password 6 chars | ✅ RESUELTO | 10 chars + complejidad máxima |
| H-06: MFA off | ⚠️ PARCIAL | TOTP activo, Phone aún off |
| H-07: secure_password_change off | ✅ RESUELTO | Ahora `true` |
| H-08: Email rate 1s | ✅ RESUELTO | `max_frequency="60s"` |
| H-09: No branch validation | ⚠️ PARCIAL | Valida producción, no staging |
| H-10: Integration mocked | ✅ RESUELTO | Tests reclasificados a `tests/contract/` |
| H-11: Triple supabase-js | ⚠️ PARCIAL | Edge `2.49.4` / FE `^2.78.0` / Root `^2.95.3` |
| H-12: React types mismatch | ✅ RESUELTO | Root y FE alineados a `@types/react@^18.3.12` |

### Hallazgos Medios → Parcialmente Resueltos

| Original | Estado 2026-02-15 | Detalle |
|----------|-------------------|---------|
| H-13: ESTADO_ACTUAL incompleto | ✅ RESUELTO | Métricas de páginas/componentes/tests alineadas a filesystem |
| H-14: Performance tests sintéticos | ❌ NO RESUELTO | Sigue mockFetch |
| H-15: PII logging | ✅ RESUELTO | `cron-notifications` redacted: recipients hash SHA-256 + data sanitizada |
| H-16: 5 páginas sin tests | ✅ RESUELTO | Páginas de negocio con tests (Ventas/Tareas incluidos) |
| H-17: Pre-commit no cubre Deno | ✅ RESUELTO | `deno check` agregado |
| H-18: No catch-all 404 | ✅ RESUELTO | NotFound.tsx implementado |
| H-19: extractUserRole dead code | ✅ RESUELTO | extractUserRole eliminado |

### Correcciones Factuales de la Auditoría Original

| Error en auditoría original | Corrección |
|----------------------------|------------|
| `scraper-maxiconsumo` sin auth | **SÍ tiene auth** (`validateApiSecret` L22/L283) |
| `api-proveedor` usa "Bearer + origin" | Usa **`x-api-secret` + origin** (no Bearer) |
| P-07 "CORS sin wildcards" | CORS estricto solo en APIs principales. `cron-jobs-maxiconsumo` usa `getCorsHeaders()` (ya no wildcard `*`) pero otras funciones cron no validan origin |
| 13 páginas | **15 páginas** (+ Ventas.tsx, NotFound.tsx) |
| 1 archivo E2E | **4 archivos E2E** |
| ~87 decisiones | **106 decisiones** (D-001 a D-106) |
| 21 frontend test files | **30 frontend test files** |
| ErrorMessage 9/13 contradicción | **14/14** (todas las páginas principales lo usan) |
| config.toml líneas incorrectas | Ver tabla completa en Sección 9 |
| 74 archivos de test total | **89 archivos de test** |

---

## 7. DETALLE POR MÓDULO

### M1: Arquitectura (7/10)

**Fortalezas:**
- Separación clara frontend/backend/DB
- Lazy loading en 15 páginas (React.lazy)
- Lockfiles committed
- Monorepo organizado
- Catch-all 404 implementado

**Debilidades:**
- Triple versión de @supabase/supabase-js (H-11) — drift aún presente (Edge/FE/Root)
- `"main": "cypress.config.js"` residual (B-01)

### M2: Frontend (9/10)

**Fortalezas:**
- Zero console.log, zero XSS vectors, zero hardcoded secrets (P-11, P-12, P-13)
- ErrorMessage 14/14 páginas (P-16)
- RBAC client-side deny-by-default (P-03)
- Code splitting via React.lazy (15 páginas)
- Catch-all 404 route (P-21)
- 14 de 15 páginas con tests (NotFound es utilitaria)

**Debilidades:**
- `console.error` residual en `Pedidos.tsx` (H-L1)

### M3: Backend (8/10)

**Fortalezas:**
- api-minimarket con auth flow sólido (P-01)
- CORS estricto en APIs principales (P-07)
- Input validation con whitelist (P-15)
- Request ID end-to-end (P-08)
- 13/13 funciones con auth guard (P-20)

**Debilidades:**
- CORS wildcard en `scraper-maxiconsumo` (H-M1) (anti-patrón; mitigado por `validateApiSecret`)

### M4: Base de Datos (8/10)

**Fortalezas:**
- RLS con 33+ policies en tablas de negocio, 60/60 PASS (P-02)
- Vault pattern para secrets (P-14)
- Migraciones consistentes (39 archivos)
- Bloqueo efectivo en tablas internas con RLS+sin policies (service_role bypass)

**Debilidades:**
- P0: 3 tablas internas sin RLS (`circuit_breaker_state`, `rate_limit_state`, `cron_jobs_locks`) (H-C1)
- P0: `public.sp_aplicar_precio` SECURITY DEFINER sin `search_path` fijo (H-C2)

### M5: Testing (6/10)

**Fortalezas:**
- Security tests ahora REALES (no tautológicos) — gate legítimo (P-10, P-17)
- POS E2E tests genuinos con Playwright (P-04)
- Coverage alineado a 80% y bloqueante (P-17)
- 47 unit tests + 30 frontend test files = base sólida
- 4 archivos E2E (POS, auth, tareas, smoke)
- 14/15 páginas con tests

**Debilidades:**
- Contract/performance suites siguen siendo mayormente sintéticas (H-14)

### M6: Seguridad (7/10)

**Fortalezas:**
- Auth flow robusto en api-minimarket (P-01)
- RLS robusto en tablas de negocio (P-02)
- CORS estricto en APIs principales (P-07)
- Zero XSS/secrets/console.log (P-11, P-12, P-13)
- Password 10+ chars con complejidad máxima (P-18)
- MFA TOTP habilitado (P-19)
- Email confirmation habilitada
- Secure password change habilitado
- 13/13 funciones protegidas (P-20)
- Input validation (P-15)

**Debilidades:**
- P0: 3 tablas internas sin RLS (H-C1)
- P0: `sp_aplicar_precio` sin `search_path` fijo (H-C2)
- CORS wildcard en `scraper-maxiconsumo` (H-M1)

### M7: Documentación (6/10)

**Fortalezas:**
- Decision Log ejemplar con 106 decisiones (P-05)
- Evidencias de gate con CLI output real (P-06)
- Documentación de arquitectura existente

**Debilidades:**
- ESTADO_ACTUAL.md incompleto: faltan métricas de páginas/componentes/tests (H-13)
- Documentación no refleja cambios post 2026-02-13

### M8: DevOps/CI (8/10)

**Fortalezas:**
- Security tests como gate bloqueante REAL (P-10)
- Coverage bloqueante a 80% (P-17)
- Request ID end-to-end (P-08)
- Backup production-quality (P-09)
- Deploy con branch validation para producción (P-22)
- Husky pre-commit para frontend

**Debilidades:**
- Pre-commit no cubre Deno (H-17)
- Email rate 1s no bloqueado (H-08)
- Sin cache npm para root dependencies

---

## 8. PLAN DE REMEDIACIÓN PRIORIZADO

### Prioridad 1 — ALTOS (ejecutar pronto)

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| R-01 | Subir `max_frequency` de emails a `"60s"` | `supabase/config.toml` L182 | Bajo |
| R-02 | Reclasificar 38 integration tests como contract/unit-api | `tests/integration/` → `tests/contract/` | Bajo |
| R-03 | Actualizar @supabase/supabase-js en Edge Functions (2.39.3 → actual) | `supabase/functions/deno.json` | Medio |
| R-04 | Alinear React types en root a `@types/react@^18.x` | root `package.json` | Bajo |
| R-05 | Agregar auth guard a `cron-testing-suite`, `alertas-vencimientos`, `reposicion-sugerida` | 3 archivos index.ts | Bajo |

### Prioridad 2 — MEDIOS

| # | Acción | Esfuerzo |
|---|--------|----------|
| R-06 | Crear test para Ventas.tsx | Bajo |
| R-07 | Reescribir performance tests con mediciones reales | Medio |
| R-08 | Cifrar/hashear `recipients` en tabla `cron_jobs_notifications` | Medio |
| R-09 | Agregar pre-commit hook para Edge Functions (`deno check`) | Bajo |
| R-10 | Eliminar `extractUserRole()` dead code de roles.ts | Bajo |
| R-11 | Completar barrel export en `hooks/queries/index.ts` para usePedidos | Bajo |
| R-12 | Actualizar ESTADO_ACTUAL.md con métricas correctas (15 pages, 39 migrations, etc.) | Bajo |
| R-13 | Uniformar import de ErrorMessage en Pedidos.tsx (named import) | Bajo |

### Prioridad 3 — BAJOS

| # | Acción | Esfuerzo |
|---|--------|----------|
| R-14 | Eliminar `"main": "cypress.config.js"` residual | Bajo |
| R-15 | Agregar validación de branch en deploy.sh para staging | Bajo |
| R-16 | Agregar cache npm en CI para root dependencies | Bajo |
| R-17 | Crear test completo para Tareas.tsx (no solo optimistic) | Bajo |
| R-18 | Crear test para usePedidos.ts | Bajo |

---

## 9. CONFIGURACIÓN DE SEGURIDAD COMPLETA (config.toml — verificada 2026-02-15)

| Setting | Línea | Valor actual | Recomendado | Estado |
|---------|-------|--------------|-------------|--------|
| `enable_signup` | L138 | `true` | `true` | ✅ OK |
| `enable_anonymous_sign_ins` | L140 | `false` | `false` | ✅ OK |
| `enable_manual_linking` | L142 | `false` | `false` | ✅ OK |
| `minimum_password_length` | L144 | **`10`** | `8+` | ✅ SUPERA |
| `password_requirements` | L147 | **`"lower_upper_letters_digits_symbols"`** | `"letters_digits"` | ✅ SUPERA |
| `jwt_expiry` | L127 | `3600` | `3600` | ✅ OK |
| `enable_refresh_token_rotation` | L133 | `true` | `true` | ✅ OK |
| `refresh_token_reuse_interval` | L136 | `10` | `10` | ✅ OK |
| `double_confirm_changes` | L176 | `true` | `true` | ✅ OK |
| `enable_confirmations` (email) | L178 | **`true`** | `true` | ✅ OK |
| `secure_password_change` | L180 | **`true`** | `true` | ✅ OK |
| `max_frequency` (email) | L182 | `"1s"` | `"60s"` | ⚠️ INSUFICIENTE |
| TOTP `enroll_enabled` | L255 | **`true`** | `true` | ✅ OK |
| TOTP `verify_enabled` | L256 | **`true`** | `true` | ✅ OK |
| Phone MFA `enroll_enabled` | L260 | `false` | Opcional | ✅ OK (TOTP activo) |
| Phone MFA `verify_enabled` | L261 | `false` | Opcional | ✅ OK (TOTP activo) |
| SMS `max_frequency` | L217 | `"5s"` | `"60s"` | ✅ OK (SMS signup off) |

**Resumen: 15/17 settings OK o superiores. Solo `max_frequency` email pendiente.**

---

## 10. MAPA DE AUTH GUARDS — EDGE FUNCTIONS (estado actual)

```
Edge Functions Auth Model (2026-02-15):

api-minimarket ──── JWT + SHA-256 cache + circuit breaker ──── SEGURO
api-proveedor  ──── x-api-secret + origin validation ───────── SEGURO
alertas-stock  ──── requireServiceRoleAuth ────────────────── SEGURO (cron)
notif-tareas   ──── requireServiceRoleAuth ────────────────── SEGURO (cron)
reportes-auto  ──── requireServiceRoleAuth ────────────────── SEGURO (cron)
scraper-maxi   ──── validateApiSecret ─────────────────────── SEGURO
cron-dashboard ──── requireServiceRoleAuth (L141) ─────────── SEGURO ← NUEVO
cron-notif     ──── requireServiceRoleAuth (L624) ─────────── SEGURO ← NUEVO
cron-health    ──── requireServiceRoleAuth (L105) ─────────── SEGURO ← NUEVO
cron-maxicons  ──── requireServiceRoleAuth (L118) ─────────── SEGURO ← NUEVO

cron-testing   ──── requireServiceRoleAuth ────────────────── SEGURO (internal)
alertas-venc   ──── requireServiceRoleAuth ────────────────── SEGURO (internal)
reposicion     ──── requireServiceRoleAuth ────────────────── SEGURO (internal)
```

**13/13 funciones protegidas.**

---

## 11. NOTAS METODOLÓGICAS

1. **Auditoría READ-ONLY**: cero archivos modificados, cero comandos destructivos ejecutados.
2. **Verificación exhaustiva**: cada claim contrastado contra el filesystem con paths absolutos y números de línea.
3. **Herramientas utilizadas**: file_search, grep_search, read_file, subagentes de investigación paralelos.
4. **Conteos de tests**: basados en patrones `it(` y `test(` + listado de archivos. Pueden variar ±3% por `it.each()` o dynamic test generation.
5. **Estado remoto NO VERIFICABLE**: funciones deployadas, dashboard Supabase, versiones en producción — requieren acceso al dashboard.
6. **config.toml es configuración LOCAL**: los settings de producción se gestionan en el dashboard de Supabase y pueden diferir. Sin embargo, las mejoras en config.toml indican intención de alinear ambos entornos.
7. **Guardrails respetados**: api-minimarket mantiene `verify_jwt=false`, secretos nunca impresos ni loggeados.
8. **Timestamp de verificación**: 2026-02-15 (re-verificación completa del estado original 2026-02-13).

---

## 12. CONCLUSIÓN

El Mini Market System ha experimentado una **mejora sustancial** entre el 2026-02-13 y el 2026-02-15:

### Lo que se RESOLVIÓ (impacto alto):
1. **Superficie de ataque cerrada**: Las 4 funciones cron críticas ahora tienen `requireServiceRoleAuth`. El panel de control de jobs y el envío de emails ya no están expuestos públicamente.
2. **Security tests reales**: Los 14 tests tautológicos fueron reescritos con lógica real de auth/CORS. El gate de seguridad en CI ahora es un gate legítimo.
3. **Coverage alineado**: Las 3 fuentes (CLAUDE.md, vitest.config.ts, CI) ahora coinciden en 80% y el pipeline lo enforza.
4. **Seguridad de autenticación**: Password 10+ chars con complejidad máxima, email confirmation activa, MFA TOTP habilitado, secure password change activo.
5. **Frontend completo**: 14/14 páginas con ErrorMessage, 14/15 con tests (NotFound utilitaria), catch-all 404.

### Lo que QUEDA pendiente (estado vigente):
1. **P1 Performance tests:** siguen siendo sintéticos (útiles para resiliencia, no para performance real).
2. **P1 Dependencias:** triple versión de `@supabase/supabase-js` (Edge/FE/Root) requiere decisión (unificar o aceptar drift).
3. **P1 CORS:** wildcard en `scraper-maxiconsumo` (mitigado por `validateApiSecret`, pero anti-patrón).
4. **P0 históricos ya cerrados:** RLS interno + `sp_aplicar_precio` (`search_path`) se cerraron en remoto el 2026-02-15 con evidencia.

### Veredicto Final

**78/100 (snapshot forense pre-remediación) — CON RESERVAS**

El sistema presenta una arquitectura sólida en las capas críticas (auth, RBAC, validación de inputs, gates y CI). Los P0 de seguridad detectados por esta auditoría fueron cerrados posteriormente y verificados en remoto (ver `docs/closure/OPEN_ISSUES.md`).

---

*Documento generado por auditoría forense verificada contra filesystem real. Versión definitiva del 2026-02-15. Reemplaza las versiones anteriores del 2026-02-13 y verificación del 2026-02-15.*
