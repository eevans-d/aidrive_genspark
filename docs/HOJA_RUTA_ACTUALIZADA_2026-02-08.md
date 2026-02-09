# Hoja de Ruta Actualizada (post-plan) — Mini Market System

**Fecha:** 2026-02-08  
**Baseline verificado:** branch `chore/closure-prep-20260202` (registrar el commit exacto con `git log -1 --oneline`; la implementación de Fases 0–6 + alineación remoto + refresh MVs quedó en `6584a1b`).  
**Fuentes de verdad:** `docs/ESTADO_ACTUAL.md`, `docs/DECISION_LOG.md`, `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`, `docs/closure/EXECUTION_LOG_2026-02-07.md`, `docs/PLAN_EJECUCION_PREMORTEM.md`.

## 0) Objetivo
Dejar el sistema **estable para producción** y cerrar los **gaps funcionales de UX** detectados, sin reimplementar lo existente.

En particular:
1. Endurecer operación (rate limit/circuit breaker compartidos + auth resiliente + cron/refresh MVs verificable).
2. Completar flujos UX faltantes (alta de producto, ajuste stock, cambio de precio, acciones desde alertas).
3. Consolidar observabilidad y checklist de release.

## 1) Reglas operativas (obligatorias para agentes ejecutores)
1. Log auditable: crear `docs/closure/EXECUTION_LOG_YYYY-MM-DD_<scope>.md` y mantenerlo actualizado (qué se hizo, comandos, resultados, evidencias y archivos tocados).
2. Baseline antes de tocar nada: ejecutar y pegar en el log `git status --porcelain=v1`, `git log -1 --oneline`, `supabase migration list --linked`, `supabase functions list --project-ref dqaygmjpzoqjjrywdsxi --output json` y `supabase secrets list --project-ref dqaygmjpzoqjjrywdsxi --output json` (solo nombres).
3. Prohibido: `git reset --hard`, `git checkout -- <file>`, “limpiar” working tree sin aprobación explícita.
4. Cierre por módulo/fase: ejecutar tests (sección 4), actualizar docs mínimas (estado/decisiones/OpenAPI si aplica) y registrar evidencia en el log.

## 1.1) Convenciones (para evitar confusiones)
- Migraciones: `supabase/migrations/YYYYMMDDHHMMSS_<desc>.sql` (timestamp incremental, sin espacios).
- Deploy DB remoto: usar `supabase db push --linked` (no requiere Docker). Evitar `supabase status` / `supabase db dump` si Docker no está disponible.
- Deploy Edge Functions remoto: usar `supabase functions deploy <fn> --use-api`.
- `api-minimarket` debe permanecer con `verify_jwt=false` hasta que se cierre WS4 (ver `docs/DECISION_LOG.md` D-056). Si se redeployea, usar `--no-verify-jwt`.
- Commits: 1 commit por fase o por módulo (mensaje claro + evidencias en el log).

## 2) Estado actual (resumen)
Implementado y verificado (local + remoto):
- Fases 0–6 del plan `docs/PLANIFICACION_DEFINITIVA_MEJORAS_2026-02-07.md`.
- DB remoto alineado + Edge Functions desplegadas (ver `docs/ESTADO_ACTUAL.md`).
- Refresh operativo de MVs de stock: RPC `public.fn_refresh_stock_views()` disponible (migración `20260208010000_*`).

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
- [ ] Crear migración sugerida `supabase/migrations/20260208020000_add_rate_limit_state.sql` con: tabla `rate_limit_state` + RPC atómico `sp_check_rate_limit(p_key text, p_limit int, p_window_seconds int)` + permisos correctos (`SECURITY DEFINER`, `SET search_path = public`, `REVOKE ALL FROM PUBLIC`, `GRANT EXECUTE TO service_role`).
- [ ] Actualizar `supabase/functions/_shared/rate-limit.ts` para usar la RPC si existe; fallback in-memory solo si la RPC responde 404.
- [ ] Actualizar `supabase/functions/api-minimarket/index.ts` para construir key `user:{uid}:ip:{ip}` cuando haya ip; fallback `user:{uid}`; último fallback `ip:{ip}`.
- [ ] En `api-minimarket`, llamar la RPC con headers de `service_role` (no con JWT de usuario), para evitar exposición pública del rate-limit state.
- [ ] Agregar tests unitarios para: claves, headers `RateLimit-*`, `Retry-After`, y fallback cuando la RPC no existe.
- [ ] Deploy DB: `supabase db push --linked`.
- [ ] Deploy Edge: redeploy `api-minimarket` si cambió el gateway (mantener `--no-verify-jwt`).
- [ ] Docs: actualizar `docs/DECISION_LOG.md` y `docs/ESTADO_ACTUAL.md` con evidencia (tests + comportamiento esperado).

