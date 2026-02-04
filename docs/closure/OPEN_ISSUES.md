# Open Issues (Pre-cierre)

**Última actualización:** 2026-02-04  
**Fuente:** `docs/ESTADO_ACTUAL.md`  

| Pendiente | Severidad | Evidencia | Plan | Responsable |
|-----------|-----------|-----------|------|-------------|
| Habilitar leaked password protection (Auth) requiere plan Pro | P0 | `docs/ESTADO_ACTUAL.md` | SMTP ya configurado; LPP **no disponible** en Free (COMET reporta que requiere plan Pro). **Decisión: diferir hasta producción.** | PENDIENTE |
| Verificación visual Security Advisor post‑mitigación (WARN esperado = 1) | P0 | `docs/ESTADO_ACTUAL.md` | Confirmar en panel Supabase y registrar evidencia | RESUELTO 2026-02-04 |
| Probar `/reportes/efectividad-tareas` con JWT real (último intento 401) | P0 | `docs/ESTADO_ACTUAL.md` | Smoke real con `node scripts/smoke-efectividad-tareas.mjs` (**200 OK**). Requirió redeploy `api-minimarket` con `--no-verify-jwt` por JWT ES256. | RESUELTO 2026-02-04 |
| Verificar conteo de políticas RLS (COMET reporta 18 vs 30 esperado) | P0 | `docs/ESTADO_ACTUAL.md` | Re-ejecutar auditoría RLS con credenciales y comparar | RESUELTO 2026-02-04 (33 policies) |
| Confirmar licencia definitiva (LICENSE con placeholder `[OWNER PENDIENTE]`) | P0 | `LICENSE` | Definir tipo de licencia y reemplazar placeholder | PENDIENTE |
| Completar `DATABASE_URL` (reset password DB) | P0 | `docs/ESTADO_ACTUAL.md` | Reset DB password en Supabase y actualizar `.env.test` / Secrets | RESUELTO 2026-02-03 |
| Confirmar/actualizar `API_PROVEEDOR_SECRET` | P0 | `docs/ESTADO_ACTUAL.md` | Definir/rotar secreto y guardar en GitHub Secrets / `.env.test` | RESUELTO 2026-02-03 |
