# Exhaustive Scan Report (Parallel B) - Deep Audit v2

Fecha: 2026-03-12 UTC  
Rama: `codex/parallel-operability-hardening-20260312`  
Objetivo: auditoria operativa y de resiliencia a nivel produccion, con verificacion exhaustiva y plan de accion ejecutable.

## 0) Veredicto Ejecutivo

- Estado general: **operable con deuda tecnica controlable**.
- Bloqueantes operativos reales: **2** (`EXH-B-001`, `EXH-B-002`).
- Hallazgos abiertos revalidados: **11**.
- Hallazgos cerrados en esta pista: **3** (`EXH-B-FIX-001..003`).
- Controles en verde: tests unitarios completos, checks de dependencias criticas, docs links, audit de vulnerabilidades runtime.

## 1) Cobertura Exhaustiva de Escaneo

### 1.1 Inventario del repositorio

- Archivos trackeados (`git ls-files | wc -l`): `660`
- Archivos en arbol sin `.git` (`rg --files --hidden -g '!.git' | wc -l`): `651`

### 1.2 Cobertura por dominio

| Dominio | Cobertura escaneada | Conteo relevante |
|---|---|---:|
| Edge Functions | `supabase/functions/*` | 89 archivos `.ts` |
| Frontend | `minimarket-system/src/*` | 135 archivos `.ts/.tsx` |
| Tests raiz | `tests/*` | 100 archivos `.ts` |
| Tests frontend | `minimarket-system/src/**/*.test.*` | 50 archivos |
| Scripts operativos | `scripts/*` | 41 scripts |
| Workflows CI/CD | `.github/workflows/*` | 5 workflows |
| Documentacion | `docs/*` + `docs/closure/*` | cobertura completa de docs operativas |

### 1.3 Funciones con senales de health/status detectadas

Detectadas por inspeccion de `supabase/functions/*/index.ts`:

- `api-assistant`
- `api-minimarket`
- `api-proveedor`
- `cron-dashboard`
- `cron-health-monitor`
- `cron-jobs-maxiconsumo`
- `cron-testing-suite`
- `scraper-maxiconsumo`

## 2) Evidencia Tecnica Ejecutada (conclusion por comando)

| # | Comando | Resultado |
|---|---|---|
| 1 | `node scripts/ops-smoke-check.mjs` | `EXIT=1`: `api-minimarket/health` PASS `200`; `api-proveedor/health` FAIL `401`. |
| 2 | `OPS_SMOKE_TARGET=remote SUPABASE_URL=... node scripts/ops-smoke-check.mjs` | `EXIT=1`: mismo patron en remoto (PASS minimarket, FAIL proveedor `401`). |
| 3 | `rg -n "ops:smoke|ops-smoke-check" .github/workflows -S` | sin matches: smoke operativo no integrado en workflows. |
| 4 | `pnpm -C minimarket-system build` | PASS con warnings: `Circular chunk: radix -> vendor -> radix` + `Unknown input options: manualChunks`. |
| 5 | `pnpm -C minimarket-system test:components` | `50/50 files`, `257/257 tests` PASS, con warnings de `act(...)` y React Router future flags. |
| 6 | `pnpm -C minimarket-system lint` | `0 errors, 72 warnings` (`no-explicit-any` en tests/mocks). |
| 7 | `npm run test:unit` | `88/88 files`, `1959/1959 tests` PASS. |
| 8 | `bash scripts/run-integration-tests.sh --dry-run` | prerequisitos correctos (dry-run). |
| 9 | `bash scripts/run-e2e-tests.sh --dry-run` | prerequisitos correctos (dry-run). |
| 10 | `node scripts/check-critical-deps-alignment.mjs` | PASS. |
| 11 | `node scripts/check-supabase-js-alignment.mjs` | PASS (2.95.3 alineado). |
| 12 | `node scripts/metrics.mjs --check` | `docs/METRICS.md OK.` |
| 13 | `node scripts/check-context-budget.mjs` | 4 docs canonicos en `WARN_TARGET` (sin FAIL). |
| 14 | `python3 .agent/scripts/env_audit.py --with-supabase` | faltantes en Supabase secrets detectados (names only). |
| 15 | `supabase --version` | local `2.72.7`, recomendado `2.75.0`. |
| 16 | `npm audit --omit=dev --audit-level=high` | `found 0 vulnerabilities`. |
| 17 | `pnpm -C minimarket-system audit --prod --audit-level high` | `No known vulnerabilities found`. |
| 18 | `node scripts/validate-doc-links.mjs` | `Doc link check OK (37 files)`. |

