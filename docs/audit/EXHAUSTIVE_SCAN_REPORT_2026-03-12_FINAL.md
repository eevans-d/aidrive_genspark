# Exhaustive Scan Report (Parallel B) - Final Consolidated v3

Fecha: 2026-03-12 UTC  
Rama: `codex/parallel-operability-hardening-20260312`  
Objetivo: consolidar la version final del trabajo de Parallel B con evidencia verificada, sin contradecir el canon operativo del repo.

## 0) Estado de referencia y trazabilidad

- **Este archivo reemplaza el uso operativo** de `docs/audit/EXHAUSTIVE_SCAN_REPORT_2026-03-12_PARALLEL_B.md` como referencia principal de Parallel B.
- El reporte original se preserva como snapshot historico.
- El artefacto `docs/closure/archive/historical/MEGA_PLAN_2026-03-12_045452.md` se preserva como addendum de planificacion y soporte de decisiones.
- Este cierre **no promueve** hallazgos a `docs/closure/OPEN_ISSUES.md` ni a `docs/DECISION_LOG.md`; solo consolida y corrige el reporte auditado.

## 1) Veredicto ejecutivo final

- Estado general verificado: **operable** y consistente con `LISTO PARA PRODUCCION`.
- Bloqueantes funcionales nuevos dentro del scope Parallel B: **0**.
- Gap operativo confirmado de monitoreo pendiente de evidencia runtime: **0** en repo; `EXH-B-002` y `EXH-B-003` quedan mitigados en configuracion.
- Gap alto de contrato tecnico para smoke: **1** (`EXH-B-001`), mitigado en repo y pendiente de primera evidencia remota en nightly.
- Hallazgos `EXH-B` abiertos: **0** (EXH-B-009 mitigado en repo 2026-03-13; drift local externo).
- Hallazgos `EXH-B` mitigados en repo: **3** (`EXH-B-001`, `002`, `003`).
- Hallazgos `EXH-B` cerrados por evidencia fresca del 2026-03-12/13: **7** (`EXH-B-004`, `005`, `006`, `007`, `008`, `010`, `011`).
- Production Readiness Score para el eje operativo Parallel B: **84/100** (mantenido hasta obtener la primera evidencia runtime del nightly).

Interpretacion ejecutiva:

- El repo mantiene senal general en verde para build, tests unitarios, tests de componentes, budget documental, links y governance de dependencias.
- Los gaps restantes son de observabilidad operativa con evidencia runtime pendiente y alineacion final de tooling local.
- `EXH-B-001` queda reencuadrado como **gap de contrato operativo para smoke**, no como evidencia concluyente de indisponibilidad productiva general.

## 2) Evidencia final verificada

| # | Comando | Resultado final |
|---|---|---|
| 1 | `pnpm -C minimarket-system build` | `PASS` sin warnings de chunking/PWA. |
| 2 | `pnpm -C minimarket-system lint` | `0 errors, 0 warnings`. |
| 3 | `pnpm -C minimarket-system test:components` | `257/257 PASS` en corridas consecutivas, sin warnings residuales relevantes en la validacion final. |
| 4 | `npm run test:unit` | `1959/1959 PASS`. |
| 5 | `npm run docs:context-budget` | `ok=9 warn=0 fail=0`. |
| 6 | `node scripts/validate-doc-links.mjs` | `Doc link check OK (39 files)`. |
| 7 | `node scripts/check-critical-deps-alignment.mjs` | `PASS`. |
| 8 | `node scripts/check-supabase-js-alignment.mjs` | `PASS` (`2.95.3` alineado). |
| 9 | `node scripts/metrics.mjs --check` | `docs/METRICS.md OK.` |
| 10 | `npm run test:integration` | `68/68 PASS` en `0.95s`. |
| 11 | `npm run test:e2e` | `4/4 PASS` en `0.88s`. |
| 12 | `python3 .agent/scripts/env_audit.py --with-supabase --target-environment prod --check-required-supabase` | `PASS`: sin faltantes `required`; los faltantes actuales quedan clasificados como `optional`. |
| 13 | `supabase --version` | `2.72.7` (local). CI: `2.75.0` pineado en `nightly-gates.yml` desde 2026-03-13. |
| 14 | `npm audit --omit=dev --audit-level=high` | `found 0 vulnerabilities`. |
| 15 | `pnpm -C minimarket-system audit --prod --audit-level high` | `No known vulnerabilities found`. |
| 16 | `rg -n "ops:smoke|ops-smoke-check" .github/workflows -S` | matches presentes en `nightly-gates.yml`: smoke integrado en CI/nightly (warning-only phase). |
| 17 | `rg -n "console\\.(warn|error)"` por scopes en `scripts`, `supabase/functions`, `minimarket-system/src`, `tests` | `scripts/` queda en `0`; `6` ocurrencias productivas + `2` aserciones en tests. |

