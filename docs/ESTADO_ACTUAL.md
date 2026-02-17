# ESTADO ACTUAL DEL PROYECTO

**Ultima actualizacion:** 2026-02-17  
**Estado:** APROBADO (todos los P0 cerrados; ver `docs/closure/OPEN_ISSUES.md`)
**Score operativo:** 92/100 (post-fix P0 RLS + search_path, 2026-02-15)
**Fuente ejecutiva:** `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md`

## Addendum de Verificacion Cruzada (2026-02-17)
- Reporte auditado/sincronizado: `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md` (fe de verificación agregada 2026-02-17).
- Conteo `git ls-files` actualizado: `606` (se incorporó `docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md` en inventario documental).
- Criterio de endpoints del gateway explicitado y unificado:
  - `35` operaciones literales (`if (path === ... && method === ...)`)
  - `20` operaciones regex (`if (path.match(...) && method === ...)`)
  - `55` guards de enrutamiento totales.
- Recheck local quality-gates 2026-02-17: unit PASS, integración FAIL por `.env.test` ausente (`test-reports/quality-gates_20260217-032720.log:463-470`).
- Recheck de contratos proveedor: `docs/api-proveedor-openapi-3.1.yaml` parsea OK, pero mantiene drift runtime/spec (`/health` faltante y `/scrape|/compare|/alerts` sobrantes).
- Recheck `reportes-automaticos`: usa `fecha_movimiento` y `tipo_movimiento` en código actual.
- Paquete canonico "obra objetivo final" creado para contraste futuro: `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/`.

## Addendum Pre-Mortem Hardening (2026-02-17)
- **Decision:** D-126. Análisis pre-mortem identificó 42 hallazgos en 3 vectores de ataque. Se implementaron 17 fixes críticos.
- **Migración pendiente de aplicar:** `supabase/migrations/20260217100000_hardening_concurrency_fixes.sql`
  - CHECK constraint `stock_no_negativo` (`cantidad_actual >= 0`)
  - `sp_procesar_venta_pos` hardened: FOR UPDATE idempotency, FOR SHARE precios, FOR UPDATE crédito, EXCEPTION WHEN unique_violation
  - **PRE-REQUISITO:** verificar `SELECT * FROM stock_deposito WHERE cantidad_actual < 0` antes de `supabase db push`
- **Edge functions modificadas (pendientes de deploy):**
  - `alertas-stock` — N+1 eliminado (300 seq → 2 parallel + batch INSERT)
  - `notificaciones-tareas` — N+1 eliminado (batch check + batch INSERT)
  - `reportes-automaticos` — 5 seq → `Promise.allSettled()` parallel
  - `cron-notifications` — AbortSignal.timeout en 7 fetch calls
  - `scraper-maxiconsumo` — MAX_CATEGORIES_PER_RUN=4
- **Shared infra:** `_shared/circuit-breaker.ts` y `_shared/rate-limit.ts` con AbortSignal.timeout(3s) + TTL re-check 5min
- **Frontend:**
  - `Pos.tsx` — ESC guard, scanner race lock (`isProcessingScan` ref), smart retry (solo 5xx vía `instanceof ApiError`)
  - `AuthContext.tsx` — 401 intenta `refreshSession()` antes de signOut, con lock de promesa para deduplicar eventos concurrentes
  - `errorMessageUtils.ts` — Propaga `ApiError.message` cuando `requestId` existe (errores tracked del backend)
  - `usePedidos.ts` — Optimistic updates en `useUpdateItemPreparado` con rollback en `onError`
- **Tests:** 1165/1165 PASS (58 archivos). Build: CLEAN.
- **Plan detallado:** `.claude/plans/smooth-shimmying-canyon.md`

## 1) Veredicto Consolidado
- Mega Plan T01..T10: completado con 10 tareas PASS (incluye cierre de dependencias externas owner).
- Cierre tecnico/documental: completado.
- Reserva vigente: ninguna (Gate 4 revalidado con evidencia externa). Higiene recomendada: revocar key anterior en SendGrid si aún está activa.
- **Addendum 2026-02-15 (full-audit complementario):** P0 seguridad **CERRADO Y VERIFICADO EN REMOTO**. Migración de hardening: `supabase/migrations/20260215100000_p0_rls_internal_tables_and_search_path.sql`. RLS habilitado en 3 tablas internas + grants revocados a anon/authenticated + search_path fijado en `sp_aplicar_precio`. Migración aplicada via `supabase db push` el 2026-02-15. Evidencia local: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_POST_FIX.md`. Evidencia remota: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-15_REMOTE_POST_FIX.md` (6/6 checks PASS).