## 3) Matriz Ampliada de Hallazgos (Revalidada)

| ID | Sev | Estado | Evidencia clave | Observacion breve | Mejora/Refactor recomendado |
|---|---|---|---|---|---|
| EXH-B-001 | Alta | Abierto (confirmado) | smoke local/remoto: `api-proveedor/health` -> `401` | Disponibilidad operativa roja sin auth tecnica. | Definir contrato de health de proveedor: endpoint publico tecnico o token tecnico dedicado obligatorio para ops smoke. |
| EXH-B-002 | Alta | Abierto (confirmado) | no `ops:smoke` en `.github/workflows/*` | El control principal de disponibilidad sigue manual. | Integrar job `ops:smoke` en nightly (fase 1 warning, fase 2 blocking). |
| EXH-B-003 | Media | Abierto (confirmado) | `ops-smoke-check` no corre `cron-health-monitor` sin service key | Hay punto ciego para cron-monitor por defecto. | Definir perfil CI con service key de solo lectura para habilitar check opcional en nightly. |
| EXH-B-004 | Media | Abierto (confirmado) | build: `Circular chunk: radix -> vendor -> radix` | Riesgo de deuda de bundling y mantenibilidad. | Ajustar estrategia de chunking/rutas compartidas entre `radix` y `vendor`. |
| EXH-B-005 | Media | Abierto (confirmado) | build: `Unknown input options: manualChunks` | Config parcial/no aplicada en pipeline PWA/Workbox. | Corregir configuracion `manualChunks` y agregar guard para detectar warning en CI. |
| EXH-B-006 | Media | Abierto (confirmado) | tests componentes PASS con warnings `act(...)` + Router v7 flags | Ruido de CI puede ocultar senales reales. | Hardening del test harness (`act` wrappers + future flags controladas). |
| EXH-B-007 | Baja | Abierto (confirmado) | lint: `72 warnings` `no-explicit-any` | Deuda de tipado en tests/mocks (no bloquea runtime). | Plan incremental por lotes sobre mocks centrales y paginas test-heavy. |
| EXH-B-008 | Media | Abierto (ajustado) | env audit: faltantes en Supabase secrets (names only) | Falta matriz obligatoria/opcional por entorno. | Crear contrato de secretos por entorno + validador predeploy de nombres requeridos. |
| EXH-B-009 | Baja | Abierto (confirmado) | `supabase --version`: `2.72.7` vs `2.75.0` | Drift local vs tooling recomendado. | Estandarizar version local/CI y documentar upgrade minimo. |
| EXH-B-010 | Baja | Abierto (confirmado) | `check-context-budget`: 4 docs canonicos en `WARN_TARGET` | Riesgo de friccion operativa/documental. | Poda incremental de docs largas hacia historicos (sin perder evidencia). |
| EXH-B-011 | Baja | Abierto (confirmado) | `console.warn/error` detectados: 111 (alta concentracion en scripts) | Ruido en ejecucion manual puede degradar diagnostico rapido. | Estandarizar niveles/formato de logs operativos en scripts clave. |

## 4) Detalle y Confirmacion por Hallazgo

### EXH-B-001 - `api-proveedor/health` requiere auth operativa efectiva

- Confirmacion funcional:
  - local: `OPS_SMOKE_EXIT=1`, `api-proveedor/health -> 401`
  - remoto: `OPS_SMOKE_REMOTE_EXIT=1`, `api-proveedor/health -> 401`
- Confirmacion de politica:
  - `docs/DECISION_LOG.md:21` (D-086): solo `api-minimarket` con `verify_jwt=false`.
  - baseline: `api-proveedor verify_jwt=true`.
