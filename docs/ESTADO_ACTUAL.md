# ESTADO ACTUAL DEL PROYECTO

**Ultima actualizacion:** 2026-03-13 (nightly hardening de ops-smoke/migration-drift + select-star eliminado + auditoria exhaustiva)
**Veredicto general:** `LISTO PARA PRODUCCION`
**Fuente ejecutiva:** `docs/PRODUCTION_GATE_REPORT.md`

## 1) Resumen ejecutivo
- El sistema mantiene estado operativo estable con quality gates en verde y sin regresiones funcionales en endpoints criticos.
- **BUILD-FIX-001 cerrado**: se corrigieron 9 errores TypeScript en test/mocks (`supabaseMock.ts`, `Dashboard.test.tsx`, `Facturas.test.tsx`, `Pedidos.test.tsx`) que impedian `pnpm -C minimarket-system build`. Build restaurado a PASS sin regresiones en tests (257/257).
- **A11Y-001 cerrado**: se agregaron `aria-label` a 6 botones de solo icono en `GlobalSearch.tsx`, `Pocket.tsx`, `Asistente.tsx`, `Proveedores.tsx`. Catch vacio de `jsbarcode` ahora loguea en dev.
- **SCRIPTS-001 cerrado**: se corrigieron bugs en `verify_5steps.sh` (`echo "\n"` -> `printf`), `check-critical-deps-alignment.mjs` (try/catch para archivos faltantes), `metrics.mjs` (shebang + existsSync guards). Se actualizaron patterns de `verify_5steps.sh` para alinear con ESTADO_ACTUAL compactado.
- **CI-001 cerrado**: `nightly-gates.yml` lint-and-build ahora incluye component tests (257), corrige orden pnpm/action-setup para cache eficiente, y usa `pnpm exec eslint .` para evitar reinstalacion.
- Se cerro `PERF-001`: build frontend sin warnings residuales de chunking/PWA.
- El repo incorpora `nightly-gates` con smoke remoto de operacion en modo warning-only, artifact `ops-smoke-report`, validacion explicita de `SUPABASE_URL`/`VITE_SUPABASE_URL`, y summary con nombres faltantes o invalidos; `api-proveedor` mantiene `verify_jwt=true` y el contrato tecnico usa bearer tecnico + `x-api-secret`.
- Se formalizo el contrato de entorno backend en `docs/ENV_SECRET_CONTRACT.md` + `docs/ENV_SECRET_CONTRACT.json`.
- **LOG-001 cerrado**: los scripts operativos centralizan `warn/error` en `scripts/_shared/cli-log.mjs`; `scripts/` queda en `0` usos crudos de `console.warn/error`. Permanecen `6` ocurrencias intencionales en codigo productivo (`logger.ts`, `observability.ts`, `ErrorBoundary.tsx`, `GlobalSearch.tsx`) y `2` aserciones en tests del logger.
- Higiene de `docs/closure` revalidada: se archivaron artefactos historicos fuera de la raiz canonica, se regeneraron `LATEST_AUTOGEN_REPORTS.md` e `archive/INDEX.md`, y `node scripts/check-closure-root-policy.mjs` vuelve a `PASS`.
- **EXH-B-009 mitigado en repo**: Supabase CLI pineada a `2.75.0` en `nightly-gates.yml`; drift local (`2.72.7`) ya no afecta CI.
- `migration-drift` ahora deja artifact `migration-drift-report` y usa `SUPABASE_DB_URL` en CI, evitando resultados ambiguos y dejando evidencia remota reproducible.
- **EXH-B-011 cerrado**: densidad de `console.warn/error` en scripts baja a 0; fuera de `scripts/` quedan solo sinks intencionales documentados.
- **PRODUCTION_GATE_REPORT actualizado**: score 100/100 con evidencia del 2026-03-13.
- **`select('*')` eliminado en frontend hooks**: `useAlertas`, `useDeposito`, `useDashboardStats` migrados a columnas explicitas (2026-03-13). El backend conserva `36` ocurrencias productivas en `supabase/functions/`, fuera del scope de esa remediacion.
- Verificacion Supabase/GCP via Comet 2026-03-13: `SSL enforcement` activado y persistido en PostgreSQL; `Secure password change` activado; `Minimum password length` subido de `6` a `8`; billing GCP reactivado y proyecto OCR `gen-lang-client-0312126042` vinculado a la cuenta `0156DA-EB3EB0-9C9339`.
- Verificacion GitHub 2026-03-13: PR `#95` promovio a `main` el `nightly-gates.yml` endurecido (`41b34bf`). La corrida `Nightly Quality Gates` `23038842082` termino `success`, genero `ops-smoke-report` + `migration-drift-report`, y confirmo `SUPABASE_URL`/`VITE_SUPABASE_URL` correctos junto con `SUPABASE_ACCESS_TOKEN` presente.
- Permanecen pendientes externos ya conocidos: `OCR-007` (pendiente revalidacion runtime), `AUTH-001`, `AUTH-002`, `DB-001` (solo allowlist).

