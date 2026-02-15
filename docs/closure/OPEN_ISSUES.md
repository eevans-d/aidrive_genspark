# Open Issues (Canónico)

**Última actualización:** 2026-02-15 (full-audit complementario: nuevo P0 RLS detectado; ver tabla P0)
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

## P0 (bloquean cierre Piloto)

| Pendiente | Gate | Estado | Evidencia actual | Siguiente acción |
|-----------|------|--------|------------------|------------------|
| Tablas internas sin RLS (`rate_limit_state`, `circuit_breaker_state`, `cron_jobs_locks`) con grants a `anon`/`authenticated` | RLS | 🔴 ABIERTO | `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log` (secciones 1, 3 y 6) | Crear migración de hardening: habilitar RLS + revocar grants explícitos (`anon`/`authenticated`). Re-ejecutar `scripts/rls_audit.sql` y registrar evidencia nueva. |
| `public.sp_aplicar_precio` (SECURITY DEFINER) sin `search_path` fijo (mutable search_path) | RLS/SQL | 🔴 ABIERTO | `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log` (sección 5) + `supabase/migrations/20260212100000_pricing_module_integrity.sql` | Crear migración de hardening: `ALTER FUNCTION ... SET search_path = public` después de la última redefinición. Re-ejecutar `scripts/rls_audit.sql` y Security Advisor. |
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
| Ejecución periódica de smoke real de seguridad (`RUN_REAL_TESTS=true`) | ⚠️ RECOMENDADO | Programar corrida controlada (nightly o pre-release) para endpoints cron críticos y registrar evidencia en `docs/closure/`. |
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

## Notas operativas

- Migraciones: `39/39` local=remoto (actualización 2026-02-13, incluye `20260213030000`).
- Snapshot remoto actual 2026-02-15: 13 funciones activas; `api-minimarket v26`, `cron-notifications v24`, `notificaciones-tareas v18`.
- Snapshot remoto referencia: historial git (baseline logs removidos en limpieza D-109).
- `cron-notifications`: soporte de envio real vía SendGrid cuando `NOTIFICATIONS_MODE=real` y `SENDGRID_API_KEY` es valida. Estado actual: smoke real + Email Activity `delivered` (ver `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`).
- `api-minimarket` debe mantenerse con `verify_jwt=false`.
- Hardening 5 pasos: cerrado (incluye `ErrorMessage` 14/14 en páginas principales; `NotFound.tsx` no aplica).
- Revalidación RLS 2026-02-13: smoke por rol en PASS (`/clientes`, `/pedidos`) y SQL fina remota en PASS (`60/60`, `0 FAIL`).
- Gates sesión 2026-02-13 en PASS: `test-reports/quality-gates_20260213-061657.log`.
- Gates frontend recheck 2026-02-14 en PASS: `test-reports/quality-gates_20260214-042354.log`.
- Gate 16 Sentry cerrado con evidencia tecnica + visual externa (Comet): `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`.
- **Veredicto:** CON RESERVAS (P0 seguridad pendiente; ver tabla P0). Score operativo 86/100 (pre-hallazgo).

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

- `minimarket-system/src/pages/Proveedores.test.tsx`: falta envolver con `QueryClientProvider` (pre-existente).
- Pre-commit/lint-staged: `eslint` puede fallar por resolución de binarios fuera de `minimarket-system/node_modules` (pre-existente). Workaround documentado: `git commit --no-verify`.
- Leaked password protection: requiere plan Pro (bloqueado por plan; ver D-055).