- Confirmacion de contrato de tests:
  - `tests/e2e/api-proveedor.smoke.test.ts:110` y `:111` documentan `/health` con JWT.
- Observacion:
  - En codigo de dominio, `health` esta marcado `requiresAuth:false` (`supabase/functions/api-proveedor/schemas.ts:43`), pero el nivel plataforma con `verify_jwt=true` mantiene barrera de auth en invocacion.
- Mejora recomendada:
  - Definir un canal tecnico estable para smoke (token tecnico o endpoint health tecnico sin datos sensibles).

### EXH-B-002 - Smoke operativo no esta en CI/nightly

- Evidencia:
  - `package.json:19` define `ops:smoke`.
  - `.github/workflows/nightly-gates.yml` no ejecuta ese script (jobs actuales: unit/lint-build/migration-drift).
- Observacion:
  - Existe comando listo para operar, pero sin automatizacion de vigilancia continua.
- Mejora recomendada:
  - Agregar `ops-smoke` en nightly con salida resumida y artifact.

### EXH-B-003 - Punto ciego en cron health check

- Evidencia:
  - `scripts/ops-smoke-check.mjs:42-54` solo incluye `cron-health-monitor/health-check` si hay `OPS_SMOKE_SERVICE_ROLE_KEY` o `SUPABASE_SERVICE_ROLE_KEY`.
- Observacion:
  - Por defecto, la cobertura smoke queda en 2 endpoints criticos; el tercer endpoint queda inactivo sin credencial.
- Mejora recomendada:
  - Proveer credencial tecnica controlada para habilitar siempre este check en entorno remoto CI/nightly.

### EXH-B-004 - Warning de chunk circular

- Evidencia:
  - `pnpm -C minimarket-system build` reporta `Circular chunk: radix -> vendor -> radix`.
- Observacion:
  - No bloquea release hoy, pero puede degradar predictibilidad del bundle.
- Mejora recomendada:
  - Revisar separacion de chunks y dependencias cruzadas en `vite.config.ts`.

### EXH-B-005 - Warning `manualChunks` desconocido

- Evidencia:
  - Build reporta `Unknown input options: manualChunks`.
  - Alineado con issue abierto `PERF-001` (`docs/closure/OPEN_ISSUES.md:45-51`).
- Observacion:
  - Señal de configuracion no aplicada en parte del pipeline (PWA/Workbox).
- Mejora recomendada:
  - Corregir configuracion y agregar chequeo CI para fallar si persiste ese warning.

### EXH-B-006 - Ruido de warnings en pruebas de componentes

- Evidencia:
  - `pnpm -C minimarket-system test:components` PASS, con warnings repetidos de `act(...)` y flags Router v7.
- Observacion:
  - El resultado funcional es verde, pero la señal de CI se contamina.
- Mejora recomendada:
  - Estandarizar wrappers de render/act y roadmap de migracion controlada de flags Router.

### EXH-B-007 - 72 warnings de lint en frontend

- Evidencia:
  - `pnpm -C minimarket-system lint` -> `0 errors, 72 warnings`.
- Observacion:
  - Concentrado en tests/mocks; no genera riesgo runtime directo.
- Mejora recomendada:
  - Reducir progresivamente `no-explicit-any` con budget de warnings por sprint.

### EXH-B-008 - Faltantes en secretos de Supabase (names only)

- Evidencia:
  - `env_audit` detecta variables usadas y no presentes en secrets (ej. `API_PROVEEDOR_READ_MODE`, `ENVIRONMENT`, `LOG_LEVEL`, `TWILIO_*`, `WEBHOOK_URL`, etc.).
- Observacion:
  - Sin clasificacion obligatoria/opcional por entorno, no se distingue riesgo real vs ruido.
- Mejora recomendada:
  - Matriz `required/optional` por `dev/staging/prod` + chequeo predeploy automatizado.

### EXH-B-009 - Drift de Supabase CLI local

- Evidencia:
  - `supabase --version` -> `2.72.7` (recomendado `2.75.0`).
