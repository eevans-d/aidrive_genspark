# Exhaustive Scan Report (Parallel B)

Fecha: 2026-03-12 UTC  
Rama: `codex/parallel-operability-hardening-20260312`  
Objetivo: escaneo integral de operabilidad, resiliencia y salud tecnica del repositorio, con segunda verificacion hallazgo por hallazgo.

## 1) Cobertura de Escaneo

- Conteo de archivos trackeados (`git ls-files | wc -l`): `660`.
- Conteo de archivos en arbol sin `.git` (`rg --files --hidden -g '!.git' | wc -l`): `651`.
- Cobertura transversal aplicada:
  - Backend: `supabase/functions/*`
  - Frontend: `minimarket-system/src/*`
  - Tests: `tests/*` y `minimarket-system/src/**/*.test.tsx`
  - Scripts: `scripts/*`
  - CI/CD: `.github/workflows/*`
  - Documentacion operativa y cierre: `docs/*`

## 2) Evidencia Ejecutada (segunda pasada de confirmacion)

1. `node scripts/ops-smoke-check.mjs`  
   - Resultado: `api-minimarket/health` PASS `200`; `api-proveedor/health` FAIL `401` tras retries.
2. `OPS_SMOKE_TARGET=remote SUPABASE_URL="https://dqaygmjpzoqjjrywdsxi.supabase.co" node scripts/ops-smoke-check.mjs`  
   - Resultado: mismo patron en remoto (PASS minimarket / FAIL proveedor 401).
3. `rg -n "ops:smoke|ops-smoke-check" .github/workflows -S`  
   - Resultado: sin coincidencias (no gate CI para smoke operativo).
4. `rg -n "D-086|verify_jwt=true|requires JWT|api-proveedor/health" docs/DECISION_LOG.md docs/closure/BASELINE_LOG_2026-03-12_033328.md tests/e2e/api-proveedor.smoke.test.ts -S`  
   - Resultado: confirmada politica D-086 y baseline `api-proveedor verify_jwt=true`; test E2E documenta que `/health` requiere JWT.
5. `pnpm -C minimarket-system build`  
   - Resultado: build PASS con warnings `Circular chunk: radix -> vendor -> radix` y `Unknown input options: manualChunks`.
6. `pnpm -C minimarket-system test:components`  
   - Resultado: `50` files / `257` tests PASS; persisten warnings de React Router future flags y `act(...)` en parte de las pruebas.
7. `pnpm -C minimarket-system lint`  
   - Resultado: `0 errors, 72 warnings` (`@typescript-eslint/no-explicit-any`, concentrado en tests/mocks).
8. `supabase --version`  
   - Resultado: instalada `2.72.7`; sugerida `2.75.0`.
9. `python3 .agent/scripts/env_audit.py --with-supabase`  
   - Resultado: variables usadas faltantes en Supabase secrets (names only) detectadas, incluyendo `API_PROVEEDOR_READ_MODE`, `ENVIRONMENT`, `LOG_LEVEL`, `TWILIO_*`, `WEBHOOK_URL`, entre otras.
10. `node scripts/validate-doc-links.mjs`  
    - Resultado: `Doc link check OK (37 files)`.

## 3) Matriz Revalidada de Hallazgos

