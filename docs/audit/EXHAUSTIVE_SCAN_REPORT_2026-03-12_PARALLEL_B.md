# Exhaustive Scan Report (Parallel B)

Fecha: 2026-03-12 UTC  
Rama: `codex/parallel-operability-hardening-20260312`  
Objetivo: escaneo integral de operabilidad, resiliencia y salud técnica de todo el repo.

## 1) Cobertura de Escaneo

- Archivos trackeados revisados por inventario: `656` (`git ls-files | wc -l`).
- Archivos detectados en árbol (sin `.git`): `650` (`rg --files --hidden -g '!.git' | wc -l`).
- Escaneo transversal por dominios:
  - Backend `supabase/functions/*`
  - Frontend `minimarket-system/src/*`
  - Tests `tests/*` + `minimarket-system/src/**/*.test.tsx`
  - Scripts `scripts/*`
  - Docs operativas `docs/*`
  - CI/CD `.github/workflows/*`

## 2) Validaciones Ejecutadas (evidencia)

1. `node scripts/check-critical-deps-alignment.mjs` -> PASS  
2. `node scripts/check-supabase-js-alignment.mjs` -> PASS  
3. `python3 .agent/scripts/env_audit.py --with-supabase` -> ejecutado (names only)  
4. `python3 .agent/scripts/extract_reports.py --mode both` -> generado:  
   - `docs/closure/TECHNICAL_ANALYSIS_2026-03-12_033433.md`  
   - `docs/closure/INVENTORY_REPORT_2026-03-12_033434.md`  
5. `bash scripts/run-integration-tests.sh --dry-run` -> prerequisitos OK (dry-run)  
6. `bash scripts/run-e2e-tests.sh --dry-run` -> prerequisitos OK (dry-run)  
7. `node scripts/metrics.mjs --check` -> `docs/METRICS.md OK.`  
8. `npm run test:unit` -> `88 files / 1959 tests PASS`  
9. `pnpm -C minimarket-system lint` -> `0 errors, 72 warnings`  
10. `pnpm -C minimarket-system build` -> PASS (con warnings de bundling)  
11. `npx vitest run tests/security --config vitest.auxiliary.config.ts` -> `11 PASS, 3 skipped`  
12. `npx vitest run tests/api-contracts --config vitest.auxiliary.config.ts` -> `17 PASS, 1 skipped`  
13. `pnpm -C minimarket-system test:components` -> `50 files / 257 tests PASS`  
14. `node scripts/ops-smoke-check.mjs` (local y remoto) -> ejecutado, ver hallazgos.

## 3) Hallazgos Priorizados

| ID | Severidad | Estado | Hallazgo | Observacion breve |
|---|---|---|---|---|
| EXH-B-001 | Alta | Abierto | `api-proveedor/health` falla `401` en smoke sin auth operativa | Con `verify_jwt=true` la plataforma puede requerir bearer aun si app-level marca `/health` como publico. |
| EXH-B-002 | Media | Abierto | CI/nightly no incluye `ops:smoke` como gate de disponibilidad | El chequeo crítico de salud sigue manual y dependiente de operador. |
| EXH-B-003 | Media | Abierto | Build frontend reporta warning de chunk circular (`radix -> vendor -> radix`) | Riesgo de degradación de mantenibilidad/bundle si escala la fragmentación. |
| EXH-B-004 | Media | Abierto | Build reporta `Unknown input options: manualChunks` | Indica configuración de Rollup no aplicada; potencial falsa sensación de optimización. |
| EXH-B-005 | Media | Abierto | Tests frontend emiten warnings recurrentes (`act(...)`, future flags Router v7) | No bloquea hoy, pero agrega ruido y puede ocultar regresiones reales. |
| EXH-B-006 | Baja | Abierto | `eslint` con `72` warnings de `no-explicit-any` en tests/mocks frontend | Deuda técnica concentrada en suites de test; no afecta runtime productivo inmediato. |
| EXH-B-007 | Baja | Abierto | Supabase CLI desactualizado (`2.72.7`, latest sugerido `2.75.0`) | Riesgo bajo, pero puede impactar reproducibilidad de comandos locales/CI. |
| EXH-B-008 | Baja | Abierto | Variables usadas en backend ausentes en Supabase secrets (names only) | Gap de configuración operativa potencial en despliegues parciales. |

## 4) Hallazgos Cerrados en esta sesión

| ID | Estado | Acción aplicada |
|---|---|---|
| EXH-B-FIX-001 | Cerrado | Se añadieron variables `OPS_SMOKE_*` a `.env.example` para cerrar gap de documentación operativa. |
| EXH-B-FIX-002 | Cerrado (rama) | Se consolidó smoke check operativo con hints/fallback auth para 401 en proveedor. |
| EXH-B-FIX-003 | Cerrado (rama) | Se dejó playbook de triage operativo 0-15 min en runbooks/monitoring y se alineó troubleshooting. |

## 5) Riesgos Residuales

1. Sin `Authorization` y/o `x-api-secret` válidos, `api-proveedor/health` seguirá en FAIL crítico para smoke.
2. Los tests “real endpoint” de seguridad/contratos están parcialmente skip por depender de credenciales/runtime externo.
3. Existen cambios paralelos de otra ventana en `docs/closure` y archivos de configuración; este reporte no los revierte ni los mezcla.

## 6) Recomendaciones Inmediatas

1. Agregar job `ops:smoke` a `nightly-gates.yml` (modo no bloqueante inicial, con artifact de salida).  
2. Definir perfil oficial de variables para operación (`OPS_SMOKE_*`, `API_PROVEEDOR_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`).  
3. Corregir warning `manualChunks` en configuración de build para garantizar que el split de chunks realmente se aplique.  
4. Reducir ruido de tests frontend (wrapping con `act`, ajuste de future flags) para mejorar señal de CI.  
5. Cerrar backlog de warnings `no-explicit-any` en tests/mocks por lotes.

## 7) Nota de Colisión

- Se trabajó en aislamiento de ventana paralela, evitando ediciones destructivas o reversión de cambios ajenos.
- Se detectaron cambios concurrentes externos en el working tree y se mantuvieron intactos.
