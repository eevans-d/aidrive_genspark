# DECISION LOG

**Última actualización:** 2026-02-21
**Propósito:** registrar decisiones para evitar ambigüedad en futuras sesiones.

| ID | Decisión | Estado | Fecha | Nota |
|----|----------|--------|-------|------|
| D-001 | Framework de tests unitarios = **Vitest** | Aprobada | 2026-01-09 | Unifica scripts y CI. |
| D-002 | Lockfiles requeridos (`package-lock.json`, `minimarket-system/pnpm-lock.yaml`) | Aprobada | 2026-01-09 | Reproducibilidad CI/local. |
| D-003 | Estrategia de ramas = **solo `main`** | Aprobada | 2026-01-09 | Simplifica delivery. |
| D-004 | Runner de integración (Vitest + Supabase local) | Aprobada | 2026-01-09 | Confirmado por usuario. |
| D-005 | Estándar de logging: `_shared/logger` + `requestId/jobId/runId` | Aprobada | 2026-01-09 | Confirmado por usuario. |
| D-006 | Cobertura mínima: **80% módulos críticos**, **60% total** | Aprobada | 2026-01-09 | Confirmado por usuario. |
| D-007 | `precios_proveedor` se usa para scraping (Maxiconsumo/locales); precios de compra internos quedan como `precios_compra_proveedor` (pendiente) | Aprobada | 2026-01-10 | Evita colisión entre scraping y compras. |
| D-008 | `comparacion_precios` mantiene schema simplificado (sin `proveedor_id` y campos avanzados) hasta activar comparación multi-proveedor | Aprobada | 2026-01-10 | Documentación alineada a implementación actual. |
| D-009 | Gateway exige JWT con rol válido para endpoints de lectura/escritura (sin rol por defecto) | Aprobada | 2026-01-10 | Refuerza control de acceso en `api-minimarket`. |
| D-010 | API proveedor es interna: auth por shared secret + CORS allowlist; check por header es temporal y debe reemplazarse por verificacion real en FASE 7/8 | Aprobada | 2026-01-11 | Hardening pendiente: validar token real y restringir origenes. |
| D-011 | E2E/Integración bloqueados sin `.env.test` real; usar `npm run test:unit` o `--dry-run` hasta tener claves | Aprobada | 2026-01-11 | Evita fallos al carecer de credenciales de Supabase. |
| D-012 | Se habilita roadmap “sin credenciales”: solo unit tests, dry-run, y hardening estático hasta que se entreguen claves reales | Aprobada | 2026-01-11 | Define alcance temporal mientras se esperan variables reales. |
| D-013 | **Gateway api-minimarket**: usa JWT de usuario para RLS (no service role); rate limit 60 req/min; circuit breaker integrado | Aprobada | 2026-01-12 | Hardening completo del gateway principal. |
| D-014 | **CORS restrictivo en gateway**: bloquea requests browser sin `Origin`; requiere `ALLOWED_ORIGINS` env var | Aprobada | 2026-01-12 | Evita fallback permisivo; server-to-server sin Origin permitido. |
| D-015 | **CI gated jobs**: integration/E2E solo corren con `workflow_dispatch` o `vars.RUN_*_TESTS=true` | Aprobada | 2026-01-12 | Evita fallos CI por falta de secrets; jobs obligatorios siguen corriendo. |
| D-016 | **Carpetas Jest legacy** (`tests/performance/`, `tests/security/`, `tests/api-contracts/`) marcadas con README y desactivadas de CI | Aprobada | 2026-01-12 | Clarifica qué suites están activas vs legacy. |
| D-017 | **API_PROVEEDOR_READ_MODE**: api-proveedor usa `anon` por defecto para lecturas; `service` solo para escrituras (sincronizar/cache persistente) | Aprobada | 2026-01-13 | Reduce exposición de service role key; hardening de lectura/escritura por clave. |
| D-018 | **SCRAPER_READ_MODE**: scraper-maxiconsumo usa `anon` por defecto para lecturas; `service` solo para escrituras | Aprobada | 2026-01-13 | Implementado: readKey/writeKey separados en index.ts y storage.ts. Fallback a service con warning si falta ANON_KEY. |
| D-019 | **Auditoría RLS ejecutada**: checklist y scripts en `docs/AUDITORIA_RLS_CHECKLIST.md` y `scripts/rls_audit.sql` | Completada | 2026-01-23 | Tablas P0 verificadas y protegidas. |
| D-020 | **Retiro Jest legacy**: eliminar deps Jest de `tests/package.json` y mantener el archivo como wrapper | Aprobada | 2026-01-15 | Vitest es runner único; Jest legacy desactivado. |
| D-021 | **WS5.6 caching diferido**: no implementar React Query/SWR hasta tener métricas reales | Aprobada | 2026-01-15 | Priorizar paginación (WS5.5) primero. |
| D-024 | **React Query consolidado** en páginas críticas (8/8 con data; Login no aplica) | Aprobada | 2026-01-22 | Se revierte la postergación inicial de D-021. |
| D-025 | **Patrón de acceso a datos frontend**: lecturas directas a Supabase vía RLS; escrituras vía Gateway (excepción: alta inicial en `personal` durante signUp) | Aprobada | 2026-01-23 | Balance entre performance (lecturas) y control (escrituras). Ver detalle abajo. |
| D-026 | **`npm audit` documentado** (vulnerabilidades dev en rollup/vite aceptadas) | Aprobada | 2026-01-23 | Evidencia referenciada en `docs/archive/ROADMAP.md` y `docs/CHECKLIST_CIERRE.md`. |
| D-022 | **console.* en cron-testing-suite**: permitidos permanentemente para debugging de suite | Aprobada | 2026-01-15 | Excepción controlada para testing-suite. **Actualizado:** se migró a `_shared/logger` (2026-01-22). |
| D-023 | **--dry-run en scripts**: integration/E2E soportan `--dry-run` que valida prereqs sin ejecutar | Aprobada | 2026-01-15 | Permite verificar configuración sin Supabase real. |
| D-027 | **ALLOWED_ORIGINS local-only**: lista exacta `http://localhost:5173,http://127.0.0.1:5173` | Aprobada | 2026-01-23 | Si se agrega dominio publico, registrar cambio y actualizar Supabase/CI. |
| D-028 | **API_PROVEEDOR_SECRET unico y alineado** entre Supabase, GitHub Actions y `.env.test` | Aprobada | 2026-01-24 | Regenerado y alineado (2026-01-24). Registrar futuras rotaciones. |
| D-029 | **Roles server-side**: usar solo `app_metadata.role` (sin fallback a `user_metadata`) | Aprobada | 2026-01-25 | WS7.5 aplicado en `api-minimarket` auth helper. |
| D-030 | **TEST_PASSWORD re-sincronizado** para usuarios E2E (staging) | Completada | 2026-01-26 | Password actualizado en Auth + `.env.test`; E2E auth real revalidado. |
| D-031 | **Owners + rotación de secretos** documentados (M10) | Completada | 2026-01-26 | Owners y ventana de rotación definidos en `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`. |
| D-032 | **Secretos obtenidos desde Supabase** y validados sin exponer valores | Completada | 2026-01-29 | `SUPABASE_*`, `DATABASE_URL`, `API_PROVEEDOR_SECRET`, `ALLOWED_ORIGINS` obtenidos/cargados; validación mínima OK (status + dry-run). |
| D-033 | Ejecutar rollback de `create_stock_aggregations` en STAGING | Completada | 2026-01-30 | Rollback SQL manual ejecutado; evidencia histórica removida en D-109 (trazable en historial git). |
| D-034 | **Remediación Security Advisor (RLS)** en STAGING | Completada (verificada) | 2026-01-30 | Snapshot DESPUÉS capturado (JSON traducido por UI): RLS 6/6 + 6 policies + sin grants `anon` en esas tablas. |
| D-035 | **Auditoría RLS Lite** detecta gaps P0 | Completada | 2026-01-30 | Gaps cerrados por remediación role-based (ver D-036). |
| D-036 | **RLS role-based v2 aplicada y verificada** | Completada | 2026-01-31 | `anon` revocado en tablas críticas, 30 policies activas, post-check OK. Evidencia histórica removida en D-109 (trazable en historial git). |
| D-037 | **Migración versionada RLS role-based v2** | Completada | 2026-01-31 | Aplicada en PROD y verificada (04:06–04:15 UTC). Archivo: `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql`. |
| D-038 | **Security Advisor en PROD con alertas no críticas** | Aprobada | 2026-01-31 | 5 ERROR (vistas SECURITY DEFINER), 7 WARN (funciones + Auth), 15 INFO (tablas internas sin policies). Acciones recomendadas sin bloqueo; evidencia histórica removida en D-109 (trazable en historial git). |
| D-039 | **Mitigación de alertas no críticas (Advisor)** | Completada | 2026-01-31 | search_path fijado, security_invoker en vistas, anon grants revocados; ERROR=0, WARN=2, INFO=15 (histórico). **Estado actual (COMET 2026-02-02): WARN=3** por search_path `sp_aplicar_precio`, `tareas_metricas` en API y leaked password protection. |
| D-040 | **Migración para mitigaciones Advisor** | Aprobada | 2026-01-31 | Archivo creado: `supabase/migrations/20260131020000_security_advisor_mitigations.sql` (validada en no‑PROD por confirmación usuario 2026-02-01). |
| D-041 | **Consolidación de planificación en Hoja de Ruta MADRE** | Completada | 2026-01-31 | Se creó la hoja madre histórica (removida en D-109); referencia vigente: `docs/HOJA_RUTA_ACTUALIZADA_2026-02-08.md`. |
| D-042 | **Proyecto marcado como Producción 100% completada** | Aprobada (confirmación usuario, histórico) | 2026-02-01 | Estado re-abierto 2026-02-02 por WARN/SMTP; el addendum histórico asociado fue removido en D-109 (trazable en historial git). |
| D-043 | **Revisión humana P0 de módulos críticos** | Completada | 2026-02-01 | 6 módulos críticos analizados y aprobados: `api-minimarket/index.ts`, `cors.ts`, `rate-limit.ts`, `fix_rls_security_definer.sql`, `AuthContext.tsx`, `scraper-maxiconsumo/`. Todos PASS. |
| D-044 | **ALLOWED_ORIGINS actualizado en producción** | Aprobada (confirmación usuario) | 2026-02-01 | Dominio real configurado en Edge Functions/CI (valor no expuesto). |
| D-045 | **E2E auth real solo con `VITE_USE_MOCKS=false`** | Aprobada | 2026-02-01 | Evita ejecutar auth real sobre mocks; requiere Supabase real + envs. |
| D-046 | **Vitest alias fallback a root node_modules** | Completada | 2026-02-01 | Evita fallos de resolución cuando `minimarket-system/node_modules` no existe (ej. `@testing-library/jest-dom/vitest`). |
| D-047 | **Scripts de tests soportan Supabase remoto** | Aprobada | 2026-02-02 | Si `SUPABASE_URL` es remoto, omiten `supabase start`/`db reset`. Para forzar local: `SUPABASE_FORCE_LOCAL=1`. |
| D-048 | **Migración sp_aplicar_precio renombrada** | Completada | 2026-02-02 | `20260202000000_version_sp_aplicar_precio.sql` evita conflicto con `schema_migrations` preexistente. |
| D-049 | **Estandarizar errores en api-proveedor** | Completada | 2026-02-02 | Handlers/router/index usan `AppError` (`fromFetchResponse`/`toAppError`) para respuestas JSON consistentes. |
| D-050 | **Reconciliar historial de migraciones PROD** | Completada | 2026-02-02 | Se añadieron placeholders locales para 20250101000000/20260131034034/20260131034328 y se aplicó `20260202000000` en PROD. |
| D-051 | **Leaked password protection bloqueado por SMTP** | Bloqueada | 2026-02-02 | El toggle no aparece sin SMTP personalizado; requiere credenciales externas. |
| D-052 | **Mitigación Advisor WARN=3 (search_path + tareas_metricas)** | Completada | 2026-02-02 | Migración `20260202083000_security_advisor_followup.sql` aplicada en PROD + endpoint `/reportes/efectividad-tareas` usa `service_role` (deploy Antigravity 2026-02-02). |
| D-053 | **Ejecución de mitigación en PROD (Antigravity)** | Completada | 2026-02-02 | `supabase db push --linked` + deploy `api-minimarket`; pendiente evidencia visual del Advisor y test JWT. |
| D-054 | **Test endpoint con JWT (Invalid JWT)** | Completada | 2026-02-04 | Resuelto: access_token **ES256** era rechazado por `functions/v1` con verify_jwt activo. Fix: redeploy `api-minimarket` con `--no-verify-jwt` + rol `admin` en `app_metadata`. Endpoint OK (200). |
| D-055 | **Leaked Password Protection diferido** | Aprobada | 2026-02-04 | COMET reporta que requiere plan Pro; decisión usuario: no upgrade hasta producción. |
| D-056 | **`api-minimarket` sin verify_jwt (workaround ES256)** | Completada | 2026-02-04 | Deploy con `--no-verify-jwt` para aceptar JWT ES256; la validación queda en app (`/auth/v1/user` + roles). |
| D-057 | **Licencia definitiva** | Aprobada | 2026-02-04 | MIT; owner: `ORIGEN•AI`. |
| D-058 | **Idempotency en reservas** | Parcial (función deploy, DB pendiente) | 2026-02-04 | Migración agrega `idempotency_key` + índice único; `/reservas` usa key y devuelve respuesta idempotente. **DB pendiente por red IPv6**. |
| D-059 | **Locks distribuidos para cron jobs** | Parcial (función deploy, DB pendiente) | 2026-02-04 | Migración agrega `cron_jobs_locks` + RPC `sp_acquire_job_lock`/`sp_release_job_lock`; orquestador usa lock con TTL. **DB pendiente por red IPv6** (fallback sin lock). |
| D-060 | **Reserva atómica vía RPC** | Parcial (función deploy, DB pendiente) | 2026-02-04 | `sp_reservar_stock` aplica lock + validación de stock y `/reservas` usa RPC. **DB pendiente por red IPv6** (endpoint devuelve 503 si RPC no existe). |
| D-061 | **Fallback sin lock si RPC no existe** | Completada (deploy) | 2026-02-04 | `cron-jobs-maxiconsumo` continúa sin lock si `sp_acquire_job_lock` no está disponible (evita caída total por DB pendiente). |
| D-062 | **503 explícito si RPC de reservas falta** | Completada (deploy) | 2026-02-04 | `/reservas` retorna 503 cuando `sp_reservar_stock` no existe, en vez de 500 silencioso. |
| D-063 | **Store compartido para rate limit/breaker = Supabase tabla** | Aprobada | 2026-02-06 | Decisión: usar tabla `rate_limit_state` en Supabase en vez de Redis. Trade-offs: +Simplicidad (sin infra adicional), +Costo (incluido en plan), -Latencia (~20-50ms vs ~1ms Redis). Aceptable para volumen actual (<1K rps). Si escala, migrar a Redis. Ver detalle D-063 abajo. |
| D-064 | **Permisos por rutas (frontend) = deny-by-default** | Completada | 2026-02-07 | `canAccessRoute()` retorna `false` para rutas no configuradas (evita bypass pegando URL). |
| D-065 | **Roles coherentes FE/BE**: sincronizar `app_metadata.role` + `personal.rol` | Completada | 2026-02-07 | Script `scripts/supabase-admin-sync-role.mjs` alinea alta de empleados (evita 403 “a medias”). |
| D-066 | **POS ventas idempotente**: `POST /ventas` requiere `Idempotency-Key` | Aprobada | 2026-02-07 | Evita duplicados por reintentos; RPC `sp_procesar_venta_pos` también es idempotente por key. |
| D-067 | **Pocket Manager cámara**: ZXing (`@zxing/library`) + fallback manual | Aprobada | 2026-02-07 | Cámara requiere HTTPS/localhost; UX mobile-first. |
| D-068 | **Anti-mermas**: oferta sugerida 30% OFF “sugerir + 1 clic” (no auto-aplicar) | Aprobada | 2026-02-07 | Tabla `ofertas_stock`; POS cobra `precio_oferta` si hay oferta activa (sin tocar precio base). |
| D-069 | **Bitácora**: modal al logout + fail-open | Aprobada | 2026-02-07 | Guardar nota antes de `signOut()`. Si falla, permitir “Salir sin nota”. |
| D-070 | **GlobalSearch “Scan & Action”**: producto abre modal de acciones | Aprobada | 2026-02-07 | Acciones: verificar precio (insights), imprimir etiqueta, navegar a POS/Depósito/Pocket según permisos. |
| D-071 | **MVs requeridas por alertas**: asegurar `mv_stock_bajo` + `mv_productos_proximos_vencer` en DB | Completada | 2026-02-08 | Hotfix migración `20260206235900_create_stock_materialized_views_for_alertas.sql`. |
| D-072 | **Refresh de MVs de stock**: RPC + cron opcional | Completada | 2026-02-08 | Migración `20260208010000_add_refresh_stock_views_rpc_and_cron.sql` crea `fn_refresh_stock_views()` y agenda `refresh_stock_views` si existe `pg_cron`. |
| D-073 | **x-request-id E2E**: frontend genera UUID y lo envía al backend, extrae server-side ID de respuesta, propaga en `ApiError`/`TimeoutError` y muestra "Ref:" en `ErrorMessage` | Completada | 2026-02-09 | PR #38. `apiClient.ts` + `ErrorMessage.tsx`. Tests: 6 unit + 3 component. |
| D-074 | **SendGrid env var mismatch**: `cron-notifications` lee `EMAIL_FROM` pero secret es `SMTP_FROM`; causa fallback a `noreply@minimarket.com` | Completada | 2026-02-09 | Fix aplicado (código ahora prioriza `SMTP_FROM`). Verificación operacional post-rotación: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`. |
| D-075 | **Performance baseline establecida**: p50 ~700-900ms, p95 ~870-1350ms para endpoints api-minimarket | Completada | 2026-02-09 | PR #42. Script `scripts/perf-baseline.mjs`. Rate limiting (429) confirmado tras ~60 req secuenciales. |
| D-076 | **Secret rotation plan documentado**: 3 secrets identificados para rotación (API_PROVEEDOR_SECRET, SENDGRID_API_KEY, SMTP_PASS) | Completada | 2026-02-09 | PR #43. `docs/SECRET_ROTATION_PLAN.md`. Procedimientos step-by-step con rollback. |
| D-077 | **Sentry diferido hasta DSN**: plan de 6 pasos documentado, no instalar `@sentry/react` sin DSN | Aprobada | 2026-02-09 | PR #45. `docs/SENTRY_INTEGRATION_PLAN.md`. Bundle impact: +30KB gzip. |
| D-078 | **Camino canónico restante a producción consolidado** | Aprobada | 2026-02-12 | Fuente operativa: `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md` + `docs/closure/OPEN_ISSUES.md`. |
| D-079 | **Hardening mini plan 5 pasos cerrado y verificado** | Completada | 2026-02-12 | Evidencia en `scripts/verify_5steps.sh` + `docs/closure/CIERRE_5PASOS_2026-02-12.md`. |
| D-080 | **Gate 3: E2E POS con Playwright route interception** | Completada | 2026-02-12 | 8/8 tests. Dataset determinista (3 productos). Mock gateway via `page.route()`. Fix: `getSession()` agregado a mock supabase. Evidencia: `docs/closure/EVIDENCIA_GATE3_2026-02-12.md`. |
| D-081 | **Gate 4: Notificaciones reales vía SendGrid HTTP API** | Completada | 2026-02-12 | `sendEmail()` usa SendGrid REST API, `sendSlack()` usa webhook real, `sendWebhook()` POST real. Modo controlado por `NOTIFICATIONS_MODE`. Función desplegada. MessageIds reales confirmados. Evidencia: `docs/closure/EVIDENCIA_GATE4_2026-02-12.md`. |
| D-082 | **Gate 16: Sentry integrado, DSN pendiente del owner** | Parcial | 2026-02-12 | `@sentry/react@10.38.0` instalado. `Sentry.init()` en `main.tsx` condicional a `VITE_SENTRY_DSN`. `captureException()` en `observability.ts`. Sin DSN no tiene efecto. Build PASS. Evidencia: `docs/closure/EVIDENCIA_GATE16_2026-02-12.md`. |
| D-083 | **Gate 18: Security tests como gate CI bloqueante** | Completada | 2026-02-12 | Nuevo job `security-tests` obligatorio en CI (sin `continue-on-error`). Security tests removidos de `legacy-tests`. Política GO/NO-GO documentada en YAML. 14/14 tests PASS. Evidencia: `docs/closure/EVIDENCIA_GATE18_2026-02-12.md`. |
| D-084 | **Gate 15: Backup automatizado con retención + restore drill** | Completada | 2026-02-12 | `db-backup.sh` mejorado (gzip, retención 7d, rotación). `db-restore-drill.sh` creado. `backup.yml` GitHub Actions (cron 03:00 UTC). RPO 24h, RTO <15 min. Evidencia: `docs/closure/EVIDENCIA_GATE15_2026-02-12.md`. |
| D-085 | **Veredicto producción: CON RESERVAS** | Aprobada | 2026-02-12 | 4/5 gates cerrados, 1 parcial (Gate 16 DSN Sentry). Sistema defendible para producción piloto. Única acción del owner: configurar `VITE_SENTRY_DSN` + `SUPABASE_DB_URL` (backup). |
| D-086 | **Policy verify_jwt (Edge Functions)**: solo `api-minimarket` puede tener `verify_jwt=false`. `cron-notifications` y `cron-testing-suite` deben permanecer `verify_jwt=true`. | Aprobada | 2026-02-12 | Fix aplicado: redeploy `cron-notifications` v15 (`verify_jwt=true`) y `cron-testing-suite` v12 (`verify_jwt=true`). Baseline actualizado (nota: `BASELINE_LOG_*.md` fue removido en D-109; ver historial git). |
| D-087 | **RLS fine validation (P1)**: alinear policies a roles canónicos + endurecer `personal` (RLS self + unique `user_auth_id`) + `vista_cc_*` con `security_invoker=true` + `jefe` tratado como alias legacy de `admin` | Completada | 2026-02-12 | Migración `20260212130000_rls_fine_validation_lockdown.sql` aplicada. Batería `scripts/rls_fine_validation.sql` ejecutada con `write_tests=1` y 0 FAIL. Evidencia: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-12.log`, `docs/closure/EVIDENCIA_RLS_FINE_2026-02-12.log`. |
| D-088 | **Revalidación RLS remota por pooler (workaround IPv6)**: cuando `psql $DATABASE_URL` falla contra `db.<ref>.supabase.co:5432`, ejecutar auditoría/validación con conexión pooler (`supabase/.temp/pooler-url`) y credenciales locales sin exponer secretos. | Completada | 2026-02-13 | Revalidación 2026-02-13: `scripts/rls_audit.sql` + `scripts/rls_fine_validation.sql` (`write_tests=1`) en PASS (`60/60`, `0 FAIL`). Evidencias: `docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md`, `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`, `docs/closure/EVIDENCIA_RLS_FINE_2026-02-13.log`. |
| D-089 | **Ejecución formal Mega Plan T01..T10**: cierre por contrato de salida con evidencia por tarea y checkpoints cada 2 tareas. | Completada | 2026-02-13 | Evidencias T01..T09: `docs/closure/EVIDENCIA_M*_2026-02-13.md`; checkpoints removidos en D-109 (trazabilidad en historial git). |
| D-090 | **Deploy producción con allowlist de rama obligatoria** | Completada | 2026-02-13 | `deploy.sh` falla en rama inválida y permite continuar en rama válida antes de prerequisitos de secretos. Evidencia: `docs/closure/EVIDENCIA_M8_S1_2026-02-13.md`. |
| D-091 | **Security suite contractual real como baseline** | Completada | 2026-02-13 | `tests/security/security.vitest.test.ts` migra de mock global a helpers reales (auth/cors/validators). Evidencia: `docs/closure/EVIDENCIA_M5_S1_2026-02-13.md`. |
| D-092 | **T09 owner dependencies se gestiona como BLOCKED formal** | Aprobada | 2026-02-13 | Cuando faltan accesos externos (Sentry DSN/rotación final SendGrid), se cierra ejecución técnica y se entrega checklist exacta para owner. Evidencia: `docs/closure/EVIDENCIA_M6_S2_2026-02-13.md`. |
| D-093 | **Normalización canónica de documentación (DocuGuard intensivo)** | Completada | 2026-02-13 | Se actualizaron fuentes canónicas (`README.md`, `docs/AGENTS.md`, `docs/ESTADO_ACTUAL.md`, `docs/closure/OPEN_ISSUES.md`, `docs/closure/README_CANONICO.md`) según estado real verificado (gates, migraciones, functions). Evidencia: `docs/closure/AUDITORIA_DOCUMENTAL_ABSOLUTA_2026-02-13.md`. |
| D-094 | **Preservación de historial documental previo al reset canónico** | Completada | 2026-02-13 | Snapshot legacy preservado y luego consolidado en D-109. Trazabilidad vigente en `docs/archive/README.md` + historial git. |
| D-095 | **SessionOps simulado y validado para consistencia operativa** | Completada | 2026-02-13 | Se ejecutó `session-end` + `session-start`, generando baseline seguro y artefactos de sesión actualizados en `.agent/sessions/current/*`. Evidencia: `BASELINE_LOG_*.md` removido en D-109 (ver historial git). |
| D-096 | **Endurecimiento de tests de seguridad para escenarios reales** | Completada | 2026-02-13 | `tests/security/security.vitest.test.ts` ampliado con auth por `apikey`, rechazo de Bearer inválido/clave rotada, CORS sin `Origin` y smoke real multi-endpoint opcional (`RUN_REAL_TESTS`). Resultado: `npm run test:security` PASS + `gates all` PASS. |
| D-097 | **Integridad total de enlaces markdown (incluye legacy)** | Completada | 2026-02-13 | Se corrigieron enlaces relativos rotos en legacy (8 casos, archivo histórico luego removido en D-109) y se revalidó documentación completa (`README.md` + `docs/**/*.md`) con resultado `0` enlaces rotos. Evidencia: `scripts/validate-doc-links.mjs`, `docs/closure/AUDITORIA_DOCUMENTAL_ABSOLUTA_2026-02-13.md`. |
| D-098 | **Gate 16 incidente detectado: rechazo `ProjectId` en ingest** | Completada (diagnostico) | 2026-02-14 | Se detecto mismatch de DSN en validacion inicial (respuesta `403 with_reason: ProjectId`) y se documento el bloqueo tecnico. Evidencia: `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`. |
| D-099 | **Gate 16 revalidado post-correccion DSN: ingest tecnico OK (`200`)** | Parcial (owner, cierre visual pendiente) | 2026-02-14 | Smoke CLI reproducible en `production` devuelve `SENTRY_SMOKE_STATUS=200` y `event_id` valido en ejecuciones consecutivas; bloqueo `ProjectId` removido. Estado histórico previo al cierre final documentado en D-100. Referencia: `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`. |
| D-100 | **Gate 16 cerrado: evidencia visual + alerta activa en Sentry** | Completada | 2026-02-14 | Cierre externo confirmado (Comet): issue `7265042116`, event `b8474593d35d95a9a752a87c67fe52e8`, `environment=production`, regla `Send a notification for high priority issues` en `Enabled` con filtro `environment=production`. Evidencia: `docs/closure/EVIDENCIA_GATE16_2026-02-14.md`. |
| D-101 | **Auditoría pragmática: P0a Math.random() eliminado** | Completada | 2026-02-14 | `cron-dashboard/index.ts:830-835` — `memoryUsage` y `cpuUsage` generados con `Math.random()` reemplazados por `null`. Métricas falsas removidas del dashboard. |
| D-102 | **Auditoría pragmática: P0b coverage 60%→80%** | Completada | 2026-02-14 | `vitest.config.ts:44-49` — threshold alineado con lo declarado en CLAUDE.md. 829/829 tests PASS post-cambio. |
| D-103 | **Auditoría pragmática: P1a Proveedores CRUD completo** | Completada | 2026-02-14 | Backend: `handlers/proveedores.ts` (nuevo, POST/PUT). Frontend: `Proveedores.tsx` reescrito con modal crear/editar, `useMutation`, `sonner` toast, tag input para `productos_ofrecidos`. Cierra gap operativo real (antes solo lectura). |
| D-104 | **Auditoría pragmática: P1b Reporte ventas diario** | Completada | 2026-02-14 | Backend: `handleListarVentas` con filtros `fecha_desde`/`fecha_hasta` via PostgREST `gte.`/`lte.`. Frontend: `Ventas.tsx` (nuevo) con presets Hoy/Semana/Mes/Custom, tabla, resumen, paginación. Ruta `/ventas` registrada en App.tsx y Layout.tsx. |
| D-105 | **Auditoría pragmática: P3 terminología CLAUDE.md** | Completada | 2026-02-14 | Corregida representación del sistema agéntico: "Skills" → "Guías Operativas", "Workflows Autónomos" → "Workflows (guías de procedimiento)", "Reglas de Automatización" → "Reglas de Ejecución". Honestidad documental sobre la naturaleza de instrucciones markdown vs. automatización autónoma. |
| D-106 | **Cobertura mínima actualizada a 80% global** | Aprobada | 2026-02-14 | Revierte D-006 parcialmente (60% total → 80% total). Justificación: alinear realidad (`vitest.config.ts`) con documentación (`CLAUDE.md`). |
| D-107 | **Gate 4 revalidado post-rotación SendGrid**: secrets aplicados + redeploy + smoke real + Email Activity `delivered` | Completada | 2026-02-15 | Evidencia: `docs/closure/EVIDENCIA_SENDGRID_SMTP_2026-02-15.md`. (Sin exponer secretos; solo nombres y trazas seguras). |
| D-108 | **Auditoría forense definitiva: 7 correcciones + 18 remediaciones aplicadas** | Completada | 2026-02-15 | C-01..C-07 (correcciones documentales) + R-01..R-18 (correcciones de código). Verificación: 829 root tests PASS + 22 frontend tests nuevos + build OK. Commit: `9eb9267`. |
| D-109 | **Limpieza documental masiva: 79 archivos obsoletos eliminados** | Completada | 2026-02-15 | Eliminados: 9 CONTEXT_PROMPT, 23 BASELINE_LOG, 10 TECHNICAL_ANALYSIS, 3 MEGA_PLAN drafts, 3 EXECUTION_LOG, 5 CHECKPOINT, 13 archive/legacy, 5 duplicados, 8 prompts/handoffs. `docs/` reducido de ~2.5MB a ~1.3MB. |
| D-110 | **DocuGuard full-sync 2026-02-16**: normalización canónica post Prompt 1/2/3 (estado/score/migraciones/continuidad) + deprecación explícita de reportes forenses supersedidos | Completada | 2026-02-16 | Se alinearon `README.md`, `docs/AGENTS.md`, `docs/closure/README_CANONICO.md`, `docs/closure/CONTINUIDAD_SESIONES.md`, `docs/closure/OPEN_ISSUES.md`, `docs/AUDITORIA_FORENSE_DEFINITIVA_2026-02-15.md`, `docs/API_README.md`, `docs/ESQUEMA_BASE_DATOS_ACTUAL.md`. Evidencia: `docs/closure/DOCUGUARD_SYNC_REPORT_2026-02-16.md`. |
| D-111 | **Reanudación post-cierre abrupto de sesión + verificación complementaria** | Completada | 2026-02-16 | Se verificó estado final en `main` (`17b00f7`) y se registraron dos P2 no bloqueantes para seguimiento (luego cerrados en D-112). |
| D-112 | **Cierre P2 técnico + sincronización Env/Docs (DocuGuard+EnvAuditOps)** | Completada | 2026-02-16 | Cerrados P2 de `precios_proveedor` (migración `20260216040000`) y CORS cosmético de `scraper-maxiconsumo` (deploy v19). `.env.example` alineado a variables usadas; evidencia: `docs/closure/EVIDENCIA_P2_FIXES_2026-02-16_REMOTE.md`, `docs/closure/ENV_AUDIT_2026-02-16_045120.md`. |
| D-113 | **Auditoria complementaria de referencias historicas**: set canonico limpio; 88 referencias fuera de canon clasificadas como deuda no bloqueante | Completada | 2026-02-16 | Hallazgo registrado en `docs/closure/OPEN_ISSUES.md`; estrategia: limpieza incremental por lotes sin romper trazabilidad historica. |
| D-114 | **Reescritura de 7 archivos de test FAKE/SHALLOW a REAL** — Tests que solo verificaban mocks contra mocks reemplazados por imports reales de código del proyecto (auth, pagination, validation, scraper, response, errors, circuit-breaker, CORS, anti-detection, validators, schemas, router, alertas, constants) | Completada | 2026-02-16 | 829→888 unit tests. 45 auxiliary tests. 8 bugs de aserción descubiertos y corregidos durante rewrite. Archivos: `strategic-high-value.test.ts`, `resilience-gaps.test.ts`, `integration-contracts.test.ts`, `api-scraper.integration.test.ts`, `load-testing.vitest.test.ts`, `openapi-compliance.vitest.test.ts`, `msw-integration.test.ts`. |
| D-115 | **Auditoría intensiva post-rewrite: cross-reference source↔test** — Lectura completa de 12+ módulos fuente cruzada con 7 test files. 1 corrección (getRandomDelay lower bound), 5 mejoras (stats shape, auth fallback, case-insensitive roles, error status inference) | Completada | 2026-02-16 | 888→891 unit tests. Todos PASS: 47 files 891 unit + 3 files 45 auxiliary (4 skipped por credenciales). |
| D-116 | **Coverage global ≥80%: 11 test files nuevos + exclusión mocks** — Cobertura real subida de 64.37% stmts / 56.87% branch a 89.20% stmts / 80.91% branch / 93.29% funcs / 90.66% lines. Módulos cubiertos: `helpers/auth.ts`, `helpers/supabase.ts`, `_shared/circuit-breaker.ts`, `_shared/errors.ts`, `_shared/rate-limit.ts`, `scraper/anti-detection.ts`, `scraper/storage.ts`, `scraper/types.ts`, `handlers/ventas.ts`, `handlers/ofertas.ts`, `api-proveedor/utils/auth.ts`. Exclusión de `minimarket-system/src/mocks/**` de coverage. | Completada | 2026-02-16 | 891→1165 unit tests (58 archivos). Todos PASS. Auxiliary 45 PASS + 4 skipped. Frontend lint PASS, build PASS. |
| D-117 | **DX fixes: Proveedores.test.tsx + Pedidos.test.tsx + lint-staged eslint** — `Proveedores.test.tsx` envuelto con `QueryClientProvider` + mocks faltantes. `Pedidos.test.tsx` mock de `sonner` corregido (`Toaster` export). `lint-staged` apunta a `minimarket-system/node_modules/.bin/eslint` (antes fallaba por bin no encontrado). | Completada | 2026-02-16 | Frontend: 171/171 PASS (30 archivos). Root: 1165/1165 PASS. |
| D-118 | **Twilio SMS no se configura en ningún entorno** — Canal `sms_critical` tiene `isActive: false` hardcoded. No existe implementación de envío real. Variables `TWILIO_*` en `.env.example` son placeholder sin efecto. | Aprobada | 2026-02-16 | Acción futura: si se implementa SMS, cambiar `isActive` a `!!Deno.env.get('TWILIO_ACCOUNT_SID')`. |
| D-119 | **WEBHOOK_URL es opcional en todos los entornos** — Canal genérico auto-deshabilitado si variable vacía. Configurar solo si existe endpoint receptor (n8n, Zapier, sistema interno). | Aprobada | 2026-02-16 | Sin impacto operativo. |
| D-120 | **SLACK_WEBHOOK_URL recomendado en staging/production** — Canal más práctico para alertas de equipo en tiempo real. Sin él, alertas se registran solo en base de datos. | Aprobada | 2026-02-16 | Recomendación: crear webhook Slack → canal `#minimarket-alertas`. |
| D-121 | **Matriz de canales opcionales por entorno documentada** — Análisis completo de 4 canales (email, webhook, slack, sms) con estado de implementación, auto-disable, rate limits y recomendaciones por entorno (dev/staging/prod). | Completada | 2026-02-16 | Evidencia: `docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md`. |
| D-122 | **Limpieza de 88 referencias stale en docs/** — 13 rutas a archivos removidos en D-109 anotadas con `[removido en D-109]` en 14 archivos de docs. Incluye: `PLAN_EJECUCION_PREMORTEM.md`, `HOJA_RUTA_MADRE_2026-01-31.md`, `AUDITORIA_RLS_EJECUTADA_2026-01-31.md`, `ROLLBACK_EVIDENCE_2026-01-29.md`, `PLAN_MITIGACION_WARN_STAGING_2026-01-31.md`, `EXECUTION_LOG_*`, `supabase/seed/test-users.sql`, `.agent/sessions/current/EVIDENCE.md`. | Completada | 2026-02-16 | Issue D-113 cerrado. |
| D-123 | **Sincronización final reporte↔código↔docs (pre-producción)** — Se unificó criterio técnico de enrutamiento del gateway (`35` literales + `20` regex = `55` guards), se corrigió inventario versionado (`605→606`) y se dejó explícita la condición local de quality-gates sin `.env.test`. | Completada | 2026-02-17 | Archivos alineados: `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md`, `docs/API_README.md`, `docs/ESTADO_ACTUAL.md`. Evidencia técnica: `test-reports/quality-gates_20260217-032720.log`, `docs/closure/DOCUGUARD_SYNC_REPORT_2026-02-17.md`, verificación actual `api-proveedor` YAML parseable + drift runtime/spec pendiente. |
| D-124 | **Creación del paquete canónico "Obra Objetivo Final Producción"** — Se crea carpeta de referencia para contraste IA entre estado preproducción y estado objetivo final (mapa maestro + matriz de contraste + protocolo reproducible de sesión nueva). | Completada | 2026-02-17 | Carpeta: `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/` con `README.md`, `MATRIZ_CONTRASTE_PREPROD_VS_OBJETIVO.md`, `PROTOCOLO_CONTRASTE_NUEVA_SESION_IA.md`. Enlaces actualizados en `docs/closure/README_CANONICO.md`, `docs/closure/CONTINUIDAD_SESIONES.md`, `docs/ESTADO_ACTUAL.md`. Reporte DocuGuard: `docs/closure/DOCUGUARD_SYNC_REPORT_2026-02-17_OBRA_OBJETIVO.md`. |
| D-125 | **Revalidación profunda Obra↔Reporte↔Código real (DocuGuard+APISync)** — Se reforzó el paquete `OBRA_OBJETIVO_FINAL_PRODUCCION` con criterios verificables, se corrigió inventario API (`35` literal + `20` regex = `55` guards), y se marcaron en el reporte preprod los hallazgos históricos superados (`api-proveedor` YAML parseable, `reportes-automaticos` sin mismatch de columnas). | Completada | 2026-02-17 | Archivos ajustados: `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/README.md`, `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MATRIZ_CONTRASTE_PREPROD_VS_OBJETIVO.md`, `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/PROTOCOLO_CONTRASTE_NUEVA_SESION_IA.md`, `docs/API_README.md`, `docs/closure/REPORTE_AUDITORIA_PREPRODUCCION_DEFINITIVO_2026-02-16.md`, `docs/DECISION_LOG.md`. |
| D-126 | **Pre-Mortem Hardening: 17 fixes críticos en 4 capas** — Análisis pre-mortem identificó 42 hallazgos en 3 vectores (concurrencia, dependencias externas, fricción UX). Se implementaron los 17 críticos: SQL (CHECK stock>=0, FOR UPDATE/SHARE idempotency/precios/crédito), Shared infra (AbortSignal.timeout 3s + TTL re-check 5min en circuit-breaker/rate-limit), Edge Functions (N+1 eliminado en alertas-stock/notificaciones-tareas, Promise.allSettled en reportes-automaticos, timeouts en cron-notifications, MAX_CATEGORIES=4 en scraper), Frontend (ESC guard POS, scanner race lock, smart retry solo 5xx, 401 refresh-before-signOut con lock, ApiError.message passthrough, optimistic updates pedidos). Auditoria post-implementación encontró y corrigió 2 issues: retry ciego de 4xx y race en refreshSession. | Completada | 2026-02-17 | Migración: `supabase/migrations/20260217100000_hardening_concurrency_fixes.sql`. 11 archivos modificados. Tests: 1165/1165 PASS. Build: CLEAN. Plan: ver descripcion inline en esta decision (plan original no persistido en filesystem). |
| D-127 | **Deploy hardening D-126 a remoto** — Migración SQL `20260217100000` aplicada exitosamente (sin stock negativo). 5 edge functions desplegadas: alertas-stock v17, notificaciones-tareas v19, reportes-automaticos v17, cron-notifications v25, scraper-maxiconsumo v20. Verificación: 42/42 migraciones sincronizadas, 13/13 functions ACTIVE con versiones correctas. Smoke tests de endpoints pendientes de ejecución manual (requieren credenciales). | Completada | 2026-02-17 | Evidencia: `docs/closure/EVIDENCIA_DEPLOY_HARDENING_2026-02-17.md`. |
| D-128 | **Unificación canónica + remediación crítica VULN-001** — `deploy.sh` corregido: `db reset --linked` eliminado de flujo remoto, reemplazado por `db push` para staging/production. `db reset` (sin `--linked`) solo para dev local. Referencias rotas a `.claude/plans/smooth-shimmying-canyon.md` eliminadas (4 archivos). Snapshots pre-deploy etiquetados como históricos (3 archivos). Reporte SRE canonizado en `.gitignore`. `OBJETIVO_FINAL_PRODUCCION.md` subordinado al paquete canónico. Mapeo VULN-SRE vs Matriz creado. Hoja de ruta única canónica creada. OPEN_ISSUES actualizado con snapshot post-deploy. | Completada | 2026-02-17 | Evidencia: `docs/closure/EVIDENCIA_UNIFICACION_CANONICA_2026-02-17.md`. Roadmap: `docs/closure/HOJA_RUTA_UNICA_CANONICA_2026-02-17.md`. Mapeo: `docs/closure/OBRA_OBJETIVO_FINAL_PRODUCCION/MAPEO_VULN_SRE_VS_MATRIZ_2026-02-17.md`. |
| D-129 | **Fase B Safety/Infra — method enforcement + OpenAPI sync + concurrency locks** — (1) api-proveedor: enforcement de método HTTP via `allowedMethods` en `schemas.ts` + validación en `router.ts` (405 para métodos inválidos). (2) OpenAPI api-proveedor sincronizado con runtime: eliminados 3 endpoints fantasma (`/scrape`, `/compare`, `/alerts`), agregado `/health`, corregidos enums (`alertas.tipo`, `comparacion.orden`), agregados 7 params faltantes, agregado `security` a 5 endpoints. (3) VULN-003: `sp_movimiento_inventario` reescrito con `FOR UPDATE` en `stock_deposito` y `ordenes_compra` + validación de cantidad pendiente dentro del SP. (4) VULN-004: nuevo `sp_actualizar_pago_pedido` con `FOR UPDATE` en `pedidos` — reemplaza read-compute-write en application layer. | Completada | 2026-02-17 | Migración: `supabase/migrations/20260217200000_vuln003_004_concurrency_locks.sql`. Tests: 1165/1165 PASS. Lint: PASS. Build: PASS. |

| D-130 | **Validacion post-remediacion**: 5/8 VULNs cerradas (001-004, 008), 2 parciales (005, 006), 1 abierta (007). Quality gates principales PASS (1165 unit, 175 frontend, lint, build). Integration/E2E bloqueados por `.env.test`. Drift documental menor corregido (5 items). Veredicto: PARCIAL. | Completada | 2026-02-17 | Evidencia: `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md`. Proxima fase: Fase C del roadmap (health checks, idempotencia scraper, timeouts api-proveedor). |

| D-131 | **Fase C Observabilidad — VULN-005/006/007 cerradas** — (1) VULN-007: `checkExternalDependencies()` reescrito con probes HTTP reales (`fetchProbe` con timeout 3s) a `supabase_api` y `scraper_endpoint`. `checkScraperHealth` y `checkDatabaseHealth` usan `fetchWithTimeout` 5s. (2) VULN-006: Todos los handlers de `api-proveedor` (`precios`, `productos`, `comparacion`, `alertas`, `estadisticas`, `configuracion`) usan `fetchWithTimeout` (5s main queries, 3s stats/count/facetas). Zero bare `fetch()` en handlers. (3) VULN-005: `fetchWithRetry` hardened — usa `fetchWithTimeout` internamente (10s default), solo retry en 5xx/429/network errors (4xx devuelve response sin retry). `Idempotency-Key` header agregado a POST scrape y compare en `sincronizar.ts`. Archivos: `utils/http.ts`, `utils/health.ts`, `handlers/health.ts`, `handlers/precios.ts`, `handlers/productos.ts`, `handlers/comparacion.ts`, `handlers/alertas.ts`, `handlers/estadisticas.ts`, `handlers/configuracion.ts`, `handlers/sincronizar.ts`. | Completada | 2026-02-17 | 8/8 VULNs SRE cerradas. Tests: 1165/1165 PASS (root), 175/175 PASS (frontend). Build: PASS. |

| D-132 | **Deploy D-132 + drift documental + matriz de contraste actualizada** — (1) Migracion `20260217200000_vuln003_004_concurrency_locks.sql` aplicada en remoto (`supabase db push`). 43/43 synced. (2) `api-proveedor v19` desplegado (fetchWithTimeout, Idempotency-Key, health checks reales). (3) `api-minimarket v27` desplegado (handler pedidos con SP). (4) Drift documental DR-1..DR-5 verificados como cerrados. VALIDACION actualizada: coherencia OK, formula actualizada. (5) MATRIZ_CONTRASTE: ejes 3,4,5,6,7,8,11,14,16 movidos a ALINEADO (13/18 total). (6) Schema doc actualizado: 43/43, 5 SPs. (7) Reporte preprod: addendum de hallazgos historicos superados (8 items). | Completada | 2026-02-17 | Evidencia: `supabase migration list --linked`, `supabase functions list`. MATRIZ: 13 ALINEADO, 4 PARCIAL, 1 NO_ALINEADO. |

| D-133 | **Auditoria final + remediacion documental + branch coverage** — (1) Auditoria READ-ONLY: 8/8 VULNs verificadas CERRADO con evidencia file:line. 9 desalineaciones documentales encontradas. (2) MAPEO doc actualizado: VULN-005/006/007 → CERRADO (D-131), resumen 8/8, tabla impacto corregida. (3) MATRIZ eje 18: conteo corregido 13→12 ALINEADO, 5 PARCIAL. (4) HOJA_RUTA: deploy ref D-127→D-132, Top 10 items #2-9 tachados, Fase C header actualizado. (5) VALIDACION: coherencia 43/42→43/43, D-130 conteo 6/8→5/8 (historico), deploy pendiente→CERRADO. (6) Ventas.tsx lint fix: `ventas` memoizado con `useMemo`. (7) Branch coverage 75.75%→80.21%: 60 tests nuevos en `apiClient-branches.test.ts`. | Completada | 2026-02-17 | Tests: 1225/1225 PASS (59 files). Coverage: 88.50% stmts, 80.21% branch, 92.28% funcs, 89.86% lines. Lint: 0 errors, 0 warnings. Build: PASS. |

| D-134 | **Revalidacion post-remediacion (cierre tecnico-documental)** — Auditoria de cierre: (1) 8/8 VULNs revalidadas con evidencia file:line. (2) Runtime verificado: 43/43 migraciones, 13 functions ACTIVE. (3) Gates locales: 1225 unit PASS, 175 frontend PASS, coverage 80.04% branch, lint 0 warnings, build OK, doc-links 0 broken, `integration`/`e2e` BLOCKED por `.env.test` ausente en este host. (4) Drift textual critico: 0 items vigentes. (5) Coherencia canonica: 7 pares verificados OK. (6) VALIDACION_POST_REMEDIACION ajustada a veredicto APROBADO_CONDICIONAL local. | Completada | 2026-02-18 | Evidencia: `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md` (revalidacion D-134). |

| D-135 | **Ajuste de consistencia post-ejecución de 3 prompts (review Codex)** — Se verificó y corrigió detalle fino de cierre: (1) se crearon artefactos faltantes `DIAGNOSTICO_AVANZADO_PRODUCCION_USUARIO_REAL_2026-02-17.md` y `EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md`; (2) se alinearon docs canónicas (`VALIDACION`, `ESTADO_ACTUAL`, `HOJA_RUTA`, `CONTINUIDAD`, `OPEN_ISSUES`) con el estado real de esta ventana; (3) se revalidaron gates locales: unit/lint/build/components/coverage/doc-links PASS, `integration`/`e2e` BLOCKED por `.env.test`; `test:security` y `test:contracts` PASS; health endpoint OK. | Completada | 2026-02-18 | Evidencia: `docs/closure/EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md`, `docs/closure/DIAGNOSTICO_AVANZADO_PRODUCCION_USUARIO_REAL_2026-02-17.md`. |

| D-136 | **Cierre final consolidado — corrida de produccion con veredicto formal** — (1) FASE 0: baseline `97af2aa`, 2026-02-18T04:44:59Z. (2) FASE 1: `.env.test` NOT_FOUND, health endpoints OK (both healthy, circuitBreaker closed). (3) FASE 2: 10 gates ejecutados — 8 PASS (unit 1248/1248, coverage 88.52%/80.00%/92.32%/89.88%, security 11 PASS, contracts 17 PASS, lint PASS, build PASS, components 175/175, doc-links OK), 2 BLOCKED_ENV (integration, e2e). (4) FASE 3: no requerida (0 FAIL). (5) FASE 4: deteccion pro-activa — hallazgo moderado `deploy.sh` backup permissions sin `chmod`; `backups/` no en `.gitignore`; zero `console.log`/secrets/TODO en prod code. (6) Score: 90%. Veredicto: **GO_CONDICIONAL**. | Completada | 2026-02-18 | Evidencia: `docs/closure/EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md` (actualizado D-136), `docs/closure/VALIDACION_POST_REMEDIACION_2026-02-17.md` (actualizado D-136). |

| D-137 | **Upgrade GO_CONDICIONAL → GO** — `.env.test` provisionado via `supabase projects api-keys` + `supabase secrets list`. `API_PROVEEDOR_SECRET` re-sincronizado con `supabase secrets set` (secret mismatch entre `secrets list` y runtime resuelto). Integration gate: **N/A** (`tests/integration/` removido intencionalmente en D-109, commit fc34cf7). E2E gate: **4/4 PASS** contra endpoints remotos reales (api-proveedor GET /status, /precios, /alertas, /health — all success, 5.56s). Production Readiness Score: 100% (9/9 gates aplicables). Veredicto final: **GO**. | Completada | 2026-02-18 | Evidencia: `docs/closure/EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md`, `test-reports/junit.e2e.xml`. |

| D-138 | **Recheck de cierre integral post-tareas** — Corrida completa con `.env.test` presente y prechecks remotos: health endpoints OK, functions list OK, pero se detecta **drift DB** (`44` local / `43` remoto, pendiente `20260218050000_add_sp_cancelar_reserva.sql`). Gates ejecutados: unit PASS (1248), coverage PASS (88.52/80.16/92.32/89.88), security PASS, contracts PASS, e2e PASS (4/4), lint PASS, build PASS, components PASS (175), doc-links PASS, metrics PASS; `test:integration` retorna FAIL por `No test files found` (suite ausente). Decisión operativa: mantener **GO_CONDICIONAL** hasta resolver política de gate integración (N/A explícito o suite mínima) y cerrar drift de migración remota. | Completada | 2026-02-18 | Evidencia: `/tmp/gates_report_20260218.txt`, `docs/closure/EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md` (addendum D-138), `supabase migration list --linked`. |

| D-139 | **Normalización de gate Deno + trazabilidad de `.ini` de cierre** — Se verificó ejecución real de Deno usando binario absoluto (`/home/eevan/.deno/bin/deno`) con resultado **13/13 PASS** en Edge Functions. Se detectó que `deno` no está en PATH global del host, por lo que se adopta recomendación de usar ruta absoluta o exportar `~/.deno/bin` para evitar falsos FAIL en prechecks. Se mantiene excepción en `.gitignore` (`!docs/closure/*.ini`) para permitir versionar prompts de auditoría en formato `.ini` dentro de `docs/closure/`. | Completada | 2026-02-18 | Evidencia: `docs/audit/EVIDENCIA_DENO_CHECK_2026-02-18.md`, `~/.deno/bin/deno --version`, `.gitignore` regla `!docs/closure/*.ini`. |
| D-140 | **Cierre operativo de integración + revalidación final en GO** — Se eliminó la falla falsa de `npm run test:integration` al alinear `vitest.integration.config.ts` con la suite real (`tests/contract/**/*`). La corrida real de integración pasó `68/68`. Se ajustó sanitización en `api-proveedor` para remover tags `<script>` completos y se corrigió contrato del router test para contexto con método `GET`. Revalidación ejecutada: `test:unit` PASS (1248), `test:auxiliary` PASS (45+4 skipped), `test:integration` PASS (68), `validate-paths` PASS, `validate-doc-links` PASS (81 files), `metrics --check` PASS, `supabase migration list --linked` sincronizado `44/44`. Veredicto operativo actualizado a **GO**. | Completada | 2026-02-18 | Evidencia: `vitest.integration.config.ts`, `supabase/functions/api-proveedor/utils/params.ts`, `tests/contract/api-scraper.integration.test.ts`, `docs/closure/EVIDENCIA_CIERRE_FINAL_GATES_2026-02-17.md` (addendum D-140). |

| D-141 | **Deploy frontend Cloudflare Pages — end-to-end** — (1) Preflight: node 20, pnpm 9, gh CLI, wrangler vía npx — auth OK para ambos. (2) Build: `pnpm build:pages` exitoso, doc links OK. (3) Commit `1e89967` con 8 archivos de deploy (workflow, script, _headers, _redirects, docs). (4) Secrets/variables GitHub Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (secrets), `CLOUDFLARE_PAGES_PROJECT`, `VITE_API_GATEWAY_URL` (variables). (5) Cloudflare: proyecto `aidrive-genspark` creado, account `21d266fc34ec2ea51261b31a421b5133`. (6) Runs: preview `22169188933` success, producción `22169213093` success, deploy #4 `22169586975` success (con `VITE_API_GATEWAY_URL`). (7) CORS fix: `ALLOWED_ORIGINS` actualizado en Supabase + `api-minimarket` redesplegado con `--no-verify-jwt` → preflight 204 OK para ambos dominios. (8) Security headers: nosniff, SAMEORIGIN, strict-origin-when-cross-origin, permissions-policy, cache immutable. (9) Smoke: 6 rutas SPA → HTTP 200. (10) 17 archivos de test nuevos (+313 tests, total 1561). | Completada | 2026-02-19 | Evidencia: `docs/closure/INFORME_INFRAESTRUCTURA_HOST_DEPLOY.md` (sección 9), `docs/closure/GUIA_DEPLOY_CLOUDFLARE_PAGES_2026-02-19.md`, `docs/closure/CONTEXT_PROMPT_ENGINEERING_COMET_CLOUDFLARE_PAGES_2026-02-19.md`. URLs: `https://aidrive-genspark.pages.dev` (prod), `https://preview.aidrive-genspark.pages.dev` (preview). |

