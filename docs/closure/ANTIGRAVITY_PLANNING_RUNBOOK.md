# Antigravity Planning Runbook (Ejecución de Próximos Pasos)

**Fecha:** 2026-02-06  
**Audience:** Agente IA externo en **Antigravity** (modo **Planning**)  
**Objetivo:** ejecutar el camino restante de forma reproducible, con evidencia, sin perder contexto.

---

## 0) Fuentes de verdad (orden recomendado)

1. `docs/ESTADO_ACTUAL.md`  
   Estado real + checklist de “próximas 20 tareas” (priorizado).
2. `docs/PLAN_EJECUCION_PREMORTEM.md` [removido en D-109]
   Workstreams WS1–WS10, dependencias, riesgos y criterios.
3. `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md`  
   Preflight + evidencias + bloqueos (incluye notas de conectividad DB).
4. `docs/closure/OPEN_ISSUES.md`  
   Issues activos, severidad y plan.
5. `docs/DECISION_LOG.md`  
   Registrar decisiones técnicas (no “decisiones en chat”).

---

## 1) Preparación (antes de ejecutar cualquier tarea)

### 1.1 Estado de repo

Comandos sugeridos:
```bash
git status --porcelain=v1
git rev-parse --abbrev-ref HEAD
git log -5 --oneline --decorate
```

Regla:
- Si hay cambios sin commit, primero entenderlos y decidir si se continúan o se committean como “estado base” para la ventana.

### 1.2 Variables / entorno

- `.env.test` debe existir en la raíz (no versionado).
- No imprimir secretos en logs/salidas.

Guía de obtención de secretos:
- `docs/OBTENER_SECRETOS.md`

---

## 2) Quality Gates (preflight mínimo por ventana)

Ejecutar y guardar evidencia (local):
```bash
npm run test:unit
npm run test:auxiliary
npm run test:integration
npm run test:e2e
npm run test:coverage
node scripts/smoke-notifications.mjs

pnpm -C minimarket-system lint
pnpm -C minimarket-system build
pnpm -C minimarket-system test:components
```

Artefactos esperados (local):
- `coverage/`
- `test-reports/junit.xml`
- `test-reports/junit.auxiliary.xml`
- `test-reports/junit.integration.xml`
- `test-reports/junit.e2e.xml`

Nota:
- `coverage/` y `test-reports/` están gitignored; se regeneran por ejecución.
- Si `deno` no está disponible en el host, dejar evidencia y seguir (ver `docs/ESTADO_ACTUAL.md`).

---

## 3) Mecanismo de “registro absoluto” (Definition of Done por tarea)

Para marcar una tarea como completada:
- Actualizar el checkbox correspondiente en `docs/ESTADO_ACTUAL.md`.
- Agregar fecha y evidencia mínima (comando ejecutado + resultado).
- Si hubo decisión (tradeoff/arquitectura/seguridad), registrar en `docs/DECISION_LOG.md`.
- Si cambió contrato de API, actualizar `docs/API_README.md` y (si aplica) `docs/api-openapi-3.1.yaml`.
- Si apareció un riesgo nuevo o cambió severidad, actualizar `docs/closure/OPEN_ISSUES.md`.

---

## 4) Camino restante (20 tareas, paso a paso)

Fuente de la lista: `docs/ESTADO_ACTUAL.md` (sección “Checklist próximas 20 tareas/pasos”).

### 1/20 (P0): Alinear contrato de `POST /reservas` (Idempotency-Key)

Touchpoints:
- `docs/API_README.md`
- `supabase/functions/api-minimarket/handlers/reservas.ts`

Pasos:
1. Confirmar que `Idempotency-Key` está documentado como **requerido** y con ejemplos.
2. Confirmar que no existe cliente/UI que llame `/reservas` sin ese header (o registrar dónde hay que actualizar).

Validación:
- `npm run test:unit` (suite `api-reservas-concurrencia`).