## 3) Limites de validacion final

- Smoke remoto **no** fue reproducido en esta sesion porque no habia `SUPABASE_URL` ni credenciales operativas cargadas.
- Las validaciones locales si fueron reproducidas en esta sesion: `test:unit`, `test:integration`, `test:e2e`, `test:components`, `lint` y `build` quedaron en `PASS`.
- Por lo anterior, `EXH-B-001` queda confirmado por contrato tecnico y por evidencia historica del reporte original, pero **no** como caida reejecutada en esta sesion.
- La validacion final de `test:components` se ejecuto despues del hardening del harness; no se reprodujo el timeout puntual anterior de `src/pages/a11y.test.tsx`.

## 4) Matriz final de hallazgos `EXH-B`

| ID | Sev | Estado final | Evidencia final | Conclusion |
|---|---|---|---|---|
| EXH-B-001 | Alta | Mitigado (repo) | workflow nightly + contrato de auth + tests E2E | Contrato tecnico implementado; falta primera evidencia remota archivada. |
| EXH-B-002 | Alta | Mitigado (repo) | `nightly-gates.yml` ejecuta `ops:smoke` con artifact | Monitoreo continuo ya no es solo manual. |
| EXH-B-003 | Media | Mitigado (repo) | workflow exporta `OPS_SMOKE_SERVICE_ROLE_KEY` | Check opcional de cron monitor habilitado en CI/nightly. |
| EXH-B-004 | Media | Cerrado | build limpio + decision `D-196` | Warning circular eliminado. |
| EXH-B-005 | Media | Cerrado | build limpio + `workbox.inlineWorkboxRuntime=true` | Warning `manualChunks` eliminado. |
| EXH-B-006 | Media | Cerrado | harness endurecido + `257/257 PASS` estable | Senal de CI frontend saneada en baseline actual. |
| EXH-B-007 | Baja | Cerrado | `pnpm -C minimarket-system lint` -> `0 errors, 0 warnings` | Deuda de tipado priorizada para Parallel B eliminada en el baseline actual. |
| EXH-B-008 | Media | Cerrado | contrato `required/optional` + gate `ops:env-contract` | Ya existe clasificacion canonica usable por predeploy. |
| EXH-B-009 | Baja | Mitigado (repo) | CI pineado a `2.75.0` en `nightly-gates.yml`; drift local externo | Cierre interno: CI usa version fija; drift local (`2.72.7`) no afecta CI. |
| EXH-B-010 | Baja | Cerrado | `docs:context-budget` -> `ok=9 warn=0 fail=0` | Budget documental canonico convergido. |
| EXH-B-011 | Baja | Cerrado | `0` en `scripts/`; `6` ocurrencias productivas + `2` aserciones en tests | El ruido operativo de scripts queda saneado; permanecen solo sinks intencionales fuera de `scripts/`. |

## 5) Confirmacion y ajuste por hallazgo

### EXH-B-001 - `api-proveedor/health` requiere contrato operativo estable para smoke

- Confirmado por politica: `D-086` mantiene `verify_jwt=true` para todo excepto `api-minimarket`.
- Confirmado por contrato de tests: `tests/e2e/api-proveedor.smoke.test.ts` exige `Authorization` y `x-api-secret` para `/health`.
- Confirmado por script operativo: `scripts/ops-smoke-check.mjs` ya contempla `OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION` y `OPS_SMOKE_API_PROVEEDOR_SECRET`.
- Matiz obligatorio:
  - `supabase/functions/api-proveedor/schemas.ts` marca `health` como `requiresAuth:false` a nivel de dominio.
  - A nivel plataforma, `verify_jwt=true` mantiene la barrera de invocacion para Supabase Edge Functions.
- Ajuste final:
  - **No** se recomienda `verify_jwt=false` para `api-proveedor`.
  - La salida correcta es un **token tecnico dedicado** mas `x-api-secret`, manteniendo intacta la politica `D-086`.
  - Implementacion aplicada en repo: `nightly-gates.yml` exporta `OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION="Bearer $SUPABASE_SERVICE_ROLE_KEY"` y `OPS_SMOKE_API_PROVEEDOR_SECRET="$API_PROVEEDOR_SECRET"`.
  - Cierre definitivo pendiente: primera corrida remota verde con artifact archivado.

### EXH-B-002 - Smoke operativo ausente en nightly

- Mitigado en repo.
- `nightly-gates.yml` ahora agrega job dedicado `Ops Smoke (Remote, warning-only)` con summary y artifact `ops-smoke-report`.
- Cierre definitivo pendiente: evidencia de la primera corrida programada o manual en GitHub Actions.

