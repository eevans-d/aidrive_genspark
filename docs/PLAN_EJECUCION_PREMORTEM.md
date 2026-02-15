> [DEPRECADO: 2026-02-13] Documento historico/referencial. No usar como fuente primaria. Fuente vigente: `docs/ESTADO_ACTUAL.md`, `docs/closure/MEGA_PLAN_2026-02-13_042956.md`, `docs/closure/OPEN_ISSUES.md`.

# PLAN DE EJECUCION PREMORTEM — Mini Market System
**Fecha:** 2026-02-06  
**Version:** 1.3  
**Fuente:** `docs/INFORME_PREMORTEM_OPERATIVO.md`

## 0) Objetivo
Ejecutar todas las mitigaciones del pre-mortem con el minimo riesgo operativo, priorizando P0/P1, y dejando el sistema listo para produccion con validaciones tecnicas, UX y seguridad.

## 1) Verificado en repo (estado actual)
- Reservas atómicas + idempotentes: `POST /reservas` usa RPC `sp_reservar_stock` y **requiere** `Idempotency-Key` (`supabase/functions/api-minimarket/index.ts`, `supabase/functions/api-minimarket/handlers/reservas.ts`, `supabase/migrations/20260204120000_add_sp_reservar_stock.sql`).
- SP de inventario sin locking: read-then-write (`supabase/migrations/20260109090000_update_sp_movimiento_inventario.sql`).
- Cron jobs con dedupe/lock: `cron-jobs-maxiconsumo` intenta locks vía RPC con TTL (`supabase/functions/cron-jobs-maxiconsumo/orchestrator.ts`, `supabase/migrations/20260204110000_add_cron_job_locks.sql`).
- Rate limit y circuit breaker en memoria: estado por instancia (`supabase/functions/_shared/rate-limit.ts`, `supabase/functions/_shared/circuit-breaker.ts`).
- Auth JWT validado via `/auth/v1/user` en cada request (`supabase/functions/api-minimarket/helpers/auth.ts`).
- Notificaciones en modo simulacion (`supabase/functions/cron-notifications/index.ts`).
- Frontend sin timeout en `fetch` (`minimarket-system/src/lib/apiClient.ts`).
- Cache en memoria sin coherencia multi-instancia (`supabase/functions/scraper-maxiconsumo/cache.ts`, `supabase/functions/api-proveedor/utils/cache.ts`).
- Pooling en config local deshabilitado y sin verificacion en PROD (`supabase/config.toml`).

Nota: No se detecto UI que consuma `/reservas` en `minimarket-system/src/pages`. Confirmar flujo real antes de cambios UX.

## 2) Preflight (bloqueante)
Estado: **parcialmente completado (2026-02-06)**. Ver detalle en `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` y `docs/ESTADO_ACTUAL.md`.
Nota: la verificación SQL vía `psql` a la DB remota puede seguir bloqueada por conectividad IPv6 desde algunos entornos.

Checklist fuente:
- `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md`

## 3) Proximos pasos inmediatos (48–72h)
1. Ejecutar Preflight y registrar evidencia. **Estado:** parcial OK (suites + smokes OK; SQL DB pendiente según entorno). Ver `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md`.
2. WS1 hotfix: idempotency key en `/reservas` + constraint unico. **Estado:** ✅ COMPLETADO (2026-02-05).
3. WS1 SP: `sp_reservar_stock` + `/reservas` usa RPC atomica. **Estado:** ✅ COMPLETADO (2026-02-05).
4. WS2 lock por job en `cron-jobs-maxiconsumo`. **Estado:** ✅ COMPLETADO (2026-02-05).
5. WS5 guardrail runtime: `cron-notifications` bloquea envios en PROD si `NOTIFICATIONS_MODE` != `real`. **Estado:** desplegado.
6. WS5 guardrail deploy: `deploy.sh` bloquea PROD si `NOTIFICATIONS_MODE` != `real` o no existe en Secrets. **Estado:** listo en repo.
7. Confirmar si existe flujo UI de reservas; si no, cambios solo backend. **Estado:** pendiente.

