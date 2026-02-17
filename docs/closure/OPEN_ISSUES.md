# Open Issues (Canónico)

**Última actualización:** 2026-02-17 (reconciliacion canonica D-132 + D-133)
**Fuente principal:** `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`

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

---

## P2 (mejoras de rigor y mantenimiento)

| Pendiente | Estado | Siguiente acción |
|-----------|--------|------------------|
| ~~`precios_proveedor`: RLS habilitado en remoto pero sin migración explícita en repo (drift de trazabilidad)~~ | ✅ CERRADO | Migración `20260216040000_rls_precios_proveedor.sql` aplicada en remoto via `supabase db push`. RLS=true, grants revocados, service_role OK. Evidencia: `docs/closure/EVIDENCIA_P2_FIXES_2026-02-16_REMOTE.md`. |
| ~~`scraper-maxiconsumo`: `DEFAULT_CORS_HEADERS` usa `Access-Control-Allow-Origin: '*'` (anti-patrón cosmético, mitigado por `validateOrigin`)~~ | ✅ CERRADO | Wildcard eliminado, constante renombrada a `SCRAPER_CORS_OVERRIDES`. Desplegado en remoto via `supabase functions deploy`. Evidencia: `docs/closure/EVIDENCIA_P2_FIXES_2026-02-16_REMOTE.md`. |
| Ejecución periódica de smoke real de seguridad (`RUN_REAL_TESTS=true`) | ⚠️ RECOMENDADO | Programar corrida controlada (nightly o pre-release) para endpoints cron críticos y registrar evidencia en `docs/closure/`. |
| ~~Definir matriz por entorno para canales opcionales (`WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_*`)~~ | ✅ CERRADO (D-121) | Matriz documentada: 4 canales analizados (email, webhook, slack, sms) con auto-disable, rate limits, recomendaciones por entorno. Evidencia: `docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md`. |
| Consolidación de artefactos históricos | ✅ CERRADO | Limpieza D-109 (2026-02-15): 79 archivos obsoletos eliminados. `docs/` reducido de ~2.5MB a ~1.3MB. |

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

- Migraciones: `43` local, `43` remoto (sincronizado — deploy D-132).
- Snapshot remoto actual 2026-02-17: 13 funciones activas; `api-minimarket v27`, `api-proveedor v19`, `cron-notifications v25`, `notificaciones-tareas v19`, `scraper-maxiconsumo v20`, `alertas-stock v17`, `reportes-automaticos v17`.
- Snapshot remoto referencia: historial git (baseline logs removidos en limpieza D-109).
- Env audit names-only ejecutado 2026-02-16: `.env.example` sincronizado con variables usadas por código; secretos opcionales de canales (`WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_*`) se gestionan por entorno. Evidencia: `docs/closure/ENV_AUDIT_2026-02-16_045120.md`.
- `cron-notifications`: soporte de envio real vía SendGrid cuando `NOTIFICATIONS_MODE=real` y `SENDGRID_API_KEY` es valida. Estado actual: smoke real + Email Activity `delivered` (ver `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`).
- `api-minimarket` debe mantenerse con `verify_jwt=false`.
- Auditoria SRE (2026-02-17): 8 hallazgos (2 CRITICO, 4 ALTO, 2 MEDIO). **8/8 CERRADOS** (D-126, D-128, D-129, D-131). Ver: `docs/closure/REPORTE_AUDITORIA_SRE_DEFINITIVO_2026-02-17.md` y `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md`.
- Hoja de ruta unica: `docs/closure/HOJA_RUTA_UNICA_CANONICA_2026-02-17.md`.
- Hardening 5 pasos: cerrado (incluye `ErrorMessage` 14/14 en páginas principales; `NotFound.tsx` no aplica).
- Revalidación RLS 2026-02-13: smoke por rol en PASS (`/clientes`, `/pedidos`) y SQL fina remota en PASS (`60/60`, `0 FAIL`).
- Gates sesión 2026-02-13 en PASS: `test-reports/quality-gates_20260213-061657.log`.
- Gates frontend recheck 2026-02-14 en PASS: `test-reports/quality-gates_20260214-042354.log`.
- Gate 16 Sentry cerrado con evidencia tecnica + visual externa (Comet): `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`.
- **Veredicto:** APROBADO (todos los P0 cerrados y verificados en remoto). Score operativo 92/100 (post-fix P0 RLS + search_path aplicado y verificado en remoto, 2026-02-15). Evidencia remota: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md`.

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

## Issues técnicos conocidos (no bloqueantes)

- ~~`precios_proveedor`: RLS activo en remoto sin migración explícita de habilitación en repo (deuda de trazabilidad).~~ CERRADO: migración `20260216040000` creada.
- ~~`scraper-maxiconsumo`: CORS default `*` residual en constante local (mitigado por validación de origin).~~ CERRADO: wildcard eliminado, constante renombrada a `SCRAPER_CORS_OVERRIDES`.
- ~~`minimarket-system/src/pages/Proveedores.test.tsx`: falta envolver con `QueryClientProvider` (pre-existente).~~ CERRADO: `QueryClientProvider` + mocks de `apiClient`, `ErrorMessage`, `sonner` agregados.
- ~~Pre-commit/lint-staged: `eslint` puede fallar por resolución de binarios fuera de `minimarket-system/node_modules` (pre-existente). Workaround documentado: `git commit --no-verify`.~~ CERRADO: lint-staged apunta a `minimarket-system/node_modules/.bin/eslint`.
- `minimarket-system/src/pages/Pedidos.test.tsx`: mock de `sonner` faltaba `Toaster` export (pre-existente, corregido).
- Leaked password protection: requiere plan Pro (bloqueado por plan; ver D-055).
- ~~Auditoria global de referencias en `docs/` (2026-02-16): 88 referencias en backticks apuntan a rutas historicas removidas o no aplicables fuera del set canonico.~~ CERRADO: limpieza incremental completada (D-122). 13 rutas stale anotadas con `[removido en D-109]` en 14 archivos de docs (AGENTS, CHECKLIST_CIERRE, DB_GAPS, HOJA_RUTA, IA_USAGE_GUIDE, E2E_SETUP, C4_HANDOFF, ANTIGRAVITY_PLANNING_RUNBOOK, AUDITORIA_DOCUMENTAL_ABSOLUTA, AUDITORIA_DOCS_VS_REALIDAD, mpc/C1, mpc/C2, mpc/C4).
