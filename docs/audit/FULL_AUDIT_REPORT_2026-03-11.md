# Full Audit 2026-03-11

**Fecha:** 2026-03-11 UTC
**Alcance:** documentación canónica vs código real, worktree actual, despliegue remoto y quality gates locales
**Fuentes base:** `docs/closure/archive/historical/BASELINE_LOG_2026-03-11_125314.md`, `docs/closure/archive/historical/TECHNICAL_ANALYSIS_2026-03-11_125318.md`, `docs/closure/archive/historical/INVENTORY_REPORT_2026-03-11_130005.md`, `test-reports/quality-gates_20260311-125343.log`

## Veredicto ejecutivo

- El sistema queda **alineado entre implementación y documentación canónica** para el alcance auditado.
- Verificaciones técnicas cerradas en local:
  - Unit root: `1959/1959 PASS` (`88` archivos)
  - Integration: `68/68 PASS`
  - E2E smoke Edge Functions: `4/4 PASS`
  - Frontend componentes: `257/257 PASS`
  - Lint frontend: `0 errors`, `72 warnings`
  - Build frontend: `PASS` con warnings conocidos de chunking/PWA (`PERF-001`)
- No se detectan bloqueos técnicos abiertos para release en el alcance de esta auditoría.

## Estado verificado

### REAL

| Elemento | Estado | Evidencia |
|---|---|---|
| Edge Functions remotas activas | REAL | `docs/closure/archive/historical/BASELINE_LOG_2026-03-11_125314.md` |
| Versiones remotas clave actualizadas en docs | REAL | `api-minimarket v42`, `api-assistant v4`, `facturas-ocr v13` en `docs/ESTADO_ACTUAL.md` |
| `api-minimarket` remoto responde healthy | REAL | `curl https://dqaygmjpzoqjjrywdsxi.supabase.co/functions/v1/api-minimarket/health` → `200` |
| `api-minimarket` mantiene `verify_jwt=false` | REAL | `docs/closure/archive/historical/BASELINE_LOG_2026-03-11_125314.md` |
| Esquema documentado vs migraciones (45 tablas) | REAL | comparación `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` vs `supabase/migrations/*.sql` |
| Cron SQL con `Authorization` | REAL | scan HC-1 sobre `supabase/migrations/*.sql` |
| `deploy.sh` filtra `_shared/` y usa `--no-verify-jwt` | REAL | scan HC-2 sobre `deploy.sh` |
| Harness local E2E operativo | REAL | `scripts/run-e2e-tests.sh` + `tests/e2e/api-proveedor.smoke.test.ts` + `npm run test:e2e` en PASS |

### DESINCRONIZADO

| Elemento | Estado | Evidencia |
|---|---|---|
| Sin drift crítico detectado en alcance | N/A | revisión post-fix completada |

### A CREAR / AJUSTAR

| Elemento | Estado | Evidencia |
|---|---|---|
| Mejora opcional `env_audit.py` para detectar alias `env = import.meta.env` | BACKLOG_BAJO | falso negativo documental en `VITE_AUTH_*` (no impacto runtime) |

## Hallazgos priorizados

### P1 — `PERF-001` permanece como deuda no bloqueante

- Build pasa, pero mantiene warnings de chunking circular/tamaño y `manualChunks` en paso PWA/Workbox.
- Impacto: bajo; no bloquea release.

### P2 — `env_audit.py` subdetecta algunos `VITE_*`

- El script marca `VITE_AUTH_TIMEBOX_MS` y `VITE_AUTH_INACTIVITY_TIMEOUT_MS` como “no usados”.
- En código sí existen via `minimarket-system/src/lib/authSessionPolicy.ts`, pero el scanner solo detecta `import.meta.env.VAR` directo, no `env.VAR` cuando `env = import.meta.env`.
- Impacto: falso negativo documental, no bug de runtime.

## Fixes aplicados en esta auditoría

1. Se blindaron las migraciones `20260211055140_fix_cron_jobs_auth_and_maintenance.sql` y `20260222060000_deploy_all_cron_jobs.sql` para no romper `supabase db reset` local cuando `pg_cron` no está instalado.
2. Se endurecieron `scripts/run-integration-tests.sh` y `scripts/run-e2e-tests.sh` con hidratación segura de `SUPABASE_*` desde `supabase status -o env` (sin `eval`) y `supabase start` silencioso para evitar fuga de secretos en logs.
3. En E2E se agregó verificación/autorecuperación de `supabase_edge_runtime_<project_id>` y fallback explícito con acción requerida.
4. Se corrigió el smoke local de `api-proveedor` para `verify_jwt=true` con JWT HS256 de prueba y se inyectó `API_PROVEEDOR_SECRET` al runtime local vía `[edge_runtime.secrets]` en `supabase/config.toml`.
5. Se regeneró/sincronizó documentación operativa (`docs/ESTADO_ACTUAL.md`, `docs/TESTING.md`, `docs/METRICS.md`, `docs/PLAN_ASISTENTE_IA_DASHBOARD.md`) con evidencia post-fix.

## Qué falta realmente

1. Tratar `PERF-001` como deuda baja real: build pasa, pero los warnings de chunking/PWA siguen vivos.
2. Mejorar `env_audit.py` para evitar falsos negativos de variables `VITE_*` accedidas vía alias.

## Recomendación pragmática

- Continuar con trabajo de producto sin bloqueo técnico por quality gates.
- Mantener un control periódico de `PERF-001` en cada release.
- Si se requiere exactitud total del reporte de entorno, ajustar `env_audit.py` en una tarea separada de bajo riesgo.
