# Open Issues (Canónico)

**Última actualización:** 2026-02-22 (Auditoría exhaustiva D-153)
**Fuente principal:** `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`

## Pendientes Vigentes (2026-02-22)

| Item | Estado | Próxima acción |
|---|---|---|
| `POST /deposito/ingreso` con `precio_compra` + `proveedor_id` intenta insertar columnas inexistentes en `precios_proveedor` | 🔴 ALTO | Definir modelo final de precio de compra (tabla dedicada o flujo alterno) y corregir handler para no escribir columnas no presentes (`proveedor_id`, `producto_id`, `precio`, `fecha_actualizacion`). |
| Deno no disponible en PATH global | ⚠️ RECOMENDADO | Exportar `~/.deno/bin` en shell/CI para evitar falsos FAIL de prechecks. |
| FAB global de faltantes no visible en `/pos` y `/pocket` | ⚠️ PARCIAL | Evaluar inyección controlada de `QuickNoteButton` en rutas standalone sin romper flujo de caja/scanner. |
| Smoke real de seguridad periódico (`RUN_REAL_TESTS=true`) | ⚠️ RECOMENDADO | Programar corrida nocturna o pre-release y archivar evidencia en `docs/closure/`. |
| Leaked password protection (plan Pro) | ⛔ BLOQUEADO EXTERNO | Mantener en backlog hasta cambio de plan/capacidades del proveedor. |

## Pendientes Ocultos Revalidados (D-153)

| Item | Estado | Próxima acción |
|---|---|---|
| D-007 (`precios_compra_proveedor`) | 🔴 REABIERTO (DESINCRONIZADO) | Resolver desalineación de diseño vs implementación y corregir flujo `POST /deposito/ingreso` (ver pendiente ALTO en tabla vigente). |
| D-010 (auth `api-proveedor` “temporal”) | ⚠️ VIGENTE | Definir si el esquema `x-api-secret` pasa a definitivo o migra a autenticación más robusta; registrar decisión cerrada. |
| D-058/D-059/D-060 (reservas/locks) | ✅ NORMALIZADO | Estados parciales históricos cerrados y normalizados en `docs/DECISION_LOG.md` (D-153). |
| D-082/D-099 vs D-100 (Sentry) | ✅ NORMALIZADO | Se mantiene D-100 como cierre canónico; D-082/D-099 quedan marcadas como etapas históricas. |
| Duplicación de pendiente FAB en secciones internas | ✅ HIGIENE DOC | Se mantiene un único pendiente vivo en `Pendientes Vigentes`. |

## Estado Mega Plan (2026-02-13)