| ID | Severidad | Estado Revalidado | Confirmacion | Observacion breve | Mejora/refactor recomendada en documento |
|---|---|---|---|---|---|
| EXH-B-001 | Alta | Abierto (confirmado) | `api-proveedor/health` sigue `401` en local/remoto sin auth operativa | Hallazgo real de disponibilidad operativa: no hay smoke verde sin credenciales. | Definir contrato de health para proveedor: `health-public` sin datos sensibles o exigir siempre token tecnico dedicado y documentado en runbook. |
| EXH-B-002 | Media | Abierto (confirmado) | Workflows actuales no llaman `ops:smoke` | El smoke operativo depende de ejecucion manual. | Integrar job `ops:smoke` en `nightly-gates.yml` (fase 1 no bloqueante, fase 2 bloqueante) y publicar resumen PASS/FAIL como artifact. |
| EXH-B-003 | Media | Abierto (confirmado) | Build vuelve a reportar `Circular chunk: radix -> vendor -> radix` | Aun no rompe release, pero escala deuda de bundling. | Revisar estrategia de chunking para radix/vendor (split explicito o simplificacion de dependencias compartidas). |
| EXH-B-004 | Media | Abierto (confirmado) | Build vuelve a reportar `Unknown input options: manualChunks` | Config de optimizacion no esta siendo aplicada como se espera. | Corregir ubicacion/config de `manualChunks` en Vite/Rollup; agregar prueba de build que falle si aparece ese warning. |
| EXH-B-005 | Media | Abierto (confirmado) | Test components sigue con warnings `act(...)` + future flags Router v7 | Ruido en CI que puede esconder errores reales. | Hardening de test harness: wrapper comun con `act`, configuracion de future flags controlada, limpieza de errores esperados en `ErrorBoundary.test.tsx`. |
| EXH-B-006 | Baja | Abierto (confirmado) | Lint mantiene `72` warnings de `no-explicit-any` | Mayormente deuda en tests/mocks, no runtime. | Plan por lotes: tipar mocks centrales (`supabaseMock`) y activar budget de warnings por sprint. |
| EXH-B-007 | Baja | Abierto (confirmado) | Supabase CLI local desfasada (`2.72.7` vs `2.75.0`) | Riesgo bajo, pero puede generar diferencias locales/CI. | Pin/normalizar version en tooling local + guia corta de upgrade para colaboradores. |
| EXH-B-008 | Baja | Abierto (ajustado) | Env audit detecta faltantes en secrets (names only) | Parte puede ser opcional por entorno, parte critica para runtime. | Crear matriz obligatoria/opcional por entorno (dev/staging/prod) y validacion automatica predeploy para nombres requeridos. |

## 4) Hallazgos Cerrados en esta pista

| ID | Estado | Accion aplicada |
|---|---|---|
| EXH-B-FIX-001 | Cerrado | Variables `OPS_SMOKE_*` incorporadas a `.env.example` para uso operativo reproducible. |
| EXH-B-FIX-002 | Cerrado (rama) | Smoke check operativo consolidado con retries/timeouts, hints de auth y salida `PASS/FAIL` por endpoint. |
| EXH-B-FIX-003 | Cerrado (rama) | Runbooks operativos actualizados con ejecucion, interpretacion y triage 0-15 minutos. |

## 5) Confirmacion de Revision Integral

- Se ejecutaron checks tecnicos y operativos sobre backend, frontend, tests, scripts, CI y docs.
- Se revalidaron los `8/8` hallazgos priorizados con evidencia reciente en la misma fecha (`2026-03-12 UTC`).
- Se incorporaron mejoras/refactors sugeridos para cada hallazgo dentro de esta matriz.
- Resultado: cobertura amplia y profunda del repo para objetivo de operabilidad/resiliencia; no se detectaron bloqueos nuevos de severidad critica adicionales fuera de EXH-B-001.

## 6) Riesgos Residuales (post-verificacion)

1. `api-proveedor/health` continuara en FAIL critico sin estrategia definitiva de auth operativa.
2. Mientras `ops:smoke` no este en CI, la deteccion de indisponibilidad depende de disciplina manual.
3. Warnings de build/tests/lint siguen sin mitigacion tecnica aplicada; no bloquean hoy, pero aumentan deuda operacional.
4. El set de secrets faltantes necesita clasificacion formal por entorno para evitar falsos positivos y faltantes reales en produccion.

## 7) Orden de Abordaje Recomendado

1. Resolver EXH-B-001 y EXH-B-002 como bloque de disponibilidad (SLA/SLO first).
2. Corregir EXH-B-004 junto con EXH-B-003 para estabilidad de build y control de bundle.
3. Reducir ruido de pruebas (EXH-B-005) para mejorar senal de CI.
4. Ejecutar plan incremental de deuda (EXH-B-006 y EXH-B-007).
5. Formalizar contrato de variables/secrets por entorno (EXH-B-008).

## 8) Nota de No-Colision

- No se modificaron archivos reservados por la ventana principal.
- Se mantuvo aislamiento de cambios y se evito revertir trabajo ajeno.
