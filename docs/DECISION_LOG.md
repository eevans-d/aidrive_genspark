# DECISION LOG

**Última actualización:** 2026-02-13
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
| D-033 | Ejecutar rollback de `create_stock_aggregations` en STAGING | Completada | 2026-01-30 | Rollback SQL manual ejecutado; evidencia en `docs/ROLLBACK_EVIDENCE_2026-01-29.md`. |
| D-034 | **Remediación Security Advisor (RLS)** en STAGING | Completada (verificada) | 2026-01-30 | Snapshot DESPUÉS capturado (JSON traducido por UI): RLS 6/6 + 6 policies + sin grants `anon` en esas tablas. |
| D-035 | **Auditoría RLS Lite** detecta gaps P0 | Completada | 2026-01-30 | Gaps cerrados por remediación role-based (ver D-036). |
| D-036 | **RLS role-based v2 aplicada y verificada** | Completada | 2026-01-31 | `anon` revocado en tablas críticas, 30 policies activas, post-check OK. Evidencia: `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`. |
| D-037 | **Migración versionada RLS role-based v2** | Completada | 2026-01-31 | Aplicada en PROD y verificada (04:06–04:15 UTC). Archivo: `supabase/migrations/20260131000000_rls_role_based_policies_v2.sql`. |
| D-038 | **Security Advisor en PROD con alertas no críticas** | Aprobada | 2026-01-31 | 5 ERROR (vistas SECURITY DEFINER), 7 WARN (funciones + Auth), 15 INFO (tablas internas sin policies). Acciones recomendadas sin bloqueo. Evidencia: Parte 7 en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md`. |
| D-039 | **Mitigación de alertas no críticas (Advisor)** | Completada | 2026-01-31 | search_path fijado, security_invoker en vistas, anon grants revocados; ERROR=0, WARN=2, INFO=15 (histórico). **Estado actual (COMET 2026-02-02): WARN=3** por search_path `sp_aplicar_precio`, `tareas_metricas` en API y leaked password protection. |
| D-040 | **Migración para mitigaciones Advisor** | Aprobada | 2026-01-31 | Archivo creado: `supabase/migrations/20260131020000_security_advisor_mitigations.sql` (validada en no‑PROD por confirmación usuario 2026-02-01). |
| D-041 | **Consolidación de planificación en Hoja de Ruta MADRE** | Completada | 2026-01-31 | Se creó `docs/HOJA_RUTA_MADRE_2026-01-31.md` y se retiraron planes antiguos (`HOJA_RUTA_30_PASOS.md`, `PLAN_PENDIENTES_DEFINITIVO.md`, `HOJA_RUTA_UNIFICADA_2026-01-30.md`). |
| D-042 | **Proyecto marcado como Producción 100% completada** | Aprobada (confirmación usuario, histórico) | 2026-02-01 | Estado re‑abierto 2026-02-02 por WARN/SMTP; ver Addendum en `docs/AUDITORIA_RLS_EJECUTADA_2026-01-31.md` Parte 10. |
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
| D-074 | **SendGrid env var mismatch**: `cron-notifications` lee `EMAIL_FROM` pero secret es `SMTP_FROM`; causa fallback a `noreply@minimarket.com` | Bloqueada | 2026-02-09 | PR #44. Fix: agregar `EMAIL_FROM` alias o cambiar código a leer `SMTP_FROM`. Requiere SendGrid Dashboard. |
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
| D-086 | **Policy verify_jwt (Edge Functions)**: solo `api-minimarket` puede tener `verify_jwt=false`. `cron-notifications` y `cron-testing-suite` deben permanecer `verify_jwt=true`. | Aprobada | 2026-02-12 | Fix aplicado: redeploy `cron-notifications` v15 (`verify_jwt=true`) y `cron-testing-suite` v12 (`verify_jwt=true`). Baseline actualizado (ver `docs/closure/BASELINE_LOG_2026-02-12_161515.md`). |
| D-087 | **RLS fine validation (P1)**: alinear policies a roles canónicos + endurecer `personal` (RLS self + unique `user_auth_id`) + `vista_cc_*` con `security_invoker=true` + `jefe` tratado como alias legacy de `admin` | Completada | 2026-02-12 | Migración `20260212130000_rls_fine_validation_lockdown.sql` aplicada. Batería `scripts/rls_fine_validation.sql` ejecutada con `write_tests=1` y 0 FAIL. Evidencia: `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-12.log`, `docs/closure/EVIDENCIA_RLS_FINE_2026-02-12.log`. |
| D-088 | **Revalidación RLS remota por pooler (workaround IPv6)**: cuando `psql $DATABASE_URL` falla contra `db.<ref>.supabase.co:5432`, ejecutar auditoría/validación con conexión pooler (`supabase/.temp/pooler-url`) y credenciales locales sin exponer secretos. | Completada | 2026-02-13 | Revalidación 2026-02-13: `scripts/rls_audit.sql` + `scripts/rls_fine_validation.sql` (`write_tests=1`) en PASS (`60/60`, `0 FAIL`). Evidencias: `docs/closure/EVIDENCIA_RLS_REVALIDACION_2026-02-13.md`, `docs/closure/EVIDENCIA_RLS_AUDIT_2026-02-13.log`, `docs/closure/EVIDENCIA_RLS_FINE_2026-02-13.log`. |

---

## Siguientes Pasos (2026-02-09)

### Post-backlog session — PRs pendientes de merge

| PR | Tema | Estado | Bloqueador |
|----|------|--------|------------|
| #38 | x-request-id E2E (frontend) | Ready for review | — |
| #39 | api-proveedor /health tests (12+1) | Ready for review | — |
| #40 | /reservas integration tests (15 nuevos) | Ready for review | — |
| #41 | Smoke /reservas script | BLOCKED | No products in DB |
| #42 | Performance baseline script | Ready for review | — |
| #43 | Secret rotation plan (doc) | Ready for review | — |
| #44 | SendGrid verification (doc) | BLOCKED | Requires SendGrid Dashboard |
| #45 | Sentry integration plan (doc) | Ready for review | — |
| #46 | BUILD_VERIFICATION.md addendum | Ready for review | — |

### Acciones owner requeridas

| Prioridad | Acción | Referencia |
|-----------|--------|------------|
| P0 | Resolver `EMAIL_FROM` vs `SMTP_FROM` mismatch | D-074, `docs/SENDGRID_VERIFICATION.md` |
| P0 | Verificar sender en SendGrid Dashboard | `docs/SENDGRID_VERIFICATION.md` §4 |
| P1 | Seed productos en DB (desbloquea PR #41) | `scripts/smoke-reservas.mjs` |
| P1 | Rotar secrets según plan | `docs/SECRET_ROTATION_PLAN.md` |
| P2 | Obtener Sentry DSN cuando listo | `docs/SENTRY_INTEGRATION_PLAN.md` |

---

## Siguientes Pasos (2026-02-01)

### Estado post-cierre (cierre condicionado por hallazgos 2026-02-02)

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P0 | Habilitar leaked password protection (Auth) | Supabase Dashboard → Auth → Settings | ⚠️ Re‑abierto 2026-02-02 (bloqueado por SMTP personalizado; ver D-051) |
| P1 | Confirmar WARN residual en Security Advisor | Panel Supabase | ⚠️ Re‑abierto 2026-02-02 (pendiente evidencia visual) |
| P1 | Validar migraciones en staging/prod | `migrate.sh status` | ✅ Completado (confirmación usuario) |
| P1 | Configurar secrets en GitHub Actions | Settings → Secrets | ✅ Completado (confirmación usuario) |
| P2 | Monitoreo operativo post-release | `docs/OPERATIONS_RUNBOOK.md` | En curso |

---

## Siguientes Pasos (2026-01-31) — Histórico

### Pendientes cerrados

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | ~~Habilitar leaked password protection (Auth)~~ | Supabase Dashboard | Movido a 2026-02-01 |
| P1 | ~~Aplicar/validar migración mitigaciones Advisor~~ | `supabase/migrations/20260131020000_security_advisor_mitigations.sql` | Aplicada en PROD |
| P1 | Evaluar rotación si hubo exposición histórica de claves | Supabase Dashboard | Pendiente |

---

## Siguientes Pasos (2026-01-30)

### Pendientes actuales

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | Revisar Security Advisor (RLS/tabla pública) | `docs/archive/SECURITY_ADVISOR_REVIEW_2026-01-30.md` | En verificación (gaps P0 detectados) |
| P1 | Revalidar RLS post-remediación (snapshot literal + `scripts/rls_audit.sql`) | `docs/archive/SECURITY_ADVISOR_REVIEW_2026-01-30.md` | Snapshot literal OK; auditoría completa pendiente |
| P0 | Remediar policies/grants en `productos`, `proveedores`, `categorias` | `docs/archive/SECURITY_ADVISOR_REVIEW_2026-01-30.md` | Pendiente |
| P1 | Evaluar rotación si hubo exposición histórica de claves | Supabase Dashboard | Pendiente |

---

## Siguientes Pasos (2026-01-29)

### Pendientes actuales

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | Evaluar rotación si hubo exposición histórica de claves | Supabase Dashboard | Pendiente |

| P1 | Probar rollback en staging (OPS-SMART-1) | `docs/DEPLOYMENT_GUIDE.md` | ✅ Completado (2026-01-30) |
## Siguientes Pasos (2026-01-25)

### Pendientes actuales

| Prioridad | Tarea | Referencia | Estado |
|-----------|-------|------------|--------|
| P1 | Probar rollback en staging (OPS-SMART-1) | `docs/DEPLOYMENT_GUIDE.md` | ✅ Completado (2026-01-30) |
| P1 | Rotar credenciales expuestas históricamente en docs (Supabase keys) | Supabase Dashboard | Pendiente (manual) |
| P1 | Sincronizar `TEST_PASSWORD` en Supabase Auth y revalidar E2E auth real | Supabase Dashboard | ✅ Completado (2026-01-26) |
| P1 | Definir owners y rotacion de secretos (M10) | `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md` | ✅ Completado (2026-01-26) |

---

## Siguientes Pasos (2026-01-13) - Histórico

### Pendientes SIN credenciales (priorizados)

| Prioridad | Tarea | Comando/Ruta | Estado |
|-----------|-------|--------------|--------|
| ~~P0~~ | ~~Refactor SCRAPER_READ_MODE (D-018)~~ | ~~`supabase/functions/scraper-maxiconsumo/storage.ts`, `index.ts`~~ | ✅ Completado |
| P1 | Ampliar tests unitarios de scraper (HTML vacío, timeouts) | `tests/unit/scraper-*.test.ts` | Pendiente |
| P1 | Migrar suites performance/security a Vitest | `tests/performance/`, `tests/security/` | Pendiente |
| P2 | Documentar flujos E2E frontend en `minimarket-system/e2e/README.md` | Ya creado, ampliar | Parcial |

### Pendientes CON credenciales (requieren `.env.test` o acceso Supabase)

| Prioridad | Tarea | Checklist/Script | Bloqueador |
|-----------|-------|------------------|------------|
| P0 | ~~Ejecutar auditoría RLS (D-019)~~ | `docs/AUDITORIA_RLS_CHECKLIST.md`, `scripts/rls_audit.sql` | ✅ Completado 2026-01-23 |
| P0 | ~~Verificar migraciones en staging/prod (WS3.1)~~ | `migrate.sh`, checklist en DEPLOYMENT_GUIDE | ✅ Completado 2026-01-23 |
| P1 | ~~Tests de integración reales~~ | `npm run test:integration` | ✅ Completado 2026-01-23 |
| P1 | ~~E2E smoke con Supabase local~~ | `npm run test:e2e` | ✅ Completado 2026-01-23 |
| P2 | ~~Validación runtime de alertas/comparaciones (WS4.1)~~ | `cron-jobs-maxiconsumo/jobs/realtime-alerts.ts` | ✅ Completado 2026-01-23 |

### Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| RLS no validada en tablas P0 | Alto - datos expuestos | Ejecutar `scripts/rls_audit.sql` al obtener credenciales |
| ~~Service role expuesto en scraper~~ | ~~Medio - abuso potencial~~ | ✅ D-018 implementado |
| Tests integration/E2E no corren en CI | Medio - regresiones ocultas | Activar `vars.RUN_INTEGRATION_TESTS` al tener secrets |
| Migraciones no verificadas en prod | Alto - inconsistencia DB | WS3.1 con checklist obligatorio antes de deploy |

---

## Resumen de sesión (2026-01-13)

**Ejecutado (4 tareas sin credenciales):**
1. ✅ E2E frontend: 8 tests Playwright con mocks (`minimarket-system/e2e/`)
2. ✅ CI/Runbook: documentación E2E en OPERATIONS_RUNBOOK.md
3. ✅ Hardening api-proveedor/scraper: +46 tests unitarios (D-017, D-018)
4. ✅ Auditoría RLS: checklist + script SQL preparados (D-019)

**Verificación post-ejecución:**
- `npm test` → **193 tests unitarios OK** (13 archivos)
- `pnpm test:e2e:frontend` → **8 tests Playwright OK**
- Git status: 7 archivos modificados, 4 archivos nuevos (untracked)

**Archivos nuevos:**
- `tests/unit/api-proveedor-read-mode.test.ts` (34 tests)
- `tests/unit/scraper-storage-auth.test.ts` (12 tests)
- `docs/AUDITORIA_RLS_CHECKLIST.md` (368 líneas)
- `minimarket-system/e2e/tareas.proveedores.spec.ts` (2 tests)

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
