# CONTEXT0 EJECUTIVO (Entrada Unica de Sesion)

**Fecha de corte:** 2026-03-12 (UTC)  
**Objetivo:** proveer el minimo contexto operativo para que un agente arranque rapido, sin cargar historicos innecesarios ni perder trazabilidad.

## 1) Estado operativo real
- El sistema sigue en condicion `LISTO PARA PRODUCCION` con hardening tecnico ya aplicado en capas criticas.
- Revalidacion completa de quality gates ejecutada en esta fecha:
  - `npm run test:unit` -> **1959/1959 PASS**
  - `npm run test:integration` -> **68/68 PASS**
  - `npm run test:e2e` -> **4/4 PASS**
  - `pnpm -C minimarket-system test:components` -> **257/257 PASS**
  - `pnpm -C minimarket-system lint` -> **0 errores / 72 warnings**
  - `pnpm -C minimarket-system build` -> **PASS**
  - `node scripts/validate-doc-links.mjs` -> **PASS**
  - `node scripts/check-closure-root-policy.mjs` -> **PASS**
- Hallazgo residual de build: persiste el warning `Unknown input options: manualChunks` durante el paso PWA/Workbox (`PERF-001`, no bloqueante).

## 2) Lo que cambio hoy y por que importa
- **Chunking frontend ajustado** en `minimarket-system/vite.config.ts`:
  - Se refino `manualChunks` para dejar de capturar paquetes por coincidencia amplia (`id.includes("react")`) y separar bloques por dominio real (`react-core`, `router`, `query`, `charts`, `scanner`, etc.).
  - Resultado: desaparece el warning de chunk > 500k en `react`; `react-core` queda ~143 kB (antes ~549 kB).
  - Deuda vigente: warning de Workbox/PWA sobre `manualChunks` aun presente.
- **Harness E2E endurecido** en `scripts/run-e2e-tests.sh`:
  - Si el runtime local arranca con `API_PROVEEDOR_SECRET` stale, el script detecta el 401 especifico y autorrecupera (`supabase stop/start`) antes de ejecutar pruebas.
  - Se agrega resolucion de bearer para el probe (usa `E2E_BEARER_TOKEN`, o JWT HS256 con `SUPABASE_JWT_SECRET`, o fallback a service role).
  - Resultado: evita falsos negativos intermitentes del smoke E2E.
- **Env audit mejorado** en `.agent/scripts/env_audit.py`:
  - Ahora detecta `VITE_*` accedidas por alias (`const env = import.meta.env`) y destructuring.
  - Corrige falso negativo documental para `VITE_AUTH_TIMEBOX_MS` y `VITE_AUTH_INACTIVITY_TIMEOUT_MS`.
- **Paridad local/remoto de health**:
  - Se alinea `supabase/config.toml` con `[functions.api-minimarket] verify_jwt=false` para que el comportamiento local sea consistente con la politica de deploy del proyecto.

## 3) Bloqueantes y riesgos que siguen abiertos
- `OCR-007` (CRITICO): OCR bloqueado por billing inactivo en GCP (externo al repo).
- `AUTH-001`, `AUTH-002`, `DB-001`: hardening externo pendiente (no bloqueante para operacion actual).
- `PERF-001`: warning residual en PWA/Workbox; performance general estable, pero existe ruido tecnico en build.
- Riesgo de contexto: los docs canonicos historicamente crecieron por encima del target ideal de lectura por sesion.

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
- Excepcion temporal: algunos docs troncales superan ese target por deuda historica; se controlan con hard cap y plan de poda incremental.
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