Registro:
- Marcar checkbox 1/20 en `docs/ESTADO_ACTUAL.md` + nota breve.

### 2/20 (P0): Agregar tests de integración reales para `/reservas`

Nota importante (estado actual):
- `tests/integration/` hoy está principalmente basado en mocks (`global.fetch = vi.fn()`); no ejercita backend real.

Decisión requerida:
- Opción A: crear tests **reales** en `tests/e2e/` (recomendado por coherencia: E2E ya es real-network).
- Opción B: convertir/crear tests reales en `tests/integration/` y gatearlos (p.ej. `RUN_REAL_TESTS=true`).

Touchpoints:
- `tests/e2e/` o `tests/integration/` (según decisión)
- `docs/DECISION_LOG.md` (registrar la opción elegida)

Validación:
- Si es E2E: `npm run test:e2e`.
- Si es integration real: `npm run test:integration` (y confirmar gating).

Registro:
- Checkbox 2/20 en `docs/ESTADO_ACTUAL.md` + evidencia.

### 3/20 (P0): Agregar smoke E2E mínimo para `/reservas` (create + idempotent)

Pasos sugeridos (real network):
1. Crear reserva con `Idempotency-Key=...` y esperar `201`.
2. Repetir misma request (misma key) y esperar `200` con `idempotent=true`.

Touchpoints:
- `tests/e2e/` (archivo nuevo recomendado: `tests/e2e/reservas.smoke.test.ts`)

Validación:
- `npm run test:e2e`.

Registro:
- Checkbox 3/20 en `docs/ESTADO_ACTUAL.md`.

### 4/20 (P0): Investigar `api-proveedor/health` en estado `unhealthy`

Touchpoints:
- `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` (comando exacto para health)
- `supabase/functions/api-proveedor/`
- `docs/closure/OPEN_ISSUES.md`

Pasos:
1. Ejecutar health real con headers requeridos.
2. Identificar causa (DB/cache/scraper/secrets) y decidir si se corrige o se documenta degradación/SLO.

Validación:
- Re-ejecutar `api-proveedor/health` y comparar estado.

Registro:
- Checkbox 4/20 en `docs/ESTADO_ACTUAL.md`.
- Actualizar issue en `docs/closure/OPEN_ISSUES.md` con evidencia.

### 5/20 (P1): Extender OpenAPI (`docs/api-openapi-3.1.yaml`)

Touchpoints:
- `docs/api-openapi-3.1.yaml`
- `docs/API_README.md`

Pasos:
1. Agregar paths: `/tareas`, `/reservas`, `/health`, `/productos/dropdown`, `/proveedores/dropdown`.
2. Definir auth (JWT) y headers requeridos (incluye `Idempotency-Key` en `/reservas`).

Validación:
- `npm run test:auxiliary` (contract tests).

Registro:
- Checkbox 5/20 en `docs/ESTADO_ACTUAL.md`.

### 6/20 (P1): Timeout + abort en frontend (`apiClient.ts`)

Touchpoints:
- `minimarket-system/src/lib/apiClient.ts`

Pasos:
1. Implementar timeout configurable con `AbortController`.
2. Alinear UX de error (mensaje consistente + reintento).

Validación:
- `pnpm -C minimarket-system lint`
- `pnpm -C minimarket-system build`
- `pnpm -C minimarket-system test:components`

Registro:
- Checkbox 6/20 en `docs/ESTADO_ACTUAL.md`.

### 7/20 (P1): Definir store compartido (rate limit / circuit breaker)

Touchpoints:
- `docs/PLAN_EJECUCION_PREMORTEM.md` [removido en D-109] (WS3)
- `docs/DECISION_LOG.md`

Pasos:
1. Evaluar opciones: Redis vs tabla Supabase (operación, costo, latencia, consistencia).
2. Registrar decisión (con tradeoffs) en `docs/DECISION_LOG.md`.

Validación:
- N/A (decisión documental), pero debe incluir plan de implementación y rollback.