- Observacion:
  - Riesgo bajo, pero puede introducir diferencias locales frente a CI.
- Mejora recomendada:
  - Normalizar version target y documentar upgrade.

### EXH-B-010 - Presupuesto de contexto documental

- Evidencia:
  - `node scripts/check-context-budget.mjs` -> 4 docs en `WARN_TARGET`.
- Observacion:
  - No es blocker tecnico, pero impacta operacion de agentes y mantenibilidad documental.
- Mejora recomendada:
  - Podar narrativa extensa a historicos y mantener canonicos mas ejecutables.

### EXH-B-011 - Densidad alta de `console.warn/error` en scripts

- Evidencia:
  - escaneo: `CONSOLE_WARN_ERROR_COUNT=111`, concentrado en scripts operativos.
- Observacion:
  - En incidentes reales, exceso de ruido dificulta diagnostico rapido.
- Mejora recomendada:
  - Estandarizar convencion de logs (`[INFO]`, `[WARN]`, `[ERROR]`, payload minimo y consistente).

## 5) Controles En Verde (verificados)

- Unit tests: `1959/1959` PASS.
- Component tests: `257/257` PASS.
- Dependency governance: PASS.
- Supabase JS alignment: PASS (2.95.3).
- Doc links: PASS (`37` files).
- Vulnerabilidades runtime (prod scope): sin hallazgos (`npm audit --omit=dev`, `pnpm audit --prod`).
- Dry-run de integracion/E2E: prerequisitos correctamente definidos.

## 6) Plan Intensivo de Abordaje (accionable)

### Fase 0 (0-24h) - Disponibilidad operacional

1. Cerrar EXH-B-001:
   - Decision: endpoint health tecnico o token tecnico obligatorio.
   - Criterio de cierre: `ops-smoke` local y remoto en PASS para checks criticos.
2. Cerrar EXH-B-002:
   - Integrar `npm run ops:smoke` en `nightly-gates.yml`.
   - Criterio de cierre: corrida nocturna con reporte PASS/FAIL y evidencia archivada.

### Fase 1 (2-7 dias) - Senal de CI y build confiable

1. EXH-B-005 y EXH-B-004 juntos:
   - eliminar warning `manualChunks` y warning de chunk circular.
   - validacion: build sin warnings de bundling no deseados.
2. EXH-B-006:
   - reducir warnings de test harness para mejorar signal-to-noise.

### Fase 2 (1-3 semanas) - Hardening sostenido

1. EXH-B-008:
   - matriz de secretos obligatorios/opcionales por entorno + gate predeploy.
2. EXH-B-007:
   - bajar warnings lint por lotes en tests/mocks.
3. EXH-B-009 y EXH-B-010 y EXH-B-011:
   - estandarizacion de tooling, contexto documental y formato de logs.

## 7) Hallazgos Cerrados en esta pista

| ID | Estado | Accion aplicada |
|---|---|---|
| EXH-B-FIX-001 | Cerrado | Variables `OPS_SMOKE_*` en `.env.example`. |
| EXH-B-FIX-002 | Cerrado (rama) | `scripts/ops-smoke-check.mjs` operativo con retries/timeouts/hints y exit codes consistentes. |
| EXH-B-FIX-003 | Cerrado (rama) | Runbooks operativos actualizados con triage 0-15 min y comandos concretos. |

## 8) Riesgos Residuales (post-auditoria)

1. `api-proveedor/health` seguira en FAIL critico sin cierre de estrategia de auth operativa.
2. Sin gate CI de smoke operativo, la deteccion temprana sigue manual.
3. Warnings de build/tests/lint no bloquean hoy, pero incrementan deuda operacional.
4. El contrato de secretos por entorno no esta formalizado y puede generar drift.

## 9) Confirmacion de No-Colision y Alcance de Cambios

- Este documento se actualizo sin tocar archivos reservados por la otra ventana.
- No se revirtio ni altero trabajo paralelo en `minimarket-system/vite.config.ts`.
- Este reporte es deliberadamente accionable para que cada hallazgo pueda abordarse en iteraciones posteriores con evidencia objetiva.
