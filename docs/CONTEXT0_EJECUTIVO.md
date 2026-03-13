# CONTEXT0 EJECUTIVO (Entrada Unica de Sesion)

**Fecha de corte:** 2026-03-13 (UTC)
**Objetivo:** proveer el minimo contexto operativo para que un agente arranque rapido, sin cargar historicos innecesarios ni perder trazabilidad.

## 1) Estado operativo real
- El sistema sigue en condicion `LISTO PARA PRODUCCION` con hardening tecnico ya aplicado en capas criticas.
- Revalidacion completa de quality gates ejecutada en esta fecha:
  - `npm run test:unit` -> **1959/1959 PASS**
  - `npm run test:integration` -> **68/68 PASS**
  - `npm run test:e2e` -> **4/4 PASS**
  - `pnpm -C minimarket-system test:components` -> **257/257 PASS**
  - `pnpm -C minimarket-system lint` -> **0 errores / 0 warnings**
  - `pnpm -C minimarket-system build` -> **PASS**
  - `node scripts/validate-doc-links.mjs` -> **PASS**
  - `node scripts/check-closure-root-policy.mjs` -> **PASS**
- Build frontend sin warning residual de PWA/Workbox: `PERF-001` queda cerrado.

## 2) Lo que cambio en esta corrida y por que importa
- **LOG-001 cerrado**: logging de `scripts/` centralizado en `scripts/_shared/cli-log.mjs`. `scripts/` queda en `0` usos crudos de `console.warn/error`; en codigo productivo permanecen `6` sinks intencionales (`logger.ts`, `observability.ts`, `ErrorBoundary.tsx`, `GlobalSearch.tsx`) y `2` aserciones en tests del logger.
- **Higiene de `docs/closure`**: artefactos historicos archivados, policy de raiz restaurada, `.gitignore` corregido para mantener trazabilidad de archivado sin destapar todo el historico.
- **`select('*')` eliminado en frontend hooks**: `useAlertas`, `useDeposito`, `useDashboardStats` migrados a columnas explicitas. El frontend runtime queda sin `select('*')`, pero el backend conserva `36` ocurrencias productivas concentradas en Edge Functions y queries REST; quedan como deuda de optimizacion no bloqueante.
- **PRODUCTION_GATE_REPORT actualizado**: score 100/100 con 1959 unit tests, 257 component tests, 0 warnings lint, 0 vulnerabilidades.
- **Supabase CLI pineada en CI**: `nightly-gates.yml` usa `SUPABASE_CLI_VERSION: 2.75.0` en vez de `latest` para reproducibilidad.
- **ops-smoke migrado a cli-log**: script de smoke operativo usa `scripts/_shared/cli-log.mjs` (log, logInfo) en vez de console.log.
- **Nightly remoto ya promovido a `main`**: PR `#95` (`41b34bf`) promovio `ops-smoke` + `migration-drift` endurecidos. La corrida `Nightly Quality Gates` `23038842082` dejo `ops-smoke-report` y `migration-drift-report` en GitHub Actions.
- **Hardening externo confirmado via Comet (2026-03-13)**: Supabase activo con `SSL enforcement` en conexiones entrantes, `Secure password change` en `ON` y `Minimum password length=8`; GCP billing reactivado y vinculado al proyecto OCR canonico.
- **OCR runtime recheck seguro ejecutado**: la corrida temporal `OCR Runtime Recheck` `23039129015` no encontro ninguna factura actual en `estado=error` con `imagen_url`, por lo que la revalidacion final de `OCR-007` requiere `factura_id` explicita o una factura de prueba controlada.

## 3) Bloqueantes y riesgos que siguen abiertos
- `OCR-007` (CRITICO): billing GCP ya fue reactivado, pero no existe hoy un candidato seguro en `estado=error` para revalidar OCR automaticamente; el cierre requiere `factura_id` explicita o una prueba controlada.
- `AUTH-001`: CAPTCHA sigue pendiente por falta de `SECRET_KEY` + `SITE_KEY` del proveedor elegido.
- `AUTH-002`: timeouts server-side siguen bloqueados por plan; mitigacion client-side vigente.
- `DB-001`: `SSL enforcement` ya queda cerrado; la allowlist de `network restrictions` sigue pendiente por inventario de IPs.
- `PERF-001`: cerrado.
- `LOG-001`: cerrado.
- `EXH-B-001/002`: cerrados en remoto con la corrida `Nightly Quality Gates` `23038842082` (`api-minimarket/health=200`, `api-proveedor/health=200`, artifacts archivados en `main`).
- `EXH-B-003`: ya no es un punto ciego; `ops-smoke` cubre `cron-health-monitor/health-check`, pero la corrida remota vigente devuelve `401` no critico y mantiene el gate en warning-only.
- `EXH-B-009`: mitigado en repo y efectivo en `main` (`SUPABASE_CLI_VERSION: 2.75.0` + `migration-drift-report` con `Remote database is up to date.`).
- Riesgo de contexto: mitigado. El budget canonico converge a `ok=9 warn=0 fail=0`.

## 4) Carga de contexto recomendada (orden obligatorio)
1. `docs/CONTEXT0_EJECUTIVO.md` (este archivo)
2. `docs/ESTADO_ACTUAL.md` (fuente ejecutiva extendida)
3. `docs/DECISION_LOG.md` (decisiones vigentes D-xxx)
4. `docs/closure/OPEN_ISSUES.md` (backlog vivo y severidades)
5. Solo si la tarea lo exige:
   - `docs/API_README.md`
   - `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
   - `docs/PLAN_FUSIONADO_FACTURAS_OCR.md`
   - `docs/PLAN_ASISTENTE_IA_DASHBOARD.md`

No cargar por defecto:
- `docs/closure/archive/historical/`
- `node_modules/`, `minimarket-system/node_modules/`
- `logs/`, `test-reports/`, `supabase/.temp/`

## 5) Budget de contexto (regla operativa)
- Target general por doc canonico: **<= 2000 palabras**.
- Estado actual: `ok=9 warn=0 fail=0` tras poda incremental canonica y archivado de detalle largo en `docs/closure/archive/historical/`.
- Chequeo automatizado disponible:
  - `node scripts/check-context-budget.mjs`
  - `node scripts/check-context-budget.mjs --strict` (falla si hay docs sobre target)

## 6) Comandos de arranque rapido recomendados
- Baseline y sincronizacion:
  - `git fetch origin`
  - `git pull --rebase origin main`
  - `git status --short --branch`
- Snapshot tecnico compacto:
  - `.agent/scripts/p0.sh extract --with-gates --with-supabase`
- Control de budget documental:
  - `npm run docs:context-budget`

## 7) Criterio de cierre de sesion (DoD operativo)
- Gates tecnicos en PASS o excepcion explicitamente justificada.
- Sin regresion en endpoints criticos (`api-minimarket`, `api-proveedor`).
- Docs canonicas sincronizadas con evidencia nueva (sin duplicar historicos).
- Repo limpio sin artefactos no versionables antes de commit final.

## 8) Referencias inmediatas
- Estado global: `docs/ESTADO_ACTUAL.md`
- Decisiones vigentes: `docs/DECISION_LOG.md`
- Issues abiertos/cerrados: `docs/closure/OPEN_ISSUES.md`
- Contratos API: `docs/API_README.md` y `docs/api-openapi-3.1.yaml`
- Gate report vigente: `docs/PRODUCTION_GATE_REPORT.md`