Registro:
- Checkbox 7/20 en `docs/ESTADO_ACTUAL.md`.

### 8/20 (P1): Implementar rate limit compartido (WS3)

Touchpoints:
- `supabase/functions/_shared/rate-limit.ts` (o nuevo módulo compartido)
- `docs/PLAN_EJECUCION_PREMORTEM.md` [removido en D-109]

Pasos:
1. Implementar store compartido según decisión 7/20.
2. Clave: `userId + ip` y fallback seguro si IP es `unknown`.

Validación:
- `npm run test:unit` (agregar/actualizar tests para rate limit).

Registro:
- Checkbox 8/20 en `docs/ESTADO_ACTUAL.md`.

### 9/20 (P1): Implementar circuit breaker compartido/persistente (WS3)

Touchpoints:
- `supabase/functions/_shared/circuit-breaker.ts` (o nuevo store compartido)

Pasos:
1. Persistir estado (store compartido) con expiración/TTL.
2. Agregar métricas mínimas (hits/opens/half-open transitions).

Validación:
- `npm run test:unit` (agregar/actualizar tests del breaker).

Registro:
- Checkbox 9/20 en `docs/ESTADO_ACTUAL.md`.

### 10/20 (P1): Auth resiliente (WS4) y evaluar volver `verify_jwt=true`

Touchpoints:
- `supabase/functions/api-minimarket/helpers/auth.ts`
- `docs/PLAN_EJECUCION_PREMORTEM.md` [removido en D-109] (WS4)

Pasos:
1. Definir enfoque: cache validación `/auth/v1/user` o verificación local JWT.
2. Re-evaluar viabilidad de `verify_jwt=true` (considerando ES256 y Supabase).

Validación:
- `npm run test:unit`
- Smoke real (si aplica) contra gateway en staging.

Registro:
- Checkbox 10/20 en `docs/ESTADO_ACTUAL.md` + decisión/nota técnica en `docs/DECISION_LOG.md`.

### 11/20 (P1): Timeout + breaker dedicado a `/auth/v1/user` (WS4-T3)

Touchpoints:
- `supabase/functions/api-minimarket/helpers/auth.ts`
- `supabase/functions/_shared/circuit-breaker.ts`

Pasos:
1. Implementar timeout y breaker específico para la llamada a `/auth/v1/user`.
2. Definir fallback seguro (401 vs 503) y log estructurado.

Validación:
- `npm run test:unit` (tests de timeout/breaker en auth).

Registro:
- Checkbox 11/20 en `docs/ESTADO_ACTUAL.md`.

### 12/20 (P1): Verificar sender real/dominio verificado en SendGrid (SMTP Auth)

Touchpoints:
- SendGrid dashboard (sender/domain verification)
- Supabase Auth SMTP settings (From Email)

Pasos:
1. Confirmar que el “From Email” es sender verificado o dominio verificado.
2. Registrar evidencia (sin exponer secretos).

Registro:
- Checkbox 12/20 en `docs/ESTADO_ACTUAL.md`.

### 13/20 (P1): Rotación de secretos pre-producción

Touchpoints:
- Supabase Secrets (Edge Functions)
- GitHub Actions Secrets
- `.env.test` (local)
- `docs/OBTENER_SECRETOS.md`

Pasos:
1. Definir qué rotar (Supabase keys, SendGrid API key, API_PROVEEDOR_SECRET).
2. Ejecutar rotación y re-alinear (Supabase + GitHub + `.env.test`).
3. Re-ejecutar gates.

Validación:
- `npm run test:e2e` + smokes relevantes.

Registro:
- Checkbox 13/20 en `docs/ESTADO_ACTUAL.md`.

### 14/20 (P1): Plan de upgrade a Supabase Pro para Leaked Password Protection

Touchpoints:
- Supabase plan/features (Dashboard)
- `docs/ESTADO_ACTUAL.md`

