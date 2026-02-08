# Hoja de Ruta Actualizada (post-plan) — Mini Market System

**Fecha:** 2026-02-08  
**Baseline verificado:** branch `chore/closure-prep-20260202`, commit `85ab94a` (este documento + referencia; features Fases 0–6 + remoto + refresh MVs quedaron en `6584a1b`).  
**Fuentes de verdad:** `docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md`, `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`, `docs/closure/EXECUTION_LOG_2026-02-07.md`, `docs/PLAN_EJECUCION_PREMORTEM.md`.

## 0) Objetivo
Dejar el sistema **estable para producción** y cerrar los **gaps funcionales de UX** detectados, sin reimplementar lo existente.

En particular:
1. Endurecer operación (rate limit/circuit breaker compartidos + auth resiliente + cron/refresh MVs verificable).
2. Completar flujos UX faltantes (alta de producto, ajuste stock, cambio de precio, acciones desde alertas).
3. Consolidar observabilidad y checklist de release.

## 1) Reglas operativas (obligatorias para agentes ejecutores)
1. Registrar TODO en un log auditable:
   - Crear `docs/closure/EXECUTION_LOG_YYYY-MM-DD_<scope>.md`.
   - Cada tarea: comandos, resultados, evidencia (tests/logs), y cambios aplicados.
2. Baseline antes de tocar nada:
   - `git status --porcelain=v1` (pegar en el log).
   - `supabase migration list --linked` (pegar en el log).
   - `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json` (pegar resumen en el log).
3. Prohibido:
   - `git reset --hard`, `git checkout -- <file>`, “limpiar” working tree sin aprobación explícita.
4. Cada módulo/fase debe cerrar con:
   - tests obligatorios (sección 7),
   - actualización mínima de docs (`docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md`, OpenAPI si cambió API),
   - evidencia en el log.

## 2) Estado actual (resumen)
Implementado y verificado (local + remoto):
- Fases 0–6 del plan `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`.
- DB remoto alineado + Edge Functions desplegadas (ver `docs/ESTADO_ACTUAL.md`).
- Refresh operativo de MVs de stock:
  - RPC `public.fn_refresh_stock_views()` disponible (migración `20260208010000_*`).

Pendientes importantes (no bloqueantes hoy, pero recomendados pre-producción):
- WS3: rate limit y circuit breaker **compartidos** (hoy es in-memory por instancia).
- WS4: auth resiliente (hoy valida token con `/auth/v1/user` en cada request, sin cache).
- Observabilidad frontend (Sentry) pendiente por credenciales.
- Hardening extra `api-proveedor` (allowlist orígenes internos) pendiente.
- UX gaps: alta producto / ajuste / cambio precio (ver `docs/audit/02_GAP_MATRIX.md`).

## 3) Roadmap por módulos (con checklist)

### MODULO A (P0/P1) — Producción: Resiliencia, Seguridad y Operación

#### A1) Rate limit compartido (api-minimarket)
**Problema actual:** `FixedWindowRateLimiter` vive en memoria; en Edge Functions hay múltiples instancias, por lo que el límite no es consistente.

**Checklist**
- [ ] DB: crear migración `rate_limit_state` + RPC atómico `sp_check_rate_limit(...)` (usar `SECURITY DEFINER` + `SET search_path = public`).
- [ ] Backend: actualizar `supabase/functions/_shared/rate-limit.ts` para usar RPC cuando esté disponible.
  - Fallback: si RPC no existe (404), usar in-memory (dev).
- [ ] Gateway: en `supabase/functions/api-minimarket/index.ts` usar key por `userId + ip`:
  - key recomendada: `user:{uid}:ip:{ip}` si hay ip, si no `user:{uid}`, y como último `ip:{ip}`.
- [ ] Tests:
  - unit tests: claves y headers (`RateLimit-*`).
  - test de concurrencia (si se hace RPC con `SERIALIZABLE`).
- [ ] Docs:
  - registrar decisión/ajuste en `docs/DECISION_LOG.md`,
  - actualizar `docs/ESTADO_ACTUAL.md` (qué cambió + evidencia).

**Done**
- Límite consistente cross-instancia (mismo usuario no puede “bypassear” con reintentos/distribución).
- Respuestas 429 incluyen headers `RateLimit-*` y `Retry-After`.