### EXH-B-003 - Cobertura incompleta de `cron-health-monitor`

- Mitigado en repo.
- `nightly-gates.yml` exporta `OPS_SMOKE_SERVICE_ROLE_KEY` desde `SUPABASE_SERVICE_ROLE_KEY`, habilitando el check opcional de `cron-health-monitor/health-check`.
- Se mantiene como check no critico hasta acumular evidencia estable en nightly.

### EXH-B-004 - Warning circular de chunking

- Cerrado.
- La evidencia canonica del 2026-03-12 (`D-196`) y el build final verificado muestran que el warning ya no esta presente.

### EXH-B-005 - Warning `Unknown input options: manualChunks`

- Cerrado.
- El ajuste vigente en `minimarket-system/vite.config.ts` con `workbox.inlineWorkboxRuntime=true` elimina el warning residual de Workbox/Rollup.

### EXH-B-006 - Ruido de test harness frontend

- Cerrado.
- Resultado funcional actual: `257/257 PASS` en corridas consecutivas despues del hardening del harness.
- Remediaciones aplicadas:
  - `src/pages/a11y.test.tsx` espera a React Query idle y deja de emitir warnings `act(...)`
  - `src/setupTests.ts` aplica future flags de React Router a los wrappers globales, agrega shims de jsdom/canvas y filtra el ruido esperado de `ErrorBoundary.test.tsx`
  - los tests que mockean `react-router-dom` reutilizan el mismo contrato de future flags
- Conclusion:
  - el ruido principal de señal para Parallel B queda saneado en el baseline actual
  - cualquier warning residual futuro debe tratarse como regresion nueva, no como deuda heredada de este hallazgo

### EXH-B-007 - Warnings de lint

- Cerrado.
- `pnpm -C minimarket-system lint` converge a `0 errors, 0 warnings`.
- La reduccion se completo tipando mocks y callbacks en tests/harness prioritarios del frontend.

### EXH-B-008 - Secrets sin clasificacion por entorno

- Cerrado en repo.
- Se agrego la fuente canonica:
  - `docs/ENV_SECRET_CONTRACT.json`
  - `docs/ENV_SECRET_CONTRACT.md`
- `env_audit.py` ahora clasifica faltantes `required` vs `optional` por `dev/staging/prod`.
- Verificacion actual:
  - `prod` no tiene faltantes `required` en Supabase secrets.
  - Los faltantes residuales quedan correctamente clasificados como `optional`.

### EXH-B-009 - Drift local de Supabase CLI

- **Mitigado en repo** (cierre interno 2026-03-13).
- Evidencia: `.github/workflows/nightly-gates.yml` linea 12: `SUPABASE_CLI_VERSION: '2.75.0'`; job `migration-drift` usa `setup-cli` con esa version.
- Drift local (`supabase --version` -> `2.72.7`) permanece como riesgo externo: cada desarrollador debe actualizar su CLI local; el repo no puede forzarlo.
- Documentacion: `docs/INSTALLATION.md` ya documenta `2.75.0` como target.

### EXH-B-010 - Budget de contexto documental

- Cerrado.
- `npm run docs:context-budget` converge a `ok=9 warn=0 fail=0`.
- El hallazgo original queda supersedido por el estado canonico actual.

### EXH-B-011 - Densidad de `console.warn/error`

- Cerrado.
- La evidencia refrescada deja `0` ocurrencias crudas dentro de `scripts/`, `6` ocurrencias intencionales en codigo productivo y `2` aserciones en `tests/unit/shared-logger.test.ts`.
- La concentracion residual queda acotada a sinks intencionales fuera de `scripts/`:
  - `supabase/functions/_shared/logger.ts`
  - `minimarket-system/src/lib/observability.ts`
  - `minimarket-system/src/components/ErrorBoundary.tsx`
  - `minimarket-system/src/components/GlobalSearch.tsx`
  - `tests/unit/shared-logger.test.ts`
- Remediacion aplicada:
  - `scripts/_shared/cli-log.mjs` deja de depender de `console.warn/error` y escribe directo a `stdout/stderr`
  - los scripts operativos de smoke/seed/OCR/admin/closure reutilizan el helper compartido
- Conclusion:
  - `LOG-001` queda cerrado en repo
  - cualquier nuevo `console.warn/error` dentro de `scripts/` debe tratarse como regresion operativa

## 6) Contratos operativos fijados por esta version final

No hay cambios de API publica de producto. Esta version final fija solo contratos operativos:

- `ops:smoke` para `api-proveedor` requiere:
  - `OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION`
  - `OPS_SMOKE_API_PROVEEDOR_SECRET`