Pasos:
1. Documentar plan y checklist de activación (qué cambiar, impacto, verificación).

Registro:
- Checkbox 14/20 en `docs/ESTADO_ACTUAL.md`.

### 15/20 (P2): Integrar observabilidad (Sentry o equivalente) en frontend

Touchpoints:
- `minimarket-system/src/lib/observability/` (si existe) o nuevo módulo
- `x-request-id` (correlación)

Pasos:
1. Integrar SDK y capturar errores de fetch/render.
2. Propagar `x-request-id` al contexto de logs/errores.

Validación:
- `pnpm -C minimarket-system build` + test de error controlado (sin exponer tokens).

Registro:
- Checkbox 15/20 en `docs/ESTADO_ACTUAL.md`.

### 16/20 (P2): Propagación de `x-request-id` entre Edge Functions y logs

Touchpoints:
- `supabase/functions/_shared/logger.ts`
- Edge Functions: cron/scraper/gateway

Pasos:
1. Asegurar que `x-request-id` se genera/propaga y aparece en logs estructurados.
2. Documentar convención (nombres/campos).

Validación:
- `npm run test:unit` (si aplica con tests de logger/headers).

Registro:
- Checkbox 16/20 en `docs/ESTADO_ACTUAL.md`.

### 17/20 (P2): Cache coherente multi-instancia (scraper + api-proveedor)

Touchpoints:
- `supabase/functions/scraper-maxiconsumo/cache.ts`
- `supabase/functions/api-proveedor/utils/cache.ts`

Pasos:
1. Diseñar estrategia (singleflight + TTL + invalidación).
2. Implementar store compartido si aplica (o estrategia sin estado con DB).

Validación:
- `npm run test:unit` (tests de cache deterministas).

Registro:
- Checkbox 17/20 en `docs/ESTADO_ACTUAL.md` + decisión en `docs/DECISION_LOG.md`.

### 18/20 (P2): Pooling / performance DB en PROD + baseline carga

Touchpoints:
- Supabase Dashboard SQL Editor (si `psql` falla)
- `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md`

Pasos:
1. Ejecutar queries de pooling/conexiones (`show max_connections;`, `pg_stat_activity`, `cron.job`).
2. Ejecutar baseline de carga (herramienta definida) y registrar resultados.

Registro:
- Checkbox 18/20 en `docs/ESTADO_ACTUAL.md`.

### 19/20 (P2): Actualizar `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` con evidencia de la corrida

Estado actual:
- Ya existe registro 2026-02-06 con suites + smokes y notas de bloqueos.

Acción:
- Si hay nueva corrida en otra ventana/entorno, agregar un nuevo bloque “Registro de ejecución (YYYY-MM-DD)”.

Registro:
- Checkbox 19/20 en `docs/ESTADO_ACTUAL.md` (cuando aplique a la ventana actual).

### 20/20 (P2): Preparar release (entorno limpio) + addendum en `docs/closure/BUILD_VERIFICATION.md`

Touchpoints:
- `docs/closure/BUILD_VERIFICATION.md`

Pasos:
1. Correr gates en entorno limpio (sin caches raros; ideal: máquina nueva o limpieza de deps).
2. Registrar en `docs/closure/BUILD_VERIFICATION.md`: fecha, comandos, resultados, bloqueos (IPv6/deno/etc).

Validación:
- Repetir `Quality Gates` (sección 2).

Registro:
- Checkbox 20/20 en `docs/ESTADO_ACTUAL.md`.

---

## 5) Cierre de ventana (obligatorio)

Antes de terminar la sesión:
1. `git status --porcelain=v1` debe quedar sin sorpresas.
2. Actualizar `docs/ESTADO_ACTUAL.md` con lo hecho/no hecho y bloqueos.
3. Si hubo cambios, dejar commits con mensajes claros (uno por unidad lógica).
4. Anotar el “siguiente paso exacto” (el próximo comando a correr) en `docs/ESTADO_ACTUAL.md`.
