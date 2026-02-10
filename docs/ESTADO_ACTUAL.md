# 🟢 ESTADO ACTUAL DEL PROYECTO
 
**Última actualización:** 2026-02-10 (sesion 3)
**Estado:** ✅ OPERATIVO — Dependencias actualizadas, SendGrid fix aplicado

**Hoja de ruta (post-plan):** `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`.
**Prompt ejecutor (Claude Code):** `docs/closure/CLAUDE_CODE_CONTEXT_PROMPT_EXECUTOR_2026-02-08.md`.

**Handoff (Antigravity / Planning):** ver `docs/C4_HANDOFF_MINIMARKET_TEC.md` y `docs/closure/ANTIGRAVITY_PLANNING_RUNBOOK.md`.

**Nuevo (2026-02-10, sesion 3):**
- ✅ **Regla CI paths:** `scripts/validate-paths.sh` bloquea rutas con espacios o nombres genéricos (`Nueva carpeta`, `New folder`, `Untitled`, `temp`), integrada al job `lint`.
- ✅ **Limpieza repo:** eliminado el directorio `Nueva carpeta` con archivos no versionables.
- ✅ **DocuGuard (docs sync):** reporte de sincronización en `docs/closure/DOCUGUARD_SYNC_REPORT_2026-02-10.md`.