#### A2) Circuit breaker compartido (api-minimarket) o “semi-persistente”
**Problema actual:** breaker es in-memory; si se reinicia una instancia, el breaker se resetea.

**Opción recomendada (mínimo viable, sin sobrediseño):**
- Persistir solo el breaker “crítico” (DB/PostgREST) en Supabase tabla para evitar tormentas.

**Checklist**
- [ ] DB: tabla `circuit_breaker_state` + RPC `sp_circuit_breaker_record(p_key, p_success)`:
  - Guarda: `state`, `failure_count`, `opened_at`, `last_failure`.
  - TTL: limpieza por job semanal o “reset si opened_at viejo”.
- [ ] Backend: `supabase/functions/_shared/circuit-breaker.ts`:
  - si RPC existe: usar estado persistido para `api-minimarket-db`.
  - si no: fallback in-memory.
- [ ] Tests unitarios: transiciones `closed -> open -> half_open -> closed`.

**Done**
- Si DB falla repetidamente, el breaker se mantiene abierto aunque cambie la instancia.

#### A3) Auth resiliente (cache + timeout + breaker dedicado)
**Problema actual:** `api-minimarket` valida token llamando `/auth/v1/user` en cada request.

**Checklist**
- [ ] Implementar cache en memoria por token (TTL 30–60s):
  - key: hash corto del token (no guardar token crudo en logs).
  - negative cache (401) por 10–30s para evitar loops.
- [ ] Agregar timeout a `fetchUserInfo()` (AbortController).
- [ ] Agregar breaker dedicado a `auth-v1-user` para degradación controlada.
- [ ] Tests unitarios: cache hit/miss, timeout, breaker open.
- [ ] Documentar impacto: p95 menor, menos carga a Auth.

**Done**
- En una sesión normal, se reduce drásticamente el número de llamadas a `/auth/v1/user`.
- En caída parcial de Auth, el sistema responde fail-fast con error consistente.

#### A4) Cron jobs y refresh de MVs (verificación operativa)
**Checklist**
- [ ] Confirmar en SQL Editor:
  - `pg_cron` y `pg_net` instaladas (si se usan).
  - jobs activos en `cron.job` (incluye `refresh_stock_views` si está disponible).
- [ ] Si `refresh_stock_views` NO existe:
  - crear schedule manual: `select cron.schedule('refresh_stock_views','7 * * * *','select public.fn_refresh_stock_views()');`
- [ ] Documentar evidencia en `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` (nueva sección “MVs refresh”).

**Done**
- `mv_stock_bajo` y `mv_productos_proximos_vencer` se refrescan periódicamente (o se documenta alternativa).

#### A5) Hardening `api-proveedor` (orígenes internos)
**Checklist**
- [ ] Implementar allowlist real de orígenes internos en `supabase/functions/api-proveedor/utils/auth.ts`.
- [ ] Agregar tests (unit) para orígenes permitidos/denegados.
- [ ] Documentar en `docs/SECURITY.md` y `docs/API_README.md`.

---

### MODULO B (P1) — Completar Flujos UX (sin rehacer arquitectura)

#### B1) Alta de producto (UI)
**Backend ya existe:** `POST /productos` (admin/deposito).

**Checklist**
- [ ] `minimarket-system/src/pages/Productos.tsx`: CTA “Nuevo producto”.
- [ ] Modal/form mínimo:
  - `nombre` (requerido), `sku`, `categoria_id`, `marca`, `contenido_neto`.
- [ ] Mutación vía gateway (`productosApi.create`) y revalidación de listados.
- [ ] Tests de componentes: render modal + submit OK + error.

**Done**
- Alta de producto completa desde UI (sin usar SQL Editor).

#### B2) Cambio de precio (UI + action)
**Backend ya existe:**
- `POST /precios/aplicar` (admin) para aplicar precio con redondeo,
- `PUT /productos/:id` (admin/deposito) para actualizar `precio_actual/precio_costo/margen_ganancia`.

**Checklist**
- [ ] En `Productos.tsx`: acción “Actualizar precio”.
- [ ] Definir UX:
  - Admin: usa `/precios/aplicar` si cambia costo y quiere recálculo.
  - Depósito: usa `PUT /productos/:id` si solo ajusta precio actual (si aplica al negocio).