## 2) Estado Real Verificado (sesion 2026-02-16)

### Baseline remoto
- Migraciones: 41/41 local=remoto.
- Edge Functions activas: 13.
- Páginas frontend: 15 (React.lazy en App.tsx).
- Componentes compartidos: 7 .tsx + 1 .ts.
- Archivos de test: 100 (58 unit + 30 frontend + 3 contract + 2 e2e-smoke + 1 security + 1 performance + 1 api-contracts + 4 e2e-playwright).
- Evidencia:
  - `supabase migration list --linked`
  - `supabase functions list`
  - Nota: `docs/closure/BASELINE_LOG_*.md` fue removido en limpieza documental D-109 (2026-02-15). Para trazabilidad, usar historial git.

### Snapshot de Functions
| Function | Version | Status |
|---|---:|---|
| alertas-stock | v16 | ACTIVE |
| alertas-vencimientos | v16 | ACTIVE |
| api-minimarket | v26 | ACTIVE |
| api-proveedor | v18 | ACTIVE |
| cron-dashboard | v16 | ACTIVE |
| cron-health-monitor | v16 | ACTIVE |
| cron-jobs-maxiconsumo | v18 | ACTIVE |
| cron-notifications | v24 | ACTIVE |
| cron-testing-suite | v17 | ACTIVE |
| notificaciones-tareas | v18 | ACTIVE |
| reportes-automaticos | v16 | ACTIVE |
| reposicion-sugerida | v16 | ACTIVE |
| scraper-maxiconsumo | v19 | ACTIVE |

## 3) Resultado De Calidad (snapshot 2026-02-16)
- Unit tests: 1165/1165 PASS (58 archivos).
- Coverage: 89.20% stmts / 80.91% branch / 93.29% funcs / 90.66% lines (threshold 80% global).
- Auxiliary tests: 45/45 PASS + 4 skipped (3 archivos; contract/performance/api-contracts).
- Integration tests: 38/38 PASS.
- E2E smoke: 5/5 PASS.
- Frontend component tests: 171/171 PASS (30 archivos).
- Lint frontend: PASS.
- Build frontend: PASS.
- Quality gates: PASS.
- Evidencia: `test-reports/quality-gates_20260213-061657.log`.
- Recheck frontend 2026-02-14: PASS (`test-reports/quality-gates_20260214-042354.log`).
- Recheck local 2026-02-17: unit PASS + integración bloqueada por falta de `.env.test` (`test-reports/quality-gates_20260217-032720.log`).
- **Recheck tests 2026-02-16 (D-114, D-115):** 7 archivos de test reescritos FAKE→REAL + auditoría intensiva con cross-reference de 12+ módulos fuente. 891 unit PASS (16.09s), 45 auxiliary PASS (1.20s).
- **Coverage hardening 2026-02-16 (D-116):** 11 test files nuevos cubriendo 11 módulos críticos. 891→1165 unit tests (58 archivos). Coverage global ≥80% en las 4 métricas. Evidencia: `test-reports/junit.xml`.

## 4) Mega Plan (T01..T10)
**Plan de cierre (T01..T10):** ver esta tabla + `docs/closure/OPEN_ISSUES.md` (estado vigente) + `docs/closure/ACTA_EJECUTIVA_FINAL_2026-02-13.md` (resumen ejecutivo).