**Nuevo (2026-02-09, sesion 2):**
- ✅ **Dependabot PRs mergeados (7):** vitest 4.0.18, @vitest/coverage-v8 4.0.18, autoprefixer 10.4.23, cmdk 1.1.1, msw 2.12.9, @supabase/supabase-js 2.95.3, typescript 5.9.3.
- ✅ **Dependabot PRs cerrados (5, major bumps):** react-resizable-panels 4, recharts 3, react 19, react-router-dom 7, react-dom 19. Requieren migracion dedicada.
- ✅ **Fix `cron-notifications` (PR #53):** `SMTP_FROM` como fuente de verdad (antes leia `EMAIL_FROM`). Redeployado a v12.
- ✅ **Bug fix: `sp_reservar_stock` ON CONFLICT** (migracion `20260209000000`): El `ON CONFLICT (idempotency_key)` no matcheaba el partial unique index. Corregido con `WHERE idempotency_key IS NOT NULL`. Aplicado en remoto.
- ✅ **Seed de producto de prueba** en staging: `Coca Cola 2.25L` (SKU: SEED-CC-225) + stock 50 unidades en deposito Principal. Script: `scripts/seed-test-product.mjs`.
- ✅ **Smoke reservas PASS:** `POST /reservas` → 201 Created (1ra), 200 Idempotent (2da). Endpoint `/reservas` 100% operativo.
- ✅ **Performance baseline:** 7/7 endpoints OK, p50 839ms-1168ms, 0 errores. Ver `docs/closure/PERF_BASELINE_2026-02-09_SESSION2.md`.
- ✅ **Quality gates 6/6 PASS:** conteos de tests en `docs/METRICS.md`; lint + build PASS.
- ✅ **Tests totales actualizados:** ver `docs/METRICS.md`.
- ✅ **Migraciones:** 33 en repo (32 + fix SP), todas sincronizadas local=remoto.
- ✅ **Edge Functions:** 13 activas. `cron-notifications` actualizada a v12.
- ⚠️ **Sentry:** BLOQUEADO sin DSN real. Plan documentado en `docs/SENTRY_INTEGRATION_PLAN.md`.
- ⚠️ **Rotacion de secretos:** Plan listo (`docs/SECRET_ROTATION_PLAN.md`), requiere ejecucion manual por owner.
- ⚠️ **Major bumps (React 19, react-router-dom 7, recharts 3, react-resizable-panels 4):** DIFERIDOS. Requieren sesion de migracion dedicada.

**Nuevo (2026-02-09, sesion 1):**
- ✅ **PR #33 mergeado a `main`** (`feat/roadmap-exec-20260208` → `main`): 175 archivos, +37,497 / -3,639 líneas.
- ✅ **CI 100% verde:** Edge Functions Syntax Check PASS, Lint PASS, Type Check PASS, Unit Tests PASS, Build PASS.
- ✅ **Fix Deno typecheck** aplicado (commit `c1dc33a`): `HeadersInit` → `Record<string,string>`, config freezing, explicit casts.
- ✅ **Tests totales:** ver `docs/METRICS.md` (snapshot 2026-02-09).
- ✅ **Backlog post-merge completado (PRs #36–#48):** docs sincronizados, guardrails A4, evidencia de suites PASS, y PRs adicionales (#38–#42) con tests/scripts para `x-request-id`, `/health` y `/reservas` + perf baseline. Ver `docs/closure/EXECUTION_LOG_2026-02-09_NEXT_STEPS.md` y `docs/closure/BUILD_VERIFICATION.md` (Addendum 2026-02-09).
- ✅ **Docs nuevas (planes/bloqueos, sin secrets):** `docs/SECRET_ROTATION_PLAN.md`, `docs/SENDGRID_VERIFICATION.md`, `docs/SENTRY_INTEGRATION_PLAN.md`.
- ✅ **Scripts nuevos (operativos):** `scripts/perf-baseline.mjs` (read-only) y `scripts/smoke-reservas.mjs` (write, idempotente; puede quedar BLOCKED si no hay productos).
- ✅ **Sistema Skills Agénticos (Protocol Zero) upgrade:** 19 skills en `.agent/skills/` + scripts de bootstrap/orquestacion/baseline/gates/env-audit/extraction + `AGENTS.md` root para auto-pickup.

**Nuevo (2026-02-08):**
- ✅ **FASE 1-2 revisadas/cerradas (QA + deploy remoto):** ver `docs/closure/REVIEW_LOG_FASE1_FASE2_2026-02-08.md`.
- ✅ **Fases 0-6 implementadas** (Arbitraje, POS+Fiados/CC, Pocket PWA, Ofertas anti-mermas, Bitácora, UX quick wins).
- ✅ **DB remoto vinculado** (`dqaygmjpzoqjjrywdsxi`) migrado y alineado:
  - `20260206235900` (crea `mv_stock_bajo` + `mv_productos_proximos_vencer` para AlertsDrawer)
  - `20260207000000` (vistas arbitraje / oportunidades)
  - `20260207010000` (POS + ventas + cuenta corriente)
  - `20260207020000` (ofertas anti-mermas + POS respeta `precio_oferta`)
  - `20260207030000` (bitácora turnos)
  - `20260208000000` (hotfix: vista CC incluye `direccion_default`)
  - `20260208010000` (RPC + cron opcional: refresh MVs `mv_stock_bajo`/`mv_productos_proximos_vencer`)
  - `20260208020000` (rate limit compartido cross-instancia: `rate_limit_state` + `sp_check_rate_limit`)
  - `20260208030000` (circuit breaker compartido semi-persistente: `circuit_breaker_state` + RPCs)
- ✅ **Edge Functions desplegadas (remoto):**
  - `api-minimarket` v20 (incluye `/search`, `/insights/*`, `/clientes`, `/cuentas-corrientes/*`, `/ventas`, `/ofertas/*`, `/bitacora`; `verify_jwt=false`)
  - `api-proveedor` v11 (hardening allowlist/origin para server-to-server)
  - `scraper-maxiconsumo` v11 (fix dirección aumento/disminución en alertas)
- ✅ **Smoke remoto (JWT admin):** `/search`, `/insights/*`, `/clientes`, `/cuentas-corrientes/resumen`, `/ofertas/sugeridas`, `/bitacora` responden 200.

**Nuevo (2026-02-06 sesión tarde):**
- ✅ **Sistema de Pedidos implementado:**
  - 3 migraciones SQL aplicadas: `clientes`, `pedidos`, `detalle_pedidos` + SP `sp_crear_pedido`.
  - Handler backend: `supabase/functions/api-minimarket/handlers/pedidos.ts` (6 funciones).
  - 6 rutas API: GET/POST `/pedidos`, GET `/pedidos/{id}`, PUT `/pedidos/{id}/estado`, PUT `/pedidos/{id}/pago`, PUT `/pedidos/items/{id}`.
  - Frontend: `minimarket-system/src/pages/Pedidos.tsx` (705 líneas), hook `minimarket-system/src/hooks/queries/usePedidos.ts`, ruta en `minimarket-system/src/App.tsx`, nav en `minimarket-system/src/components/Layout.tsx`.
  - OpenAPI spec actualizado: +460 líneas, 4 schemas (`Cliente`, `Pedido`, `DetallePedido`, `CrearPedidoRequest`), tag `Pedidos`.
  - Tests: `tests/unit/pedidos-handlers.test.ts` (29 tests).
- ✅ **Skills Agénticos optimizados (V4.0):**
  - 4 nuevos skills: `MigrationOps`, `DebugHound`, `PerformanceWatch`, `APISync`.
  - Total skills operativos: 9.
  - `.agent/skills/project_config.yaml` actualizado con trigger patterns y skill graph.
- ✅ Build frontend verificado: `pnpm -C minimarket-system build` → 166.16 kB (gzip: 52.67 kB).

**Nuevo (previo):** Tests de concurrencia e idempotencia (`tests/unit/api-reservas-concurrencia.test.ts`, `tests/unit/cron-jobs-locking.test.ts`). Smoke test notificaciones (read-only): `node scripts/smoke-notifications.mjs`.

**Auditoría local (2026-02-08):**
- ✅ `npm run test:unit` — PASS (737 tests).
- ✅ `npm run test:integration` — PASS (38 tests).
- ✅ `npm run test:e2e` — PASS (4 smoke).
- ✅ `pnpm -C minimarket-system lint` — OK (0 warnings).
- ✅ `pnpm -C minimarket-system build` — OK.
- ✅ `pnpm -C minimarket-system test:components` — PASS (101 tests).
- ⚠️ `deno` puede no estar disponible en PATH en algunos hosts; si no está, documentar y compensar con tests unitarios + revisión estática.

**Auditoría local (2026-02-06):**
- ✅ `npm run test:unit` — PASS (725 tests).
- ✅ `npm run test:coverage` — PASS (lines 69.39%, v8).
- ⚠️ `deno` no está disponible en PATH en este host; no se re-ejecutó `deno check` (última evidencia 2026-02-03).
- ✅ `npm run test:auxiliary` — PASS (29 tests; 3 skipped por credenciales).
- ✅ `npm run test:integration` — PASS (38 tests).
- ℹ️ Nota: `tests/integration/` hoy valida principalmente flujos con mocks (`global.fetch = vi.fn()`); la validación real-network está en `tests/e2e/` y smoke scripts.
- ✅ `npm run test:e2e` — PASS (4 smoke).
- ✅ `pnpm -C minimarket-system lint` — OK.
- ✅ `pnpm -C minimarket-system build` — OK.
- ✅ `pnpm -C minimarket-system test:components` — PASS (40 tests).
- ✅ `node scripts/smoke-notifications.mjs` — 200 OK (`/channels`, `/templates`).
- 🔧 `POST /reservas` ahora **requiere** header `Idempotency-Key` (400 si falta) y delega lógica a `supabase/functions/api-minimarket/handlers/reservas.ts`.
- ⚠️ `psql` a `db.<ref>.supabase.co:5432` desde este host: **Network is unreachable (IPv6)** (bloquea checks SQL del preflight).

**Preflight Premortem (2026-02-05):**
- `supabase functions list` OK. `api-minimarket` con `verify_jwt=false`; resto de funciones `verify_jwt=true`.
- `supabase secrets list` OK.
- Healthcheck `/functions/v1/api-minimarket/health` OK (200).
- **Smoke Test Notificaciones:** `cron-notifications` responde OK en endpoints read-only (`/channels`, `/templates`) con `SUPABASE_ANON_KEY` (ver auditoría 2026-02-06).
- **Migraciones DB:** Aplicadas manualmente en remoto (WS1/WS2 confirmadas).
- Pendiente: estabilizar healthcheck `api-proveedor` (requiere Authorization; actualmente reporta `status=unhealthy`).

**Cambios en repo (2026-02-04) — estado deploy mixto:**
- Nueva migración `20260204100000_add_idempotency_stock_reservado.sql` (idempotency en reservas).
- Nueva migración `20260204110000_add_cron_job_locks.sql` (locks distribuidos para cron jobs).
- Nueva migración `20260204120000_add_sp_reservar_stock.sql` (SP atomica para reservas).
- `api-minimarket` ahora **requiere** `Idempotency-Key` y responde idempotente en `/reservas`.
- `api-minimarket` ahora usa `sp_reservar_stock` (lock + idempotencia) en `/reservas`.
- `cron-jobs-maxiconsumo/orchestrator.ts` ahora intenta lock con TTL via RPC.
- `cron-notifications` bloquea envios en PROD si `NOTIFICATIONS_MODE` no es `real` (guardrail runtime).
- `deploy.sh` bloquea deploy a PROD si `NOTIFICATIONS_MODE` != `real` o no existe en Supabase Secrets.
- **Nota:** migraciones DB pendientes por error de conectividad IPv6 (ver actualización 2026-02-04 post-deploy).

**Cierre 2026-02-01 (confirmación usuario, histórico):**
- Leaked password protection habilitado en panel. **(Re-abierto por COMET 2026-02-02)**
- WARN residual del Security Advisor confirmado/resuelto. **(Re-abierto por COMET 2026-02-02; verificado 2026-02-04: WARN=1)**  
- Migración `20260131020000_security_advisor_mitigations.sql` validada en entornos no‑PROD.
- Secrets de CI (GitHub Actions) configurados.
- Revisión humana P0 completada.
- Backup/DR documentado y baseline performance k6 ejecutado.
- Documentación sincronizada y cerrada.
- **Ejecución de tests (2026-02-02):**
  - ✅ `npm run test:all` (unit + auxiliary) — reportes en `test-reports/junit.xml` y `test-reports/junit.auxiliary.xml`.
  - ✅ `npm run test:integration` — PASS (38 tests).
  - ✅ `npm run test:e2e` — PASS (4 tests smoke).
  - ✅ `pnpm run test:components` (frontend) — PASS.
  - ✅ `pnpm run test:e2e:frontend` — PASS con mocks (6 passed, 9 skipped: auth real + gateway).
- **Nota:** `npm run test:integration`/`npm run test:e2e` se ejecutaron con `SUPABASE_URL` remoto desde `.env.test` (scripts ahora omiten `supabase start` en ese modo).
  - **Local Docker:** `supabase start` falla por `schema_migrations` duplicado en migraciones preexistentes del DB template; ver detalle en `docs/archive/ESTADO_CIERRE_REAL_2026-02-01.md`.

**Revisión COMET (Supabase, 2026-02-02):**
- ❌ **Leaked Password Protection**: DESACTIVADO. **Bloqueado**: el toggle no aparece sin **SMTP personalizado** (no basta el SMTP por defecto de Supabase).
- ⚠️ **Security Advisor**: WARN=3 (search_path mutable en `public.sp_aplicar_precio` + vista materializada pública `tareas_metricas` + leaked password protection).
- ❌ **Migración pendiente en PROD**: `20260202000000` no aplicada (historial remoto contiene `20250101000000` y dos versiones 20260131034xxx no presentes localmente).
- ⚠️ **Políticas RLS**: COMET reporta **18** activas en tablas críticas (esperado 30 según docs previas) — requiere verificación.
- ✅ RLS en tablas críticas PASS; ✅ 13 Edge Functions; ✅ secretos críticos presentes.

**Corrección post‑COMET (2026-02-02):**
- ✅ Historial de migraciones reconciliado (placeholders locales para `20250101000000`, `20260131034034`, `20260131034328`).
- ✅ `20260202000000_version_sp_aplicar_precio.sql` aplicada en PROD (`supabase db push`).
- ✅ `supabase migration list --linked` confirma `20260202000000` en remoto.
- ✅ Mitigación aplicada en PROD (Antigravity 2026-02-02): `20260202083000_security_advisor_followup.sql`.
- ✅ API desplegada (Antigravity 2026-02-02): endpoint `/reportes/efectividad-tareas` actualizado y función `api-minimarket` desplegada.
- ⚠️ Evidencia pendiente (limitaciones de entorno Antigravity): verificación visual del Security Advisor.
- ⚠️ Test real del endpoint con JWT **intentado** (2026-02-02): **401 Invalid JWT** usando credenciales de `.env.test` → **resuelto 2026-02-04** (ver sección “smoke real JWT”).

**Actualización 2026-02-03 (local):**
- ✅ `pnpm lint` (frontend) — OK.
- ✅ `pnpm build` — OK (corrige TS2339 en `minimarket-system/src/lib/apiClient.ts`).
- ✅ `cd minimarket-system && npx tsc --noEmit` — OK.
- ✅ `npm run test:unit` — PASS (689 tests, junit en `test-reports/junit.xml`).
- ✅ `npm run test:coverage` — PASS (lines 70.34%, v8).
- ✅ `deno check --no-lock supabase/functions/**/index.ts` — OK (con `deno.json` y `nodeModulesDir: "auto"`).
- ✅ `bash scripts/run-integration-tests.sh` — PASS (38 tests).
- ✅ `bash scripts/run-e2e-tests.sh` — PASS (4 tests smoke; junit en `test-reports/junit.e2e.xml`).

**Actualización 2026-02-03 (COMET - credenciales Supabase):**
- ✅ SUPABASE_URL / VITE_SUPABASE_URL **guardadas** en GitHub Secrets.
- ✅ SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY **guardadas** en GitHub Secrets.
- ✅ SUPABASE_SERVICE_ROLE_KEY **guardada** en GitHub Secrets (solo servidor).
- ✅ `.env.test` actualizado con valores disponibles (incluye `DATABASE_URL` y `API_PROVEEDOR_SECRET`).
- ✅ `DATABASE_URL` completa (password incluido) — guardada en GitHub Secrets y `.env.test`.
- ✅ `API_PROVEEDOR_SECRET` alineado (Supabase Secrets + GitHub Secrets + `.env.test`).
- ✅ `SENDGRID_API_KEY` y `SMTP_*` cargados en Supabase Secrets (Edge Functions).
- ✅ Usuarios Auth verificados (3) — JWT requiere contraseña (no visible en dashboard).
- ⚠️ SMTP personalizado (Auth) **pendiente** — configurar en panel con SendGrid y activar leaked password protection.

**Actualización 2026-02-04 (COMET - verificación panel):**
- ✅ **SMTP personalizado (Auth)**: **HABILITADO** y configurado con SendGrid.
  - Host: `smtp.sendgrid.net`
  - Port: `587`
  - User: `apikey`
  - From Email: `noreply@minimarket-system.com` *(según COMET 2026-02-04; debe ser sender verificado en SendGrid)*
  - From Name: `Sistema MiniMarket`
- ⚠️ **Leaked Password Protection**: **NO DISPONIBLE** en el plan actual (COMET reporta que requiere plan Pro o superior).
  - **Decisión (usuario):** no upgrade por ahora; se activará al pasar a producción.
- ✅ **Security Advisor**: WARN=1, ERROR=0, INFO=15.  
  - WARN único: leaked password protection deshabilitada.
  - INFO: tablas con RLS habilitada sin políticas (no bloqueante si solo `service_role`).
- ✅ **RLS policies count (public)**: **33** (consulta en SQL Editor).
- ✅ **Endpoint** `/reportes/efectividad-tareas`: **200 OK** (smoke local 2026-02-04).

**Actualización 2026-02-04 (local - smoke real JWT):**
- ✅ Usuario admin de staging alineado para pruebas:
  - `TEST_USER_ADMIN` existe y tiene `app_metadata.role=admin` (se usa Auth Admin API vía `SUPABASE_SERVICE_ROLE_KEY`).
  - Password alineada con `TEST_PASSWORD` de `.env.test` (**valor no expuesto**).
  - Script: `node scripts/supabase-admin-ensure-admin-user.mjs`
- ✅ Prueba real del endpoint con JWT (token emitido por Supabase Auth; **ES256**):
  - Comando: `node scripts/smoke-efectividad-tareas.mjs`
  - Resultado: **200 OK**
  - Respuesta (resumen estructural): `{ success, data, count, filtros, requestId }`
- ✅ Mitigación técnica aplicada para desbloquear JWT ES256 en Edge Functions:
  - Problema: `functions/v1` devolvía `401 Invalid JWT` con access_token ES256 (gateway verify_jwt).
  - Acción: redeploy `api-minimarket` con `--no-verify-jwt` (validación queda en app: `/auth/v1/user` + roles).
  - Comando (evidencia): `supabase functions deploy api-minimarket --no-verify-jwt --use-api`

**Pendientes críticos (bloquean cierre):**
1) **Leaked Password Protection**: pendiente por plan (**decisión actual: no upgrade hasta producción**).
2) ~~**Migraciones WS1/WS2/WS1-SP**~~: ✅ **APLICADAS** (2026-02-05 vía `supabase db push --linked`).

