# AUDIT_F4_INTEGRATIONS_2026-02-24

## Objetivo
Detectar drift entre dependencias, entorno, migraciones e integraciones externas críticas.

## Comandos ejecutados
```bash
node scripts/check-supabase-js-alignment.mjs
node scripts/check-critical-deps-alignment.mjs
supabase migration list --linked
npm audit --omit=dev --audit-level=high
pnpm -C minimarket-system audit --prod --audit-level=high
python3 .agent/scripts/env_audit.py --with-supabase --project-ref dqaygmjpzoqjjrywdsxi --supabase-scope backend-only
supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[] | "\(.name)\tv\(.version)\tverify_jwt=\(.verify_jwt)"' | sort
supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json | jq -r '.[].name' | sort
```

## Salida relevante
- Alineación `@supabase/supabase-js`: PASS (`2.95.3` en root/frontend/deno/import_map).
- Guard crítico de dependencias: PASS.
- Migraciones: `52/52` local/remoto.
- `npm audit --omit=dev`: `found 0 vulnerabilities`.
- `pnpm -C minimarket-system audit --prod`: `5 vulnerabilities (3 high, 2 moderate)`.
  - `@remix-run/router <=1.23.1` (vía `react-router-dom@6.30.2`).
  - `minimatch <10.2.1` (cadena `vite-plugin-pwa/workbox`).
- Env audit (names-only):
  - Missing en `.env.example`: `GCV_API_KEY`.
  - Missing en secretos remotos (backend scope): `API_PROVEEDOR_READ_MODE`, `EMAIL_FROM`, `ENVIRONMENT`, `INTERNAL_ORIGINS_ALLOWLIST`, `LOG_LEVEL`, `REQUIRE_ORIGIN`, `SCRAPER_READ_MODE`, `SLACK_WEBHOOK_URL`, `TEST_ENVIRONMENT`, `TWILIO_*`, `WEBHOOK_URL`.
- Integración OCR: secreto `GCV_API_KEY` presente en remoto (names-only).

## Conclusión F4
No hay drift crítico de migraciones ni de `supabase-js`. Sí hay riesgo de seguridad por dependencias productivas vulnerables y drift de variables de entorno/documentación.

## Hallazgos F4
| ID | Severidad | Archivo:Linea | Hallazgo | Acción |
|---|---|---|---|---|
| A-001 | ALTO | `minimarket-system/package.json:102` | `react-router-dom` arrastra `@remix-run/router` vulnerable en audit prod | Actualizar `react-router-dom` y validar resolución de advisory GHSA-2w69-qvjg-hvjx |
| A-002 | ALTO | `minimarket-system/package.json:108` | Cadena `vite-plugin-pwa/workbox` arrastra `minimatch` vulnerable | Actualizar `vite-plugin-pwa`/workbox y revalidar audit prod |
| A-003 | MEDIO | `.env.example:22` | Falta `GCV_API_KEY` en template, aunque OCR lo exige en runtime | Agregar `GCV_API_KEY=` en `.env.example` (nombre solamente) |
| A-004 | MEDIO | `supabase/functions/api-proveedor/index.ts:183` | Variables backend usadas no están en secretos remotos (subset) | Definir variables mínimas remotas o documentar defaults por función |
