# AUDIT_F0_BASELINE_2026-02-25

## Objetivo
Confirmar realidad actual de repo, infraestructura y fuentes canónicas antes de evaluar cierre operativo.

## Comandos ejecutados
```bash
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh session-start "auditoria codex-only: version definitiva final 2026-02-25"
.agent/scripts/p0.sh extract --with-gates --with-supabase
ls -1
rg --files | wc -l
find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | wc -l
rg --files supabase/migrations | wc -l
rg --files .github/workflows | wc -l
ls -1 .github/workflows
find supabase/functions -mindepth 1 -maxdepth 1 -type d | sort
supabase migration list --linked
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json
supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi
```

## Salida relevante
- `bootstrap/session-start/extract`: PASS.
- Artefactos de sesión/extracción generados:
  - `docs/closure/BASELINE_LOG_2026-02-25_031038.md`
  - `docs/closure/TECHNICAL_ANALYSIS_2026-02-25_031047.md`
  - `docs/closure/INVENTORY_REPORT_2026-02-25_031208.md`
- Inventario actual:
  - Archivos trackeados (`rg --files`): `689`
  - Edge Functions en repo (sin `_shared`): `15`
  - Migraciones SQL: `52`
  - Workflows: `4` (`backup.yml`, `ci.yml`, `deploy-cloudflare-pages.yml`, `security-nightly.yml`)
- Estado remoto Supabase:
  - Migraciones `52/52` sincronizadas.
  - `api-minimarket` permanece con `verify_jwt=false` (guardrail vigente).
  - `GCV_API_KEY` presente en secretos remotos (names-only).

## Matriz documentada | implementada | invocada | testeada
| Funcionalidad | Documentada | Implementada | Invocada | Testeada | Evidencia |
|---|---|---|---|---|---|
| Auth + permisos por rol | SI | SI | SI | SI | `docs/DECISION_LOG.md:36`, `minimarket-system/src/App.tsx:32`, `supabase/functions/api-minimarket/helpers/auth.ts:243`, `tests/unit/gateway-auth.test.ts:1` |
| POS venta + impacto stock | SI | SI | SI | SI | `docs/ESTADO_ACTUAL.md:188`, `supabase/functions/api-minimarket/index.ts:2060`, `supabase/functions/api-minimarket/handlers/ventas.ts:140`, `tests/unit/api-ventas-pos.test.ts:1` |
| Depósito/movimientos/ajustes | SI | SI | SI | SI | `docs/DECISION_LOG.md:14`, `supabase/functions/api-minimarket/index.ts:1444`, `supabase/functions/api-minimarket/index.ts:1593`, `tests/unit/handlers-ventas-coverage.test.ts:1` |
| OCR facturas | SI | SI | SI | SI | `docs/DECISION_LOG.md:175`, `supabase/functions/api-minimarket/index.ts:2207`, `supabase/functions/facturas-ocr/index.ts:153`, `tests/unit/facturas-ocr-helpers.test.ts:1` |
| Cron/backfill/notificaciones | SI | SI | SI | SI | `docs/ESTADO_ACTUAL.md:350`, `supabase/functions/cron-jobs-maxiconsumo/index.ts:118`, `supabase/functions/backfill-faltantes-recordatorios/index.ts:72`, `tests/unit/backfill-faltantes.test.ts:1` |

## Conclusión F0
Baseline completo y trazable. No se observaron rupturas de inventario ni drift local/remoto en migraciones o catálogo de funciones.

## Hallazgos F0
| ID | Severidad | Archivo:Linea | Hallazgo | Acción |
|---|---|---|---|---|
| A-005 | MEDIO | `docs/DECISION_LOG.md:177` | Estado OCR en fuente primaria contradice estado vigente y secretos remotos | Consolidar decisión vigente en docs canónicas (sin ambigüedad histórica en bloque activo) |
| A-006 | BAJO | `README.md:13` | Snapshot técnico principal desactualizado (14/44 vs 15/52 real) | Actualizar snapshot o enlazar a métrica canónica dinámica |
| A-007 | BAJO | `docs/AGENTS.md:11` | Snapshot de agentes/cierre desfasado respecto a estado actual | Sincronizar conteos con `docs/METRICS.md` y baseline actual |