## 4) Plan de tareas WS1–WS5 (responsables, estimacion, dependencias)

WS1 — Stock/Reservas atomicas (R-001)
- WS1-T1 (Owner: Backend/DB, Est: 0.5d) agregar columna `idempotency_key` + indice unico en `stock_reservado`. **Estado:** ✅ APLICADO (2026-02-05).
- Dep: Preflight completado.
- WS1-T2 (Owner: Backend/DB, Est: 1.5d) crear `sp_reservar_stock` con lock por producto y update atomico. **Estado:** ✅ APLICADO (2026-02-05).
- Dep: WS1-T1.
- WS1-T3 (Owner: Backend, Est: 0.5d) actualizar `/reservas` para usar SP y exigir `Idempotency-Key`. **Estado:** ✅ OPERATIVO (400 si falta key; RPC disponible).
- Dep: WS1-T2.
- WS1-T4 (Owner: QA/Backend, Est: 1.0d) tests de concurrencia, idempotencia y no stock negativo. **Estado:** ✅ COMPLETADO (2026-02-06 - tests/unit/api-reservas-concurrencia.test.ts).
- WS1-T5 (Owner: Frontend, Est: 0.5d) bloqueo doble submit y estado “en proceso” si hay UI de reservas.
- Dep: Confirmacion de flujo UI.

WS2 — Cron jobs dedupe y concurrencia (R-002)
- WS2-T1 (Owner: Backend/DB, Est: 0.5d) agregar lock por `job_id` y estatus `in_progress` con TTL. **Estado:** ✅ APLICADO (2026-02-05).
- Dep: Preflight completado.
- WS2-T2 (Owner: Backend, Est: 0.5d) actualizar orquestador para skip si lock activo. **Estado:** ✅ OPERATIVO (locks activos).
- Dep: WS2-T1.
- WS2-T3 (Owner: QA/Backend, Est: 0.5d) tests de solapamiento y reintentos. **Estado:** ✅ COMPLETADO (2026-02-06 - tests/unit/cron-jobs-locking.test.ts).

WS3 — Rate limit y circuit breaker compartidos (R-003)
- WS3-T1 (Owner: SRE/Backend, Est: 0.5d) decision de store compartido (Redis vs tabla Supabase).
- Dep: Preflight completado.
- WS3-T2 (Owner: Backend, Est: 1.5d) implementar rate limit compartido y claves por `userId + ip`.
- Dep: WS3-T1.
- WS3-T3 (Owner: Backend, Est: 1.5d) persistir estado de circuit breaker y lectura global.
- Dep: WS3-T1.
- WS3-T4 (Owner: Backend, Est: 0.5d) fallback seguro cuando IP es `unknown`.
- Dep: WS3-T2.

WS4 — Auth JWT resiliente (R-005)
- WS4-T1 (Owner: SRE/Backend, Est: 0.5d) verificacion real de `verify_jwt` y viabilidad ES256.
- Dep: Preflight completado.
- WS4-T2 (Owner: Backend, Est: 1.5d) cache de validacion o verificacion local de JWT.
- Dep: WS4-T1.
- WS4-T3 (Owner: Backend, Est: 0.5d) timeout + circuit breaker dedicado a `/auth/v1/user`.
- Dep: WS4-T1.

WS5 — Notificaciones reales (R-006)
- WS5-T1 (Owner: SRE/Backend, Est: 0.5d) agregar `NOTIFICATIONS_MODE` y default seguro por entorno. **Estado:** listo en repo.
- Dep: Preflight completado.
- WS5-T2 (Owner: Backend, Est: 1.5d) implementar envio real (SMTP/Twilio/Slack) con secrets.
- Dep: WS5-T1.
- WS5-T3 (Owner: SRE, Est: 0.5d) guardrail de deploy si PROD queda en `simulation`. **Estado:** listo en repo.
- Dep: WS5-T1.
- WS5-T4 (Owner: SRE/QA, Est: 0.5d) smoke real (read-only) en sandbox. **Estado:** ✅ COMPLETADO (2026-02-06 - scripts/smoke-notifications.mjs).