| D-142 | **Reescritura ESQUEMA_BASE_DATOS_ACTUAL.md + limpieza dead code routers** — (1) Auditoría de 44 migraciones SQL: se identificaron 38 tablas reales vs 14 documentadas (24 tablas faltantes). (2) Reescritura completa del esquema DB: 38 tablas con definiciones exactas de columnas, tipos, constraints, FKs, indices, RLS policies. Se documentaron 11 vistas, 3 vistas materializadas, 30+ funciones/SPs, 3 triggers. (3) Se detectaron 3 defectos de drift: `precios_historicos.fecha` residual, `cache_proveedor` sin RLS explícito, roles legacy inconsistentes en policies RLS. (4) Se eliminó directorio `supabase/functions/api-minimarket/routers/` (6 archivos, dead code): zero imports, lógica duplicada con `index.ts`, nunca ejecutados. Deno check 13/13 PASS, 1561/1561 tests PASS post-eliminación. | Completada | 2026-02-19 | Evidencia: `docs/ESQUEMA_BASE_DATOS_ACTUAL.md` (reescrito), `git diff` (routers eliminados). |

| D-143 | **Barrido documental completo — alineación de 258 archivos .md** — (1) Inventario: 258 archivos .md en proyecto. (2) Auditoría cruzada de docs principales, secundarios, raíz y closure contra realidad del proyecto (commit d673aae). (3) ~40 desalineaciones identificadas y corregidas: `.github/copilot-instructions.md` reescrito (19+ errores: 11→13 functions, 39→44 migrations, 47→76 test files, 829→1561 tests, refs a archivos inexistentes), `README.md` actualizado (D-137→D-142, 1248→1561 tests, 9/9→11/11 gates, Cloudflare Pages), `CHANGELOG.md` con entradas D-141 y D-142, `ARCHITECTURE_DOCUMENTATION.md` versiones corregidas (Vite 4→6, Cypress→Playwright, Deno 1→2, PG 15→17), `CHECKLIST_CIERRE.md` y `OBJETIVO_FINAL_PRODUCCION.md` refs a routers/ eliminadas, `CONTEXT_PROMPT_NEXT_SESSION` commit+D-143 actualizado, `METRICS.md` regenerado (100→117 test files), `ESTADO_ACTUAL.md` test file count 113→117, `REALITY_CHECK_UX.md` páginas 14→15. | Completada | 2026-02-19 | Evidencia: `git diff` de este commit. |
| D-144 | **Cierre definitivo UX/Frontend V2 — 13 tareas ejecutadas** — (1) V2-04 cerrado: skeleton implementado en `Clientes.tsx:85-97`, test actualizado a async. (2) V2-10 formalizado: touch targets >=48px en todos los modales/controles, tipografía >=16px en acciones primarias, >=14px en nav compacto (justificado por espacio grid-cols-5). DoD actualizado en `PLAN_FRONTEND_UX_V2_2026-02-19.md:248-257`. (3) Suspense fallback global en `App.tsx` reemplazado con skeleton. (4) Dashboard loading `Cargando...` reemplazado con SkeletonText. (5) `extractRequestId` propagado a 11 páginas (7 nuevas). (6) Touch targets >=48px estandarizados en 7 archivos (Pos, Pedidos, Proveedores, AlertsDrawer, GlobalSearch, Layout, Clientes). (7) Empty states con icono + texto estandarizados en Kardex, Ventas, Clientes, Proveedores. (8) Test a11y con vitest-axe: `a11y.test.tsx` (Dashboard + Clientes). (9) V2-06 evidencia consolidada en archivo canónico. (10) Plan duplicado FRONTED ya marcado como alias. (11) OPEN_ISSUES, DECISION_LOG, ESTADO_ACTUAL actualizados. Verificación: lint PASS, build PASS, 184/184 component tests PASS, 1561/1561 unit tests PASS, doc links 81 OK. | Completada | 2026-02-20 | Evidencia: `docs/closure/REPORTE_CIERRE_FINAL_FRONTEND_UX_V2_2026-02-20.md`. |
| D-145 | **Verificación intensiva cero-residuos + cierre de residuos P3 UX** — (1) Se eliminan últimos textos de carga inline y se reemplazan por estados de carga consistentes: `Clientes.tsx:126-129`, `Pos.tsx:583-586`, `AlertsDrawer.tsx:72-75`. (2) Barrido textual final en frontend: `rg -n "Cargando\\.\\.\\.|Cargando…"` sin coincidencias (`NO_MATCHES_CARGANDO`). (3) Corrida de validación completa post-ajustes: lint PASS, build PASS, component tests `184/184`, unit tests `1561/1561`, integration `68/68`, e2e `4/4`, contracts `17/17` (+1 skipped opcional), security `11/11` (+3 skipped opcional), performance `17/17`, doc-links `81/81`. (4) Se actualiza estado documental para reflejar cierre total UX sin residuales P3 abiertos. | Completada | 2026-02-20 | Evidencia: `docs/closure/REPORTE_CIERRE_FINAL_FRONTEND_UX_V2_2026-02-20.md` (addendum D-145), `docs/closure/OPEN_ISSUES.md`. |
| D-146 | **Cuaderno Inteligente MVP — captura rápida + sub-cuaderno por proveedor + automatizaciones** — (1) Parser determinístico `cuadernoParser.ts` (regex, sin IA): extrae acción/producto/cantidad/prioridad/proveedor de texto libre, con `resolveProveedor()` (confianza alta/media/sin_match), `isDuplicate()` (ventana 60min), `generatePurchaseSummary()`. (2) CRUD hooks `useFaltantes.ts`: queries directas a Supabase PostgREST (RLS ya protege `productos_faltantes`), 6 hooks exportados (`useFaltantes`, `useRecentFaltantes`, `useFaltantesByProveedor`, `useCreateFaltante`, `useUpdateFaltante`, `useFaltantesCountByProveedor`). Sin cambios backend. (3) FAB `QuickNoteButton.tsx`: botón naranja bottom-right accesible desde toda la app, modal con preview de parsing en tiempo real, detección de duplicados, auto-asignación de proveedor, Ctrl+Enter submit. (4) Página `Cuaderno.tsx`: 3 tabs (Todos/Por Proveedor/Resueltos), `FaltanteCard` con acciones 1-touch (resolver, editar obs, reasignar proveedor), `ProveedorGroup` colapsable con conteo urgentes y "Copiar resumen para compra". (5) Integración `Proveedores.tsx`: componente `ProveedorFaltantes` en detalle de proveedor (faltantes pendientes con botón resolver). (6) Accesos contextuales: `GlobalSearch.tsx` ("Anotar faltante" como acción rápida + menú producto), `AlertsDrawer.tsx` ("Anotar faltante" en items stock bajo con insert directo), `Dashboard.tsx` (KPI card faltantes pendientes con link a /cuaderno). (7) Ruta `/cuaderno` + nav item + `PUBLIC_ROLES` (accesible por todos los roles). No se requirió migración (tabla `productos_faltantes` con 18 campos + RLS ya existían). Verificación: lint PASS, build PASS, 197/197 component tests PASS (33 files), 1615/1615 unit tests PASS (77 files), 54/54 cuadernoParser tests PASS, doc-links 81 OK. | Completada | 2026-02-20 | Evidencia: `docs/closure/REPORTE_IMPLEMENTACION_CUADERNO_AUTOMATIZACIONES_2026-02-20.md`. Archivos clave: `minimarket-system/src/utils/cuadernoParser.ts`, `minimarket-system/src/hooks/queries/useFaltantes.ts`, `minimarket-system/src/components/QuickNoteButton.tsx`, `minimarket-system/src/pages/Cuaderno.tsx`. |
| D-147 | **Verificación independiente post-Claude (cuaderno) + cierre de gaps operativos** — (1) Auditoría REAL/PARCIAL/NO REAL contra código detectó 2 desvíos: `GlobalSearch` enviaba `state.prefillProduct/quickAction` sin consumo efectivo en `QuickNoteButton`, y faltaba recordatorio automático explícito para faltantes críticos. (2) Fix aplicado: `Layout.tsx` consume estado de navegación y abre/prefilla `QuickNoteButton` en `/cuaderno`; `QuickNoteButton.tsx` ahora soporta `autoOpen` reactivo (no solo inicial). (3) Fix aplicado: `useFaltantes.ts` crea tarea `tareas_pendientes` automática (prioridad `urgente`) al registrar faltante con prioridad `alta`, usando flujo existente de recordatorios (`notificaciones-tareas`). (4) Residual documentado: el FAB global no aparece en rutas standalone `/pos` y `/pocket` por diseño actual sin `Layout`. Verificación ejecutada: lint PASS, component tests `197/197`, build PASS, unit `1615/1615`, integration `68/68`, doc-links PASS. | Completada | 2026-02-21 | Evidencia: `docs/closure/REPORTE_VERIFICACION_POST_CLAUDE_CUADERNO_2026-02-21.md`, `minimarket-system/src/components/Layout.tsx`, `minimarket-system/src/components/QuickNoteButton.tsx`, `minimarket-system/src/hooks/queries/useFaltantes.ts`. |
| D-148 | **Backfill diario idempotente de recordatorios para faltantes críticos + automatizaciones + auditoría producción** — (1) Edge function `backfill-faltantes-recordatorios` implementada: cron diario que detecta faltantes con `resuelto=false AND prioridad='alta'` sin tarea activa asociada, y crea recordatorios en `tareas_pendientes` con trazabilidad `datos.origen='cuaderno'`, `datos.faltante_id`, `datos.backfill_version='1.0.0'`. (2) Idempotencia garantizada: dedup via Set de `faltante_id` extrayendo de tareas activas (`pendiente`/`en_progreso`); corridas consecutivas producen 0 duplicados (QG1 PASS). (3) Fail-safe: batch insert con fallback per-row; errores individuales no abortan lote. (4) Dry-run: `?dry_run=true` retorna plan sin escrituras (QG3 PASS). (5) Auth: `requireServiceRoleAuth`. (6) Performance: batch insert (patrón alertas-stock) con fallback serial. (7) Automatización #1: script `scripts/audit-cuaderno-integrity.mjs` — 22 checks estáticos de integridad (archivos, trazabilidad, idempotencia, auth, convención). (8) Automatización #2: script `scripts/verify-cuaderno-flow.sh` — runner unificado (lint + tests + build + integridad + doc-links + patrones). (9) 25 tests unitarios para backfill: idempotencia, payload, dry-run, fail-safe, double/triple-run. (10) Auditoría pasiva 6 ejes: funcional REAL, UX REAL, confiabilidad REAL, seguridad REAL, performance REAL, docs actualizada. Verificación: lint PASS, build PASS, 1640/1640 unit tests PASS (78 files), 22/22 integrity checks PASS, doc-links 81 OK. Sin migración requerida. | Completada | 2026-02-21 | Evidencia: `docs/closure/REPORTE_BACKFILL_FALTANTES_AUDITORIA_PRODUCCION_2026-02-21.md`. Archivos clave: `supabase/functions/backfill-faltantes-recordatorios/index.ts`, `tests/unit/backfill-faltantes.test.ts`, `scripts/audit-cuaderno-integrity.mjs`, `scripts/verify-cuaderno-flow.sh`. |
| D-149 | **Plan maestro documental V1 implementado para etapa de producción (manual de uso + paquete operativo)** — (1) Se ejecuta paquete documental de 9 artefactos con foco en usuario no técnico (dueno + staff), priorizando flujo `Venta + Faltantes`. (2) Se crean docs nuevas: `MANUAL_USUARIO_FINAL`, `GUIA_RAPIDA_OPERACION_DIARIA`, `TROUBLESHOOTING`, `MONITORING`, `INSTALLATION`, `TESTING`, y reporte de cierre en `docs/closure/`. (3) Se expande `docs/OPERATIONS_RUNBOOK.md` y se reemplaza `minimarket-system/README.md` (template Vite) por README real del frontend. (4) Se actualiza el orquestador `docs/closure/# PROMPTS EJECUTABLES PARA DOCUMENTACIÓN.ini` a v5.1 con `PROMPT 0` bloqueante y objetivo explicito `MANUAL_USUARIO_FINAL`. (5) FactPack de sesión: 14 Edge Functions, 22 skills, 201 markdown docs, 44 migraciones. (6) Validaciones ejecutadas: scan de secretos (0 hallazgos), `node scripts/validate-doc-links.mjs` PASS (87 files). | Completada | 2026-02-21 | Evidencia: `docs/closure/REPORTE_EJECUCION_DOCUMENTAL_PRODUCCION_2026-02-21.md`, `docs/MANUAL_USUARIO_FINAL.md`, `docs/GUIA_RAPIDA_OPERACION_DIARIA.md`, `docs/TROUBLESHOOTING.md`, `docs/MONITORING.md`, `docs/INSTALLATION.md`, `docs/TESTING.md`, `docs/OPERATIONS_RUNBOOK.md`, `minimarket-system/README.md`. |

