# OPEN ISSUES (Canonico)

**Ultima actualizacion:** 2026-02-25 (post-remediacion)
**Fuente ejecutiva:** `docs/closure/INFORME_REMEDIACION_FINAL_2026-02-25_041847.md`

## Hallazgos abiertos

Ninguno. Todos los hallazgos han sido cerrados.

## Hallazgos cerrados

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
| Deno no disponible en PATH global | RECOMENDADO | Exportar `~/.deno/bin` en shell/CI. No bloqueante (CI usa `denoland/setup-deno@v2`). |
| Leaked password protection (plan Pro) | BLOQUEADO EXTERNO | Requiere cambio de plan Supabase. Backlog. |