## 5) Plan por Workstream (mapa de riesgos)

WS1 — Stock/Reservas atomicas (R-001)
- Entregables: `sp_reservar_stock`, `idempotency_key`, endpoint `/reservas` con key, UI con doble submit protegido.
- Criterios: no stock negativo, 409 en duplicados, concurrencia estable.

WS2 — Cron jobs dedupe y concurrencia (R-002)
- Entregables: lock por `job_id`, status `in_progress` con TTL, indice unico por run.
- Criterios: no solapamientos, skip con log.

WS3 — Rate limit y circuit breaker compartidos (R-003)
- Entregables: store compartido, claves por `userId + ip`, fallback seguro.
- Criterios: limites consistentes y 429 explicables.

WS4 — Auth JWT resiliente (R-005)
- Entregables: verify_jwt viable o cache de validacion, breaker dedicado.
- Criterios: p95 auth < 500ms, no dependencia total.

WS5 — Notificaciones reales (R-006)
- Entregables: modo real + guardrail deploy + smoke real.
- Criterios: alertas criticas llegan por canal configurado.

WS6 — API Proveedor hardening (R-007)
- Entregables: HMAC + timestamp, allowlist, rotacion de secret.

WS7 — UX timeouts y doble accion (R-008)
- Entregables: timeout y cancel en `apiClient`, idempotency keys.

WS8 — Observabilidad end-to-end (R-009)
- Entregables: Sentry/LogRocket, `x-request-id`, SLIs reales.

WS9 — Cache coherente multi-instancia (R-010)
- Entregables: cache compartida + singleflight + metrica hit rate.

WS10 — Pooling y performance DB (R-011)
- Entregables: pooling confirmado y prueba de carga.

## 6) Calendario propuesto (asunciones explicitas)
Asunciones:
- Equipo: 1 persona (tu + asistencia AI). Secuencial, sin paralelismo real.
- Ventana diaria por defecto: 18:00–20:00 (hora local).
- Fecha base: 2026-02-04.

Calendario propuesto (secuencial, con fechas absolutas):
- 2026-02-04: ejecutar Preflight completo y registrar evidencia.
- 2026-02-05 (18:00–20:00): WS1 hotfix (WS1-T1 + WS1-T3 parcial) y ajuste de endpoint.
- 2026-02-06 (18:00–20:00): WS2 lock + WS5 guardrail (WS2-T1, WS2-T2, WS5-T3).
- 2026-02-09 a 2026-02-11: WS1 SP (WS1-T2, WS1-T4) + WS3 decision store (WS3-T1).
- 2026-02-12 (18:00–20:00): deploy WS1 SP + WS3 rate limit compartido (WS3-T2, WS3-T4).
- 2026-02-13 (18:00–20:00): deploy WS4 breaker auth + WS5 envio real (WS4-T3, WS5-T2).

## 7) Pruebas y verificacion
- Unit tests nuevos para `sp_reservar_stock` y locks.
- Integration tests: reservas concurrentes + cron dedupe.
- E2E smoke real: `/reportes/efectividad-tareas`, `/reservas`, `/cron-jobs-maxiconsumo/health`.
- Security tests: API proveedor sin firma debe fallar.
- Observabilidad: verificar eventos en plataforma elegida.

## 8) Rollback y seguridad de despliegue
- Migraciones expand/contract con rollback SQL.
- Edge Functions con deploy por funcion y rollback por tag.
- Documentar evidencias en `docs/DECISION_LOG.md` y `docs/ESTADO_ACTUAL.md`.

## 9) Decisiones pendientes (bloqueantes)
- Store compartido para rate limit/breaker: Redis vs Supabase table.
- Plataforma de observabilidad: Sentry vs alternativa.
- Politica final de JWT (verify_jwt ON vs cache local).

## 10) Datos necesarios para ajustar calendario
- Ventanas reales de deploy (si difieren del default 18:00–20:00).
- Restricciones de downtime y mantenimiento.