**Done**
- Límite consistente cross-instancia (mismo usuario no puede “bypassear” con reintentos/distribución).
- Respuestas 429 incluyen headers `RateLimit-*` y `Retry-After`.

#### A2) Circuit breaker compartido (api-minimarket) o “semi-persistente”
**Problema actual:** breaker es in-memory; si se reinicia una instancia, el breaker se resetea.

**Opción recomendada (mínimo viable, sin sobrediseño):**
- Persistir solo el breaker “crítico” (DB/PostgREST) en Supabase tabla para evitar tormentas.

**Checklist**
- [ ] Crear migración sugerida `supabase/migrations/20260208030000_add_circuit_breaker_state.sql` con: tabla `circuit_breaker_state` + RPC para registrar `success/failure` y calcular transición de estado + lógica de “TTL” (reset si `opened_at` es muy viejo) + permisos (`REVOKE ALL FROM PUBLIC`, `GRANT EXECUTE TO service_role`).
- [ ] Actualizar `supabase/functions/_shared/circuit-breaker.ts` para persistir SOLO el breaker crítico `api-minimarket-db` cuando la RPC exista; fallback in-memory si no existe.
- [ ] En `api-minimarket`, llamar la RPC con headers de `service_role` (no con JWT de usuario).
- [ ] Agregar tests unitarios para transiciones `closed -> open -> half_open -> closed` y para “TTL reset”.
- [ ] Deploy DB: `supabase db push --linked`.
- [ ] Deploy Edge: redeploy `api-minimarket` (mantener `--no-verify-jwt`).
- [ ] Docs: actualizar `docs/DECISION_LOG.md` y `docs/ESTADO_ACTUAL.md`.

**Done**
- Si DB falla repetidamente, el breaker se mantiene abierto aunque cambie la instancia.

#### A3) Auth resiliente (cache + timeout + breaker dedicado)
**Problema actual:** `api-minimarket` valida token llamando `/auth/v1/user` en cada request.

**Checklist**
- [ ] Implementar cache en memoria por token (TTL 30–60s) en `supabase/functions/api-minimarket/helpers/auth.ts` usando key hash (nunca loggear token crudo) + negative-cache de 401 (10–30s).
- [ ] Agregar timeout a `fetchUserInfo()` (AbortController) y error tipificado cuando vence.
- [ ] Agregar breaker dedicado a `/auth/v1/user` para fail-fast (no bloquear toda la request).
- [ ] Tests unitarios: cache hit/miss, negative-cache, timeout, breaker open.
- [ ] Deploy Edge: redeploy `api-minimarket` (mantener `--no-verify-jwt`).
- [ ] Docs: actualizar `docs/ESTADO_ACTUAL.md` con evidencia (comandos y resultados).

**Done**
- En una sesión normal, se reduce drásticamente el número de llamadas a `/auth/v1/user`.
- En caída parcial de Auth, el sistema responde fail-fast con error consistente.