**Actualización 2026-02-05 (migraciones críticas):**
- ✅ `supabase db push --linked` exitoso — conectividad a DB remota resuelta en ese entorno (puede variar por host).
- ✅ Migración `20260204100000_add_idempotency_stock_reservado.sql` aplicada.
- ✅ Migración `20260204110000_add_cron_job_locks.sql` aplicada.
- ✅ Migración `20260204120000_add_sp_reservar_stock.sql` aplicada.
- ✅ Health check `api-minimarket/health`: **200 OK**, `success:true`.
- ✅ RPC `sp_reservar_stock` disponible — endpoint `/reservas` operativo.
- ✅ Locks distribuidos para cron jobs (`sp_acquire_job_lock`/`sp_release_job_lock`) activos.

**Próximos pasos (no críticos, recomendados antes de producción):**
- Verificar que el **From Email** configurado en SMTP (Auth) sea un **sender verificado real** en SendGrid (o dominio verificado). Ver `docs/SENDGRID_VERIFICATION.md`.
- Planificar y ejecutar **rotación de secretos** antes de producción si hubo exposición histórica. Ver `docs/SECRET_ROTATION_PLAN.md`.
- Si se decide Sentry: seguir `docs/SENTRY_INTEGRATION_PLAN.md` (requiere DSN real).
- Registrar evidencia final del **Preflight Pre-Mortem** (`docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` + `docs/closure/BUILD_VERIFICATION.md`).

