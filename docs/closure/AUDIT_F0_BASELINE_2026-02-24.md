# AUDIT_F0_BASELINE_2026-02-24

## Objetivo
Confirmar realidad de repo, infraestructura y fuentes canónicas antes de evaluar calidad operativa.

## Comandos ejecutados
```bash
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh session-start "auditoria codex-only: sistema integral de calidad y cierre"
.agent/scripts/p0.sh extract --with-gates --with-supabase
ls -1
find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | wc -l
rg --files supabase/migrations | wc -l
rg --files .github/workflows | wc -l
supabase migration list --linked
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[] | "\(.name)\tv\(.version)\tverify_jwt=\(.verify_jwt)"' | sort
supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[].name' | sort
```

## Salida relevante
- `extract` generó artefactos de sesión:
  - `docs/closure/BASELINE_LOG_2026-02-24_054046.md`
  - `docs/closure/TECHNICAL_ANALYSIS_2026-02-24_054051.md`
  - `docs/closure/INVENTORY_REPORT_2026-02-24_054223.md`
- Inventario actual:
  - Edge Functions desplegables en repo: `15`
  - Migraciones SQL: `52`
  - Workflows CI/CD: `4`
- Estado remoto:
  - Migraciones `52/52` sincronizadas (`supabase migration list --linked`)
  - `api-minimarket` con `verify_jwt=false` (guardrail OK)
  - `GCV_API_KEY` presente en secretos (names-only)

## Matriz documentada | implementada | invocada | testeada
| Funcionalidad | Documentada | Implementada | Invocada | Testeada | Evidencia |
|---|---|---|---|---|---|
| Auth + roles | SI | SI | SI | SI | `docs/DECISION_LOG.md:16`, `minimarket-system/src/App.tsx:32`, `supabase/functions/api-minimarket/helpers/auth.ts:174`, `tests/unit/gateway-auth.test.ts:1` |
| POS venta + stock | SI | SI | SI | SI | `docs/ESTADO_ACTUAL.md:188`, `supabase/functions/api-minimarket/index.ts:2059`, `supabase/functions/api-minimarket/handlers/ventas.ts:66`, `tests/unit/api-ventas-pos.test.ts:1` |
| Depósito/movimientos | SI | SI | SI | SI | `docs/DECISION_LOG.md:14`, `supabase/functions/api-minimarket/index.ts:1443`, `supabase/functions/api-minimarket/index.ts:1592`, `tests/unit/handlers-ventas-coverage.test.ts:1` |
| OCR facturas | SI | SI | SI | SI | `docs/DECISION_LOG.md:175`, `supabase/functions/api-minimarket/index.ts:2207`, `supabase/functions/facturas-ocr/index.ts:153`, `tests/unit/facturas-ocr-helpers.test.ts:1` |
| Cron + backfill | SI | SI | SI | SI | `docs/ESTADO_ACTUAL.md:350`, `supabase/functions/cron-jobs-maxiconsumo/index.ts:118`, `supabase/functions/backfill-faltantes-recordatorios/index.ts:72`, `tests/unit/backfill-faltantes.test.ts:1` |

## Conclusión F0
Baseline reproducible y trazable completado. No se detectaron bloqueos críticos de inventario o sincronía local/remoto.

## Hallazgos F0
- A-005 (BAJO) `docs/ESTADO_ACTUAL.md:30` inconsistente con `docs/ESTADO_ACTUAL.md:240`.
- A-006 (BAJO) `README.md:12` y `README.md:14` desfasados contra estado real (15/52).