#### A4) Cron jobs y refresh de MVs (verificación operativa)
**Checklist** *(VERIFICADO 2026-02-09 via Supabase Management API)*
- [x] Confirmar en SQL Editor si existen `pg_cron` y `pg_net`. **Resultado: NO instalados.** Extensiones disponibles: `pg_graphql`, `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`. *(query: `select extname from pg_extension`)*
- [N/A] Si `pg_cron` existe: no aplica (pg_cron no instalado).
- [x] Si `pg_cron` NO existe: documentar operacion manual via RPC. **RPC `public.fn_refresh_stock_views()` EXISTE** (confirmado via `pg_proc`). Refresh queda manual: invocar via `service_role` o sincronizar con operaciones (ver migracion `20260208010000`).
- [x] Documentar evidencia en `docs/CHECKLIST_PREFLIGHT_PREMORTEM.md` (seccion "Registro A4: pg_cron y MVs refresh").

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
- [ ] Modal/form mínimo con campos: `nombre` (requerido), `sku`, `categoria_id`, `marca`, `contenido_neto`.
- [ ] Extender `minimarket-system/src/lib/apiClient.ts` agregando `productosApi.create(...)` y, si conviene, `productosApi.update(...)`.
- [ ] Mutación vía gateway y revalidación de listados (React Query).
- [ ] Tests de componentes: render modal + submit OK + error.

**Done**
- Alta de producto completa desde UI (sin usar SQL Editor).

#### B2) Cambio de precio (UI + action)
**Backend ya existe:**
- `POST /precios/aplicar` (admin) para aplicar precio con redondeo,
- `PUT /productos/:id` (admin/deposito) para actualizar `precio_actual/precio_costo/margen_ganancia`.

**Checklist**
- [ ] En `Productos.tsx`: acción “Actualizar precio”.
- [ ] Definir UX: Admin usa `/precios/aplicar` para costo+recalculo; Depósito usa `PUT /productos/:id` solo si el negocio lo permite (si no, ocultar en UI para rol depósito).
- [ ] Extender `productosApi.update(...)` si se usa `PUT /productos/:id` desde UI.
- [ ] Tests de componentes para ambos flujos.

**Done**
- Se puede actualizar precio desde UI con feedback inmediato y rollback si falla.

#### B3) Ajuste de stock (UI)
**Backend ya soporta:** `POST /deposito/movimiento` con `tipo_movimiento='ajuste'`.

**Checklist**
- [ ] `minimarket-system/src/pages/Deposito.tsx`: agregar tipo “Ajuste”.
- [ ] Campos: producto, cantidad, motivo obligatorio (mapear a `motivo`), observaciones opcional.
- [ ] Semántica: `cantidad` es positiva; el signo se resuelve con `tipo_movimiento` si se decide ampliar (si no, documentar).
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
- [ ] Agregar script `scripts/smoke-minimarket-features.mjs` (read-only) que valide: `/search`, `/insights/arbitraje`, `/clientes`, `/cuentas-corrientes/resumen`, `/ofertas/sugeridas`, `/bitacora`.
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
- [ ] Actualizar `docs/ESTADO_ACTUAL.md` (fecha + cambios + evidencia).
- [ ] Actualizar `docs/DECISION_LOG.md` (si hubo decisión nueva).
- [ ] Actualizar `docs/api-openapi-3.1.yaml` y `docs/API_README.md` (si cambia API).
- [ ] Actualizar `docs/closure/EXECUTION_LOG_*.md` (registro auditable).

## 5) Mega planificación (secuencial, recomendada)
1. Fase 0 (preflight y baseline): crear log + registrar estado de git/Supabase + confirmar que el remoto está vinculado al ref `dqaygmjpzoqjjrywdsxi`.
2. Fase 1 (hardening P0): A3 (auth resiliente) y luego A1 (rate limit compartido). Motivo: A3 reduce costo de mover rate limit a un key dependiente de auth.
3. Fase 2 (hardening P1): A2 (breaker semi-persistente), A4 (verificación cron/MVs), A5 (hardening api-proveedor).
4. Fase 3 (UX P1): B1 (alta producto), B2 (cambio precio), B3 (ajuste stock), B4 (acciones desde alertas).
5. Fase 4 (release readiness): C2 (smokes read-only), C1 (observabilidad frontend), C3 (rotación secretos).
6. Fase 5 (opcional): MODULO D (modelo) solo si se confirma necesidad real (lotes/FEFO).

Regla: no empezar la fase siguiente si no cerró checklist de verificación (sección 4) y no quedó evidencia en el log.