**Checklist próximas 20 tareas/pasos (priorizado, 2026-02-06):**
- [x] P0: Alinear contrato de `POST /reservas` (header `Idempotency-Key` obligatorio) y ejemplos de uso (docs + clientes). *(Completado 2026-02-06: API_README.md + OpenAPI)*
- [x] P0: Agregar tests unitarios para `/reservas` (409/503/validation/defaults) en `tests/unit/api-reservas-integration.test.ts`. *(Completado 2026-02-09: PR #40)*
- [ ] P0: Agregar tests de integración **reales** para `/reservas` (idempotencia + 409 + concurrencia) en `tests/integration/` (requiere credenciales/seed).
- [x] P0: Agregar smoke E2E mínimo para `/reservas` (create + idempotent) y registrar evidencia en `test-reports/`. *(Completado 2026-02-09: `scripts/smoke-reservas.mjs` — ejecución puede quedar BLOCKED si no hay productos; PR #41)*
- [x] P0: Investigar y corregir `api-proveedor/health` en estado `unhealthy` (DB/scraper) o documentar degradación/SLO. *(Completado 2026-02-06: es comportamiento esperado sin datos scraping)*
- [x] P1: Extender `docs/api-openapi-3.1.yaml` para incluir `/tareas`, `/reservas`, `/health`, `/productos/dropdown`, `/proveedores/dropdown`. *(Completado 2026-02-06: +297 líneas)*
- [x] P1: Implementar timeout + abort + mensaje UX en `minimarket-system/src/lib/apiClient.ts` (AbortController). *(Completado 2026-02-06: 30s default, TimeoutError class)*
- [x] P1: Definir store compartido para rate limit/breaker (Redis vs tabla Supabase) y registrar decisión en `docs/DECISION_LOG.md`. *(Completado 2026-02-06: D-063 tabla Supabase)*
- [x] P1: Implementar rate limit compartido (WS3) con claves `userId + ip` y fallback seguro si IP es `unknown`. *(Completado 2026-02-08: migración `20260208020000`, `_shared/rate-limit.ts` con RPC + fallback, PR #33)*
- [x] P1: Implementar circuit breaker compartido/persistente (WS3) con expiración y métricas. *(Completado 2026-02-08: migración `20260208030000`, `_shared/circuit-breaker.ts` con RPC + fallback, PR #33)*
- [x] P1: Auth resiliente (WS4): cache de validación `/auth/v1/user` o verificación local JWT; revisar viabilidad de volver `verify_jwt=true`. *(Completado 2026-02-08: cache 30s SHA-256 + negative-cache 10s en `helpers/auth.ts`, PR #33)*
- [x] P1: Agregar timeout + breaker dedicado a `/auth/v1/user` (WS4-T3) para evitar dependencia total. *(Completado 2026-02-08: AbortController 5s + breaker threshold 3/timeout 15s en `helpers/auth.ts`, PR #33)*
- [ ] P1: Verificar sender real/dominio verificado en SendGrid para SMTP Auth (From Email) y registrar evidencia (ver `docs/SENDGRID_VERIFICATION.md`).
- [ ] P1: Planificar y ejecutar rotación de secretos pre‑producción (Supabase keys, SendGrid API key, API_PROVEEDOR_SECRET) (ver `docs/SECRET_ROTATION_PLAN.md`).
- [ ] P1: Definir plan de upgrade a Supabase Pro para habilitar Leaked Password Protection + checklist de activación.
- [x] P2: Integrar observabilidad (Sentry o equivalente) en frontend y correlación con `x-request-id`. *(Completado 2026-02-08: `observability.ts` con localStorage + stub Sentry + context enrichment, PR #33; refinado 2026-02-09: `apiClient.ts` + UI, PR #38)*
- [ ] P2: Asegurar propagación de `x-request-id` entre Edge Functions (cron/scraper) y logs.
- [ ] P2: Cache coherente multi‑instancia: estrategia (singleflight + TTL) para scraper y `api-proveedor` cache.
- [x] P2: Agregar script de performance baseline (p50/p95) para endpoints principales. *(Completado 2026-02-09: `scripts/perf-baseline.mjs`, PR #42; evidencia en `docs/closure/BUILD_VERIFICATION.md`)*
- [ ] P2: Verificar pooling/performance DB en PROD + ejecutar prueba de carga y registrar baseline.
- [ ] P2: Actualizar `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` con evidencia de corrida 2026-02-06 (junit/coverage/smokes).
- [ ] P2: Preparar release: correr suites en entorno limpio y actualizar `docs/closure/BUILD_VERIFICATION.md` con addendum 2026-02-06.

**Actualización 2026-02-04 (local - preflight premortem):**
- ✅ `supabase secrets list` (ref `dqaygmjpzoqjjrywdsxi`) ejecutado: secrets críticos presentes (hash digest mostrado por CLI).
- ⚠️ `NOTIFICATIONS_MODE` no aparece en secrets (default `simulation`).
- ✅ `supabase functions list` ejecutado: 13 funciones activas (api-minimarket v15, resto v9).
- ⚠️ SQL preflight (cron jobs + pooling) falló por conectividad: `psql` a `db.dqaygmjpzoqjjrywdsxi.supabase.co:5432` → **Network is unreachable**.
- ✅ Health `api-minimarket`: **200 OK** (`/functions/v1/api-minimarket/health`).
- ✅ Health `cron-jobs-maxiconsumo`: **healthy** (`/functions/v1/cron-jobs-maxiconsumo/health` con service role).
- ⚠️ Health `api-proveedor`: **200 OK** pero estado **unhealthy** (DB no disponible, scraper degradado). Ejecutado con `x-api-secret`, `Authorization: Bearer <anon>` y `Origin` permitido.

**Actualización 2026-02-04 (post-deploy remoto):**
- ✅ `NOTIFICATIONS_MODE=real` configurado en Supabase Secrets.
- ✅ Deploy Edge Functions:
  - `api-minimarket` v18 (`verify_jwt=false`).
  - `cron-jobs-maxiconsumo` v12.
  - `cron-notifications` v11.
- ⚠️ `supabase db push` **falló**: conexión a DB remota no disponible (IPv6 `Network is unreachable`).
  - Resultado: **migraciones DB pendientes** (idempotency/locks/sp_reservar_stock).
  - Mitigación temporal: `cron-jobs-maxiconsumo` permite fallback sin lock si RPC no existe.
  - `/reservas` devuelve **503** si RPC `sp_reservar_stock` no está disponible.
- ✅ Health checks:
  - `api-minimarket/health`: **200 OK**, `healthy`.
  - `cron-jobs-maxiconsumo/health`: **200 OK**, `healthy`.
  - `api-proveedor/health`: **200 OK**, `unhealthy` (DB no disponible).

**Actualización 2026-01-30 (local):**
- Revisión Security Advisor pendiente en ese momento (resuelto 2026-02-01 por confirmación usuario); ejecución local bloqueada por falta de `DATABASE_URL` en `.env.test`. Ver `docs/archive/SECURITY_ADVISOR_REVIEW_2026-01-30.md`.

**Actualización 2026-01-30 (COMET):**
- Snapshot ANTES confirmó RLS deshabilitado en `notificaciones_tareas` y `productos_faltantes`, y 0 policies para 6 tablas críticas.
- Remediación aplicada en STAGING: RLS habilitado en 6/6, revocado `anon`, políticas creadas para `personal`, `stock_deposito`, `movimientos_deposito`, `precios_historicos`.
- Snapshot DESPUÉS literal capturado (JSON traducido por UI).
- Auditoría RLS Lite detectó gaps P0: `productos`, `proveedores`, `categorias` sin policies y con grants `anon` reportados. Remediación pendiente (resuelta 2026-01-31). Ver `docs/archive/SECURITY_ADVISOR_REVIEW_2026-01-30.md`.

**Actualización 2026-01-31 (GitHub Copilot MCP):**
- Auditoría RLS completa ejecutada con output crudo + remediación role-based.
- `anon` revocado en tablas críticas, 30 policies activas, RLS 10/10.
- Evidencia: `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.
- Gaps P0 de `productos`, `proveedores`, `categorias` cerrados.
- Migración versionada aplicada en PROD y verificada (04:06–04:15 UTC): `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql`.
- Security Advisor (PROD) mitigado: 5 ERROR y 5 WARN eliminadas; anon grants internos revocados (0). Quedaban 2 WARN (leaked password protection + 1 WARN residual) y 15 INFO (tablas internas sin policies) — **resuelto 2026-02-01 por confirmación usuario (histórico; re‑abierto 2026-02-02)**. Ver Parte 8 y Addendum en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`.
- Migración recomendada para mitigar Advisor: `supabase/migrations/20260131020000_security_advisor_mitigations.sql` (validada en no‑PROD por confirmación usuario 2026-02-01).
- Planificación consolidada en `docs/HOJA_RUTA_MADRE_2026-01-31.md` (histórico; planes antiguos retirados). Plan vigente (post-plan): `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`.

## 🎯 Proyecto Supabase

| Propiedad | Valor |
|-----------|-------|
| **Nombre** | minimarket-system |
| **Ref** | dqaygmjpzoqjjrywdsxi |
| **Región** | East US (North Virginia) |
| **URL** | https://dqaygmjpzoqjjrywdsxi.supabase.co |
| **Dashboard** | https://supabase.com/dashboard/project/dqaygmjpzoqjjrywdsxi |

> Nota: ref/URL provienen de `.env.*` y `supabase/.temp/project-ref`; estado del panel confirmado por usuario (2026-02-01).

### Edge Functions en repo (13)
| Función | En repo |
|---------|--------|
| api-minimarket | ✅ |
| api-proveedor | ✅ |
| alertas-stock | ✅ |
| alertas-vencimientos | ✅ |
| cron-dashboard | ✅ |
| cron-health-monitor | ✅ |
| cron-jobs-maxiconsumo | ✅ |
| cron-notifications | ✅ |
| cron-testing-suite | ✅ |
| notificaciones-tareas | ✅ |
| reportes-automaticos | ✅ |
| reposicion-sugerida | ✅ |
| scraper-maxiconsumo | ✅ |

> Nota: estado de despliegue y tamaños confirmados por usuario en panel (2026-02-01).

---

## 📊 Métricas de Código (Fuente única)

Ver `docs/METRICS.md` (generado por `scripts/metrics.mjs` con timestamp). Evidencia de suites en `test-reports/` + logs CI.

---

## ✅ Features Implementados
- ✅ Scraper de precios Maxiconsumo
- ✅ API Gateway con rate limiting + circuit breaker
- ✅ Alertas de stock bajo y vencimientos
- ✅ Roles validados server-side via `app_metadata` (sin fallback a `user_metadata`); frontend verifica rol en tabla `personal`
- ✅ React Query: páginas + hooks ver `docs/METRICS.md` (fuente única)
- ✅ Exportación CSV de productos/stock
- ✅ **Proyecto Supabase configurado**
- ✅ **Migraciones versionadas en repo**
- ✅ **Edge Functions presentes en repo**
- ✅ **Suite de seguridad disponible en `tests/security/`**

## ✅ Estado de Pendientes
- Auditoría RLS completa: ✅ (2026-01-31) — revalidación final con output crudo
- Usuarios de prueba en Supabase Auth + tabla `personal`: ✅
- E2E con auth real (Playwright): spec define 10 tests (2 skip); última revalidación documentada 2026-01-27 (7/7 PASS; histórico)

> **Plan vigente (post-plan):** `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`

> **Plan maestro (histórico):** `docs/HOJA_RUTA_MADRE_2026-01-31.md` + `docs/mpc/C1_MEGA_PLAN_v1.1.0.md`

> **Nota:** rollback PITR no disponible (plan Free Supabase). Backups diarios disponibles.
