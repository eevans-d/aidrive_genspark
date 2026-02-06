# Open Issues (Pre-cierre)

**Última actualización:** 2026-02-06  
**Fuente:** `docs/ESTADO_ACTUAL.md`  

| Pendiente | Severidad | Evidencia | Plan | Responsable |
|-----------|-----------|-----------|------|-------------|
| Habilitar leaked password protection (Auth) requiere plan Pro | P0 | `docs/ESTADO_ACTUAL.md` | SMTP ya configurado; LPP **no disponible** en Free (COMET reporta que requiere plan Pro). **Decisión: diferir hasta producción.** | PENDIENTE |
| Verificación visual Security Advisor post‑mitigación (WARN esperado = 1) | P0 | `docs/ESTADO_ACTUAL.md` | Confirmar en panel Supabase y registrar evidencia | RESUELTO 2026-02-04 |
| Probar `/reportes/efectividad-tareas` con JWT real (último intento 401) | P0 | `docs/ESTADO_ACTUAL.md` | Smoke real con `node scripts/smoke-efectividad-tareas.mjs` (**200 OK**). Requirió redeploy `api-minimarket` con `--no-verify-jwt` por JWT ES256. | RESUELTO 2026-02-04 |
| Verificar conteo de políticas RLS (COMET reporta 18 vs 30 esperado) | P0 | `docs/ESTADO_ACTUAL.md` | Re-ejecutar auditoría RLS con credenciales y comparar | RESUELTO 2026-02-04 (33 policies) |
| Confirmar licencia definitiva (LICENSE con placeholder `[OWNER PENDIENTE]`) | P0 | `LICENSE` | Definir tipo de licencia y reemplazar placeholder | RESUELTO 2026-02-04 (MIT, ORIGEN•AI) |
| Verificar sender real en SendGrid (From Email SMTP Auth) | P1 | `docs/ESTADO_ACTUAL.md` | Confirmar sender/dominio verificado en SendGrid | PENDIENTE |
| Rotación de secretos pre‑producción (si hubo exposición) | P1 | `docs/ESTADO_ACTUAL.md` | Rotar Supabase keys / SendGrid API key / API_PROVEEDOR_SECRET y realinear secrets | PENDIENTE |
| `api-proveedor/health` retorna `unhealthy` (DB/scraper degradado) | P1 | `docs/ESTADO_ACTUAL.md` | Investigar dependencia DB y definir degradación/SLO; corregir si aplica | PENDIENTE |
| Rate limit/circuit breaker compartidos (store multi-instancia) | P1 | `docs/PLAN_EJECUCION_PREMORTEM.md` | Definir store (Redis vs tabla Supabase) e implementar WS3 | PENDIENTE |
| Timeout/abort en frontend `apiClient` | P1 | `minimarket-system/src/lib/apiClient.ts` | Implementar AbortController + UX de error (WS7) | PENDIENTE |
| OpenAPI spec incompleto (faltan `/tareas`, `/reservas`, `/health`, dropdowns) | P2 | `docs/api-openapi-3.1.yaml` | Extender spec o documentar exclusiones explícitas | PENDIENTE |
| Completar `DATABASE_URL` (reset password DB) | P0 | `docs/ESTADO_ACTUAL.md` | Reset DB password en Supabase y actualizar `.env.test` / Secrets | RESUELTO 2026-02-03 |
| Confirmar/actualizar `API_PROVEEDOR_SECRET` | P0 | `docs/ESTADO_ACTUAL.md` | Definir/rotar secreto y guardar en GitHub Secrets / `.env.test` | RESUELTO 2026-02-03 |