| Tarea | Estado | Evidencia |
|---|---|---|
| T01 (M3.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M3_S1_2026-02-13.md` |
| T02 (M5.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M5_S1_2026-02-13.md` |
| T03 (M5.S2) | ✅ PASS | `docs/closure/EVIDENCIA_M5_S2_2026-02-13.md` |
| T04 (M8.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M8_S1_2026-02-13.md` |
| T05 (M6.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M6_S1_2026-02-13.md` |
| T06 (M2.S1) | ✅ PASS | `docs/closure/EVIDENCIA_M2_S1_2026-02-13.md` |
| T07 (M2.S2) | ✅ PASS | `docs/closure/EVIDENCIA_M2_S2_2026-02-13.md` |
| T08 (M3.S2) | ✅ PASS | `docs/closure/EVIDENCIA_M3_S2_2026-02-13.md` |
| T09 (M6.S2) | ✅ PASS | `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`, `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`, `docs/closure/EVIDENCIA_M6_S2_2026-02-13.md` |
| T10 (M7 cierre) | ✅ PASS (doc sync) | `docs/closure/EVIDENCIA_M7_CIERRE_2026-02-13.md` |

Checkpoints obligatorios: removidos en limpieza documental D-109 (todos PASS, evidencia en historial git).

---

## P0 (histórico: bloqueantes ya cerrados)

| Pendiente | Gate | Estado | Evidencia actual | Siguiente acción |
|-----------|------|--------|------------------|------------------|
| ~~Tablas internas sin RLS (`rate_limit_state`, `circuit_breaker_state`, `cron_jobs_locks`) con grants a `anon`/`authenticated`~~ | RLS | ✅ CERRADO | Migración `supabase/migrations/20260215100000_p0_rls_internal_tables_and_search_path.sql` (PART 1+2). Evidencia pre: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`. Evidencia post-local: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_POST_FIX.md`. **Evidencia remota:** `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md` (PASS: RLS ENABLED, grants revocados, verificado via Management API). | — |
| ~~`public.sp_aplicar_precio` (SECURITY DEFINER) sin `search_path` fijo (mutable search_path)~~ | RLS/SQL | ✅ CERRADO | Migración `supabase/migrations/20260215100000_p0_rls_internal_tables_and_search_path.sql` (PART 3). Evidencia pre: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log` (sección 5). Evidencia post-local: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_POST_FIX.md`. **Evidencia remota:** `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md` (PASS: search_path=public, 20/20 SECURITY DEFINER functions OK). | — |
| ~~E2E completo de POS (flujo venta end-to-end)~~ | 3 | ✅ CERRADO | 8/8 tests E2E Playwright PASS. `minimarket-system/e2e/pos.e2e.spec.ts`. Evidencia: `docs/closure/EVIDENCIA_GATE3_2026-02-12.md`. | — |
| ~~Canal real de alertas stock bajo al operador (SendGrid)~~ | 4 | ✅ CERRADO | Historial: Gate 4 cerrado 2026-02-12: `docs/closure/EVIDENCIA_GATE4_2026-02-12.md`. Revalidación post-rotación 2026-02-15: smoke real + Email Activity `delivered`: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`. | — |
| ~~Monitoreo real en producción~~ | 16 | ✅ CERRADO | Evidencia tecnica (`SENTRY_SMOKE_STATUS=200`) + evidencia visual/alerta confirmada en Sentry: issue `7265042116`, event `b8474593d35d95a9a752a87c67fe52e8`, regla `Send a notification for high priority issues` en `Enabled` con filtro `environment=production`. Ver `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`. | — |
| ~~Endurecimiento CI legacy suites~~ | 18 | ✅ CERRADO | Job `security-tests` obligatorio/bloqueante en CI. Política GO/NO-GO documentada. Evidencia: `docs/closure/EVIDENCIA_GATE18_2026-02-12.md`. | — |

---

## P1 (riesgo medio)

| Pendiente | Estado | Siguiente acción |
|-----------|--------|------------------|
| ~~Backup automatizado + restore probado~~ | ✅ CERRADO (Gate 15) | `db-backup.sh` con gzip/retención + `db-restore-drill.sh` + `backup.yml` GitHub Actions cron diario. Evidencia: `docs/closure/EVIDENCIA_GATE15_2026-02-12.md`. |
| ~~Validación fina de RLS por reglas de negocio/rol~~ | ✅ CERRADO | Migración `20260212130000_rls_fine_validation_lockdown.sql` + batería reproducible `scripts/rls_fine_validation.sql` ejecutada con `write_tests=1` y **0 FAIL**. Revalidación 2026-02-13 completada en este host: smoke por rol + SQL remota (`60/60 PASS`). Evidencias: `docs/closure/EVIDENCIA_RLS_SMOKE_ROLES_2026-02-13.md`, `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`, `docs/closure/EVIDENCIA_RLS_FINE_2026-02-13.log`, `docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md`. |
| Rotación preventiva de secretos pre-producción | ✅ CERRADO | `API_PROVEEDOR_SECRET` rotado y validado (2026-02-13). SendGrid re-rotado + smoke real + Email Activity `delivered` (2026-02-15): `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`. Recomendado: revocar key anterior si aún está activa. |
| ~~Drift DB local/remoto (`44/43`)~~ | ✅ CERRADO | Migración `20260218050000_add_sp_cancelar_reserva.sql` aplicada en remoto via `supabase db push` (D-139). 44/44 sincronizado. |
| ~~Gate integración inestable (`No test files found`)~~ | ✅ CERRADO | `vitest.integration.config.ts` ahora incluye `tests/contract/**/*` y la corrida real `npm run test:integration` pasa `68/68` (D-140). |
| Deno no disponible por PATH (solo por ruta absoluta) | ⚠️ RECOMENDADO | Exportar `~/.deno/bin` en shell/CI para evitar falsos FAIL de `command -v deno`. |

---

## Auditoría UX Plan (2026-02-20) — Estado post-cierre V2

| Pendiente | Estado | Evidencia | Siguiente acción |
|-----------|--------|-----------|------------------|
| ~~`requestId` no visible en errores UI pese a existir en `ApiError`/`ErrorMessage`~~ | ✅ CERRADO (2026-02-20) | `requestId={extractRequestId(...)}` propagado a 11 paginas: Dashboard, Pos, Pedidos, Clientes, Deposito, Kardex, Rentabilidad, Ventas, Proveedores, Pocket (x2). Evidencia: `docs/closure/EVIDENCIA_V2_06_ERROR_HANDLING_2026-02-20.md` (Bloque C). | — |
| ~~V2-04 incompleto: `Clientes.tsx` sin skeleton~~ | ✅ CERRADO (2026-02-20) | Skeleton implementado en `Clientes.tsx:85-97`. Test actualizado a async en `Clientes.test.tsx`. | — |
| ~~V2-10 desviación criterio aceptación~~ | ✅ CERRADO (2026-02-20) | DoD formalizado en `PLAN_FRONTEND_UX_V2_2026-02-19.md:248-257`: touch targets >=48px (todas las acciones primarias/modales actualizadas), tipografía >=16px en acciones primarias, >=14px permitido en nav compacto/table headers con justificación. Test a11y con vitest-axe: `a11y.test.tsx`. | — |
| ~~Inconsistencias documentales en evidencia/reporte V2~~ | ✅ CERRADO (2026-02-20) | V2-06 consolidado en archivo canónico único. Planes duplicados marcados. Reporte cierre final con trazabilidad archivo:línea. | — |
| ~~Inline "Cargando..." residual en refetch (Pos:584, Clientes:127, AlertsDrawer:73)~~ | ✅ CERRADO (2026-02-20) | Reemplazado por estados visuales consistentes sin texto plano en `Pos.tsx:583-586`, `Clientes.tsx:126-129`, `AlertsDrawer.tsx:72-75`. Barrido final: `rg -n "Cargando\\.\\.\\.|Cargando…"` => `NO_MATCHES_CARGANDO`. | — |

---

## Cuaderno Inteligente MVP (2026-02-20, D-146) — Estado post-implementación

| Pendiente | Estado | Evidencia | Siguiente acción |
|-----------|--------|-----------|------------------|
| Parser determinístico de texto libre | ✅ CERRADO | `minimarket-system/src/utils/cuadernoParser.ts` — `parseNote()`, `resolveProveedor()`, `isDuplicate()`, `generatePurchaseSummary()` | — |
| CRUD hooks directos Supabase (sin API gateway) | ✅ CERRADO | `minimarket-system/src/hooks/queries/useFaltantes.ts` — 6 hooks, RLS protege tabla | — |
| FAB QuickNoteButton (captura desde cualquier pantalla) | ℹ️ Referenciado | Ver `Pendientes Vigentes (2026-02-22)` para estado activo único. | Evitar duplicación de tracking en secciones históricas. |
| Página Cuaderno con 3 tabs | ✅ CERRADO | `minimarket-system/src/pages/Cuaderno.tsx` — Todos/Por Proveedor/Resueltos, acciones 1-touch | — |
| Integración en Proveedores.tsx | ✅ CERRADO | `minimarket-system/src/pages/Proveedores.tsx:488-547` — `ProveedorFaltantes` component | — |
| Accesos contextuales (GlobalSearch, AlertsDrawer, Dashboard) | ✅ CERRADO | `Layout.tsx` + `QuickNoteButton.tsx` ahora consumen `quickAction/prefillProduct` para auto-open/prefill real en `/cuaderno`; AlertsDrawer y Dashboard mantienen CTA activos. | — |
| Recordatorios automáticos para faltantes críticos | ✅ CERRADO (D-148) | `useCreateFaltante` crea tarea urgente para nuevos faltantes `prioridad=alta`. Edge function `backfill-faltantes-recordatorios` cubre faltantes históricos no resueltos (cron diario idempotente). | — |
| Tests unitarios para cuadernoParser | ✅ CERRADO | `tests/unit/cuadernoParser.test.ts` — 54 tests (parseNote, resolveProveedor, isDuplicate, generatePurchaseSummary). | — |
| Tests component para Cuaderno.tsx y QuickNoteButton.tsx | ✅ CERRADO | `minimarket-system/src/pages/Cuaderno.test.tsx` (6 tests), `minimarket-system/src/components/QuickNoteButton.test.tsx` (7 tests). | — |

---

## P2 (mejoras de rigor y mantenimiento)

| Pendiente | Estado | Siguiente acción |
|-----------|--------|------------------|
| ~~`precios_proveedor`: RLS habilitado en remoto pero sin migración explícita en repo (drift de trazabilidad)~~ | ✅ CERRADO | Migración `20260216040000_rls_precios_proveedor.sql` aplicada en remoto via `supabase db push`. RLS=true, grants revocados, service_role OK. Evidencia: `docs/closure/EVIDENCIA_P2_FIXES_2026-02-16_REMOTE.md`. |
| ~~`scraper-maxiconsumo`: `DEFAULT_CORS_HEADERS` usa `Access-Control-Allow-Origin: '*'` (anti-patrón cosmético, mitigado por `validateOrigin`)~~ | ✅ CERRADO | Wildcard eliminado, constante renombrada a `SCRAPER_CORS_OVERRIDES`. Desplegado en remoto via `supabase functions deploy`. Evidencia: `docs/closure/EVIDENCIA_P2_FIXES_2026-02-16_REMOTE.md`. |
| Ejecución periódica de smoke real de seguridad (`RUN_REAL_TESTS=true`) | ⚠️ RECOMENDADO | Programar corrida controlada (nightly o pre-release) para endpoints cron críticos y registrar evidencia en `docs/closure/`. |
| ~~Definir matriz por entorno para canales opcionales (`WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_*`)~~ | ✅ CERRADO (D-121) | Matriz documentada: 4 canales analizados (email, webhook, slack, sms) con auto-disable, rate limits, recomendaciones por entorno. Evidencia: `docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md`. |
| Consolidación de artefactos históricos | ✅ CERRADO | Limpieza D-109 (2026-02-15): 79 archivos obsoletos eliminados. `docs/` reducido de ~2.5MB a ~1.3MB. |
| ~~Documentación de comunidad (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`)~~ | ✅ CERRADO | `CONTRIBUTING.md` y `CODE_OF_CONDUCT.md` creados para cerrar gobernanza de colaboración y conducta base del repo. |

---

## Auditoría Pragmática (2026-02-14) — Cerrados

| Tarea | Estado | Evidencia |
|---|---|---|
| P0a: Math.random() en métricas dashboard | ✅ CERRADO | `cron-dashboard/index.ts` — valores falsos reemplazados por null |
| P0b: Coverage threshold (60% → 80%) | ✅ CERRADO | `vitest.config.ts` alineado a CLAUDE.md |
| P1a: Proveedores CRUD (backend + frontend) | ✅ CERRADO | `handlers/proveedores.ts` (nuevo) + `Proveedores.tsx` (modal crear/editar + mutations) |
| P1b: Reporte ventas diario con filtros fecha | ✅ CERRADO | `Ventas.tsx` (nuevo) + filtros PostgREST en `handleListarVentas` + ruta registrada en App.tsx/Layout.tsx |
| P3: Terminología CLAUDE.md (honestidad documental) | ✅ CERRADO | "Skills Autónomos" → "Guías Operativas", "Workflows Autónomos" → "Workflows (guías de procedimiento)" |

Verificación post-remediación: Build PASS (9.24s), 829/829 tests PASS.

---

## Auditoría Forense Definitiva + Limpieza (2026-02-15) — Cerrados

| Tarea | Estado | Detalle |
|---|---|---|
| C-01..C-07: Correcciones documentales en auditoría | ✅ CERRADO | 7 errores factuales corregidos en `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md` |
| R-01..R-05 (P1 ALTO): config, deps, auth guards | ✅ CERRADO | `max_frequency="60s"`, tests `tests/contract/`, `@supabase/supabase-js@2.49.4` en `supabase/functions/deno.json`, `@types/react@^18.x`, auth guards (`requireServiceRoleAuth`) en 3 Edge Functions |
| R-06..R-13 (P2 MEDIO): tests, hashing, docs | ✅ CERRADO | Tests Ventas/Tareas/usePedidos, perf tests con medición real (`performance.now()`), `recipients` redacted con SHA-256 en `cron-notifications`, hook pre-commit `deno check`, limpieza de dead code de roles, `ESTADO_ACTUAL.md` normalizado, import named `ErrorMessage` |
| R-14..R-18 (P3 BAJO): residuales, deploy.sh, CI cache | ✅ CERRADO | Residuales Cypress, allowlist de rama en `deploy.sh`, cache npm root en CI, tests Tareas/usePedidos |
| D-109: Limpieza documental masiva | ✅ CERRADO | 79 archivos obsoletos eliminados (prompts, baselines, duplicados, legacy) |

Verificación local (2026-02-15): `npx vitest run` -> 829/829 PASS. Frontend: Ventas/Tareas/usePedidos -> 27/27 PASS.

---

## Coverage Hardening (2026-02-16) — Cerrado

| Tarea | Estado | Detalle |
|---|---|---|
| D-116: Coverage global ≥80% (11 test files nuevos) | ✅ CERRADO | 891→1165 unit tests (58 archivos). Coverage: 89.20% stmts / 80.91% branch / 93.29% funcs / 90.66% lines. Exclusión de `minimarket-system/src/mocks/**`. |

Verificación (2026-02-16): `npx vitest run` -> 1165/1165 PASS. Auxiliary: 45 PASS + 4 skipped. Frontend lint PASS, build PASS.

---

## Notas operativas

- Migraciones: `44` local, `44` remoto (sincronizado D-139).
- Snapshot remoto referencia 2026-02-19 (histórico): 13 funciones activas.
- FactPack repo 2026-02-22 (canónico local): 14 Edge Functions en código (incluye `backfill-faltantes-recordatorios`).
- Snapshot remoto referencia: historial git (baseline logs removidos en limpieza D-109).
- **Frontend hosting:** Cloudflare Pages (proyecto `aidrive-genspark`). URLs: `https://aidrive-genspark.pages.dev` (prod), `https://preview.aidrive-genspark.pages.dev` (preview). Workflow: `.github/workflows/deploy-cloudflare-pages.yml`.
- **CORS:** `ALLOWED_ORIGINS` en Supabase incluye dominios Cloudflare Pages + localhost. Tras cambios, redeploy `api-minimarket` con `--no-verify-jwt`.
- **D-142 (2026-02-19):** `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` reescrito contra 44 migraciones (38 tablas, 11 vistas, 3 MV, 30+ funciones, 3 triggers). `supabase/functions/api-minimarket/routers/` eliminado (6 archivos dead code). 3 defectos de drift documentados. Tests 1561/1561 PASS post-cambios.
- **D-146 (2026-02-20):** Cuaderno Inteligente MVP implementado. 4 archivos nuevos (`cuadernoParser.ts`, `useFaltantes.ts`, `QuickNoteButton.tsx`, `Cuaderno.tsx`) + 9 archivos modificados + 3 test files nuevos (`cuadernoParser.test.ts` 54 tests, `Cuaderno.test.tsx` 6 tests, `QuickNoteButton.test.tsx` 7 tests). Frontend: 16 páginas. Verificación: 1615/1615 unit tests PASS, 197/197 component tests PASS, lint PASS, build PASS.
- Env audit names-only ejecutado 2026-02-16: `.env.example` sincronizado con variables usadas por código; secretos opcionales de canales (`WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_*`) se gestionan por entorno. Evidencia: `docs/closure/ENV_AUDIT_2026-02-16_045120.md`.
- `cron-notifications`: soporte de envio real vía SendGrid cuando `NOTIFICATIONS_MODE=real` y `SENDGRID_API_KEY` es valida. Estado actual: smoke real + Email Activity `delivered` (ver `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`).
- `api-minimarket` debe mantenerse con `verify_jwt=false`.
- Deno check validado: 13/13 PASS con `/home/eevan/.deno/bin/deno` (PATH no exportado globalmente).
- Auditoria SRE (2026-02-17): 8 hallazgos (2 CRITICO, 4 ALTO, 2 MEDIO). **8/8 CERRADOS** (D-126, D-128, D-129, D-131). Ver: `docs/closure/REPORTE_AUDITORIA_SRE_DEFINITIVO_2026-02-17.md` y `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md`.
- Hoja de ruta unica: `docs/closure/HOJA_RUTA_UNICA_CANONICA_2026-02-17.md`.
- Hardening 5 pasos: cerrado (incluye `ErrorMessage` 14/14 en páginas principales; `NotFound.tsx` no aplica).
- Revalidación RLS 2026-02-13: smoke por rol en PASS (`/clientes`, `/pedidos`) y SQL fina remota en PASS (`60/60`, `0 FAIL`).
- Gates sesión 2026-02-13 en PASS: `test-reports/quality-gates_20260213-061657.log`.
- Gates frontend recheck 2026-02-14 en PASS: `test-reports/quality-gates_20260214-042354.log`.
- Gate 16 Sentry cerrado con evidencia tecnica + visual externa (Comet): `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`.
- **Veredicto:** **GO** (recheck D-140 + D-141: 11 PASS / 0 FAIL, drift DB 44/44, integración 68/68 PASS. 8/8 VULNs SRE cerradas. E2E 4/4 PASS. Frontend desplegado en Cloudflare Pages). Evidencia: `docs/closure/EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md` (addendum D-140), `docs/closure/INFORME_INFRAESTRUCTURA_HOST_DEPLOY.md` (sección 9).

## Cerrados recientes (2026-02-12, sesión de ejecución)

- ✅ Gate 3: E2E POS 8/8 tests PASS (Playwright).
- ✅ Gate 4: Canal real alertas operador (SendGrid + Slack + Webhook) cerrado 2026-02-12 (histórico). Revalidación post-rotación (2026-02-15): smoke real + Email Activity `delivered`. Ver `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`.
- ✅ Gate 18: CI hardening con `security-tests` como gate bloqueante.
- ✅ Gate 15: Backup automatizado + restore drill + GitHub Actions cron.
- ✅ Credenciales visibles en login eliminadas.
- ✅ Enlaces rotos documentales reparados.
- ✅ Fallback legacy en cron-testing-suite removido.
- ✅ Snapshot vigente en `ESTADO_ACTUAL` normalizado contra baseline remoto.
- ✅ Adopción `ErrorMessage` completada en 14/14 páginas principales (excluye `NotFound.tsx`).

## Issues técnicos conocidos

- `POST /deposito/ingreso` registra precio de compra en `precios_proveedor` con columnas que no existen en el esquema actual (`proveedor_id`, `producto_id`, `precio`, `fecha_actualizacion`) y puede fallar en runtime cuando se envía `precio_compra` + `proveedor_id`. Seguimiento activo en D-153.
- ~~`precios_proveedor`: RLS activo en remoto sin migración explícita de habilitación en repo (deuda de trazabilidad).~~ CERRADO: migración `20260216040000` creada.
- ~~`scraper-maxiconsumo`: CORS default `*` residual en constante local (mitigado por validación de origin).~~ CERRADO: wildcard eliminado, constante renombrada a `SCRAPER_CORS_OVERRIDES`.
- ~~`minimarket-system/src/pages/Proveedores.test.tsx`: falta envolver con `QueryClientProvider` (pre-existente).~~ CERRADO: `QueryClientProvider` + mocks de `apiClient`, `ErrorMessage`, `sonner` agregados.
- ~~Pre-commit/lint-staged: `eslint` puede fallar por resolución de binarios fuera de `minimarket-system/node_modules` (pre-existente). Workaround documentado: `git commit --no-verify`.~~ CERRADO: lint-staged apunta a `minimarket-system/node_modules/.bin/eslint`.
- ~~`minimarket-system/src/pages/Pedidos.test.tsx`: mock de `sonner` faltaba `Toaster` export (pre-existente, corregido).~~ CERRADO: incluido en D-117.
- Leaked password protection: requiere plan Pro (bloqueado por plan; ver D-055).
- ~~Auditoria global de referencias en `docs/` (2026-02-16): 88 referencias en backticks apuntan a rutas historicas removidas o no aplicables fuera del set canonico.~~ CERRADO: limpieza incremental completada (D-122). 13 rutas stale anotadas con `[removido en D-109]` en 14 archivos de docs (AGENTS, CHECKLIST_CIERRE, DB_GAPS, HOJA_RUTA, IA_USAGE_GUIDE, E2E_SETUP, C4_HANDOFF, ANTIGRAVITY_PLANNING_RUNBOOK, AUDITORIA_DOCUMENTAL_ABSOLUTA, AUDITORIA_DOCS_VS_REALIDAD, mpc/C1, mpc/C2, mpc/C4).
