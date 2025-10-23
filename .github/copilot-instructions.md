# Copilot instructions for aidrive_genspark_forensic

Use these repo-specific hints to be productive and avoid common traps.

## Architecture overview
- Core domain in `inventario-retail/` (agente_deposito, agente_negocio, ml) and a FastAPI Dashboard in `inventario-retail/web_dashboard/`.
- Optimization toolkit in `app/retail/` and `shared/`; tests in `tests/retail/`.
- Infra: `inventario-retail/docker-compose.production.yml`, NGINX in `inventario-retail/nginx/nginx.conf`, Dockerfiles per agent.
- CI/CD: `.github/workflows/ci.yml` focuses on Dashboard: tests+coverage (≥85%), build/push GHCR, smoke, deploy staging on master, prod on tags.

## Conventions and gotchas
- Hyphenated folder `inventario-retail/`: do NOT import as a Python package. Use path-based coverage/imports.
- Dashboard auth: `/api/*` and `/metrics` require header `X-API-Key`. Rate limit toggled by `DASHBOARD_RATELIMIT_ENABLED`.
- Security headers: strict CSP snapshot tested; HSTS enabled only if `DASHBOARD_ENABLE_HSTS=true` and `DASHBOARD_FORCE_HTTPS=true`.
- Metrics: plaintext exposition with `dashboard_requests_total`, `dashboard_errors_total`, `dashboard_request_duration_ms_p95`.
- Structured JSON logging with `request_id`; preserve it in new handlers.
- "DONES" FLEXIBILIZADOS (ver DONES_FLEXIBILIZADOS_PRODUCCION.md): Cambios permitidos si acercan a producción (framework 5 preguntas). Mantener tests >85%, no breaking changes, documentar decisiones. OBJETIVO FIRME: GO-LIVE en 2-3 semanas.

## Local dev quickstart (Dashboard)
- Install deps: `pip install -r inventario-retail/web_dashboard/requirements.txt`
- Run tests: `pytest -q tests/web_dashboard`
- Coverage (path-based): `pytest --cov=inventario-retail/web_dashboard --cov-fail-under=85`
- Container run: `docker run -p 8080:8080 -e DASHBOARD_API_KEY=dev ghcr.io/<owner>/<repo>:latest`

## What CI expects
- Tests independent of external services; avoid importing `inventario-retail` as a module.
- New endpoints: include tests for 401 (no API key) and 200/500 (with API key), plus a metrics assertion.
- Keep coverage ≥85% for Dashboard paths; deep DB error branches are intentionally out-of-scope now.

## Deployment flows
- Staging secrets required: `STAGING_HOST`, `STAGING_USER`, `STAGING_KEY`, `STAGING_GHCR_TOKEN`, `STAGING_DASHBOARD_API_KEY`.
- Prod deploy triggered by tags `vX.Y.Z`; compose pulls `ghcr.io/${{ github.repository }}:<tag>`.
- Ops scripts: `scripts/preflight_rc.sh` (smoke+metrics+headers), `scripts/check_metrics_dashboard.sh`, `scripts/check_security_headers.sh`.
- Makefile shortcuts: `make preflight STAGING_URL=... STAGING_DASHBOARD_API_KEY=...`; `make rc-tag TAG=v1.0.0-rc1 ...`.

## Patterns to copy (Dashboard)
- File `inventario-retail/web_dashboard/dashboard_app.py`:
  - Security headers middleware + CSP builder.
  - API key guard for `/api/*` and `/metrics`.
  - Metrics builder emitting HELP/TYPE and counters.
- When adding a route: protect with API key, increment metrics, log with `request_id`, add tests (401/200) and update metrics tests.

## References
- Guides: `README_DEPLOY_STAGING.md`, `README_DEPLOY_STAGING_EXT.md`, `inventario-retail/DEPLOYMENT_GUIDE.md`.
- Runbook: `RUNBOOK_OPERACIONES_DASHBOARD.md`; Changelog: `CHANGELOG.md`.