- `cron-health-monitor/health-check` sigue siendo opcional sin:
  - `OPS_SMOKE_SERVICE_ROLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- La politica de auth **no cambia**:
  - `api-minimarket` puede seguir con `verify_jwt=false`
  - `api-proveedor` permanece con `verify_jwt=true`

## 7) Controles en verde

- Unit tests: `1959/1959 PASS`.
- Component tests: `257/257 PASS` en dos corridas consecutivas.
- Build frontend: `PASS` sin warnings de chunking/PWA.
- Budget documental: `ok=9 warn=0 fail=0`.
- Dependency governance: `PASS`.
- Supabase JS alignment: `PASS`.
- Doc links: `PASS`.
- Metrics doc check: `PASS`.
- Vulnerabilidades runtime: sin hallazgos en `npm audit --omit=dev` y `pnpm audit --prod`.
- Dry-run de integracion/E2E: prerequisitos correctos.

## 8) Plan de accion final

### Bloque A - Operacion y monitoreo (0-24h)

1. `OPS-001`: formalizar auth tecnica para smoke de `api-proveedor`.
   - Estado: implementado en repo.
   - Pendiente: evidencia de primera corrida remota verde.
2. `OPS-002`: integrar `ops:smoke` en `nightly-gates`.
   - Estado: implementado en repo.
   - Pendiente: validar artifact `ops-smoke-report` en GitHub Actions.
3. `OPS-003`: habilitar check opcional de `cron-health-monitor` en CI.
   - Estado: implementado en repo.
   - Pendiente: confirmar inclusion del endpoint en artifact nocturno.

### Bloque B - Senal de CI y entorno (2-5 dias)

1. `TEST-001`: bajar ruido del harness frontend.
   - Estado: cerrado en repo.
   - Evidencia: `pnpm -C minimarket-system test:components` estable, wrappers globales alineados y sin warnings residuales relevantes en la validacion final.
2. `ENV-001`: definir matriz de secretos `required/optional` por entorno.
   - Estado: cerrado en repo.
   - Evidencia: `docs/ENV_SECRET_CONTRACT.*` + `npm run ops:env-contract`.

### Bloque C - Deuda sostenida (1-2 semanas)

1. `LINT-001`: reducir `72` warnings de lint.
   - Estado: cerrado en repo (`0 errors, 0 warnings`).
2. `LOG-001`: normalizar formato de logs en scripts operativos.
   - Estado: cerrado en repo; `scripts/` queda en `0` usos crudos de `console.warn/error`.
3. `TOOL-001`: documentar/alinear version objetivo de Supabase CLI.
   - Estado: mitigado en repo; CI pineado a `2.75.0` en `nightly-gates.yml`; target documentado en `INSTALLATION.md`; instalacion local (`2.72.7`) externa.

## 9) Gates y criterio de cierre

Gates minimos que deben seguir citandose para este eje:

- `npm run test:unit`
- `pnpm -C minimarket-system test:components`
- `pnpm -C minimarket-system lint`
- `pnpm -C minimarket-system build`
- `npm run docs:context-budget`
- `node scripts/validate-doc-links.mjs`
- `node scripts/check-critical-deps-alignment.mjs`
- `node scripts/check-supabase-js-alignment.mjs`
- `node scripts/metrics.mjs --check`
- `python3 .agent/scripts/env_audit.py --with-supabase`
- `npm run ops:env-contract`

Esta version final se considera correcta si:

- no contradice `docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md` ni `docs/closure/OPEN_ISSUES.md`;
- refleja `EXH-B-004`, `EXH-B-005`, `EXH-B-010`, `EXH-B-011` como cerrados;
- no sobreafirma smoke remoto/local no reproducido en esta sesion;
- conserva evidencia vigente y elimina afirmaciones obsoletas del snapshot original;
- mantiene una matriz final consistente con separacion explicita entre `mitigado` y `cerrado` (EXH-B-009 mitigado 2026-03-13);
- deja trazabilidad suficiente para ejecutar el siguiente ciclo sin releer el reporte original.

## 10) Nota final de interpretacion

- Parallel B **no** detecta una regresion general del sistema frente al canon actual.
- El principal trabajo pendiente no es producto core, sino **observabilidad operativa y disciplina de smoke/CI**.
- La remediacion de calidad frontend, contrato de entorno y logging operativo queda cerrada en repo; la deuda restante se concentra en evidenciar nightly remoto y alinear tooling local.
- Tras esta implementacion, la remediacion de `OPS-001/002/003` queda aplicada en el repo, pero su cierre completo requiere evidencia runtime desde GitHub Actions.
- El reporte original queda supersedido por esta consolidacion final; cualquier trabajo posterior sobre Parallel B debe tomar este archivo como base y el mega plan como soporte de ejecucion.
