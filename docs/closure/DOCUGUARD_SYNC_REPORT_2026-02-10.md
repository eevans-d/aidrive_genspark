# DocuGuard Sync Report (2026-02-10)

**Objetivo:** dejar la documentación alineada con el estado real del repositorio y reducir drift futuro.

## Contexto

- **Branch de trabajo:** `chore/docuguard-sync-20260210`
- **PR:** #65 (`docs: sync documentation with repo reality (DocuGuard)`)
- **Fuente de verdad de estado:** `docs/ESTADO_ACTUAL.md`
- **Fuente única de conteos:** `docs/METRICS.md` (generado por `scripts/metrics.mjs`)

## Guardrails ejecutados (sin secretos)

- Scan de patrones prohibidos en `supabase/functions/*.ts`:
  - `console.log` (debe ser 0)
  - JWT-like tokens (solo detectar patrones, no imprimir valores)

## Cambios aplicados (resumen por área)

### 1) Métricas verificables

- Se reforzó `scripts/metrics.mjs` como fuente única de conteos.
- Se regeneró `docs/METRICS.md` para reflejar el estado actual.

### 2) Documentación fuente-de-verdad

- Se eliminaron/evitaron conteos hardcodeados en docs clave, reemplazándolos por referencias a `docs/METRICS.md`.
- Se alineó el **plan vigente** a `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md` (y `HOJA_RUTA_MADRE` queda histórico).
- Se corrigieron referencias rotas creando los archivos faltantes que estaban citados.

### 3) Cron jobs (operación)

- Se alinearon URLs/configs de cron templates al project ref actual (`dqaygmjpzoqjjrywdsxi`).
- Se agregó `supabase/cron_jobs/deploy_all_cron_jobs.sql` como SQL combinado para ejecución en Dashboard/SQL Editor.
- Se corrigió `supabase/cron_jobs/deploy_master.sh` para usar paths repo-relativos (sin `/workspace`) y para soportar `DATABASE_URL` si se ejecuta con `psql`.
- Se agregó documentación operativa: `docs/CRON_JOBS_COMPLETOS.md`.

### 4) Hygiene / CI

- Se agregó `scripts/validate-doc-links.mjs` y un step de CI para detectar links internos rotos en markdown.
- Se corrigió `.gitignore` para no ocultar artefactos necesarios (por ejemplo scripts `.sql` operativos y archivos en `docs/archive/` cuando son referenciados por docs).

## Archivos creados (principales)

- `docs/OBJETIVOS_Y_KPIS.md`
- `docs/C0_RISK_REGISTER_MINIMARKET_TEC.md`
- `docs/C0_STAKEHOLDERS_MINIMARKET_TEC.md`
- `docs/C0_COMMUNICATION_PLAN_MINIMARKET_TEC.md`
- `docs/CRON_JOBS_COMPLETOS.md`
- `docs/archive/ROADMAP.md` (archivado; compatibilidad de referencias)
- `docs/archive/ROLLBACK_DRILL_STAGING.md` (archivado; compatibilidad de referencias)
- `scripts/rls_audit.sql`
- `scripts/validate-doc-links.mjs`
- `supabase/cron_jobs/deploy_all_cron_jobs.sql`

## Verificación

- `node scripts/validate-doc-links.mjs` -> OK
- `npm run test:unit` -> PASS (ver `docs/METRICS.md` para conteos actuales y `test-reports/junit.xml` para evidencia)
- CI en PR: `Lint`, `Type Check`, `Unit Tests`, `Build`, `Edge Functions Syntax Check` -> PASS (Integration/E2E quedan gated por secretos)