## 2) Evidencia tecnica verificada (baseline 2026-03-13)
### Quality gates
- Unit tests (root): `1959/1959 PASS`
- Integration tests: `68/68 PASS`
- E2E smoke: `4/4 PASS`
- Component tests frontend: `257/257 PASS`
- Lint frontend: `0 errors, 0 warnings`
- Build frontend: `PASS`
- Doc links: `PASS`
- Closure policy check: `PASS`
- Nightly ops smoke remoto: vigente en `main`, con artifact `ops-smoke-report` en la corrida `23038842082`; checks criticos `api-minimarket/health=200` y `api-proveedor/health=200`.
- Migration drift nightly: vigente en `main`, usa `SUPABASE_DB_URL`, deja `migration-drift-report` y la corrida `23038842082` confirma `Remote database is up to date.`
- Env contract gate (`prod`): `PASS` sin faltantes `required` en Supabase secrets
- Logging operativo: `0` usos crudos de `console.warn/error` en `scripts/`; `6` ocurrencias intencionales en codigo productivo + `2` aserciones en tests

### Build y performance (frontend)
- Bundle con split por dominios pesados (`scanner`, `charts`, `supabase`, `react-core`, etc.) y sin warning circular.
- `scanner` queda bajo umbral de warning configurado por build.
- Paso PWA/Workbox sin warning `Unknown input options: manualChunks`.

### Runtime local vs remoto
- Paridad validada para endpoint critico de salud:
  - `GET /api-minimarket/health` responde `200` local y remoto.
- `api-minimarket` mantiene politica operativa requerida: `verify_jwt=false` en despliegue.

## 3) Estado funcional por dominio
### Core gateway / inventario / pedidos
- Endpoints principales operativos y cubiertos por tests.
- `PUT /pedidos/:id/estado` conserva lock optimista y respuesta `409 CONFLICT` en carrera.

### OCR de facturas
- Backlog tecnico OCR cerrado (10/10), flujo y hardenings implementados en codigo.
- `OCR-007` queda desbloqueado en capa GCP tras reactivar billing y vincular el proyecto OCR canonico; la corrida segura `23039129015` mostro que hoy no existe factura en `estado=error` con imagen para reintento automatico, asi que el cierre requiere `factura_id` explicita o una prueba controlada.

### Asistente IA
- Sprint 3 implementado y operativo: 7 intents read + 4 intents write con plan→confirm y auditoria persistente.

## 4) Pendientes abiertos (seguimiento vigente)
### Bloqueante externo
- `OCR-007` (CRITICO): billing GCP ya fue reactivado, pero falta una revalidacion runtime controlada de `facturas-ocr`/Cloud Vision para cerrar el incidente.
- `EXH-B-003` deja de ser un hueco de monitoreo: la corrida remota `23038842082` cubre `cron-health-monitor/health-check`, aunque el endpoint devuelve `401` no critico y mantiene el smoke en warning-only.

### Hardening externo no bloqueante
- `AUTH-001`: CAPTCHA de Auth pendiente en Supabase.
- `AUTH-002`: timeouts server-side nativos no disponibles en plan actual (mitigado client-side).
- `DB-001`: `SSL enforcement` cerrado; network restrictions de PostgreSQL siguen pendientes de allowlist.

### Deuda documental
- `DOCS-CTX-001`: **cerrado**. Las docs canónicas del budget quedan por debajo del target (`npm run docs:context-budget` => `ok=9 warn=0 fail=0`).

## 5) Context engineering y gobernanza documental
- Entrada de sesion recomendada: `docs/CONTEXT0_EJECUTIVO.md`.
- Budget objetivo por doc canonico: `<=2000` palabras (`CONTEXT0`: 600-1000).
- Exclusiones por defecto de contexto: `node_modules/`, `logs/`, `test-reports/`, `supabase/.temp/`, `docs/closure/archive/historical/`.
- Script de control: `npm run docs:context-budget`.
- Gate de entorno recomendado antes de deploy/auditoria manual: `npm run ops:env-contract`.

## 6) Fuentes canonicas vigentes
1. `docs/CONTEXT0_EJECUTIVO.md`
2. `docs/ESTADO_ACTUAL.md`
3. `docs/DECISION_LOG.md`
4. `docs/closure/OPEN_ISSUES.md`
5. `docs/API_README.md`
6. `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`
7. `docs/PRODUCTION_GATE_REPORT.md`
8. `docs/api-openapi-3.1.yaml`

## 7) Guardrails activos
1. No imprimir secretos/JWTs (solo nombres de variables).
2. No usar git destructivo (`reset --hard`, `checkout -- <file>`, force-push).
3. Si se redeploya `api-minimarket`, mantener `--no-verify-jwt`.
4. No cerrar issues sin evidencia tecnica verificable.

## 8) Nota de continuidad
El sistema se mantiene en `LISTO PARA PRODUCCION` con evidencia reciente y reproducible en local y en GitHub Actions. La operacion diaria no esta bloqueada salvo la revalidacion controlada del OCR (`OCR-007`) y el warning no critico pendiente sobre `cron-health-monitor/health-check`.
