# Open Issues (Pre-cierre)

**Última actualización:** 2026-02-09
**Fuente:** `docs/ESTADO_ACTUAL.md`  

| Pendiente | Severidad | Evidencia | Plan | Responsable |
|-----------|-----------|-----------|------|-------------|
| Habilitar leaked password protection (Auth) requiere plan Pro | P0 | `docs/ESTADO_ACTUAL.md` | SMTP ya configurado; LPP **no disponible** en Free (COMET reporta que requiere plan Pro). **Decisión: diferir hasta producción.** | PENDIENTE |
| Verificación visual Security Advisor post‑mitigación (WARN esperado = 1) | P0 | `docs/ESTADO_ACTUAL.md` | Confirmar en panel Supabase y registrar evidencia | RESUELTO 2026-02-04 |
| Probar `/reportes/efectividad-tareas` con JWT real (último intento 401) | P0 | `docs/ESTADO_ACTUAL.md` | Smoke real con `node scripts/smoke-efectividad-tareas.mjs` (**200 OK**). Requirió redeploy `api-minimarket` con `--no-verify-jwt` por JWT ES256. | RESUELTO 2026-02-04 |
| Verificar conteo de políticas RLS (COMET reporta 18 vs 30 esperado) | P0 | `docs/ESTADO_ACTUAL.md` | Re-ejecutar auditoría RLS con credenciales y comparar | RESUELTO 2026-02-04 (33 policies) |
| Confirmar licencia definitiva (LICENSE con placeholder `[OWNER PENDIENTE]`) | P0 | `LICENSE` | Definir tipo de licencia y reemplazar placeholder | RESUELTO 2026-02-04 (MIT, ORIGEN•AI) |
| Verificar sender real en SendGrid (From Email SMTP Auth) | P1 | `docs/SENDGRID_VERIFICATION.md` | Requiere acceso a SendGrid Dashboard. Hallazgo adicional: mismatch `EMAIL_FROM` vs `SMTP_FROM` en `cron-notifications` (ver doc). | PENDIENTE |
| Rotación de secretos pre‑producción (si hubo exposición) | P1 | `docs/SECRET_ROTATION_PLAN.md` | Ejecutar rotación coordinada (sin valores en repo) y redeploy de funciones afectadas. | PENDIENTE |
| `api-proveedor/health` retorna `unhealthy` (DB/scraper degradado) | P1 | `docs/ESTADO_ACTUAL.md` | Degradación documentada como comportamiento esperado sin datos de scraping. | RESUELTO 2026-02-06 |
| Rate limit/circuit breaker compartidos (store multi-instancia) | P1 | `docs/PLAN_EJECUCION_PREMORTEM.md` | Store elegido (tabla Supabase, D-063). Implementado en PR #33: migraciones `20260208020000` (rate_limit_state + sp_check_rate_limit) y `20260208030000` (circuit_breaker_state + RPCs). Code: `_shared/rate-limit.ts`, `_shared/circuit-breaker.ts` con fallback in-memory. Tests: `tests/unit/rate-limit-shared.test.ts`, `tests/unit/circuit-breaker-shared.test.ts`. Deploy DB+Edge confirmado (remoto). | RESUELTO 2026-02-08 (PR #33) |
| Timeout/abort en frontend `apiClient` | P1 | `minimarket-system/src/lib/apiClient.ts` | Implementado AbortController + TimeoutError + timeout default 30s. | RESUELTO 2026-02-06 |
| OpenAPI spec incompleto (faltan `/tareas`, `/reservas`, `/health`, dropdowns) | P2 | `docs/api-openapi-3.1.yaml` | Spec extendida con `/tareas`, `/reservas`, `/health`, dropdowns. | RESUELTO 2026-02-06 |
| Completar `DATABASE_URL` (reset password DB) | P0 | `docs/ESTADO_ACTUAL.md` | Reset DB password en Supabase y actualizar `.env.test` / Secrets | RESUELTO 2026-02-03 |
| Confirmar/actualizar `API_PROVEEDOR_SECRET` | P0 | `docs/ESTADO_ACTUAL.md` | Definir/rotar secreto y guardar en GitHub Secrets / `.env.test` | RESUELTO 2026-02-03 |