| Tarea | Estado | Evidencia |
|---|---|---|
| T01 (M3.S1) | PASS | `docs/closure/EVIDENCIA_M3_S1_2026-02-13.md` |
| T02 (M5.S1) | PASS | `docs/closure/EVIDENCIA_M5_S1_2026-02-13.md` |
| T03 (M5.S2) | PASS | `docs/closure/EVIDENCIA_M5_S2_2026-02-13.md` |
| T04 (M8.S1) | PASS | `docs/closure/EVIDENCIA_M8_S1_2026-02-13.md` |
| T05 (M6.S1) | PASS | `docs/closure/EVIDENCIA_M6_S1_2026-02-13.md` |
| T06 (M2.S1) | PASS | `docs/closure/EVIDENCIA_M2_S1_2026-02-13.md` |
| T07 (M2.S2) | PASS | `docs/closure/EVIDENCIA_M2_S2_2026-02-13.md` |
| T08 (M3.S2) | PASS | `docs/closure/EVIDENCIA_M3_S2_2026-02-13.md` |
| T09 (M6.S2) | PASS | `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`, `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`, `docs/closure/EVIDENCIA_M6_S2_2026-02-13.md` |
| T10 (M7) | PASS | `docs/closure/EVIDENCIA_M7_CIERRE_2026-02-13.md` |

Checkpoints:
- Removidos en limpieza documental D-109 (2026-02-15). Para trazabilidad, usar historial git.

## 5) Auditoría Pragmática y Remediación (2026-02-14)

Auditoría de pragmatismo real vs. aspiracional ejecutada con remediaciones completadas:

| Tarea | Estado | Detalle |
|---|---|---|
| P0a: Math.random() en métricas dashboard | COMPLETADO | `cron-dashboard/index.ts` — valores falsos eliminados, reemplazados por null |
| P0b: Coverage threshold alineado | COMPLETADO | `vitest.config.ts` — subido de 60% a 80% (alineado con CLAUDE.md) |
| P1a: Proveedores CRUD completo | COMPLETADO | Backend: `handlers/proveedores.ts` + rutas POST/PUT en index.ts. Frontend: `Proveedores.tsx` con modal crear/editar, mutations, toast |
| P1b: Reporte de ventas diario | COMPLETADO | Backend: filtros fecha en `handleListarVentas` (PostgREST gte/lte). Frontend: `Ventas.tsx` con presets Hoy/Semana/Mes, tabla, resumen, paginación |
| P3: Terminología CLAUDE.md | COMPLETADO | "Skills" → "Guías Operativas", "Workflows Autónomos" → "Workflows (guías de procedimiento)", "Reglas de Automatización" → "Reglas de Ejecución" |

Verificación al momento de la auditoría (2026-02-14): Build PASS (9.24s), 829/829 tests PASS. Nota: conteo previo a D-114/D-116 que elevaron a 1165/1165.

Archivos modificados/creados:
- `supabase/functions/api-minimarket/handlers/proveedores.ts` (nuevo)
- `supabase/functions/api-minimarket/handlers/ventas.ts` (filtros fecha)
- `supabase/functions/api-minimarket/index.ts` (rutas proveedores + params ventas)
- `minimarket-system/src/pages/Proveedores.tsx` (reescrito: CRUD completo)
- `minimarket-system/src/pages/Ventas.tsx` (nuevo: reporte ventas)
- `minimarket-system/src/App.tsx` (ruta /ventas)
- `minimarket-system/src/components/Layout.tsx` (nav item Ventas)
- `minimarket-system/src/lib/apiClient.ts` (proveedoresApi + ventasApi extendidos)
- `CLAUDE.md` (terminología honesta)

