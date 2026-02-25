# AUDIT_F4_INTEGRATIONS_2026-02-25

## Objetivo
Detectar drift técnico entre dependencias, migraciones, entornos e integraciones externas críticas.

## Comandos ejecutados
```bash
node scripts/check-supabase-js-alignment.mjs
node scripts/check-critical-deps-alignment.mjs
node scripts/validate-doc-links.mjs
node scripts/metrics.mjs --check
npm audit --omit=dev --audit-level=high
pnpm -C minimarket-system audit --prod --audit-level=high
pnpm -C minimarket-system why react-router-dom
pnpm -C minimarket-system why vite-plugin-pwa
supabase migration list --linked
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json
supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi
python3 .agent/scripts/env_audit.py --with-supabase --project-ref dqaygmjpzoqjjrywdsxi
```

## Salida relevante
- Alineación `@supabase/supabase-js`: PASS (`2.95.3` en root/frontend/edge).
- Governance crítico: PASS.
- Doc links + metrics check: PASS.
- Migraciones: `52/52` sincronizadas local/remoto.
- Seguridad dependencias:
  - `npm audit --omit=dev --audit-level=high`: PASS (`0 vulnerabilities`).
  - `pnpm -C minimarket-system audit --prod --audit-level=high`: FAIL (`5 vulnerabilities`, `3 high`, `2 moderate`).
  - High concretos:
    - `react-router-dom@6.30.2` -> `@remix-run/router@1.23.1` (advisory GHSA-2w69-qvjg-hvjx).
    - `vite-plugin-pwa@1.2.0` -> `workbox/glob` -> `minimatch@10.1.2` y cadena `filelist` -> `minimatch@5.1.6` (GHSA-3ppc-4f35-3m26).
- Env audit (names-only):
  - Missing en `.env.example`: `GCV_API_KEY`.
  - Missing en secretos remotos (subset backend): `API_PROVEEDOR_READ_MODE`, `SCRAPER_READ_MODE`, `REQUIRE_ORIGIN`, `WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_*`, etc.
- OCR readiness names-only:
  - `GCV_API_KEY` presente en secretos remotos.

## Conclusión F4
Sin drift crítico de migraciones ni de `supabase-js`. Persisten hallazgos `ALTO` por vulnerabilidades productivas frontend y hallazgos de entorno/documentación por variables no alineadas.

## Hallazgos F4
| ID | Severidad | Archivo:Linea | Hallazgo | Acción |
|---|---|---|---|---|
| A-001 | ALTO | `minimarket-system/package.json:102` | Cadena `react-router-dom` en runtime productivo con advisory XSS/open-redirect vía `@remix-run/router@1.23.1` | Actualizar `react-router-dom`/`react-router` a versión con `@remix-run/router >=1.23.2` y re-ejecutar audit prod |
| A-002 | ALTO | `minimarket-system/package.json:108` | Cadena `vite-plugin-pwa/workbox` arrastra `minimatch` vulnerable (`10.1.2` y `5.1.6`) | Actualizar `vite-plugin-pwa`/workbox y validar `minimatch >=10.2.1` y `>=5.1.7` |
| A-004 | MEDIO | `.env.example:22` | Template de env no declara `GCV_API_KEY` pese a requerimiento OCR runtime | Agregar `GCV_API_KEY=` (solo nombre) en `.env.example` y documentar alcance |
| A-011 | BAJO | `supabase/functions/api-proveedor/index.ts:183` | Variables backend usadas por código no están homogéneamente declaradas como secrets remotos | Definir matriz requerida/opcional por entorno y cerrar gaps names-only |
