# DECISION LOG (Canonico)

**Ultima actualizacion:** 2026-02-28 (archivo de planes deprecados + referencias canonicas)

## Decisiones activas y vigentes

| ID | Decision | Estado | Fecha | Evidencia |
|---|---|---|---|---|
| D-086 | Politica `verify_jwt`: solo `api-minimarket` puede operar con `verify_jwt=false`; resto de funciones `verify_jwt=true`. | Vigente | 2026-02-12 | `docs/closure/OPEN_ISSUES.md` |
| D-155 | OCR de facturas estandarizado en Google Cloud Vision; secret requerido: `GCV_API_KEY`. | Vigente | 2026-02-23 | `docs/ESTADO_ACTUAL.md`, `.env.example:25` |
| D-156 | Dependency governance fail-fast en CI para alineacion critica de dependencias. | Vigente | 2026-02-24 | `scripts/check-supabase-js-alignment.mjs`, `scripts/check-critical-deps-alignment.mjs` |
| D-158 | Auditoria integral 0-8 re-ejecutada: veredicto inicial `REQUIERE ACCION` por hallazgos `ALTO` en dependencias frontend. | Historico | 2026-02-25 | `docs/closure/FINAL_REPORT_CODEX_GO_LIVE_2026-02-25.md` |
| D-159 | Depuracion documental absoluta: eliminacion de documentacion duplicada/antigua, consolidacion a fuente unica y prompt canonico unico. | Vigente | 2026-02-25 | `docs/closure/README_CANONICO.md`, `docs/closure/DEPURACION_DOCUMENTAL_2026-02-25.md` |
| D-160 | Cierre post-auditoria de hallazgos documentales A-004..A-007. | Vigente | 2026-02-25 | `.env.example`, `docs/closure/OPEN_ISSUES.md` |
| D-161 | Remediacion completa: 7 hallazgos cerrados (A-001..A-003, A-008..A-011). `react-router-dom` 6.30.3, `pnpm.overrides` para 5 deps transitivas, `@ts-expect-error`, test NotFound, validacion estricta E2E, documentacion arquitectural dual-source rol. Veredicto: `GO INCONDICIONAL`. | Vigente | 2026-02-25 | `docs/closure/INFORME_REMEDIACION_FINAL_2026-02-25_041847.md` |
| D-162 | Revalidacion 2026-02-26: `ProductionGate` 18/18 PASS (score 100). Se normaliza Gate 7 para excluir `node_modules` y fixtures/tests, y se versiona `PERF_BASELINE_*` para Gate 17. Se mantiene veredicto `GO INCONDICIONAL`. | Vigente | 2026-02-26 | `docs/PRODUCTION_GATE_REPORT.md`, `.agent/skills/ProductionGate/SKILL.md`, `docs/closure/PERF_BASELINE_2026-02-26_081540.md` |
| D-163 | Re-chequeo cruzado 2026-02-27: Gate 7 confirmado sin matches en codigo productivo; baseline perf multi-endpoint autenticado sigue parcial por ausencia de `TEST_USER_ADMIN` y `TEST_PASSWORD` en `.env.test`. Se mantiene `GO INCONDICIONAL` y se deja mejora recomendada no bloqueante. | Vigente | 2026-02-27 | `docs/closure/OPEN_ISSUES.md`, `docs/ESTADO_ACTUAL.md`, `docs/closure/PERF_BASELINE_2026-02-26_081540.md`, `docs/closure/RECHECK_GO_2026-02-27.md` |
| D-164 | Se define `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` como unico plan canonico para ejecucion OCR. `PLAN_FACTURAS_OCR.md` y `PLAN_MAESTRO_OCR_FACTURAS.md` quedan deprecados como antecedentes historicos. | Vigente | 2026-02-27 | `docs/PLAN_FUSIONADO_FACTURAS_OCR.md`, `docs/archive/planes-deprecados/PLAN_FACTURAS_OCR.md`, `docs/archive/planes-deprecados/PLAN_MAESTRO_OCR_FACTURAS.md` |
| D-165 | Se separa explicitamente el estado global (`GO INCONDICIONAL`) del estado del modulo OCR (backlog abierto priorizado) para evitar falsas conclusiones de cierre total. | Vigente | 2026-02-27 | `docs/ESTADO_ACTUAL.md`, `docs/closure/OPEN_ISSUES.md` |
| D-166 | Se archivan en `docs/archive/planes-deprecados/` las planificaciones deprecadas para mantener `docs/` enfocado en ejecucion activa y reducir ambiguedad operativa. | Vigente | 2026-02-28 | `README.md`, `AGENTS.md`, `docs/ESTADO_ACTUAL.md`, `docs/PLAN_FUSIONADO_FACTURAS_OCR.md` |

## Regla de uso
- Este log mantiene decisiones activas + hitos historicos minimos de trazabilidad.
- El detalle operativo diario vive en `docs/closure/OPEN_ISSUES.md` y en el ultimo paquete de auditoria.
