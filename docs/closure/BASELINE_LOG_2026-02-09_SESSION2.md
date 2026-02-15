> [DEPRECADO: 2026-02-13] Documento histórico de contexto/snapshot. Usar solo para trazabilidad. Fuente vigente: `docs/ESTADO_ACTUAL.md` + `docs/closure/README_CANONICO.md`.

# Baseline Log — 2026-02-09 Session 2

**Operador:** Claude Code (Opus 4)
**Fecha:** 2026-02-09 08:37 UTC

---

## Git

```
$ date -u
Mon Feb  9 08:37:55 UTC 2026

$ git status --porcelain=v1
(clean)

$ git rev-parse --abbrev-ref HEAD
main

$ git rev-parse HEAD
a62f41c8529c0110cffbb332c60d4967d60d56f5

$ git log -n 10 --oneline --decorate
a62f41c (HEAD -> main, origin/main, origin/HEAD) Merge pull request #49 from eevans-d/chore/session-close-20260209
469fae5 chore(closure): session close 2026-02-09 (docs + e2e fix)
ee2b699 Merge pull request #38 from eevans-d/feat/x-request-id-e2e-20260209
b7c4821 Merge pull request #41 from eevans-d/test/smoke-reservas-20260209
1ce3ec0 Merge pull request #40 from eevans-d/test/reservas-integration-20260209
6224d88 Merge pull request #39 from eevans-d/feat/api-proveedor-health-tests-20260209
fea47b4 Merge pull request #42 from eevans-d/perf/baseline-20260209
f4a4cef Merge pull request #47 from eevans-d/docs/decision-log-update-20260209
c80fec8 Merge pull request #46 from eevans-d/docs/build-verification-addendum-20260209
107b4c7 Merge pull request #45 from eevans-d/docs/sentry-plan-20260209
```

## Supabase CLI

```
$ supabase --version
2.72.7 (update available: v2.75.0)
```

## Migrations (Local = Remote)

```
$ supabase migration list --linked
32 migrations, all synced (LOCAL = REMOTE through 20260208030000)
```

Confirmed: No drift between local and remote.

## Edge Functions

```
$ supabase functions list --project-ref dqaygmjpzoqjjrywdsxi
alertas-stock          v10  verify_jwt=true
alertas-vencimientos   v10  verify_jwt=true
api-minimarket         v20  verify_jwt=false
api-proveedor          v11  verify_jwt=true
cron-dashboard         v10  verify_jwt=true
cron-health-monitor    v10  verify_jwt=true
cron-jobs-maxiconsumo  v12  verify_jwt=true
cron-notifications     v11  verify_jwt=true
cron-testing-suite     v10  verify_jwt=true
notificaciones-tareas  v10  verify_jwt=true
reportes-automaticos   v10  verify_jwt=true
reposicion-sugerida    v10  verify_jwt=true
scraper-maxiconsumo    v11  verify_jwt=true
```

13 functions total. `api-minimarket` at v20 with `verify_jwt=false` (as expected).

## Secrets (names only)

```
$ supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi
ALLOWED_ORIGINS
API_PROVEEDOR_SECRET
NOTIFICATIONS_MODE
SENDGRID_API_KEY
SMTP_FROM
SMTP_HOST
SMTP_PASS
SMTP_PORT
SMTP_USER
SUPABASE_ANON_KEY
SUPABASE_DB_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
```

13 secrets present.

## Summary (baseline)

- Branch: `main` (clean, HEAD `a62f41c`)
- Migrations: 32, all synced local=remote
- Edge Functions: 13, `api-minimarket` v20 verify_jwt=false
- Secrets: 13 names confirmed
- No pending changes

---

## Ejecucion de sesion

### 1) Dependabot PRs

**Mergeados (7):**
| PR | Paquete | Bump | Resultado |
|----|---------|------|-----------|
| #20 | vitest | 4.0.16 → 4.0.18 (patch) | PASS |
| #21 | @vitest/coverage-v8 | 4.0.16 → 4.0.18 (patch) | PASS |
| #26 | autoprefixer | 10.4.20 → 10.4.23 (patch) | PASS |
| #27 | cmdk | 1.0.0 → 1.1.1 (minor) | PASS |
| #50 | msw | 2.12.7 → 2.12.9 (patch) | PASS |
| #52 | @supabase/supabase-js | 2.90.1 → 2.95.3 (minor) | PASS |
| #22 | typescript | 5.6.3 → 5.9.3 (minor) | PASS |

