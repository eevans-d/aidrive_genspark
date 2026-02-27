# OPEN ISSUES (Canonico)

**Ultima actualizacion:** 2026-02-27 (re-chequeo cruzado Codex + Claude)
**Fuente ejecutiva:** `docs/PRODUCTION_GATE_REPORT.md`

## Hallazgos abiertos

Ninguno. Todos los hallazgos han sido cerrados.

## Hallazgos cerrados

### Re-chequeo cruzado (2026-02-27)

| ID | Severidad | Cierre aplicado | Evidencia |
|---|---|---|---|
| V-001 | BAJO | Gate 7 reconfirmado: scanner normalizado sin matches en codigo productivo. | `.agent/skills/ProductionGate/SKILL.md`, `docs/closure/RECHECK_GO_2026-02-27.md` |
| V-002 | BAJO | Baseline perf reconfirmado como **parcial**: `scripts/perf-baseline.mjs` requiere `TEST_USER_ADMIN` y `TEST_PASSWORD` no presentes en `.env.test`. Se mantiene como recomendacion no bloqueante. | `docs/closure/PERF_BASELINE_2026-02-26_081540.md`, `docs/closure/RECHECK_GO_2026-02-27.md` |

### Re-verificacion independiente (2026-02-26 08:30-08:52 UTC)

| ID | Severidad | Cierre aplicado | Evidencia |
|---|---|---|---|
| H-001 | BAJO | 4 rutas implementadas y documentadas en API_README pero ausentes del OpenAPI YAML. Agregadas: `POST /compras/recepcion`, `POST /facturas/{id}/extraer`, `PUT /facturas/items/{id}/validar`, `POST /facturas/{id}/aplicar`. | `docs/api-openapi-3.1.yaml` lineas 1331-1612 |
| H-002 | BAJO | 4 vulnerabilidades en deps de build (`rollup` high x2, `minimatch` high x2, `ajv` moderate, `lodash` moderate). Contexto: build-time only, no runtime. `npm audit fix` ejecutado. 0 vulnerabilities. | `package.json` (root) |
| H-003 | TRIVIAL | `stock_deposito.updated_at` documentado en ESQUEMA_BASE_DATOS_ACTUAL.md pero no existe en migraciones ni es usado por el codigo. Removido de docs para sincronizar con realidad. | `docs/ESQUEMA_BASE_DATOS_ACTUAL.md:140` |

### Revalidacion production gate (2026-02-26 08:16-08:18 UTC)

| ID | Severidad | Cierre aplicado | Evidencia |
|---|---|---|---|
| A-012 | MEDIO | Gate 7 normalizado para escanear codigo productivo (excluye `node_modules`, tests y fixtures), eliminando falsos positivos de JWT-like strings. | `.agent/skills/ProductionGate/SKILL.md`, `docs/PRODUCTION_GATE_REPORT.md` |
| A-013 | MEDIO | Baseline de performance generado y versionado (`PERF_BASELINE_*`) para cubrir Gate 17. Queda documentado estado parcial por ausencia de `TEST_USER_ADMIN`/`TEST_PASSWORD` en `.env.test`. | `docs/closure/PERF_BASELINE_2026-02-26_081540.md`, `docs/PRODUCTION_GATE_REPORT.md` |

### Sesion de remediacion (2026-02-25 04:00-04:18 UTC)

| ID | Severidad | Cierre aplicado | Evidencia |
|---|---|---|---|
| A-001 | ALTO | `react-router-dom` actualizado de 6.30.2 a 6.30.3 (`@remix-run/router` 1.23.1 -> 1.23.2). Advisory GHSA-2w69-qvjg-hvjx resuelta. | `minimarket-system/package.json:102`, `pnpm-lock.yaml` |
| A-002 | ALTO | `pnpm.overrides` para `minimatch` (5.1.7/10.2.1), `ajv` (8.18.0), `lodash` (4.17.23). 5 advisories resueltas. `pnpm audit --prod` = 0 vulnerabilities. | `minimarket-system/package.json:139-147` |
| A-003 | MEDIO | Arquitectura dual-source de rol FE/BE documentada como decision de diseno (FE: `personal.rol`, BE: `app_metadata.role`, sync via D-065). | `useVerifiedRole.ts:1-11`, `auth.ts:243-247` |
| A-008 | BAJO | `@ts-ignore` reemplazado por `@ts-expect-error` (TypeScript-preferred). | `scraper-maxiconsumo/config.ts:14` |
| A-009 | BAJO | Test NotFound creado (2 tests). Components suite: 238 -> 240 tests. | `NotFound.test.tsx` |
| A-010 | BAJO | Fallback hardcodeado eliminado. Validacion estricta con abort si falta `API_PROVEEDOR_SECRET`. | `scripts/run-e2e-tests.sh:115-120` |
| A-011 | BAJO | Comentario D-017 explica nullable `apiSecret` en `buildContext()`: read endpoints no lo requieren, write endpoints validan a nivel handler. | `api-proveedor/index.ts:190-192` |

### Sesion de auditoria (2026-02-25 03:10-03:44 UTC)

| ID | Severidad | Cierre aplicado | Evidencia |
|---|---|---|---|
| A-004 | MEDIO | `GCV_API_KEY` agregado en `.env.example:25`. | `.env.example` |
| A-005 | MEDIO | Reconciliacion OCR/GO en `DECISION_LOG.md` consolidado. | `docs/DECISION_LOG.md` |
| A-006 | BAJO | README snapshot actualizado (15 funciones, 52 migraciones). | `README.md` |
| A-007 | BAJO | AGENTS.md sincronizado con metricas actuales. | `docs/AGENTS.md` |

## BLOCKED
- Ninguno.

## Pendientes vigentes no asociados a hallazgos
| Item | Estado | Nota |
|---|---|---|
| Baseline perf autenticado completo (`perf-baseline.mjs`) | RECOMENDADO | Requiere agregar `TEST_USER_ADMIN` y `TEST_PASSWORD` en `.env.test` (solo entorno de test). No bloquea GO actual. |
| Deno no disponible en PATH global | RECOMENDADO | Exportar `~/.deno/bin` en shell/CI. No bloqueante (CI usa `denoland/setup-deno@v2`). |
| Leaked password protection (plan Pro) | BLOQUEADO EXTERNO | Requiere cambio de plan Supabase. Backlog. |
