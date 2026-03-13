# MISIÓN: INVENTARIO COMPLETO DE RECURSOS DEL PROYECTO

- Fecha (UTC): `2026-03-13 03:59:10`
- Repo: `.`
- Baseline log (safe): `docs/closure/BASELINE_LOG_2026-03-13_035556.md`

## 1. RECURSOS DEL PROYECTO

### A. Archivos y Assets

- Tamaño por carpeta (aprox):

| Size | Path |
|---:|---|
| 796K | `.agent` |
| 1.3M | `docs` |
| 1.6M | `supabase` |
| 1.1M | `tests` |
| 308K | `scripts` |
| 418M | `minimarket-system` |

- Assets detectados (best-effort): `1` (top 20 por tamaño)

| Bytes | Asset |
|---:|---|
| 263 | `minimarket-system/public/favicon.svg` |

### B. Configuraciones

- `.env.example` existe y documenta variables base (sin valores reales).
- CI: `.github/workflows/ci.yml`
- Deploy: `deploy.sh` + `docs/DEPLOYMENT_GUIDE.md`
- Rollback: `docs/ROLLBACK_SQL_TEMPLATE.md` + archivos en `docs/`

## 2. CONTEXTO DE NEGOCIO (inferido)

- Propósito: sistema de gestión para mini markets (inventario/ventas/reportes) (ver `README.md` + `docs/ESTADO_ACTUAL.md`).
- Usuarios/roles: admin, ventas, depósito (ver `docs/ESTADO_ACTUAL.md` / frontend).

## 3. INTEGRACIONES Y SERVICIOS EXTERNOS (signals)

- Slack (webhook)
- Twilio

## 4. HISTORIAL Y DECISIONES TÉCNICAS

- Ver `docs/DECISION_LOG.md` (fuente de decisiones).
- Ver `docs/ARCHITECTURE_DOCUMENTATION.md` (arquitectura).

## 5. CHECKLIST PRE-PRODUCCIÓN (resumen)

- [ ] Variables de entorno configurables (ver env audit)
- [ ] Manejo de errores robusto (ver `observability.ts` / planes Sentry)
- [ ] Logging implementado (backend `_shared/logger.ts`)
- [ ] Tests críticos pasando (ver quality gates logs)
- [ ] Sin credenciales hardcodeadas (ver scan JWT filenames)
- [ ] HTTPS/CORS configurado (ver `ALLOWED_ORIGINS` / guardrails)
- [ ] Rate limiting (ver migraciones 20260208020000 + `rate_limit_state`)
- [ ] Backup/rollback strategy (docs + templates)
- [ ] Monitoring/alerting (planes: Sentry, health checks, cron monitoring)

## 6. ESTIMACIÓN DE TRABAJO RESTANTE (alto nivel)

- Bloqueantes típicos (según docs):
  - SendGrid sender verification (requiere dashboard)
  - Secret rotation (coordinación + evidencia)
  - Sentry (solo con DSN real)
- Importantes no bloqueantes:
  - Dependabot PRs (1 PR a la vez) con gates
  - Perf baseline + reporte

## Appendix: Env Audit (names only)

```bash
.agent/scripts/env_audit.py --format markdown --with-supabase --supabase-scope backend-only
```

```text
# Env Audit (names only)

- Scan roots: supabase/functions, minimarket-system/src, scripts
- Env example: `.env.example`
- Env contract: `docs/ENV_SECRET_CONTRACT.json` (target `prod`)
- Supabase secrets: enabled (project_ref `dqaygmjpzoqjjrywdsxi`)
- Supabase compare scope: `backend-only`

## Used In Code But Missing In .env.example

(none)

## Present In .env.example But Not Used In Code

- `ACCESS_TOKEN`
- `DB_PASSWORD`
- `OPS_SMOKE_API_PROVEEDOR_AUTHORIZATION`
- `OPS_SMOKE_API_PROVEEDOR_SECRET`
- `OPS_SMOKE_AUTHORIZATION`
- `OPS_SMOKE_RETRIES`
- `OPS_SMOKE_RETRY_DELAY_MS`
- `OPS_SMOKE_SERVICE_ROLE_KEY`
- `OPS_SMOKE_TIMEOUT_MS`
- `PROJECT_ID`

## Used In Code But Missing In Supabase Secrets (raw names)

- `API_PROVEEDOR_READ_MODE`
- `EMAIL_FROM`
- `ENVIRONMENT`
- `INTERNAL_ORIGINS_ALLOWLIST`
- `LOG_LEVEL`
- `OCR_MIN_SCORE_APPLY`
- `REQUIRE_ORIGIN`
- `SCRAPER_READ_MODE`
- `SLACK_WEBHOOK_URL`
- `TEST_ENVIRONMENT`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `WEBHOOK_URL`

## Missing Required In Supabase Secrets (prod)

(none)

## Missing Optional In Supabase Secrets (prod)

- `API_PROVEEDOR_READ_MODE`
- `EMAIL_FROM`
- `ENVIRONMENT`
- `INTERNAL_ORIGINS_ALLOWLIST`
- `LOG_LEVEL`
- `OCR_MIN_SCORE_APPLY`
- `REQUIRE_ORIGIN`
- `SCRAPER_READ_MODE`
- `SLACK_WEBHOOK_URL`
- `TEST_ENVIRONMENT`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `WEBHOOK_URL`

## Missing In Supabase Secrets Without Contract Classification (prod)

(none)

## Notes

- This report never prints values. Review each missing variable and decide whether it belongs in `.env.example` or Supabase secrets.
- Optional contract entries cover feature-gated or fallback-backed vars; only `--check-required-supabase` should fail the gate.
```
