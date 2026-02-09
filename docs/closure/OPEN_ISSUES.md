# Open Issues (Pre-cierre)

**Última actualización:** 2026-02-09 (sesion 2)
**Fuente:** `docs/ESTADO_ACTUAL.md`

| Pendiente | Severidad | Evidencia | Plan | Responsable |
|-----------|-----------|-----------|------|-------------|
| Habilitar leaked password protection (Auth) requiere plan Pro | P0 | `docs/ESTADO_ACTUAL.md` | SMTP ya configurado; LPP **no disponible** en Free (COMET reporta que requiere plan Pro). **Decisión: diferir hasta producción.** | PENDIENTE |
| Verificar sender real en SendGrid (From Email SMTP Auth) | P1 | `docs/SENDGRID_VERIFICATION.md` | Fix de codigo aplicado (PR #53) y redeployado (cron-notifications v12). Falta verificacion de sender en SendGrid Dashboard. | PARCIAL 2026-02-09 (fix + redeploy; pendiente sender verification en Dashboard) |
| Rotación de secretos pre-producción (si hubo exposición) | P1 | `docs/SECRET_ROTATION_PLAN.md` | Plan documentado con procedimientos. Requiere ejecucion manual por owner. | PENDIENTE (plan listo) |
| Sentry: integracion de observabilidad frontend | P2 | `docs/SENTRY_INTEGRATION_PLAN.md` | BLOQUEADO: sin DSN real. Infraestructura preparada (`observability.ts` con placeholder). NO instalar sin DSN. | BLOQUEADO |
| Major bumps: React 18→19 + react-router-dom 6→7 | P2 | Dependabot PRs #29, #31, #51 cerrados | Requiere sesion de migracion dedicada. react-router-dom 7 cambia API (loader/action). React 19 cambia modelo de concurrencia. Plan: 1) crear branch de migracion, 2) actualizar react+react-dom+types, 3) migrar react-router-dom, 4) actualizar recharts y react-resizable-panels, 5) correr todas las suites. | DIFERIDO |
| Major bumps: recharts 2→3 + react-resizable-panels 2→4 | P3 | Dependabot PRs #25, #28 cerrados | Migrar junto con React 19 en la misma sesion dedicada. | DIFERIDO |
| Verificación visual Security Advisor post-mitigación (WARN esperado = 1) | P0 | `docs/ESTADO_ACTUAL.md` | Confirmar en panel Supabase y registrar evidencia | RESUELTO 2026-02-04 |
| Probar `/reportes/efectividad-tareas` con JWT real (último intento 401) | P0 | `docs/ESTADO_ACTUAL.md` | Smoke real con `node scripts/smoke-efectividad-tareas.mjs` (**200 OK**). | RESUELTO 2026-02-04 |
| Verificar conteo de políticas RLS (COMET reporta 18 vs 30 esperado) | P0 | `docs/ESTADO_ACTUAL.md` | Re-ejecutar auditoría RLS con credenciales y comparar | RESUELTO 2026-02-04 (33 policies) |
| Confirmar licencia definitiva (LICENSE con placeholder `[OWNER PENDIENTE]`) | P0 | `LICENSE` | Definir tipo de licencia y reemplazar placeholder | RESUELTO 2026-02-04 (MIT, ORIGEN-AI) |
| `api-proveedor/health` retorna `unhealthy` (DB/scraper degradado) | P1 | `docs/ESTADO_ACTUAL.md` | Degradación documentada como comportamiento esperado sin datos de scraping. | RESUELTO 2026-02-06 |
| Rate limit/circuit breaker compartidos (store multi-instancia) | P1 | `docs/PLAN_EJECUCION_PREMORTEM.md` | Implementado en PR #33. | RESUELTO 2026-02-08 |
| Timeout/abort en frontend `apiClient` | P1 | `minimarket-system/src/lib/apiClient.ts` | Implementado AbortController + TimeoutError + timeout default 30s. | RESUELTO 2026-02-06 |
| OpenAPI spec incompleto | P2 | `docs/api-openapi-3.1.yaml` | Spec extendida con `/tareas`, `/reservas`, `/health`, dropdowns. | RESUELTO 2026-02-06 |
| Bug: sp_reservar_stock ON CONFLICT con partial index | P0 | Migracion `20260209000000` | ON CONFLICT no matcheaba partial unique index. Fixed con WHERE clause. Migracion aplicada en remoto. | RESUELTO 2026-02-09 (sesion 2) |
| Completar `DATABASE_URL` (reset password DB) | P0 | `docs/ESTADO_ACTUAL.md` | Reset DB password en Supabase y actualizar `.env.test` / Secrets | RESUELTO 2026-02-03 |
| Confirmar/actualizar `API_PROVEEDOR_SECRET` | P0 | `docs/ESTADO_ACTUAL.md` | Definir/rotar secreto y guardar en GitHub Secrets / `.env.test` | RESUELTO 2026-02-03 |