## 6) Pendientes Reales (Owner)
1. SendGrid/SMTP: **CERRADO** (rotacion + secrets + redeploy + smoke + evidencia externa).
   - Evidencia completa: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`
2. (Recomendado) Higiene post-rotacion: revocar la API key anterior en SendGrid (si aún está activa).
3. (Recomendado) Ejecutar smoke real de seguridad de forma periódica (`RUN_REAL_TESTS=true`) y registrar evidencia en `docs/closure/`.
4. Issues técnicos preexistentes no bloqueantes: ~~`Proveedores.test.tsx` requiere `QueryClientProvider`~~ CERRADO (D-117). ~~`lint-staged` fallaba por resolución de `eslint`~~ CERRADO (D-117). `Pedidos.test.tsx` mock de `sonner` corregido (D-117).

Referencia operativa:
- `docs/closure/OPEN_ISSUES.md`
- `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md`

## 7) Guardrails Operativos Vigentes
- No exponer secretos/JWTs.
- No usar comandos destructivos de git.
- `api-minimarket` debe mantenerse con `verify_jwt=false` en redeploy (`--no-verify-jwt`).

## 8) Sistema de Continuidad entre Sesiones

**Documento maestro de continuidad:** `docs/closure/CONTINUIDAD_SESIONES.md`

Este documento es el punto de entrada unico para cualquier sesion nueva (Claude Code, Copilot, u otro agente IA). Contiene:
- Plan activo con tareas pendientes priorizadas.
- Registro de sesiones recientes con pasos completados.
- Protocolo de inicio/cierre de sesion.
- Context prompt listo para copiar/pegar en nuevas ventanas IA.
- Inventario de CONTEXT_PROMPT disponibles para tareas especificas.

Context prompts disponibles en `docs/closure/CONTEXT_PROMPT_*.md` (los prompts ad-hoc de raíz fueron removidos en D-109).

## 9) Nota De Historial
El estado historico previo (incluyendo cronologia extensa 2026-01..2026-02) se preserva en:
- `docs/archive/README.md` (índice histórico; los snapshots legacy nominales fueron removidos en D-109 y quedan trazables en historial git).

Para decisiones actuales, esta hoja es la fuente de verdad de estado; el detalle histórico se consulta desde `docs/archive/README.md` y el historial git.

## 10) Auditoria Documental (DocuGuard)
- Verificacion intensiva de consistencia documental completada el 2026-02-13.
- Reporte: `docs/closure/AUDITORIA_DOCUMENTAL_ABSOLUTA_2026-02-13.md`.
- Segunda pasada intensiva ejecutada:
  - Simulacion de inicio/cierre de sesion de agentes (`SessionOps`) con evidencia en `.agent/sessions/current/*` (los `BASELINE_LOG_*.md` fueron removidos en D-109; ver historial git).
  - Ajuste de workflows de sesion (`.agent/workflows/session-start.md`, `.agent/workflows/session-end.md`) para alinearlos a fuentes canónicas actuales.
  - Clasificacion adicional de documentos activos vs historicos (marcadores `[ACTIVO_VERIFICADO: 2026-02-13]` y `[DEPRECADO: 2026-02-13]`).
- Resultado de verificación final:
  - Links markdown rotos: `0` (incluyendo `docs/closure/`).
  - Referencias de rutas inexistentes en backticks: 88 encontradas (D-113), anotadas con `[removido en D-109]` (D-122). Sin rutas opacas residuales.
  - Quality gates recheck: `PASS` (`test-reports/quality-gates_20260213-061657.log`).

## 11) Rigurosidad de Tests (Hardening 2026-02-13)
- Security tests reforzados para situaciones reales:
  - auth interna por `Authorization` y `apikey`,
  - rechazo de credenciales malformadas/rotadas,
  - CORS server-to-server sin `Origin`,
  - smoke real multi-endpoint opcional con `RUN_REAL_TESTS=true`,
  - smoke real SendGrid opcional con `RUN_REAL_SENDGRID_SMOKE=true` + `REAL_SMOKE_EMAIL_TO` (envia 1 email real via `cron-notifications/send`).
- Evidencia:
  - `tests/security/security.vitest.test.ts`
  - `test-reports/junit.auxiliary.xml`
  - `test-reports/quality-gates_20260213-061657.log`

## 12) Activacion Sentry (2026-02-14)
- `VITE_SENTRY_DSN` recibido y configurado en archivo local seguro (`minimarket-system/.env.production.local`, sin exponer valor).
- Smoke CLI reproducible (post-correccion DSN):
  - `node scripts/sentry-smoke-event.mjs --env production` -> `SENTRY_SMOKE_STATUS=200`
  - eventos generados: `20518ab02d85b19a9cbbac6f67600ab7`, `b8474593d35d95a9a752a87c67fe52e8`
- Verificacion externa (Comet):
  - `Issue URL`: `https://mini-market-2m.sentry.io/issues/7265042116/`
  - `Event ID`: `b8474593d35d95a9a752a87c67fe52e8`
  - `Environment`: `production`
  - Alerta: `Send a notification for high priority issues` (`Enabled`, filtro `environment=production`).
- Estado: **CERRADO** (ingest tecnico + evidencia visual/alerta confirmadas).
- Evidencia:
  - `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`
  - `test-reports/quality-gates_20260214-042354.log`
