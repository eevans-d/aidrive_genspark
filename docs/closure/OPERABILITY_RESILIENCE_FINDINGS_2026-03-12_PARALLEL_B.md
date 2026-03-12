# Hallazgos Operabilidad + Resiliencia (Ventana Paralela B)

Fecha: 2026-03-12 UTC  
Rama de trabajo: `codex/parallel-operability-hardening-20260312`  
Alcance: observabilidad operativa, smoke checks de disponibilidad, triage temprano (0-15 min), consistencia doc/runtime.

## Resumen Ejecutivo
- Se implemento smoke check operativo reutilizable (`scripts/ops-smoke-check.mjs`) con retries, timeout y salida por endpoint.
- Se detecto una brecha operativa clave: `api-proveedor/health` devuelve `401` sin credenciales en entornos con `verify_jwt=true`.
- Se redujo el riesgo de falsos negativos agregando fallback/hints de auth en smoke check y clarificaciones en runbooks/docs.
- Persisten hallazgos abiertos de automatizacion (CI/nightly) y estandarizacion de entorno operativo.

## Hallazgos (con observacion breve)

| ID | Severidad | Estado | Hallazgo | Observacion breve |
|---|---|---|---|---|
| OPS-B-001 | Alta | Parcial | `api-proveedor/health` falla con `401` en smoke sin auth | El endpoint esta marcado sin auth a nivel app, pero la plataforma puede exigir JWT (`verify_jwt=true`). |
| OPS-B-002 | Alta | Cerrado en rama | Smoke check sin guidance de auth para proveedor | Se agrego fallback de bearer + hints operativos para 401 en salida del script. |
| OPS-B-003 | Media | Abierto | CI/nightly no ejecuta `ops:smoke` | La deteccion de disponibilidad de endpoints criticos sigue siendo manual/ad-hoc. |
| OPS-B-004 | Media | Cerrado en rama | Runbooks sin playbook 0-15 min ni interpretacion estandar de smoke | Se agrego triage accionable con pasos, severidad e insumos de escalacion. |
| OPS-B-005 | Media | Cerrado en rama | Drift documental en auth de `api-proveedor/health` | API docs y troubleshooting quedaron alineados con realidad de `verify_jwt=true`. |
| OPS-B-006 | Baja | Abierto | Config local depende de defaults implicitos para funciones no declaradas en `supabase/config.toml` | Falta explicitar politica por funcion para reducir confusiones de onboarding/diagnostico. |
| OPS-B-007 | Baja | Abierto | Check de `cron-health-monitor` no se ejecuta sin service role key | Hay punto ciego de observabilidad de cron en entornos operativos incompletos. |

## Evidencia Tecnica

### OPS-B-001 (401 en proveedor)
- Ejecucion local: `npm run ops:smoke` -> `api-minimarket/health=200`, `api-proveedor/health=401`.
- Ejecucion remota: `OPS_SMOKE_TARGET=remote SUPABASE_URL=... node scripts/ops-smoke-check.mjs` -> `api-proveedor/health=401`.
- Politica activa `verify_jwt=true` para `api-proveedor`: `docs/closure/BASELINE_LOG_2026-03-11_125314.md` (linea `api-proveedor v26 verify_jwt=true`).
- Politica D-086: solo `api-minimarket` puede estar con `verify_jwt=false` (`docs/DECISION_LOG.md`).
- Test E2E explicita requisito JWT para `/health`: `tests/e2e/api-proveedor.smoke.test.ts`.

### OPS-B-002 (cerrado en rama)
- `scripts/ops-smoke-check.mjs` ahora soporta:
  - `OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION`
  - fallback bearer con `OPS_SMOKE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
  - hint explicito al detectar `401` en proveedor.

### OPS-B-003 (abierto)
- `.github/workflows/ci.yml` y `.github/workflows/nightly-gates.yml` no contienen ejecucion de `ops:smoke` ni `ops-smoke-check.mjs`.

### OPS-B-004 (cerrado en rama)
- `docs/MONITORING.md`: seccion de smoke operativo, variables, codigos de salida, interpretacion.
- `docs/OPERATIONS_RUNBOOK.md`: playbook de triage 0-15 minutos + reglas de aislamiento y escalacion.

### OPS-B-005 (cerrado en rama)
- `docs/API_README.md`: nota operacional de `verify_jwt=true` y ajuste en tabla de auth de `/health`.
- `docs/TROUBLESHOOTING.md`: health check de proveedor con headers operativos (`Authorization`, `x-api-secret`).

### OPS-B-006 (abierto)
- `supabase/config.toml` declara explicitamente `functions.api-minimarket` pero no `functions.api-proveedor`/`cron-health-monitor`; comportamiento local depende de defaults.

### OPS-B-007 (abierto)
- `scripts/ops-smoke-check.mjs` habilita cron check solo si existe `OPS_SMOKE_SERVICE_ROLE_KEY`/`SUPABASE_SERVICE_ROLE_KEY`; sin estas variables no se valida ese componente.

## Acciones Recomendadas (priorizadas)
1. Automatizar `ops:smoke` en nightly como job no bloqueante inicial (con resumen en artifacts).
2. Definir perfil de variables operativas estandar (`OPS_SMOKE_*`) por entorno y owner.
3. Explicitar bloques `[functions.<name>]` criticos en `supabase/config.toml` para reducir ambiguedad de auth local.
4. Elevar cron health a check obligatorio en entornos de staging/prod (service role disponible).

## Cambios Aplicados En Esta Ventana (para trazabilidad)
- `scripts/ops-smoke-check.mjs` (nuevo y endurecido).
- `docs/MONITORING.md` (operacion + interpretacion smoke).
- `docs/OPERATIONS_RUNBOOK.md` (triage 0-15 min).
- `docs/API_README.md` (alineacion auth proveedor).
- `docs/TROUBLESHOOTING.md` (curl proveedor con headers).
- `package.json` (`ops:smoke`).