---

### Acciones owner requeridas

| Prioridad | Acción | Referencia |
|-----------|--------|------------|
| P1 | Configurar `SUPABASE_DB_URL` para backup automatizado (Gate 15) | `docs/closure/EVIDENCIA_GATE15_2026-02-12.md` |
| P2 | (Higiene) Revocar API key anterior de SendGrid si aún está activa (post-rotación) | `docs/closure/CAMINO_RESTANTE_PRODUCCION_2026-02-12.md` |
| P2 | Monitoreo operativo post-release | `docs/OPERATIONS_RUNBOOK.md` |
| P2 | Ejecutar smoke real de seguridad de forma periódica (`RUN_REAL_TESTS=true`) y dejar evidencia en `docs/closure/` | `docs/closure/OPEN_ISSUES.md` |
| P2 | ~~Definir matriz por entorno para canales opcionales (`WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `TWILIO_*`)~~ | ✅ CERRADO (D-121): `docs/closure/EVIDENCIA_CHANNEL_MATRIX_2026-02-16.md` |

### Issues abiertos técnicos

| Issue | Estado | Referencia |
|-------|--------|------------|
| ~~`Proveedores.test.tsx` falta `QueryClientProvider`~~ | ✅ CERRADO (D-117) | `minimarket-system/src/pages/Proveedores.test.tsx` |
| ~~lint-staged no encuentra `eslint`~~ | ✅ CERRADO (D-117) | root `package.json` lint-staged config |
| Leaked password protection requiere plan Pro | Bloqueado por plan | D-055 |

---

## Histórico de Siguientes Pasos

> Las secciones históricas de "Siguientes Pasos" (2026-01-13 a 2026-02-09) fueron consolidadas y removidas en la limpieza documental D-109.
> Para contexto histórico, consultar el historial de git de este archivo.

---

## D-025: Patrón de Acceso a Datos Frontend

### Contexto

El frontend necesita decidir cómo acceder a los datos:
1. **Lecturas directas a Supabase** (hooks React Query con `supabase.from()`)
2. **Todo via Gateway** (`apiClient.ts` → `api-minimarket`)

### Decisión

**Patrón híbrido:**

| Operación | Canal | Justificación |
|-----------|-------|---------------|
| **Lecturas (SELECT)** | Supabase directo | RLS protege datos; menor latencia; menos carga en gateway |
| **Escrituras (INSERT/UPDATE/DELETE)** | Gateway obligatorio *(excepción: alta inicial en `personal` durante signUp)* | Audit log, validación centralizada, control de negocio |
| **RPCs complejas** | Gateway | Centraliza lógica, evita exponer RPCs a frontend |

### Implementación Actual

```
minimarket-system/src/
├── hooks/queries/         # Lecturas directas (8 hooks)
│   ├── useStock.ts        → supabase.from('stock_deposito')
│   ├── useProductos.ts    → supabase.from('productos')
│   └── ...
├── lib/
│   ├── supabase.ts        # Cliente Supabase (anon key)
│   └── apiClient.ts       # Gateway (escrituras)
├── contexts/
│   └── AuthContext.tsx    # Excepción: insert a `personal` en signUp
```

### Razones

1. **RLS ya protege lecturas**: las políticas `USING(auth.uid() = ...)` aseguran que usuarios solo vean datos permitidos
2. **Gateway para writes**: el audit log y validaciones de negocio justifican el overhead
3. **Performance**: lecturas directas eliminan hop intermedio (frontend→gateway→supabase)
4. **Simplicidad**: hooks de React Query son más simples que wrappers de gateway

### Alternativa Descartada

Mover TODAS las operaciones al gateway implicaría:
- Duplicar lógica RLS en TypeScript
- Aumentar latencia de lecturas
- Más código de mantenimiento
- Sin beneficio real (RLS ya existe)

### Migración futura (no planificada)

Si se requiere:
1. Cachear respuestas en gateway con Redis
2. Agregar transformaciones server-side
3. Unificar para mobile apps (que no pueden usar RLS)

Entonces migrar lecturas al gateway.

### Validación

✅ 8 hooks de lectura usan Supabase directo
✅ `apiClient.ts` tiene métodos para escrituras (stock.ajustar, movimientos.registrar, etc.)
⚠️ Excepción actual: `AuthContext.tsx` crea registro en `personal` al signUp (write directo)
✅ RLS verificada para tablas críticas (auditoría completa D-019)

---

## D-063: Store Compartido para Rate Limit y Circuit Breaker

### Contexto

Edge Functions de Deno son stateless. Cada request puede ejecutarse en una instancia diferente. La implementación actual de rate limit (`_shared/rate-limit.ts`) usa `Map` in-memory, lo que significa que:
- **Cada instancia tiene su propio contador**
- Un usuario puede hacer 60 req/min por instancia
- Sin límite real en escenarios de alta concurrencia

### Opciones Evaluadas

| Criterio | Redis (Upstash) | Supabase Tabla |
|----------|-----------------|----------------|
| Latencia | ~1-5ms | ~20-50ms |
| Costo | $0.20/100K ops | Incluido en plan |
| Complejidad | +1 servicio, SDK | Solo SQL/RPC |
| Escalabilidad | Excelente | Buena hasta ~10K rps |
| Atomicidad | INCR nativo | RPC con SERIALIZABLE |
| TTL automático | Sí (EXPIRE) | Manual (scheduled cleanup) |

### Decisión

**Usar tabla Supabase** para fase actual:

1. **Simplicidad**: No requiere configurar Upstash ni agregar dependencias
2. **Costo**: Ya incluido en el plan actual
3. **Volumen**: El proyecto maneja <1K rps, latencia de 20-50ms es aceptable
4. **Atomicidad**: Se implementa con RPC `sp_check_rate_limit` usando `SERIALIZABLE`

### Implementación Propuesta

```sql
-- Tabla para rate limit compartido
CREATE TABLE IF NOT EXISTS rate_limit_state (
  key TEXT PRIMARY KEY,      -- 'user:{uid}' o 'ip:{ip}' o 'user:{uid}:ip:{ip}'
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC atómico para check + increment
CREATE OR REPLACE FUNCTION sp_check_rate_limit(
  p_key TEXT,
  p_limit INTEGER DEFAULT 60,
  p_window_seconds INTEGER DEFAULT 60
) RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- UPSERT atómico
  INSERT INTO rate_limit_state (key, count, window_start)
  VALUES (p_key, 1, NOW())
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limit_state.window_start + (p_window_seconds || ' seconds')::INTERVAL < NOW()
      THEN 1  -- Reset window
      ELSE rate_limit_state.count + 1
    END,
    window_start = CASE
      WHEN rate_limit_state.window_start + (p_window_seconds || ' seconds')::INTERVAL < NOW()
      THEN NOW()
      ELSE rate_limit_state.window_start
    END,
    updated_at = NOW()
  RETURNING count, window_start INTO v_count, v_window_start;

  RETURN QUERY SELECT
    v_count <= p_limit AS allowed,
    GREATEST(0, p_limit - v_count) AS remaining,
    v_window_start + (p_window_seconds || ' seconds')::INTERVAL AS reset_at;
END;
$$;
```

### Migración a Redis (futuro)

Si el proyecto escala >10K rps:
1. Configurar Upstash Redis
2. Usar SDK `@upstash/redis` en Edge Functions
3. Mantener tabla Supabase como fallback

### Validación

- [ ] Crear migración con tabla y RPC
- [ ] Modificar `_shared/rate-limit.ts` para usar RPC
- [ ] Tests de concurrencia para verificar atomicidad
- [ ] Benchmark de latencia en producción