**Cerrados (5, major bumps — requieren migracion dedicada):**
| PR | Paquete | Motivo cierre |
|----|---------|---------------|
| #25 | react-resizable-panels 2 → 4 | Major: API breaking changes |
| #28 | recharts 2 → 3 | Major: API breaking changes |
| #29 | react 18 → 19 | Major: nueva arquitectura |
| #31 | react-router-dom 6 → 7 | Major: nueva API |
| #51 | react-dom 18 → 19 | Major: nueva arquitectura |

### 2) Fix SendGrid EMAIL_FROM vs SMTP_FROM (PR #53)

- **Problema:** `cron-notifications/index.ts` leia `EMAIL_FROM` pero el secret configurado es `SMTP_FROM`. Fallback iba a dominio incorrecto.
- **Fix:** Priorizar `SMTP_FROM`, fallback a `EMAIL_FROM`, default `noreply@minimarket-system.com`.
- **PR:** #53, mergeado a `main`.
- **Pendiente:** Redeploy de `cron-notifications` para que tome el fix (no se hizo deploy remoto en esta sesion).

### 3) Quality Gates (final, post-merge de todos los PRs)

| Suite | Resultado | Tests | Archivos |
|-------|-----------|-------|----------|
| test:unit | **PASS** | 812 | 46 |
| test:integration | **PASS** | 38 | 3 |
| test:e2e | **PASS** | 5 | 2 |
| lint (frontend) | **PASS** | - | - |
| build (frontend) | **PASS** | - | 27 chunks |
| test:components | **PASS** | 110 | 16 |

**Total: 6/6 suites PASS. 0 fallos.**

### 4) Performance Baseline

Ejecutado: `node scripts/perf-baseline.mjs 5` (5 iteraciones, read-only)

| Endpoint | OK | Err | 429 | Min | p50 | p95 | Max |
|----------|-----|-----|-----|-----|-----|-----|-----|
| health | 5 | 0 | 0 | 770ms | 839ms | 1973ms | 1973ms |
| search | 5 | 0 | 0 | 924ms | 1168ms | 1658ms | 1658ms |
| insights/arbitraje | 5 | 0 | 0 | 796ms | 875ms | 1174ms | 1174ms |
| clientes | 5 | 0 | 0 | 829ms | 942ms | 1186ms | 1186ms |
| cuentas-corrientes/resumen | 5 | 0 | 0 | 630ms | 887ms | 905ms | 905ms |
| ofertas/sugeridas | 5 | 0 | 0 | 845ms | 920ms | 1061ms | 1061ms |
| bitacora | 5 | 0 | 0 | 875ms | 895ms | 1218ms | 1218ms |

**7/7 endpoints OK, 0 errores.** Detalle en `docs/closure/PERF_BASELINE_2026-02-09_SESSION2.md`.

### 5) Estado final

```
$ git rev-parse HEAD
aa31bd5 (main, post docs PR #54 merge)
```

**Pendientes que NO se ejecutaron en esta sesion:**
- Rotacion de secretos: requiere coordinacion manual (ver `docs/SECRET_ROTATION_PLAN.md`).
- Sentry: sin DSN real (ver `docs/SENTRY_INTEGRATION_PLAN.md`).
- Redeploy de `cron-notifications` para aplicar fix SMTP_FROM.
- Smoke reservas (`scripts/smoke-reservas.mjs`): pendiente evaluacion.
- Major bumps (react 19, react-router-dom 7, recharts 3, react-resizable-panels 4): cerrados, requieren sesion de migracion dedicada.

---

## Addendum (post-session2-final)

Este baseline se generó durante el transcurso de la sesión 2. El cierre final quedó consolidado después (PR #57 mergeado a `main`).

- **HEAD final (main):** `3b1a8b0` (Merge PR #57)
- **cron-notifications:** redeploy confirmado en remoto (v12)
- **Migración aplicada:** `20260209000000` (fix `sp_reservar_stock`)
- **DB staging:** seed de 1 producto de prueba (permite smoke `/reservas`)
- **Smoke reservas:** PASS (201 Created + 200 Idempotent)

Fuente de verdad para el estado final y próximos pasos:
- `docs/closure/NEXT_SESSION_CONTEXT_2026-02-09.md`
- `docs/closure/OPEN_ISSUES.md`