- [ ] Tests de componentes para ambos flujos.

**Done**
- Se puede actualizar precio desde UI con feedback inmediato y rollback si falla.

#### B3) Ajuste de stock (UI)
**Backend ya soporta:** `POST /deposito/movimiento` con `tipo_movimiento='ajuste'`.

**Checklist**
- [ ] `minimarket-system/src/pages/Deposito.tsx`: agregar tipo “Ajuste”.
- [ ] Campos:
  - producto, cantidad, motivo obligatorio (mapear a `motivo`), observaciones opcional.
- [ ] Semántica:
  - `cantidad` es positiva; el signo se resuelve con `tipo_movimiento` si se decide ampliar (si no, documentar).
- [ ] Tests de componentes: ajuste OK + validaciones.

**Done**
- Un encargado puede registrar ajustes sin “hackear” entradas/salidas.

#### B4) Acciones desde alertas (quick wins)
**Checklist**
- [ ] `AlertsDrawer`: CTA “Crear tarea reposición” para stock bajo/crítico.
- [ ] CTA “Aplicar oferta” (si aplica) ya existe; verificar consistencia y tests.

---

### MODULO C (P1/P2) — Observabilidad y Release Readiness

#### C1) Observabilidad frontend (Sentry o equivalente)
**Checklist**
- [ ] Completar `minimarket-system/src/lib/observability.ts` (hoy tiene TODO).
- [ ] Capturar errores con contexto: `x-request-id`, userId (anon), ruta, build version.
- [ ] Documentar variables (`VITE_SENTRY_DSN`) y política de PII.

#### C2) Smoke tests reales (remoto) para features nuevas
**Checklist**
- [ ] Agregar script `scripts/smoke-minimarket-features.mjs` (read-only) que valide:
  - `/search`, `/insights/arbitraje`, `/clientes`, `/cuentas-corrientes/resumen`, `/ofertas/sugeridas`, `/bitacora`.
- [ ] Registrar evidencia en `docs/ESTADO_ACTUAL.md`.

#### C3) Rotación de secretos pre-producción
**Checklist**
- [ ] Seguir `docs/SECRETOS_REQUERIDOS_Y_VALIDACION.md`.
- [ ] Rotar: `API_PROVEEDOR_SECRET`, SendGrid API key, y revisar estrategia para `SUPABASE_*` (según alcance).
- [ ] Confirmar `SMTP_FROM` es sender verificado real.

---

### MODULO D (P2) — Evolución del modelo (solo si el negocio lo requiere)

#### D1) Lotes reales / FEFO
**Contexto actual:** `stock_deposito` tiene índice único `(producto_id, ubicacion)`; no hay múltiples lotes reales por producto/ubicación.

**Checklist (si se decide)**
- [ ] Diseñar esquema “stock por lote” (nueva tabla + migración expand/contract).
- [ ] Ajustar POS para cobrar por lote/FEFO.
- [ ] Tests + plan de migración de datos.

## 4) Checklist de cierre por módulo (siempre)
- [ ] `npm run test:unit`
- [ ] `npm run test:integration`
- [ ] `npm run test:e2e`
- [ ] `npm run test:contracts`
- [ ] `npm run test:security`
- [ ] `pnpm -C minimarket-system lint`
- [ ] `pnpm -C minimarket-system build`
- [ ] `pnpm -C minimarket-system test:components`
- [ ] Actualizar:
  - `docs/ESTADO_ACTUAL.md` (fecha + cambios + evidencia),
  - `docs/DECISION_LOG.md` (si hubo decisión nueva),
  - `docs/api-openapi-3.1.yaml` y `docs/API_README.md` (si cambia API),
  - `docs/closure/EXECUTION_LOG_*.md` (registro auditable).

## 5) Mega planificación (secuencial, recomendada)
1. MODULO A (hardening) primero: A1 + A3 como P0; A2/A4/A5 según riesgo.
2. MODULO B (UX) después: B1/B2/B3 cierran los gaps de operación diaria.
3. MODULO C (release readiness): smoke real + observabilidad + rotación secretos.
4. MODULO D (modelo) solo si se confirma necesidad real (lotes/FEFO).
